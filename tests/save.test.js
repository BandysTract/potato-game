import test from 'node:test';
import assert from 'node:assert/strict';
import { BOUNDS, CREATURES, FAIRIES, HOME, HOUSE_BOUNDS, HOUSE_CAT, HOUSE_OBSTACLES, HOUSE_TARGETS, OBSTACLES, POTATOES, SONGS, SONG_SITES } from '../src/data.js';
import { PLAYER_RADIUS, answerQuiz, chooseSong, createGame, finishConversation, getGoal, getNearby, startGame, step } from '../src/game.js';
import { QUIZZES, QUIZ_IDS } from '../src/quizzes.js';
import {
  MAX_SAVE_BYTES, SAVE_DB, SAVE_DB_VERSION, SAVE_FORMAT, SAVE_KEY, SAVE_STORE,
  createSaveStore, createSnapshot, decodeRecord, encodeSnapshot, newRevision, restoreGame, validatePayload,
} from '../src/save.js';
import { createFakeIndexedDB } from './fake-indexeddb.js';

const unhandled = [];
process.on('unhandledRejection', reason => unhandled.push(reason));

const idle = { x: 0, y: 0, interact: false };
const prefs = { language: 'en', sound: true, guidance: true };
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const fresh = (language = 'en') => startGame(createGame(language, () => 0));
const ungated = POTATOES.filter(potato => !SONG_SITES.some(site => site.potatoId === potato.id));
const permutations = items => items.length ? items.flatMap((item, i) => permutations(items.filter((_, j) => j !== i)).map(rest => [item, ...rest])) : [[]];

// Movement helpers follow tests/game.test.js: real screen controls, never injected inventory.
function walkTo(game, target) {
  for (let i = 0; i < 1500; i++) {
    const dx = target.x - game.player.x;
    const dz = target.z - game.player.z;
    if (Math.hypot(dx, dz) < 0.12) return;
    const seconds = Math.min(0.05, Math.hypot(dx, dz) / 5);
    step(game, { x: (dx - dz) * Math.SQRT1_2, y: (dx + dz) * Math.SQRT1_2 }, seconds);
  }
  assert.fail(`Could not walk to ${target.id || `${target.x}, ${target.z}`}`);
}

function freeForRoute(game, x, z) {
  const bounds = game.scene === 'house' ? HOUSE_BOUNDS : BOUNDS;
  const obstacles = game.scene === 'house' ? HOUSE_OBSTACLES : OBSTACLES;
  return x >= bounds.minX + .45 && x <= bounds.maxX - .45 && z >= bounds.minZ + .45 && z <= bounds.maxZ - .45
    && obstacles.every(o => Math.hypot(x - o.x, z - o.z) >= o.radius + .5);
}

function visit(game, target) {
  const free = (x, z) => freeForRoute(game, x, z);
  const start = { x: Math.round(game.player.x), z: Math.round(game.player.z) };
  const end = { x: Math.round(target.x), z: Math.round(target.z) };
  walkTo(game, start);
  const key = point => `${point.x},${point.z}`;
  const queue = [start], parents = new Map([[key(start), null]]);
  let found;
  for (let i = 0; i < queue.length; i++) {
    const point = queue[i];
    if (key(point) === key(end)) { found = point; break; }
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const next = { x: point.x + dx, z: point.z + dz };
      if (!parents.has(key(next)) && free(next.x, next.z) && free(point.x + dx / 2, point.z + dz / 2)) {
        parents.set(key(next), point); queue.push(next);
      }
    }
  }
  assert.ok(found, `${target.id ?? key(end)} must have a walking route.`);
  const route = [];
  for (let point = found; point; point = parents.get(key(point))) route.push(point);
  for (const point of route.reverse()) walkTo(game, point);
  if (distance(game.player, target) > .12) walkTo(game, target);
}

function press(game) {
  step(game, idle, .05);
  step(game, { ...idle, interact: true }, .05);
}

function collect(game, potato) {
  visit(game, potato);
  press(game);
  assert.equal(game.actionAnimation?.targetId, potato.id);
  step(game, idle, game.actionAnimation.duration + .01);
  assert.ok(game.potatoes.includes(potato.id));
}

function sing(game, fairy) {
  visit(game, fairy);
  press(game);
  assert.equal(game.activeSong?.kind, 'learn');
  step(game, idle, game.activeSong.duration + .01);
  assert.ok(game.tears.includes(fairy.id));
}

function restore(game, site) {
  visit(game, site);
  press(game);
  assert.equal(game.songSite, site.id);
  assert.equal(chooseSong(game, site.songId), true);
  step(game, idle, game.activeSong.duration + .01);
  assert.ok(game.restoredSites.includes(site.id), `${site.id} should be restored`);
}

function answer(game, creature, correct = true) {
  visit(game, creature);
  press(game);
  assert.equal(game.conversation, creature.id);
  const quiz = QUIZZES[creature.id][game.conversationIndex];
  const option = correct ? quiz.correctOptionId : quiz.options.find(item => item.id !== quiz.correctOptionId).id;
  assert.equal(answerQuiz(game, option, quiz.id), true);
  finishConversation(game);
  assert.ok(game.quizCompleted.includes(quiz.id));
}

function enterHouse(game) {
  visit(game, HOME);
  press(game);
  assert.equal(game.scene, 'house');
}

function forestToHouse(language = 'en') {
  const game = fresh(language);
  for (const fairy of FAIRIES) sing(game, fairy);
  for (const site of SONG_SITES) {
    restore(game, site);
    if (site.potatoId) collect(game, POTATOES.find(p => p.id === site.potatoId));
  }
  for (const potato of ungated) collect(game, potato);
  enterHouse(game);
  return game;
}

let cachedHouse = null;
const houseGame = () => structuredClone(cachedHouse ??= forestToHouse());

const progressOf = game => ({
  phase: game.phase === 'intro' ? 'playing' : game.phase,
  scene: game.scene,
  language: game.language,
  player: { x: game.player.x, z: game.player.z, facing: game.player.facing, direction: game.player.direction },
  potatoes: game.potatoes, tears: game.tears, learnedSongs: game.learnedSongs, restoredSites: game.restoredSites,
  gardenWatered: game.gardenWatered, houseStep: game.houseStep, dialogueNext: game.dialogueNext,
  quizCompleted: game.quizCompleted, talked: game.talked, percyPets: game.percyPets,
});

let revisionCount = 0;
// Snapshot, encode, decode, validate, and restore. The restored game replaces the original from here on.
function roundTrip(game, preferences = { language: game.language, sound: revisionCount % 2 === 0, guidance: revisionCount % 3 !== 0 }) {
  const snapshot = createSnapshot(game, preferences, `rev-${revisionCount++}`);
  assert.equal(validatePayload(snapshot), true);
  const decoded = decodeRecord(encodeSnapshot(snapshot));
  assert.equal(decoded.status, 'valid');
  assert.deepEqual(decoded.payload.preferences, preferences);
  const restored = restoreGame(decoded.payload, createGame);
  assert.deepEqual(progressOf(restored), progressOf(game));
  assert.deepEqual(getGoal(restored), getGoal(game));
  assert.deepEqual(getNearby(restored), getNearby(game));
  for (const field of ['activeSong', 'songSite', 'actionAnimation', 'conversation', 'conversationIndex', 'quizSession', 'ending']) assert.equal(restored[field], null);
  assert.equal(restored.message, '');
  return restored;
}

const clone = value => structuredClone(value);
const forestPayload = (game = fresh()) => createSnapshot(game, prefs, 'base');
const allSongs = { learnedSongs: SONGS.map(s => s.id), tears: SONGS.map(s => s.fairyId) };
function edited(base, change) { const payload = clone(base); change(payload); return payload; }

// ---------- Snapshots and validation ----------

