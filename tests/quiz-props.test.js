import test from 'node:test';
import assert from 'node:assert/strict';
import { QUIZZES, QUIZ_IDS } from '../src/quizzes.js';
import { QUIZ_PROPS, partMotion, partVisible, quizPropState, revealAmount } from '../src/quiz-props.js';
import { PROP_CELLS } from '../src/prop-art.js';

const openQuiz = (animal, quizId, answerId = null, extra = {}) => ({ scene: 'outdoors', phase: 'playing', conversation: animal, quizSession: { quizId, answerId }, ...extra });
const visibleParts = (quizId, state) => QUIZ_PROPS[quizId].filter(part => partVisible(part, state.answered));

test('every quiz has props drawn from painted atlas cells', () => {
  assert.equal(QUIZ_IDS.length, 12);
  for (const id of QUIZ_IDS) {
    assert.ok(QUIZ_PROPS[id]?.length, `${id} has no props`);
    for (const part of QUIZ_PROPS[id]) for (const cell of [part.cell, part.alt, part.still].filter(Boolean)) assert.ok(PROP_CELLS[cell], `${id} uses missing cell ${cell}`);
  }
  assert.deepEqual(Object.keys(QUIZ_PROPS).sort(), [...QUIZ_IDS].sort(), 'no props for a quiz that doesn’t exist');
});

test('props appear only inside their own open outdoor quiz', () => {
  assert.equal(quizPropState(null), null);
  assert.equal(quizPropState({ scene: 'outdoors', conversation: null, quizSession: null }), null);
  assert.equal(quizPropState(openQuiz('fox', 'fox-monty', null, { scene: 'house' })), null);
  assert.equal(quizPropState({ scene: 'house', conversation: 'john', quizSession: null }), null, 'family conversations have no quiz props');
  assert.equal(quizPropState(openQuiz('owl', 'fox-monty')), null, 'a stale session from another animal shows nothing');
  assert.equal(quizPropState(openQuiz('fox', 'unknown-quiz')), null);
  assert.equal(quizPropState({ scene: 'outdoors', conversation: 'fox', quizSession: null }), null);
  for (const [animal, quizzes] of Object.entries(QUIZZES)) for (const quiz of quizzes) {
    assert.deepEqual(quizPropState(openQuiz(animal, quiz.id)), { animalId: animal, quizId: quiz.id, answered: false });
  }
});

test('before an answer, no prop shows the reaction or hints at the correct option', () => {
  for (const [animal, quizzes] of Object.entries(QUIZZES)) for (const quiz of quizzes) {
    const before = quizPropState(openQuiz(animal, quiz.id, null));
    assert.equal(before.answered, false, `${quiz.id} treats an unanswered session as answered`);
    const shown = visibleParts(quiz.id, before);
    assert.ok(shown.length > 0, `${quiz.id} illustrates its premise before the answer`);
    assert.ok(shown.every(part => part.phase !== 'after'), `${quiz.id} reveals its reaction early`);
    assert.equal(revealAmount(before.answered, 99, false), 0, 'lifted cards stay level before an answer');
    assert.equal(revealAmount(before.answered, 99, true), 0);
    // The reaction is the same whichever option was chosen, so it reports facts, not a verdict on the player.
    const reactions = quiz.options.map(option => visibleParts(quiz.id, quizPropState(openQuiz(animal, quiz.id, option.id))));
    for (const reaction of reactions) assert.deepEqual(reaction, reactions[0]);
    if (QUIZ_PROPS[quiz.id].some(part => part.phase === 'after' || part.lift)) {
      assert.ok(JSON.stringify(reactions[0]) !== JSON.stringify(shown) || QUIZ_PROPS[quiz.id].some(part => part.lift), `${quiz.id} has a visible reaction after answering`);
    }
  }
});

test('the fox’s baskets never show where the potato is', () => {
  const cells = QUIZ_PROPS['fox-monty'].map(part => part.cell);
  assert.ok(!cells.some(cell => /potato/i.test(cell)));
  const before = visibleParts('fox-monty', { answered: false }).map(part => part.cell);
  assert.deepEqual(before.sort(), ['basketChosen', 'basketCovered', 'basketCovered'].sort(), 'three covered baskets, one chosen');
  const after = visibleParts('fox-monty', { answered: true }).map(part => part.cell);
  assert.equal(after.filter(cell => cell === 'basketOpen').length, 1, 'Fox uncovers exactly one empty basket');
  assert.ok(after.includes('basketChosen'), 'the chosen basket stays covered');
});

test('reduced motion gives composed stills, and reactions appear at once', () => {
  const out = {};
  for (const id of QUIZ_IDS) for (const part of QUIZ_PROPS[id]) {
    const first = { ...partMotion(part, 0, true, out) };
    for (const time of [.3, 1.7, 9.2]) assert.deepEqual({ ...partMotion(part, time, true, out) }, first, `${id} ${part.cell} moves under reduced motion`);
  }
  assert.equal(revealAmount(true, 0, true), 1);
  assert.equal(revealAmount(true, 0, false), 0);
  assert.equal(revealAmount(true, 1, false), 1);
});
