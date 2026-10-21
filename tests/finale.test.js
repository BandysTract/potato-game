import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// The real controller owns loading and playback policy. The fake player reports
// readiness and playback separately, as the asynchronous iframe player does.
const source = readFileSync(new URL('../src/finale.js', import.meta.url), 'utf8')
  .replace(/^import .*;\n/gm, '').replace(/^export /gm, '');

class Element {
  constructor(tag = 'div', attributes = {}) {
    this.tagName = tag;
    this.attributes = attributes;
    this.hidden = 'hidden' in attributes;
    this.children = [];
    this.listeners = new Map();
    this.style = {};
    this.dataset = {};
    this.textContent = '';
  }
  set innerHTML(html) {
    this.replaceChildren();
    for (const [, tag, body] of html.matchAll(/<([a-z][\w-]*)\b([^>]*)>/g)) {
      const attributes = Object.fromEntries([...body.matchAll(/([\w-]+)(?:="([^"]*)")?/g)]
        .map(([, name, value]) => [name, value || '']));
      this.append(new Element(tag, attributes));
    }
  }
  querySelector(selector) {
    const matches = node => selector.startsWith('#') ? node.attributes.id === selector.slice(1)
      : selector.startsWith('.') ? (node.attributes.class || '').split(' ').includes(selector.slice(1))
        : selector.startsWith('[') ? selector.slice(1, -1) in node.attributes : node.tagName === selector;
    for (const child of this.children) {
      if (matches(child)) return child;
      const nested = child.querySelector(selector);
      if (nested) return nested;
    }
    return null;
  }
  append(node) { node.parent = this; this.children.push(node); }
  replaceChildren() { for (const node of this.children) node.parent = null; this.children = []; }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(node => node !== this); this.parent = null; }
  setAttribute(name, value) { this.attributes[name] = value; }
  focus() { this.focused = true; }
  addEventListener(name, callback, { signal } = {}) {
    const entries = this.listeners.get(name) || new Set();
    entries.add(callback);
    this.listeners.set(name, entries);
    signal?.addEventListener('abort', () => entries.delete(callback), { once: true });
  }
  click() { if (!this.disabled) for (const callback of this.listeners.get('click') || []) callback(); }
}

function finale() {
  const container = new Element();
  const head = new Element('head');
  const players = [];
  const playback = [];
  const actions = [];
  const timers = new Map();
  let timerId = 0;
  let now = 0;
  class Player {
    constructor(mount, options) {
      this.options = options;
      this.calls = [];
      this.iframe = new Element('iframe');
      mount.append(this.iframe);
      players.push(this);
    }
    getIframe() { return this.iframe; }
    getCurrentTime() { return this.currentTime; }
    mute() { this.calls.push('mute'); }
    unMute() { this.calls.push('unMute'); }
    playVideo() { this.calls.push('play'); }
    pauseVideo() { this.calls.push('pause'); }
    seekTo(position) { this.calls.push(['seek', position]); }
    destroy() { this.calls.push('destroy'); this.iframe.remove(); }
    emit(name, data) { this.options.events[name]({ target: this, data }); }
  }
  const window = { location: { origin: 'http://127.0.0.1:4173' } };
  const controller = runInNewContext(`${source}\ncreateFinale(container, onAction, onPlayback);`, {
    window, document: { head, createElement: tag => new Element(tag) }, container,
    onAction: (action, value) => actions.push(value === undefined ? action : `${action}:${value}`), onPlayback: value => playback.push(value), AbortController,
    setTimeout(callback, delay) { timers.set(++timerId, { callback, due: now + delay }); return timerId; },
    clearTimeout(id) { timers.delete(id); },
  });
  const game = { phase: 'won', ending: 'dance', language: 'en' };
  const view = { overlay: 'dance', focused: true, soundWanted: false };
  const bounds = { visible: true, left: 10, top: 20, width: 640, height: 360 };
  return {
    controller, container, head, players, playback, actions, game, view, bounds,
    root: container.children[0],
    find: selector => container.querySelector(selector),
    update() { controller.update(game, view, bounds); },
    async resolveAPI() { window.YT = { Player }; window.onYouTubeIframeAPIReady(); await Promise.resolve(); },
    async advance(milliseconds) {
      now += milliseconds;
      for (const [id, timer] of [...timers]) if (timer.due <= now) { timers.delete(id); timer.callback(); }
      await Promise.resolve();
    },
  };
}

async function ready(app) {
  app.update();
  await app.resolveAPI();
  const player = app.players.at(-1);
  player.emit('onReady');
  return player;
}

