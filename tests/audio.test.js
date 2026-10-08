import test from 'node:test';
import assert from 'node:assert/strict';
import { createAudio } from '../src/audio.js';
import { createGame, startGame, finishConversation, setLanguage } from '../src/game.js';

class Param {
  value = 0;
  events = [];
  setValueAtTime(value, time) { this.events.push(['value', value, time]); }
  linearRampToValueAtTime(value, time) { this.events.push(['linear', value, time]); }
  exponentialRampToValueAtTime(value, time) { this.events.push(['exponential', value, time]); }
  setTargetAtTime(value, time, decay) { this.events.push(['target', value, time, decay]); }
  cancelScheduledValues(time) { this.events.push(['cancel', time]); }
}
class Node {
  connections = [];
  disconnected = false;
  connect(node) { this.connections.push(node); }
  disconnect() { this.disconnected = true; }
}
class Oscillator extends Node {
  frequency = new Param();
  detune = new Param();
  type = 'sine';
  setPeriodicWave(wave) { this.wave = wave; }
  start(time) { this.startTime = time; }
  stop(time) { this.stopTime = time; }
}
class FakeContext {
  currentTime = 0;
  state = 'suspended';
  destination = new Node();
  nodes = [];
  closeCount = 0;
  constructor() { FakeContext.latest = this; }
  createGain() { const node = new Node(); node.gain = new Param(); this.nodes.push(node); return node; }
  createOscillator() { const node = new Oscillator(); this.nodes.push(node); return node; }
  createBiquadFilter() { const node = new Node(); node.frequency = new Param(); node.Q = new Param(); this.nodes.push(node); return node; }
  createPeriodicWave(real, imaginary) { return { real, imaginary }; }
  async resume() { this.state = 'running'; }
  async close() { this.state = 'closed'; this.closeCount++; }
  advance(time) {
    this.currentTime = time;
    for (const source of this.sources()) {
      if (!source.ended && source.stopTime <= time) { source.ended = true; source.onended?.(); }
    }
  }
  sources() { return this.nodes.filter((node) => node instanceof Oscillator); }
  active() { return this.sources().filter((source) => !source.ended); }
}
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
const gameState = () => ({ holdProgress: 0, phase: 'playing' });

