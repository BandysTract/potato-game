import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { BOUNDS, CREATURES, FAIRIES, HOME, OBSTACLES, POTATOES, START } from '../src/data.js';
import { createGame, finishConversation, getGoal, getNearby, setLanguage, setMessage, startGame, step } from '../src/game.js';
import { CS, placeName, t } from '../src/i18n.js';

const idle = { x: 0, y: 0, interact: false };
const distance = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
const close = (actual, expected, tolerance = 0.000001) => assert.ok(Math.abs(actual - expected) < tolerance, `${actual} should be near ${expected}`);
const playing = (language = 'en') => startGame(createGame(language));

function frames(game, count, input = idle) {
  for (let i = 0; i < count; i++) step(game, input, 0.05);
}

// Move through the same screen controls as the player. Never inject inventory.
function walkTo(game, target) {
  for (let i = 0; i < 1500; i++) {
    const dx = target.x - game.player.x;
    const dz = target.z - game.player.z;
    if (Math.hypot(dx, dz) < 0.12) return;
    const seconds = Math.min(0.05, Math.hypot(dx, dz) / 5);
    step(game, { x: (dx - dz) * Math.SQRT1_2, y: (dx + dz) * Math.SQRT1_2 }, seconds);
    for (const obstacle of OBSTACLES) {
      assert.ok(distance(game.player, obstacle) >= obstacle.radius + 0.4, 'The walked route must not cross an obstacle.');
    }
  }
  assert.fail(`Could not walk to ${target.id || `${target.x}, ${target.z}`}`);
}

function collect(game, potato) {
  walkTo(game, potato);
  assert.equal(getNearby(game)?.id, potato.id);
  step(game, { ...idle, interact: true }, 0.05);
  assert.ok(game.potatoes.includes(potato.id));
}

function sing(game, fairy) {
  walkTo(game, fairy);
  assert.equal(getNearby(game)?.id, fairy.id);
  frames(game, 40, { ...idle, interact: true });
  assert.ok(game.tears.includes(fairy.id));
}

test('intro waits for start, and separate games own separate inventories', () => {
  const game = createGame();
  const original = structuredClone(game);
  step(game, { x: 1, y: 1, interact: true }, 1);
  assert.deepEqual(game, original);
  assert.deepEqual({ x: game.player.x, z: game.player.z }, START);
  startGame(game);
  assert.equal(game.phase, 'playing');
  assert.notEqual(game.potatoes, createGame().potatoes);
  assert.notEqual(game.tears, createGame().tears);
});

test('screen arrows move in their displayed directions', () => {
  for (const [input, signX, signZ] of [
    [{ x: 1, y: 0 }, 1, -1], [{ x: -1, y: 0 }, -1, 1],
    [{ x: 0, y: 1 }, 1, 1], [{ x: 0, y: -1 }, -1, -1],
  ]) {
    const game = playing();
    step(game, input, 0.05);
    assert.equal(Math.sign(game.player.x - START.x), signX);
    assert.equal(Math.sign(game.player.z - START.z), signZ);
    assert.equal(game.player.moving, true);
    if (input.x) assert.equal(game.player.facing, input.x);
    step(game, idle, 0.05);
    assert.equal(game.player.moving, false);
  }
});

test('diagonal and oversized controls cannot outrun a single arrow', () => {
  const cardinal = playing();
  const diagonal = playing();
  const oversized = playing();
  step(cardinal, { x: 1, y: 0 }, 0.05);
  step(diagonal, { x: 1, y: 1 }, 0.05);
  step(oversized, { x: 90, y: 90 }, 0.05);
  close(distance(cardinal.player, START), 0.25);
  close(distance(diagonal.player, START), distance(cardinal.player, START));
  close(distance(oversized.player, START), distance(cardinal.player, START));
  close(diagonal.player.z, START.z);
});

test('long, negative, and invalid time steps cannot jump or corrupt the world', () => {
  const game = playing();
  step(game, { x: 1, y: 0 }, 100);
  close(distance(game.player, START), 0.25);
  close(game.elapsed, 0.05);
  const position = { x: game.player.x, z: game.player.z };
  for (const seconds of [-1, 0, NaN, Infinity]) step(game, { x: 1, y: 1, interact: true }, seconds);
  assert.deepEqual({ x: game.player.x, z: game.player.z }, position);
  close(game.elapsed, 0.05);
  step(game, { x: NaN, y: Infinity }, 0.05);
  assert.deepEqual({ x: game.player.x, z: game.player.z }, position);
});