test('the video loads only for the dance ending after the projector is visible and the game has focus', async () => {
  const app = finale();
  try {
    app.game.phase = 'playing'; app.update();
    app.game.phase = 'won'; app.game.ending = 'goddess'; app.update();
    app.game.ending = 'dance'; app.view.overlay = 'admin'; app.update();
    app.view.overlay = 'dance'; app.view.focused = false; app.update();
    app.view.focused = true; app.bounds.visible = false; app.update();
    assert.equal(app.head.children.length, 0, 'Earlier scenes and the projector reveal must not request YouTube.');
    assert.equal(app.find('.projector-video').hidden, true);
    assert.equal(app.find('[data-finale-play]').disabled, true);
    app.bounds.visible = true; app.update(); app.update();
    assert.equal(app.head.children.length, 1, 'Repeated frames must share the pending API request.');
    assert.equal(app.head.children[0].src, 'https://www.youtube.com/iframe_api');
    assert.equal(app.find('.projector-video').hidden, false);
    assert.equal(app.find('[data-finale-status]').textContent, 'Loading the video…');
    await app.resolveAPI();
    assert.equal(app.players.length, 1);
    assert.equal(app.players[0].options.videoId, 'usk0WKKoHOk');
    assert.equal(app.players[0].options.host, 'https://www.youtube-nocookie.com');
    assert.equal(app.players[0].options.playerVars.autoplay, 0);
  } finally { app.controller.dispose(); }
});

test('readiness, play requests, and buffering keep dancing and status tied to actual playback', async () => {
  const app = finale();
  try {
    const player = await ready(app);
    assert.ok(player.calls.includes('play'), 'Readiness should attempt playback when the dance scene is active.');
    assert.ok(!app.playback.includes(true), 'Requesting playback does not prove that music started.');
    for (const state of [-1, 5, 3]) player.emit('onStateChange', state);
    assert.ok(!app.playback.includes(true), 'Unstarted, cued, and buffering states must keep the family still.');
    player.emit('onStateChange', 1);
    assert.equal(app.playback.at(-1), true);
    assert.equal(app.find('[data-finale-status]').textContent, 'Hana, John, Aldo, and Percy dance together.');
    player.emit('onStateChange', 3);
    assert.equal(app.playback.at(-1), false, 'Buffering after playback must stop the dance.');
    assert.equal(app.find('[data-finale-status]').textContent, 'Loading the video…', 'Buffering must replace the active-dance status.');
    assert.equal(app.find('[data-finale-play]').disabled, false, 'Buffering must retain an available playback recovery action.');
    const requests = player.calls.filter(call => call === 'play').length;
    app.find('[data-finale-play]').click();
    assert.equal(player.calls.filter(call => call === 'play').length, requests + 1);
    assert.equal(app.playback.at(-1), false, 'Retrying playback must still wait for confirmation before dancing.');
    player.emit('onStateChange', 1);
    assert.equal(app.playback.at(-1), true);
    player.emit('onStateChange', 2);
    assert.equal(app.playback.at(-1), false);
    assert.equal(app.find('[data-finale-play]').textContent, 'Play video');
  } finally { app.controller.dispose(); }
});

test('a delayed API completion cannot create a player after leaving the ending', async () => {
  const app = finale();
  try {
    app.update();
    app.controller.update({ phase: 'playing', ending: 'dance', language: 'en' }, { ...app.view, overlay: null }, null);
    const notifications = app.playback.length;
    await app.resolveAPI();
    assert.equal(app.players.length, 0, 'The departed ending must not create a hidden player.');
    assert.equal(app.playback.length, notifications, 'Stale completion must not mutate a later game through the playback callback.');
    assert.equal(app.root.hidden, true);
  } finally { app.controller.dispose(); }
});

test('a fresh ending can use the pending API while the departed ending stays cancelled', async () => {
  const app = finale();
  try {
    app.update();
    app.controller.update({ ...app.game }, app.view, app.bounds);
    assert.equal(app.head.children.length, 1);
    await app.resolveAPI();
    assert.equal(app.players.length, 1, 'Only the fresh ending may create a player when both awaited the API.');
    app.players[0].emit('onReady');
    app.players[0].emit('onStateChange', 1);
    assert.equal(app.playback.at(-1), true, 'Cancellation must not also block the replacement ending.');
  } finally { app.controller.dispose(); }
});

