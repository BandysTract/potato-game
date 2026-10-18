import * as THREE from 'three';

const transitions = new WeakMap();
const TRANSITION_SECONDS = .06;

// A short pose transition softens a cut without stretching painted anatomy.
// Both samples share one sprite and one draw call. No frames are built on ticks.
export function createAnimatedMaterial(options) {
  const material = new THREE.SpriteMaterial(options);
  const uniforms = { previousPose: { value: material.map }, poseWeight: { value: 1 } };
  transitions.set(material, { uniforms, started: 0, time: null });
  material.onBeforeCompile = shader => {
    Object.assign(shader.uniforms, uniforms);
    shader.fragmentShader = 'uniform sampler2D previousPose;\nuniform float poseWeight;\n' + shader.fragmentShader.replace('#include <map_fragment>', `
      #ifdef USE_MAP
        vec4 current = texture2D(map, vMapUv);
        vec4 previous = texture2D(previousPose, vMapUv);
        float alpha = mix(previous.a, current.a, poseWeight);
        vec3 color = mix(previous.rgb * previous.a, current.rgb * current.a, poseWeight);
        diffuseColor *= vec4(color / max(alpha, .00001), alpha);
      #endif
    `);
  };
  material.customProgramCacheKey = () => 'painted-pose-transition-v1';
  return material;
}

export function updateAnimatedMap(material, map, time, still = false) {
  const state = transitions.get(material);
  const reset = still || state.time === null || time < state.time;
  if (reset || map !== material.map) {
    state.uniforms.previousPose.value = reset ? map : material.map;
    state.started = time;
    material.map = map;
  }
  state.uniforms.poseWeight.value = reset ? 1 : Math.min(1, Math.max(0, (time - state.started) / TRANSITION_SECONDS));
  // Keep the exact original pose after a transition and when motion is disabled.
  if (state.uniforms.poseWeight.value === 1) state.uniforms.previousPose.value = map;
  state.time = time;
}

export function cycleFrame(time, duration, count) {
  return Math.floor(((time % duration) + duration) % duration / duration * count) % count;
}

export function actionFrame(progress, count) {
  return Math.min(count - 1, Math.max(0, Math.floor(progress * count)));
}
