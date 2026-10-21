import test from 'node:test';
import assert from 'node:assert/strict';
import * as gameModel from '../src/game.js';
import { createMoment, advanceMoment } from '../src/moments.js';
import { HOUSE_ACTIVITIES } from '../src/dialogues.js';
import { regionAt, CREATURES, FAIRIES, HOME, HOUSE_START, HOUSE_TARGETS, POTATOES, SONGS, SONG_SITES } from '../src/data.js';
import { t } from '../src/i18n.js';
import { createSequenceGame } from '../src/sequences.js';
import { QUIZZES, findQuiz } from '../src/quizzes.js';
import { entryPoint, trusted, passSupper, plain, quizAnswer, walkAppTo, finishSongForApp, finishActionForApp, jumpTo } from './entry-harness.js';


test('a title interaction starts sound without starting gameplay, and help/map preserve the title and mute', () => {
  // Rejects silencing the intro entirely, ticking walking music under its guides,
  // and re-enabling sound unconditionally when Start is selected.
  const app = entryPoint();
  try {
    assert.equal(app.audio.paused, false);
    app.frame(0);
    assert.deepEqual(app.audio.ticks, [{ phase: 'intro', paused: false }]);
    app.window.fire('click');
    assert.deepEqual(app.audio.enableCalls, [true]);
    assert.equal(app.view.sound, true);
    assert.equal(app.game.phase, 'intro');
    const position = { ...app.game.player };
    for (const guide of ['help', 'map']) {
      app.action(guide);
      assert.equal(app.view.overlay, guide);
      assert.equal(app.audio.paused, true);
      const count = app.audio.ticks.length;
      app.frame(20);
      assert.equal(app.audio.ticks.length, count, 'Title guides must not schedule gameplay music.');
      assert.equal(app.game.elapsed, 0);
      assert.deepEqual(app.game.player, position);
      app.action('close');
      assert.equal(app.view.overlay, 'intro');
      assert.equal(app.audio.paused, false);
      app.frame(40);
      assert.equal(app.audio.ticks.at(-1).phase, 'intro');
    }
    app.action('sound');
    assert.equal(app.view.sound, false);
    app.window.fire('click');
    app.window.fire('keydown', { key: 'h', code: 'KeyH' });
    app.action('close');
    app.action('newWalk');
    assert.equal(app.game.phase, 'playing');
    assert.equal(app.view.overlay, null);
    assert.equal(app.view.sound, false);
    assert.deepEqual(app.audio.enableCalls, [true, false], 'Start and later gestures must preserve an explicit mute.');
  } finally { app.dispose(); }
});

test('eligible trusted title gestures keep their intended actions and leave the sound button independent', () => {
  // Rejects starting music on synthetic/focus-only events, eating a map/help key,
  // or auto-enabling before the sound button toggles it straight back off.
  for (const [key, code, overlay] of [['h', 'KeyH', 'help'], ['m', 'KeyM', 'map']]) {
    const app = entryPoint();
    try {
      app.window.fire('click', { isTrusted: false });
      app.window.fire('keydown', { key: 'Tab', code: 'Tab' });
      app.window.fire('keydown', { key, code, repeat: true });
      assert.deepEqual(app.audio.enableCalls, []);
      const event = app.window.fire('keydown', { key, code });
      assert.equal(event.prevented, true);
      assert.equal(app.view.overlay, overlay);
      assert.equal(app.game.phase, 'intro');
      assert.deepEqual(app.audio.enableCalls, [true]);
    } finally { app.dispose(); }
  }
  const app = entryPoint();
  try {
    app.window.fire('click', { target: { closest: () => ({ dataset: { action: 'sound' } }) } });
    assert.deepEqual(app.audio.enableCalls, []);
    app.action('sound', undefined, trusted);
    assert.equal(app.view.sound, true);
    assert.equal(app.game.phase, 'intro');
    app.action('language', 'en');
    assert.equal(app.game.language, 'en');
    assert.equal(app.view.sound, true);
    app.action('newWalk', undefined, trusted);
    assert.deepEqual(app.audio.enableCalls, [true], 'Start must keep an already enabled context.');
  } finally { app.dispose(); }
});

test('title audio follows focus and visibility, and graphics failure permanently stops it', () => {
  const app = entryPoint();
  try {
    app.window.fire('click');
    app.window.fire('blur');
    assert.equal(app.audio.paused, true);
    app.window.fire('focus');
    assert.equal(app.audio.paused, false);
    app.document.hidden = true;
    app.document.fire('visibilitychange');
    assert.equal(app.audio.paused, true);
    app.document.hidden = false;
    app.document.focused = false;
    app.document.fire('visibilitychange');
    assert.equal(app.audio.paused, true);
    app.document.focused = true;
    app.window.fire('focus');
    assert.equal(app.audio.paused, false);
    app.renderer.fire('webglcontextlost');
    assert.equal(app.audio.paused, true);
    assert.equal(app.audio.disposed, true);
    app.window.fire('focus');
    assert.equal(app.audio.paused, true, 'Focus must not revive audio after graphics failure.');
    const enabled = app.audio.enableCalls.length;
    app.window.fire('click');
    assert.equal(app.audio.enableCalls.length, enabled);
  } finally { app.dispose(); }
  assert.equal([...app.window.listeners.values()].flat().length, 0, 'Disposal must remove the title gesture listeners.');
});

test('delayed sample failure stays truthful after mute or pause, in both languages', () => {
  for (const muted of [true, false]) {
    const app = entryPoint();
    try {
      app.action('newWalk', undefined, trusted);
      assert.equal(app.view.sound, true);
      if (muted) app.action('sound');
      else app.action('pause');
      app.audio.failPendingSamples();
      assert.equal(app.game.message, 'Nástroje se nepodařilo načíst. Hudba použije syntetické zvuky. Ve výpravě můžeš pokračovat.');
      app.action('language', 'en');
      assert.equal(app.game.message, 'The instruments couldn’t load. Music will use synthesized sounds. You can keep exploring.');
      assert.equal(app.view.sound, !muted);
      if (!muted) assert.equal(app.audio.paused, true);
    } finally { app.dispose(); }
  }
});