test('leaving destroys the player, and its delayed events cannot affect the replacement game', async () => {
  const app = finale();
  try {
    const player = await ready(app);
    player.emit('onStateChange', 1);
    app.controller.update({ phase: 'playing', ending: 'dance', language: 'en' }, { ...app.view, overlay: null }, null);
    assert.equal(player.calls.at(-1), 'destroy');
    assert.equal(app.playback.at(-1), false);
    assert.equal(app.find('[data-video-host]').children.length, 0);
    const notifications = app.playback.length;
    const calls = player.calls.length;
    for (const event of ['onReady', 'onStateChange', 'onAutoplayBlocked', 'onError']) player.emit(event, 1);
    assert.equal(app.playback.length, notifications);
    assert.equal(player.calls.length, calls);
    app.controller.update({ ...app.game }, app.view, app.bounds);
    await Promise.resolve();
    assert.equal(app.players.length, 2, 'A new ending must still be able to create its own player.');
    app.players[1].emit('onReady'); app.players[1].emit('onStateChange', 1);
    const renewedNotifications = app.playback.length;
    player.emit('onStateChange', 2); player.emit('onError', 101);
    assert.equal(app.playback.length, renewedNotifications, 'Events from the destroyed player must not stop the replacement dance.');
    assert.equal(app.playback.at(-1), true);
  } finally { app.controller.dispose(); }
});

test('explicit mute is honored on readiness, changes without reloading, and survives scene controls', async () => {
  const app = finale();
  try {
    const player = await ready(app);
    assert.deepEqual(player.calls.slice(0, 2), ['mute', 'play']);
    assert.equal(app.find('[data-finale-sound]').attributes['aria-pressed'], 'false');
    app.view.soundWanted = true; app.update();
    assert.equal(player.calls.at(-1), 'unMute');
    app.view.soundWanted = false; app.update();
    assert.equal(player.calls.at(-1), 'mute');
    app.find('[data-finale-sound]').click();
    app.find('[data-finale-admin]').click();
    app.find('[data-finale-restart]').click();
    assert.deepEqual(app.actions, ['sound:video', 'admin', 'restart'], 'The video control names its own output.');
    assert.equal(player.calls.at(-1), 'mute', 'Buttons delegate to the app instead of overriding its sound preference.');
    assert.equal(app.players.length, 1);
  } finally { app.controller.dispose(); }
});

test('focus loss and another overlay pause music and dancing, including late playing events', async () => {
  for (const change of ['focus', 'overlay']) {
    const app = finale();
    try {
      const player = await ready(app);
      player.emit('onStateChange', 1);
      if (change === 'focus') app.view.focused = false;
      else app.view.overlay = 'admin';
      app.update();
      assert.equal(player.calls.at(-1), 'pause');
      assert.equal(app.playback.at(-1), false);
      const notifications = app.playback.length;
      player.emit('onStateChange', 1);
      assert.equal(player.calls.at(-1), 'pause', 'Late playback must be stopped while the scene is inactive.');
      assert.equal(app.playback.length, notifications);
      const calls = player.calls.length;
      app.view.focused = true; app.view.overlay = 'dance'; app.update();
      assert.equal(player.calls.length, calls, 'Returning should wait for an explicit play action.');
      app.find('[data-finale-play]').click();
      assert.equal(player.calls.at(-1), 'play');
      assert.equal(app.players.length, 1);
    } finally { app.controller.dispose(); }
  }
});

test('a player becoming ready under another overlay stays paused until explicitly played', async () => {
  const app = finale();
  try {
    app.update(); await app.resolveAPI();
    app.view.overlay = 'admin'; app.update();
    const player = app.players[0];
    player.emit('onReady');
    assert.ok(!player.calls.includes('play'));
    assert.ok(!app.playback.includes(true));
    app.view.overlay = 'dance'; app.update();
    app.find('[data-finale-play]').click();
    assert.equal(player.calls.at(-1), 'play');
  } finally { app.controller.dispose(); }
});

test('blocked autoplay explains how to start playback and leaves a usable play button', async () => {
  const app = finale();
  try {
    const player = await ready(app);
    player.emit('onAutoplayBlocked');
    assert.equal(app.find('[data-finale-status]').textContent, 'Press play to start the music and dancing.');
    assert.equal(app.find('[data-finale-play]').disabled, false);
    assert.ok(!app.playback.includes(true));
    const requests = player.calls.filter(call => call === 'play').length;
    app.find('[data-finale-play]').click();
    assert.equal(player.calls.filter(call => call === 'play').length, requests + 1);
    player.emit('onStateChange', 1);
    assert.equal(app.playback.at(-1), true);
  } finally { app.controller.dispose(); }
});

test('video errors show a retry and YouTube fallback without starting an automatic retry loop', async () => {
  const app = finale();
  try {
    const player = await ready(app);
    player.emit('onError', 101);
    assert.equal(player.calls.at(-1), 'destroy');
    assert.match(app.find('[data-finale-status]').textContent, /unavailable.*try again.*YouTube/);
    assert.equal(app.find('[data-finale-play]').textContent, 'Try again');
    assert.equal(app.find('[data-finale-play]').disabled, false);
    assert.equal(app.find('[data-finale-link]').attributes.href, 'https://www.youtube.com/watch?v=usk0WKKoHOk');
    for (let frame = 0; frame < 3; frame++) app.update();
    await Promise.resolve();
    assert.equal(app.players.length, 1, 'Frame updates must keep the error visible until an explicit retry.');
    app.find('[data-finale-play]').click();
    await Promise.resolve();
    assert.equal(app.players.length, 2);
    app.players[1].emit('onReady'); app.players[1].emit('onStateChange', 1);
    assert.equal(app.playback.at(-1), true);
  } finally { app.controller.dispose(); }
});

