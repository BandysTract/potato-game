// Small illustrated props for the open animal quiz. Each part is placed in a
// local frame in front of Hana and the animal: x runs to screen right, y is the
// height of the part's base, and d moves it toward the camera.
//
// Parts marked `after`, and the `lift` on a part, are the small reaction shown
// once an answer is locked. Before an answer, every visible prop only restates
// the premise, and the reaction is the same whichever option was chosen.
export const QUIZ_PROPS = {
  'fox-monty': [
    { cell: 'basketChosen', x: -1.05, w: .95, h: .86 },
    { cell: 'basketCovered', x: 0, w: .95, h: .86 },
    { cell: 'basketCovered', x: 1.05, w: .95, h: .86, phase: 'before' },
    // Fox always uncovers an empty basket the player didn't choose. No potato is shown.
    { cell: 'basketOpen', x: 1.05, w: .95, h: .86, phase: 'after' },
  ],
  'fox-independent': [
    ...[0, 1, 2, 3, 4].map(i => ({ cell: 'coinHeads', x: -1.35 + i * .42, w: .38, h: .38, y: .04 })),
    { cell: 'coinSlot', x: .95, w: .4, h: .4, y: .04, phase: 'before' },
    { cell: 'coinHeads', alt: 'coinTails', still: 'coinEdge', x: .95, y: .5, w: .4, h: .4, motion: 'flip', phase: 'after' },
  ],
  'fox-two-coins': [
    { cell: 'coinHeads', alt: 'coinTails', still: 'coinEdge', x: -.35, y: .75, w: .42, h: .42, motion: 'flip' },
    { cell: 'coinTails', alt: 'coinHeads', still: 'coinEdge', x: .35, y: .75, w: .42, h: .42, motion: 'flip', offset: 1.3 },
    { cell: 'pairHH', x: -1.2, w: .62, h: .4, phase: 'after' },
    { cell: 'pairHT', x: -.4, w: .62, h: .4, phase: 'after' },
    { cell: 'pairTH', x: .4, w: .62, h: .4, phase: 'after' },
    { cell: 'pairTT', x: 1.2, w: .62, h: .4, phase: 'after', opacity: .6 },
  ],
  'owl-cards': [
    // The answer lifts the cards that matter. Before it, all four look alike.
    { cell: 'cardA', x: -1.2, w: .58, h: .8, lift: true },
    { cell: 'cardD', x: -.4, w: .58, h: .8 },
    { cell: 'card4', x: .4, w: .58, h: .8 },
    { cell: 'card7', x: 1.2, w: .58, h: .8, lift: true },
  ],
  'owl-counterexample': [
    { cell: 'cardLeaf', x: -1.2, w: .58, h: .8 },
    { cell: 'cardFlower', x: -.4, w: .58, h: .8 },
    { cell: 'cardCircle', x: .4, w: .58, h: .8 },
    { cell: 'cardSquare', x: 1.2, w: .58, h: .8 },
    { cell: 'violationPair', x: 0, y: .95, w: 1.05, h: .62, phase: 'after' },
  ],
  'owl-reverse': [
    { cell: 'cardCircle', x: -.45, w: .62, h: .86 },
    { cell: 'cardHidden', x: .45, w: .62, h: .86 },
    // Either hidden side keeps the rule.
    { cell: 'cardLeaf', x: .12, y: 1.0, w: .42, h: .58, phase: 'after', opacity: .85 },
    { cell: 'cardFlower', x: .8, y: 1.0, w: .42, h: .58, phase: 'after', opacity: .85 },
  ],
  'deer-lichen': [
    { cell: 'lichenRock', x: 0, w: 1.7, h: .85 },
    { cell: 'sunRays', x: 0, y: .3, w: 1.6, h: 1.4, phase: 'after', glow: true, opacity: .6 },
    { cell: 'lichenAlgae', x: 0, w: 1.7, h: .85, phase: 'after', glow: true },
  ],
  'deer-leaf': [
    { cell: 'sunRays', x: 0, y: .2, w: 1.7, h: 1.5, glow: true, opacity: .55 },
    { cell: 'sunLeaf', x: 0, w: 1.15, h: 1.15 },
    ...[0, 1, 2].map(i => ({ cell: 'co2', x: i === 1 ? .95 : -.95, y: .2 + i * .25, w: .36, h: .36, motion: 'drift', offset: i * .9, phase: 'after' })),
  ],
  'deer-mushroom': [
    { cell: 'mycelium', x: .1, y: -.02, d: .1, w: 2.0, h: .5, phase: 'after', opacity: .9 },
    { cell: 'logMushroom', x: 0, w: 2.0, h: 1.0 },
    ...[0, 1, 2].map(i => ({ cell: 'spores', x: .45 + i * .12, y: .75, w: .32, h: .32, motion: 'rise', offset: i * .7, phase: 'after' })),
  ],
  'badger-theseus': [
    { cell: 'boatRepaired', x: -.8, w: 1.25, h: .8 },
    { cell: 'boatOld', x: .8, w: 1.25, h: .8 },
    // Both boats keep a claim. The experiment doesn't settle which is original.
    { cell: 'pennant', x: -.72, y: .55, w: .36, h: .5, phase: 'after' },
    { cell: 'pennant', x: .88, y: .55, w: .36, h: .5, phase: 'after' },
  ],
  'badger-heap': [
    { cell: 'gradientBand', x: 0, y: -.03, d: .12, w: 2.6, h: .26, phase: 'after' },
    { cell: 'sandPiles', x: 0, w: 2.6, h: .8 },
    { cell: 'grain', x: .42, y: .55, w: .14, h: .14, motion: 'fall' },
  ],
  'badger-experience': [
    { cell: 'machine', x: -.6, w: 1.0, h: 1.0 },
    { cell: 'thoughtNotes', x: -.25, y: 1.0, w: .95, h: .72, motion: 'bob' },
    // Outside the experience, the page stays blank.
    { cell: 'blankSheet', x: .78, w: .72, h: .82, phase: 'after' },
  ],
};