test('a snapshot copies only the version-1 fields and none of the live walk state', () => {
  const game = fresh('cs');
  collect(game, POTATOES[0]);
  game.activeSong = { kind: 'learn' }; game.quizSession = { quizId: 'fox-monty', answerId: null };
  game.message = 'Saved?'; game.conversation = 'fox'; game.actionAnimation = { kind: 'gather' }; game.ending = 'goddess';
  const snapshot = createSnapshot(game, { language: 'cs', sound: false, guidance: true, extra: 1 }, 'r1');
  assert.deepEqual(Object.keys(snapshot), ['format', 'revision', 'checkpoint', 'player', 'potatoes', 'tears', 'learnedSongs', 'restoredSites',
    'houseStep', 'dialogueNext', 'quizCompleted', 'talked', 'percyPets', 'preferences']);
  assert.equal(snapshot.format, SAVE_FORMAT);
  assert.equal(snapshot.checkpoint, 'forest');
  assert.deepEqual(Object.keys(snapshot.player), ['x', 'z', 'facing', 'direction']);
  assert.deepEqual(snapshot.preferences, { language: 'cs', sound: false, guidance: true });
  for (const key of ['potatoes', 'tears', 'learnedSongs', 'restoredSites', 'quizCompleted', 'talked']) assert.notEqual(snapshot[key], game[key]);
  assert.notEqual(snapshot.dialogueNext, game.dialogueNext);
  game.potatoes.push('potato-2');
  assert.deepEqual(snapshot.potatoes, ['potato-1']);
  assert.doesNotMatch(encodeSnapshot(snapshot), /Saved\?|goddess|answerId|gather/);
  assert.equal(validatePayload(snapshot), true);
  assert.deepEqual([SAVE_DB, SAVE_DB_VERSION, SAVE_STORE, SAVE_KEY, MAX_SAVE_BYTES], ['pec-adventure', 1, 'walks', 'current', 65536]);
});

test('encoding enforces the UTF-8 byte ceiling exactly', () => {
  const base = forestPayload();
  const length = Buffer.byteLength(encodeSnapshot({ ...base, revision: '' }));
  const atLimit = { ...base, revision: 'a'.repeat(MAX_SAVE_BYTES - length) };
  assert.equal(Buffer.byteLength(encodeSnapshot(atLimit)), MAX_SAVE_BYTES);
  assert.throws(() => encodeSnapshot({ ...base, revision: 'a'.repeat(MAX_SAVE_BYTES - length + 1) }), RangeError);
  // Two bytes per character: fewer characters than the limit, more bytes.
  const wide = { ...base, revision: 'ž'.repeat(Math.ceil((MAX_SAVE_BYTES - length) / 2) + 1) };
  assert.ok(JSON.stringify(wide).length < MAX_SAVE_BYTES);
  assert.throws(() => encodeSnapshot(wide), RangeError);
  assert.equal(decodeRecord(JSON.stringify(wide)).status, 'invalid');
  assert.equal(decodeRecord(encodeSnapshot(atLimit)).status, 'valid');
});

test('revisions are short, unique tokens, with a fallback when crypto is missing', () => {
  const tokens = new Set(Array.from({ length: 2000 }, () => newRevision()));
  assert.equal(tokens.size, 2000);
  for (const token of tokens) assert.match(token, /^[0-9a-f]{18}$/);
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, 'crypto');
  Object.defineProperty(globalThis, 'crypto', { value: undefined, configurable: true, writable: true });
  try {
    assert.equal(newRevision(() => 0.5), '80'.repeat(9));
    assert.notEqual(newRevision(), newRevision());
  } finally {
    Object.defineProperty(globalThis, 'crypto', descriptor);
  }
});

test('decoding separates empty, unsupported, invalid, and valid records', () => {
  const raw = encodeSnapshot(forestPayload());
  assert.deepEqual(decodeRecord(undefined), { status: 'empty' });
  for (const value of [null, 0, 42, true, {}, [], { raw }, new Uint8Array(3)]) assert.deepEqual(decodeRecord(value), { status: 'unsupported' });
  for (const value of ['', 'not json', '{', 'null', '[]', '"text"', JSON.stringify({ ...forestPayload(), format: 2 }),
    JSON.stringify({ ...forestPayload(), format: '1' }), JSON.stringify({ format: 1 }), raw.slice(0, -1)]) {
    assert.deepEqual(decodeRecord(value), { status: 'invalid', raw: value });
  }
  const decoded = decodeRecord(raw);
  assert.equal(decoded.status, 'valid');
  assert.equal(decoded.raw, raw);
  assert.deepEqual(decoded.payload, JSON.parse(raw));
});

test('every field rule rejects malformed values', () => {
  const base = forestPayload();
  const cases = {
    'not an object': () => null,
    'an array': () => [],
    'an extra field': p => { p.message = 'hi'; },
    'a missing field': p => { delete p.talked; },
    'an unknown format': p => { p.format = 2; },
    'an empty revision': p => { p.revision = ''; },
    'a numeric revision': p => { p.revision = 7; },
    'an unknown checkpoint': p => { p.checkpoint = 'title'; },
    'a missing player': p => { delete p.player; },
    'an extra player field': p => { p.player.moving = false; },
    'a NaN x': p => { p.player.x = NaN; },
    'an infinite z': p => { p.player.z = Infinity; },
    'a string x': p => { p.player.x = '0'; },
    'a zero facing': p => { p.player.facing = 0; },
    'a facing of 2': p => { p.player.facing = 2; },
    'direction 4': p => { p.player.direction = 4; },
    'direction -1': p => { p.player.direction = -1; },
    'a fractional direction': p => { p.player.direction = 1.5; },
    'an unknown potato': p => { p.potatoes = ['potato-7']; },
    'a duplicate potato': p => { p.potatoes = ['potato-1', 'potato-1']; },
    'potatoes as text': p => { p.potatoes = 'potato-1'; },
    'a sparse list': p => { p.potatoes = [, 'potato-1']; },
    'a non-string id': p => { p.potatoes = [1]; },
    'an unknown tear': p => { p.tears = ['fairy-moon']; p.learnedSongs = []; },
    'a duplicate tear and song': p => { p.tears = ['fairy-birch', 'fairy-birch']; p.learnedSongs = ['woodland']; },
    'an unknown song': p => { p.learnedSongs = ['lullaby']; },
    'an unknown site': p => { p.restoredSites = ['orchard']; },
    'a duplicate site': p => { Object.assign(p, allSongs); p.restoredSites = ['woodland', 'woodland']; },
    'an unknown quiz': p => { p.quizCompleted = ['fox-unknown']; p.talked = ['fox']; },
    'a duplicate quiz': p => { p.quizCompleted = ['fox-monty', 'fox-monty']; p.talked = ['fox']; },
    'an unknown animal': p => { p.talked = ['bear']; },
    'a duplicate animal': p => { p.quizCompleted = ['fox-monty']; p.talked = ['fox', 'fox']; },
    'houseStep 5': p => { p.houseStep = 5; },
    'houseStep -1': p => { p.houseStep = -1; },
    'a fractional houseStep': p => { p.houseStep = 0.5; },
    'a text houseStep': p => { p.houseStep = '0'; },
    'a missing animal rotation': p => { delete p.dialogueNext.badger; },
    'an extra animal rotation': p => { p.dialogueNext.bear = 0; },
    'rotation 3': p => { p.dialogueNext.fox = 3; },
    'rotation -1': p => { p.dialogueNext.owl = -1; },
    'a fractional rotation': p => { p.dialogueNext.deer = 1.5; },
    'negative pets': p => { p.percyPets = -1; },
    'fractional pets': p => { p.percyPets = 1.5; },
    'unsafe pets': p => { p.percyPets = Number.MAX_SAFE_INTEGER + 1; },
    'text pets': p => { p.percyPets = '3'; },
    'an unknown language': p => { p.preferences.language = 'de'; },
    'text sound': p => { p.preferences.sound = 'yes'; },
    'numeric guidance': p => { p.preferences.guidance = 1; },
    'an extra preference': p => { p.preferences.motion = true; },
  };
  for (const [label, change] of Object.entries(cases)) {
    const payload = change.length ? edited(base, change) : change();
    assert.equal(typeof validatePayload(payload), 'string', `${label} must be rejected`);
    if (payload && typeof payload === 'object') {
      const json = JSON.stringify(payload);
      assert.equal(decodeRecord(json).status, validatePayload(JSON.parse(json)) === true ? 'valid' : 'invalid', label);
    }
  }
  assert.equal(validatePayload(edited(base, p => { p.percyPets = Number.MAX_SAFE_INTEGER; })), true);
  assert.equal(validatePayload(edited(base, p => { p.dialogueNext = { badger: 2, deer: 0, owl: 1, fox: 2 }; })), true);
  assert.equal(validatePayload(edited(base, p => { p.player.facing = -1; p.player.direction = 3; p.preferences = { language: 'cs', sound: false, guidance: false }; })), true);
});

