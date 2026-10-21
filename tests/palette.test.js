import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { CHAPTERS, chapterFor, createPalette } from '../src/palette.js';

const expected = (base, chapter) => new THREE.Color(base).multiply(new THREE.Color(...CHAPTERS[chapter].tint));

test('the outdoor chapter follows unique restored gardens, never time', () => {
  assert.equal(chapterFor({ restoredSites: [] }), 0);
  assert.equal(chapterFor({ restoredSites: ['cottage'] }), 1);
  assert.equal(chapterFor({ restoredSites: ['woodland', 'meadow'] }), 2);
  assert.equal(chapterFor({ restoredSites: ['woodland', 'meadow', 'cottage'] }), 3);
  // Duplicates and unknown ids can't push the light past evening or skip a chapter.
  assert.equal(chapterFor({ restoredSites: ['woodland', 'woodland', 'garden-x'] }), 1);
  assert.equal(chapterFor({ restoredSites: ['woodland', 'meadow', 'cottage', 'cottage'], elapsed: 9999 }), 3);
  assert.equal(chapterFor({}), 0);
});

test('repeated chapter changes and resets return every color exactly to its derived value', () => {
  const palette = createPalette();
  const bases = ['#789368', '#c8ba8c', '#ffffff', '#3f4f3c', '#b7c9b0'];
  const materials = bases.map(color => palette.add(new THREE.MeshBasicMaterial({ color })));
  const sky = palette.addColor(new THREE.Color('#b7c9b0'));
  // A second registration must not record an already-tinted base.
  palette.apply(2);
  palette.add(materials[0]);
  palette.addColor(sky);
  assert.equal(palette.records.length, bases.length + 1);
  const sequence = [0, 3, 1, 2, 0, 0, 3, 3, 2, 1];
  for (let round = 0; round < 400; round++) for (const chapter of sequence) {
    palette.apply(chapter);
    materials.forEach((material, i) => assert.equal(material.color.getHex(), expected(bases[i], chapter).getHex()));
  }
  for (const chapter of [0, 1, 2, 3]) {
    palette.apply(chapter);
    materials.forEach((material, i) => {
      const want = expected(bases[i], chapter);
      assert.ok(Math.abs(material.color.r - want.r) < 1e-12 && Math.abs(material.color.g - want.g) < 1e-12 && Math.abs(material.color.b - want.b) < 1e-12,
        `color drifted after repeated changes: ${material.color.getHexString()} vs ${want.getHexString()}`);
    });
    assert.equal(sky.getHex(), expected('#b7c9b0', chapter).getHex());
  }
  // Morning is the recorded base itself, so a reset to a new walk shows the original scene.
  palette.apply(3); palette.apply(chapterFor({ restoredSites: [] }));
  materials.forEach((material, i) => assert.equal(material.color.getHex(), new THREE.Color(bases[i]).getHex()));
});

test('applying an unchanged chapter does no work', () => {
  const palette = createPalette();
  const material = palette.add(new THREE.MeshBasicMaterial({ color: '#789368' }));
  assert.equal(palette.apply(1), true);
  material.color.set('#ff0000');
  assert.equal(palette.apply(1), false);
  assert.equal(material.color.getHexString(), 'ff0000', 'an unchanged chapter must not rewrite colors every frame');
  assert.equal(palette.apply(2), true);
  assert.equal(material.color.getHex(), expected('#789368', 2).getHex());
});
