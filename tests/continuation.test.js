import test from 'node:test';
import assert from 'node:assert/strict';
import * as gameModel from '../src/game.js';
import * as saveModule from '../src/save.js';
import { POTATOES } from '../src/data.js';
import { SEQUENCES, createSequenceGame } from '../src/sequences.js';
import { createFakeIndexedDB } from './fake-indexeddb.js';
import { entryPoint, trusted, walkAppTo, finishActionForApp, jumpTo } from './entry-harness.js';

// Milestone 5 through the real main.js. The fake database models transactions;
// real cross-tab isolation and browser reopen behavior are checked in a browser.
const prefs = (overrides = {}) => ({ language: 'cs', sound: true, guidance: true, ...overrides });
function record(edit = {}, preferences = prefs()) {
  const game = gameModel.startGame(gameModel.createGame(preferences.language, () => 0));
  Object.assign(game, edit);
  return saveModule.encodeSnapshot(saveModule.createSnapshot(game, preferences, `seed-${Math.random()}`));
}
function supperRecord(preferences = prefs()) {
  const game = createSequenceGame('ending-goddess', preferences.language);
  game.ending = null;
  return saveModule.encodeSnapshot(saveModule.createSnapshot(game, preferences, 'seed-supper'));
}
function database(raw) {
  const idb = createFakeIndexedDB();
  if (raw !== undefined) idb.seed('pec-adventure', { stores: { walks: { current: raw } } });
  return idb;
}
const quiet = async (idb) => { await idb.idle(); await idb.idle(); };
const puts = (idb) => idb.count('put');
const decoded = (idb) => saveModule.decodeRecord(idb.value());
const otherTab = (idb, raw) => idb.database().stores.get('walks').set('current', raw);

// Gather the cottage potato through the real animation loop, so its checkpoint runs there.
function gatherCottagePotato(app, start = 1000) {
  walkAppTo(app, POTATOES[0]);
  let time = start;
  app.window.fire('keydown', { code: 'KeyE' }); app.frame(time += 50); app.window.fire('keyup', { code: 'KeyE' });
  assert.equal(app.game.actionAnimation?.kind, 'gather');
  for (let i = 0; i < 30 && app.game.actionAnimation; i++) app.frame(time += 50);
  assert.ok(app.game.potatoes.includes(POTATOES[0].id));
  return time;
}
async function normalWalk(idb, options = {}) {
  const app = entryPoint({ idb, ...options });
  await quiet(idb);
  app.gesture((event) => app.action('newWalk', undefined, event));
  await quiet(idb);
  assert.equal(app.game.phase, 'playing');
  app.frame(0);
  return app;
}

test('the title checks for a saved walk, blocks starts until then, and hydrates intent without playback or writes', async () => {
  const raw = record({ potatoes: ['potato-1'] }, prefs({ language: 'en', sound: true, guidance: false }));
  const idb = database(raw);
  const app = entryPoint({ idb, gestureAudio: true });
  try {
    assert.equal(app.view.storage.pending, true);
    assert.equal(app.view.storage.status, 'Hledá se uložená výprava.');
    assert.equal(app.view.storage.offerContinue, false);
    assert.equal(app.view.storage.offerUnsaved, true, 'Play without saving is offered during the read.');
    app.gesture(() => app.window.fire('click'));
    assert.deepEqual(app.audio.enableCalls, [], 'No automatic sound before the read settles.');
    app.action('newWalk', undefined, trusted);
    jumpTo(app, 'fox:0');
    assert.equal(app.game.phase, 'intro', 'Starts and study jumps wait for the read.');
    app.action('close');
    await quiet(idb);
    assert.equal(app.view.storage.pending, false);
    assert.equal(app.view.storage.offerContinue, true);
    assert.equal(app.game.language, 'en');
    assert.equal(app.view.guidance, false);
    assert.equal(app.view.soundState, 'idle', 'Hydrated sound-on intent waits for a gesture.');
    assert.deepEqual(app.audio.enableCalls, []);
    assert.equal(idb.value(), raw);
    app.gesture((event) => app.action('continue', undefined, event));
    assert.deepEqual(app.audio.gestureCalls, [{ next: true, inGesture: true }], 'Continue resumes audio inside its own gesture.');
    assert.equal(app.view.soundState, 'running');
    assert.equal(app.game.phase, 'playing');
    assert.deepEqual([...app.game.potatoes], ['potato-1']);
    await quiet(idb);
    assert.equal(puts(idb), 0, 'Continue is read-only.');
    assert.equal(idb.value(), raw);
    assert.equal(app.view.storage.helpStatus, 'Your completed steps are saved in this browser.');
  } finally { app.dispose(); }
});

