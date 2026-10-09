export const BOUNDS = { minX: -33, maxX: 33, minZ: -39, maxZ: 26 };
export const START = { x: 0, z: 15 };
export const HOME = { id: 'home', x: 0, z: 18, name: 'Hana’s cottage' };
export const POTATOES = [
  { id: 'potato-1', x: -4, z: 12, name: 'Cottage garden' },
  { id: 'potato-2', x: -15, z: 1, name: 'Old garden' },
  { id: 'potato-3', x: -23, z: -10, name: 'Birch clearing' },
  { id: 'potato-4', x: -13, z: -27, name: 'Woodland garden' },
  { id: 'potato-5', x: 16, z: -27, name: 'Upper meadow' },
  { id: 'potato-6', x: 22, z: -2, name: 'Streamside garden' },
];
export const FAIRIES = [
  { id: 'fairy-birch', x: -23, z: -17, name: 'Běla', place: 'Birch grove', color: '#ffeac3', message: 'Běla remembers your song. A tear of joy glimmers in the grass.' },
  { id: 'fairy-ridge', x: 5, z: -32, name: 'Jitřenka', place: 'Mountain meadow', color: '#ffcfb1', message: 'Jitřenka sings along. She leaves a little drop of morning light.' },
  { id: 'fairy-stream', x: 24, z: -13, name: 'Rusalka', place: 'Silver brook', color: '#bce9e7', message: 'Rusalka’s laughter ripples across the water. A tear of joy is yours.' },
];
export const LANDMARKS = [HOME,
  { id: 'grove', x: -23, z: -17, name: 'Birch grove' },
  { id: 'meadow', x: 5, z: -32, name: 'Mountain meadow' },
  { id: 'brook', x: 24, z: -13, name: 'Silver brook' },
];
export const CREATURES = [
  { id: 'fox', x: -12, z: -1, name: 'Liška', englishName: 'Fox', theme: 'What belongs to us?' },
  { id: 'owl', x: -19, z: -25, name: 'Sova', englishName: 'Owl', theme: 'What do we know?' },
  { id: 'deer', x: 11, z: -31, name: 'Srna', englishName: 'Deer', theme: 'What does kindness change?' },
  { id: 'badger', x: 15, z: 2, name: 'Jezevec', englishName: 'Badger', theme: 'What makes a home?' },
];
export const TRAILS = [
  [[0,18],[0,10],[-10,3],[-19,-4],[-23,-16],[-15,-26],[5,-32],[16,-27],[23,-14],[23,-3],[12,7],[0,10]],
  [[-10,3],[-6,-8],[2,-14],[13,-14],[23,-14]],
];
export const BROOK = [[32, -47], [30, -37], [32, -28], [30, -21], [28.5, -14], [29.5, -6], [31, 3], [34, 12], [38, 22], [43, 35]];
// Shared obstacles keep the drawn world and walkable world in agreement.
export const OBSTACLES = [
  { x: 0, z: 21, radius: 2.35, type: 'cottage' },
  { x: -9, z: 12, radius: 0.75, type: 'tree' },
  { x: 5, z: 13, radius: 0.7, type: 'tree' },
  { x: -28, z: 0, radius: 0.85, type: 'tree' },
  { x: -16, z: -15, radius: 0.65, type: 'tree' },
  { x: -4, z: -23, radius: 0.8, type: 'tree' },
  { x: 14, z: -20, radius: 0.65, type: 'tree' },
  { x: 28, z: 8, radius: 0.8, type: 'tree' },
  { x: 0, z: -2, radius: 0.8, type: 'rock' },
];
export const HOUSE_BOUNDS = { minX: -10, maxX: 10, minZ: -8, maxZ: 8 };
export const HOUSE_START = { x: 0, z: 5 };
export const HOUSE_TARGETS = [
  { id: 'john', x: -6, z: 0 },
  { id: 'aldo', x: 6, z: 0 },
  { id: 'prepare', x: -6, z: -5 },
  { id: 'cook', x: 0, z: -5 },
  { id: 'serve', x: 5, z: -5 },
];
// Furniture is kept behind each interaction spot, with a clear central aisle.
export const HOUSE_OBSTACLES = [
  { id: 'cot', x: 6, z: -2.2, radius: 1.45 },
  { id: 'worktop', x: -6, z: -6.7, radius: 1.15 },
  { id: 'stove', x: 0, z: -6.7, radius: 1.15 },
  { id: 'table', x: 5, z: -6.7, radius: 1.15 },
];
export function regionAt({ x, z }) {
  if (z > 10) return 'Cottage garden';
  if (z < -24) return 'Mountain meadow';
  if (x < -13) return 'Birch grove';
  if (x > 16) return 'Silver brook';
  return 'Blue-marked trail';
}