test('Hana reaches each world edge and cannot walk through it', () => {
  for (const [input, axis, edge] of [
    [{ x: 1, y: 1 }, 'x', BOUNDS.maxX], [{ x: -1, y: -1 }, 'x', BOUNDS.minX],
    [{ x: -1, y: 1 }, 'z', BOUNDS.maxZ], [{ x: 1, y: -1 }, 'z', BOUNDS.minZ],
  ]) {
    const game = playing();
    walkTo(game, { x: 20, z: 15 });
    frames(game, 500, input);
    assert.ok(Math.abs(game.player[axis] - edge) < 0.5, 'The route reaches the named edge rather than stopping at an obstacle.');
    assert.ok(game.player.x >= BOUNDS.minX && game.player.x <= BOUNDS.maxX);
    assert.ok(game.player.z >= BOUNDS.minZ && game.player.z <= BOUNDS.maxZ);
    const endpoint = { ...game.player };
    frames(game, 10, input);
    close(distance(endpoint, game.player), 0);
    assert.equal(game.player.moving, false);
  }
});

test('obstacles block a direct approach and allow movement along their edge', () => {
  const game = playing();
  const cottage = OBSTACLES.find(({ type }) => type === 'cottage');
  frames(game, 30, { x: -1, y: 1 });
  assert.ok(distance(game.player, cottage) >= cottage.radius + 0.4);
  assert.ok(game.player.z < cottage.z);
  assert.equal(game.player.moving, false);
  const blockedZ = game.player.z;
  frames(game, 10, { x: 0, y: 1 });
  assert.ok(game.player.x > 0.5, 'The player can slide sideways instead of sticking to the cottage.');
  assert.ok(game.player.z > blockedZ, 'Sliding follows the curved edge.');
  for (const obstacle of OBSTACLES) assert.ok(distance(game.player, obstacle) >= obstacle.radius + 0.4);
});

test('cottage collision keeps clearance at the map edge without idle drift', () => {
  const cottage = OBSTACLES.find(({ type }) => type === 'cottage');
  const playerRadius = 0.45;
  for (const side of [1, -1]) {
    const game = playing();
    frames(game, 24, { x: side, y: side });
    frames(game, 40, { x: -1, y: 1 });
    frames(game, 40, { x: -side, y: -side });
    close(game.player.z, BOUNDS.maxZ - playerRadius);
    assert.ok(game.player.x >= BOUNDS.minX + playerRadius && game.player.x <= BOUNDS.maxX - playerRadius);
    assert.ok(distance(game.player, cottage) >= cottage.radius + playerRadius - 0.000000001,
      'The map edge must not push Hana inside the cottage.');
    const position = { ...game.player };
    frames(game, 10);
    close(distance(game.player, position), 0);
    assert.equal(game.player.moving, false);
  }
});

test('potatoes require proximity and each patch yields only one potato', () => {
  const game = playing();
  frames(game, 80, { ...idle, interact: true });
  assert.deepEqual(game.potatoes, []);
  assert.deepEqual(game.tears, []);
  assert.equal(getNearby(game), null);
  collect(game, POTATOES[0]);
  frames(game, 80, { ...idle, interact: true });
  assert.deepEqual(game.potatoes, [POTATOES[0].id]);
  assert.equal(getNearby(game), null);
  assert.match(game.message, /1 of 6/);
});