test('a sound initialization error reaches the localized title status and successful retry clears stale messages', () => {
  // Rejects placing the title error only in the hidden gameplay toast, or
  // leaving its text in either surface after sound becomes available.
  for (const [retryDuringPlay, delayedEnable] of [[false, false], [true, false], [false, true]]) {
    const app = entryPoint({ soundInitThrows: true });
    try {
      assert.equal(app.view.soundError || '', '', 'The title status must begin empty.');
      app.action('sound', undefined, trusted);
      assert.equal(app.game.phase, 'intro');
      assert.equal(app.view.overlay, 'intro');
      assert.equal(app.view.sound, false);
      assert.equal(app.view.soundError, 'Zvuk není dostupný. Ve výpravě můžeš pokračovat i bez něj.', 'The title must receive the existing Czech sound error.');
      app.action('language', 'en');
      assert.equal(app.view.soundError, 'Sound is unavailable. You can keep exploring without it.', 'The visible title error must follow the selected language.');
      if (retryDuringPlay) {
        const calls = app.audio.enableCalls.length;
        app.action('newWalk', undefined, trusted);
        assert.equal(app.audio.enableCalls.length, calls, 'No automatic retry after an unavailable result.');
        assert.equal(app.game.phase, 'playing');
        assert.equal(app.view.soundError, 'Sound is unavailable. You can keep exploring without it.', 'The in-play sound status keeps the error.');
        assert.notEqual(app.game.message, app.view.soundError, 'Sound status stays out of the shared event toast.');
      }
      app.audio.soundInitThrows = false;
      app.audio.delayEnable = delayedEnable;
      app.action('sound', undefined, trusted);
      if (delayedEnable) {
        assert.equal(app.view.sound, false);
        assert.equal(app.view.soundState, 'waiting');
        assert.equal(app.view.soundError, 'Sound is waiting to start.', 'A suspended retry reports waiting, not playback.');
        app.audio.completeEnable();
      }
      assert.equal(app.view.sound, true, 'A failed initialization must leave the sound control usable.');
      assert.equal(app.view.soundError, '', 'Successful retry must clear the title error.');
      assert.equal(app.game.message, '', 'Successful retry must also clear an existing or future gameplay error toast.');
      assert.equal(app.game.messageKey, '');
      assert.equal(app.game.messageTime, 0);
      if (!retryDuringPlay) app.action('newWalk');
      app.action('language', 'cs');
      app.frame(0);
      assert.equal(app.game.phase, 'playing');
      assert.equal(app.view.soundError, '');
      assert.equal(app.game.message, '', 'Starting or changing language must not resurrect the old error.');
    } finally { app.dispose(); }
  }
});


// Reach the same household state the player does. Inventory and house progress
// are produced by the game model, never injected into a ready-made fixture.

function gatherForApp(app) {
  for (const [index, potato] of POTATOES.entries()) {
    const site = SONG_SITES.find((item) => item.potatoId === potato.id);
    if (site) {
      walkAppTo(app, site);
      gameModel.step(app.game, {}, 0.05);
      gameModel.step(app.game, { interact: true }, 0.05);
      assert.equal(app.game.songSite, site.id);
      app.frame(0);
      assert.equal(app.view.overlay, 'songs');
      app.action('chooseSong', site.songId);
      finishSongForApp(app);
      assert.ok(app.game.restoredSites.includes(site.id));
    }
    walkAppTo(app, potato);
    gameModel.step(app.game, {}, 0.05);
    gameModel.step(app.game, { interact: true }, 0.05);
    assert.equal(app.game.actionAnimation?.kind, 'gather');
    assert.ok(!app.game.potatoes.includes(potato.id), 'The potato joins the basket after its gathering animation.');
    finishActionForApp(app);
    assert.ok(app.game.potatoes.includes(potato.id));
    if (index === 2 || index === 3) {
      const fairy = FAIRIES[index - 2];
      walkAppTo(app, fairy);
      gameModel.step(app.game, {}, 0.05);
      gameModel.step(app.game, { interact: true }, 0.05);
      finishSongForApp(app);
      assert.ok(app.game.learnedSongs.includes(SONGS.find((song) => song.fairyId === fairy.id).id));
    }
  }
  walkAppTo(app, FAIRIES[2]);
  gameModel.step(app.game, {}, 0.05);
  gameModel.step(app.game, { interact: true }, 0.05);
  finishSongForApp(app);
  assert.equal(app.game.learnedSongs.length, SONGS.length);
  walkAppTo(app, { x: 12, z: 7 });
  walkAppTo(app, { x: 0, z: 10 });
  const cottage = SONG_SITES.find((item) => item.id === 'cottage');
  walkAppTo(app, cottage);
  gameModel.step(app.game, { interact: true }, 0.05);
  assert.equal(app.game.songSite, cottage.id);
  app.frame(0);
  assert.equal(app.view.overlay, 'songs');
  app.action('chooseSong', cottage.songId);
  finishSongForApp(app);
  assert.equal(app.game.restoredSites.length, SONG_SITES.length);
  walkAppTo(app, HOME);
}

test('song names, effects, and single-press singing instructions have Czech copy', () => {
  assert.deepEqual(SONGS.map((song) => t('cs', song.name)), ['Lesní píseň', 'Píseň růstu', 'Píseň deště']);
  assert.deepEqual(SONGS.map((song) => t('cs', song.effect)), ['Rozplést větve', 'Oživit rostliny', 'Přivolat jemný déšť']);
  assert.equal(t('cs', 'Press E to sing'), 'Stiskni E pro zpěv');
  assert.equal(t('cs', 'Move or press Esc to stop singing.'), 'Zpěv zastavíš pohybem nebo klávesou Esc.');
});

test('the song picker preserves its site across language changes and Escape cancels singing', () => {
  const app = entryPoint();
  let time = 0;
  const frame = () => app.frame(time += 50);
  const press = () => { app.window.fire('keydown', { key: 'e', code: 'KeyE' }); frame(); };
  const release = () => { app.window.fire('keyup', { key: 'e', code: 'KeyE' }); frame(); };
  try {
    app.action('newWalk');
    app.frame(0);
    walkAppTo(app, FAIRIES[0]);
    press();
    assert.equal(app.game.activeSong?.kind, 'learn');
    release();
    assert.ok(app.game.activeSong, 'Releasing E must let the automatic song continue.');
    finishSongForApp(app);
    walkAppTo(app, SONG_SITES[0]);
    press();
    assert.equal(app.view.overlay, 'songs');
    assert.equal(app.game.songSite, 'woodland');
    release();
    app.action('language', 'en');
    assert.equal(app.view.overlay, 'songs');
    assert.equal(app.game.songSite, 'woodland');
    app.action('chooseSong', 'rain');
    assert.equal(app.game.activeSong, null, 'A locked song must not start.');
    app.action('chooseSong', 'woodland');
    assert.equal(app.view.overlay, null);
    assert.equal(app.game.activeSong?.kind, 'restore');
    assert.equal(app.game.activeSong?.targetId, 'woodland');
    const active = app.game.activeSong;
    app.action('chooseSong', 'woodland');
    assert.equal(app.game.activeSong, active, 'A duplicate selection must not restart the song.');
    app.window.fire('keydown', { key: 'Escape', code: 'Escape' });
    frame();
    assert.equal(app.game.activeSong, null);
    assert.ok(!app.game.restoredSites.includes('woodland'), 'A cancelled song must not restore the site.');
  } finally { app.dispose(); }
});