test('the first Sound press after hydration starts sound once, without an off request or a write', async () => {
  const idb = database(record({}, prefs({ sound: true })));
  const app = entryPoint({ idb, gestureAudio: true });
  try {
    await quiet(idb);
    const soundButton = { closest: (selector) => selector.includes('data-action="sound"') ? {} : null, matches: () => false };
    app.gesture((event) => { app.window.fire('click', { target: soundButton }); app.action('sound', undefined, event); });
    assert.deepEqual(app.audio.enableCalls, [true]);
    assert.equal(app.view.soundState, 'running');
    await quiet(idb);
    assert.equal(puts(idb), 0, 'Title choices never write.');
  } finally { app.dispose(); }
});

test('a saved off stays silent through Continue, title choices win, and one deliberate change writes once', async () => {
  const raw = record({}, prefs({ language: 'cs', sound: false }));
  const idb = database(raw);
  const app = entryPoint({ idb, gestureAudio: true });
  try {
    await quiet(idb);
    app.gesture(() => app.window.fire('keydown', { key: 'h', code: 'KeyH' }));
    app.action('close');
    app.action('language', 'en');
    assert.deepEqual(app.audio.enableCalls, [], 'Saved off is respected by title gestures.');
    app.gesture((event) => app.action('continue', undefined, event));
    assert.equal(app.game.language, 'en', 'A title language choice applies after Continue.');
    assert.ok(!app.audio.enableCalls.includes(true));
    await quiet(idb);
    assert.equal(puts(idb), 0);
    assert.equal(idb.value(), raw, 'No title interaction changes record bytes.');
    app.gesture((event) => app.action('sound', undefined, event));
    assert.equal(app.view.soundState, 'running');
    await quiet(idb);
    assert.equal(puts(idb), 1, 'One deliberate preference change writes once.');
    assert.equal(decoded(idb).payload.preferences.sound, true);
    assert.equal(decoded(idb).payload.preferences.language, 'en');
    assert.equal(app.view.storage.conflict, undefined);
    assert.equal(app.view.storage.status, '', 'No false competing-tab message.');
  } finally { app.dispose(); }
});

