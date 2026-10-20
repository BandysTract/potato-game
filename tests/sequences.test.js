import test from 'node:test';
import assert from 'node:assert/strict';
import { SEQUENCES, createSequenceGame } from '../src/sequences.js';
import { chooseSong, finishConversation, getNearby, step } from '../src/game.js';
import { BOUNDS, CREATURES, FAIRIES, HOME, HOUSE_BOUNDS, HOUSE_OBSTACLES, HOUSE_TARGETS, OBSTACLES, POTATOES, SONGS, SONG_SITES } from '../src/data.js';
import { DIALOGUES } from '../src/dialogues.js';

function interact(game) { step(game, { interact: true }, 0.05); }
function completeAction(game) {
  assert.ok(game.actionAnimation, 'The prepared scene must start a real action.');
  step(game, {}, game.actionAnimation.duration);
}
function allSupplies(game) {
  assert.deepEqual([...game.potatoes].sort(), POTATOES.map(({ id }) => id).sort());
  assert.deepEqual([...game.tears].sort(), FAIRIES.map(({ id }) => id).sort());
  assert.deepEqual([...game.learnedSongs].sort(), SONGS.map(({ id }) => id).sort());
  assert.deepEqual([...game.restoredSites].sort(), SONG_SITES.map(({ id }) => id).sort());
  assert.equal(game.gardenWatered, true);
}

test('the bounded scene catalog starts fresh games and rejects unknown choices', () => {
  assert.equal(SEQUENCES.length, 20);
  assert.equal(new Set(SEQUENCES.map(({ id }) => id)).size, SEQUENCES.length);
  for (const invalid of ['unknown', 'fox:3', 'fox:-1', 'fox:01', 'garden-unknown', null, undefined]) assert.equal(createSequenceGame(invalid), null);
  const game = createSequenceGame('start', 'en');
  assert.equal(game.language, 'en');
  assert.equal(game.phase, 'playing');
  assert.equal(game.scene, 'outdoors');
  assert.deepEqual(game.potatoes, []);
  assert.deepEqual(game.learnedSongs, []);
  const first = createSequenceGame('home', 'cs');
  first.potatoes.pop(); first.player.x = 100; first.dialogueNext.fox = 2;
  const second = createSequenceGame('home', 'cs');
  allSupplies(second);
  assert.equal(second.player.x, HOME.x);
  assert.equal(second.dialogueNext.fox, 0);
});

test('every prepared playable position is inside the map and clear of obstacles', () => {
  // Rejects placing Hana at furniture centers even if interaction reach passes.
  for (const sequence of SEQUENCES) {
    const game = createSequenceGame(sequence.id);
    const bounds = game.scene === 'house' ? HOUSE_BOUNDS : BOUNDS;
    const obstacles = game.scene === 'house' ? HOUSE_OBSTACLES : OBSTACLES;
    assert.ok(game.player.x >= bounds.minX + .45 && game.player.x <= bounds.maxX - .45, sequence.id);
    assert.ok(game.player.z >= bounds.minZ + .45 && game.player.z <= bounds.maxZ - .45, sequence.id);
    for (const obstacle of obstacles) assert.ok(Math.hypot(game.player.x - obstacle.x, game.player.z - obstacle.z) >= obstacle.radius + .45, `${sequence.id}: ${obstacle.id || obstacle.type}`);
  }
});

test('all fairy entries can begin and finish their actual learning sequence', () => {
  for (const fairy of FAIRIES) {
    const game = createSequenceGame(fairy.id);
    assert.equal(getNearby(game)?.id, fairy.id);
    interact(game);
    const song = SONGS.find((entry) => entry.fairyId === fairy.id);
    assert.equal(game.activeSong?.kind, 'learn');
    assert.equal(game.activeSong?.songId, song.id);
    step(game, {}, game.activeSong.duration);
    assert.deepEqual(game.tears, [fairy.id]);
    assert.deepEqual(game.learnedSongs, [song.id]);
  }
});

