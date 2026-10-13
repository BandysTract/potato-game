import test from 'node:test';
import assert from 'node:assert/strict';
import { overlapsScenery } from '../src/world.js';

test('a fir narrows at its top while genuine cover and broad crowns still fade', () => {
  const base = {x:0,y:0}, top = {x:0,y:1};
  assert.equal(overlapsScenery({x:.8,y:.95},base,top,1,'fir'),false);
  assert.equal(overlapsScenery({x:.1,y:.95},base,top,1,'fir'),true);
  assert.equal(overlapsScenery({x:.8,y:.38},base,top,1,'fir'),true);
  assert.equal(overlapsScenery({x:.8,y:.95},base,top,1,'birch'),true);
  assert.equal(overlapsScenery({x:0,y:1.1},base,top,1,'fir'),false);
  assert.equal(overlapsScenery(null,base,top,1,'fir'),false);
});