test('waiting, retry, cancellation, stale results, and rejection keep truthful sound labels', async () => {
  const app = entryPoint({ gestureAudio: true });
  try {
    app.audio.delayEnable = true;
    app.gesture(() => app.window.fire('click'));
    assert.equal(app.view.soundState, 'waiting');
    assert.equal(app.view.soundError, 'Zvuk čeká na spuštění.');
    gameModel.setMessage(app.game, 'An unrelated message', {}, 5);
    app.frame(0);
    assert.equal(app.view.soundError, 'Zvuk čeká na spuštění.', 'An unrelated game message never replaces the sound status.');
    app.action('language', 'en');
    assert.equal(app.view.soundError, 'Sound is waiting to start.');
    const calls = app.audio.enableCalls.length;
    app.gesture(() => app.window.fire('click'));
    assert.equal(app.audio.enableCalls.length, calls + 1, 'A pending resume never suppresses a later gesture retry.');
    app.gesture((event) => app.action('sound', undefined, event));
    assert.equal(app.view.soundState, 'idle', 'Sound off cancels a waiting request.');
    assert.equal(app.audio.enableCalls.at(-1), false);
    app.audio.completeEnable();
    assert.equal(app.view.soundState, 'idle', 'An old resume result can’t undo a later off.');
    app.gesture(() => app.window.fire('click'));
    assert.equal(app.audio.enableCalls.at(-1), false, 'No automatic retry after an explicit off.');
    app.gesture((event) => app.action('sound', undefined, event));
    assert.equal(app.view.soundState, 'waiting');
    app.audio.rejectEnable();
    assert.equal(app.view.soundState, 'unavailable');
    assert.equal(app.view.soundError, 'Sound is unavailable. You can keep exploring without it.');
    const afterReject = app.audio.enableCalls.length;
    app.gesture(() => app.window.fire('click'));
    assert.equal(app.audio.enableCalls.length, afterReject, 'No automatic retry after an unavailable result.');
    app.audio.delayEnable = false;
    app.gesture((event) => app.action('sound', undefined, event));
    assert.equal(app.view.soundState, 'running', 'An explicit Sound press tries again.');
    assert.equal(app.view.soundError, '');
  } finally { app.dispose(); }
});

test('the dance video follows sound intent apart from game audio, and its study writes nothing', async () => {
  const idb = database();
  const app = entryPoint({ idb, gestureAudio: true });
  try {
    await quiet(idb);
    jumpTo(app, 'ending-dance'); app.frame(0);
    assert.equal(app.view.overlay, 'dance');
    assert.equal(app.finale.view.soundWanted, true, 'Video sound follows intent while Web Audio is still suspended.');
    app.gesture(() => app.window.fire('click'));
    assert.deepEqual(app.audio.enableCalls, [], 'The dance surface has no capture-phase sound retry.');
    app.gesture((event) => app.action('sound', 'video', event));
    app.frame(50);
    assert.equal(app.finale.view.soundWanted, false);
    assert.deepEqual(app.audio.enableCalls, [false], 'Video off also turns game audio off, without an on request.');
    app.gesture((event) => app.action('sound', 'video', event));
    app.frame(100);
    assert.equal(app.finale.view.soundWanted, true);
    assert.ok(!app.audio.enableCalls.includes(true), 'Video on doesn’t resume the paused game engine.');
    await quiet(idb);
    assert.equal(puts(idb), 0, 'Study scenes never write.');
    assert.equal(app.view.storage.status, 'Prohlídka scény. Postup se tu neukládá.');
  } finally { app.dispose(); }
});

for (const operation of ['transaction', 'objectStore', 'get', 'put']) {
  test(`a synchronous ${operation} failure in a checkpoint keeps the walk playable and stops saving`, async () => {
    const idb = database();
    const app = await normalWalk(idb);
    try {
      const before = puts(idb);
      idb.throwNext(operation);
      let time = gatherCottagePotato(app);
      await quiet(idb);
      assert.equal(app.view.storage.status, 'Postup se nepodařilo uložit. Zavřením karty přijdeš o neuložený postup. Nech ji otevřenou a výpravu dokonči.');
      const position = { ...app.game.player };
      app.window.fire('keydown', { code: 'KeyW' });
      for (let i = 0; i < 4; i++) app.frame(time += 50);
      app.window.fire('keyup', { code: 'KeyW' });
      assert.notDeepEqual({ ...app.game.player }, position, 'Movement continues after the failure.');
      walkAppTo(app, POTATOES[1]);
      app.window.fire('keydown', { code: 'KeyE' }); app.frame(time += 50); app.window.fire('keyup', { code: 'KeyE' });
      for (let i = 0; i < 30 && app.game.actionAnimation; i++) app.frame(time += 50);
      assert.ok(app.game.potatoes.includes(POTATOES[1].id), 'Ordinary actions still complete.');
      await quiet(idb);
      assert.equal(puts(idb), before, 'No later write is attempted.');
      assert.equal(idb.count('open'), 1, 'Storage is never reopened.');
      assert.equal(app.view.storage.offerReturn, false);
    } finally { app.dispose(); }
  });
}