test('house progress survives pause, map, help, language, and a cleared held interaction', () => {
  let draws = 0;
  const app = entryPoint({ ending: 'goddess', random: () => draws++ < CREATURES.length ? 0 : 0.5 });
  let time = 0;
  const frame = () => app.frame(time += 50);
  const press = () => { app.window.fire('keydown', { key: 'e', code: 'KeyE' }); frame(); };
  const release = () => { app.window.fire('keyup', { key: 'e', code: 'KeyE' }); frame(); };
  try {
    app.action('newWalk');
    assert.ok(Object.values(app.game.dialogueNext).every(index => index === 0));
    frame();
    gatherForApp(app);
    press();
    assert.equal(app.game.scene, 'house');
    assert.equal(app.game.phase, 'playing');
    assert.deepEqual({ x: app.game.player.x, z: app.game.player.z }, HOUSE_START);
    assert.equal(app.view.region, 'Uvnitř chaloupky');
    release();
    walkAppTo(app, HOUSE_TARGETS[0]);
    press();
    assert.equal(app.view.overlay, 'dialogue');
    assert.equal(app.view.dialogue.creatureId, 'john');
    app.action('dialogueChoice', 1);
    app.action('language', 'en');
    assert.equal(app.view.dialogue.choice, 1);
    assert.equal(app.game.houseStep, 0);
    app.action('dialogueFinish');
    assert.equal(app.game.houseStep, 1);
    assert.equal(app.view.overlay, null);
    for (const guide of ['pause', 'map', 'help']) {
      app.action(guide);
      assert.equal(app.view.overlay, guide);
      const before = structuredClone(app.game);
      for (let count = 0; count < 10; count++) frame();
      assert.deepEqual(app.game, before, 'House guides freeze movement and progress.');
      if (guide === 'pause') app.action('resume');
      else app.action('close');
      assert.equal(app.view.overlay, null);
      assert.equal(app.game.houseStep, 1);
    }
    app.action('sound');
    assert.equal(app.view.sound, false);
    for (const [index, target] of HOUSE_TARGETS.entries()) {
      if (!index) continue;
      walkAppTo(app, target);
      press();
      if (index === 1) {
        assert.equal(app.view.overlay, 'dialogue');
        assert.equal(app.view.dialogue.creatureId, 'aldo');
        app.action('dialogueChoice', 0);
        app.action('dialogueFinish');
      }
      release();
      if (index >= 2) { finishActionForApp(app); frame(); }
    }
    assert.equal(app.game.phase, 'won');
    assert.equal(app.view.overlay, 'supper', 'Serving shows the settled supper first.');
    for (let count = 0; count < 20; count++) frame();
    assert.equal(app.view.overlay, 'supper', 'The 1.6-second supper must not end early.');
    for (let count = 0; count < 14; count++) frame();
    assert.equal(app.view.overlay, 'reveal', 'The ending card waits while Hana transforms.');
    app.window.fire('keydown', { key: 'Escape', code: 'Escape' });
    app.action('restart');
    assert.equal(app.game.phase, 'won');
    assert.equal(app.view.overlay, 'reveal', 'Escape and restart must not interrupt the reveal.');
    for (let count = 0; count < 40; count++) frame();
    assert.equal(app.view.overlay, 'reveal', 'The 3.6-second reveal must not be covered early.');
    for (let count = 0; count < 40; count++) frame();
    assert.equal(app.view.overlay, 'win');
    assert.equal(app.view.sound, false, 'The family chapter and reveal preserve mute.');
    app.action('restart');
    assert.equal(app.view.overlay, 'confirmWalk', 'Walk again asks before replacing an unsaved or study walk.');
    app.action('confirmWalk');
    assert.equal(app.game.phase, 'playing');
    assert.equal(app.game.scene, 'outdoors');
    assert.equal(app.game.houseStep, 0);
    assert.equal(app.game.gardenWatered, false);
    assert.deepEqual(app.game.potatoes, []);
    assert.deepEqual(app.game.tears, []);
    assert.equal(app.game.conversation, null);
    assert.equal(app.game.conversationIndex, null);
    assert.ok(Object.values(app.game.dialogueNext).every(index => index === 1), 'Restart must draw new conversation starts.');
    assert.equal(draws, CREATURES.length * 2);
    assert.equal(app.game.language, 'en');
    assert.equal(app.view.sound, false);
  } finally { app.dispose(); }
});