// Which quiz props belong on screen now. Props exist only inside their own encounter.
export function quizPropState(game) {
  const session = game?.quizSession;
  if (!game || game.scene !== 'outdoors' || !game.conversation || !session?.quizId) return null;
  if (!QUIZ_PROPS[session.quizId] || !session.quizId.startsWith(`${game.conversation}-`)) return null;
  return { animalId: game.conversation, quizId: session.quizId, answered: session.answerId !== null && session.answerId !== undefined };
}

export function partVisible(part, answered) {
  return part.phase === 'after' ? answered : part.phase === 'before' ? !answered : true;
}

// A revealed reaction eases in over a short time, or appears at once without motion.
export function revealAmount(answered, revealTime, reduced) {
  if (!answered) return 0;
  if (reduced) return 1;
  const v = Math.min(1, Math.max(0, revealTime / .45));
  return v * v * (3 - 2 * v);
}

// Looping motion for a part. Reduced motion returns the composed still pose.
export function partMotion(part, time, reduced, out) {
  out.dx = 0; out.dy = 0; out.scaleX = 1; out.opacity = part.opacity ?? 1; out.useAlt = false; out.useStill = false;
  const t = time + (part.offset || 0);
  if (part.motion === 'flip') {
    if (reduced) { out.useStill = true; return out; }
    const turn = Math.cos(t * 5.2);
    out.scaleX = Math.max(.08, Math.abs(turn)); out.useAlt = turn < 0; out.dy = Math.abs(Math.sin(t * 2.6)) * .08;
  } else if (part.motion === 'rise' || part.motion === 'drift') {
    const cycle = reduced ? .45 : (t / 2.2) % 1;
    out.dy = cycle * .7;
    if (part.motion === 'drift') out.dx = -Math.sign(part.x || 1) * cycle * .55;
    out.opacity *= reduced ? .9 : Math.sin(cycle * Math.PI);
  } else if (part.motion === 'fall') {
    const cycle = reduced ? .85 : (t / 1.4) % 1;
    out.dy = -cycle * .42;
    out.opacity *= reduced ? 1 : Math.min(1, (1 - cycle) * 6);
  } else if (part.motion === 'bob' && !reduced) {
    out.dy = Math.sin(t * 1.6) * .05;
  }
  return out;
}