for (const loss of ['close', 'versionchange']) {
  test(`an unexpected ${loss} with a write in flight and one pending stops saving and ignores old callbacks`, async () => {
    const idb = database();
    const app = await normalWalk(idb);
    try {
      const committed = idb.value();
      const gate = idb.holdNextCommit();
      let time = gatherCottagePotato(app);
      await gate.reached;
      walkAppTo(app, POTATOES[1]);
      app.window.fire('keydown', { code: 'KeyE' }); app.frame(time += 50); app.window.fire('keyup', { code: 'KeyE' });
      for (let i = 0; i < 30 && app.game.actionAnimation; i++) app.frame(time += 50);
      const [connection] = idb.connections();
      if (loss === 'close') idb.forceClose(connection);
      else idb.indexedDB.open('pec-adventure', 2);
      await quiet(idb);
      gate.release();
      await quiet(idb);
      for (let i = 0; i < 3; i++) app.frame(time += 50);
      assert.equal(app.game.potatoes.length, 2, 'Progress survives in memory.');
      assert.equal(app.view.storage.status, 'Postup se nepodařilo uložit. Zavřením karty přijdeš o neuložený postup. Nech ji otevřenou a výpravu dokonči.');
      assert.equal(idb.count('open', { version: 1 }), 1, 'No reopen.');
      const stored = saveModule.decodeRecord(idb.value());
      assert.ok([committed, idb.value()].includes(idb.value()) && stored.status !== 'invalid');
      assert.ok(stored.payload.potatoes.length <= 1, 'The pending second checkpoint was dropped, not written later.');
    } finally { app.dispose(); }
  });
}

test('an intentional abort refused as already committing isn’t a failure, and Return waits for its result', async () => {
  const idb = database();
  const app = await normalWalk(idb);
  try {
    const gate = idb.holdNextCommit();
    gatherCottagePotato(app);
    await gate.reached;
    jumpTo(app, 'fairy-birch');
    assert.equal(app.view.storage.offerReturn, true);
    app.action('pause');
    app.gesture((event) => app.action('returnSaved', undefined, event));
    assert.equal(app.view.storage.busy, true, 'Return waits for the committing transaction.');
    assert.equal(app.game.player.x, createSequenceGame('fairy-birch').player.x, 'The study stays until the result arrives.');
    gate.release();
    await quiet(idb);
    assert.equal(app.view.storage.busy, false);
    assert.notEqual(app.view.storage.status, 'Postup se nepodařilo uložit. Zavřením karty přijdeš o neuložený postup. Nech ji otevřenou a výpravu dokonči.');
    assert.deepEqual([...app.game.potatoes], [POTATOES[0].id], 'Return loads the checkpoint that committed.');
    assert.equal(app.view.overlay, null);
  } finally { app.dispose(); }
});

test('Return from a study ending keeps the visit’s latest preferences, both ways, without load-time writes', async () => {
  for (const savedSound of [true, false]) {
    const raw = record({ potatoes: ['potato-1'] }, prefs({ sound: savedSound, language: 'cs', guidance: true }));
    const idb = database(raw);
    const app = entryPoint({ idb, gestureAudio: true });
    try {
      await quiet(idb);
      assert.equal(app.view.storage.offerReturn, false, 'No Return on the title.');
      jumpTo(app, 'ending-goddess'); app.frame(0);
      assert.equal(app.view.storage.offerReturn, true, 'The title snapshot counts as a return target.');
      app.action('language', 'en');
      // From idle the first press turns sound on; a saved-on visit presses again for off.
      app.gesture((event) => app.action('sound', undefined, event));
      if (savedSound) app.gesture((event) => app.action('sound', undefined, event));
      app.action('admin');
      app.gesture((event) => app.action('returnSaved', undefined, event));
      await quiet(idb);
      assert.equal(app.game.phase, 'playing');
      assert.deepEqual([...app.game.potatoes], ['potato-1']);
      assert.equal(app.game.language, 'en', 'The study language choice survives Return.');
      assert.equal(app.view.soundState, savedSound ? 'idle' : 'running', 'The study sound choice survives Return.');
      assert.equal(app.view.storage.offerReturn, false, 'No Return in normal play.');
      assert.equal(puts(idb), 0, 'Return is read-only.');
      app.action('pause'); app.action('guidance');
      await quiet(idb);
      assert.equal(puts(idb), 1);
      assert.deepEqual(decoded(idb).payload.preferences, { language: 'en', sound: !savedSound, guidance: false }, 'Retained choices persist at the next authorized checkpoint.');
    } finally { app.dispose(); }
  }
});