test('a fairy needs the full uninterrupted song, and release resets progress', () => {
  const game = playing();
  walkTo(game, { x: -16, z: 2 });
  walkTo(game, FAIRIES[0]);
  step(game, { ...idle, interact: true }, 100);
  close(game.holdProgress, 0.025);
  assert.deepEqual(game.tears, [], 'A delayed frame must not complete the song.');
  step(game, idle, 0.05);
  frames(game, 20, { ...idle, interact: true });
  close(game.holdProgress, 0.5);
  assert.equal(game.activeFairy, FAIRIES[0].id);
  assert.deepEqual(game.tears, []);
  step(game, idle, 0.05);
  assert.equal(game.holdProgress, 0);
  assert.equal(game.activeFairy, null);
  frames(game, 39, { ...idle, interact: true });
  assert.deepEqual(game.tears, []);
  step(game, { ...idle, interact: true }, 0.05);
  assert.deepEqual(game.tears, [FAIRIES[0].id]);
  assert.equal(game.holdProgress, 0);
  assert.equal(game.activeFairy, null);
  assert.deepEqual(game.potatoes, [], 'Singing costs no potatoes.');
  frames(game, 100, { ...idle, interact: true });
  assert.deepEqual(game.tears, [FAIRIES[0].id]);
});

test('walking during a song cancels it, including walking out of reach', () => {
  const game = playing();
  walkTo(game, { x: -16, z: 2 });
  walkTo(game, FAIRIES[0]);
  frames(game, 20, { ...idle, interact: true });
  step(game, { x: -1, y: 0, interact: true }, 0.05);
  assert.equal(game.holdProgress, 0);
  assert.equal(game.activeFairy, null);
  frames(game, 20, { x: -1, y: 0, interact: true });
  frames(game, 50, { ...idle, interact: true });
  assert.deepEqual(game.tears, []);
  assert.equal(game.activeFairy, null);
  walkTo(game, FAIRIES[0]);
  frames(game, 39, { ...idle, interact: true });
  assert.deepEqual(game.tears, []);
});

test('starting another fairy’s song begins from zero', () => {
  const game = playing();
  walkTo(game, { x: -16, z: 2 });
  walkTo(game, FAIRIES[0]);
  frames(game, 20, { ...idle, interact: true });
  walkTo(game, { x: -10, z: -16 });
  walkTo(game, FAIRIES[1]);
  step(game, { ...idle, interact: true }, 0.05);
  close(game.holdProgress, 0.025);
  assert.equal(game.activeFairy, FAIRIES[1].id);
  assert.deepEqual(game.tears, []);
});

test('home explains both missing gifts and cannot finish early', () => {
  const game = playing();
  walkTo(game, HOME);
  assert.equal(getNearby(game)?.type, 'home');
  assert.equal(getNearby(game)?.ready, false);
  step(game, { ...idle, interact: true }, 0.05);
  assert.equal(game.phase, 'playing');
  assert.match(game.message, /potatoes 6/);
  assert.match(game.message, /fairy tears 3/);
});

test('guidance points to the nearest uncollected gift and updates after collection', () => {
  const game = playing();
  const goal = getGoal(game);
  assert.equal(goal.id, POTATOES[0].id);
  close(goal.distance, distance(START, POTATOES[0]));
  collect(game, POTATOES[0]);
  const next = getGoal(game);
  assert.notEqual(next.id, POTATOES[0].id);
  const remaining = [...POTATOES.slice(1), ...FAIRIES];
  const nearestDistance = Math.min(...remaining.map((target) => distance(game.player, target)));
  close(next.distance, nearestDistance);
  assert.ok(next.label.length > 5);
  walkTo(game, { x: -16, z: 2 });
  walkTo(game, FAIRIES[0]);
  assert.equal(getGoal(game).id, FAIRIES[0].id, 'Guidance must choose the nearby fairy over the first potato in the data.');
});

test('all potatoes still require fairy tears before home can finish', () => {
  const game = playing();
  collect(game, POTATOES[0]);
  collect(game, POTATOES[1]);
  collect(game, POTATOES[2]);
  collect(game, POTATOES[3]);
  collect(game, POTATOES[4]);
  walkTo(game, { x: 15, z: -9 });
  collect(game, POTATOES[5]);
  walkTo(game, { x: 8, z: 7 });
  walkTo(game, { x: 0, z: 10 });
  walkTo(game, HOME);
  step(game, { ...idle, interact: true }, 0.05);
  assert.equal(game.phase, 'playing');
  assert.match(game.message, /fairy tears 3/);
  assert.match(game.message, /potatoes 0/);
});