test('cross-field rules mirror the model gates rather than the guidance', () => {
  const base = forestPayload();
  const reject = (label, change) => assert.equal(typeof validatePayload(edited(base, change)), 'string', `${label} must be rejected`);
  const accept = (label, change) => assert.equal(validatePayload(edited(base, change)), true, `${label} must be accepted`);
  reject('a tear without its song', p => { p.tears = ['fairy-birch']; });
  reject('a song without its tear', p => { p.learnedSongs = ['woodland']; });
  reject('a mismatched tear and song', p => { p.tears = ['fairy-birch']; p.learnedSongs = ['growth']; });
  accept('a matched tear and song', p => { p.tears = ['fairy-ridge']; p.learnedSongs = ['growth']; });
  reject('a woodland potato before its garden', p => { Object.assign(p, allSongs); p.potatoes = ['potato-4']; });
  reject('a meadow potato before its garden', p => { Object.assign(p, allSongs); p.restoredSites = ['woodland']; p.potatoes = ['potato-5']; });
  accept('an ungated potato before any garden', p => { p.potatoes = ['potato-1', 'potato-2', 'potato-3', 'potato-6']; });
  reject('a woodland garden without its song', p => { p.learnedSongs = ['growth']; p.tears = ['fairy-ridge']; p.restoredSites = ['woodland']; });
  reject('a meadow garden without its song', p => { p.learnedSongs = ['woodland']; p.tears = ['fairy-birch']; p.restoredSites = ['meadow']; });
  accept('a woodland garden with no potatoes', p => { p.learnedSongs = ['woodland']; p.tears = ['fairy-birch']; p.restoredSites = ['woodland']; });
  reject('a cottage garden without the rain song', p => { p.learnedSongs = ['woodland', 'growth']; p.tears = ['fairy-birch', 'fairy-ridge']; p.restoredSites = ['cottage']; });
  reject('a cottage garden with two tears', p => { p.learnedSongs = ['rain', 'growth']; p.tears = ['fairy-stream', 'fairy-ridge']; p.restoredSites = ['cottage']; });
  accept('a cottage garden first, with no potatoes', p => { Object.assign(p, allSongs); p.restoredSites = ['cottage']; });
  accept('a cottage garden before the sixth potato', p => { Object.assign(p, allSongs); p.restoredSites = ['cottage', 'woodland']; p.potatoes = ['potato-1', 'potato-4']; });
  const complete = p => { Object.assign(p, allSongs); p.restoredSites = ['cottage', 'meadow', 'woodland']; p.potatoes = POTATOES.map(x => x.id).reverse(); };
  accept('every gift in the forest', complete);
  for (const checkpoint of ['house', 'supper']) {
    const at = checkpoint === 'house' ? { x: 0, z: 5 } : { x: 5, z: -5 };
    const ready = p => { complete(p); p.checkpoint = checkpoint; p.player.x = at.x; p.player.z = at.z; p.houseStep = checkpoint === 'supper' ? 4 : 0; };
    accept(`${checkpoint} with every gift`, ready);
    reject(`${checkpoint} with five potatoes`, p => { ready(p); p.potatoes.pop(); });
    reject(`${checkpoint} with two tears`, p => { ready(p); p.restoredSites = ['woodland', 'meadow']; p.tears = ['fairy-birch', 'fairy-ridge']; p.learnedSongs = ['woodland', 'growth']; p.potatoes = POTATOES.map(x => x.id); });
    reject(`${checkpoint} with two gardens`, p => { ready(p); p.restoredSites = ['cottage', 'woodland']; p.potatoes = POTATOES.map(x => x.id).filter(id => id !== 'potato-5'); });
  }
  reject('household progress in the forest', p => { complete(p); p.houseStep = 1; });
  accept('houseStep 4 inside before serving', p => { complete(p); p.checkpoint = 'house'; p.player.x = 0; p.player.z = 5; p.houseStep = 4; });
  reject('supper before the last household step', p => { complete(p); p.checkpoint = 'supper'; p.houseStep = 3; });
});

test('talked must name exactly the animals with completed quizzes', () => {
  const base = forestPayload();
  const verdict = change => validatePayload(edited(base, change));
  assert.equal(verdict(p => { p.quizCompleted = ['owl-reverse', 'fox-monty', 'fox-two-coins']; p.talked = ['fox', 'owl']; }), true);
  assert.equal(verdict(p => { p.quizCompleted = ['owl-reverse', 'fox-monty', 'fox-two-coins']; p.talked = ['owl', 'fox']; }), true, 'Order does not matter.');
  assert.equal(verdict(p => { p.quizCompleted = [...QUIZ_IDS]; p.talked = ['badger', 'deer', 'owl', 'fox']; }), true);
  assert.equal(typeof verdict(p => { p.talked = ['fox']; }), 'string', 'A visit without a finalized quiz is not model state.');
  assert.equal(typeof verdict(p => { p.quizCompleted = ['owl-cards']; }), 'string');
  assert.equal(typeof verdict(p => { p.quizCompleted = ['owl-cards', 'fox-monty']; p.talked = ['owl']; }), 'string');
  assert.equal(typeof verdict(p => { p.quizCompleted = ['owl-cards']; p.talked = ['owl', 'deer']; }), 'string');
  // The real model keeps the two lists in agreement through repeated and wrong answers.
  const game = fresh();
  answer(game, CREATURES[0], false);
  answer(game, CREATURES[0], true);
  answer(game, CREATURES[3], false);
  assert.equal(game.quizCompleted.length, 3);
  assert.deepEqual(game.talked, ['fox', 'badger']);
  const restored = roundTrip(game);
  assert.deepEqual(restored.dialogueNext, game.dialogueNext);
});

test('an early cottage restoration reached by the model is accepted with no potatoes', () => {
  const game = fresh();
  for (const fairy of [FAIRIES[2], FAIRIES[0], FAIRIES[1]]) sing(game, fairy);
  restore(game, SONG_SITES.find(site => site.id === 'cottage'));
  assert.deepEqual(game.restoredSites, ['cottage']);
  assert.deepEqual(game.potatoes, []);
  assert.equal(game.gardenWatered, true);
  const snapshot = createSnapshot(game, prefs, 'early');
  assert.equal(validatePayload(snapshot), true);
  assert.equal(decodeRecord(encodeSnapshot(snapshot)).status, 'valid');
  const restored = roundTrip(game);
  assert.equal(restored.gardenWatered, true);
  restore(restored, SONG_SITES[0]);
  collect(restored, POTATOES[3]);
  assert.equal(roundTrip(restored).potatoes.length, 1);
});