test('the entry point keeps the selected quiz and its answer through language and focus changes', () => {
  const app = entryPoint({ ending: 'goddess', random: () => 0.9 });
  let time = 0;
  const frame = () => app.frame(time += 50);
  try {
    app.action('newWalk');
    frame();
    walkAppTo(app, { x: -7, z: 5 });
    walkAppTo(app, CREATURES[0]);
    app.window.fire('keydown', { key: 'e', code: 'KeyE' });
    frame();
    assert.equal(app.view.overlay, 'dialogue');
    assert.equal(app.view.dialogue.creatureId, 'fox');
    assert.equal(app.view.dialogue.index, 2, 'The view must receive the game’s selected question.');
    assert.deepEqual(plain(app.view.dialogue.quiz), { quizId: QUIZZES.fox[2].id, answerId: null });
    app.action('dialogueChoice', 1);
    assert.equal(app.view.dialogue.quiz.answerId, null, 'Family reply indices must not answer a quiz.');
    const chosen = quizAnswer(app, false);
    assert.equal(app.view.dialogue.quiz.answerId, chosen);
    const before = structuredClone(app.game.dialogueNext);
    app.action('language', 'en');
    assert.equal(app.view.dialogue.quiz.answerId, chosen);
    assert.equal(app.view.dialogue.index, 2);
    app.window.fire('blur');
    for (let count = 0; count < 20; count++) frame();
    app.window.fire('focus');
    assert.equal(app.view.dialogue.quiz.answerId, chosen);
    assert.equal(app.view.dialogue.index, 2);
    assert.deepEqual(app.game.dialogueNext, before);
    quizAnswer(app, true);
    assert.equal(app.view.dialogue.quiz.answerId, chosen, 'A second answer must not replace the first.');
    app.action('dialogueFinish');
    assert.equal(app.game.dialogueNext.fox, 0);
    assert.deepEqual(plain(app.game.quizCompleted), [QUIZZES.fox[2].id]);
    app.action('dialogueFinish');
    assert.equal(app.game.dialogueNext.fox, 0, 'A duplicate close action must not advance twice.');
    app.action('pause');
    app.action('language', 'cs');
    app.action('resume');
    assert.equal(app.game.dialogueNext.fox, 0, 'Pausing must not consume the next question.');
    app.window.fire('keydown', { key: 'e', code: 'KeyE' });
    frame();
    assert.equal(app.view.dialogue.index, 0);
    assert.equal(app.view.dialogue.quiz.answerId, null, 'The next question must begin unanswered.');
    app.window.fire('keydown', { key: 'Escape', code: 'Escape' });
    assert.equal(app.view.overlay, null);
    assert.equal(app.game.dialogueNext.fox, 0, 'Escape before answering keeps the question.');
    assert.deepEqual(plain(app.game.quizCompleted), [QUIZZES.fox[2].id]);
  } finally { app.dispose(); }
});

test('quiz answers ignore stale, forged, and other-panel events at the entry point', () => {
  const app = entryPoint();
  try {
    app.action('admin'); app.action('jump', 'owl:1');
    const quiz = QUIZZES.owl[1];
    app.action('quizAnswer', { quizId: QUIZZES.fox[0].id, optionId: 'switch' });
    app.action('quizAnswer', { quizId: quiz.id, optionId: 'switch' });
    app.action('quizAnswer', { optionId: quiz.correctOptionId });
    app.action('quizAnswer');
    assert.equal(app.game.quizSession.answerId, null);
    app.action('admin');
    assert.equal(app.view.overlay, 'admin');
    app.action('quizAnswer', { quizId: quiz.id, optionId: quiz.correctOptionId });
    assert.equal(app.game.quizSession.answerId, null, 'Scene select must not answer through the quiz.');
    app.action('close');
    assert.equal(app.view.overlay, 'dialogue');
    app.window.fire('blur');
    for (let time = 0; time < 1000; time += 100) app.frame(time);
    app.window.fire('focus');
    assert.equal(app.view.overlay, 'dialogue', 'Focus loss keeps the quiz open.');
    assert.equal(app.game.quizSession.quizId, quiz.id);
    assert.equal(app.game.quizSession.answerId, null);
    const inventory = JSON.stringify([app.game.potatoes, app.game.tears, app.game.learnedSongs, app.game.restoredSites]);
    app.action('quizAnswer', { quizId: quiz.id, optionId: quiz.correctOptionId });
    app.action('quizAnswer', { quizId: quiz.id, optionId: quiz.options[0].id });
    assert.equal(app.game.quizSession.answerId, quiz.correctOptionId);
    app.action('dialogueFinish'); app.action('dialogueFinish');
    assert.deepEqual(plain(app.game.quizCompleted), [quiz.id]);
    assert.equal(app.game.dialogueNext.owl, 2);
    assert.equal(JSON.stringify([app.game.potatoes, app.game.tears, app.game.learnedSongs, app.game.restoredSites]), inventory);
    app.action('quizAnswer', { quizId: quiz.id, optionId: quiz.correctOptionId });
    assert.equal(app.game.quizSession, null, 'A late event after close has no effect.');
  } finally { app.dispose(); }
});

test('reduced motion shows the final still reward without an animation wait', () => {
  const app = entryPoint({ reducedMotion: true, ending: 'goddess' });
  try {
    app.action('newWalk');
    app.frame(0);
    gatherForApp(app);
    app.window.fire('keydown', { key: 'e', code: 'KeyE' });
    app.frame(50);
    for (const [index, target] of HOUSE_TARGETS.entries()) {
      walkAppTo(app, target);
      gameModel.step(app.game, {}, 0.05);
      gameModel.step(app.game, { interact: true }, 0.05);
      if (index < 2) gameModel.finishConversation(app.game);
      else finishActionForApp(app);
    }
    app.frame(100);
    passSupper(app);
    assert.equal(app.view.overlay, 'win');
  } finally { app.dispose(); }
});


test('reduced motion changed after loading is honored before dinner is served', () => {
  const app = entryPoint({ ending: 'goddess' });
  try {
    app.action('newWalk');
    app.frame(0);
    gatherForApp(app);
    app.window.fire('keydown', { key: 'e', code: 'KeyE' });
    app.frame(50);
    for (const [index, target] of HOUSE_TARGETS.entries()) {
      walkAppTo(app, target);
      gameModel.step(app.game, {}, 0.05);
      if (index === 4) app.setReducedMotion(true);
      gameModel.step(app.game, { interact: true }, 0.05);
      if (index < 2) gameModel.finishConversation(app.game);
      else finishActionForApp(app);
    }
    app.frame(100);
    passSupper(app);
    assert.equal(app.view.overlay, 'win', 'The current motion preference must determine whether the reveal waits.');
  } finally { app.dispose(); }
});

test('enabling reduced motion during the reveal immediately opens the still ending', () => {
  const app = entryPoint({ ending: 'goddess' });
  try {
    app.action('newWalk');
    app.frame(0);
    gatherForApp(app);
    app.window.fire('keydown', { key: 'e', code: 'KeyE' });
    app.frame(50);
    for (const [index, target] of HOUSE_TARGETS.entries()) {
      walkAppTo(app, target);
      gameModel.step(app.game, {}, 0.05);
      gameModel.step(app.game, { interact: true }, 0.05);
      if (index < 2) gameModel.finishConversation(app.game);
      else finishActionForApp(app);
    }
    app.frame(100);
    passSupper(app);
    assert.equal(app.view.overlay, 'reveal');
    app.setReducedMotion(true);
    app.frame(150);
    assert.equal(app.view.overlay, 'win', 'Turning on reduced motion must end the animation wait on the next frame.');
  } finally { app.dispose(); }
});