test('messages expire only during active play', () => {
  const game = playing();
  collect(game, POTATOES[0]);
  assert.ok(game.message.length);
  frames(game, 101);
  assert.equal(game.messageTime, 0);
  assert.equal(game.message, '');
  setLanguage(game, 'cs');
  assert.equal(game.message, '', 'Switching language must not bring back an expired toast.');
  assert.equal(game.messageKey, '');
  assert.ok(game.elapsed > 5);
});

test('creature conversations pause play, preserve gifts, and allow an idempotent replay', () => {
  const game = playing();
  assert.equal(game.conversation, null);
  assert.deepEqual(game.talked, []);
  finishConversation(game);
  assert.deepEqual(game.talked, [], 'Closing an absent conversation must not record a visit.');
  collect(game, POTATOES[0]);
  walkTo(game, { x: -7, z: 5 });
  walkTo(game, CREATURES[0]);
  assert.equal(game.conversation, null, 'Walking up to a creature alone must not open dialogue.');
  assert.equal(getNearby(game)?.type, 'creature');
  assert.equal(getNearby(game)?.id, CREATURES[0].id);
  assert.notEqual(getGoal(game).type, 'creature', 'Optional conversations must not replace gathering guidance.');
  const potatoes = [...game.potatoes];
  const tears = [...game.tears];
  step(game, { ...idle, interact: true }, 0.05);
  assert.equal(game.conversation, CREATURES[0].id);
  assert.equal(game.activeFairy, null);
  assert.equal(game.holdProgress, 0);
  assert.equal(game.player.moving, false);
  const paused = structuredClone(game);
  frames(game, 100, { x: 1, y: 1, interact: true });
  assert.deepEqual(game, paused, 'Reading a conversation freezes movement, gifts, and adventure time.');
  finishConversation(game);
  assert.equal(game.conversation, null);
  assert.deepEqual(game.talked, [CREATURES[0].id]);
  finishConversation(game);
  assert.deepEqual(game.talked, [CREATURES[0].id]);
  step(game, { ...idle, interact: true }, 0.05);
  assert.equal(game.conversation, CREATURES[0].id, 'A completed conversation remains available for replay.');
  finishConversation(game);
  assert.deepEqual(game.talked, [CREATURES[0].id], 'Replaying must not add a duplicate visit.');
  assert.deepEqual(game.potatoes, potatoes);
  assert.deepEqual(game.tears, tears);
  const position = { ...game.player };
  step(game, { x: 1, y: 0 }, 0.05);
  assert.ok(distance(game.player, position) > 0, 'Closing dialogue restores walking.');
  const restart = createGame();
  assert.equal(restart.conversation, null);
  assert.deepEqual(restart.talked, []);
});

test('each forest creature can be reached and spoken to through normal controls', () => {
  const game = playing();
  walkTo(game, { x: -7, z: 5 });
  for (const creature of CREATURES) {
    if (creature.id === 'owl') walkTo(game, { x: -16, z: -9 });
    if (creature.id === 'deer') walkTo(game, { x: 4, z: -21 });
    walkTo(game, creature);
    step(game, { ...idle, interact: true }, 0.05);
    assert.equal(game.conversation, creature.id);
    finishConversation(game);
  }
  assert.deepEqual(game.talked, CREATURES.map(({ id }) => id));
  assert.deepEqual(game.potatoes, []);
  assert.deepEqual(game.tears, []);
  assert.equal(game.phase, 'playing');
});

