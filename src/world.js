import * as THREE from 'three';
import { BOUNDS, BROOK, START, HOME, POTATOES, FAIRIES, CREATURES, TRAILS, OBSTACLES, HOUSE_BOUNDS, HOUSE_TARGETS, HOUSE_OBSTACLES } from './data.js';
import { createSpriteTextures } from './sprites.js';

const COLORS = { grass: '#789368', path: '#c8ba8c', rim: '#677e53', water: '#639c9b' };

function randomSource(seed) {
  return () => {
    seed |= 0; seed = seed + 0x6D2B79F5 | 0;
    let t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

function distanceToSegment(x, z, a, b) {
  const dx = b[0] - a[0], dz = b[1] - a[1];
  const t = THREE.MathUtils.clamp(((x - a[0]) * dx + (z - a[1]) * dz) / (dx * dx + dz * dz), 0, 1);
  return Math.hypot(x - a[0] - t * dx, z - a[1] - t * dz);
}

function pathDistance(x, z) {
  let result = Infinity;
  for (const path of TRAILS) for (let i = 1; i < path.length; i++) result = Math.min(result, distanceToSegment(x, z, path[i - 1], path[i]));
  return result;
}

function groundTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 2048;
  const c = canvas.getContext('2d'), rng = randomSource(84), unit = 2048 / 180;
  c.fillStyle = COLORS.grass; c.fillRect(0, 0, 2048, 2048);
  // Woodland greens, dry meadow grass, and warm leaf litter define each clearing.
  const patches = [[-22, -12, 26, '#587d58'], [0, 15, 13, '#9eaf75'], [4, -32, 23, '#acb77c'], [21, -7, 17, '#6c9673'], [-3, -8, 13, '#9caa73']];
  for (const [x, z, r, color] of patches) {
    const px = (x + 90) * unit, py = (z + 90) * unit;
    const fill = c.createRadialGradient(px, py, 0, px, py, r * unit);
    fill.addColorStop(0, color); fill.addColorStop(1, `${color}00`);
    c.fillStyle = fill; c.fillRect(0, 0, 2048, 2048);
  }
  // Broad, irregular shade is painted once. No animated full-screen filters.
  for (let i = 0; i < 125; i++) {
    const x = 580 + rng() * 840, y = 470 + rng() * 970, rx = 22 + rng() * 65, ry = 9 + rng() * 34;
    c.fillStyle = i % 5 ? '#264f3d0e' : '#f4d59b17';
    c.beginPath(); c.ellipse(x, y, rx, ry, -.45, 0, Math.PI * 2); c.fill();
  }
  for (let i = 0; i < 31000; i++) {
    const x = rng() * 2048, y = rng() * 2048;
    c.strokeStyle = ['#3e634625', '#dde0a530', '#aa986529', '#b9cc8a25'][i % 4]; c.lineWidth = .6 + rng();
    c.beginPath(); c.moveTo(x, y); c.lineTo(x + 1 + rng() * 4, y - 2 - rng() * 5); c.stroke();
  }
  for (let i = 0; i < 2000; i++) {
    const x = 580 + rng() * 800, y = 490 + rng() * 950;
    c.fillStyle = ['#bbac7955', '#536d4655', '#c0be8750'][i % 3];
    c.beginPath(); c.ellipse(x, y, 2 + rng() * 3, .8 + rng(), rng() * Math.PI, 0, Math.PI * 2); c.fill();
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace; return map;
}

// Shared repeating material maps add wood grain, plaster, and woven cloth at startup.
function surfaceTexture(kind, illustrations) {
  const canvas = document.createElement('canvas'); canvas.width = canvas.height = 512;
  const c = canvas.getContext('2d'), rng = randomSource(kind === 'wood' ? 332 : 781);
  c.fillStyle = kind === 'wood' ? '#c8a177' : kind === 'plaster' ? '#dfd0ad' : kind === 'path' ? '#c8ba8c' : kind === 'window' ? '#b9cbb3' : '#a95f4e';
  c.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 1900; i++) {
    const x = rng() * 512, y = rng() * 512;
    c.fillStyle = i % 2 ? '#fff0cd16' : '#3e3f2b12';
    c.fillRect(x, y, kind === 'wood' ? 1 : 1 + rng() * 3, kind === 'wood' ? 15 + rng() * 60 : 1 + rng() * 2);
  }
  if (kind === 'wood') {
    for (let i = 0; i < 26; i++) {
      const x = rng() * 512;
      c.strokeStyle = '#765b3f35'; c.lineWidth = 1.3;
      c.beginPath(); c.moveTo(x, 0); c.bezierCurveTo(x + 12, 170, x - 8, 390, x + 5, 512); c.stroke();
    }
    for (const [x, y] of [[74, 122], [288, 340], [448, 231]]) {
      for (let r = 6; r < 20; r += 4) { c.strokeStyle = '#795e4235'; c.beginPath(); c.ellipse(x, y, r * .35, r, .1, 0, Math.PI * 2); c.stroke(); }
    }
  }
  if (kind === 'cloth') {
    for (let i = 0; i < 512; i += 4) {
      c.fillStyle = '#eed3a61a'; c.fillRect(i, 0, 1, 512); c.fillRect(0, i, 512, 1);
    }
    c.strokeStyle = '#e3c699'; c.lineWidth = 3;
    for (const y of [44, 468]) {
      c.beginPath(); c.moveTo(20, y); c.lineTo(492, y); c.stroke();
      for (let x = 26; x < 492; x += 24) {
        c.beginPath(); c.moveTo(x - 7, y); c.lineTo(x, y - 8); c.lineTo(x + 7, y); c.lineTo(x, y + 8); c.closePath(); c.stroke();
      }
    }
    for (const y of [135, 256, 377]) for (let x = 64; x < 470; x += 96) {
      c.strokeStyle = '#d4be9180'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(x, y + 31); c.quadraticCurveTo(x - 5, y + 3, x, y - 20); c.stroke();
      for (let n = 0; n < 6; n++) {
        c.fillStyle = n % 2 ? '#e1c696' : '#849575';
        c.beginPath(); c.ellipse(x + (n % 2 ? -11 : 11), y + 22 - n * 8, 10, 3.5, n % 2 ? -.5 : .5, 0, Math.PI * 2); c.fill();
      }
    }
  }
  if (kind === 'plaster') {
    for (let i = 0; i < 9; i++) {
      const x = rng() * 512, y = rng() * 512, r = 45 + rng() * 110;
      const wash = c.createRadialGradient(x, y, 0, x, y, r);
      wash.addColorStop(0, i % 2 ? '#b8b18c22' : '#fff0cb30'); wash.addColorStop(1, '#dfd0ad00');
      c.fillStyle = wash; c.fillRect(0, 0, 512, 512);
    }
  }
  if (kind === 'window') {
    c.fillStyle = '#98ad83'; c.fillRect(0, 340, 512, 172);
    c.drawImage(illustrations.fir[0].image, -30, 80, 285, 420);
    c.drawImage(illustrations.birch[0].image, 204, 30, 300, 440);
    c.fillStyle = '#e2ebca33'; c.fillRect(0, 0, 512, 512);
    c.fillStyle = '#fff2d335'; c.beginPath(); c.moveTo(0, 0); c.lineTo(270, 0); c.lineTo(0, 440); c.fill();
  }
  if (kind === 'path') {
    for (let i = 0; i < 90; i++) {
      const x = rng() * 512, y = rng() * 512;
      c.fillStyle = i % 2 ? '#eee0b76b' : '#887e5852'; c.beginPath(); c.ellipse(x, y, 2 + rng() * 5, 1 + rng() * 3, rng(), 0, Math.PI * 2); c.fill();
    }
  }
  const map = new THREE.CanvasTexture(canvas); map.colorSpace = THREE.SRGBColorSpace;
  map.wrapS = map.wrapT = THREE.RepeatWrapping; return map;
}

export function createWorld(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#b7c9b0');
  scene.fog = new THREE.Fog('#b7c9b0', 68, 122);
  const camera = new THREE.OrthographicCamera(-20, 20, 15, -15, .1, 180);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor('#b7c9b0');
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = 'world-canvas';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);
  const maps = createSpriteTextures();
  const materials = new Set();
  const geometries = new Set();
  const outdoors = new THREE.Group(), house = new THREE.Group(), people = new THREE.Group();
  scene.add(outdoors, house, people);
  house.visible = false;
  let activeGroup = outdoors;
  const rng = randomSource(7729);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const motionRng = randomSource(1384), windSprites = [];
  scene.add(new THREE.HemisphereLight('#fff2d0', '#8fa57f', 1.2));
  const sunlight = new THREE.DirectionalLight('#fff1cb', 1.4);
  sunlight.position.set(-25, 40, 20); scene.add(sunlight);

  function material(color, options = {}) {
    const value = new THREE.MeshBasicMaterial({ color, ...options });
    materials.add(value); return value;
  }
  function solidMaterial(color, options = {}) {
    const value = new THREE.MeshLambertMaterial({ color, ...options });
    materials.add(value); return value;
  }
  function mesh(geometry, mat, x, y, z) {
    geometries.add(geometry);
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(x, y, z); activeGroup.add(object); return object;
  }
  function sprite(map, x, z, width, height, y = .04, options = {}) {
    const mat = new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, alphaTest: .025, ...options });
    materials.add(mat);
    const object = new THREE.Sprite(mat);
    object.center.set(.5, 0);
    object.scale.set(width, height, 1);
    object.position.set(x, y, z);
    activeGroup.add(object); return object;
  }
  function sway(object, kind = 'plant') {
    object.name = kind === 'plant' ? 'wind-foliage' : 'wind-tree';
    windSprites.push({ object, phase: motionRng() * Math.PI * 2, speed: .65 + motionRng() * .45,
      amount: kind === 'birch' ? .017 : kind === 'fir' ? .012 : .047 });
    return object;
  }
  function foliage(map, x, z, width, height) {
    return sway(sprite(map, x, z, width, height));
  }
  function flatDisc(x, z, radius, color, y = .03, opacity = 1) {
    const geometry = new THREE.CircleGeometry(radius, 32), isPath = color === COLORS.path || color === '#d2c698';
    if (isPath) {
      const position = geometry.attributes.position, uv = geometry.attributes.uv;
      for (let i = 0; i < position.count; i++) uv.setXY(i, (x + position.getX(i)) * .16, (z - position.getY(i)) * .16);
    }
    const disc = mesh(geometry, material(isPath ? '#ffffff' : color, { transparent: opacity < 1, opacity, depthWrite: opacity === 1, ...(isPath ? { map: pathMap } : {}) }), x, y, z);
    disc.rotation.x = -Math.PI / 2; return disc;
  }
  function irregularPatch(x, z, rx, rz, color, y = .03) {
    const outline = new THREE.Shape();
    for (let i = 0; i <= 32; i++) {
      const angle = i / 32 * Math.PI * 2;
      const edge = 1 + Math.sin(angle * 5 + x) * .06 + Math.cos(angle * 9 + z) * .035;
      const px = Math.cos(angle) * rx * edge, pz = Math.sin(angle) * rz * edge;
      if (i) outline.lineTo(px, pz); else outline.moveTo(px, pz);
    }
    const object = mesh(new THREE.ShapeGeometry(outline), material(color), x, y, z);
    object.rotation.x = -Math.PI / 2; return object;
  }
  function shadow(x, z, width, depth, opacity = .65) {
    const object = mesh(new THREE.PlaneGeometry(width, depth), material('#ffffff', { map: maps.shadow, transparent: true, opacity, depthWrite: false }), x, .055, z);
    object.rotation.x = -Math.PI / 2; return object;
  }
  const floorMap = groundTexture();
  const woodMap = surfaceTexture('wood'), plasterMap = surfaceTexture('plaster'), clothMap = surfaceTexture('cloth'), pathMap = surfaceTexture('path'), windowMap = surfaceTexture('window', maps);
  const ground = mesh(new THREE.PlaneGeometry(180, 180), material('#ffffff', { map: floorMap }), 0, 0, 0);
  ground.rotation.x = -Math.PI / 2;

  // Rounded path ribbons sit on the same flat surface as every walkable target.
  function ribbon(points, width, color, elevation) {
    const vertices = [], indices = [], uvs = [];
    points.forEach((point, i) => {
      const before = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 1)];
      const dx = after[0] - before[0], dz = after[1] - before[1], length = Math.hypot(dx, dz);
      vertices.push(point[0] - dz / length * width / 2, elevation, point[1] + dx / length * width / 2,
        point[0] + dz / length * width / 2, elevation, point[1] - dx / length * width / 2);
      const a = vertices.length - 6;
      uvs.push(vertices[a] * .16, vertices[a + 2] * .16, vertices[a + 3] * .16, vertices[a + 5] * .16);
      if (i) { const n = i * 2; indices.push(n - 2, n - 1, n, n - 1, n + 1, n); }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2)); geo.setIndex(indices); geo.computeVertexNormals();
    const isPath = color === COLORS.path || color === '#d2c698';
    mesh(geo, material(isPath ? '#ffffff' : color, { side: THREE.DoubleSide, ...(isPath ? { map: pathMap } : {}) }), 0, 0, 0);
    for (const [x, z] of points) flatDisc(x, z, width / 2, color, elevation + .001);
  }
  for (const trail of TRAILS) {
    ribbon(trail, 2.35, '#74855b', .017);
    ribbon(trail, 2.12, '#a19e6e', .021);
    ribbon(trail, 1.88, COLORS.path, .024);
  }
  ribbon([[0, 18], [-3, 15], [-4, 12]], 1.25, COLORS.path, .026);
  for (const target of [...POTATOES, ...FAIRIES, ...CREATURES]) {
    if (pathDistance(target.x, target.z) > 1.4) {
      let nearest = TRAILS[0][0], distance = Infinity;
      for (const trail of TRAILS) for (let i = 1; i < trail.length; i++) {
        const a = trail[i - 1], b = trail[i], dx = b[0] - a[0], dz = b[1] - a[1];
        const fraction = THREE.MathUtils.clamp(((target.x - a[0]) * dx + (target.z - a[1]) * dz) / (dx * dx + dz * dz), 0, 1);
        const point = [a[0] + fraction * dx, a[1] + fraction * dz];
        const d = Math.hypot(target.x - point[0], target.z - point[1]);
        if (d < distance) { nearest = point; distance = d; }
      }
      ribbon([[target.x, target.z], nearest], 1.05, '#d2c698', .025);
    }
  }
  // Tapering tufts break the ruler-straight visual path edges.
  for (const trail of TRAILS) for (let segment = 1; segment < trail.length; segment++) {
    const a = trail[segment - 1], b = trail[segment], dx = b[0] - a[0], dz = b[1] - a[1], length = Math.hypot(dx, dz);
    for (let j = 0; j < Math.floor(length * 1.5); j++) {
      const t = (j + rng() * .6) / (length * 1.5), side = j % 2 ? -1 : 1;
      const x = a[0] + dx * t - dz / length * (1.03 + rng() * .26) * side;
      const z = a[1] + dz * t + dx / length * (1.03 + rng() * .26) * side;
      if (allTargetsNearPath(x, z)) continue;
      foliage(j % 5 === 0 ? maps.flowers : maps.grasses, x, z, .38 + rng() * .2, .28 + rng() * .24);
    }
  }
  function allTargetsNearPath(x, z) {
    return [...POTATOES, ...FAIRIES, ...CREATURES, HOME].some(t => Math.hypot(x - t.x, z - t.z) < 1.7);
  }
  // The brook stays east of the trail. A small wooden bridge leads into its bank.
  ribbon(BROOK, 3.4, '#77946d', .032);
  ribbon(BROOK, 2.65, COLORS.water, .039);
  // Short ripples follow the brook in one draw call and remain inside its banks.
  const brookSegments = [], rippleCount = 24, rippleSeeds = [];
  let brookLength = 0;
  for (let i = 1; i < BROOK.length; i++) {
    const [x, z] = BROOK[i - 1], dx = BROOK[i][0] - x, dz = BROOK[i][1] - z, length = Math.hypot(dx, dz);
    brookSegments.push({ x, z, dx: dx / length, dz: dz / length, length, start: brookLength });
    brookLength += length;
  }
  for (let i = 0; i < rippleCount; i++) rippleSeeds.push({ distance: (i + motionRng()) / rippleCount * brookLength,
    speed: .5 + motionRng() * .22, offset: (motionRng() - .5) * 1.4, width: .23 + motionRng() * .17, phase: motionRng() * Math.PI * 2 });
  const ripplePositions = new Float32Array(rippleCount * 18), rippleGeo = new THREE.BufferGeometry();
  geometries.add(rippleGeo); rippleGeo.setAttribute('position', new THREE.BufferAttribute(ripplePositions, 3));
  const rippleMat = new THREE.LineBasicMaterial({ color: '#e3ead6', transparent: true, opacity: .6, depthWrite: false });
  materials.add(rippleMat);
  const ripples = new THREE.LineSegments(rippleGeo, rippleMat); ripples.name = 'brook-ripples';
  ripples.frustumCulled = false; outdoors.add(ripples);
  const boardMat = solidMaterial('#c5aa7f', { map: woodMap }), boardAlt = solidMaterial('#ddc394', { map: woodMap }), railMat = solidMaterial('#9c855b', { map: woodMap });
  for (let i = 0; i < 12; i++) mesh(new THREE.BoxGeometry(.33, .13, 2.15), i % 3 ? boardMat : boardAlt, 26.9 + i * .34, .16, -14.1);
  for (const x of [26.8, 30.9]) for (const z of [-15.1, -13.1]) mesh(new THREE.BoxGeometry(.12, .8, .12), railMat, x, .48, z);
  for (const z of [-15.1, -13.1]) mesh(new THREE.BoxGeometry(4.2, .1, .11), railMat, 28.85, .74, z);
  ribbon([[23, -14], [27, -14]], 1.4, COLORS.path, .03);

  const occluders = [];
  function tree(x, z, kind, size = 1) {
    const isBirch = kind === 'birch';
    const height = (isBirch ? 7.3 : 7.8) * size;
    const width = (isBirch ? 4.9 : 5.2) * size;
    shadow(x + .25, z + .15, width * .8, width * .46, .55);
    shadow(x + 1.1, z + .4, width * 1.35, width * .8, .3);
    const object = sprite(isBirch ? maps.birch[Math.floor(rng() * 2)] : maps.fir[Math.floor(rng() * 3)], x, z, width, height);
    sway(object, kind);
    occluders.push({ object, x, z, height });
    return object;
  }
  // Collision props use the shared obstacle positions. Other trees leave trails clear.
  for (const obstacle of OBSTACLES) {
    if (obstacle.type === 'tree') tree(obstacle.x, obstacle.z, obstacle.x < -8 ? 'birch' : 'fir', .85 + rng() * .2);
    if (obstacle.type === 'rock') {
      shadow(obstacle.x, obstacle.z, 2.4, 1.7, .55);
      sprite(maps.stone, obstacle.x, obstacle.z, 2.25, 1.55);
    }
  }
  const allTargets = [...POTATOES, ...FAIRIES, ...CREATURES, HOME, START];
  function clearForTree(x, z) {
    if (pathDistance(x, z) < 4.0) return false;
    if (allTargets.some(target => Math.hypot(x - target.x, z - target.z) < 5.0)) return false;
    if (Math.hypot(x, z - 21) < 6.5) return false;
    if (x > 26 && x < 34 && z > -42 && z < 16) return false;
    return !occluders.some(t => Math.hypot(x - t.x, z - t.z) < 3.4);
  }
  for (let i = 0; i < 450; i++) {
    const x = BOUNDS.minX - 11 + rng() * (BOUNDS.maxX - BOUNDS.minX + 22), z = BOUNDS.minZ - 11 + rng() * (BOUNDS.maxZ - BOUNDS.minZ + 22);
    if (clearForTree(x, z)) tree(x, z, x < -13 && z > -25 ? 'birch' : 'fir', .72 + rng() * .42);
  }
  // Distant woods and rounded ridges conceal the edge of the walking area.
  for (let i = 0; i < 90; i++) {
    const angle = rng() * Math.PI * 2, radius = 53 + rng() * 24;
    tree(Math.cos(angle) * radius, Math.sin(angle) * radius, 'fir', 1 + rng() * .65);
  }
  for (let i = 0; i < 11; i++) {
    const x = -72 + i * 14, z = -58 - rng() * 13;
    const hill = mesh(new THREE.SphereGeometry(12 + rng() * 9, 24, 12), solidMaterial(i % 2 ? '#a9bd9c' : '#b6c6a2'), x, -1, z);
    hill.scale.set(1.5, .5 + rng() * .3, 1);
  }

  // Varied low plants deepen the woodland while keeping the walking route clear.
  for (let i = 0; i < 620; i++) {
    const x = BOUNDS.minX - 5 + rng() * (BOUNDS.maxX - BOUNDS.minX + 10), z = BOUNDS.minZ - 4 + rng() * (BOUNDS.maxZ - BOUNDS.minZ + 8);
    if (pathDistance(x, z) < 1.4 || allTargets.some(t => Math.hypot(x - t.x, z - t.z) < 1.75)) continue;
    if (x > 27 && z < 9) continue;
    const map = i % 13 === 0 ? maps.stone : i % 7 === 0 ? maps.mushrooms : i % 4 === 0 ? maps.blueFlowers : i % 3 === 0 ? maps.flowers : i % 2 === 0 ? maps.fern : maps.grasses;
    const size = .48 + rng() * .68;
    const object = sprite(map, x, z, size * 1.7, size * (map === maps.stone ? 1.05 : 1.3));
    if (map !== maps.stone && map !== maps.mushrooms) sway(object);
  }
  for (const [x, z, size] of [[-26, -20, 1], [-20, -19, .7], [22, -19, .8], [-6, 16, .8], [6, 17, 1], [-2, -30, .8]]) {
    sprite(maps.mushrooms, x, z, size * 1.6, size * 1.3);
  }

  for (const [x, z] of [[-7, 19], [-24, -22], [11, -19], [18, 12], [-11, -33]]) {
    if (!allTargets.some(t => Math.hypot(x - t.x, z - t.z) < 3)) {
      shadow(x, z, 1.7, 1.3, .4); sprite(maps.stump, x, z, 1.5, 1.45);
      foliage(maps.fern, x - .8, z + .2, 1.6, 1.3);
    }
  }
  // Hana's cottage faces into the clearing, with a stepping-stone doorstep.
  shadow(0, 21, 9, 5.4, .75);
  const cottage = sprite(maps.cottage, 0, 21.6, 9, 7.875);
  occluders.push({ object: cottage, x: 0, z: 21.6, height: 7.875, fadedOpacity: .42 });
  for (let i = 0; i < 4; i++) {
    const stone = flatDisc(.05 + Math.sin(i * 2) * .2, 20 - i * .65, .42, '#b7b495', .06);
    stone.scale.set(1.25, .8, 1);
  }
  for (let i = 0; i < 5; i++) {
    const x = 3.5 + i * .55;
    mesh(new THREE.BoxGeometry(.09, .65, .1), material('#a3996f'), x, .34, 20.5);
  }
  mesh(new THREE.BoxGeometry(2.7, .09, .08), material('#bbaf81'), 4.6, .54, 20.5);
  mesh(new THREE.BoxGeometry(2.7, .09, .08), material('#bbaf81'), 4.6, .26, 20.5);
  foliage(maps.flowers, -3.8, 21, 1.5, 1.3);
  foliage(maps.flowers, 3.5, 21.8, 1.5, 1.3);
  // A Czech trail blaze: white, blue, white bands on an upright trail post.
  const postMat = material('#8b7953'), white = material('#f7f0d5'), blue = material('#4c8ca5');
  for (const [x, z] of [[-2.5, 7.8], [-20, -6.6], [-9, -29], [18, -24], [18.5, 3]]) {
    mesh(new THREE.BoxGeometry(.2, 1.6, .2), postMat, x, .8, z);
    for (let band = 0; band < 3; band++) mesh(new THREE.BoxGeometry(.31, .1, .25), band === 1 ? blue : white, x, 1.25 - band * .1, z);
    const sign = mesh(new THREE.BoxGeometry(1.1, .24, .13), material('#d7c89b'), x + .34, 1.52, z);
    sign.rotation.y = -.35;
  }

  const potatoObjects = POTATOES.map((target, i) => {
    irregularPatch(target.x, target.z, 1.9, 1.32, '#a99564', .04);
    irregularPatch(target.x - .2, target.z + .1, 1.5, .94, '#b09b69', .043);
    for (let row = -1; row <= 1; row++) ribbon([[target.x - 1.1, target.z + row * .5], [target.x + 1.1, target.z + row * .5]], .09, '#8e8056', .047);
    foliage(maps.potatoLeaves, target.x - .7, target.z - .35, 1.7, 1.25);
    foliage(maps.potatoLeaves, target.x + .6, target.z - .1, 1.9, 1.42);
    const glow = sprite(maps.glow, target.x, target.z + .1, 3.3, 3.3, .1, { color: '#ffe6a6', blending: THREE.AdditiveBlending, opacity: .22 });
    glow.center.set(.5, .5); glow.position.y = .65;
    const item = sprite(maps.potato, target.x, target.z + .25, 1.35, 1.18, .22);
    const halo = mesh(new THREE.RingGeometry(.85, .89, 40), material('#fff1ba', { transparent: true, opacity: .65, side: THREE.DoubleSide, depthWrite: false }), target.x, .07, target.z);
    halo.rotation.x = -Math.PI / 2;
    return { id: target.id, item, glow, halo, index: i };
  });
  const fairyObjects = FAIRIES.map((target, i) => {
    irregularPatch(target.x, target.z, 2.8, 2.25, i === 1 ? '#aeb37b' : '#91ab72', .028);
    for (let p = 0; p < 14; p++) {
      const angle = p / 14 * Math.PI * 2;
      foliage(p % 2 ? maps.fern : maps.grasses, target.x + Math.cos(angle) * 2.65, target.z + Math.sin(angle) * 2.12, .56, .42);
    }
    for (let p = 0; p < 8; p++) {
      const angle = p / 8 * Math.PI * 2;
      foliage(p % 2 ? maps.blueFlowers : maps.flowers, target.x + Math.cos(angle) * 2.1, target.z + Math.sin(angle) * 2.1, .75, .65);
    }
    const glow = sprite(maps.glow, target.x, target.z, 4.5, 4.5, 1.9, { color: target.color, blending: THREE.AdditiveBlending, opacity: .23 });
    glow.center.set(.5, .5);
    const object = sprite(maps.fairies[i], target.x, target.z, 1.9, 2.4, 1.0);
    object.name = 'fairy';
    const halo = mesh(new THREE.RingGeometry(1.15, 1.19, 48), material(target.color, { transparent: true, opacity: .7, side: THREE.DoubleSide, depthWrite: false }), target.x, .07, target.z);
    halo.rotation.x = -Math.PI / 2;
    shadow(target.x, target.z, 1.6, 1, .38);
    return { id: target.id, object, glow, halo, index: i };
  });
  const homeHalo = mesh(new THREE.RingGeometry(1.2, 1.26, 48), material('#fff0bb', { transparent: true, opacity: .45, side: THREE.DoubleSide, depthWrite: false }), HOME.x, .07, HOME.z);
  homeHalo.rotation.x = -Math.PI / 2;

  const creatureObjects = CREATURES.map((target, i) => {
    const kind = target.id;
    const height = kind === 'deer' ? 3.2 : kind === 'badger' ? 1.9 : 2.25;
    sprite(maps[kind], target.x, target.z, height * (kind === 'badger' ? 1.3 : .8), height);
    shadow(target.x, target.z, 1.8, 1, .6);
    const indicator = sprite(maps.conversation, target.x, target.z, .75, .75, height + .15);
    return { id: target.id, indicator, height, index: i };
  });

  // The front and right walls are cut away so every family member stays visible.
  activeGroup = house;
  const roomWood = solidMaterial('#d0ab79', { map: woodMap }), roomEdge = solidMaterial('#8e7456', { map: woodMap });
  const plaster = material('#ffffff', { map: plasterMap }), linen = solidMaterial('#e9dcc0');
  const roomWidth = HOUSE_BOUNDS.maxX - HOUSE_BOUNDS.minX;
  const roomDepth = HOUSE_BOUNDS.maxZ - HOUSE_BOUNDS.minZ;
  mesh(new THREE.BoxGeometry(roomWidth + .6, .35, roomDepth + .6), roomEdge, 0, -.19, 0);
  for (let row = 0; row < 24; row++) {
    const z = HOUSE_BOUNDS.minZ + (row + .5) * roomDepth / 24;
    mesh(new THREE.BoxGeometry(roomWidth, .07, roomDepth / 24 - .035), material(row % 3 ? '#eee1c0' : '#f7ebca', { map: woodMap }), 0, -.01, z);
    for (const x of [-6 + row % 3 * 2, 3 + row % 4]) mesh(new THREE.BoxGeometry(.025, .012, roomDepth / 24 - .06), roomEdge, x, .03, z);
  }
  mesh(new THREE.BoxGeometry(roomWidth + .3, 4.4, .28), plaster, 0, 2.2, HOUSE_BOUNDS.minZ - .14);
  mesh(new THREE.BoxGeometry(.28, 4.4, roomDepth), plaster, HOUSE_BOUNDS.minX - .14, 2.2, 0);
  for (const y of [.2, 4.25]) {
    mesh(new THREE.BoxGeometry(roomWidth + .4, .18, .33), roomWood, 0, y, HOUSE_BOUNDS.minZ);
    mesh(new THREE.BoxGeometry(.33, .18, roomDepth + .2), roomWood, HOUSE_BOUNDS.minX, y, 0);
  }
  for (const x of [-9.85, 9.85]) mesh(new THREE.BoxGeometry(.22, 4.45, .38), roomWood, x, 2.2, -8);
  mesh(new THREE.BoxGeometry(.34, 4.45, .24), roomWood, -10, 2.2, 7.85);
  function windowAt(x, z, side = false) {
    const frame = mesh(new THREE.BoxGeometry(2.8, 1.9, .14), roomWood, x, 2.65, z);
    const glass = mesh(new THREE.BoxGeometry(2.45, 1.55, .16), material('#ffffff', { map: windowMap }), x, 2.65, z + .03);
    const upright = mesh(new THREE.BoxGeometry(.1, 1.65, .2), linen, x, 2.65, z + .1);
    const cross = mesh(new THREE.BoxGeometry(2.5, .1, .2), linen, x, 2.65, z + .1);
    const sill = mesh(new THREE.BoxGeometry(3.05, .14, .5), roomWood, x, 1.65, z + .15);
    if (side) for (const object of [frame, glass, upright, cross, sill]) {
      object.rotation.y = Math.PI / 2;
      object.position.x = x + (object.position.z - z);
      object.position.z = z;
    }
  }
  windowAt(-3.4, -7.79); windowAt(6.2, -7.79); windowAt(-9.79, 2.5, true);
  // Painted pools of window light stay on the floor and leave all aisles open.
  for (const [x, z] of [[-3.4, -5.3], [6.2, -5.3], [-7.2, 2.5]]) {
    const beam = new THREE.Shape();
    beam.moveTo(-1.1, -1.8); beam.lineTo(1.1, -1.8); beam.lineTo(2.7, 2.4); beam.lineTo(.2, 2.4); beam.closePath();
    const light = mesh(new THREE.ShapeGeometry(beam), material('#f5dfaa', { transparent: true, opacity: .2, depthWrite: false }), x, .042, z);
    light.rotation.x = -Math.PI / 2;
  }
  // Woven rug and embroidered bands echo the cottage's blue and red colors.
  const rug = mesh(new THREE.PlaneGeometry(8.8, 5.6), material('#ffffff', { map: clothMap }), 0, .055, 2.3);
  rug.rotation.x = -Math.PI / 2;
  for (const z of [-.15, .18, 4.42, 4.75]) ribbon([[-4.2, z], [4.2, z]], .08, '#e7cea0', .06);
  for (let x = -3.7; x <= 3.7; x += .75) {
    const diamond = mesh(new THREE.PlaneGeometry(.34, .34), material('#e9d2a5'), x, .065, 2.3);
    diamond.rotation.set(-Math.PI / 2, 0, Math.PI / 4);
  }
  const welcomeMat = mesh(new THREE.PlaneGeometry(3.2, 1.1), material('#728b7b'), 0, .06, 7.25);
  welcomeMat.rotation.x = -Math.PI / 2;
  const furniture = Object.fromEntries(HOUSE_OBSTACLES.map(item => [item.id, item]));
  const john = HOUSE_TARGETS[0], cot = furniture.cot;
  sprite(maps.john, john.x, john.z, 1.7, 2.83, .07);
  shadow(john.x, john.z, 1.7, 1, .6);
  sprite(maps.aldoCot, cot.x, cot.z, cot.radius * 2.4, cot.radius * 1.89, .07);
  shadow(cot.x, cot.z, cot.radius * 2.35, cot.radius * 1.72, .45);
  const familyIndicator = sprite(maps.conversation, john.x, john.z, .65, .65, 3.05);
  const prep = furniture.worktop, stove = furniture.stove, table = furniture.table;
  // Illustrated furniture stays centered on the shared walking obstacle positions.
  shadow(prep.x, prep.z, 2.8, 1.7, .55);
  sprite(maps.worktop, prep.x, prep.z, 3.2, 2.67);
  const board = mesh(new THREE.BoxGeometry(1.2, .09, .72), solidMaterial('#d5b075'), prep.x, 1.59, prep.z);
  board.rotation.y = -.2;
  const prepPotatoes = [];
  for (let i = 0; i < 3; i++) {
    const item = mesh(new THREE.SphereGeometry(.17, 16, 12), solidMaterial('#bc955a'), prep.x - .3 + i * .27, 1.72, prep.z + .04);
    item.scale.set(1.2, .7, .85); prepPotatoes.push(item);
  }
  mesh(new THREE.BoxGeometry(.6, .04, .1), solidMaterial('#aab6a2'), prep.x + .2, 1.67, prep.z - .25);
  mesh(new THREE.BoxGeometry(.24, .07, .13), roomEdge, prep.x + .58, 1.68, prep.z - .25);
  shadow(stove.x, stove.z, 2.7, 1.6, .5);
  sprite(maps.stove, stove.x, stove.z, 2.8, 3.85);
  const steam = [0, 1, 2].map(i => {
    const object = sprite(maps.glow, stove.x - .25 + i * .25, stove.z, .65, .9, 2.08 + i * .22, { color: '#fff1d2', opacity: .22 });
    object.center.set(.5, .5); return object;
  });
  shadow(table.x, table.z, 2.9, 1.8, .5);
  sprite(maps.supperTable, table.x, table.z, 3.6, 3);
  const dinner = [];
  for (const x of [-.65, .65]) {
    const plate = mesh(new THREE.CylinderGeometry(.32, .29, .05, 32), linen, table.x + x, 1.51, table.z);
    const meal = mesh(new THREE.SphereGeometry(.23, 16, 10), solidMaterial('#d7bb78'), table.x + x, 1.57, table.z);
    meal.scale.set(1, .35, 1); dinner.push(meal);
    mesh(new THREE.CylinderGeometry(.13, .1, .23, 24), solidMaterial('#9ab3a1'), table.x + x, 1.63, table.z - .46);
    plate.rotation.y = .15;
  }
  // A shelf, drying herbs, and a wall cloth give the small room a lived-in feel.
  mesh(new THREE.BoxGeometry(2.7, .12, .5), roomWood, -7.2, 3, -7.6);
  for (const x of [-8.1, -7.5, -6.9]) {
    mesh(new THREE.CylinderGeometry(.17, .14, .35, 20), linen, x, 3.25, -7.55);
    mesh(new THREE.TorusGeometry(.1, .025, 8, 16), linen, x + .18, 3.24, -7.55);
  }
  for (const x of [-1.6, 1.65]) for (let leaf = 0; leaf < 4; leaf++) {
    const herb = mesh(new THREE.SphereGeometry(.12, 12, 8), solidMaterial(leaf % 2 ? '#77916a' : '#94a575'), x + Math.sin(leaf * 2) * .12, 3.3 - leaf * .16, -7.66);
    herb.scale.set(.8, 1.6, .6);
  }
  mesh(new THREE.BoxGeometry(.04, 1.7, 1.1), linen, -9.8, 2.65, -2);
  for (const y of [1.96, 2.1, 3.25, 3.39]) mesh(new THREE.BoxGeometry(.06, .08, 1.04), material('#af5949'), -9.76, y, -2);
  const houseMarker = mesh(new THREE.RingGeometry(.82, .91, 48), material('#fff2bc', { side: THREE.DoubleSide, transparent: true, opacity: .85, depthWrite: false }), -6, .075, 0);
  houseMarker.rotation.x = -Math.PI / 2;

  activeGroup = people;
  const hana = sprite(maps.hana[0], START.x, START.z, 1.65, 2.75, .07);
  const hanaShadow = shadow(START.x, START.z, 1.7, 1, .8);
  const radiance = sprite(maps.glow, START.x, START.z, 5.8, 6.2, 1.8, { color: '#ffe8a2', blending: THREE.AdditiveBlending, opacity: 0 });
  radiance.center.set(.5, .5);
  const crownHalo = sprite(maps.glow, START.x, START.z, 3.2, 3.2, 2.7, { color: '#fff4c0', blending: THREE.AdditiveBlending, opacity: 0 });
  crownHalo.center.set(.5, .5);
  activeGroup = outdoors;
  // Soft motes use one draw call, even on small screens.
  const moteCount = 72, motePositions = new Float32Array(moteCount * 3), moteOrigins = [];
  for (let i = 0; i < moteCount; i++) {
    const x = BOUNDS.minX + rng() * (BOUNDS.maxX - BOUNDS.minX), z = BOUNDS.minZ + rng() * (BOUNDS.maxZ - BOUNDS.minZ), y = .6 + rng() * 5;
    moteOrigins.push({ x, y, z, phase: rng() * 6.28 });
    motePositions.set([x, y, z], i * 3);
  }
  const moteGeo = new THREE.BufferGeometry(); geometries.add(moteGeo);
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
  const moteMat = new THREE.PointsMaterial({ map: maps.glow, color: '#fff4c4', size: .28, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending });
  materials.add(moteMat); const motes = new THREE.Points(moteGeo, moteMat); outdoors.add(motes);

  const focus = new THREE.Vector3(-8, 0, 18);
  const desiredFocus = new THREE.Vector3();
  const cameraOffset = new THREE.Vector3(32, 35, 32);
  const projectedPlayer = new THREE.Vector3(), projectedBase = new THREE.Vector3(), projectedTop = new THREE.Vector3();
  let width = 1, height = 1, viewHeight = 29, elapsedWalk = 0;
  let previousScene = 'outdoors', previousPhase = 'intro', transformationTime = 0;

  function resize() {
    width = Math.max(container.clientWidth, 1); height = Math.max(container.clientHeight, 1);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.left = -viewHeight * width / height / 2; camera.right = -camera.left;
    camera.top = viewHeight / 2; camera.bottom = -camera.top; camera.updateProjectionMatrix();
  }
  resize();

  function update(game, dt, time) {
    const player = game.player || START;
    const motionTime = reducedMotion.matches ? 0 : time;
    const intro = game.phase === 'intro';
    const indoors = game.scene === 'house';
    const won = game.phase === 'won' && indoors;
    const mobile = width <= 700;
    outdoors.visible = !indoors; house.visible = indoors;
    scene.background.set(indoors ? '#c3ad8b' : '#b7c9b0');
    scene.fog.color.copy(scene.background);
    desiredFocus.set(indoors ? (won && !mobile ? player.x - 2.5 : player.x * .3) : intro ? (mobile ? 0 : -8) : player.x - 1.7,
      indoors && won ? (mobile ? 4.2 : 1.2) : 0,
      indoors ? (won && !mobile ? player.z + 1 : player.z * .3 - 1.2) : intro ? (mobile ? 10.5 : 18) : player.z - 1.7);
    const changedScene = previousScene !== (indoors ? 'house' : 'outdoors') || (intro && previousPhase !== 'intro');
    const factor = reducedMotion.matches || changedScene ? 1 : 1 - Math.exp(-Math.min(dt, .1) * (intro ? 2 : 5));
    focus.lerp(desiredFocus, factor);
    const targetHeight = indoors ? (won ? (mobile ? 21 : 22) : mobile ? 25 : 27) : intro ? (mobile ? 30 : 28) : (mobile ? 27 : 23);
    viewHeight = THREE.MathUtils.lerp(viewHeight, targetHeight, factor);
    camera.left = -viewHeight * width / height / 2; camera.right = -camera.left;
    camera.top = viewHeight / 2; camera.bottom = -camera.top; camera.updateProjectionMatrix();
    camera.position.copy(focus).add(cameraOffset); camera.lookAt(focus); camera.updateMatrixWorld();
    hana.position.set(player.x, .07, player.z);
    hanaShadow.position.set(player.x, .055, player.z);
    if (player.moving && !reducedMotion.matches) elapsedWalk += dt;
    const frame = player.moving && !reducedMotion.matches ? Math.floor(elapsedWalk * 8) % 4 : 0;
    transformationTime = won ? Math.min(3.2, transformationTime + Math.max(0, dt)) : 0;
    const transformation = won ? reducedMotion.matches ? 1 : transformationTime / 3.2 : 0;
    const lift = THREE.MathUtils.smoothstep(transformation, .2, .8) * .64;
    const transformed = transformation >= .65;
    const hanaMap = transformed ? maps.goddess : maps.hana[frame];
    if (hana.material.map !== hanaMap) hana.material.map = hanaMap;
    hana.material.map.repeat.x = player.facing < 0 ? -1 : 1;
    hana.material.map.offset.x = player.facing < 0 ? 1 : 0;
    if (player.moving && !reducedMotion.matches) hana.position.y += Math.abs(Math.sin(elapsedWalk * 12)) * .045;
    hana.position.y += lift;
    const goddessScale = 1 + THREE.MathUtils.smoothstep(transformation, .45, .9) * .12;
    hana.scale.set(1.65 * goddessScale, 2.75 * goddessScale, 1);
    hanaShadow.material.opacity = .8 - transformation * .32;
    hanaShadow.scale.set(1 - transformation * .2, 1 - transformation * .2, 1);
    radiance.visible = crownHalo.visible = won;
    // Paint the light before Hana so her face and embroidery retain their colors.
    radiance.renderOrder = crownHalo.renderOrder = won ? 1 : 0;
    hana.renderOrder = won ? 2 : 0;
    radiance.position.set(player.x, 1.65 + lift, player.z - .12);
    crownHalo.position.set(player.x, 2.7 + lift, player.z - .16);
    radiance.material.opacity = THREE.MathUtils.smoothstep(transformation, 0, .5) * .26;
    crownHalo.material.opacity = THREE.MathUtils.smoothstep(transformation, .35, 1) * .3;
    const houseStep = Math.max(0, Math.min(HOUSE_TARGETS.length - 1, game.houseStep || 0));
    const station = HOUSE_TARGETS[houseStep];
    houseMarker.position.set(station.x, .075, station.z);
    houseMarker.visible = indoors && !won;
    houseMarker.material.opacity = .82 + Math.sin(motionTime * 1.4) * .1;
    familyIndicator.visible = indoors && houseStep < 2 && !won;
    familyIndicator.position.set(station.x, houseStep === 0 ? 3.05 : 3, houseStep === 0 ? station.z : cot.z);
    prepPotatoes.forEach(item => { item.visible = houseStep < 3; });
    dinner.forEach(item => { item.visible = won; });
    steam.forEach((object, i) => {
      object.visible = houseStep >= 3;
      object.position.y = 2.1 + i * .24 + Math.sin(motionTime * .9 + i) * .1;
    });
    const collectedPotatoes = game.potatoes || [], collectedTears = game.tears || [];
    for (const target of potatoObjects) {
      const visible = !collectedPotatoes.includes(target.id);
      target.item.visible = target.glow.visible = target.halo.visible = visible;
      target.item.position.y = .26 + Math.sin(motionTime * 1.8 + target.index) * .075;
      target.glow.material.opacity = .22 + Math.sin(motionTime * 1.8 + target.index) * .06;
    }
    for (const target of fairyObjects) {
      const visible = !collectedTears.includes(target.id);
      target.object.visible = target.glow.visible = target.halo.visible = visible;
      target.object.position.y = 1 + Math.sin(motionTime * 1.7 + target.index * 2) * .18;
      target.glow.position.y = 2 + Math.sin(motionTime * 1.7 + target.index * 2) * .18;
      target.glow.material.opacity = .23 + Math.sin(motionTime * 1.3 + target.index) * .05;
      const fairyMap = reducedMotion.matches ? maps.fairies[target.index] : maps.fairyFlutter[target.index][Math.floor(motionTime * 5 + target.index) % 2];
      if (target.object.material.map !== fairyMap) target.object.material.map = fairyMap;
      const near = Math.hypot(player.x - FAIRIES[target.index].x, player.z - FAIRIES[target.index].z) < 3.5;
      target.halo.material.opacity = near ? .65 + (game.holdProgress || 0) * .3 : .4;
    }
    homeHalo.material.opacity = collectedPotatoes.length === POTATOES.length && collectedTears.length === FAIRIES.length ? .7 : .25;
    for (const target of creatureObjects) {
      target.indicator.material.opacity = (game.talked || []).includes(target.id) ? .32 : .9;
      target.indicator.position.y = target.height + .15 + Math.sin(motionTime * 1.6 + target.index) * .06;
    }
    // Each sprite pivots at its existing bottom center, leaving feet and roots fixed.
    for (const target of windSprites) {
      target.object.material.rotation = reducedMotion.matches ? 0 : target.amount *
        (Math.sin(motionTime * target.speed + target.phase) + Math.sin(motionTime * .37 + target.phase * 1.8) * .35);
    }
    for (let i = 0; i < rippleCount; i++) {
      const ripple = rippleSeeds[i], distance = (ripple.distance + motionTime * ripple.speed) % brookLength;
      let segment = brookSegments[brookSegments.length - 1];
      for (const candidate of brookSegments) {
        if (distance < candidate.start + candidate.length) { segment = candidate; break; }
      }
      const along = distance - segment.start, nx = -segment.dz, nz = segment.dx;
      const x = segment.x + segment.dx * along + nx * ripple.offset, z = segment.z + segment.dz * along + nz * ripple.offset;
      const span = ripple.width * (.75 + Math.sin(motionTime * .8 + ripple.phase) * .2);
      for (let piece = 0; piece < 3; piece++) for (let end = 0; end < 2; end++) {
        const across = (piece + end) / 3 * 2 - 1, bend = (1 - across * across) * .07;
        const vertex = i * 6 + piece * 2 + end;
        rippleGeo.attributes.position.setXYZ(vertex, x + nx * across * span + segment.dx * bend, .053, z + nz * across * span + segment.dz * bend);
      }
    }
    rippleGeo.attributes.position.needsUpdate = true;
    // Fade only trees that actually cover Hana in the current camera projection.
    projectedPlayer.copy(hana.position); projectedPlayer.y += 1.3; projectedPlayer.project(camera);
    for (const target of occluders) {
      projectedBase.set(target.x, .04, target.z).project(camera);
      projectedTop.set(target.x, target.height, target.z).project(camera);
      const inFront = target.x * cameraOffset.x + target.z * cameraOffset.z > player.x * cameraOffset.x + player.z * cameraOffset.z + .4;
      const horizontal = target.object.scale.x / (viewHeight * width / height) * .72;
      const covers = !intro && !indoors && inFront && Math.abs(projectedBase.x - projectedPlayer.x) < horizontal && projectedPlayer.y > projectedBase.y - .04 && projectedPlayer.y < projectedTop.y + .04;
      target.object.material.opacity = THREE.MathUtils.lerp(target.object.material.opacity, covers ? (target.fadedOpacity || .2) : 1, factor);
    }
    if (!reducedMotion.matches) {
      for (let i = 0; i < moteCount; i++) {
        const origin = moteOrigins[i];
        motePositions[i * 3] = origin.x + Math.sin(time * .22 + origin.phase) * .6;
        motePositions[i * 3 + 1] = origin.y + Math.sin(time * .4 + origin.phase) * .3;
      }
      moteGeo.attributes.position.needsUpdate = true;
    }
    previousScene = indoors ? 'house' : 'outdoors';
    previousPhase = game.phase;
    renderer.render(scene, camera);
  }

  function dispose() {
    geometries.forEach(geometry => geometry.dispose()); materials.forEach(mat => mat.dispose());
    maps.dispose(); floorMap.dispose(); woodMap.dispose(); plasterMap.dispose(); clothMap.dispose(); pathMap.dispose(); windowMap.dispose(); renderer.dispose(); renderer.domElement.remove();
  }
  return { update, resize, dispose, renderer, scene, camera };
}