test('all garden entries have the real prerequisites and can restore the garden', () => {
  // Rejects teleport-only jumps, which leave the song or required tears missing.
  for (const site of SONG_SITES) {
    const game = createSequenceGame(`garden-${site.id}`);
    assert.equal(getNearby(game)?.id, site.id);
    assert.equal(game.restoredSites.includes(site.id), false);
    assert.ok(game.learnedSongs.includes(site.songId));
    if (site.id === 'cottage') {
      assert.equal(game.gardenWatered, false);
      assert.equal(game.tears.length, FAIRIES.length);
      assert.equal(game.potatoes.length, POTATOES.length);
    }
    interact(game);
    assert.equal(game.songSite, site.id);
    assert.equal(chooseSong(game, site.songId), true);
    step(game, {}, game.activeSong.duration);
    assert.ok(game.restoredSites.includes(site.id));
    if (site.potatoId) {
      step(game, {}, .05);
      assert.equal(getNearby(game)?.id, site.potatoId);
      interact(game); completeAction(game);
    }
    allSupplies(game);
  }
});

test('every animal question opens at the requested index and continues normally', () => {
  let count = 0;
  for (const creature of CREATURES) {
    const sequence = SEQUENCES.find((entry) => entry.id === creature.id);
    assert.equal(sequence.variants.length, DIALOGUES[creature.id].length);
    sequence.variants.forEach((variant, index) => {
      const game = createSequenceGame(variant.id);
      assert.equal(game.conversation, creature.id);
      assert.equal(game.conversationIndex, index);
      assert.equal(getNearby(game)?.id, creature.id);
      finishConversation(game);
      assert.deepEqual(game.talked, [creature.id]);
      interact(game);
      assert.equal(game.conversationIndex, (index + 1) % sequence.variants.length);
      count += 1;
    });
  }
  assert.equal(count, 12);
});

test('the cottage entrance passes the real supply gate', () => {
  const game = createSequenceGame('home');
  const nearby = getNearby(game);
  assert.equal(nearby?.type, 'home');
  assert.equal(nearby.ready, true);
  interact(game);
  assert.equal(game.scene, 'house');
  assert.equal(game.houseStep, 0);
});

test('each house task starts at its current step and completes through the game model', () => {
  HOUSE_TARGETS.forEach((target, index) => {
    const game = createSequenceGame(target.id);
    allSupplies(game);
    assert.equal(game.scene, 'house');
    assert.equal(game.houseStep, index);
    assert.equal(getNearby(game)?.id, target.id);
    interact(game);
    if (index < 2) {
      assert.equal(game.conversation, target.id);
      finishConversation(game);
    } else completeAction(game);
    if (index === HOUSE_TARGETS.length - 1) assert.equal(game.phase, 'won');
    else assert.equal(game.houseStep, index + 1);
  });
});

test('Percy can be petted without advancing the supper tasks', () => {
  const game = createSequenceGame('percy');
  assert.equal(getNearby(game)?.id, 'percy');
  interact(game); completeAction(game);
  assert.equal(game.percyPets, 1);
  assert.equal(game.houseStep, 0);
});

test('both endings start from a complete supper and a fresh reveal', () => {
  for (const ending of ['dance', 'goddess']) {
    const game = createSequenceGame(`ending-${ending}`, 'en');
    allSupplies(game);
    assert.equal(game.phase, 'won');
    assert.equal(game.scene, 'house');
    assert.equal(game.houseStep, 4);
    assert.equal(game.ending, ending);
    assert.equal(game.finaleTime, 0);
    assert.equal(game.dancePlaying, false);
    assert.equal(game.activeSong, null);
    assert.equal(game.actionAnimation, null);
    assert.equal(game.conversation, null);
  }
});

test('real serving and both direct endings share the supper position within interaction reach', () => {
  const game = createSequenceGame('cook');
  interact(game); completeAction(game);
  // Walk along the clear aisle from the stove, then approach the serving target.
  for (let i = 0; i < 16; i++) step(game, { x: 1, y: 1 }, .05);
  const before = { ...game.player }, target = HOUSE_TARGETS.find(item => item.id === 'serve');
  assert.equal(getNearby(game).id, 'serve'); interact(game); completeAction(game);
  assert.equal(game.phase, 'won'); assert.equal(game.ending, null);
  assert.equal(game.player.x, target.x); assert.equal(game.player.z, target.z);
  assert.ok(Math.hypot(before.x - target.x, before.z - target.z) <= 2);
  for (const ending of ['ending-dance', 'ending-goddess']) {
    const direct = createSequenceGame(ending);
    assert.equal(direct.player.x, game.player.x); assert.equal(direct.player.z, game.player.z);
  }
});