test('held E cannot reopen a song panel after Escape clears input', () => {
  const app = entryPoint();
  try {
    app.action('newWalk'); Object.assign(app.game.player, SONG_SITES[0]);
    app.frame(0); app.window.fire('keydown', { code: 'KeyE' }); app.frame(16);
    assert.equal(app.view.overlay, 'songs');
    app.window.fire('keydown', { code: 'Escape' });
    app.window.fire('keydown', { code: 'KeyE', repeat: true }); app.frame(32);
    assert.equal(app.view.overlay, null);
    app.window.fire('keyup', { code: 'KeyE' });
    app.window.fire('keydown', { code: 'KeyE' }); app.frame(48);
    assert.equal(app.view.overlay, 'songs');
  } finally { app.dispose(); }
});

test('releasing and pressing E between frames starts the next dinner step', () => {
  const app = entryPoint();
  try {
    app.action('newWalk'); app.game.scene = 'house'; app.game.houseStep = 3;
    Object.assign(app.game.player, HOUSE_TARGETS.find(target => target.id === 'cook'));
    app.frame(0); app.game.interactionHeld = true;
    app.window.fire('keyup', { code: 'KeyE' });
    app.window.fire('keydown', { code: 'KeyE' }); app.frame(16);
    assert.equal(app.game.actionAnimation?.kind, 'cook');
  } finally { app.dispose(); }
});

test('sample failure reaches the title status and survives language and mute changes', () => {
  const app = entryPoint();
  try {
    app.audio.failPendingSamples();
    assert.equal(app.view.overlay, 'intro');
    assert.equal(app.view.sampleFallback, 'Nástroje se nepodařilo načíst. Hudba použije syntetické zvuky. Ve výpravě můžeš pokračovat.');
    app.action('language', 'en'); app.action('sound'); app.action('sound');
    assert.equal(app.view.sampleFallback, 'The instruments couldn’t load. Music will use synthesized sounds. You can keep exploring.');
  } finally { app.dispose(); }
});

test('scene selection preserves a paused song on close and discards it on jump', () => {
  const app = entryPoint();
  try {
    app.action('admin');
    app.action('jump', 'fairy-birch');
    app.frame(0);
    app.window.fire('keydown', { code: 'KeyE' });
    app.frame(50);
    const song = app.game.activeSong;
    assert.ok(song);
    app.action('admin');
    app.frame(100);
    assert.equal(app.audio.paused, true);
    assert.equal(app.game.activeSong, song);
    app.action('close');
    assert.equal(app.view.overlay, null);
    assert.equal(app.game.activeSong, song);
    app.action('admin');
    app.action('jump', 'cook');
    assert.equal(app.game.activeSong, null);
    assert.equal(app.game.houseStep, 3);
    assert.equal(app.game.scene, 'house');
    assert.equal(app.game.actionAnimation, null);
    app.frame(150);
    assert.equal(app.game.actionAnimation, null, 'Held E must not carry into a prepared scene.');
    app.action('admin');
    const game = app.game;
    app.action('jump', 'missing');
    assert.equal(app.game, game);
    assert.equal(app.view.overlay, 'admin');
  } finally { app.dispose(); }
});

test('scene selector restores nested panels and selected replies, and clears replies on jumps', () => {
  const app = entryPoint();
  try {
    app.action('help');
    app.action('admin');
    app.action('close');
    assert.equal(app.view.overlay, 'help');
    app.action('close');
    assert.equal(app.view.overlay, 'intro');
    app.action('admin');
    app.action('jump', 'fox:2');
    const chosen = quizAnswer(app, false);
    app.action('admin');
    app.action('language', 'en');
    app.action('close');
    assert.equal(app.view.overlay, 'dialogue');
    assert.equal(app.view.dialogue.quiz.answerId, chosen, 'Scene select open and close preserves the answer.');
    assert.equal(app.view.dialogue.index, 2);
    assert.deepEqual(plain(app.game.quizCompleted), []);
    app.action('admin');
    app.action('jump', 'owl:1');
    assert.deepEqual(plain(app.view.dialogue.quiz), { quizId: QUIZZES.owl[1].id, answerId: null }, 'A jump clears the old answer and prepares the requested quiz.');
    assert.deepEqual(plain(app.game.quizCompleted), [], 'Jumping must not award the abandoned quiz.');
    assert.equal(app.view.dialogue.index, 1);
    assert.equal(app.game.language, 'en');
  } finally { app.dispose(); }
});

test('choosing the dance after supper pauses its reveal clock in scene select', () => {
  const app = entryPoint();
  try {
    app.action('admin');
    app.action('jump', 'serve');
    app.frame(0);
    app.window.fire('keydown', { code: 'KeyE' });
    app.frame(50);
    finishActionForApp(app);
    app.frame(100);
    passSupper(app);
    assert.equal(app.view.overlay, 'endingChoice');
    app.action('ending', 'dance');
    assert.equal(app.view.overlay, 'dance');
    assert.equal(app.game.ending, 'dance');
    assert.equal(app.audio.paused, true, 'Game music must stay silent under the video.');
    app.frame(150);
    const time = app.game.finaleTime;
    app.action('admin');
    app.frame(200);
    assert.equal(app.game.finaleTime, time);
    app.action('close');
    app.frame(250);
    assert.ok(app.game.finaleTime > time);
    app.window.fire('blur');
    const unfocusedTime = app.game.finaleTime;
    app.frame(300);
    assert.equal(app.game.finaleTime, unfocusedTime);
    app.window.fire('focus');
    app.setReducedMotion(true);
    app.frame(350);
    assert.ok(app.game.finaleTime >= 4);
    app.action('restart');
    assert.equal(app.view.overlay, 'confirmWalk', 'Walk again asks before replacing an unsaved or study walk.');
    app.action('confirmWalk');
    assert.equal(app.game.phase, 'playing');
    assert.equal(app.game.potatoes.length, 0);
    assert.equal(app.game.finaleTime, 0);
  } finally { app.dispose(); }
});