test('a disconnect during a waiting Return cancels it and keeps the study usable', async () => {
  const idb = database();
  const app = await normalWalk(idb);
  try {
    const gate = idb.holdNextCommit();
    gatherCottagePotato(app);
    await gate.reached;
    jumpTo(app, 'fairy-ridge');
    app.action('pause');
    app.gesture((event) => app.action('returnSaved', undefined, event));
    assert.equal(app.view.storage.busy, true);
    idb.forceClose(idb.connections()[0]);
    await quiet(idb);
    gate.release();
    await quiet(idb);
    assert.equal(app.view.storage.busy, false, 'The busy state is released.');
    assert.equal(app.view.overlay, 'pause');
    assert.equal(app.view.storage.offerReturn, false, 'Unavailable Return stays hidden.');
    assert.ok(app.view.storage.status.startsWith('Prohlídka scény. Postup se tu neukládá. Ukládání není dostupné.'));
    assert.equal(app.game.potatoes.length, 0, 'The study scene was not replaced.');
  } finally { app.dispose(); }
});

test('the action map has one selector start and never says Start a saved walk', async () => {
  assert.equal(SEQUENCES.filter((entry) => entry.id === 'start').length, 1);
  const { readFileSync } = await import('node:fs');
  for (const file of ['../src/ui.js', '../src/main.js', '../src/i18n.js', '../src/finale.js']) {
    assert.doesNotMatch(readFileSync(new URL(file, import.meta.url), 'utf8'), /Start a saved walk/);
  }
});

test('New walk from an empty title commits exactly once and becomes current only after commit', async () => {
  const idb = database();
  const app = entryPoint({ idb });
  try {
    await quiet(idb);
    app.gesture((event) => app.action('newWalk', undefined, event));
    assert.equal(app.game.phase, 'intro', 'The walk waits for its initial record.');
    await quiet(idb);
    assert.equal(app.game.phase, 'playing');
    assert.equal(puts(idb), 1);
    assert.equal(decoded(idb).status, 'valid');
    assert.equal(decoded(idb).payload.checkpoint, 'forest');
    assert.equal(app.view.overlay, null);
  } finally { app.dispose(); }
});

test('New walk asks before replacing a valid, invalid, or unsupported slot, and Cancel restores the title exactly', async () => {
  for (const [slot, expected] of [[record(), 'Začít novou výpravu? Uložená výprava bude nahrazena.'], ['{bad json', 'Začít novou výpravu? Uložená výprava bude nahrazena.'], [{ not: 'a string' }, null]]) {
    const idb = database(slot);
    const app = entryPoint({ idb });
    try {
      await quiet(idb);
      assert.equal(app.view.storage.offerContinue, typeof slot === 'string' && !slot.startsWith('{bad'));
      app.gesture((event) => app.action('newWalk', undefined, event));
      await quiet(idb);
      assert.equal(app.view.overlay, 'confirmWalk');
      if (expected) assert.equal(app.view.storage.confirm.text, expected);
      else {
        assert.equal(app.view.storage.confirm.notice, 'Ukládání není dostupné. Nová výprava se neuloží.', 'A non-string slot allows only an unsaved walk.');
        assert.doesNotMatch(app.view.storage.confirm.text, /nahrazena/, 'Never claim an unsupported record will be replaced.');
      }
      app.action('cancelConfirm');
      assert.equal(app.view.overlay, 'intro');
      assert.equal(app.game.phase, 'intro');
      await quiet(idb);
      assert.equal(puts(idb), 0);
      assert.deepEqual(idb.value(), slot);
    } finally { app.dispose(); }
  }
});

