import test from 'node:test';
import assert from 'node:assert/strict';
import { BROOK, CREATURES, FAIRIES, OBSTACLES, POTATOES, PRACTICE_SPOTS, SONG_SITES } from '../src/data.js';
import { BROOK_ART, COTTAGE_ART, GROVE, INTERACTIONS, MEADOW_TUFTS, PRACTICE_ART, WINDOW_CALLBACKS, WOODLAND_MUSHROOMS,
  freeStandingScenery, inMeadowOpening, trailDistance } from '../src/clearings.js';

const reach = 2, playerRadius = .45;
const brookDistance = (x, z) => {
  let best = Infinity;
  for (let i = 1; i < BROOK.length; i++) {
    const [ax, az] = BROOK[i - 1], [bx, bz] = BROOK[i], dx = bx - ax, dz = bz - az;
    const t = Math.min(1, Math.max(0, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    best = Math.min(best, Math.hypot(x - ax - t * dx, z - az - t * dz));
  }
  return best;
};

test('free-standing clearing art stays off the trails, outside every interaction reach, and clear of collision', () => {
  // Rejects decoration placed on the route or where it would crowd an interaction prompt.
  for (const piece of freeStandingScenery()) {
    assert.ok(trailDistance(piece.x, piece.z) >= piece.clearance, `${piece.id} at ${piece.x},${piece.z} sits on a trail`);
    for (const target of INTERACTIONS) {
      assert.ok(Math.hypot(piece.x - target.x, piece.z - target.z) > reach + playerRadius, `${piece.id} crowds ${target.id}`);
    }
    for (const obstacle of OBSTACLES) assert.ok(Math.hypot(piece.x - obstacle.x, piece.z - obstacle.z) > obstacle.radius + 1, `${piece.id} overlaps an obstacle`);
  }
});

test('garden and practice pieces stay with their own interaction and off the walking surface', () => {
  const others = id => INTERACTIONS.filter(target => target.id !== id && !(id === 'woodland' && target.id === 'potato-4'));
  for (const [x, z] of WOODLAND_MUSHROOMS) {
    assert.ok(trailDistance(x, z) > 1.2, `woodland mushroom at ${x},${z} sits on the trail`);
    for (const target of others('woodland')) assert.ok(Math.hypot(x - target.x, z - target.z) > reach, `mushroom crowds ${target.id}`);
  }
  assert.ok(MEADOW_TUFTS.length >= 10, 'the meadow garden has a grass patch for its wave');
  for (const tuft of MEADOW_TUFTS) assert.ok(trailDistance(tuft.x, tuft.z) > 1.35 && tuft.u >= 0 && tuft.u <= 1);
  assert.ok(MEADOW_TUFTS.some(tuft => tuft.u === 0) && MEADOW_TUFTS.some(tuft => tuft.u === 1));
  for (const [x, z] of [COTTAGE_ART.can, ...COTTAGE_ART.sprouts]) {
    assert.ok(trailDistance(x, z) > 1.4);
    for (const target of others('cottage')) assert.ok(Math.hypot(x - target.x, z - target.z) > reach, `cottage garden art crowds ${target.id}`);
  }
  assert.equal(Object.keys(PRACTICE_ART).length, 3);
  for (const spot of PRACTICE_SPOTS) {
    const [mx, mz] = PRACTICE_ART[spot.id].marker;
    assert.ok(Math.hypot(mx - spot.x, mz - spot.z) < 1, 'each marker sits at its spot');
    assert.ok(mx + mz < spot.x + spot.z, 'the marker stands behind the spot, never in front of Hana');
    for (const target of INTERACTIONS.filter(target => target.id !== spot.id)) {
      assert.ok(Math.hypot(mx - target.x, mz - target.z) > reach, `${spot.id} marker crowds ${target.id}`);
    }
    const { birch, animal } = PRACTICE_ART[spot.id].response;
    for (const point of [birch, animal].filter(Boolean)) assert.ok(point[0] + point[1] < spot.x + spot.z, 'a responder stands behind its spot');
  }
  const [wx, wz] = PRACTICE_ART['practice-rain'].response.water;
  assert.ok(brookDistance(wx, wz) < 1, 'the reflection blooms on the brook itself');
});

test('the brook roots line the bank between the trail and the water', () => {
  for (const [x, z] of BROOK_ART.roots) {
    const fromWater = brookDistance(x, z);
    assert.ok(fromWater > .9 && fromWater < 2.4, `roots at ${x},${z} are ${fromWater.toFixed(2)} from the water`);
  }
  for (const [x, z] of BROOK_ART.reflections) assert.ok(brookDistance(x, z) < .9, 'reflections stay on the water');
});

test('the open meadow removes only decorative trees, never a collision shape or an encounter', () => {
  for (const obstacle of OBSTACLES) assert.equal(inMeadowOpening(obstacle.x, obstacle.z), false, `obstacle ${obstacle.x},${obstacle.z} would vanish`);
  // The opening is the meadow strip itself, north of the meadow line.
  for (const target of [FAIRIES[1], CREATURES.find(c => c.id === 'deer'), POTATOES.find(p => p.id === 'potato-5')]) {
    assert.equal(inMeadowOpening(target.x, target.z - 2), true, `${target.id} stands in the open meadow`);
  }
  for (const target of [FAIRIES[0], FAIRIES[2], CREATURES.find(c => c.id === 'owl'), SONG_SITES[0]]) {
    assert.equal(inMeadowOpening(target.x, target.z), false, `${target.id} keeps its surrounding forest`);
  }
  // The grove's pale trunks stand behind its trail and fairy.
  for (const [x, z] of GROVE.birches) assert.ok(x + z < FAIRIES[0].x + FAIRIES[0].z + 2);
});

test('window callbacks sit inside the two back windows', () => {
  const windows = [-3.4, 6.2];
  for (const [id, slot] of Object.entries(WINDOW_CALLBACKS)) {
    assert.ok(CREATURES.some(creature => creature.id === id));
    const center = windows.find(x => Math.abs(slot.x - x) < 1.225);
    assert.ok(center !== undefined, `${id} is outside a window`);
    assert.ok(Math.abs(slot.x - center) + slot.size / 2 <= 1.3, `${id} spills past the window frame`);
    assert.ok(slot.y >= 1.85 && slot.y + slot.size <= 3.45, `${id} spills above or below the glass`);
  }
});

test('no spot inside a singing spot’s reach also reaches another target', () => {
  // Rejects a practice spot placed where its prompt could hide a fairy, garden, or animal.
  for (const spot of PRACTICE_SPOTS) {
    for (const target of INTERACTIONS.filter(target => target.id !== spot.id)) {
      assert.ok(Math.hypot(spot.x - target.x, spot.z - target.z) > 2 * reach, `${spot.id} shares reach with ${target.id}`);
    }
  }
});