test('F2 and Escape close scene select when an animal menu has focus without changing progress', () => {
  const app = entryPoint();
  try {
    app.action('admin'); app.action('jump', 'fox:2'); const chosen = quizAnswer(app);
    for (const code of ['F2', 'Escape']) {
      app.action('admin');
      const before = structuredClone(app.game);
      const target = { matches: selector => selector.includes('select'), closest: () => null };
      const arrow = app.window.fire('keydown', { code: 'ArrowDown', target });
      assert.equal(arrow.prevented, undefined, 'Native menu navigation must remain available.');
      const close = app.window.fire('keydown', { code, target });
      assert.equal(close.prevented, true);
      assert.equal(app.view.overlay, 'dialogue');
      assert.deepEqual(app.game, before);
      assert.equal(app.view.dialogue.quiz.answerId, chosen);
    }
  } finally { app.dispose(); }
});

test('slow frames and replay send the actual video position to the family animation', () => {
  const app = entryPoint();
  try {
    app.action('admin'); app.action('jump', 'ending-dance'); app.frame(0);
    app.game.dancePlaying = true;
    for (let frame = 1; frame <= 10; frame++) {
      app.finale.playbackTime = frame / 10;
      app.frame(frame * 100);
    }
    assert.equal(app.worldTimes.at(-1), 1, 'Ten 100 ms frames must follow 1 second of video, not the 0.5 second movement cap.');
    app.finale.playbackTime = null; app.frame(1100);
    assert.equal(app.worldTimes.at(-1), 1, 'No confirmed playback position must freeze the dance.');
    app.finale.playbackTime = .02; app.frame(1200);
    assert.equal(app.worldTimes.at(-1), .02, 'Replaying from zero must restart the dance clock too.');
    app.action('admin'); app.finale.playbackTime = 2; app.frame(1300);
    assert.equal(app.worldTimes.at(-1), .02, 'Scene selection must keep the dance frozen.');
  } finally { app.dispose(); }
});

for (const ending of ['dance', 'goddess']) test(`supper lets the player choose ${ending} while preserving language and mute`, () => {
  const app = entryPoint();
  try {
    app.action('language', 'en'); app.action('sound', undefined, trusted); app.action('sound', undefined, trusted);
    app.action('admin'); app.action('jump', 'serve'); app.frame(0);
    app.window.fire('keydown', { code: 'KeyE' }); app.frame(50);
    finishActionForApp(app); app.frame(100);
    passSupper(app);
    assert.equal(app.game.ending, null);
    assert.equal(app.view.overlay, 'endingChoice');
    app.window.fire('keydown', { code: 'Escape' }); app.frame(500);
    assert.equal(app.view.overlay, 'endingChoice', 'Escape must not leave a completed game with no way to choose.');
    app.action('ending', 'missing');
    assert.equal(app.game.ending, null);
    app.action('admin'); app.action('close');
    assert.equal(app.view.overlay, 'endingChoice');
    app.action('language', 'cs'); app.action('ending', ending);
    assert.equal(app.view.overlay, ending === 'dance' ? 'dance' : 'reveal');
    assert.equal(app.game.ending, ending);
    assert.equal(app.game.language, 'cs'); assert.equal(app.view.sound, false);
    app.action('ending', ending === 'dance' ? 'goddess' : 'dance');
    assert.equal(app.game.ending, ending, 'A repeated click must not replace the chosen ending.');
    app.setReducedMotion(true); app.frame(550);
    if (ending === 'goddess') assert.equal(app.view.overlay, 'win');
    app.action('restart');
    assert.equal(app.view.overlay, 'confirmWalk', 'Walk again asks before replacing an unsaved or study walk.');
    app.action('confirmWalk');
    assert.equal(app.game.ending, null, 'A new walk must offer both endings again.');
  } finally { app.dispose(); }
});

function finishCare(app, choice) {
  jumpTo(app, 'aldo'); app.frame(0); app.window.fire('keydown', {code:'KeyE'}); app.frame(20);
  app.window.fire('keyup', {code:'KeyE'});
  if (choice !== null) app.action('dialogueChoice',choice);
  app.action('dialogueFinish');
}

test('real entry point keeps John independent and cancels Aldo care on movement without changing supplies', () => {
  const app=entryPoint();jumpTo(app,'john');app.frame(0);app.window.fire('keydown',{code:'KeyE'});app.frame(20);
  app.action('dialogueFinish');assert.equal(app.view.moment.kind,'john-bowls');
  app.window.fire('keydown',{code:'KeyW'});app.frame(100);assert.equal(app.view.moment.kind,'john-bowls');
  app.frame(2600);assert.equal(app.view.moment,null);assert.equal(app.game.houseStep,1);app.dispose();
  for (const choice of [0,1,null]) {
    const care=entryPoint();finishCare(care,choice);
    assert.equal(care.game.houseStep,2);
    if(choice===null) assert.equal(care.view.moment,null);
    else {
      assert.equal(care.view.moment.kind,choice===1?'aldo-lullaby':'aldo-finger');
      const before=JSON.stringify([care.game.potatoes,care.game.tears,care.game.learnedSongs,care.game.restoredSites]);
      care.window.fire('keydown',{code:'KeyW'});care.frame(100);
      assert.equal(care.view.moment,null);
      assert.equal(JSON.stringify([care.game.potatoes,care.game.tears,care.game.learnedSongs,care.game.restoredSites]),before);
    }
    care.dispose();
  }
});

test('lullaby defers guidance before the first redraw and preserves identity across language, guides, and focus', () => {
  const app=entryPoint();finishCare(app,1);
  const moment=app.view.moment;
  assert.equal(app.game.message,'');app.frame(200);assert.ok(moment.elapsed>0);
  app.action('language','en');assert.equal(app.view.moment,moment);
  let time=200;
  for (const panel of ['pause','help','map','admin']) {
    app.action(panel);const elapsed=moment.elapsed;app.frame(time+=600);assert.equal(moment.elapsed,elapsed,panel);
    app.action('close');assert.equal(app.view.moment,moment);
  }
  app.window.fire('blur');const elapsed=moment.elapsed;app.frame(time+=1000);assert.equal(moment.elapsed,elapsed);
  app.window.fire('focus');app.action('resume');app.frame(time+=200);assert.ok(moment.elapsed>elapsed);
  app.frame(time+=10000);assert.equal(app.view.moment,null);assert.match(app.game.message,/prepare/);
  app.dispose();
});