test('positions must be inside the player-adjusted bounds and outside obstacles', () => {
  const base = forestPayload();
  const at = (x, z, payload = base) => validatePayload(edited(payload, p => { p.player.x = x; p.player.z = z; }));
  const r = PLAYER_RADIUS;
  assert.equal(at(BOUNDS.minX + r, BOUNDS.minZ + r), true);
  assert.equal(at(BOUNDS.maxX - r, BOUNDS.maxZ - r), true);
  for (const [x, z] of [[BOUNDS.maxX - r + 1e-6, 0], [BOUNDS.minX + r - 1e-6, 0], [0, BOUNDS.maxZ - r + 1e-6], [0, BOUNDS.minZ + r - 1e-6], [100, 0]]) {
    assert.equal(at(x, z), 'blocked position', `${x}, ${z} is out of bounds`);
  }
  for (const obstacle of OBSTACLES) {
    const edge = obstacle.radius + r;
    assert.equal(at(obstacle.x + edge, obstacle.z), true, 'Exactly on the edge is clear.');
    assert.equal(at(obstacle.x - edge + 5e-10, obstacle.z), true, 'A rounding error inside the edge is clear.');
    assert.equal(at(obstacle.x, obstacle.z - (edge - 1e-6)), 'blocked position', 'Meaningfully embedded is blocked.');
    assert.equal(at(obstacle.x, obstacle.z), 'blocked position');
  }
  const house = createSnapshot(houseGame(), prefs, 'house');
  assert.equal(validatePayload(house), true);
  assert.equal(at(HOUSE_BOUNDS.maxX - r + 1e-6, 0, house), 'blocked position');
  assert.equal(at(20, 0, house), 'blocked position', 'A forest coordinate is outside the house.');
  for (const obstacle of HOUSE_OBSTACLES) {
    const edge = obstacle.radius + r;
    assert.equal(at(obstacle.x, obstacle.z + edge, house), true);
    assert.equal(at(obstacle.x, obstacle.z + edge - 1e-6, house), 'blocked position');
  }
});

// Push into an obstacle through the real controls, then slide along its edge.
function pushAround(game, obstacle, turn) {
  const gaps = [];
  for (let frame = 0; frame < 40; frame++) {
    const dx = obstacle.x - game.player.x, dz = obstacle.z - game.player.z;
    const angle = Math.atan2(dz, dx) + (frame < 16 ? 0 : turn);
    const wx = Math.cos(angle), wz = Math.sin(angle);
    step(game, { x: (wx - wz) * Math.SQRT1_2, y: (wx + wz) * Math.SQRT1_2 }, .05);
    const gap = distance(game.player, obstacle) - obstacle.radius - PLAYER_RADIUS;
    gaps.push(gap);
    if (gap < .01) assert.equal(validatePayload(createSnapshot(game, prefs, 'edge')), true, `Edge of ${obstacle.type ?? obstacle.id} at gap ${gap}`);
  }
  return gaps;
}

test('movement-produced edges of trees, the rock, and the cottage validate', () => {
  const gaps = [];
  for (const obstacle of OBSTACLES) {
    for (let k = 0; k < 8; k++) {
      const angle = k * Math.PI / 4;
      const approach = { x: obstacle.x + Math.cos(angle) * (obstacle.radius + 2), z: obstacle.z + Math.sin(angle) * (obstacle.radius + 2) };
      const game = fresh();
      if (!freeForRoute(game, Math.round(approach.x), Math.round(approach.z)) || !freeForRoute(game, approach.x, approach.z)) continue;
      visit(game, approach);
      gaps.push(...pushAround(game, obstacle, k % 2 ? 1 : -1));
    }
  }
  // The cottage meets the north map edge. This route ends on both the edge and the clamp.
  for (const side of [1, -1]) {
    const game = fresh();
    for (const [count, input] of [[24, { x: side, y: side }], [60, { x: -1, y: 1 }], [40, { x: -side, y: -side }]]) {
      for (let i = 0; i < count; i++) step(game, input, .05);
    }
    const cottage = OBSTACLES.find(({ type }) => type === 'cottage');
    gaps.push(distance(game.player, cottage) - cottage.radius - PLAYER_RADIUS);
    assert.equal(game.player.z, BOUNDS.maxZ - PLAYER_RADIUS);
    assert.equal(validatePayload(createSnapshot(game, prefs, 'corner')), true);
  }
  assert.ok(gaps.filter(gap => gap < 1e-6).length > 20, 'The routes must end on obstacle edges.');
  assert.ok(gaps.some(gap => gap < 0), 'Some real edge positions land a rounding error inside the exact radius.');
  assert.ok(Math.min(...gaps) >= -1e-9, `Movement never embeds Hana beyond the tolerance (${Math.min(...gaps)}).`);
});

test('movement-produced edges of the cot, worktop, stove, and table validate', () => {
  const approaches = { cot: [[6, 1], [3, -2], [9, -2]], worktop: [[-6, -4], [-3, -6], [-9, -6]], stove: [[0, -4], [3, -6]], table: [[5, -4], [8, -6]] };
  const gaps = [];
  for (const obstacle of HOUSE_OBSTACLES) {
    for (const [index, [x, z]] of approaches[obstacle.id].entries()) {
      const game = houseGame();
      visit(game, { x, z });
      gaps.push(...pushAround(game, obstacle, index % 2 ? 1 : -1));
    }
  }
  const corner = houseGame();
  for (let i = 0; i < 80; i++) step(corner, { x: 1, y: 1 }, .05);
  assert.equal(validatePayload(createSnapshot(corner, prefs, 'wall')), true);
  assert.ok(gaps.filter(gap => gap < 1e-6).length > 10);
  assert.ok(Math.min(...gaps) >= -1e-9);
});

test('a saturated Percy count saves and restores', () => {
  const game = houseGame();
  game.percyPets = Number.MAX_SAFE_INTEGER - 1;
  for (let pet = 0; pet < 2; pet++) {
    visit(game, HOUSE_CAT);
    press(game);
    assert.equal(game.actionAnimation?.kind, 'pet');
    step(game, idle, 1.2);
  }
  assert.equal(game.percyPets, Number.MAX_SAFE_INTEGER);
  const raw = encodeSnapshot(createSnapshot(game, prefs, 'pets'));
  assert.match(raw, /"percyPets":9007199254740991/);
  assert.equal(roundTrip(game).percyPets, Number.MAX_SAFE_INTEGER);
});

test('every fairy and restoration order round-trips at each completed step, including the household', () => {
  let journeys = 0;
  for (const [fairyIndex, fairies] of permutations(FAIRIES).entries()) for (const [siteIndex, sites] of permutations(SONG_SITES).entries()) {
    const index = fairyIndex * 6 + siteIndex;
    const language = index % 2 ? 'cs' : 'en';
    let game = roundTrip(startGame(createGame(language, () => (index % 3 + .5) / 3)));
    answer(game, CREATURES[index % 4], index % 3 !== 0);
    game = roundTrip(game);
    for (const fairy of fairies) { sing(game, fairy); game = roundTrip(game); }
    for (const site of sites) {
      if (site === sites[0]) assert.equal(game.potatoes.length, 0, 'The first restoration, cottage included, comes before any potato.');
      restore(game, site);
      game = roundTrip(game);
      if (site.potatoId) { collect(game, POTATOES.find(p => p.id === site.potatoId)); game = roundTrip(game); }
    }
    for (const potato of ungated) { collect(game, potato); game = roundTrip(game); }
    enterHouse(game);
    game = roundTrip(game);
    if (index % 4 === 0) {
      visit(game, HOUSE_CAT); press(game); step(game, idle, 1.2);
      assert.equal(game.percyPets, 1);
      game = roundTrip(game);
    }
    for (const [householdIndex, target] of HOUSE_TARGETS.entries()) {
      visit(game, target);
      press(game);
      if (householdIndex < 2) { assert.equal(game.conversation, target.id); finishConversation(game); }
      else { assert.equal(game.actionAnimation?.kind, target.id); step(game, idle, game.actionAnimation.duration + .01); }
      assert.equal(game.houseStep, Math.min(4, householdIndex + 1));
      game = roundTrip(game);
    }
    assert.equal(game.phase, 'won');
    assert.equal(createSnapshot(game, prefs, 'x').checkpoint, 'supper');
    assert.deepEqual({ x: game.player.x, z: game.player.z }, { x: HOUSE_TARGETS[4].x, z: HOUSE_TARGETS[4].z });
    assert.equal(game.potatoes.length, 6, 'Restored walks never repeat a reward.');
    assert.equal(game.quizCompleted.length, 1);
    journeys += 1;
  }
  assert.equal(journeys, 36);
});

