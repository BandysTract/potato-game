import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import * as gameModel from '../src/game.js';
import { regionAt, CREATURES, FAIRIES, HOME, HOUSE_START, HOUSE_TARGETS, POTATOES } from '../src/data.js';
import { t } from '../src/i18n.js';

// Run the real entry point with browser surfaces replaced, rather than supplying
// the overlay policy ourselves. Real browser permission and layout are separate checks.
const source = readFileSync(new URL('../src/main.js', import.meta.url), 'utf8')
  .replace(/^import .*;\n/gm, '').replaceAll('import.meta.hot', 'hot');

class Target {
  listeners = new Map();
  addEventListener(name, handler, capture = false) {
    const entries = this.listeners.get(name) || [];
    entries.push({ handler, capture });
    this.listeners.set(name, entries);
  }
  removeEventListener(name, handler) {
    this.listeners.set(name, (this.listeners.get(name) || []).filter((entry) => entry.handler !== handler));
  }
  fire(type, values = {}) {
    const event = { type, isTrusted: true, repeat: false, target: { closest: () => null, matches: () => false }, preventDefault() { this.prevented = true; }, ...values };
    const entries = [...this.listeners.get(type) || []].sort((a, b) => Number(Boolean(b.capture)) - Number(Boolean(a.capture)));
    entries.forEach(({ handler }) => handler(event));
    return event;
  }
}

function entryPoint({ soundInitThrows = false, reducedMotion = false, random = Math.random } = {}) {
  const window = new Target();
  const document = new Target();
  const frames = new Map();
  const renderer = new Target();
  let action;
  let view;
  let game;
  let dispose;
  let frameId = 0;
  let changes;
  const node = () => ({ setAttribute() {}, append() {}, focus() {}, replaceChildren() {} });
  const root = node();
  const motionPreference = { matches: reducedMotion };
  window.matchMedia = () => motionPreference;
  document.hidden = false;
  document.focused = true;
  document.hasFocus = () => document.focused;
  document.documentElement = node();
  document.querySelector = (selector) => selector === '#ui' ? root : node();
  document.createElement = node;
  const audio = {
    enabled: false, paused: true, disposed: false, enableCalls: [], ticks: [], soundInitThrows,
    setEnabled(next) {
      this.enableCalls.push(next);
      if (next && this.soundInitThrows) throw new Error('Audio initialization failed');
      if (next && this.delayEnable) return false;
      this.enabled = next;
      changes(next);
      return next;
    },
    completeEnable() { this.enabled = true; changes(true); },
    setPaused(next) { this.paused = next; },
    tick(current) { this.ticks.push({ phase: current.phase, paused: this.paused }); },
    collect() {}, finish() {}, dispose() { this.disposed = true; },
  };
  runInNewContext(source, {
    ...gameModel, createGame(language) { return gameModel.createGame(language, random); }, t, regionAt, window, document,
    createAudio(onChange) { changes = onChange; return audio; },
    createUI(_root, onAction) { action = onAction; return { update(currentGame, currentView) { game = currentGame; view = currentView; }, dispose() {} }; },
    createWorld() { return { renderer: { domElement: renderer }, update() {}, resize() {}, dispose() {} }; },
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
    hot: { dispose(callback) { dispose = callback; } },
    console,
  });
  return {
    window, document, audio, renderer, action,
    setReducedMotion(next) { motionPreference.matches = next; },
    get view() { return view; }, get game() { return game; },
    frame(time) { const [id, callback] = frames.entries().next().value; frames.delete(id); callback(time); },
    dispose() { dispose(); },
  };
}

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
    app.action('start');
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
    app.action('sound');
    assert.equal(app.view.sound, true);
    assert.equal(app.game.phase, 'intro');
    app.action('language', 'en');
    assert.equal(app.game.language, 'en');
    assert.equal(app.view.sound, true);
    app.action('start');
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