test('John pauses on focus loss during Aldo dialogue without a pause overlay', () => {
  const app=entryPoint();jumpTo(app,'john');app.frame(0);
  app.window.fire('keydown',{code:'KeyE'});app.frame(20);app.window.fire('keyup',{code:'KeyE'});app.action('dialogueFinish');
  const moment=app.view.moment;
  // Walk across the clear aisle with real movement before John's action ends.
  app.window.fire('keydown',{code:'KeyD'});app.window.fire('keydown',{code:'KeyS'});
  let time=20;
  for(let i=0;i<42;i++)app.frame(time+=50);
  app.window.fire('keyup',{code:'KeyD'});app.window.fire('keyup',{code:'KeyS'});
  app.window.fire('keydown',{code:'KeyE'});app.frame(time+=20);
  assert.equal(app.game.conversation,'aldo');assert.equal(app.view.overlay,'dialogue');assert.equal(app.view.moment,moment);
  const elapsed=moment.elapsed;assert.ok(elapsed>0&&elapsed<moment.duration);
  app.window.fire('blur');app.frame(time+=1000);
  assert.equal(app.view.overlay,'dialogue');assert.equal(moment.elapsed,elapsed);
  app.window.fire('focus');app.frame(time+=50);assert.ok(moment.elapsed>elapsed);app.dispose();
});

test('goddess reveal and its completion panel pause together on focus loss', () => {
  const app=entryPoint();jumpTo(app,'ending-goddess');app.frame(0);app.frame(50);
  assert.equal(app.view.overlay,'reveal');app.window.fire('blur');
  let time=50;for(let i=0;i<100;i++)app.frame(time+=50);
  assert.equal(app.view.overlay,'reveal','A frozen rise must not open its completion panel.');
  app.window.fire('focus');for(let i=0;i<74;i++)app.frame(time+=50);
  assert.equal(app.view.overlay,'win');app.dispose();
});

test('a displayed gift receipt does not reappear after expiry or movement and never clears a newer message', () => {
  for(const end of ['expiry','movement','new-message']) {
    const app=entryPoint();jumpTo(app,'fairy-ridge');app.frame(0);
    app.window.fire('keydown',{code:'KeyE'});app.frame(20);app.window.fire('keyup',{code:'KeyE'});
    let time=20+app.game.activeSong.duration*1000;app.frame(time);
    assert.ok(app.game.message);assert.equal(app.view.moment.kind,'fairy-gift');
    if(end==='new-message')gameModel.setMessage(app.game,'A newer message',{},7);
    if(end==='movement'){app.window.fire('keydown',{code:'KeyD'});app.frame(time+=50);assert.equal(app.view.moment.focusReleased,true);}
    else app.frame(time+=3500);
    assert.equal(app.game.message,end==='new-message'?'A newer message':'',end);
    assert.equal(app.game.tears.length,1);app.dispose();
  }
});

test('scene replacement, disposal, and graphics failure retire pending care and late audio readiness', () => {
  for (const end of ['jump','dispose','graphics']) {
    const app=entryPoint();finishCare(app,1);assert.ok(app.view.moment);
    if(end==='jump') {jumpTo(app,'fairy-ridge');app.audio.completeEnable();app.frame(1000);assert.equal(app.view.moment,null);assert.equal(app.game.scene,'outdoors');}
    else if(end==='dispose') {app.dispose();assert.equal(app.audio.disposed,true);}
    else {app.renderer.fire('webglcontextlost');assert.equal(app.audio.disposed,true);}
  }
});

test('real fairy receipts have one shared gift and prepared scenes do not invent one', () => {
  const app=entryPoint();jumpTo(app,'fairy-ridge');app.frame(0);app.window.fire('keydown',{code:'KeyE'});app.frame(20);app.window.fire('keyup',{code:'KeyE'});
  const song=app.game.activeSong;assert.ok(song);app.frame(20+song.duration*1000);
  assert.equal(app.view.moment.kind,'fairy-gift');assert.equal(app.view.moment.subjectId,'fairy-ridge');assert.equal(app.game.tears.length,1);
  const gift=app.view.moment;app.window.fire('keydown',{code:'KeyD'});app.frame(100+song.duration*1000);assert.equal(gift.focusReleased,true);
  jumpTo(app,'garden-woodland');app.frame(1000+song.duration*1000);assert.equal(app.view.moment,null);app.dispose();
});

test('a real walk from Jitřenka to the deer ends the gift before conversation without changing its reward', () => {
  const app = entryPoint(); jumpTo(app, 'fairy-ridge'); app.frame(0);
  app.window.fire('keydown', { code: 'KeyE' }); app.frame(20); app.window.fire('keyup', { code: 'KeyE' });
  let time = 20 + app.game.activeSong.duration * 1000; app.frame(time);
  assert.equal(app.view.moment.kind, 'fairy-gift');
  const inventory = JSON.stringify([app.game.tears, app.game.learnedSongs]);
  // The canonical start is south of Jitřenka. Two ordinary screen directions
  // reach the deer before the 3.5-second presentation expires.
  for (let i = 0; i < 42 && Math.hypot(app.game.player.x - 11, app.game.player.z + 30) > 1.2; i++) {
    const dx = 11 - app.game.player.x, dz = -30 - app.game.player.z;
    for (const code of ['KeyW','KeyA','KeyS','KeyD']) app.window.fire('keyup', {code});
    app.window.fire('keydown', { code: dx + dz < 0 ? 'KeyW' : 'KeyS' });
    app.window.fire('keydown', { code: dx - dz < 0 ? 'KeyA' : 'KeyD' });
    app.frame(time += 50);
  }
  for (const code of ['KeyW','KeyA','KeyS','KeyD']) app.window.fire('keyup', {code});
  assert.ok(app.view.moment, 'The gift must still be active at the interruption.');
  app.window.fire('keydown', {code:'KeyE'}); app.frame(time += 50);
  assert.equal(app.game.conversation, 'deer'); assert.equal(app.view.moment, null);
  assert.equal(JSON.stringify([app.game.tears, app.game.learnedSongs]), inventory); app.dispose();
});