test('interleaved learning and restoration round-trips, with the cottage before the meadow', () => {
  let game = fresh('cs');
  for (const action of [
    () => sing(game, FAIRIES[0]), () => restore(game, SONG_SITES[0]), () => collect(game, POTATOES[3]),
    () => sing(game, FAIRIES[2]), () => sing(game, FAIRIES[1]), () => restore(game, SONG_SITES[2]),
    () => collect(game, POTATOES[0]), () => restore(game, SONG_SITES[1]), () => collect(game, POTATOES[4]),
  ]) { action(); game = roundTrip(game); }
  assert.deepEqual(game.restoredSites, ['woodland', 'cottage', 'meadow']);
});

test('supper restores at the current serving spot and ignores the saved position', () => {
  const game = houseGame();
  for (const [index, target] of HOUSE_TARGETS.entries()) {
    visit(game, target); press(game);
    if (index < 2) finishConversation(game); else step(game, idle, game.actionAnimation.duration + .01);
  }
  assert.equal(game.phase, 'won');
  const payload = edited(createSnapshot(game, prefs, 'supper'), p => { p.player.x = -9.4; p.player.z = 7.4; p.player.facing = -1; });
  assert.equal(validatePayload(payload), true);
  const restored = restoreGame(payload, createGame);
  assert.equal(restored.phase, 'won');
  assert.equal(restored.ending, null);
  assert.equal(restored.scene, 'house');
  const serve = HOUSE_TARGETS.find(target => target.id === 'serve');
  assert.deepEqual(restored.player, { x: serve.x, z: serve.z, facing: -1, direction: game.player.direction, moving: false });
  assert.throws(() => restoreGame(edited(payload, p => { p.houseStep = 3; }), createGame), TypeError);
  assert.throws(() => restoreGame({}, createGame), TypeError);
});

// ---------- Storage coordinator ----------

const variant = (overrides = {}, game = fresh()) => createSnapshot(game, { ...prefs, ...overrides }, null);
const seedRaw = (overrides = {}, revision = 'seed') => encodeSnapshot(createSnapshot(fresh(), { ...prefs, ...overrides }, revision));
const prefsOf = raw => JSON.parse(raw).preferences;

function seededFake(value) {
  const fake = createFakeIndexedDB();
  fake.seed(SAVE_DB, { stores: { walks: value === undefined ? {} : { current: value } } });
  return fake;
}

function makeStore(fake, options = {}) {
  let changes = 0;
  const store = createSaveStore({ indexedDB: fake?.indexedDB ?? null, onChange: () => { changes += 1; }, ...options });
  return { store, changes: () => changes };
}

async function started(fake) {
  const handle = makeStore(fake);
  await handle.store.start();
  await fake.idle();
  return handle;
}

async function continued(fake, raw) {
  const handle = await started(fake);
  assert.equal(handle.store.state.slot.status, 'valid');
  assert.equal(handle.store.setMode('normal', raw), true);
  return handle;
}

const pendingFlag = (promise) => {
  const box = { done: false, value: undefined };
  promise.then(value => { box.done = true; box.value = value; });
  return box;
};

test('missing or unusable IndexedDB settles unavailable without throwing', async () => {
  const options = [{ indexedDB: null }, { indexedDB: {} }, { indexedDB: { open: 5 } }, {}];
  for (const option of options) {
    const store = createSaveStore(option);
    assert.equal(store.state.read, 'idle');
    await store.start();
    assert.deepEqual({ ...store.state, slot: undefined }, {
      read: 'settled', available: false, reason: 'failed', failure: 'unsupported-api', conflict: false, slot: undefined,
      knownCommitted: null, mode: 'unclaimed', session: 0, saved: false, busy: false,
    });
    assert.deepEqual(store.state.slot, { status: 'unknown' });
    assert.equal(store.checkpoint(variant()), false);
    assert.deepEqual(await store.prepareReplacement(), { status: 'unavailable' });
    assert.equal(await store.replace({ status: 'empty' }, variant()), 'failed');
    assert.equal(await store.settle(), false);
  }
  const throwing = {};
  Object.defineProperty(throwing, 'indexedDB', { get() { throw new Error('denied'); } });
  const store = createSaveStore(throwing);
  await store.start();
  assert.equal(store.state.failure, 'exception');
  const brokenOpen = createSaveStore({ indexedDB: { open() { throw new DOMException('no', 'SecurityError'); } } });
  await brokenOpen.start();
  assert.equal(brokenOpen.state.failure, 'exception');
  assert.notEqual(store.state, store.state, 'Each read is a fresh object.');
});

test('open errors, newer databases, a missing store, and blocking settle unavailable and keep data', async () => {
  const failing = createFakeIndexedDB();
  failing.failNextOpen('UnknownError');
  assert.equal((await started(failing)).store.state.failure, 'open');

  const raw = seedRaw();
  const newer = createFakeIndexedDB();
  newer.seed(SAVE_DB, { version: 2, stores: { walks: { current: raw } } });
  const { store: newerStore } = await started(newer);
  assert.equal(newerStore.state.failure, 'version');
  assert.equal(newerStore.state.read, 'settled');
  assert.equal(newer.database().version, 2);
  assert.equal(newer.value(), raw);

  const storeless = createFakeIndexedDB();
  storeless.seed(SAVE_DB, { version: 1, stores: {} });
  const { store: storelessStore } = await started(storeless);
  assert.equal(storelessStore.state.failure, 'open');
  assert.equal(storeless.count('createObjectStore'), 0);
  assert.equal(storeless.count('transaction'), 0);

  const throwing = createFakeIndexedDB();
  throwing.throwNext('open', 'SecurityError');
  assert.equal((await started(throwing)).store.state.failure, 'exception');

  const blocked = seededFake(raw);
  const gate = blocked.holdNextOpen({ blocked: true });
  const { store, changes } = makeStore(blocked);
  const startPromise = store.start();
  await blocked.idle();
  assert.equal(store.state.read, 'settled');
  assert.equal(store.state.failure, 'blocked');
  await startPromise;
  const before = [store.state, changes()];
  gate.release();
  await blocked.idle();
  assert.deepEqual([store.state, changes()], before, 'A late connection after blocking is ignored.');
  assert.ok(blocked.allConnections().every(connection => connection.closed));
  assert.equal(blocked.count('transaction'), 0);
  assert.equal(blocked.value(), raw);
  for (const fake of [failing, newer, storeless, throwing, blocked]) assert.equal(fake.count('deleteDatabase'), 0);
});

test('a first visit creates the walks store only in its version-0 upgrade', async () => {
  const fake = createFakeIndexedDB();
  const { store } = await started(fake);
  assert.equal(store.state.available, true);
  assert.deepEqual(store.state.slot, { status: 'empty' });
  assert.equal(store.state.knownCommitted, null);
  assert.deepEqual(fake.log.filter(entry => entry.op === 'upgrade').map(entry => entry.oldVersion), [0]);
  assert.equal(fake.count('createObjectStore', { name: SAVE_STORE }), 1);
  assert.equal(fake.database().version, SAVE_DB_VERSION);
  await started(fake);
  assert.equal(fake.count('upgrade'), 1);
  assert.equal(fake.count('createObjectStore'), 1);
});

