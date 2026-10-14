import * as THREE from 'three';

// The film and the family share a fixed composition. Sprites and the screen face
// the camera, so the HTML player can occupy the screen without a skewed edge.
export function createFamilyFinale(scene, painted, shadowMap) {
  const group = new THREE.Group();
  group.name = 'family-dance-finale'; group.visible = false; scene.add(group);
  const materials = [], geometries = [], textures = [];
  const right = new THREE.Vector3(Math.SQRT1_2, 0, -Math.SQRT1_2);
  const toward = new THREE.Vector3(Math.SQRT1_2, 0, Math.SQRT1_2);
  const up = new THREE.Vector3();
  const vertical = new THREE.Vector3(0, 1, 0);
  const corner = new THREE.Vector3(), otherCorner = new THREE.Vector3();
  const bounds = { left: 0, top: 0, width: 0, height: 0, visible: false };
  const screenWidth = 8.4, videoWidth = 8, videoHeight = videoWidth * 3 / 4;
  const screenHeight = videoHeight + .36;
  const adultDepth = 1.7, cotDepth = 2.1, catDepth = 2.25;

  function mat(color, options = {}) {
    const value = new THREE.MeshBasicMaterial({ color, ...options });
    materials.push(value); return value;
  }
  function plane(width, height, material) {
    const geometry = new THREE.PlaneGeometry(width, height); geometries.push(geometry);
    const object = new THREE.Mesh(geometry, material); group.add(object); return object;
  }
  function person(name, texture, size) {
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, alphaTest: .025 });
    materials.push(material);
    const object = new THREE.Sprite(material); object.name = name;
    object.center.set(.5, 0); object.scale.set(size, size, 1); group.add(object); return object;
  }
  function place(object, x, y, depth) {
    object.position.copy(right).multiplyScalar(x).addScaledVector(toward, depth);
    object.position.y = y;
  }
  function floorShadow(x, depth, width, height) {
    const object = plane(width, height, mat('#ffffff', { map: shadowMap, transparent: true, opacity: .58, depthWrite: false }));
    place(object, x, .065, depth); object.rotation.x = -Math.PI / 2; return object;
  }

  const screen = new THREE.Group(); screen.name = 'projector-screen'; group.add(screen);
  place(screen, 0, 5.1, -1.6);
  function screenPlane(width, height, color, x, y, z = 0) {
    const object = plane(width, height, mat(color)); screen.add(object); object.position.set(x, y, z); return object;
  }
  const fabric = screenPlane(screenWidth, screenHeight, '#f3e8ce', 0, 0);
  const film = screenPlane(videoWidth, videoHeight, '#d6d0bc', 0, 0, .01);
  film.name = 'projector-video-region';
  const bottomBar = screenPlane(screenWidth + .16, .12, '#5c5548', 0, -screenHeight / 2, .025);
  screenPlane(screenWidth + .34, .22, '#706655', 0, screenHeight / 2 + .12, .025);
  screenPlane(screenWidth + .12, .065, '#cbbd9d', 0, screenHeight / 2 + .17, .035);
  for (const x of [-screenWidth / 2 - .1, screenWidth / 2 + .1]) {
    screenPlane(.13, .32, '#4e4d41', x, screenHeight / 2 + .12, .03);
  }
  const cordGeometry = new THREE.CylinderGeometry(.012, .012, 1, 6); geometries.push(cordGeometry);
  const cord = new THREE.Mesh(cordGeometry, mat('#ece0b8')); group.add(cord);
  cord.name = 'projector-pull-cord';
  const ringGeometry = new THREE.TorusGeometry(.09, .026, 8, 20); geometries.push(ringGeometry);
  const handle = new THREE.Mesh(ringGeometry, mat('#ab8757')); handle.name = 'projector-pull-handle'; group.add(handle);

  const hana = person('dancing-hana', painted.sing[2], 3.15);
  const john = person('dancing-john', painted.actions[10], 3.3);
  const percy = person('dancing-percy', painted.cat[5], 1.45);
  const babyFrames = Array.from({ length: 8 }, (_, index) => {
    const texture = babyCotFrame(index); textures.push(texture); return texture;
  });
  const aldo = person('dancing-aldo-in-cot', babyFrames[0], 3.15);
  aldo.scale.y = 2.46;
  const johnShadow = floorShadow(-2.9, adultDepth, 1.7, 1);
  const hanaShadow = floorShadow(2.5, adultDepth, 1.7, 1);
  floorShadow(-.8, cotDepth, 2.65, 1.4);
  const percyShadow = floorShadow(1.05, catDepth, 1.1, .75);

  function update(game, camera, width, height, reducedMotion) {
    const active = game.scene === 'house' && game.phase === 'won' && game.ending === 'dance';
    group.visible = active; bounds.visible = false;
    if (!active) return;
    const revealTime = reducedMotion ? 4 : Math.max(0, game.finaleTime || 0);
    const pull = THREE.MathUtils.smoothstep(revealTime, 1.1, 3.35);
    const returnToDance = THREE.MathUtils.smoothstep(revealTime, 3.4, 4);
    const approach = THREE.MathUtils.smoothstep(revealTime, 0, 1.1);
    // danceTime belongs to actual video playback, not the page's animation clock.
    const danceTime = reducedMotion ? 0 : Math.max(0, game.danceTime || 0);
    const started = reducedMotion || game.dancePlaying || danceTime > 0;
    const beat = started ? Math.sin(danceTime * Math.PI * 3.8) : 0;
    const sway = started ? Math.sin(danceTime * Math.PI * 1.9) : 0;
    const danceFrame = reducedMotion ? 2 : Math.floor(danceTime * 3.8) % 4;
    screen.quaternion.copy(camera.quaternion);
    const heightNow = .06 + (screenHeight - .06) * pull;
    fabric.scale.y = heightNow / screenHeight;
    fabric.position.y = (screenHeight - heightNow) / 2;
    film.visible = pull >= 1;
    bottomBar.position.y = screenHeight / 2 - heightNow;

    const walkX = THREE.MathUtils.lerp(-2.9, -3.67, approach);
    const johnX = THREE.MathUtils.lerp(walkX, -2.9, returnToDance) + (revealTime >= 4 ? sway * .23 : 0);
    const crouch = .23 * pull * (1 - returnToDance);
    const johnHeight = 3.3 * (1 - crouch);
    const johnY = .07 + (revealTime >= 4 ? Math.max(0, beat) * .12 : Math.sin(approach * Math.PI * 4) * .045);
    place(john, johnX, johnY, adultDepth);
    john.scale.set(3.3, johnHeight, 1);
    john.material.map = revealTime < .9 ? painted.idle[3] : revealTime < 3.5 || started && danceFrame % 2 === 0 ? painted.actions[10] : painted.idle[3];
    john.material.rotation = revealTime >= 4 ? sway * -.07 : -pull * .045 * (1 - returnToDance);
    place(johnShadow, johnX, .065, adultDepth);

    // The cord ends at the raised palm in the original painted John pose. As he
    // bends his knees, his hand pulls the ring down and the fabric unrolls.
    up.set(0, 1, 0).applyQuaternion(camera.quaternion);
    const armAngle = john.material.rotation, palmY = johnHeight * .80;
    handle.position.copy(john.position)
      .addScaledVector(right, -.51 * Math.cos(armAngle) - palmY * Math.sin(armAngle))
      .addScaledVector(up, -.51 * Math.sin(armAngle) + palmY * Math.cos(armAngle));
    if (revealTime < 1.1 || revealTime >= 3.4) {
      const released = revealTime >= 3.4;
      place(handle, released ? -4.08 : -4.18, .07, adultDepth);
      handle.position.addScaledVector(up, 3.3 * .80 * (released ? .77 : 1));
    }
    handle.quaternion.copy(camera.quaternion);
    const cordTop = screenHeight / 2 + .1;
    corner.set(-4.18, cordTop, .045).applyQuaternion(screen.quaternion).add(screen.position);
    otherCorner.copy(corner).sub(handle.position);
    cord.position.copy(corner).add(handle.position).multiplyScalar(.5);
    const cordLength = otherCorner.length();
    cord.scale.y = cordLength;
    cord.quaternion.setFromUnitVectors(vertical, otherCorner.normalize());

    place(hana, 2.55 - sway * .23, .07 + Math.max(0, -beat) * .11, adultDepth);
    hana.material.map = started ? painted.sing[[2, 3, 4, 1][danceFrame] + 6] : painted.idle[6];
    hana.material.rotation = sway * .08;
    hana.scale.set(3.15 * (1 + Math.abs(sway) * .025), 3.15, 1);
    place(hanaShadow, 2.55 - sway * .23, .065, adultDepth);
    place(aldo, -.75, .07, cotDepth);
    aldo.material.map = babyFrames[reducedMotion ? 2 : started ? Math.floor(danceTime * 7.6) % 8 : 0];
    place(percy, 1.02 + sway * .35, .03 + Math.max(0, beat) * .32, catDepth);
    percy.material.map = painted.cat[started ? [5, 2, 5, 4][danceFrame] : 2];
    percy.material.rotation = sway * -.1;
    percy.scale.set(1.45, 1.45 * (1 - Math.max(0, -beat) * .06), 1);
    place(percyShadow, 1.02 + sway * .35, .065, catDepth);
    percyShadow.material.opacity = .58 - Math.max(0, beat) * .2;

    group.updateMatrixWorld(true);
    corner.set(-videoWidth / 2, videoHeight / 2, .01).applyMatrix4(screen.matrixWorld).project(camera);
    otherCorner.set(videoWidth / 2, -videoHeight / 2, .01).applyMatrix4(screen.matrixWorld).project(camera);
    bounds.left = (corner.x + 1) * width / 2; bounds.top = (1 - corner.y) * height / 2;
    bounds.width = (otherCorner.x - corner.x) * width / 2;
    bounds.height = (corner.y - otherCorner.y) * height / 2;
    bounds.visible = revealTime >= 4;
  }
  return {
    update,
    projectorBounds: () => bounds,
    dispose() {
      geometries.forEach(value => value.dispose()); materials.forEach(value => value.dispose());
      textures.forEach(value => value.dispose()); scene.remove(group);
    },
  };
}

