import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createFamilyFinale } from '../src/finale-scene.js';

function fixture(t, width = 1280, height = 800) {
  // Canvas painting is covered by browser inspection. These checks use the real
  // Three.js objects and camera to test placement, timing, and resource lifetime.
  const oldDocument = globalThis.document;
  const context = new Proxy({}, { get: (_, name) => name.startsWith('create') ? () => ({ addColorStop() {} }) : () => {} });
  globalThis.document = { createElement: () => ({ getContext: () => context }) };
  const scene = new THREE.Scene();
  const frames = length => Array.from({ length }, () => new THREE.Texture());
  const painted = { sing: frames(12), actions: frames(12), cat: frames(6), idle: frames(9) };
  const finale = createFamilyFinale(scene, painted, new THREE.Texture());
  const camera = new THREE.PerspectiveCamera(35, width / height, .1, 180);
  const distance = Math.max(22, 9.8 / (2 * Math.tan(THREE.MathUtils.degToRad(17.5)) * camera.aspect));
  const focus = new THREE.Vector3(0, width <= 700 ? 2.4 : 3.4, 0);
  camera.position.copy(focus).add(new THREE.Vector3(distance * Math.cos(Math.PI / 6) * Math.SQRT1_2, distance * .5, distance * Math.cos(Math.PI / 6) * Math.SQRT1_2));
  camera.lookAt(focus); camera.updateMatrixWorld();
  const game = { scene: 'house', phase: 'won', ending: 'dance', finaleTime: 0, dancePlaying: false, danceTime: 0 };
  const update = (reduced = false) => finale.update(game, camera, width, height, reduced);
  t.after(() => { finale.dispose(); globalThis.document = oldDocument; });
  return { scene, finale, game, update, painted };
}

test('the video becomes visible after John finishes lowering the screen, and resets on scene exit', t => {
  const { scene, finale, game, update } = fixture(t);
  update(); assert.equal(finale.projectorBounds().visible, false);
  game.finaleTime = 3.99; update(); assert.equal(finale.projectorBounds().visible, false);
  game.finaleTime = 4; update(); assert.equal(finale.projectorBounds().visible, true);
  game.ending = 'goddess'; update();
  assert.equal(scene.getObjectByName('family-dance-finale').visible, false);
  assert.equal(finale.projectorBounds().visible, false);
  game.ending = 'dance'; game.finaleTime = 0; update();
  assert.equal(finale.projectorBounds().visible, false);
  assert.equal(scene.getObjectByName('projector-video-region').visible, false);
});

test('the screen fits a portrait viewport and keeps the video ratio', t => {
  const { finale, game, update } = fixture(t, 390, 844);
  game.finaleTime = 4; update();
  const bounds = finale.projectorBounds();
  assert.ok(bounds.left > 0 && bounds.left + bounds.width < 390);
  assert.ok(bounds.top > 0 && bounds.top + bounds.height < 844);
  assert.ok(bounds.width > 300);
  assert.ok(bounds.height >= 200);
  assert.ok(Math.abs(bounds.width / bounds.height - 4 / 3) < .00001);
});

test('dancing uses the playback clock, and reduced motion immediately gives a stable complete scene', t => {
  const { scene, game, update, painted, finale } = fixture(t);
  game.finaleTime = 4; update();
  const percy = scene.getObjectByName('dancing-percy');
  const aldo = scene.getObjectByName('dancing-aldo-in-cot');
  const restingCat = percy.position.clone(), restingBaby = aldo.material.map;
  game.dancePlaying = true; game.danceTime = .12; update();
  assert.notDeepEqual(percy.position.toArray(), restingCat.toArray());
  const dancingCat = percy.position.clone();
  game.dancePlaying = false; update();
  assert.deepEqual(percy.position.toArray(), dancingCat.toArray());
  game.danceTime = .2; update(); assert.notEqual(aldo.material.map, restingBaby);
  game.finaleTime = 0; update(true);
  assert.equal(finale.projectorBounds().visible, true);
  const stillCat = percy.position.clone(), stillBaby = aldo.material.map;
  game.danceTime = 99; update(true);
  assert.deepEqual(percy.position.toArray(), stillCat.toArray());
  assert.equal(aldo.material.map, stillBaby);
  assert.equal(scene.getObjectByName('dancing-hana').material.map, painted.sing[10]);
});

test('repeated finale replays reuse the scene and dispose owned resources', t => {
  const { scene, finale, game, update } = fixture(t);
  const resources = new Set(); let objects = 0;
  scene.traverse(object => { objects++; if (object.geometry && !object.isSprite) resources.add(object.geometry); if (object.material) resources.add(object.material); });
  let disposed = 0;
  resources.forEach(resource => resource.addEventListener('dispose', () => { disposed++; }));
  for (let i = 0; i < 500; i++) {
    game.finaleTime = i % 5; game.danceTime = i / 60; game.ending = i % 3 ? 'dance' : 'goddess'; update();
  }
  let after = 0; scene.traverse(() => { after++; }); assert.equal(after, objects);
  finale.dispose(); assert.equal(disposed, resources.size);
  assert.equal(scene.getObjectByName('family-dance-finale'), undefined);
});