test('the title read reports every slot kind and never writes', async () => {
  const raw = seedRaw();
  const big = JSON.stringify({ ...JSON.parse(raw), revision: 'x'.repeat(MAX_SAVE_BYTES) });
  for (const [value, status] of [[raw, 'valid'], ['not json', 'invalid'], [big, 'invalid'], [JSON.stringify({ ...JSON.parse(raw), format: 9 }), 'invalid'],
    [{ walk: raw }, 'unsupported'], [42, 'unsupported'], [null, 'unsupported'], [undefined, 'empty']]) {
    const fake = seededFake(value);
    const { store, changes } = makeStore(fake);
    const startPromise = store.start();
    assert.equal(store.state.read, 'pending');
    assert.equal(store.start(), startPromise, 'start is idempotent');
    await startPromise;
    await fake.idle();
    assert.equal(store.state.read, 'settled');
    assert.equal(store.state.slot.status, status);
    assert.equal(store.state.knownCommitted, status === 'valid' ? raw : null);
    if (status === 'valid' || status === 'invalid') assert.equal(store.state.slot.raw, value);
    if (status === 'valid') assert.ok(Object.isFrozen(store.state.slot.payload));
    assert.ok(changes() >= 2);
    assert.equal(store.checkpoint(variant({ language: 'cs' })), false, 'An unclaimed title cannot write.');
    store.start();
    await fake.idle();
    assert.equal(fake.count('transaction', { mode: 'readwrite' }), 0);
    assert.equal(fake.count('put'), 0);
    assert.deepEqual(fake.value(), value);
    assert.equal(store.state.conflict, false);
  }
});

test('study, unsaved, and unclaimed sessions never write', async () => {
  const raw = seedRaw();
  for (const mode of ['study', 'unsaved', 'unclaimed']) {
    const fake = seededFake(raw);
    const { store } = await started(fake);
    assert.equal(store.setMode(mode), true);
    assert.equal(store.state.mode, mode);
    assert.equal(store.state.saved, false);
    assert.equal(store.checkpoint(variant({ sound: false })), false);
    // Leaving a normal session for this mode also removes its authority.
    store.setMode('normal', raw);
    store.setMode(mode);
    assert.equal(store.checkpoint(variant({ guidance: false })), false);
    await fake.idle();
    assert.equal(fake.count('transaction', { mode: 'readwrite' }), 0, `${mode} must not open a write`);
    assert.equal(fake.count('put'), 0);
    assert.equal(fake.value(), raw);
  }
  const empty = createFakeIndexedDB();
  const { store } = await started(empty);
  assert.equal(store.setMode('normal'), false, 'Normal needs the exact record it continues from.');
  assert.equal(store.state.mode, 'unclaimed');
  assert.equal(store.setMode('bogus'), false);
});

test('a normal checkpoint compares and writes in one transaction', async () => {
  const raw = seedRaw();
  const fake = seededFake(raw);
  const { store } = await continued(fake, raw);
  assert.equal(store.state.saved, true);
  assert.equal(store.state.session, 1);
  const marker = fake.log.length;
  assert.equal(store.checkpoint(variant({ language: 'cs' })), true);
  await fake.idle();
  const written = fake.value();
  assert.notEqual(written, raw);
  assert.equal(decodeRecord(written).status, 'valid');
  assert.equal(prefsOf(written).language, 'cs');
  assert.notEqual(JSON.parse(written).revision, JSON.parse(raw).revision);
  assert.equal(store.state.knownCommitted, written);
  assert.equal(store.state.slot.raw, written);
  assert.deepEqual(fake.log.slice(marker).map(entry => entry.op), ['transaction', 'get', 'put', 'commit-start', 'committed']);
  assert.equal(fake.log[marker].mode, 'readwrite');
  assert.equal(store.checkpoint(variant({ language: 'en' })), true);
  await fake.idle();
  assert.equal(prefsOf(fake.value()).language, 'en');
  assert.equal(store.state.conflict, false);
  assert.equal(store.state.available, true);
});

test('checkpoints coalesce: one in flight, one pending latest, and the expected record advances only on complete', async () => {
  const raw = seedRaw();
  const fake = seededFake(raw);
  const { store } = await continued(fake, raw);
  const gate = fake.holdNextCommit();
  assert.equal(store.checkpoint(variant({ sound: false })), true);
  await gate.reached;
  assert.equal(store.checkpoint(variant({ guidance: false })), true);
  assert.equal(store.checkpoint(variant({ language: 'cs' })), true);
  await fake.idle();
  assert.equal(fake.count('transaction', { mode: 'readwrite' }), 1, 'Only one write is in flight.');
  assert.equal(store.state.knownCommitted, raw, 'A successful put request is not a save.');
  assert.equal(store.state.slot.raw, raw);
  assert.equal(fake.value(), raw);
  gate.release();
  await fake.idle();
  assert.equal(fake.count('transaction', { mode: 'readwrite' }), 2);
  assert.deepEqual(fake.log.filter(entry => entry.op === 'put').map(entry => prefsOf(entry.value)), [
    { language: 'en', sound: false, guidance: true }, { language: 'cs', sound: true, guidance: true },
  ], 'The middle checkpoint is replaced by the latest.');
  assert.equal(store.state.conflict, false, 'The pending write compared against the first commit.');
  assert.equal(store.state.knownCommitted, fake.value());
  assert.equal(prefsOf(fake.value()).language, 'cs');
});

test('a request that succeeds before its transaction aborts is not a save', async () => {
  for (const [errorName, failure] of [['UnknownError', 'abort'], ['QuotaExceededError', 'quota']]) {
    const raw = seedRaw();
    const fake = seededFake(raw);
    const { store } = await continued(fake, raw);
    fake.failNextCommit(errorName);
    assert.equal(store.checkpoint(variant({ language: 'cs' })), true);
    await fake.idle();
    assert.equal(fake.count('put'), 1);
    assert.equal(fake.count('commit-failed'), 1);
    assert.equal(fake.value(), raw, 'The prior record is intact.');
    assert.equal(store.state.knownCommitted, raw);
    assert.equal(store.state.slot.raw, raw);
    assert.deepEqual([store.state.available, store.state.reason, store.state.failure, store.state.conflict], [false, 'failed', failure, false]);
    assert.equal(store.checkpoint(variant()), false, 'Saving stays off after the failure.');
    const later = await started(fake);
    assert.equal(later.store.state.slot.raw, raw, 'A fresh page sees the prior record.');
    assert.equal(fake.count('deleteDatabase'), 0);
  }
});

test('two connections continuing from one record: exactly one commits and the other latches a conflict', async () => {
  const raw = seedRaw();
  const fake = seededFake(raw);
  const first = await continued(fake, raw);
  const second = await continued(fake, raw);
  assert.equal(first.store.checkpoint(variant({ language: 'cs' })), true);
  assert.equal(second.store.checkpoint(variant({ sound: false })), true);
  await fake.idle();
  const stores = [first.store, second.store];
  const losers = stores.filter(store => store.state.conflict);
  const winners = stores.filter(store => !store.state.conflict);
  assert.equal(losers.length, 1, 'Exactly one tab latches the conflict.');
  assert.equal(fake.count('committed', { mode: 'readwrite' }), 1, 'Exactly one write commits.');
  const [winner] = winners, [loser] = losers;
  assert.equal(winner.state.knownCommitted, fake.value());
  assert.equal(loser.state.slot.raw, fake.value(), 'The loser observed the winner’s bytes.');
  assert.equal(loser.state.knownCommitted, raw);
  assert.deepEqual([loser.state.available, loser.state.failure, loser.state.reason], [true, null, null], 'A conflict is not a storage failure.');
  const winnerBytes = fake.value();
  assert.equal(loser.checkpoint(variant({ guidance: false })), false);
  await fake.idle();
  assert.equal(fake.value(), winnerBytes, 'The loser never overwrites the newer record.');
  assert.equal(winner.checkpoint(variant({ guidance: false })), true);
  await fake.idle();
  assert.equal(prefsOf(fake.value()).guidance, false);
});

test('Continue from a title snapshot refuses a record another tab wrote afterward', async () => {
  const raw = seedRaw();
  const fake = seededFake(raw);
  const title = await started(fake);
  const other = await continued(fake, raw);
  other.store.checkpoint(variant({ language: 'cs' }));
  await fake.idle();
  const newer = fake.value();
  title.store.setMode('normal', title.store.state.knownCommitted);
  assert.equal(title.store.checkpoint(variant({ sound: false })), true);
  await fake.idle();
  assert.equal(title.store.state.conflict, true);
  assert.equal(fake.value(), newer);
});