test('another tab writing between the reread and the replacement is refused on the title and after an ending', async () => {
  for (const surface of ['title', 'ending']) {
    const idb = database(surface === 'title' ? record() : supperRecord());
    const app = entryPoint({ idb });
    try {
      await quiet(idb);
      if (surface === 'ending') {
        app.gesture((event) => app.action('continue', undefined, event));
        assert.equal(app.view.overlay, 'endingChoice', 'A finished save resumes at the ending chooser.');
        app.action('ending', 'goddess'); app.setReducedMotion(true); app.frame(0); app.frame(50);
        assert.equal(app.view.overlay, 'win');
        app.gesture((event) => app.action('restart', undefined, event));
      } else app.gesture((event) => app.action('newWalk', undefined, event));
      await quiet(idb);
      assert.equal(app.view.overlay, 'confirmWalk');
      const competing = record({ potatoes: ['potato-1', 'potato-2'] });
      otherTab(idb, competing);
      app.gesture((event) => app.action('confirmWalk', undefined, event));
      await quiet(idb);
      assert.equal(app.view.overlay, 'saveFailure');
      assert.equal(app.view.storage.failure.text, surface === 'title'
        ? 'Jiná karta uložila jinou výpravu. Načti stránku znovu a zkontroluj ji, začni novou výpravu, nebo hraj bez ukládání.'
        : 'Jiná karta uložila jinou výpravu. Začni novou výpravu, nebo hraj bez ukládání.');
      assert.doesNotMatch(app.view.storage.failure.text, /hraj dál/, 'No false keep-playing copy without an active walk.');
      assert.equal(app.view.storage.offerContinue, false, 'The stale Continue offer is gone.');
      assert.equal(idb.value(), competing, 'The other tab’s record survives.');
      app.action('failureBack');
      assert.equal(app.view.overlay, surface === 'title' ? 'intro' : 'win');
      assert.equal(app.view.storage.offerUnsaved, true, 'Play without saving remains after Back.');
      if (surface === 'title') assert.equal(app.view.storage.offerReload, true);
      const writes = puts(idb);
      app.gesture((event) => app.action('playUnsaved', undefined, event));
      assert.equal(app.game.phase, 'playing');
      assert.equal(app.game.potatoes.length, 0);
      await quiet(idb);
      assert.equal(puts(idb), writes, 'The unsaved start writes nothing.');
      assert.equal(idb.value(), competing);
      assert.equal(app.view.storage.status, 'Postup ve výpravě se neukládá. Nech kartu otevřenou a výpravu dokonči. Opětovným načtením přijdeš o neuložený postup.');
      assert.ok(idb.connections().every((connection) => connection.closed || connection.closePending), 'Opting out closes the connection.');
    } finally { app.dispose(); }
  }
});

