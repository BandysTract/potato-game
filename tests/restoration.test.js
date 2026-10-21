import test from 'node:test';
import assert from 'node:assert/strict';
import { SONG_SITES } from '../src/data.js';
import { songPhrase, performanceDuration } from '../src/songs.js';
import { LATE_CAP, SETTLE_SECONDS, cottageValue, createRestorationState, phrasePosition, restorationTarget, settleRestoration } from '../src/restoration.js';

const site = id => SONG_SITES.find(entry => entry.id === id);
const tufts = [0, .2, .4, .6, .8, 1];
const singing = (id, elapsed, extra = {}) => {
  const garden = site(id), duration = performanceDuration(garden.songId, 'restore');
  return { restoredSites: [], tears: ['a', 'b', 'c'], activeSong: { kind: 'restore', songId: garden.songId, targetId: id, elapsed, duration, progress: elapsed / duration }, ...extra };
};
const states = id => [createRestorationState(id, tufts), createRestorationState(id, tufts)];

test('phrase position follows the song’s own note timing', () => {
  const phrase = songPhrase('woodland');
  assert.equal(phrasePosition(phrase, 0), 0);
  assert.equal(phrasePosition(phrase, phrase.notes[3].at), 3);
  assert.ok(Math.abs(phrasePosition(phrase, phrase.notes[3].at + phrase.notes[3].duration / 2) - 3.5) < 1e-9);
  assert.equal(phrasePosition(phrase, phrase.duration + 1), phrase.notes.length);
});

test('woodland branches unwind note by note, then the caps lift, and the small cap waits', () => {
  const [target] = states('woodland'), duration = performanceDuration('woodland', 'restore');
  restorationTarget(target, site('woodland'), singing('woodland', 0));
  assert.equal(target.mode, 'active');
  assert.ok([...target.values].every(value => value === 0), 'nothing changes before the first note sounds');
  restorationTarget(target, site('woodland'), singing('woodland', duration / 2));
  const half = [...target.vines];
  assert.ok(half[0] === 1 && half[1] > .9, 'early branches have unwound by halfway');
  assert.ok(half[5] === 0, 'the last branch waits for its own notes');
  for (let i = 1; i < half.length; i++) assert.ok(half[i] <= half[i - 1], 'branches unwind in order');
  assert.ok([...target.grow].every(value => value === 0), 'mushrooms wait for the branches');
  let lifted = 0;
  for (let t = 0; t <= duration; t += duration / 300) {
    restorationTarget(target, site('woodland'), singing('woodland', t));
    lifted = Math.max(lifted, target.tip[0]);
    assert.equal(target.tip[LATE_CAP], 0, 'the small cap doesn’t respond during the song');
  }
  assert.ok(lifted > .9, 'caps lift near the end of the phrase');
});

test('a song that stops before its reward settles back without restoring anything', () => {
  const [target, display] = states('woodland'), duration = performanceDuration('woodland', 'restore');
  restorationTarget(target, site('woodland'), singing('woodland', duration * .9));
  settleRestoration(display, target, 1 / 60);
  const before = Math.max(...display.values);
  assert.ok(before > .9);
  const stopped = { restoredSites: [], tears: [], activeSong: null };
  restorationTarget(target, site('woodland'), stopped);
  assert.equal(target.mode, 'idle');
  // A frozen frame holds the provisional state exactly.
  const frozen = [...display.values];
  settleRestoration(display, target, 0);
  assert.deepEqual([...display.values], frozen);
  settleRestoration(display, target, SETTLE_SECONDS / 2);
  assert.ok(Math.max(...display.values) > 0 && Math.max(...display.values) < before, 'reaction eases back rather than snapping');
  settleRestoration(display, target, SETTLE_SECONDS);
  assert.ok([...display.values].every(value => value === 0), 'the garden returns to untouched');
  // Reduced motion uses a clear still change instead of easing.
  restorationTarget(target, site('woodland'), singing('woodland', duration * .9), null, true);
  settleRestoration(display, target, 1 / 60, true);
  restorationTarget(target, site('woodland'), stopped, null, true);
  settleRestoration(display, target, 1 / 60, true);
  assert.ok([...display.values].every(value => value === 0));
});