function babyCotFrame(frame) {
  const canvas = document.createElement('canvas'); canvas.width = 576; canvas.height = 450;
  const c = canvas.getContext('2d'); c.scale(1.5, 1.5); c.lineCap = 'round'; c.lineJoin = 'round';
  const phase = frame / 8 * Math.PI * 2;
  const ellipse = (x, y, rx, ry, color, angle = 0) => {
    c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, angle, 0, Math.PI * 2); c.fill();
  };
  const line = (points, color, width) => {
    c.strokeStyle = color; c.lineWidth = width; c.beginPath();
    points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
  };
  const shape = (points, color) => {
    c.fillStyle = color; c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath(); c.fill();
  };
  // Aldo stays on his back. Separate bent legs and tiny fists change pose while
  // the mattress, rails, torso, and head stay still.
  const wood = c.createLinearGradient(60, 90, 330, 270); wood.addColorStop(0, '#e0c391'); wood.addColorStop(1, '#987347');
  for (const x of [58, 315]) line([[x, 99], [x, 285]], wood, 12);
  shape([[56, 126], [288, 100], [330, 161], [96, 192]], '#b49364');
  shape([[64, 136], [285, 112], [319, 160], [99, 185]], '#eee6cc');
  line([[73, 139], [284, 117], [308, 156]], '#fff5dd', 4);
  ellipse(183, 151, 30, 19, '#d4d8b9', -.05);
  for (const side of [-1, 1]) {
    const kick = Math.sin(phase + (side < 0 ? Math.PI : 0));
    const kneeY = 131 + side * 11 - Math.max(0, kick) * 23;
    const footX = 247 + kick * 12, footY = 144 + side * 12 - Math.max(0, kick) * 34;
    line([[201, 151 + side * 7], [220, kneeY], [footX, footY]], '#d2d6b4', 17);
    line([[203, 151 + side * 7], [220, kneeY], [footX, footY]], '#f0e7ca', 12);
    ellipse(footX + 2, footY - 2, 9, 5.5, '#edc49e', -.2);
    const handX = 166 + side * 25, handY = 118 - Math.max(0, -kick) * 14;
    line([[178, 146 + side * 8], [183 + side * 22, 126], [handX, handY]], '#e5bb99', 9);
    ellipse(handX, handY - 2, 5.5, 6.5, '#efc9a7', -.2);
  }
  const skin = c.createRadialGradient(135, 139, 2, 142, 152, 25);
  skin.addColorStop(0, '#f5d0ad'); skin.addColorStop(1, '#cd997c');
  ellipse(143, 151, 22, 25, skin, -.25);
  line([[128, 133], [139, 129], [148, 133]], '#a37b53', 2);
  line([[129, 150], [134, 152], [139, 149]], '#78604c', 1.3);
  line([[146, 149], [151, 151], [155, 148]], '#78604c', 1.3);
  ellipse(143, 163, 5, 3, '#b87860', -.1);
  ellipse(129, 158, 4, 2, '#d99880');
  for (const x of [102, 146, 190, 234, 278, 322]) line([[x, 173 - (x - 102) * .11], [x, 252 - (x - 102) * .11]], wood, 8);
  line([[94, 181], [331, 155]], wood, 13); line([[94, 255], [331, 229]], wood, 12);
  line([[58, 126], [95, 182]], wood, 12); line([[58, 208], [95, 254]], wood, 12);
  for (const [x, y] of [[58, 103], [95, 157], [315, 78], [332, 131]]) ellipse(x, y, 8, 9, '#d5b784');
  line([[97, 179], [329, 153]], '#f1d7a7', 3);
  const texture = new THREE.CanvasTexture(canvas); texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}