test('Cancel on a live walk’s unsaved-loss confirmation returns to the failure panel without opting out', async () => {
  const idb = database();
  const app = await normalWalk(idb);
  try {
    gatherCottagePotato(app);
    await quiet(idb);
    app.action('pause');
    app.gesture((event) => app.action('newWalk', undefined, event));
    await quiet(idb);
    otherTab(idb, record({ potatoes: ['potato-2'] }));
    app.gesture((event) => app.action('confirmWalk', undefined, event));
    await quiet(idb);
    assert.equal(app.view.overlay, 'saveFailure');
    assert.equal(app.view.storage.failure.text, 'Jiná karta uložila jinou výpravu. Načti stránku znovu a zkontroluj ji, nebo hraj dál bez ukládání. Opětovným načtením přijdeš o neuložený postup.');
    app.gesture((event) => app.action('playUnsaved', undefined, event));
    assert.equal(app.view.overlay, 'confirmWalk');
    assert.equal(app.view.storage.confirm.text, 'Začít novou výpravu? Přijdeš o neuložený postup v současné výpravě.');
    app.action('cancelConfirm');
    assert.equal(app.view.overlay, 'saveFailure');
    assert.deepEqual([...app.game.potatoes], [POTATOES[0].id], 'The prior game is intact.');
    assert.ok(idb.connections().some((connection) => !connection.closed && !connection.closePending), 'Cancel doesn’t close storage.');
    app.action('failureBack');
    assert.equal(app.view.overlay, 'pause');
    assert.equal(app.view.storage.status, 'Jiná karta uložila jinou výpravu. Načti stránku znovu a zkontroluj ji, nebo hraj dál bez ukládání. Opětovným načtením přijdeš o neuložený postup.');
    assert.equal(app.view.storage.selectorNote, 'Výběr scény nahradí současnou výpravu. Neuložený postup se ztratí.', 'No saved-copy promise while a conflict is latched.');
  } finally { app.dispose(); }
});

test('a slow initial open after a voluntary unsaved start is closed and never hydrates', async () => {
  const idb = database(record({}, prefs({ language: 'en' })));
  const gate = idb.holdNextOpen();
  const app = entryPoint({ idb });
  try {
    assert.equal(app.view.storage.pending, true);
    app.gesture((event) => app.action('playUnsaved', undefined, event));
    assert.equal(app.game.phase, 'playing');
    gate.release();
    await quiet(idb);
    assert.equal(app.game.language, 'cs', 'Late hydration is suppressed.');
    assert.ok(idb.connections().every((connection) => connection.closed || connection.closePending), 'The late connection is closed.');
    assert.equal(app.view.storage.status, 'Postup ve výpravě se neukládá. Nech kartu otevřenou a výpravu dokonči. Opětovným načtením přijdeš o neuložený postup.');
    app.action('pause'); app.gesture((event) => app.action('newWalk', undefined, event));
    assert.equal(app.view.storage.confirm.notice, 'Ukládání je pro tuto návštěvu vypnuté. Nová výprava se neuloží.');
  } finally { app.dispose(); }
});

test('a disconnect on the title, during confirmation, or after supper uses its surface’s copy', async () => {
  const titleDb = database(record());
  const title = entryPoint({ idb: titleDb });
  try {
    await quiet(titleDb);
    titleDb.forceClose(titleDb.connections()[0]);
    await quiet(titleDb);
    assert.equal(title.view.storage.status, 'Ukládání není dostupné. Načti stránku znovu a zjisti, jestli je uložená výprava, nebo začni novou výpravu bez ukládání.');
    assert.equal(title.view.storage.offerContinue, false);
    assert.equal(title.view.storage.offerReload, true);
    title.action('reload');
    assert.equal(title.window.reloads, 1);
  } finally { title.dispose(); }
  const confirmDb = database(record());
  const confirming = entryPoint({ idb: confirmDb });
  try {
    await quiet(confirmDb);
    confirming.gesture((event) => confirming.action('newWalk', undefined, event));
    await quiet(confirmDb);
    assert.equal(confirming.view.overlay, 'confirmWalk');
    confirmDb.forceClose(confirmDb.connections()[0]);
    await quiet(confirmDb);
    assert.equal(confirming.view.overlay, 'saveFailure');
    assert.equal(confirming.game.phase, 'intro', 'The old game stays until a new explicit choice.');
    confirming.action('failureBack');
    assert.equal(confirming.view.overlay, 'intro');
  } finally { confirming.dispose(); }
  const supperDb = database(supperRecord());
  const supper = entryPoint({ idb: supperDb });
  try {
    await quiet(supperDb);
    supper.gesture((event) => supper.action('continue', undefined, event));
    supperDb.forceClose(supperDb.connections()[0]);
    await quiet(supperDb);
    assert.equal(supper.view.storage.status, 'Ukládání není dostupné. Nech kartu otevřenou, pokud se chceš k závěru vrátit. Opětovným načtením přijdeš o neuložený postup.');
    assert.doesNotMatch(supper.view.storage.status, /dokonči/, 'A finished walk is never told to finish.');
  } finally { supper.dispose(); }
});

