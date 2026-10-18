import test from 'node:test';
import assert from 'node:assert/strict';
import { footAnchorX } from '../src/characters.js';

test('a small reaching hand at sole height cannot pull the boot anchor sideways', () => {
  const width = 100, pixels = new Uint8ClampedArray(width * 100 * 4);
  const fill = (left, right, top, bottom, alpha = 255) => {
    for (let y = top; y <= bottom; y++) for (let x = left; x <= right; x++) pixels[(y * width + x) * 4 + 3] = alpha;
  };
  fill(40, 59, 90, 99);
  const resting = footAnchorX(pixels, width, 0, 99);
  fill(85, 87, 97, 99);
  const reaching = footAnchorX(pixels, width, 0, 99);
  assert.ok(Math.abs(reaching - resting) <= 2, 'Outer-edge centering wrongly follows the outlying hand.');
  assert.ok(reaching >= 48 && reaching <= 51);
  fill(0, 10, 94, 99, 50);
  assert.equal(footAnchorX(pixels, width, 0, 99), reaching, 'Faint pixels below the artwork threshold cannot move the feet.');
});
