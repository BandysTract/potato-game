import * as THREE from 'three';

// One atlas load per character sheet. Frames are prepared once, never per tick.
export function createPaintedCharacters() {
  const textures = [];
  let disposed = false;
  const jobs = [];
  // fitGroup names the character or walking direction of each cell. Mirrored
  // frames repeat the first cells, facing the other way.
  function atlas(url, columns, rows, fitGroup = null, mirrored = 0, columnEdges = null, rowEdges = null) {
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
          return { minX, maxX, top, bottom };
        });
        // Each group's tallest pose sets its scale, so a standing figure keeps one
        // height across sheets, even beside a taller character.
        const tallest = new Map();
        bounds.forEach((bound, index) => {
          const group = fitGroup?.(index);
          tallest.set(group, Math.max(tallest.get(group) || 0, bound.bottom - bound.top + 1));
        });
        frames.forEach((texture, index) => {
          const cell = index % cells;
          const { minX, maxX, bottom } = bounds[cell];
          const scale = 350 / (fitGroup ? tallest.get(fitGroup(cell)) : cellHeight);
          const target = texture.image.getContext('2d');
          if (index >= cells) target.setTransform(-1, 0, 0, 1, 384, 0);
          // A shared scale preserves crouching and sitting height. Align feet and
          // centers without stretching a bent pose into a full-height person.
          const rect = rectFor(cell);
          target.drawImage(image, ...rect, 192 - (minX + maxX) / 2 * scale,
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
  // The repair strip has wider room for Hana’s crown and bouquet.
  const headroom = atlas('/assets/characters/actions-headroom.png', 3, 1, frame => frame === 0 ? 'hana' : 'john', 0, [0, .42, .67, 1]);

  const cat = atlas('/assets/characters/percy.png', 3, 2);
  // Rows are Hana, then John. Frames 6 to 8 mirror Hana's idle frames to face left.
  const idle = atlas('/assets/characters/idle.png', 3, 2, frame => Math.floor(frame / 3), 3);
  const foliage = atlas('/assets/characters/foliage.png', 2, 2);
  return { walk, walkFrameCount, actions: [...actions.slice(0, 8), ...headroom, actions[11]], cat, idle, foliage, ready: Promise.all(jobs), dispose() {
    disposed = true;
    textures.forEach(texture => texture.dispose());
  } };
}