test('the complete adventure is reachable through controls and freezes when home', () => {
  const game = playing();
  collect(game, POTATOES[0]);
  collect(game, POTATOES[1]);
  collect(game, POTATOES[2]);
  sing(game, FAIRIES[0]);
  assert.equal(game.message, FAIRIES[0].message);
  setLanguage(game, 'cs');
  assert.equal(game.message, CS[FAIRIES[0].message]);
  setLanguage(game, 'en');
  collect(game, POTATOES[3]);
  sing(game, FAIRIES[1]);
  assert.equal(game.message, FAIRIES[1].message);
  setLanguage(game, 'cs');
  assert.equal(game.message, CS[FAIRIES[1].message]);
  setLanguage(game, 'en');
  collect(game, POTATOES[4]);
  walkTo(game, { x: 15, z: -9 });
  sing(game, FAIRIES[2]);
  assert.equal(game.message, FAIRIES[2].message);
  setLanguage(game, 'cs');
  assert.equal(game.message, CS[FAIRIES[2].message]);
  setLanguage(game, 'en');
  // All tears alone must not win. The last potato remains at the brook.
  walkTo(game, { x: 9, z: 5 });
  walkTo(game, { x: 0, z: 10 });
  walkTo(game, HOME);
  step(game, { ...idle, interact: true }, 0.05);
  assert.equal(game.phase, 'playing');
  assert.match(game.message, /potatoes 1/);
  assert.match(game.message, /fairy tears 0/);
  walkTo(game, { x: 8, z: 7 });
  collect(game, POTATOES[5]);
  assert.equal(game.potatoes.length, 6);
  assert.equal(game.tears.length, 3);
  assert.equal(getGoal(game).type, 'home');
  assert.equal(game.phase, 'playing', 'Gathering everything still requires returning home.');
  step(game, { ...idle, interact: true }, 0.05);
  assert.equal(game.phase, 'playing', 'Interacting far from home cannot finish the adventure.');
  walkTo(game, { x: 8, z: 7 });
  walkTo(game, { x: 0, z: 10 });
  walkTo(game, HOME);
  assert.equal(getNearby(game)?.ready, true);
  step(game, { ...idle, interact: true }, 0.05);
  assert.equal(game.phase, 'won');
  assert.equal(game.player.moving, false);
  assert.equal(game.message, 'Home with 6 potatoes and 3 fairy tears. The kettle is on, and supper can begin.');
  setLanguage(game, 'cs');
  assert.equal(game.message, CS[game.messageKey]);
  const finished = structuredClone(game);
  frames(game, 100, { x: 1, y: 1, interact: true });
  startGame(game);
  assert.deepEqual(game, finished);
});

test('Czech is the default, and invalid language choices leave progress unchanged', () => {
  const game = createGame();
  assert.equal(game.language, 'cs');
  assert.equal(getGoal(game).label, 'Najdi bramboru: Zahrádka u chaloupky');
  assert.equal(createGame('unsupported').language, 'cs');
  startGame(game);
  collect(game, POTATOES[0]);
  const before = structuredClone(game);
  for (const language of ['de', '', null, undefined]) setLanguage(game, language);
  assert.deepEqual(game, before);
});

test('switching a visible message preserves movement, gifts, timing, and source values', () => {
  const game = playing('cs');
  collect(game, POTATOES[0]);
  assert.equal(game.message, 'Brambora nalezena. V košíku: 1 z 6.');
  step(game, { x: 1, y: 0 }, 0.05);
  const before = structuredClone(game);
  const basket = game.potatoes;
  const player = game.player;
  setLanguage(game, 'en');
  assert.equal(game.message, 'Potato found. 1 of 6 in your basket.');
  assert.equal(game.language, 'en');
  assert.equal(game.potatoes, basket);
  assert.equal(game.player, player);
  assert.deepEqual({ ...game, language: before.language, message: before.message }, before);
  setLanguage(game, 'cs');
  assert.deepEqual(game, before);
  const values = { count: 2 };
  setMessage(game, 'Potato found. {count} of 6 in your basket.', values, 3);
  values.count = 99;
  setLanguage(game, 'en');
  assert.equal(game.message, 'Potato found. 2 of 6 in your basket.');
  assert.equal(game.messageTime, 3);
});

test('language changes preserve an unfinished song and an open conversation', () => {
  const game = playing('cs');
  walkTo(game, { x: -16, z: 2 });
  walkTo(game, FAIRIES[0]);
  frames(game, 20, { ...idle, interact: true });
  const singing = structuredClone(game);
  setLanguage(game, 'en');
  assert.deepEqual({ ...game, language: 'cs' }, singing);
  assert.equal(getGoal(game).label, `Sing with ${FAIRIES[0].name}`);
  frames(game, 20, { ...idle, interact: true });
  assert.deepEqual(game.tears, [FAIRIES[0].id]);
  walkTo(game, { x: -16, z: 2 });
  walkTo(game, CREATURES[0]);
  step(game, { ...idle, interact: true }, 0.05);
  const talking = structuredClone(game);
  setLanguage(game, 'cs');
  assert.deepEqual({ ...game, language: 'en', message: talking.message }, talking);
  assert.equal(game.conversation, CREATURES[0].id);
  assert.deepEqual(game.tears, [FAIRIES[0].id]);
});

