// Shared entry-point harness: the real main.js with browser surfaces replaced.
// Real browser permission, layout, and IndexedDB isolation are separate checks.
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import * as gameModel from '../src/game.js';
import { createMoment, advanceMoment } from '../src/moments.js';
import { HOUSE_ACTIVITIES } from '../src/dialogues.js';
import { regionAt, SONGS, SONG_SITES } from '../src/data.js';
import { t } from '../src/i18n.js';
import { createSequenceGame } from '../src/sequences.js';
import * as saveModule from '../src/save.js';
import { findQuiz } from '../src/quizzes.js';


// UI controls forward the native event. Only a trusted one may start audio.
export const trusted = { isTrusted: true, type: 'click' };
// Prepared and played endings pass through the settled supper first.
export function passSupper(app) {
  assert.equal(app.game.phase, 'won');
  assert.equal(app.view.overlay, 'supper');
  assert.equal(app.view.moment?.kind, 'supper');
  app.action('supperContinue');
  assert.equal(app.view.moment, null);
}
export const plain = (value) => JSON.parse(JSON.stringify(value));
export const quizAnswer = (app, correct = true) => {
  const quiz = findQuiz(app.game.quizSession.quizId);
  const optionId = correct ? quiz.correctOptionId : quiz.options.find(({ id }) => id !== quiz.correctOptionId).id;
  app.action('quizAnswer', { quizId: quiz.id, optionId });
  return optionId;
};

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

// gestureAudio models a browser that resumes audio only inside a trusted gesture.
export function entryPoint({ soundInitThrows = false, reducedMotion = false, random = Math.random, ending = null, idb = null, gestureAudio = false } = {}) {
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
  let sampleStatus;
  let startStatus = () => {};
  const node = () => ({ setAttribute() {}, append() {}, focus() {}, replaceChildren() {} });
  const root = node();
  const motionPreference = { matches: reducedMotion };
  window.matchMedia = () => motionPreference;
  window.reloads = 0;
  window.location = { reload() { window.reloads += 1; } };
  document.hidden = false;
  document.focused = true;
  document.hasFocus = () => document.focused;
  document.documentElement = node();
  document.querySelector = (selector) => selector === '#ui' ? root : node();
  document.createElement = node;
  let inGesture = false;
  const audio = {
    enabled: false, paused: true, disposed: false, enableCalls: [], ticks: [], soundInitThrows, gestureCalls: [], pendingResume: false,
    setEnabled(next) {
      this.enableCalls.push(next);
      if (next && this.soundInitThrows) throw new Error('Audio initialization failed');
      if (gestureAudio) {
        this.gestureCalls.push({ next, inGesture });
        if (!next) { this.pendingResume = false; if (this.enabled) { this.enabled = false; changes(false); } return false; }
        if (this.enabled) return true;
        if (!inGesture || this.delayEnable) { this.pendingResume = true; startStatus('waiting'); return false; }
        this.enabled = true; changes(true); return true;
      }
      if (next && this.delayEnable) { startStatus('waiting'); return false; }
      this.enabled = next;
      changes(next);
      return next;
    },
    // A browser ignores a resume result the app already cancelled.
    completeEnable() { if (gestureAudio && !this.pendingResume) return; this.pendingResume = false; this.enabled = true; changes(true); },
    rejectEnable() { this.pendingResume = false; startStatus('unavailable'); },
    failPendingSamples() { sampleStatus('fallback'); },
    setPaused(next) { this.paused = next; },
    tick(current) { this.ticks.push({ phase: current.phase, paused: this.paused }); },
    collect() {}, finish() {}, dispose() { this.disposed = true; },
  };
  const finale = { playbackTime: null, view: null, getPlaybackTime() { return this.playbackTime; }, update(_game, view) { this.view = view; }, pause() {}, dispose() {} };
  const worldTimes = [];
  runInNewContext(source, {
    ...gameModel, createMoment, advanceMoment, HOUSE_ACTIVITIES, createGame(language) { return { ...gameModel.createGame(language, random), ending }; }, createSequenceGame, t, regionAt, SONGS, SONG_SITES, window, document,
    // Without a fake database the store sees no IndexedDB, as in an unsupported browser.
    createSaveStore(options) { return saveModule.createSaveStore({ ...options, indexedDB: idb ? idb.indexedDB : null }); },
    createSnapshot: saveModule.createSnapshot, decodeRecord: saveModule.decodeRecord, restoreGame: saveModule.restoreGame,
    createAudio(onChange, onSamples, onStart) { changes = onChange; sampleStatus = onSamples; startStatus = onStart; return audio; },
    createUI(_root, onAction) { action = onAction; return { update(currentGame, currentView) { game = currentGame; view = currentView; }, dispose() {} }; },
    createFinale() { return finale; },
    createWorld() { return { renderer: { domElement: renderer }, update(game) { worldTimes.push(game.danceTime); }, resize() {}, dispose() {} }; },
    requestAnimationFrame(callback) { frames.set(++frameId, callback); return frameId; },
    cancelAnimationFrame(id) { frames.delete(id); },
    hot: { dispose(callback) { dispose = callback; } },
    console,
  });
  return {
    window, document, audio, renderer, action, finale, worldTimes,
    setReducedMotion(next) { motionPreference.matches = next; },
    get view() { return view; }, get game() { return game; },
    // Dispatch inside a trusted gesture, as a browser would for a click or key.
    gesture(run) { inGesture = true; try { return run(trusted); } finally { inGesture = false; } },
    frame(time) { const [id, callback] = frames.entries().next().value; frames.delete(id); callback(time); },
    dispose() { dispose(); },
  };
}

export function walkAppTo(app, target) {
  for (let frame = 0; frame < 1500; frame++) {
    const dx = target.x - app.game.player.x;
    const dz = target.z - app.game.player.z;
    if (Math.hypot(dx, dz) < 0.12) return;
    gameModel.step(app.game, { x: (dx - dz) * Math.SQRT1_2, y: (dx + dz) * Math.SQRT1_2 }, Math.min(0.05, Math.hypot(dx, dz) / 5));
  }
  assert.fail(`The app fixture couldn’t reach ${target.id || 'waypoint'}.`);
}

export function finishSongForApp(app) {
  for (let frame = 0; app.game.activeSong && frame < 500; frame++) gameModel.step(app.game, {}, 0.05);
  assert.equal(app.game.activeSong, null, 'The complete song must finish within 25 seconds.');
}

export function finishActionForApp(app) {
  for (let frame = 0; app.game.actionAnimation && frame < 100; frame++) gameModel.step(app.game, {}, 0.05);
  assert.equal(app.game.actionAnimation, null, 'The timed action must finish within 5 seconds.');
}

export function jumpTo(app, id) { app.action('admin'); app.action('jump', id); }
