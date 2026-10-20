import { CREATURES, FAIRIES, HOME, POTATOES, PRACTICE_SPOTS, SONG_SITES, START, TRAILS } from './data.js';

// Placement for the clearing art. None of it collides, and every free-standing
// piece keeps clear of the drawn trails and of other interactions.
export const SCREEN_RIGHT = [Math.SQRT1_2, -Math.SQRT1_2];
export const TOWARD_CAMERA = [Math.SQRT1_2, Math.SQRT1_2];

function distanceToSegment(x, z, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const t = Math.min(1, Math.max(0, ((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz)));
  return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
}
export function trailDistance(x, z) {
  let result = Infinity;
  for (const trail of TRAILS) for (let i = 1; i < trail.length; i++) result = Math.min(result, distanceToSegment(x, z, trail[i - 1], trail[i]));
  return result;
}

// Birch grove: pale painted trunks stand behind the trail, around enclosed light.
export const GROVE = {
  light: { x: -24.6, z: -16.8, width: 11, depth: 8.5 },
  birches: [[-28.6, -12.4, 1], [-29.6, -17.6, 1.1], [-28.2, -22.2, .95], [-26.4, -26.2, 1.05], [-30.8, -14.8, .85], [-31, -20.4, .9]],
  shafts: [[-26.2, -14.2], [-27.6, -18.6], [-25.8, -21.6]],
  center: { x: -24.5, z: -17.5, radius: 7.5 },
};

// The meadow stays open to the north, so no extra trees grow in this strip.
export function inMeadowOpening(x, z) {
  return x > -9 && x < 25 && z > -54 && z < -27.5 + x * .2;
}
export const MEADOW = { light: { x: 9, z: -31.5, width: 16, depth: 9 } };

// Brook: dark roots on the trail-side bank and a few still reflections.
export const BROOK_ART = {
  roots: [[27.8, -20.2], [27.5, -11.2], [28.3, -4.8]],
  reflections: [[28.7, -17.2, 1.3], [29.1, -9.6, 1.1], [29.8, -1.6, 1.2]],
};

// One small marker beside each practice spot, plus its single response.
export const PRACTICE_ART = Object.fromEntries(PRACTICE_SPOTS.map(spot => [spot.id, {
  marker: [spot.x - .62, spot.z - .62],
  response: spot.response === 'bird' ? { birch: [spot.x - 2.2, spot.z - 1.4] }
    : spot.response === 'animal' ? { animal: [spot.x - 2.1, spot.z - 1.9] }
      : { water: [spot.x + 3.3, spot.z + .1] },
}]));

// Garden pieces sit around each garden's own ring.
const woodland = SONG_SITES.find(site => site.id === 'woodland');
export const WOODLAND_MUSHROOMS = [[-1.55, -1.25, 1], [-.55, -1.85, 1.1], [.6, -1.9, .95], [1.45, -1.5, .62]].map(([dx, dz, size]) => [woodland.x + dx, woodland.z + dz, size]);

const meadow = SONG_SITES.find(site => site.id === 'meadow');
// Grass ringing the meadow garden, kept off the trail surface.
export const MEADOW_TUFTS = (() => {
  const tufts = [];
  for (let i = 0; i < 22 && tufts.length < 14; i++) {
    const angle = Math.PI * .75 + i / 21 * Math.PI * 1.5, radius = 2.15 + (i % 3) * .42;
    const x = meadow.x + Math.cos(angle) * radius, z = meadow.z + Math.sin(angle) * radius * .8;
    if (trailDistance(x, z) > 1.35) tufts.push([x, z]);
  }
  const across = tufts.map(([x, z]) => x * SCREEN_RIGHT[0] + z * SCREEN_RIGHT[1]);
  const min = Math.min(...across), max = Math.max(...across);
  return tufts.map(([x, z], i) => ({ x, z, u: (across[i] - min) / (max - min) }));
})();

const cottage = SONG_SITES.find(site => site.id === 'cottage');
export const COTTAGE_ART = {
  can: [cottage.x + 2.4, cottage.z - .55],
  sprouts: [[cottage.x - .9, cottage.z - .2], [cottage.x + .1, cottage.z + .25], [cottage.x + 1.0, cottage.z - .3]],
  fenceGlints: [[3.8, 20.5], [4.7, 20.5], [5.5, 20.5]],
};

// Animals who were answered may look in at supper, through the back windows.
export const WINDOW_CALLBACKS = {
  fox: { x: 5.55, y: 1.9, size: 1.05, flip: false },
  badger: { x: 6.85, y: 1.9, size: 1.0, flip: true },
  deer: { x: -4.05, y: 1.9, size: 1.1, flip: false },
  owl: { x: -2.75, y: 1.9, size: .95, flip: true },
};

// Free-standing pieces for clearance checks. Garden and marker pieces belong to
// their own interaction and are checked against the others.
export function freeStandingScenery() {
  return [
    ...GROVE.birches.map(([x, z]) => ({ id: 'grove-birch', x, z, clearance: 2.5 })),
    ...BROOK_ART.roots.map(([x, z]) => ({ id: 'brook-roots', x, z, clearance: 1.6 })),
    ...Object.entries(PRACTICE_ART).flatMap(([id, art]) => [
      art.response.birch && { id: `${id}-birch`, x: art.response.birch[0], z: art.response.birch[1], clearance: 2.0 },
      art.response.animal && { id: `${id}-animal`, x: art.response.animal[0], z: art.response.animal[1], clearance: 1.6 },
    ].filter(Boolean)),
    { id: 'watering-can', x: COTTAGE_ART.can[0], z: COTTAGE_ART.can[1], clearance: 1.4 },
  ];
}

export const INTERACTIONS = [...POTATOES, ...FAIRIES, ...CREATURES, ...SONG_SITES, ...PRACTICE_SPOTS, HOME, START];