test('a garden song through the entry point rewards once and frames its finish without owning the reward', async () => {
  // V02: halfway cancellation, Escape, a stalled frame, completion, an immediate
  // new action, and direct entry. Exactly one restoration remains.
  for (const site of SONG_SITES) for (const interruption of ['move', 'escape', 'complete']) {
    const app = entryPoint();
    try {
      jumpTo(app, `garden-${site.id}`); app.frame(0);
      const before = JSON.stringify([app.game.potatoes, app.game.tears, app.game.learnedSongs]);
      app.window.fire('keydown', { code: 'KeyE' }); app.frame(20); app.window.fire('keyup', { code: 'KeyE' });
      assert.equal(app.view.overlay, 'songs');
      app.action('chooseSong', site.songId);
      const song = app.game.activeSong;
      let time = 20 + song.duration * 500;
      app.frame(time);
      assert.ok(song.progress > .4 && song.progress < .6, 'The fixture must reach the middle of the phrase.');
      if (interruption === 'move') { app.window.fire('keydown', { code: 'KeyD' }); app.frame(time += 50); app.window.fire('keyup', { code: 'KeyD' }); }
      if (interruption === 'escape') { app.window.fire('keydown', { code: 'Escape' }); app.frame(time += 50); }
      if (interruption !== 'complete') {
        assert.equal(app.game.activeSong, null);
        assert.ok(!app.game.restoredSites.includes(site.id), 'A cancelled song restores nothing.');
        assert.equal(app.view.moment, null);
        continue;
      }
      app.frame(time += song.duration * 1000); // A stalled frame finishes the song once.
      assert.ok(app.game.restoredSites.includes(site.id));
      assert.equal(app.game.restoredSites.filter((id) => id === site.id).length, 1);
      assert.equal(app.view.moment?.kind, 'restoration-finish');
      assert.equal(app.view.moment.subjectId, site.id);
      assert.equal(JSON.stringify([app.game.potatoes, app.game.tears, app.game.learnedSongs]), before, 'The finish presentation adds no reward.');
      const finish = app.view.moment;
      app.action('pause'); app.frame(time += 1000);
      const frozen = finish.elapsed; app.frame(time += 1000);
      assert.equal(finish.elapsed, frozen, 'Pause freezes it.');
      app.action('resume');
      app.window.fire('keydown', { code: 'KeyA' }); app.frame(time += 50); app.window.fire('keyup', { code: 'KeyA' });
      assert.equal(app.view.moment?.focusReleased, true, 'Moving releases the framing immediately.');
      app.frame(time += 2000);
      assert.equal(app.view.moment, null, 'The 1.6-second finish ends on its own.');
      assert.equal(app.game.restoredSites.filter((id) => id === site.id).length, 1);
    } finally { app.dispose(); }
  }
  const direct = entryPoint();
  try {
    jumpTo(direct, 'garden-woodland'); jumpTo(direct, 'home'); direct.frame(0);
    assert.equal(direct.view.moment, null, 'Prepared scenes show final states without a new finish.');
  } finally { direct.dispose(); }
});

test('practice spots sing once, award nothing, and only respond after a finished phrase', async () => {
  const { PRACTICE_SPOTS } = await import('../src/data.js');
  for (const spot of PRACTICE_SPOTS) {
    const app = entryPoint();
    try {
      app.action('newWalk'); app.frame(0);
      Object.assign(app.game.player, { x: spot.x, z: spot.z + 1.3 });
      app.window.fire('keydown', { code: 'KeyE' }); app.frame(50); app.window.fire('keyup', { code: 'KeyE' });
      assert.equal(app.game.activeSong, null, 'An unlearned song offers guidance, not a performance.');
      assert.match(app.game.message, /naučí/);
      jumpTo(app, spot.id); app.frame(100);
      const before = JSON.stringify([app.game.potatoes, app.game.tears, app.game.learnedSongs, app.game.restoredSites, app.game.houseStep, app.game.talked]);
      app.window.fire('keydown', { code: 'KeyE' }); app.frame(150); app.window.fire('keyup', { code: 'KeyE' });
      const song = app.game.activeSong;
      assert.equal(song?.kind, 'practice'); assert.equal(song.targetId, spot.id); assert.equal(song.songId, spot.songId);
      app.action('map'); app.frame(1150); app.action('close');
      assert.equal(app.game.activeSong, null, 'Opening a guide stops singing, like any song.');
      app.window.fire('keydown', { code: 'KeyE' }); app.frame(1200); app.window.fire('keyup', { code: 'KeyE' });
      const again = app.game.activeSong;
      app.frame(1200 + again.duration * 1000 + 60);
      assert.equal(app.game.activeSong, null);
      assert.equal(app.view.moment?.kind, 'practice-response');
      assert.equal(app.view.moment.subjectId, spot.id);
      assert.equal(JSON.stringify([app.game.potatoes, app.game.tears, app.game.learnedSongs, app.game.restoredSites, app.game.houseStep, app.game.talked]), before, 'Practice awards nothing.');
    } finally { app.dispose(); }
  }
});

test('the settled supper continues once, by button, Escape, or its own end, and freezes on focus loss', () => {
  for (const exit of ['button', 'escape', 'expire']) {
    const app = entryPoint({ ending: null });
    try {
      jumpTo(app, 'serve'); app.frame(0);
      app.window.fire('keydown', { code: 'KeyE' }); app.frame(50);
      finishActionForApp(app); app.frame(100);
      assert.equal(app.view.overlay, 'supper');
      assert.equal(app.game.phase, 'won');
      const supper = app.view.moment;
      app.window.fire('blur'); app.frame(2000);
      assert.equal(supper.elapsed, app.view.moment.elapsed);
      assert.ok(supper.elapsed < .2, 'Focus loss freezes the supper presentation.');
      app.window.fire('focus');
      if (exit === 'button') { app.action('supperContinue'); app.action('supperContinue'); }
      if (exit === 'escape') app.window.fire('keydown', { code: 'Escape' });
      if (exit === 'expire') { app.frame(2100); app.frame(2200); app.frame(4000); }
      assert.equal(app.view.overlay, 'endingChoice', exit);
      assert.equal(app.game.phase, 'won');
      assert.equal(app.game.ending, null);
    } finally { app.dispose(); }
  }
  for (const ending of ['ending-dance', 'ending-goddess']) {
    const app = entryPoint();
    try { jumpTo(app, ending); app.frame(0); assert.notEqual(app.view.overlay, 'supper', 'Prepared endings bypass supper.'); }
    finally { app.dispose(); }
  }
});

test('the guidance preference collapses optional detail and keeps essentials', () => {
  const app = entryPoint();
  try {
    app.action('newWalk'); app.frame(0);
    assert.equal(app.view.guidance, true);
    app.action('pause'); app.action('guidance');
    assert.equal(app.view.guidance, false);
    app.action('language', 'en');
    assert.equal(app.view.guidance, false, 'Language changes keep the preference.');
    app.action('resume');
    assert.equal(app.view.overlay, null);
    assert.equal(app.view.guidance, false);
  } finally { app.dispose(); }
});
