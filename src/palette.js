import * as THREE from 'three';
import { SONG_SITES } from './data.js';

// Outdoor light follows restored gardens, never the clock. Each chapter is a
// multiplier on a material's recorded base color, so repeated chapter changes
// and resets always return to exactly the same values.
export const CHAPTERS = [
  { id: 'morning', tint: [1, 1, 1], pool: '#fff3cf', poolOpacity: .2 },
  { id: 'warmer', tint: [1.035, 1, .92], pool: '#ffe6ad', poolOpacity: .24 },
  { id: 'late-afternoon', tint: [1.05, .94, .8], pool: '#ffcf8a', poolOpacity: .28 },
  { id: 'early-evening', tint: [.82, .8, .93], pool: '#f6c2a4', poolOpacity: .22 },
];

// Counts each known garden once, without building a collection on every frame.
export function chapterFor(game) {
  const restored = game?.restoredSites || [];
  let count = 0;
  for (const site of SONG_SITES) if (restored.includes(site.id)) count++;
  return Math.min(CHAPTERS.length - 1, count);
}

// Records each material's base color once. Later calls for the same material are ignored.
export function createPalette() {
  const records = [];
  const seen = new Set();
  const tints = CHAPTERS.map(({ tint }) => new THREE.Color(...tint));
  let applied = null;
  return {
    records,
    add(material) {
      if (!material?.color || seen.has(material)) return material;
      seen.add(material);
      records.push({ material, base: material.color.clone() });
      return material;
    },
    // Colors that are not materials, such as the sky, use the same rule.
    addColor(color) {
      if (!color?.isColor || seen.has(color)) return color;
      seen.add(color);
      records.push({ color, base: color.clone() });
      return color;
    },
    apply(chapter) {
      const index = THREE.MathUtils.clamp(chapter | 0, 0, CHAPTERS.length - 1);
      if (index === applied) return false;
      for (const record of records) (record.material ? record.material.color : record.color).copy(record.base).multiply(tints[index]);
      applied = index;
      return true;
    },
    get chapter() { return applied; },
  };
}
