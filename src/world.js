import * as THREE from 'three';
import { BOUNDS, START, HOME, POTATOES, FAIRIES, CREATURES, TRAILS, OBSTACLES } from './data.js';
import { createSpriteTextures } from './sprites.js';

const COLORS = { grass: '#bdcb8a', path: '#ddcb9c', rim: '#b5bc7d', water: '#78b5b5' };

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
  const c = canvas.getContext('2d');
  const rng = randomSource(84);
  c.fillStyle = COLORS.grass;
  c.fillRect(0, 0, 2048, 2048);
  const patches = [[.45, .38, .3, '#e1d791'], [.34, .59, .18, '#a9bf83'], [.6, .65, .18, '#d7d18b'], [.57, .4, .2, '#c9cc8a'], [.5, .77, .18, '#afc484']];
  for (const [x, y, r, color] of patches) {
    const gradient = c.createRadialGradient(x * 2048, y * 2048, 0, x * 2048, y * 2048, r * 2048);
    gradient.addColorStop(0, color); gradient.addColorStop(1, `${color}00`);
    c.fillStyle = gradient; c.fillRect(0, 0, 2048, 2048);
  }
  for (let i = 0; i < 23000; i++) {
    const x = rng() * 2048, y = rng() * 2048;
    c.fillStyle = i % 3 ? '#627a4910' : '#fff5c31d';
    c.beginPath(); c.ellipse(x, y, 1 + rng() * 3, 1 + rng() * 2, rng() * Math.PI, 0, Math.PI * 2); c.fill();
  }
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return map;
}