test('synchronous throws at transaction, objectStore, get, and put stop saving without escaping', async () => {
  for (const operation of ['transaction', 'objectStore', 'get', 'put']) {
    const raw = seedRaw();
    const fake = seededFake(raw);
    const { store } = await continued(fake, raw);
    fake.throwNext(operation);
    let queued;
    assert.doesNotThrow(() => { queued = store.checkpoint(variant({ language: 'cs' })); });
    assert.equal(queued, operation === 'put', `${operation} fails ${operation === 'put' ? 'in its callback' : 'synchronously'}`);
    await fake.idle();
    assert.deepEqual([store.state.available, store.state.reason, store.state.failure, store.state.mode], [false, 'failed', 'exception', 'normal']);
    assert.equal(fake.value(), raw);
    const transactions = fake.count('transaction');
    assert.equal(store.checkpoint(variant()), false);
    assert.deepEqual(await store.prepareReplacement(), { status: 'unavailable' });
    await fake.idle();
    assert.equal(fake.count('transaction'), transactions, 'No reopen or new transaction.');
    assert.equal(fake.count('open'), 1);
    assert.ok(fake.allConnections().every(connection => connection.closed));
  }
  const fake = createFakeIndexedDB();
  fake.seed(SAVE_DB, { stores: { walks: {} } });
  fake.throwNext('transaction', 'InvalidStateError');
  const { store } = await started(fake);
  assert.deepEqual([store.state.read, store.state.failure], ['settled', 'exception'], 'The initial read fails closed.');
  const replacingFake = createFakeIndexedDB();
  const handle = await started(replacingFake);
  const approved = await handle.store.prepareReplacement();
  replacingFake.throwNext('put');
  assert.equal(await handle.store.replace(approved, variant()), 'failed');
  assert.equal(replacingFake.has(), false);
});

test('an unexpected close with a write in flight and a pending checkpoint stops saving, and old callbacks change nothing', async () => {
  const raw = seedRaw();
  const fake = seededFake(raw);
  const { store, changes } = await continued(fake, raw);
  const gate = fake.holdNextCommit();
  store.checkpoint(variant({ language: 'cs' }));
  await gate.reached;
  store.checkpoint(variant({ sound: false }));
  const [connection] = fake.connections();
  fake.forceClose(connection, { abortTransactions: false, closeFirst: true });
  await fake.idle();
  assert.deepEqual([store.state.available, store.state.failure, store.state.mode, store.state.conflict], [false, 'closed', 'normal', false]);
  const frozen = [store.state, changes()];
  gate.release();
  await fake.idle();
  assert.equal(fake.count('committed', { mode: 'readwrite' }), 1, 'The held commit really finished in the database.');
  assert.deepEqual([store.state, changes()], frozen, 'Its old complete event cannot advance the known record.');
  assert.equal(store.state.knownCommitted, raw);
  assert.equal(fake.count('put'), 1, 'The pending checkpoint was dropped.');
  assert.equal(fake.count('open'), 1);
  assert.equal(store.checkpoint(variant()), false);

  // Specification order: the transaction aborts first, then close fires.
  const second = seededFake(raw);
  const handle = await continued(second, raw);
  handle.store.checkpoint(variant({ language: 'cs' }));
  handle.store.checkpoint(variant({ sound: false }));
  second.forceClose(second.connections()[0]);
  await second.idle();
  assert.equal(handle.store.state.available, false);
  assert.ok(['abort', 'closed'].includes(handle.store.state.failure));
  assert.equal(second.value(), raw);
  assert.equal(second.count('open'), 1);
});

test('a versionchange stops saving before closing, lets the upgrade proceed, and ignores old callbacks', async () => {
  const raw = seedRaw();
  const fake = seededFake(raw);
  const { store, changes } = await continued(fake, raw);
  const gate = fake.holdNextCommit();
  store.checkpoint(variant({ language: 'cs' }));
  await gate.reached;
  store.checkpoint(variant({ sound: false }));
  const upgrade = fake.indexedDB.open(SAVE_DB, 2);
  let upgraded = false;
  upgrade.onsuccess = () => { upgraded = true; };
  await fake.idle();
  assert.deepEqual([store.state.available, store.state.failure, store.state.reason], [false, 'versionchange', 'failed']);
  assert.equal(fake.count('close'), 1, 'The store closed its connection.');
  const frozen = [store.state, changes()];
  gate.release();
  await fake.idle();
  assert.equal(upgraded, true, 'The other tab’s upgrade is not blocked forever.');
  assert.deepEqual([store.state, changes()], frozen);
  assert.equal(fake.count('put'), 1);
  assert.equal(fake.log.filter(entry => entry.op === 'open').length, 2, 'The store never reopens.');
});

test('an intentional abort refused with InvalidStateError is not a failure, and settle and prepareReplacement wait for it', async () => {
  for (const waiter of ['settle', 'prepareReplacement']) {
    const raw = seedRaw();
    const fake = seededFake(raw);
    const { store } = await continued(fake, raw);
    const gate = fake.holdNextCommit();
    store.checkpoint(variant({ language: 'cs' }));
    await gate.reached;
    store.setMode('study');
    assert.deepEqual([fake.count('abort-refused'), fake.count('abort')], [1, 0], 'The abort was refused because the commit had begun.');
    assert.deepEqual([store.state.available, store.state.failure, store.state.mode, store.state.saved], [true, null, 'study', false]);
    const box = pendingFlag(store[waiter]());
    await fake.idle();
    assert.equal(box.done, false, `${waiter} waits for the terminal event.`);
    assert.equal(store.state.busy, true);
    gate.release();
    await fake.idle();
    assert.equal(box.done, true);
    const committed = fake.value();
    assert.equal(prefsOf(committed).language, 'cs');
    if (waiter === 'settle') assert.equal(box.value, true);
    else assert.deepEqual(box.value, { status: 'valid', raw: committed });
    assert.equal(store.state.knownCommitted, committed, 'A legitimate old commit refreshes the known record.');
    assert.deepEqual([store.state.available, store.state.failure, store.state.mode, store.state.saved, store.state.conflict, store.state.busy],
      [true, null, 'study', false, false, false]);
    assert.equal(store.checkpoint(variant()), false);
  }
});

test('a session change aborts an uncommitted write without reporting failure', async () => {
  const raw = seedRaw();
  const fake = seededFake(raw);
  const { store } = await continued(fake, raw);
  store.checkpoint(variant({ language: 'cs' }));
  store.setMode('study');
  await fake.idle();
  assert.equal(fake.value(), raw);
  assert.deepEqual([store.state.available, store.state.failure, store.state.conflict, store.state.knownCommitted], [true, null, false, raw]);
  assert.equal(await store.settle(), true);
});

test('replacement commits against empty, valid, and invalid records and refuses unsupported ones', async () => {
  for (const [value, status] of [[undefined, 'empty'], [seedRaw(), 'valid'], ['not json', 'invalid'], [{ legacy: true }, 'unsupported']]) {
    const fake = seededFake(value);
    const { store } = await started(fake);
    store.setMode('study');
    const approved = await store.prepareReplacement();
    assert.deepEqual(approved, status === 'empty' || status === 'unsupported' ? { status } : { status, raw: value });
    const session = store.state.session;
    const replacement = store.replace(approved, variant({ language: 'cs' }));
    assert.equal(store.state.busy, true);
    assert.equal(await store.replace(approved, variant()), 'cancelled', 'A duplicate submission is ignored.');
    const result = await replacement;
    await fake.idle();
    if (status === 'unsupported') {
      assert.equal(result, 'cancelled');
      assert.deepEqual(fake.value(), value);
      assert.equal(fake.count('transaction', { mode: 'readwrite' }), 0);
      continue;
    }
    assert.equal(result, 'committed');
    assert.equal(fake.count('transaction', { mode: 'readwrite' }), 1);
    assert.equal(prefsOf(fake.value()).language, 'cs');
    assert.deepEqual([store.state.mode, store.state.session, store.state.saved, store.state.conflict, store.state.busy], ['normal', session + 1, true, false, false]);
    assert.equal(store.state.knownCommitted, fake.value());
    assert.equal(store.checkpoint(variant({ sound: false })), true, 'The new walk saves against its own first record.');
    await fake.idle();
    assert.equal(prefsOf(fake.value()).sound, false);
  }
});