async function withAudio(run, Context = FakeContext) {
  const previous = globalThis.window;
  globalThis.window = { AudioContext: Context };
  const audio = createAudio();
  try {
    audio.setPaused(false);
    assert.equal(await audio.setEnabled(true), true);
    await run(audio, FakeContext.latest);
  } finally {
    audio.dispose();
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
}

test('the original melody has a recurring motif over a three-beat bass-and-chord loop', async () => {
  // Rejects replacing the melody with isolated ambience or a one-note loop.
  await withAudio(async (audio, context) => {
    const game = gameState();
    for (let frame = 0; frame < 32 * 60; frame++) {
      context.advance(frame / 60);
      audio.tick(game, 1 / 60);
    }
    const lead = context.sources().filter((source) => source.wave && source.wave.imaginary.length === 6);
    assert.ok(lead.length > 45, 'A full melodic phrase must actually be scheduled.');
    assert.deepEqual(lead.slice(0, 4).map((source) => source.frequency.value), [67, 69, 71, 74].map(hz));
    const repeats = lead.filter((source) => Math.abs(source.startTime - (0.025 + 48 * 60 / 92)) < 0.001);
    assert.equal(repeats.length, 1, 'The 16 measures must return to the opening at the loop boundary.');
    assert.equal(repeats[0].frequency.value, hz(67));
    const firstBar = context.sources().filter((source) => source.startTime < 0.025 + 3 * 60 / 92);
    const bass = firstBar.filter((source) => source.type === 'sine' && !source.wave);
    assert.deepEqual(bass.map((source) => source.frequency.value), [hz(43)]);
    const plucks = firstBar.filter((source) => source.type === 'triangle');
    assert.equal(plucks.length, 6, 'Three soft chord notes belong on each of beats 2 and 3.');
    assert.deepEqual([...new Set(plucks.map((source) => source.startTime))], [0.025 + 60 / 92, 0.025 + 2 * 60 / 92]);
  });
});

test('singing sustains a distinct vowel layer and release cancels every singer source', async () => {
  await withAudio(async (audio, context) => {
    const game = gameState();
    audio.tick(game, 0);
    const before = context.sources().length;
    game.holdProgress = 0.025;
    audio.tick(game, 1 / 60);
    const singers = context.sources().slice(before);
    assert.equal(singers.length, 4, 'Two vowel voices, octave shimmer, and vibrato must start.');
    assert.equal(context.nodes.filter((node) => node.type === 'bandpass').length, 2);
    const music = context.nodes[1];
    assert.equal(music.gain.events.at(-1)[1], 0.38, 'The accompaniment lowers during the song.');
    context.advance(0.2);
    game.holdProgress = 0.6;
    audio.tick(game, 1 / 60);
    assert.equal(context.sources().length, before + 4, 'Pitch changes must reuse sustained voices.');
    assert.equal(singers[0].frequency.events.at(-1)[1], hz(71));
    game.holdProgress = 0;
    audio.tick(game, 1 / 60);
    singers.forEach((source) => assert.ok(source.stopTime <= context.currentTime + 0.041, 'Released singing must stop within its short fade.'));
    context.advance(0.25);
    singers.forEach((source) => assert.equal(source.disconnected, true));
    assert.equal(music.gain.events.at(-1)[1], 1);
  });
});

for (const interrupt of ['pause', 'mute']) {
  test(`${interrupt} cancels active and future notes and resumes with fresh music`, async () => {
    await withAudio(async (audio, context) => {
      const game = gameState();
      game.holdProgress = 0.3;
      audio.tick(game, 0);
      audio.collect('fairy');
      const old = context.active();
      assert.ok(old.some((source) => source.startTime > context.currentTime + 0.1), 'The fixture must include future scheduled sound.');
      if (interrupt === 'pause') audio.setPaused(true);
      else assert.equal(await audio.setEnabled(false), false);
      old.forEach((source) => assert.ok(source.stopTime <= 0.041, 'An interruption must cancel queued notes as well as the current song.'));
      context.advance(1);
      old.forEach((source) => assert.equal(source.disconnected, true));
      const count = context.sources().length;
      audio.tick(game, 1 / 60);
      audio.collect('potato');
      assert.equal(context.sources().length, count);
      if (interrupt === 'pause') audio.setPaused(false);
      else assert.equal(await audio.setEnabled(true), true);
      game.holdProgress = 0;
      audio.tick(game, 1 / 60);
      assert.ok(context.sources().length > count, 'An explicitly resumed game must make fresh sound.');
      assert.ok(context.sources().slice(count).every((source) => source.startTime >= 1));
    });
  });
}

test('finish retires the loop once, replay starts fresh, and disposal blocks future work', async () => {
  await withAudio(async (audio, context) => {
    const game = gameState();
    game.holdProgress = 0.2;
    audio.tick(game, 0);
    const before = context.sources().length;
    audio.finish();
    context.sources().slice(0, before).forEach((source) => assert.ok(source.stopTime <= 0.041));
    assert.equal(context.sources().length, before + 4);
    audio.finish();
    audio.tick(game, 0);
    assert.equal(context.sources().length, before + 4, 'Repeated finish must not stack more cadences or restart the loop.');
    const ending = context.sources().slice(before);
    audio.tick(gameState(), 0);
    ending.forEach((source) => assert.ok(source.stopTime <= 0.041, 'Replay must retire the old ending.'));
    const count = context.sources().length;
    assert.ok(count > before + 4);
    audio.dispose();
    assert.equal(context.closeCount, 1);
    assert.ok(context.nodes.every((node) => node.disconnected || node === context.nodes[0] || node === context.nodes[1]));
    assert.equal(await audio.setEnabled(true), false);
    audio.tick(gameState(), 0);
    audio.collect('fairy');
    audio.finish();
    assert.equal(context.sources().length, count);
    audio.dispose();
    assert.equal(context.closeCount, 1);
  });
});

test('a delayed frame skips the backlog and repeated effects have a fixed voice ceiling', async () => {
  await withAudio(async (audio, context) => {
    const game = gameState();
    let peak = 0;
    for (let frame = 0; frame < 600; frame++) {
      context.advance(frame / 60);
      audio.tick(game, 1 / 60);
      peak = Math.max(peak, context.active().length);
    }
    assert.ok(peak >= 6 && peak < 24, 'The real loop must be exercised and finished voices reclaimed.');
    const before = context.sources().length;
    context.advance(3600);
    audio.tick(game, 3600);
    assert.ok(context.sources().length - before <= 4, 'A long delay must not schedule a backlog of missed notes.');
    assert.ok(context.active().every((source) => source.startTime >= 3600));
    for (let attempt = 0; attempt < 100; attempt++) audio.collect('fairy');
    assert.ok(context.active().length >= 60 && context.active().length <= 64, 'Even repeated effects must remain bounded.');
  });
});

test('an unresolved enable returns off immediately, and a late resume cannot override mute or disposal', async () => {
  for (const interrupt of ['mute', 'dispose']) {
    const previous = globalThis.window;
    let release;
    class PendingContext extends FakeContext {
      resume() { return new Promise((resolve) => { release = () => { this.state = 'running'; this.onstatechange?.(); resolve(); }; }); }
    }
    globalThis.window = { AudioContext: PendingContext };
    const audio = createAudio();
    try {
      audio.setPaused(false);
      const enabling = audio.setEnabled(true);
      assert.equal(enabling, false, 'A blocked browser resume must not leave a pending UI operation or claim sound is on.');
      if (interrupt === 'mute') await audio.setEnabled(false);
      else audio.dispose();
      release();
      await Promise.resolve();
      audio.tick(gameState(), 0);
      assert.equal(FakeContext.latest.sources().length, 0);
    } finally {
      audio.dispose();
      if (previous === undefined) delete globalThis.window;
      else globalThis.window = previous;
    }
  }
});

test('a delayed browser enable updates actual sound state and remains retryable after rejection', async () => {
  const previous = globalThis.window;
  let release;
  class PendingContext extends FakeContext {
    resume() { return new Promise((resolve) => { release = () => { this.state = 'running'; this.onstatechange?.(); resolve(); }; }); }
  }
  globalThis.window = { AudioContext: PendingContext };
  const changes = [];
  const audio = createAudio((enabled) => changes.push(enabled));
  try {
    const game = createGame();
    audio.setPaused(false);
    assert.equal(audio.setEnabled(true), false);
    audio.tick(game);
    assert.equal(FakeContext.latest.sources().length, 0, 'A suspended clock must remain silent.');
    release();
    await Promise.resolve();
    assert.deepEqual(changes, [true], 'The control must learn when a delayed browser enable actually succeeds.');
    audio.tick(game);
    assert.ok(FakeContext.latest.sources().some((source) => source.wave?.imaginary.length === 9), 'The delayed request must start the title score.');
    audio.setEnabled(false);
    FakeContext.latest.state = 'suspended';
    FakeContext.latest.resume = () => Promise.reject(new Error('Permission denied'));
    assert.equal(audio.setEnabled(true), false);
    await new Promise((resolve) => setImmediate(resolve));
    assert.deepEqual(changes, [true, false]);
    audio.tick(game);
    const count = FakeContext.latest.sources().length;
    FakeContext.latest.resume = async function () { this.state = 'running'; };
    assert.equal(audio.setEnabled(true), true, 'A failed attempt must not leave sound permanently busy.');
    audio.tick(game);
    assert.ok(FakeContext.latest.sources().length > count);
    FakeContext.latest.state = 'suspended';
    FakeContext.latest.onstatechange();
    assert.deepEqual(changes, [true, false, true, false], 'A suspended browser context must not keep advertising sound on.');
  } finally {
    audio.dispose();
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
});

test('the title has a distinct 32-measure theme with development, warm layers, and a modest level', async () => {
  // Rejects using a walking/animal score or repeating a short opening to fill time.
  await withAudio(async (audio, context) => {
    const game = createGame();
    const beat = 60 / 78;
    const duration = 96 * beat;
    let peak = 0;
    for (let frame = 0; frame <= Math.ceil((duration + .15) * 60); frame++) {
      context.advance(frame / 60);
      audio.tick(game);
      peak = Math.max(peak, context.active().length);
    }
    const lead = context.sources().filter((source) => source.wave?.imaginary.length === 9);
    assert.deepEqual(lead.slice(0, 6).map(midiOf), [74, 69, 71, 67, 76, 74], 'The title needs its own opening, apart from the walking and animal motifs.');
    const firstLoop = lead.filter((source) => source.startTime < duration + .024);
    assert.ok(firstLoop.length >= 90, 'The full title must schedule a developed melody.');
    const measures = Array.from({ length: 32 }, (_, measure) => firstLoop.filter((source) => Math.floor((source.startTime - .024) / (3 * beat)) === measure).map(midiOf));
    assert.ok(measures.every((notes) => notes.length > 0), 'Every title measure needs a melody.');
    const phrases = Array.from({ length: 8 }, (_, phrase) => JSON.stringify(measures.slice(phrase * 4, phrase * 4 + 4)));
    assert.ok(new Set(phrases).size >= 7, 'The theme must develop beyond a short repeating phrase.');
    assert.ok(new Set(firstLoop.map(midiOf)).size >= 9);
    assert.equal(midiOf(firstLoop.at(-1)), 67, 'The final phrase must resolve to G.');
    const repeat = lead.find((source) => Math.abs(source.startTime - (duration + .025)) < .001);
    assert.ok(repeat, 'The full title returns after exactly 32 measures.');
    assert.equal(midiOf(repeat), 74);
    const sources = context.sources().filter((source) => source.startTime < duration + .024);
    const pads = sources.filter((source) => source.wave?.imaginary.length === 10);
    assert.equal(pads.length, 192, 'Each measure needs three gently detuned pairs of string voices.');
    assert.deepEqual([...new Set(pads.map((source) => source.detune.value))].sort((a, b) => a - b), [-4, 4]);
    assert.equal(sources.filter((source) => source.wave?.imaginary.length === 8).length, 64, 'The title needs an independent two-note counterline throughout.');
    assert.equal(lead[0].connections[0].gain.events.find((event) => event[0] === 'linear')[1], .065 * .72, 'The title lead stays below the gameplay level.');
    assert.ok(peak >= 10 && peak < 40, 'The layered title must run and reclaim completed voices.');
  });
});

test('Start retires all title voices on the same game and switches cleanly to walking', async () => {
  // Rejects score selection that follows only object identity and misses phase changes.
  await withAudio(async (audio, context) => {
    const game = createGame();
    audio.tick(game);
    const old = context.active();
    assert.ok(old.some((source) => source.wave?.imaginary.length === 9));
    const beforeLanguage = context.sources().length;
    const oldStops = old.map((source) => source.stopTime);
    setLanguage(game, 'en');
    audio.tick(game);
    assert.equal(context.sources().length, beforeLanguage);
    assert.deepEqual(old.map((source) => source.stopTime), oldStops, 'Language changes must keep the title phrase intact.');
    context.advance(.1);
    startGame(game);
    audio.tick(game);
    old.forEach((source) => assert.ok(source.stopTime <= .141, 'Start must fade out every title voice, including both string sources.'));
    assert.equal(midiOf(context.sources().slice(beforeLanguage).find((source) => source.wave?.imaginary.length === 6)), 67);
    assert.equal(context.sources().slice(beforeLanguage).some((source) => source.wave?.imaginary.length === 9), false, 'Gameplay must not keep scheduling the title lead.');
  });
});

test('title pause, mute, Start, and replay preserve silence until sound is explicitly enabled', async () => {
  await withAudio(async (audio, context) => {
    const game = createGame();
    audio.tick(game);
    const old = context.active();
    audio.setPaused(true);
    old.forEach((source) => assert.ok(source.stopTime <= .041));
    context.advance(25);
    const paused = context.sources().length;
    audio.tick(game);
    assert.equal(context.sources().length, paused);
    audio.setPaused(false);
    audio.tick(game);
    assert.ok(context.sources().length > paused);
    assert.equal(midiOf(context.sources().slice(paused).find((source) => source.wave?.imaginary.length === 9)), 74);
    const title = context.active();
    assert.equal(audio.setEnabled(false), false);
    title.forEach((source) => assert.ok(source.stopTime <= 25.041));
    context.advance(26);
    const muted = context.sources().length;
    startGame(game);
    audio.tick(game);
    const replay = startGame(createGame());
    audio.tick(replay);
    assert.equal(context.sources().length, muted, 'Start and a fresh replay must preserve an explicit mute.');
    assert.equal(audio.setEnabled(true), true);
    audio.tick(replay);
    assert.equal(midiOf(context.sources().slice(muted).find((source) => source.wave?.imaginary.length === 6)), 67);
  });
});

const animalThemes = [
  { id: 'fox', tempo: 108, opening: [74, 78, 76, 74, 69], tonic: 74 },
  { id: 'owl', tempo: 72, opening: [71, 67, 64], tonic: 64 },
  { id: 'deer', tempo: 84, opening: [67, 71, 74, 79], tonic: 67 },
];
const leadNotes = (context) => context.sources().filter((source) => source.wave?.imaginary.length === 6);
const midiOf = (source) => Math.round(69 + 12 * Math.log2(source.frequency.value / 440));

for (const theme of animalThemes) {
  test(`${theme.id} has its own complete 24-measure theme with harmonic and melodic development`, async () => {
    // Rejects routing every creature to walking music or padding one short motif.
    await withAudio(async (audio, context) => {
      const game = { ...gameState(), conversation: theme.id };
      const beat = 60 / theme.tempo;
      const duration = 72 * beat;
      let peak = 0;
      for (let frame = 0; frame <= Math.ceil((duration + .15) * 60); frame++) {
        context.advance(frame / 60);
        audio.tick(game, 1 / 60);
        peak = Math.max(peak, context.active().length);
      }
      const lead = leadNotes(context);
      assert.deepEqual(lead.slice(0, theme.opening.length).map(midiOf), theme.opening, 'Each animal must have its own opening melody.');
      const firstLoop = lead.filter((source) => source.startTime < duration + .024);
      assert.ok(firstLoop.length >= 55, 'The theme must contain a developed melody.');
      const measures = Array.from({ length: 24 }, (_, measure) => firstLoop.filter((source) => Math.floor((source.startTime - .024) / (3 * beat)) === measure).map(midiOf));
      assert.ok(measures.every((notes) => notes.length > 0), 'All 24 measures must contain melody.');
      const phrases = Array.from({ length: 6 }, (_, phrase) => JSON.stringify(measures.slice(phrase * 4, phrase * 4 + 4)));
      assert.ok(new Set(phrases).size >= 5, 'The middle phrases must develop beyond a repeated four-measure loop.');
      assert.ok(new Set(firstLoop.map(midiOf)).size >= 8, 'The melody must explore its scale.');
      assert.equal(midiOf(firstLoop.at(-1)), theme.tonic, 'The final phrase must resolve to the home note.');
      const repeat = lead.find((source) => Math.abs(source.startTime - (duration + .025)) < .001);
      assert.ok(repeat, 'The loop must return after exactly 24 measures.');
      assert.equal(midiOf(repeat), theme.opening[0]);
      const sources = context.sources().filter((source) => source.startTime < duration + .024);
      assert.equal(sources.filter((source) => source.wave?.imaginary.length === 8).length, 48, 'Each measure needs an independent two-note counterline.');
      assert.equal(sources.filter((source) => source.type === 'triangle').length, 144, 'The full arrangement needs six plucked notes per measure.');
      const bass = sources.filter((source) => source.connections[0].gain.events.some((event) => event[0] === 'linear' && event[1] === .085));
      assert.equal(bass.length, 48);
      assert.ok(new Set(bass.map(midiOf)).size >= 6, 'The harmony must move through several chords.');
      assert.ok(peak >= 7 && peak < 32, 'The richer arrangement must play, while completed voices are reclaimed.');
    });
  });
}

test('dialogue entry, animal changes, and exit retire the previous score without restarting for locale changes', async () => {
  await withAudio(async (audio, context) => {
    const game = createGame();
    startGame(game);
    audio.tick(game, 0);
    let old = context.active();
    for (const theme of animalThemes) {
      context.advance(context.currentTime + .1);
      game.conversation = theme.id;
      const count = context.sources().length;
      audio.tick(game, 1 / 60);
      old.forEach((source) => assert.ok(source.stopTime <= context.currentTime + .041, 'Changing the conversation must retire all earlier scheduled sound.'));
      const opening = context.sources().slice(count).find((source) => source.wave?.imaginary.length === 6);
      assert.equal(midiOf(opening), theme.opening[0]);
      const sameSources = context.active().map((source) => ({ source, stopTime: source.stopTime }));
      const beforeLocale = context.sources().length;
      setLanguage(game, 'en');
      audio.tick(game, 0);
      assert.equal(context.sources().length, beforeLocale, 'Changing language must keep the current score and notes.');
      sameSources.forEach(({ source, stopTime }) => assert.equal(source.stopTime, stopTime, 'Changing language must not cancel or shorten notes.'));
      old = context.active().filter((source) => source.stopTime > context.currentTime + .041);
    }
    finishConversation(game);
    const count = context.sources().length;
    audio.tick(game, 0);
    old.forEach((source) => assert.ok(source.stopTime <= context.currentTime + .041));
    assert.equal(midiOf(context.sources().slice(count).find((source) => source.wave?.imaginary.length === 6)), 67, 'Leaving dialogue must restore the walking melody.');
    game.conversation = 'fox';
    audio.tick(game, 0);
    const animalNotes = context.active();
    audio.tick(gameState(), 0);
    animalNotes.forEach((source) => assert.ok(source.stopTime <= context.currentTime + .041, 'Replay must retire the animal theme.'));
  });
});

test('all animal themes cancel for menus and mute, and recover without a missed-note backlog', async () => {
  for (const theme of animalThemes) {
    await withAudio(async (audio, context) => {
      const game = { ...gameState(), conversation: theme.id };
      audio.tick(game, 0);
      const old = context.active();
      audio.setPaused(true);
      old.forEach((source) => assert.ok(source.stopTime <= .041));
      context.advance(50);
      const count = context.sources().length;
      audio.tick(game, 50);
      assert.equal(context.sources().length, count);
      audio.setPaused(false);
      audio.tick(game, 0);
      assert.ok(context.sources().length > count && context.sources().length - count <= 8);
      const resumed = context.active();
      await audio.setEnabled(false);
      resumed.forEach((source) => assert.ok(source.stopTime <= 50.041));
      context.advance(100);
      const muted = context.sources().length;
      audio.tick(game, 50);
      assert.equal(context.sources().length, muted);
      await audio.setEnabled(true);
      audio.tick(game, 0);
      assert.ok(context.sources().length > muted && context.sources().length - muted <= 8);
      context.advance(3600);
      const delayed = context.sources().length;
      audio.tick(game, 3500);
      assert.ok(context.sources().length > delayed && context.sources().length - delayed <= 8, 'The detailed score must also skip a delayed backlog.');
    });
  }
});
