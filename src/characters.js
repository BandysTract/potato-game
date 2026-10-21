import * as THREE from 'three';

export function footAnchorX(pixels, width, top, bottom) {
  // A reaching hand can share the soles' height. The median keeps a small
  // outlying hand from dragging the planted boots sideways.
  const weights = new Float64Array(width);
  let total = 0;
  for (let y = Math.floor(bottom - (bottom - top) * .05); y <= bottom; y++) for (let x = 0; x < width; x++) {
    const alpha = pixels[(y * width + x) * 4 + 3];
    if (alpha > 100) { weights[x] += alpha; total += alpha; }
  }
  let accumulated = 0;
  for (let x = 0; x < width; x++) {
    accumulated += weights[x];
    if (accumulated >= total / 2) return x;
  }
}

// One atlas load per character sheet. Frames are prepared once, never per tick.
export function createPaintedCharacters() {
  const textures = [];
  let disposed = false;
  const jobs = [];
  // fitGroup names the character or walking direction of each cell. Mirrored
  // frames repeat the first cells, facing the other way.
  function atlas(url, columns, rows, fitGroup = null, mirrored = 0, columnEdges = null, rowEdges = null, fitWidth = false, anchorFeet = false) {
    const cells = columns * rows;
    const frames = Array.from({ length: cells + mirrored }, () => {
      const canvas = document.createElement('canvas');
      canvas.width = 384; canvas.height = 384;
      const texture = new THREE.CanvasTexture(canvas);
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.minFilter = THREE.LinearMipmapLinearFilter;
      textures.push(texture);
      return texture;
    });
    jobs.push(new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => {
        if (disposed) { resolve(); return; }
        const cellWidth = image.width / columns, cellHeight = image.height / rows;
        const rectFor = index => {
          const column = index % columns;
          const row = Math.floor(index / columns);
          const left = columnEdges ? columnEdges[column] * image.width : column * cellWidth;
          const width = columnEdges ? (columnEdges[column + 1] - columnEdges[column]) * image.width : cellWidth;
          const top = rowEdges ? rowEdges[row] * image.height : row * cellHeight;
          const height = rowEdges ? (rowEdges[row + 1] - rowEdges[row]) * image.height : cellHeight;
          return [left, top, width, height];
        };
        const scratch = document.createElement('canvas');
        scratch.width = Math.floor(cellWidth); scratch.height = Math.floor(cellHeight);
        const context = scratch.getContext('2d', { willReadFrequently: true });
        const bounds = frames.slice(0, cells).map((texture, index) => {
          const rect = rectFor(index);
          scratch.width = Math.ceil(rect[2]);
          scratch.height = Math.ceil(rect[3]);
          context.clearRect(0, 0, scratch.width, scratch.height);
          context.drawImage(image, ...rect, 0, 0, rect[2], rect[3]);
          const pixels = context.getImageData(0, 0, scratch.width, scratch.height).data;
          let minX = scratch.width, maxX = 0, top = scratch.height, bottom = 0;
          for (let y = 0; y < scratch.height; y++) for (let x = 0; x < scratch.width; x++) {
            if (pixels[(y * scratch.width + x) * 4 + 3] > 100) {
              minX = Math.min(minX, x); maxX = Math.max(maxX, x); top = Math.min(top, y); bottom = Math.max(bottom, y);
            }
          }
          const centerX = anchorFeet ? footAnchorX(pixels, scratch.width, top, bottom) : (minX + maxX) / 2;
          return { minX, maxX, top, bottom, centerX };
        });
        // Each group's tallest pose sets its scale, so a standing figure keeps one
        // height across sheets, even beside a taller character.
        const tallest = new Map();
        const widest = new Map();
        bounds.forEach((bound, index) => {
          const group = fitGroup?.(index);
          tallest.set(group, Math.max(tallest.get(group) || 0, bound.bottom - bound.top + 1));
          widest.set(group, Math.max(widest.get(group) || 0, bound.maxX - bound.minX + 1));
        });
        frames.forEach((texture, index) => {
          const cell = index % cells;
          const { centerX, bottom } = bounds[cell];
          const scale = Math.min(350 / (fitGroup ? tallest.get(fitGroup(cell)) : cellHeight),
            fitWidth ? 350 / widest.get(fitGroup?.(cell)) : Infinity);
          const target = texture.image.getContext('2d');
          if (index >= cells) target.setTransform(-1, 0, 0, 1, 384, 0);
          // A shared scale preserves crouching and sitting height. Align feet and
          // centers without stretching a bent pose into a full-height person.
          const rect = rectFor(cell);
          target.drawImage(image, ...rect, 192 - centerX * scale,
            380 - bottom * scale, rect[2] * scale, rect[3] * scale);
          texture.needsUpdate = true;
        });
        resolve();
      };
      image.onerror = () => reject(new Error(`Character artwork unavailable: ${url}`));
      image.src = url;
    }));
    return frames;
  }
  const walkFrameCount = 8;
  const walk = [
    ...atlas('/assets/characters/hana-walk-front.png', 4, 2, () => 'hana', walkFrameCount),
    // The rear sheet's transparent row gutter sits above its halfway point.
    ...atlas('/assets/characters/hana-walk-back.png', 4, 2, () => 'hana', walkFrameCount, null, [0, .47, 1]),
  ];
  const actions = atlas('/assets/characters/actions.png', 4, 3, frame => frame < 9 ? 'hana' : 'john');
  // Cell 10 duplicates the basket. Keep the coherent eleven-pose action.
  const gather = atlas('/assets/characters/hana-gather-fluid.png', 4, 3, () => 'hana', 0,
    [0, 407 / 1448, 725 / 1448, 1065 / 1448, 1], [0, 376 / 1086, 693 / 1086, 1], false, true).filter((_, index) => index !== 10);
  const singFrameCount = 12, petFrameCount = 12;
  const sing = atlas('/assets/characters/hana-sing-fluid.png', 4, 3, () => 'hana', singFrameCount, null, null, false, true);
  const pet = atlas('/assets/characters/hana-pet-fluid.png', 4, 3, () => 'hana', petFrameCount, null, [0, 410 / 1086, 716 / 1086, 1], false, true);
  const fairyColumns = [[0, 440, 812, 1144, 1536], [0, 442, 798, 1150, 1536], [0, 384, 768, 1152, 1536]];
  const fairies = ['birch', 'ridge', 'stream'].map((kind, index) =>
    atlas(`/assets/characters/fairy-${kind}-fluid.png`, 4, 2, () => kind, 0,
      fairyColumns[index].map(edge => edge / 1536), [0, (index === 1 ? 520 : 523) / 1024, 1], true));
  const creatureFrameCount = 6;
  const creatures = ['fox', 'owl', 'deer', 'badger'].map(kind =>
    atlas(`/assets/characters/${kind}-fluid.png`, 3, 2, () => kind, creatureFrameCount, null, null, true));
  // The repair strip has wider room for Hana’s crown and bouquet.
  const headroom = atlas('/assets/characters/actions-headroom.png', 3, 1, frame => frame === 0 ? 'hana' : 'john', 0, [0, .42, .67, 1]);

  const hanaDance = atlas('/assets/characters/hana-dance-storybook.png', 4, 2, () => 'hana', 8, null, null, true, true);
  const johnDance = atlas('/assets/characters/john-dance-storybook.png', 4, 2, () => 'john', 0, null, null, true, true);
  const household = atlas('/assets/characters/family-care-storybook.png', 4, 2, frame => frame < 4 ? 'hana' : 'john', 0, null, [0, 455 / 887, 1], false, true);
  const care = household.slice(0, 4), bowls = household.slice(4);
  const cat = atlas('/assets/characters/percy.png', 3, 2);
  // Rows are Hana, then John. Frames 6 to 8 mirror Hana's idle frames to face left.
  const idle = atlas('/assets/characters/idle.png', 3, 2, frame => Math.floor(frame / 3), 3);
  const foliage = atlas('/assets/characters/foliage.png', 2, 2);
  return { hanaDance, johnDance, care, bowls, walk, walkFrameCount, gather, gatherPickupProgress: 5 / gather.length, sing, singFrameCount, pet, petFrameCount, fairies, creatures, creatureFrameCount, actions: [...actions.slice(0, 8), ...headroom, actions[11]], cat, idle, foliage, ready: Promise.all(jobs), dispose() {
    disposed = true;
    textures.forEach(texture => texture.dispose());
  } };
}
