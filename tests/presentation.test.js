import test from 'node:test';
import assert from 'node:assert/strict';
import { PRACTICE_SPOTS, SONG_SITES } from '../src/data.js';
import { PRACTICE_ART } from '../src/clearings.js';
import { createMoment } from '../src/moments.js';
import { chapterFor } from '../src/palette.js';
import { quizPropState } from '../src/quiz-props.js';
import { presentationSubject } from '../src/framing.js';
import { createGame, openQuiz, startGame } from '../src/game.js';

test('a finished restoration frames its garden, and a practice reply its responder, until Hana moves', () => {
  // Rejects a renderer that ignores the restoration-finish moment's camera framing.
  for (const site of SONG_SITES) {
    const moment = createMoment('restoration-finish', site.id);
    assert.deepEqual(presentationSubject(moment), { x: site.x, z: site.z }, `${site.id} is framed`);
    moment.focusReleased = true;
    assert.equal(presentationSubject(moment), null, `moving releases ${site.id}`);
  }
  for (const spot of PRACTICE_SPOTS) {
    const moment = createMoment('practice-response', spot.id);
    const [x, z] = Object.values(PRACTICE_ART[spot.id].response)[0];
    assert.deepEqual(presentationSubject(moment), { x, z }, `${spot.id} frames its responder`);
    assert.equal(presentationSubject(moment), presentationSubject(moment), 'the same subject object every frame');
    moment.focusReleased = true;
    assert.equal(presentationSubject(moment), null);
  }
  for (const kind of ['john-bowls', 'aldo-finger', 'supper']) assert.equal(presentationSubject(createMoment(kind, 'x')), null);
  assert.equal(presentationSubject(null), null);
});

test('ordinary frames read the chapter and the quiz props without allocating', () => {
  // Rejects building a Set or a filtered array for the chapter on every frame,
  // and a fresh quiz state object on every frame of an encounter.
  const game = { restoredSites: ['woodland', 'meadow'] };
  const RealSet = globalThis.Set, realFilter = Array.prototype.filter;
  let sets = 0, filters = 0;
  globalThis.Set = class extends RealSet { constructor(...args) { super(...args); sets++; } };
  Array.prototype.filter = function (...args) { filters++; return realFilter.apply(this, args); };
  try {
    for (let i = 0; i < 100; i++) assert.equal(chapterFor(game), 2);
  } finally {
    globalThis.Set = RealSet; Array.prototype.filter = realFilter;
  }
  assert.equal(sets, 0, 'No Set per frame.');
  assert.equal(filters, 0, 'No filtered array per frame.');
  const quizGame = startGame(createGame('en', () => 0));
  quizGame.player = { x: -12, z: 0.3, facing: 1, direction: 2, moving: false };
  assert.equal(openQuiz(quizGame, 'fox'), true);
  const view = {};
  assert.equal(quizPropState(quizGame, view), view, 'The caller’s state object is reused.');
  assert.equal(view.animalId, 'fox');
  assert.equal(view.answered, false);
});