test('both API and iframe readiness timeouts reach a retryable error instead of leaving loading stuck', async () => {
  for (const failure of ['api', 'iframe']) {
    const app = finale();
    try {
      app.update();
      if (failure === 'iframe') await app.resolveAPI();
      await app.advance(failure === 'api' ? 12000 : 15000);
      assert.equal(app.find('[data-finale-play]').textContent, 'Try again');
      assert.equal(app.find('[data-finale-play]').disabled, false);
      assert.match(app.find('[data-finale-status]').textContent, /unavailable/);
      app.find('[data-finale-play]').click();
      if (failure === 'api') {
        assert.equal(app.head.children.length, 1, 'Retry must replace the failed API script.');
        await app.resolveAPI();
      } else await Promise.resolve();
      const player = app.players.at(-1);
      player.emit('onReady'); player.emit('onStateChange', 1);
      assert.equal(app.playback.at(-1), true);
    } finally { app.controller.dispose(); }
  }
});

test('language changes keep the same player and playback, and translate the controls and status', async () => {
  const app = finale();
  try {
    const player = await ready(app);
    player.emit('onStateChange', 1);
    const calls = player.calls.length;
    const notifications = app.playback.length;
    app.game.language = 'cs'; app.update();
    assert.equal(app.players.length, 1);
    assert.equal(player.calls.length, calls);
    assert.equal(app.playback.length, notifications);
    assert.equal(app.find('[data-finale-play]').textContent, 'Pozastavit video');
    assert.equal(app.find('[data-finale-status]').textContent, 'Hana, John, Aldo a Percy spolu tančí.');
    app.find('[data-finale-language]').click();
    assert.deepEqual(app.actions, ['language']);
    app.game.language = 'en'; app.update();
    assert.equal(app.find('[data-finale-play]').textContent, 'Pause video');
  } finally { app.controller.dispose(); }
});

test('an ended video stops dancing and play again seeks to the beginning', async () => {
  const app = finale();
  try {
    const player = await ready(app);
    player.emit('onStateChange', 1); player.emit('onStateChange', 0);
    assert.equal(app.playback.at(-1), false);
    assert.equal(app.find('[data-finale-play]').textContent, 'Play again');
    assert.equal(app.find('[data-finale-status]').textContent, 'Thanks for the dance.');
    app.find('[data-finale-play]').click();
    assert.deepEqual(player.calls.slice(-2), [['seek', 0], 'play']);
    assert.equal(app.playback.at(-1), false, 'Restarting the player still waits for confirmed playback.');
  } finally { app.controller.dispose(); }
});

test('disposal cancels a pending load and removes controller-owned event handlers', async () => {
  const app = finale();
  app.update();
  const sound = app.find('[data-finale-sound]');
  app.controller.dispose();
  const notifications = app.playback.length;
  await app.resolveAPI();
  app.update(); sound.click();
  assert.equal(app.players.length, 0);
  assert.equal(app.playback.length, notifications);
  assert.equal(app.container.children.length, 0);
  assert.deepEqual(app.actions, []);
});


test('the dance clock reads confirmed video position and follows buffering, replay, and exit', async () => {
  const app = finale();
  try {
    assert.equal(app.controller.getPlaybackTime(), null);
    const player = await ready(app);
    player.currentTime = 12.34;
    assert.equal(app.controller.getPlaybackTime(), null, 'Readiness alone must not start the dance clock.');
    player.emit('onStateChange', 1);
    assert.equal(app.controller.getPlaybackTime(), 12.34);
    player.emit('onStateChange', 3);
    assert.equal(app.controller.getPlaybackTime(), null, 'Buffering must not advance the animation.');
    player.emit('onStateChange', 0); app.find('[data-finale-play]').click();
    assert.equal(app.controller.getPlaybackTime(), null, 'Seek requests still need confirmed playback.');
    player.currentTime = .02; player.emit('onStateChange', 1);
    assert.equal(app.controller.getPlaybackTime(), .02);
    for (const invalid of [undefined, NaN, -1]) {
      player.currentTime = invalid;
      assert.equal(app.controller.getPlaybackTime(), null);
    }
    player.currentTime = 1; app.view.overlay = 'admin'; app.update();
    assert.equal(app.controller.getPlaybackTime(), null);
    app.controller.dispose();
    assert.equal(app.controller.getPlaybackTime(), null);
  } finally { app.controller.dispose(); }
});