test('nearby places, creatures, and home instructions follow the active language', () => {
  const game = playing('cs');
  walkTo(game, POTATOES[0]);
  assert.equal(getNearby(game).name, 'Zahrádka u chaloupky');
  setLanguage(game, 'en');
  assert.equal(getNearby(game).name, 'Cottage garden');
  walkTo(game, { x: -7, z: 5 });
  walkTo(game, CREATURES[0]);
  assert.equal(getNearby(game).name, 'Fox');
  setLanguage(game, 'cs');
  assert.equal(getNearby(game).name, 'Liška');
  walkTo(game, { x: -16, z: 2 });
  walkTo(game, FAIRIES[0]);
  assert.equal(getNearby(game).place, 'Březový háj');
  assert.equal(getNearby(game).name, 'Běla');
  assert.equal(getGoal(game).label, 'Zpívání: Běla');
  walkTo(game, { x: -16, z: 2 });
  walkTo(game, { x: -7, z: 5 });
  walkTo(game, { x: 0, z: 10 });
  walkTo(game, HOME);
  assert.equal(getNearby(game).name, 'Hanina chaloupka');
  step(game, { ...idle, interact: true }, 0.05);
  assert.equal(game.message, 'Ještě chybí brambory: 6. Vílí slzy: 3. Pak se vrať domů.');
  setLanguage(game, 'en');
  assert.equal(getNearby(game).name, 'Hana’s cottage');
  assert.equal(game.message, 'Still needed: potatoes 6, fairy tears 3. Then come home.');
});

test('translation templates preserve named values, proper names, and unknown text', () => {
  assert.equal(t('cs', '{count} of 6 potatoes', { count: 0 }), 'Brambory: 0 z 6');
  assert.equal(t('en', '{count} of 6 potatoes', { count: 0 }), '0 of 6 potatoes');
  assert.equal(t('cs', 'Unknown {value} / {value}', { value: 'text' }), 'Unknown text / text');
  assert.equal(t('en', 'Unknown {missing}'), 'Unknown {missing}');
  assert.equal(placeName('cs', 'Jitřenka'), 'Jitřenka');
  assert.equal(placeName('en', 'Rusalka'), 'Rusalka');
  assert.equal(placeName('cs', 'Mountain meadow'), 'Horská louka');
  assert.equal(t('cs', 'Sound is unavailable. You can keep exploring without it.'), 'Zvuk není dostupný. Ve výpravě můžeš pokračovat i bez něj.');
  for (const [source, translated] of Object.entries(CS)) {
    const placeholders = (text) => [...text.matchAll(/\{(\w+)\}/g)].map((match) => match[1]).sort();
    assert.deepEqual(placeholders(translated), placeholders(source), `Named values must match in ${source}`);
  }
});

test('literal interface keys and shared place names have Czech translations', () => {
  const ui = readFileSync(new URL('../src/ui.js', import.meta.url), 'utf8');
  const main = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8');
  const literalKeys = [
    ...[...ui.matchAll(/\bl\('([^']+)'/g)].map((match) => match[1]),
    ...[...(ui + main).matchAll(/\bt\((?:language|game\.language),\s*'([^']+)'/g)].map((match) => match[1]),
  ];
  assert.ok(new Set(literalKeys).size > 60, 'The source scan must find the real interface rather than an empty set.');
  const places = [HOME.name, ...POTATOES.map(({ name }) => name), ...FAIRIES.map(({ place }) => place)];
  for (const key of [...literalKeys, ...places, ...FAIRIES.map(({ message }) => message), ...CREATURES.flatMap(({ englishName, theme }) => [englishName, theme])]) {
    assert.ok(Object.hasOwn(CS, key), `Missing Czech translation: ${key}`);
    assert.ok(CS[key].length > 0, `Empty Czech translation: ${key}`);
  }
});