export function createWorld(container) {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#dce7ca');
  scene.fog = new THREE.Fog('#dce7ca', 63, 122);
  const camera = new THREE.OrthographicCamera(-20, 20, 15, -15, .1, 180);
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, powerPreference: 'high-performance' });
  renderer.setClearColor('#dce7ca');
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.domElement.className = 'world-canvas';
  renderer.domElement.style.width = '100%';
  renderer.domElement.style.height = '100%';
  renderer.domElement.setAttribute('aria-hidden', 'true');
  container.appendChild(renderer.domElement);
  const maps = createSpriteTextures();
  const materials = new Set();
  const geometries = new Set();
  const rng = randomSource(7729);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  scene.add(new THREE.HemisphereLight('#fff2d0', '#8fa57f', 1.2));
  const sunlight = new THREE.DirectionalLight('#fff1cb', 1.4);
  sunlight.position.set(-25, 40, 20); scene.add(sunlight);

  function material(color, options = {}) {
    const value = new THREE.MeshBasicMaterial({ color, ...options });
    materials.add(value); return value;
  }
  function solidMaterial(color) {
    const value = new THREE.MeshLambertMaterial({ color });
    materials.add(value); return value;
  }
  function mesh(geometry, mat, x, y, z) {
    geometries.add(geometry);
    const object = new THREE.Mesh(geometry, mat);
    object.position.set(x, y, z); scene.add(object); return object;
  }
  function sprite(map, x, z, width, height, y = .04, options = {}) {
    const mat = new THREE.SpriteMaterial({ map, transparent: true, depthWrite: false, alphaTest: .025, ...options });
    materials.add(mat);
    const object = new THREE.Sprite(mat);
    object.center.set(.5, 0);
    object.scale.set(width, height, 1);
    object.position.set(x, y, z);
    scene.add(object); return object;
  }
  function flatDisc(x, z, radius, color, y = .03, opacity = 1) {
    const disc = mesh(new THREE.CircleGeometry(radius, 32), material(color, { transparent: opacity < 1, opacity, depthWrite: opacity === 1 }), x, y, z);
    disc.rotation.x = -Math.PI / 2; return disc;
  }
  function shadow(x, z, width, depth, opacity = .65) {
    const object = mesh(new THREE.PlaneGeometry(width, depth), material('#ffffff', { map: maps.shadow, transparent: true, opacity, depthWrite: false }), x, .055, z);
    object.rotation.x = -Math.PI / 2; return object;
  }
  const floorMap = groundTexture();
  const ground = mesh(new THREE.PlaneGeometry(180, 180), material('#ffffff', { map: floorMap }), 0, 0, 0);
  ground.rotation.x = -Math.PI / 2;

  // Rounded path ribbons sit on the same flat surface as every walkable target.
  function ribbon(points, width, color, elevation) {
    const vertices = [], indices = [];
    points.forEach((point, i) => {
      const before = points[Math.max(0, i - 1)], after = points[Math.min(points.length - 1, i + 1)];
      const dx = after[0] - before[0], dz = after[1] - before[1], length = Math.hypot(dx, dz);
      vertices.push(point[0] - dz / length * width / 2, elevation, point[1] + dx / length * width / 2,
        point[0] + dz / length * width / 2, elevation, point[1] - dx / length * width / 2);
      if (i) { const n = i * 2; indices.push(n - 2, n - 1, n, n - 1, n + 1, n); }
    });
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3)); geo.setIndex(indices); geo.computeVertexNormals();
    mesh(geo, material(color, { side: THREE.DoubleSide }), 0, 0, 0);
    for (const [x, z] of points) flatDisc(x, z, width / 2, color, elevation + .001);
  }
  for (const trail of TRAILS) {
    ribbon(trail, 2.35, '#b9bd80', .017);
    ribbon(trail, 1.88, COLORS.path, .024);
  }
  ribbon([[0, 18], [-3, 15], [-4, 12]], 1.25, COLORS.path, .026);
  for (const target of POTATOES) {
    if (pathDistance(target.x, target.z) > 1.4) {
      let nearest = TRAILS[0][0], distance = Infinity;
      for (const trail of TRAILS) for (const point of trail) {
        const d = Math.hypot(target.x - point[0], target.z - point[1]);
        if (d < distance) { nearest = point; distance = d; }
      }
      ribbon([[target.x, target.z], nearest], 1.05, '#d2c698', .025);
    }
  }
  // The brook stays east of the trail. A small wooden bridge leads into its bank.
  const brook = [[22, -34], [20, -26], [22, -18], [21, -12], [19.5, -7], [20.5, -1], [22, 5], [25, 12], [29, 22], [34, 35]];
  ribbon(brook, 3.4, '#b9c9a2', .032);
  ribbon(brook, 2.65, COLORS.water, .039);
  ribbon(brook.map(([x, z]) => [x + .25, z]), .28, '#c0d8c4', .045);
  const boardMat = solidMaterial('#bd9a67'), boardAlt = solidMaterial('#cbaa79'), railMat = solidMaterial('#967e58');
  for (let i = 0; i < 12; i++) mesh(new THREE.BoxGeometry(.33, .13, 2.15), i % 3 ? boardMat : boardAlt, 17.9 + i * .34, .16, -7.1);
  for (const x of [17.8, 21.9]) for (const z of [-8.1, -6.1]) mesh(new THREE.BoxGeometry(.12, .8, .12), railMat, x, .48, z);
  for (const z of [-8.1, -6.1]) mesh(new THREE.BoxGeometry(4.2, .1, .11), railMat, 19.85, .74, z);
  ribbon([[15, -7], [18, -7]], 1.4, COLORS.path, .03);

  const occluders = [];
  function tree(x, z, kind, size = 1) {
    const isBirch = kind === 'birch';
    const height = (isBirch ? 7.3 : 7.8) * size;
    const width = (isBirch ? 4.9 : 5.2) * size;
    shadow(x + .25, z + .15, width * .8, width * .46, .55);
    const object = sprite(isBirch ? maps.birch[Math.floor(rng() * 2)] : maps.fir[Math.floor(rng() * 3)], x, z, width, height);
    occluders.push({ object, x, z, height });
    return object;
  }
  // Collision props use the shared obstacle positions. Other trees leave trails clear.
  for (const obstacle of OBSTACLES) {
    if (obstacle.type === 'tree') tree(obstacle.x, obstacle.z, obstacle.x < -8 ? 'birch' : 'fir', .85 + rng() * .2);
    if (obstacle.type === 'rock') {
      shadow(obstacle.x, obstacle.z, 2.4, 1.7, .55);
      const rock = mesh(new THREE.SphereGeometry(.95, 16, 12), solidMaterial('#9aab91'), obstacle.x, .51, obstacle.z);
      rock.scale.set(1, .65, .8); rock.rotation.set(.2, .4, -.2);
      const moss = mesh(new THREE.SphereGeometry(.67, 16, 10), solidMaterial('#8caa6e'), obstacle.x - .2, .83, obstacle.z - .1);
      moss.scale.set(1, .24, .7);
    }
  }
  const allTargets = [...POTATOES, ...FAIRIES, ...CREATURES, HOME, START];
  function clearForTree(x, z) {
    if (pathDistance(x, z) < 4.0) return false;
    if (allTargets.some(target => Math.hypot(x - target.x, z - target.z) < 5.0)) return false;
    if (Math.hypot(x, z - 21) < 6.5) return false;
    if (x > 17 && x < 25 && z > -29 && z < 16) return false;
    return !occluders.some(t => Math.hypot(x - t.x, z - t.z) < 3.4);
  }
  for (let i = 0; i < 320; i++) {
    const x = -35 + rng() * 70, z = -37 + rng() * 71;
    if (clearForTree(x, z)) tree(x, z, x < -8 && z > -15 ? 'birch' : 'fir', .72 + rng() * .42);
  }
  // Distant woods and rounded ridges conceal the edge of the walking area.
  for (let i = 0; i < 90; i++) {
    const angle = rng() * Math.PI * 2, radius = 43 + rng() * 24;
    tree(Math.cos(angle) * radius, Math.sin(angle) * radius, 'fir', 1 + rng() * .65);
  }
  for (let i = 0; i < 11; i++) {
    const x = -72 + i * 14, z = -48 - rng() * 13;
    const hill = mesh(new THREE.SphereGeometry(12 + rng() * 9, 24, 12), solidMaterial(i % 2 ? '#a9bd9c' : '#b6c6a2'), x, -1, z);
    hill.scale.set(1.5, .5 + rng() * .3, 1);
  }

  // A few hand-painted clusters make clearings feel tended and alive.
  for (let i = 0; i < 220; i++) {
    const x = BOUNDS.minX - 5 + rng() * 58, z = BOUNDS.minZ - 4 + rng() * 58;
    if (pathDistance(x, z) < 1.4 || allTargets.some(t => Math.hypot(x - t.x, z - t.z) < 1.75)) continue;
    if (x > 18 && z < 9) continue;
    const map = i % 8 === 0 ? maps.mushrooms : i % 3 === 0 ? maps.blueFlowers : maps.flowers;
    const size = .55 + rng() * .65;
    sprite(map, x, z, size * 1.5, size * 1.25);
  }
  for (const [x, z, size] of [[-18, -12, 1], [-13, -11, .7], [14, -10, .8], [-6, 16, .8], [6, 17, 1], [-2, -19, .8]]) {
    sprite(maps.mushrooms, x, z, size * 1.6, size * 1.3);
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
  sprite(maps.flowers, -3.8, 21, 1.5, 1.3);
  sprite(maps.flowers, 3.5, 21.8, 1.5, 1.3);
  // A Czech trail blaze: white, blue, white bands on an upright trail post.
  const postMat = material('#8b7953'), white = material('#f7f0d5'), blue = material('#4c8ca5');
  for (const [x, z] of [[-2.5, 7.8], [-14, -1.6], [8, -18]]) {
    mesh(new THREE.BoxGeometry(.2, 1.6, .2), postMat, x, .8, z);
    for (let band = 0; band < 3; band++) mesh(new THREE.BoxGeometry(.31, .1, .25), band === 1 ? blue : white, x, 1.25 - band * .1, z);
    const sign = mesh(new THREE.BoxGeometry(1.1, .24, .13), material('#d7c89b'), x + .34, 1.52, z);
    sign.rotation.y = -.35;
  }

  const potatoObjects = POTATOES.map((target, i) => {
    const soil = flatDisc(target.x, target.z, 1.65, '#a99564', .04); soil.scale.set(1.15, .8, 1);
    flatDisc(target.x - .2, target.z + .1, 1.3, '#b09b69', .043).scale.set(1.15, .72, 1);
    for (let row = -1; row <= 1; row++) ribbon([[target.x - 1.1, target.z + row * .5], [target.x + 1.1, target.z + row * .5]], .09, '#8e8056', .047);
    sprite(maps.potatoLeaves, target.x - .7, target.z - .35, 1.7, 1.25);
    sprite(maps.potatoLeaves, target.x + .6, target.z - .1, 1.9, 1.42);
    const glow = sprite(maps.glow, target.x, target.z + .1, 3.3, 3.3, .1, { color: '#ffe6a6', blending: THREE.AdditiveBlending, opacity: .22 });
    glow.center.set(.5, .5); glow.position.y = .65;
    const item = sprite(maps.potato, target.x, target.z + .25, 1.35, 1.18, .22);
    const halo = mesh(new THREE.RingGeometry(.85, .89, 40), material('#fff1ba', { transparent: true, opacity: .65, side: THREE.DoubleSide, depthWrite: false }), target.x, .07, target.z);
    halo.rotation.x = -Math.PI / 2;
    return { id: target.id, item, glow, halo, index: i };
  });
  const fairyObjects = FAIRIES.map((target, i) => {
    flatDisc(target.x, target.z, 2.5, i === 1 ? '#d4d191' : '#b2c28a', .028);
    for (let p = 0; p < 8; p++) {
      const angle = p / 8 * Math.PI * 2;
      sprite(p % 2 ? maps.blueFlowers : maps.flowers, target.x + Math.cos(angle) * 2.1, target.z + Math.sin(angle) * 2.1, .75, .65);
    }
    const glow = sprite(maps.glow, target.x, target.z, 4.5, 4.5, 1.9, { color: target.color, blending: THREE.AdditiveBlending, opacity: .23 });
    glow.center.set(.5, .5);
    const object = sprite(maps.fairies[i], target.x, target.z, 1.9, 2.4, 1.0);
    const halo = mesh(new THREE.RingGeometry(1.15, 1.19, 48), material(target.color, { transparent: true, opacity: .7, side: THREE.DoubleSide, depthWrite: false }), target.x, .07, target.z);
    halo.rotation.x = -Math.PI / 2;
    shadow(target.x, target.z, 1.6, 1, .38);
    return { id: target.id, object, glow, halo, index: i };
  });
  const homeHalo = mesh(new THREE.RingGeometry(1.2, 1.26, 48), material('#fff0bb', { transparent: true, opacity: .45, side: THREE.DoubleSide, depthWrite: false }), HOME.x, .07, HOME.z);
  homeHalo.rotation.x = -Math.PI / 2;

  const creatureObjects = CREATURES.map((target, i) => {
    const kind = ['fox', 'owl', 'deer'][i];
    const height = kind === 'deer' ? 3.2 : 2.25;
    sprite(maps[kind], target.x, target.z, height * .8, height);
    shadow(target.x, target.z, 1.8, 1, .6);
    const indicator = sprite(maps.conversation, target.x, target.z, .75, .75, height + .15);
    return { id: target.id, indicator, height, index: i };
  });

  const hana = sprite(maps.hana[0], START.x, START.z, 1.65, 2.75, .07);
  const hanaShadow = shadow(START.x, START.z, 1.7, 1, .8);
  // Soft motes use one draw call, even on small screens.
  const moteCount = 72, motePositions = new Float32Array(moteCount * 3), moteOrigins = [];
  for (let i = 0; i < moteCount; i++) {
    const x = -25 + rng() * 50, z = -29 + rng() * 51, y = .6 + rng() * 5;
    moteOrigins.push({ x, y, z, phase: rng() * 6.28 });
    motePositions.set([x, y, z], i * 3);
  }
  const moteGeo = new THREE.BufferGeometry(); geometries.add(moteGeo);
  moteGeo.setAttribute('position', new THREE.BufferAttribute(motePositions, 3));
  const moteMat = new THREE.PointsMaterial({ map: maps.glow, color: '#fff4c4', size: .28, transparent: true, opacity: .7, depthWrite: false, blending: THREE.AdditiveBlending });
  materials.add(moteMat); const motes = new THREE.Points(moteGeo, moteMat); scene.add(motes);

  const focus = new THREE.Vector3(-8, 0, 18);
  const desiredFocus = new THREE.Vector3();
  const cameraOffset = new THREE.Vector3(32, 35, 32);
  const projectedPlayer = new THREE.Vector3(), projectedBase = new THREE.Vector3(), projectedTop = new THREE.Vector3();
  let width = 1, height = 1, viewHeight = 29, elapsedWalk = 0;

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
    const mobile = width <= 700;
    desiredFocus.set(intro ? (mobile ? 0 : -8) : player.x - 1.7, 0, intro ? (mobile ? 10.5 : 18) : player.z - 1.7);
    const factor = reducedMotion.matches ? 1 : 1 - Math.exp(-Math.min(dt, .1) * (intro ? 2 : 5));
    focus.lerp(desiredFocus, factor);
    const targetHeight = intro ? (mobile ? 30 : 28) : (mobile ? 27 : 23);
    viewHeight = THREE.MathUtils.lerp(viewHeight, targetHeight, factor);
    camera.left = -viewHeight * width / height / 2; camera.right = -camera.left;
    camera.top = viewHeight / 2; camera.bottom = -camera.top; camera.updateProjectionMatrix();
    camera.position.copy(focus).add(cameraOffset); camera.lookAt(focus); camera.updateMatrixWorld();
    hana.position.set(player.x, .07, player.z);
    hanaShadow.position.set(player.x, .055, player.z);
    if (player.moving && !reducedMotion.matches) elapsedWalk += dt;
    const frame = player.moving && !reducedMotion.matches ? Math.floor(elapsedWalk * 8) % 4 : 0;
    if (hana.material.map !== maps.hana[frame]) hana.material.map = maps.hana[frame];
    hana.material.map.repeat.x = player.facing < 0 ? -1 : 1;
    hana.material.map.offset.x = player.facing < 0 ? 1 : 0;
    if (player.moving && !reducedMotion.matches) hana.position.y += Math.abs(Math.sin(elapsedWalk * 12)) * .045;
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
      const near = Math.hypot(player.x - FAIRIES[target.index].x, player.z - FAIRIES[target.index].z) < 3.5;
      target.halo.material.opacity = near ? .65 + (game.holdProgress || 0) * .3 : .4;
    }
    homeHalo.material.opacity = collectedPotatoes.length === POTATOES.length && collectedTears.length === FAIRIES.length ? .7 : .25;
    for (const target of creatureObjects) {
      target.indicator.material.opacity = (game.talked || []).includes(target.id) ? .32 : .9;
      target.indicator.position.y = target.height + .15 + Math.sin(motionTime * 1.6 + target.index) * .06;
    }
    // Fade only trees that actually cover Hana in the current camera projection.
    projectedPlayer.copy(hana.position); projectedPlayer.y += 1.3; projectedPlayer.project(camera);
    for (const target of occluders) {
      projectedBase.set(target.x, .04, target.z).project(camera);
      projectedTop.set(target.x, target.height, target.z).project(camera);
      const inFront = target.x * cameraOffset.x + target.z * cameraOffset.z > player.x * cameraOffset.x + player.z * cameraOffset.z + .4;
      const horizontal = target.object.scale.x / (viewHeight * width / height) * .72;
      const covers = !intro && inFront && Math.abs(projectedBase.x - projectedPlayer.x) < horizontal && projectedPlayer.y > projectedBase.y - .04 && projectedPlayer.y < projectedTop.y + .04;
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
    renderer.render(scene, camera);
  }

  function dispose() {
    geometries.forEach(geometry => geometry.dispose()); materials.forEach(mat => mat.dispose());
    maps.dispose(); floorMap.dispose(); renderer.dispose(); renderer.domElement.remove();
  }
  return { update, resize, dispose, renderer, scene, camera };
}
