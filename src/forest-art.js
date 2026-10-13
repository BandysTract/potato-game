import * as THREE from 'three';

// Two shared bark maps are painted once, rather than stretched furniture grain.
export function barkTexture(birch = false) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 1024;
  const c = canvas.getContext('2d');
  let seed = birch ? 93 : 41;
  const random = () => { seed = (seed * 1664525 + 1013904223) >>> 0; return seed / 4294967296; };
  c.fillStyle = birch ? '#c7c4aa' : '#806d55'; c.fillRect(0, 0, 512, 1024);
  for (let i = 0; i < 1100; i++) {
    const x = random() * 512, y = random() * 1024;
    const w = 2 + random() * 12, h = 10 + random() * 85;
    c.fillStyle = birch ? ['#eee7cc65', '#938e7545', '#ffefd745'][i % 3]
      : ['#b3a07b70', '#52483970', '#a88a6255', '#c5ad8130'][i % 4];
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + w, y + 3);
    c.lineTo(x + w - 2, y + h); c.lineTo(x - 2, y + h - 6); c.fill();
    if (!birch) {
      c.strokeStyle = '#342f2855'; c.lineWidth = 1;
      c.beginPath(); c.moveTo(x, y); c.lineTo(x - 2, y + h); c.stroke();
      c.strokeStyle = '#d7bd8c55'; c.beginPath(); c.moveTo(x + 2, y + 3); c.lineTo(x, y + h - 5); c.stroke();
    }
  }
  for (let i = 0; i < (birch ? 85 : 22); i++) {
    const x = random() * 512, y = 30 + random() * 930;
    c.strokeStyle = birch ? '#4b5043b0' : '#403b3090'; c.lineWidth = birch ? 2 + random() * 4 : 2;
    c.beginPath();
    if (birch) { c.moveTo(x, y); c.bezierCurveTo(x + 9, y + 3, x + 19, y - 3, x + 9 + random() * 30, y); }
    else c.ellipse(x, y, 3 + random() * 3, 10 + random() * 14, .1, 0, Math.PI * 2);
    c.stroke();
  }
  // Broken moss at the foot, fading into bark rather than a solid green cuff.
  for (let i = 0; i < 1400; i++) {
    const x = random() * 512, y = 1024 - random() ** 2 * 250;
    c.fillStyle = ['#71805155', '#9aa36760', '#485d4245'][i % 3];
    c.fillRect(x, y, 1 + random() * 5, 2 + random() * 8);
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = THREE.RepeatWrapping;
  return map;
}

export function treeTrunkGeometry() {
  const profile = [[.48, 0], [.34, .035], [.27, .12], [.235, .3], [.19, .52], [.13, .76], [.035, 1]];
  const geometry = new THREE.LatheGeometry(profile.map(([r, y]) => new THREE.Vector2(r, y)), 16);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), angle = Math.atan2(z, x);
    const ridge = 1 + Math.sin(angle * 5 + y * 3) * (.045 + .1 * (1 - y) ** 5);
    p.setXYZ(i, x * ridge + Math.sin(y * 4) * .045, y, z * ridge);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function tearTexture() {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 128;
  const c = canvas.getContext('2d');
  const fill = c.createRadialGradient(51, 70, 2, 64, 75, 45);
  fill.addColorStop(0, '#ffffff'); fill.addColorStop(.3, '#d9ffff'); fill.addColorStop(1, '#6fbccf');
  c.fillStyle = fill; c.strokeStyle = '#f0ffff'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(64, 12); c.bezierCurveTo(58, 39, 31, 58, 31, 82);
  c.bezierCurveTo(31, 124, 97, 124, 97, 82); c.bezierCurveTo(97, 58, 70, 39, 64, 12);
  c.fill(); c.stroke();
  c.fillStyle = '#ffffffd0'; c.beginPath(); c.ellipse(49, 78, 5, 11, .3, 0, Math.PI * 2); c.fill();
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
}

// A passing gust has a calm interval and takes time to cross the forest.
export function breezeAt(time, x, z) {
  const phase = ((time - x * .06 - z * .035) % 19 + 19) % 19;
  return phase < 6 ? Math.sin(phase / 6 * Math.PI) ** 2 : 0;
}

export function tearJarTexture(count, open = false) {
  const canvas = document.createElement('canvas'); canvas.width = 128; canvas.height = 160;
  const c = canvas.getContext('2d');
  const glass = c.createLinearGradient(25, 0, 104, 0);
  glass.addColorStop(0, '#c2e6dcaa'); glass.addColorStop(.25, '#f4fff85a');
  glass.addColorStop(.65, '#a4cfc52a'); glass.addColorStop(1, '#8fb8bba0');
  c.beginPath(); c.moveTo(43, 36); c.lineTo(43, 51); c.bezierCurveTo(43, 59, 26, 59, 26, 75);
  c.lineTo(26, 135); c.quadraticCurveTo(26, 146, 64, 146);
  c.quadraticCurveTo(102, 146, 102, 135); c.lineTo(102, 75);
  c.bezierCurveTo(102, 59, 85, 59, 85, 51); c.lineTo(85, 36); c.closePath();
  c.fillStyle = glass; c.fill(); c.strokeStyle = '#527e78'; c.lineWidth = 3; c.stroke();
  if (count) {
    const level = 135 - count * 17;
    const water = c.createLinearGradient(0, level, 0, 144);
    water.addColorStop(0, '#ceffffdd'); water.addColorStop(1, '#67bfcddd');
    c.fillStyle = water; c.beginPath(); c.roundRect(31, level, 66, 141 - level, [3, 3, 9, 9]); c.fill();
    c.fillStyle = '#e6ffff'; c.beginPath(); c.ellipse(64, level + 2, 32, 4, 0, 0, Math.PI * 2); c.fill();
    for (let i = 0; i < count; i++) {
      c.fillStyle = '#ffffff'; c.beginPath(); c.arc(46 + i * 17, 128 - i % 2 * 9, 3, 0, Math.PI * 2); c.fill();
    }
  }
  c.strokeStyle = '#f3fff9dd'; c.lineWidth = 5; c.lineCap = 'round';
  c.beginPath(); c.moveTo(36, 77); c.lineTo(36, 120); c.stroke();
  c.lineWidth = 2; c.beginPath(); c.moveTo(92, 82); c.lineTo(92, 129); c.stroke();
  c.fillStyle = '#b99752'; c.fillRect(40, 37, 48, 9);
  c.fillStyle = '#e4ce8a'; c.fillRect(40, 37, 48, 3);
  c.fillStyle = open ? '#355b59' : '#9d774a'; c.beginPath(); c.ellipse(64, 36, 23, 6, 0, 0, Math.PI * 2); c.fill();
  if (!open) {
    c.fillStyle = '#b89562'; c.fillRect(45, 24, 38, 12);
    c.fillStyle = '#d7b780'; c.beginPath(); c.ellipse(64, 24, 19, 5, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = '#765d3b80'; for (const [x, y] of [[50, 29], [64, 31], [75, 27]]) c.fillRect(x, y, 3, 2);
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
}
