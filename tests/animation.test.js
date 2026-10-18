import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { actionFrame, createAnimatedMaterial, cycleFrame, updateAnimatedMap } from '../src/animation.js';

function fixture(t) {
  const frames = Array.from({ length: 3 }, () => new THREE.Texture());
  const material = createAnimatedMaterial({ map: frames[0], transparent: true, depthWrite: false, alphaTest: .025 });
  const shader = { uniforms: {}, fragmentShader: THREE.ShaderLib.sprite.fragmentShader };
  material.onBeforeCompile(shader);
  t.after(() => { material.dispose(); frames.forEach(frame => frame.dispose()); });
  return { material, frames, uniforms: shader.uniforms };
}

test('pose cuts get intermediate display frames and finish within 60 ms', t => {
  const { material, frames, uniforms } = fixture(t);
  updateAnimatedMap(material, frames[0], 0);
  updateAnimatedMap(material, frames[1], .1);
  assert.equal(uniforms.previousPose.value, frames[0]);
  assert.equal(uniforms.poseWeight.value, 0);
  updateAnimatedMap(material, frames[1], .12);
  assert.ok(uniforms.poseWeight.value > 0 && uniforms.poseWeight.value < 1);
  updateAnimatedMap(material, frames[1], .14);
  assert.ok(uniforms.poseWeight.value > .5 && uniforms.poseWeight.value < 1);
  updateAnimatedMap(material, frames[1], .17);
  assert.equal(uniforms.poseWeight.value, 1);
  assert.equal(uniforms.previousPose.value, frames[1]);
});

test('an unchanged clock freezes a transition, and replay resets to an exact pose', t => {
  const { material, frames, uniforms } = fixture(t);
  updateAnimatedMap(material, frames[0], 0);
  updateAnimatedMap(material, frames[1], 1);
  updateAnimatedMap(material, frames[1], 1.03);
  const pausedWeight = uniforms.poseWeight.value;
  for (let i = 0; i < 60; i++) updateAnimatedMap(material, frames[1], 1.03);
  assert.equal(uniforms.poseWeight.value, pausedWeight);
  updateAnimatedMap(material, frames[0], 0);
  assert.equal(material.map, frames[0]);
  assert.equal(uniforms.previousPose.value, frames[0]);
  assert.equal(uniforms.poseWeight.value, 1);
});

test('live reduced motion and scene replacement show the requested pose immediately', t => {
  const { material, frames, uniforms } = fixture(t);
  updateAnimatedMap(material, frames[0], 0);
  updateAnimatedMap(material, frames[1], .1);
  updateAnimatedMap(material, frames[2], .12, true);
  assert.equal(material.map, frames[2]);
  assert.equal(uniforms.previousPose.value, frames[2]);
  assert.equal(uniforms.poseWeight.value, 1);
  const recompiled = { uniforms: {}, fragmentShader: THREE.ShaderLib.sprite.fragmentShader };
  material.onBeforeCompile(recompiled);
  assert.equal(recompiled.uniforms.poseWeight, uniforms.poseWeight);
});

test('more poses preserve loop length and action completion rather than speeding them up', () => {
  for (const [duration, count] of [[2 / 3, 8], [.8, 8], [2, 6], [6, 6], [3, 12], [4 / 3.8, 12], [8 / 7.6, 32]]) {
    assert.equal(cycleFrame(0, duration, count), 0);
    assert.equal(cycleFrame(duration / 2, duration, count), count / 2);
    assert.equal(cycleFrame(duration - .00001, duration, count), count - 1);
    assert.equal(cycleFrame(duration, duration, count), 0);
  }
  for (const count of [11, 12]) {
    assert.equal(actionFrame(0, count), 0);
    assert.equal(actionFrame(.5, count), Math.floor(count / 2));
    assert.equal(actionFrame(1, count), count - 1);
    assert.equal(actionFrame(2, count), count - 1);
  }
});
