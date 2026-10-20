import test from 'node:test';
import assert from 'node:assert/strict';
import { createMoment, advanceMoment } from '../src/moments.js';
import { songPhrase } from '../src/songs.js';
import { encounterFrame } from '../src/framing.js';
import { FAIRIES } from '../src/data.js';

test('moments retain identity, use the woodland phrase duration, and finish across a stalled frame', () => {
  const m = createMoment('aldo-lullaby', 'aldo', 2);
  assert.equal(m.duration, songPhrase('woodland').duration);
  assert.equal(advanceMoment(m, .5), false);
  assert.equal(m.elapsed, .5);
  assert.equal(advanceMoment(m, 20), true);
  assert.equal(m.elapsed, m.duration);
  assert.equal(m.nextStep, 2);
});

test('focused framing changes the walking distance and fits every fairy pair in portrait and landscape', () => {
  // Rejects a camera that retains the ordinary walking distance.
  for (const [width,height] of [[1440,900],[390,844],[844,390]]) for (const fairy of FAIRIES) {
    const player={x:fairy.x,z:fairy.z+1.3};
    const f=encounterFrame(player,fairy,width,height);
    assert.ok(f.distance < 28);
    assert.equal(f.x,fairy.x); assert.equal(f.z,fairy.z+.65);
    const span=Math.abs((player.x-fairy.x-player.z+fairy.z)*Math.SQRT1_2)+4.6;
    const horizontal=2*f.distance*Math.tan(35*Math.PI/360)*width/height;
    assert.ok(span < horizontal*.83);
  }
});