test('a replacement refuses a record another tab wrote between the reread and the write', async () => {
  const raw = seedRaw();
  const fake = seededFake(raw);
  const title = await started(fake);
  const approved = await title.store.prepareReplacement();
  assert.deepEqual(approved, { status: 'valid', raw });
  const other = await continued(fake, raw);
  other.store.checkpoint(variant({ language: 'cs' }));
  await fake.idle();
  const newer = fake.value();
  const session = title.store.state.session;
  assert.equal(await title.store.replace(approved, variant({ sound: false })), 'conflict');
  assert.equal(fake.value(), newer, 'The other tab’s bytes survive.');
  assert.deepEqual([title.store.state.conflict, title.store.state.mode, title.store.state.session, title.store.state.available], [true, 'unclaimed', session, true]);
  assert.equal(title.store.state.slot.raw, newer);
  const reread = await title.store.prepareReplacement();
  assert.deepEqual(reread, { status: 'valid', raw: newer });
  assert.equal(await title.store.replace(reread, variant({ sound: false })), 'committed');
  assert.equal(title.store.state.conflict, false);

  // An approved empty slot is refused once another tab creates a record.
  const empty = createFakeIndexedDB();
  const a = await started(empty);
  const b = await started(empty);
  const approvedEmpty = await a.store.prepareReplacement();
  assert.equal(await b.store.replace(await b.store.prepareReplacement(), variant({ language: 'cs' })), 'committed');
  const bBytes = empty.value();
  assert.equal(await a.store.replace(approvedEmpty, variant()), 'conflict');
  assert.equal(empty.value(), bBytes);
});

test('opting out during a slow initial open closes the late connection without hydration', async () => {
  const raw = seedRaw();
  const fake = seededFake(raw);
  const gate = fake.holdNextOpen();
  const { store, changes } = makeStore(fake);
  const startPromise = store.start();
  const prepared = store.prepareReplacement();
  assert.equal(store.state.read, 'pending');
  store.abandon();
  store.abandon();
  assert.deepEqual([store.state.read, store.state.available, store.state.reason, store.state.failure, store.state.slot.status, store.state.knownCommitted],
    ['settled', false, 'chosen-unsaved', null, 'unknown', null]);
  await startPromise;
  assert.deepEqual(await prepared, { status: 'unavailable' });
  const frozen = [store.state, changes()];
  gate.release();
  await fake.idle();
  assert.deepEqual([store.state, changes()], frozen, 'No late hydration.');
  assert.ok(fake.allConnections().every(connection => connection.closed), 'The late connection is closed.');
  assert.equal(fake.count('transaction'), 0);
  assert.equal(store.setMode('unsaved'), true);
  assert.equal(store.checkpoint(variant()), false);
  assert.equal(await store.replace({ status: 'valid', raw }, variant()), 'cancelled');
  assert.equal(fake.value(), raw);

  // A brand-new database still gets its store, so a later visit isn't stranded.
  const blank = createFakeIndexedDB();
  const blankGate = blank.holdNextOpen();
  const late = makeStore(blank);
  late.store.start();
  late.store.abandon();
  blankGate.release();
  await blank.idle();
  assert.equal(blank.database().stores.has(SAVE_STORE), true);
  assert.equal((await started(blank)).store.state.slot.status, 'empty');
});

test('opting out cancels waiting replacement and settle work', async () => {
  const raw = seedRaw();
  const fake = seededFake(raw);
  const { store } = await continued(fake, raw);
  const gate = fake.holdNextCommit();
  store.checkpoint(variant({ language: 'cs' }));
  await gate.reached;
  const settled = pendingFlag(store.settle());
  const prepared = pendingFlag(store.prepareReplacement());
  await fake.idle();
  assert.equal(settled.done || prepared.done, false);
  store.abandon();
  await fake.idle();
  assert.deepEqual([settled.done, settled.value, prepared.done, prepared.value], [true, false, true, { status: 'unavailable' }]);
  assert.equal(store.state.busy, false);
  const frozen = store.state;
  gate.release();
  await fake.idle();
  assert.deepEqual(store.state, frozen);
  assert.equal(store.state.reason, 'chosen-unsaved');
});

test('dispose is silent and leaves every method harmless', async () => {
  const raw = seedRaw();
  const fake = seededFake(raw);
  const { store, changes } = await continued(fake, raw);
  const gate = fake.holdNextCommit();
  store.checkpoint(variant({ language: 'cs' }));
  await gate.reached;
  const settling = store.settle();
  const count = changes();
  store.dispose();
  store.dispose();
  gate.release();
  await fake.idle();
  assert.equal(await settling, false);
  assert.equal(changes(), count, 'No onChange after dispose.');
  assert.equal(store.checkpoint(variant()), false);
  assert.equal(store.setMode('study'), false);
  assert.deepEqual(await store.prepareReplacement(), { status: 'unavailable' });
  assert.equal(await store.replace({ status: 'valid', raw }, variant()), 'cancelled');
  assert.equal(await store.settle(), false);
  store.abandon();
  await store.start();
  assert.equal(changes(), count);
  assert.ok(fake.allConnections().every(connection => connection.closed));
});

test('hostile input and throwing hooks never escape a public method or reject', async () => {
  const errors = [];
  const original = console.error;
  console.error = error => errors.push(error);
  try {
    const raw = seedRaw();
    const fake = seededFake(raw);
    const store = createSaveStore({ indexedDB: fake.indexedDB, onChange: () => { throw new Error('listener bug'); } });
    const cyclic = variant(); cyclic.self = cyclic;
    const promises = [store.start(), store.settle(), store.prepareReplacement(), store.replace(null, null)];
    await fake.idle();
    assert.equal(store.state.slot.status, 'valid');
    store.setMode('normal', raw);
    for (const payload of [undefined, null, 42, 'text', [], {}, cyclic, edited(variant(), p => { p.player.x = NaN; }), edited(variant(), p => { p.talked = ['fox']; })]) {
      assert.equal(store.checkpoint(payload), false);
    }
    for (const [mode, value] of [['bogus'], [null], ['normal', 5], ['normal', {}]]) assert.equal(store.setMode(mode, value), false);
    promises.push(store.replace({ status: 'valid' }, variant()), store.replace({ status: 'unsupported' }, variant()), store.replace({ get status() { throw new Error('x'); } }, variant()));
    promises.push(store.replace({ status: 'valid', raw }, { ...variant(), extra: 1 }));
    await fake.idle();
    fake.throwNext('abort');
    store.checkpoint(variant({ language: 'cs' }));
    store.setMode('study');
    promises.push(store.settle(), store.prepareReplacement());
    await fake.idle();
    const results = await Promise.allSettled(promises);
    assert.ok(results.every(result => result.status === 'fulfilled'), 'No promise rejects.');
    assert.equal(fake.value() === raw || decodeRecord(fake.value()).status === 'valid', true);
    assert.ok(errors.length > 0, 'A throwing listener is reported, not propagated.');
    assert.equal(fake.handlerErrors.length, 0, 'No exception escaped into an IndexedDB event handler.');
  } finally {
    console.error = original;
  }
});

test('an oversized payload stops saving instead of writing', async () => {
  const raw = seedRaw();
  const fake = seededFake(raw);
  const { store } = await continued(fake, raw);
  assert.equal(store.checkpoint({ ...variant(), notes: 'x'.repeat(MAX_SAVE_BYTES) }), false);
  await fake.idle();
  assert.deepEqual([store.state.available, store.state.failure], [false, 'oversize']);
  assert.equal(fake.count('transaction', { mode: 'readwrite' }), 0);
  assert.equal(fake.value(), raw);
});

test('no store promise was left to reject unhandled', () => {
  assert.deepEqual(unhandled, []);
});