test('completion and direct prepared entry show the settled garden, with the late cap only during the finish', () => {
  const [target, display] = states('woodland');
  const restored = { restoredSites: ['woodland'], activeSong: null };
  restorationTarget(target, site('woodland'), restored);
  settleRestoration(display, target, 0, false, true);
  assert.equal(display.mode, 'restored');
  assert.ok([...display.vines, ...display.grow].every(value => value === 1));
  assert.ok([...display.tip].every(value => value === 0), 'a prepared scene has no gesture to replay');
  const finish = { kind: 'restoration-finish', subjectId: 'woodland', elapsed: .75, duration: 1.6, focusReleased: false };
  restorationTarget(target, site('woodland'), restored, finish);
  assert.ok(target.tip[LATE_CAP] > .9, 'the small cap responds late');
  restorationTarget(target, site('woodland'), restored, finish, true);
  assert.equal(target.tip[LATE_CAP], 0, 'reduced motion keeps the cap still');
  restorationTarget(target, site('woodland'), restored, { ...finish, elapsed: 1.6 });
  assert.equal(target.tip[LATE_CAP], 0);
  restorationTarget(target, site('woodland'), restored, { ...finish, subjectId: 'meadow' });
  assert.equal(target.tip[LATE_CAP], 0, 'another garden’s finish doesn’t move this one');
});

test('meadow grass carries a wave before any flower opens, and the growth stays', () => {
  const [target] = states('meadow'), duration = performanceDuration('growth', 'restore');
  let flowersBeforeWave = 0, crest = 0;
  for (let t = 0; t <= duration; t += duration / 400) {
    restorationTarget(target, site('meadow'), singing('meadow', t));
    const lastGrown = target.grass[target.grass.length - 1];
    if (lastGrown < .99) flowersBeforeWave = Math.max(flowersBeforeWave, ...target.flowers);
    crest = Math.max(crest, ...target.bend);
  }
  assert.equal(flowersBeforeWave, 0, 'flowers wait until the wave has crossed the grass');
  assert.ok(crest > .9, 'a wave crest bends the grass');
  restorationTarget(target, site('meadow'), singing('meadow', duration / 2));
  assert.ok(target.grass[0] > target.grass[target.grass.length - 1], 'the wave travels across the patch');
  restorationTarget(target, site('meadow'), singing('meadow', duration / 2), null, true);
  assert.ok([...target.bend].every(value => value === 0), 'reduced motion has no grass wave');
  restorationTarget(target, site('meadow'), { restoredSites: ['meadow'], activeSong: null });
  assert.ok([...target.grass, ...target.flowers].every(value => value === 1));
  assert.ok([...target.bend].every(value => value === 0));
});

test('rain reaches the fence, then the leaves, then the watering can, and the garden stays watered', () => {
  const [target] = states('cottage'), duration = performanceDuration('rain', 'restore');
  const firstWet = { fence: Infinity, leaves: Infinity, can: Infinity };
  for (let t = 0; t <= duration; t += duration / 300) {
    restorationTarget(target, site('cottage'), singing('cottage', t));
    for (const name of Object.keys(firstWet)) if (cottageValue(target, name) > .05 && firstWet[name] === Infinity) firstWet[name] = t;
  }
  assert.ok(firstWet.fence < firstWet.leaves && firstWet.leaves < firstWet.can, JSON.stringify(firstWet));
  // Without all three tears the model refuses, so the garden doesn't react.
  restorationTarget(target, site('cottage'), singing('cottage', duration * .8, { tears: ['a'] }));
  assert.ok([...target.values].every(value => value === 0));
  restorationTarget(target, site('cottage'), { restoredSites: ['cottage'], activeSong: null });
  assert.equal(cottageValue(target, 'rain'), 0, 'the rain ends');
  assert.equal(cottageValue(target, 'bed'), 1, 'the watered bed stays changed');
  assert.equal(cottageValue(target, 'can'), 1);
});

test('a wrong song or another garden’s song leaves a garden untouched', () => {
  const [target] = states('woodland');
  const wrong = singing('woodland', 4);
  wrong.activeSong.songId = 'rain';
  restorationTarget(target, site('woodland'), wrong);
  assert.equal(target.mode, 'idle');
  assert.ok([...target.values].every(value => value === 0));
  restorationTarget(target, site('woodland'), singing('meadow', 4));
  assert.ok([...target.values].every(value => value === 0));
  const practice = singing('woodland', 4); practice.activeSong.kind = 'practice'; practice.activeSong.targetId = 'practice-woodland';
  restorationTarget(target, site('woodland'), practice);
  assert.ok([...target.values].every(value => value === 0), 'practice never moves a garden');
});