test('a sound initialization error reaches the localized title status and successful retry clears stale messages', () => {
  // Rejects placing the title error only in the hidden gameplay toast, or
  // leaving its text in either surface after sound becomes available.
  for (const [retryDuringPlay, delayedEnable] of [[false, false], [true, false], [false, true]]) {
    const app = entryPoint({ soundInitThrows: true });
    try {
      assert.equal(app.view.soundError || '', '', 'The title status must begin empty.');
      app.action('sound');
      assert.equal(app.game.phase, 'intro');
      assert.equal(app.view.overlay, 'intro');
      assert.equal(app.view.sound, false);
      assert.equal(app.view.soundError, 'Zvuk není dostupný. Ve výpravě můžeš pokračovat i bez něj.', 'The title must receive the existing Czech sound error.');
      app.action('language', 'en');
      assert.equal(app.view.soundError, 'Sound is unavailable. You can keep exploring without it.', 'The visible title error must follow the selected language.');
      if (retryDuringPlay) {
        app.action('start');
        assert.equal(app.game.phase, 'playing');
        assert.equal(app.game.message, 'Sound is unavailable. You can keep exploring without it.');
        assert.ok(app.game.messageTime > 0, 'The fixture must still contain the pending gameplay toast before retry.');
      }
      app.audio.soundInitThrows = false;
      app.audio.delayEnable = delayedEnable;
      app.action('sound');
      if (delayedEnable) {
        assert.equal(app.view.sound, false);
        assert.equal(app.view.soundError, 'Sound is unavailable. You can keep exploring without it.', 'A suspended retry must keep its error until audio actually starts.');
        app.audio.completeEnable();
      }
      assert.equal(app.view.sound, true, 'A failed initialization must leave the sound control usable.');
      assert.equal(app.view.soundError, '', 'Successful retry must clear the title error.');
      assert.equal(app.game.message, '', 'Successful retry must also clear an existing or future gameplay error toast.');
      assert.equal(app.game.messageKey, '');
      assert.equal(app.game.messageTime, 0);
      if (!retryDuringPlay) app.action('start');
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
function walkAppTo(app, target) {
  for (let frame = 0; frame < 1500; frame++) {
    const dx = target.x - app.game.player.x;
    const dz = target.z - app.game.player.z;
    if (Math.hypot(dx, dz) < 0.12) return;
    gameModel.step(app.game, { x: (dx - dz) * Math.SQRT1_2, y: (dx + dz) * Math.SQRT1_2 }, Math.min(0.05, Math.hypot(dx, dz) / 5));
  }
  assert.fail(`The app fixture couldn’t reach ${target.id || 'waypoint'}.`);
}

function gatherForApp(app) {
  for (const [index, potato] of POTATOES.entries()) {
    walkAppTo(app, potato);
    gameModel.step(app.game, { interact: true }, 0.05);
    if (index === 2 || index === 3) {
      const fairy = FAIRIES[index - 2];
      walkAppTo(app, fairy);
      for (let frame = 0; frame < 40; frame++) gameModel.step(app.game, { interact: true }, 0.05);
    }
  }
  walkAppTo(app, FAIRIES[2]);
  for (let frame = 0; frame < 40; frame++) gameModel.step(app.game, { interact: true }, 0.05);
  walkAppTo(app, { x: 12, z: 7 });
  walkAppTo(app, { x: 0, z: 10 });
  walkAppTo(app, HOME);
}

test('house progress survives pause, map, help, language, and a cleared held interaction', () => {
  let draws = 0;
  const app = entryPoint({ random: () => draws++ < CREATURES.length ? 0 : 0.5 });
  let time = 0;
  const frame = () => app.frame(time += 50);
  const press = () => { app.window.fire('keydown', { key: 'e', code: 'KeyE' }); frame(); };
  const release = () => { app.window.fire('keyup', { key: 'e', code: 'KeyE' }); frame(); };
  try {
    app.action('start');
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
    }
    assert.equal(app.game.phase, 'won');
    assert.equal(app.view.overlay, 'reveal', 'The ending card waits while Hana transforms.');
    app.window.fire('keydown', { key: 'Escape', code: 'Escape' });
    app.action('restart');
    assert.equal(app.game.phase, 'won');
    assert.equal(app.view.overlay, 'reveal', 'Escape and restart must not interrupt the reveal.');
    for (let count = 0; count < 40; count++) frame();
    assert.equal(app.view.overlay, 'reveal', 'The 3.2-second reveal must not be covered early.');
    for (let count = 0; count < 40; count++) frame();
    assert.equal(app.view.overlay, 'win');
    assert.equal(app.view.sound, false, 'The family chapter and reveal preserve mute.');
    app.action('restart');
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

test('the entry point keeps the selected animal question and reply through language and focus changes', () => {
  const app = entryPoint({ random: () => 0.9 });
  let time = 0;
  const frame = () => app.frame(time += 50);
  try {
    app.action('start');
    frame();
    walkAppTo(app, { x: -7, z: 5 });
    walkAppTo(app, CREATURES[0]);
    app.window.fire('keydown', { key: 'e', code: 'KeyE' });
    frame();
    assert.equal(app.view.overlay, 'dialogue');
    assert.equal(app.view.dialogue.creatureId, 'fox');
    assert.equal(app.view.dialogue.index, 2, 'The view must receive the game’s selected question.');
    app.action('dialogueChoice', 1);
    const before = structuredClone(app.game.dialogueNext);
    app.action('language', 'en');
    assert.equal(app.view.dialogue.choice, 1);
    assert.equal(app.view.dialogue.index, 2);
    app.window.fire('blur');
    for (let count = 0; count < 20; count++) frame();
    app.window.fire('focus');
    assert.equal(app.view.dialogue.choice, 1);
    assert.equal(app.view.dialogue.index, 2);
    assert.deepEqual(app.game.dialogueNext, before);
    app.action('dialogueFinish');
    assert.equal(app.game.dialogueNext.fox, 0);
    app.action('dialogueFinish');
    assert.equal(app.game.dialogueNext.fox, 0, 'A duplicate close action must not advance twice.');
    app.action('pause');
    app.action('language', 'cs');
    app.action('resume');
    assert.equal(app.game.dialogueNext.fox, 0, 'Pausing must not consume the next question.');
    app.window.fire('keydown', { key: 'e', code: 'KeyE' });
    frame();
    assert.equal(app.view.dialogue.index, 0);
    assert.equal(app.view.dialogue.choice, null, 'The next question must begin with both choices available.');
    app.action('dialogueFinish');
  } finally { app.dispose(); }
});

test('reduced motion shows the final still reward without an animation wait', () => {
  const app = entryPoint({ reducedMotion: true });
  try {
    app.action('start');
    app.frame(0);
    gatherForApp(app);
    app.window.fire('keydown', { key: 'e', code: 'KeyE' });
    app.frame(50);
    for (const [index, target] of HOUSE_TARGETS.entries()) {
      walkAppTo(app, target);
      gameModel.step(app.game, {}, 0.05);
      gameModel.step(app.game, { interact: true }, 0.05);
      if (index < 2) gameModel.finishConversation(app.game);
    }
    app.frame(100);
    assert.equal(app.game.phase, 'won');
    assert.equal(app.view.overlay, 'win');
  } finally { app.dispose(); }
});


test('reduced motion changed after loading is honored before dinner is served', () => {
  const app = entryPoint();
  try {
    app.action('start');
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
    }
    app.frame(100);
    assert.equal(app.game.phase, 'won');
    assert.equal(app.view.overlay, 'win', 'The current motion preference must determine whether the reveal waits.');
  } finally { app.dispose(); }
});

test('enabling reduced motion during the reveal immediately opens the still ending', () => {
  const app = entryPoint();
  try {
    app.action('start');
    app.frame(0);
    gatherForApp(app);
    app.window.fire('keydown', { key: 'e', code: 'KeyE' });
    app.frame(50);
    for (const [index, target] of HOUSE_TARGETS.entries()) {
      walkAppTo(app, target);
      gameModel.step(app.game, {}, 0.05);
      gameModel.step(app.game, { interact: true }, 0.05);
      if (index < 2) gameModel.finishConversation(app.game);
    }
    app.frame(100);
    assert.equal(app.view.overlay, 'reveal');
    app.setReducedMotion(true);
    app.frame(150);
    assert.equal(app.view.overlay, 'win', 'Turning on reduced motion must end the animation wait on the next frame.');
  } finally { app.dispose(); }
});
