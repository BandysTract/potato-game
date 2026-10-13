import test from 'node:test';
import assert from 'node:assert/strict';
import { BOUNDS, START, HOME, POTATOES, FAIRIES, CREATURES, TRAILS, OBSTACLES, HOUSE_BOUNDS, HOUSE_START, HOUSE_TARGETS, HOUSE_OBSTACLES, SONGS, SONG_SITES, HOUSE_CAT } from '../src/data.js';

const playerRadius = .45;
const lengthOf = points => points.slice(1).reduce((sum, point, i) => sum + Math.hypot(point[0] - points[i][0], point[1] - points[i][1]), 0);

function free(point, bounds, obstacles) {
  return point.x >= bounds.minX + playerRadius && point.x <= bounds.maxX - playerRadius
    && point.z >= bounds.minZ + playerRadius && point.z <= bounds.maxZ - playerRadius
    && obstacles.every(obstacle => Math.hypot(point.x - obstacle.x, point.z - obstacle.z) >= obstacle.radius + playerRadius);
}

// A half-unit walking grid catches furniture that cuts off a station or an aisle.
function reachable(start, bounds, obstacles) {
  const seen = new Set([`${start.x},${start.z}`]), queue = [start];
  for (let index = 0; index < queue.length; index++) {
    const point = queue[index];
    for (const [dx, dz] of [[.5, 0], [-.5, 0], [0, .5], [0, -.5]]) {
      const next = { x: point.x + dx, z: point.z + dz }, key = `${next.x},${next.z}`;
      if (!seen.has(key) && free(next, bounds, obstacles)) { seen.add(key); queue.push(next); }
    }
  }
  return seen;
}

test('forest loop grows 35% to 45% while keeping its connected return and encounter counts', () => {
  // Rejects the tempting change of expanding only the boundary around the old loop.
  const oldLoopLength = 94.58115669324378;
  const loop = TRAILS[0].slice(1);
  const ratio = lengthOf(loop) / oldLoopLength;
  assert.ok(ratio >= 1.35 && ratio <= 1.45, `loop growth must be 35% to 45%, got ${((ratio - 1) * 100).toFixed(1)}%`);
  assert.deepEqual(loop[0], loop.at(-1), 'the main route returns to the cottage trail');
  assert.deepEqual(TRAILS[0][0], [HOME.x, HOME.z]);
  assert.equal(POTATOES.length, 6);
  assert.equal(FAIRIES.length, 3);
  assert.equal(CREATURES.length, 4);
  assert.deepEqual(CREATURES.map(({ id }) => id), ['fox', 'owl', 'deer', 'badger']);
});

test('every outdoor encounter remains clear and reachable within the enlarged walking bounds', () => {
  const visited = reachable(START, BOUNDS, OBSTACLES);
  for (const target of [...POTATOES, ...FAIRIES, ...CREATURES, ...SONG_SITES, HOME]) {
    assert.ok(free(target, BOUNDS, OBSTACLES), `${target.id} overlaps an obstacle or boundary`);
    assert.ok(visited.has(`${target.x},${target.z}`), `${target.id} is cut off from the cottage`);
  }
  for (const trail of TRAILS) for (const [x, z] of trail) assert.ok(free({ x, z }, BOUNDS, OBSTACLES), `trail at ${x},${z} is blocked`);
});

test('the family and all dinner stations have a clear approach from the house entrance', () => {
  // Rejects furniture centered on its own interaction spot or across the aisle.
  assert.deepEqual(HOUSE_TARGETS.map(target => target.id), ['john', 'aldo', 'prepare', 'cook', 'serve']);
  assert.ok(free(HOUSE_START, HOUSE_BOUNDS, HOUSE_OBSTACLES));
  const visited = reachable(HOUSE_START, HOUSE_BOUNDS, HOUSE_OBSTACLES);
  for (const target of HOUSE_TARGETS) {
    assert.ok(free(target, HOUSE_BOUNDS, HOUSE_OBSTACLES), `${target.id} station is blocked by furniture`);
    assert.ok(visited.has(`${target.x},${target.z}`), `${target.id} has no clear approach`);
  }
  assert.ok(free(HOUSE_CAT, HOUSE_BOUNDS, HOUSE_OBSTACLES), 'Percy is blocked by furniture.');
  assert.ok([...visited].some(key => {
    const [x, z] = key.split(',').map(Number);
    return Math.hypot(x - HOUSE_CAT.x, z - HOUSE_CAT.z) <= .5;
  }), 'Percy has no clear approach.');
});


test('each song has a freely reachable fairy and the restoration gates only the two named potatoes', () => {
  assert.equal(SONGS.length, 3);
  assert.equal(SONG_SITES.length, 3);
  assert.deepEqual(SONG_SITES.filter(site => site.potatoId).map(site => site.potatoId).sort(), ['potato-4', 'potato-5']);
  assert.equal(new Set(SONGS.map(song => song.fairyId)).size, FAIRIES.length);
  for (const song of SONGS) assert.ok(FAIRIES.some(fairy => fairy.id === song.fairyId));
  for (const site of SONG_SITES) {
    assert.ok(SONGS.some(song => song.id === site.songId));
    if (site.potatoId) {
      const potato = POTATOES.find(potato => potato.id === site.potatoId);
      assert.ok(potato);
      assert.equal(potato.x, site.x);
      assert.equal(potato.z, site.z);
    }
  }
  assert.equal(SONG_SITES.find(site => site.id === 'cottage').songId, 'rain');
  assert.equal(HOUSE_CAT.id, 'percy');
});