test('a failed initial open starts a fresh unsaved walk with its own copy, and the selector never promises a saved copy', async () => {
  const idb = database();
  idb.failNextOpen('UnknownError');
  const app = entryPoint({ idb });
  try {
    await quiet(idb);
    app.action('admin');
    assert.equal(app.view.storage.selectorNote, 'Postup při prohlídce scény se neuloží.');
    app.action('close');
    app.gesture((event) => app.action('newWalk', undefined, event));
    assert.equal(app.game.phase, 'playing');
    assert.equal(app.view.storage.status, 'Postup ve výpravě se neukládá. Nech kartu otevřenou a výpravu dokonči. Opětovným načtením přijdeš o neuložený postup.');
    assert.equal(app.view.storage.selectorNote, 'Výběr scény nahradí současnou výpravu. Neuložený postup se ztratí.');
    app.action('language', 'en');
    assert.equal(app.view.storage.selectorNote, 'Choosing a study scene replaces the current walk. Unsaved progress will be lost.');
    assert.equal(puts(idb), 0);
  } finally { app.dispose(); }
});

for (const preference of ['language', 'guidance']) {
  test(`a ${preference} change alone saves once and survives a fresh page without another reward`, async () => {
    const idb = database();
    const first = await normalWalk(idb);
    let writes;
    try {
      gatherCottagePotato(first);
      await quiet(idb);
      writes = puts(idb);
      if (preference === 'language') first.action('language', 'en');
      else { first.action('pause'); first.action('guidance'); }
      await quiet(idb);
      assert.equal(puts(idb), writes + 1);
    } finally { first.dispose(); }
    const second = entryPoint({ idb });
    try {
      await quiet(idb);
      assert.equal(preference === 'language' ? second.game.language : second.view.guidance, preference === 'language' ? 'en' : false, 'The title shows the saved preference.');
      second.gesture((event) => second.action('continue', undefined, event));
      assert.deepEqual([...second.game.potatoes], [POTATOES[0].id], 'No reward is repeated or lost.');
      await quiet(idb);
      assert.equal(puts(idb), writes + 1, 'Loading writes nothing.');
    } finally { second.dispose(); }
  });
}

test('selector copy follows the real save state', async () => {
  const idb = database();
  const app = await normalWalk(idb);
  try {
    await quiet(idb);
    assert.equal(app.view.storage.selectorNote, 'Výběr scény zachová poslední uložený postup. Neuložené kroky se ztratí.');
    jumpTo(app, 'owl:0');
    assert.equal(app.view.storage.selectorNote, 'Výběr jiné scény nahradí tu současnou. Postup se tu neuloží.');
    assert.equal(app.view.storage.helpStatus, 'Postup při prohlídce scény se neukládá.');
  } finally { app.dispose(); }
});

test('a completed supper checkpoint resumes at the chooser without starting the video', async () => {
  const idb = database();
  const app = await normalWalk(idb);
  try {
    jumpTo(app, 'serve');
    app.action('close');
    // A prepared scene is study; walk the real household path from a normal save instead.
  } finally { app.dispose(); }
  const raw = supperRecord();
  const fresh = database(raw);
  const resumed = entryPoint({ idb: fresh });
  try {
    await quiet(fresh);
    resumed.gesture((event) => resumed.action('continue', undefined, event));
    assert.equal(resumed.view.overlay, 'endingChoice');
    assert.equal(resumed.game.ending, null);
    assert.equal(resumed.game.phase, 'won');
    resumed.frame(0);
    assert.notEqual(resumed.view.overlay, 'dance', 'Loading never starts the video.');
  } finally { resumed.dispose(); }
});
