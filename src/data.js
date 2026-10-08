export const BOUNDS = { minX: -24, maxX: 24, minZ: -26, maxZ: 23 };
export const START = { x: 0, z: 15 };
export const HOME = { id: 'home', x: 0, z: 18, name: 'Hana’s cottage' };
export const POTATOES = [
  { id: 'potato-1', x: -4, z: 12, name: 'Cottage garden' },
  { id: 'potato-2', x: -11, z: 6, name: 'Old garden' },
  { id: 'potato-3', x: -16, z: -4, name: 'Birch clearing' },
  { id: 'potato-4', x: -7, z: -16, name: 'Woodland garden' },
  { id: 'potato-5', x: 11, z: -17, name: 'Upper meadow' },
  { id: 'potato-6', x: 15, z: 1, name: 'Streamside garden' },
];
export const FAIRIES = [
  { id: 'fairy-birch', x: -16, z: -9, name: 'Běla', place: 'Birch grove', color: '#ffeac3', message: 'Běla remembers your song. A tear of joy glimmers in the grass.' },
  { id: 'fairy-ridge', x: 4, z: -21, name: 'Jitřenka', place: 'Mountain meadow', color: '#ffcfb1', message: 'Jitřenka sings along. She leaves a little drop of morning light.' },
  { id: 'fairy-stream', x: 16, z: -6, name: 'Rusalka', place: 'Silver brook', color: '#bce9e7', message: 'Rusalka’s laughter ripples across the water. A tear of joy is yours.' },
];
export const LANDMARKS = [HOME,
  { id: 'grove', x: -16, z: -9, name: 'Birch grove' },
  { id: 'meadow', x: 4, z: -21, name: 'Mountain meadow' },
  { id: 'brook', x: 16, z: -6, name: 'Silver brook' },
];
export const CREATURES = [
  { id: 'fox', x: -9, z: 2, name: 'Liška', englishName: 'Fox', theme: 'What belongs to us?' },
  { id: 'owl', x: -12, z: -13, name: 'Sova', englishName: 'Owl', theme: 'What do we know?' },
  { id: 'deer', x: 8, z: -19, name: 'Srna', englishName: 'Deer', theme: 'What does kindness change?' },
];
export const TRAILS = [
  [[0,18],[0,10],[-7,5],[-13,0],[-16,-9],[-10,-16],[4,-21],[11,-17],[15,-7],[15,1],[8,7],[0,10]],
  [[-7,5],[-4,-3],[2,-7],[10,-7],[15,-7]],
];
// Shared obstacles keep the drawn world and walkable world in agreement.
export const OBSTACLES = [
  { x: 0, z: 21, radius: 2.35, type: 'cottage' },
  { x: -9, z: 12, radius: 0.75, type: 'tree' },
  { x: 5, z: 13, radius: 0.7, type: 'tree' },
  { x: -19, z: 1, radius: 0.85, type: 'tree' },
  { x: -11, z: -7, radius: 0.65, type: 'tree' },
  { x: -3, z: -12, radius: 0.8, type: 'tree' },
  { x: 8, z: -11, radius: 0.65, type: 'tree' },
  { x: 19, z: 8, radius: 0.8, type: 'tree' },
  { x: 0, z: -2, radius: 0.8, type: 'rock' },
];
export function regionAt({ x, z }) {
  if (z > 10) return 'Cottage garden';
  if (z < -15) return 'Mountain meadow';
  if (x < -9) return 'Birch grove';
  if (x > 10) return 'Silver brook';
  return 'Blue-marked trail';
}
