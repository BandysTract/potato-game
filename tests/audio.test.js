import test from 'node:test';
import { readFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { createAudio } from '../src/audio.js';
import { createGame, startGame, finishConversation, setLanguage, step, cancelSong } from '../src/game.js';
import { arrange, SCORES, ANIMAL_SCORES, scoreFor } from '../src/music.js';
import { songPhrase, TUNES, performanceDuration } from '../src/songs.js';
import { FAIRIES, regionAt } from '../src/data.js';

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
class ScheduledSource extends Node {
  start(time, offset) { this.startTime = time; this.startOffset = offset; }
  stop(time) { this.stopTime = time; }
}
class Oscillator extends ScheduledSource {
  frequency = new Param();
  detune = new Param();
  type = 'sine';
  setPeriodicWave(wave) { this.wave = wave; }
}
class BufferSource extends ScheduledSource { playbackRate = new Param(); }
class FakeContext {
  currentTime = 0;
  sampleRate = 24000;
  state = 'suspended';
  destination = new Node();
  nodes = [];
  closeCount = 0;
  constructor() { FakeContext.latest = this; }
  createGain() { const node = new Node(); node.gain = new Param(); this.nodes.push(node); return node; }
  createOscillator() { const node = new Oscillator(); this.nodes.push(node); return node; }
  createBufferSource() { const node = new BufferSource(); this.nodes.push(node); return node; }
  createBuffer(channels, length, sampleRate) {
    const data = Array.from({ length: channels }, () => new Float32Array(length));
    return { length, sampleRate, getChannelData: (channel) => data[channel] };
  }
  createBiquadFilter() { const node = new Node(); node.frequency = new Param(); node.Q = new Param(); this.nodes.push(node); return node; }
  createStereoPanner() { const node = new Node(); node.pan = new Param(); this.nodes.push(node); return node; }
  createConvolver() { const node = new Node(); node.type = 'convolver'; this.nodes.push(node); return node; }
  createPeriodicWave(real, imaginary) { return { real, imaginary }; }
  async resume() { this.state = 'running'; }
  async close() { this.state = 'closed'; this.closeCount++; }
  advance(time) {
    this.currentTime = time;
    for (const source of this.sources()) {
      if (!source.ended && source.stopTime <= time) { source.ended = true; source.onended?.(); }
    }
  }
  sources() { return this.nodes.filter((node) => node instanceof ScheduledSource); }
  active() { return this.sources().filter((source) => !source.ended); }
}
const hz = (midi) => 440 * 2 ** ((midi - 69) / 12);
const gameState = () => startGame(createGame('en'));
const midiOf = source => Math.round(69 + 12 * Math.log2(source.frequency.value / 440));
const isLead = source => source.connections[0]?.gain?.events.some(([kind, value]) => kind === 'linear' && value === .16);
async function withAudio(run, Context = FakeContext, onStatus = () => {}) {
  const previous = globalThis.window;
  globalThis.window = { AudioContext: Context };
  const audio = createAudio(() => {}, onStatus);
  try {
    audio.setPaused(false);
    assert.equal(audio.setEnabled(true), true);
    await run(audio, FakeContext.latest);
  } finally {
    audio.dispose();
    if (previous === undefined) delete globalThis.window;
    else globalThis.window = previous;
  }
}

const openings = { growth: [72, 72, 72, 72, 74, 76, 77, 76, 74, 72], woodland: [60, 64, 67, 67, 72, 72, 67, 67, 65, 65, 62, 62, 60, 64, 67], rain: [79, 79, 81, 79, 79, 79, 81, 79] };
test('instrument placement and release retain the score timing', async () => {
  await withAudio(async (audio, context) => {
    const game = gameState(); game.player = { x: 0, z: -30 }; audio.tick(game);
    const lead = context.sources().find(isLead);
    assert.ok(lead);
    assert.equal(lead.startTime, .025);
    assert.ok(lead.stopTime > lead.startTime + SCORES.growth.events.find(event => event.melody).beats * SCORES.growth.beat + .05);
    const panners = context.nodes.filter(node => node.pan);
    assert.ok(panners.some(node => node.pan.value < 0));
    assert.ok(panners.some(node => node.pan.value > 0));
  });
});

test('room sound is cleared on pause and does not accumulate on repeated pause calls', async () => {
  await withAudio(async (audio, context) => {
    audio.tick(gameState());
    const before = context.nodes.filter(node => node.type === 'convolver');
    assert.ok(before.length > 0);
    audio.setPaused(true);
    assert.ok(before.every(node => node.disconnected));
    const count = context.nodes.length;
    for (let i = 0; i < 30; i++) audio.setPaused(true);
    assert.equal(context.nodes.length, count);
    audio.dispose();
    assert.ok(context.nodes.filter(node => node.type === 'convolver').every(node => node.disconnected));
  });
});
test('a suspended audio clock does not rebuild the room on game frames', async () => {
  await withAudio(async (audio, context) => {
    const game = gameState(); audio.tick(game);
    context.state = 'suspended'; context.onstatechange();
    assert.ok(context.active().length > 0, 'cancelled sources await the frozen audio clock');
    const count = context.nodes.length;
    for (let i = 0; i < 600; i++) audio.tick(game);
    assert.equal(context.currentTime, 0);
    assert.equal(context.nodes.length, count);
    context.state = 'running'; context.onstatechange(); context.advance(.1);
    audio.tick(game);
    assert.ok(context.active().length > 0);
    assert.ok(context.active().every(source => source.startTime >= .1));
    audio.dispose();
    assert.ok(context.nodes.filter(node => node.type === 'convolver').every(node => node.disconnected));
  });
});
for (const [id, position] of [['growth', { x: 0, z: -30 }], ['woodland', { x: 0, z: 0 }], ['rain', { x: 24, z: -10 }]]) {
  test(`${id} plays its transcribed opening, full melody, and exact loop duration`, async () => {
    await withAudio(async (audio, context) => {
      const game = gameState(); game.player = position;
      const score = SCORES[id], duration = score.beats * score.beat;
      for (let frame = 0; frame <= Math.ceil((duration + .05) * 60); frame++) { context.advance(frame / 60); audio.tick(game); }
      const lead = context.sources().filter(isLead);
      assert.deepEqual(lead.slice(0, openings[id].length).map(midiOf), openings[id]);
      const sourceNotes = TUNES[id].measures.flatMap(([, notes]) => notes).filter(([note]) => note !== null);
      assert.equal(lead.filter(source => source.startTime < duration + .024).length, sourceNotes.length);
      assert.equal(lead.filter(source => Math.abs(source.startTime - duration - .025) < .001).length, 1, 'Loop repeats once at its musical boundary.');
      assert.ok(context.active().length < 32);
    });
  });
}

test('meter, rests, and a short pickup retain their own timing', () => {
  assert.equal(SCORES.growth.beats, 42);
  assert.equal(SCORES.woodland.beats, 48);
  assert.equal(SCORES.rain.beats, 16);
  const score = arrange({ tempo: 100, meter: [3, 4], measures: [['C', [[67, .5]]], ['C', [[60, 1], [null, 1], [64, 1]]]] });
  assert.equal(score.beats, 3.5, 'A pickup must not become a full bar.');
  assert.deepEqual(score.events.filter(e => e.melody).map(e => [e.at, e.note]), [[0, 67], [.5, 60], [2.5, 64]]);
  assert.deepEqual(score.boundaries, [0, .5, 3.5]);
});

test('animal themes remain distinct and use the same ensemble', () => {
  assert.equal(new Set(Object.values(ANIMAL_SCORES).map(s => JSON.stringify(s.events.filter(e => e.melody).slice(0, 6)))).size, 4);
  for (const score of Object.values(ANIMAL_SCORES)) {
    assert.equal(score.beats, 72);
    assert.ok(score.events.every(e => ['violin', 'clarinet', 'bass', 'tambourine'].includes(e.part)));
  }
});

for (const fairy of FAIRIES) {
  test(`${fairy.id} schedules a fairy vocal call and Hana’s humming response from the shared melody`, async () => {
    await withAudio(async (audio, context) => {
      const game = gameState(); Object.assign(game.player, fairy);
      step(game, { interact: true }, .01); audio.tick(game);
      const performance = game.activeSong;
      const phrase = songPhrase(performance.songId);
      const folds = context.sources().filter(source => source.wave?.imaginary.length === 33);
      assert.equal(folds.length, 2, 'Both the fairy call and Hana response use vocal synthesis.');
      const [fairyVoice, voice] = folds;
      assert.ok(Math.abs(fairyVoice.startTime - .025) < .001);
      assert.deepEqual(fairyVoice.frequency.events.filter(([kind]) => kind === 'target').map(([, value]) => Math.round(69 + 12 * Math.log2(value / 440))), phrase.notes.filter(n => n.note !== null).map(n => n.note));
      assert.ok(Math.abs(voice.startTime - phrase.duration - .025) < .001, 'The fairy calls before Hana answers.');
      const pitches = voice.frequency.events.filter(([kind]) => kind === 'target').map(([, value]) => Math.round(69 + 12 * Math.log2(value / 440)));
      assert.deepEqual(pitches, phrase.notes.filter(n => n.note !== null).map(n => n.note));
      const breath = context.sources().find(source => source instanceof BufferSource);
      assert.equal(breath.loop, true);
      assert.equal(breath.buffer.length, context.sampleRate * 2);
      assert.equal(context.nodes.filter(node => node.type === 'bandpass' && node.Q.value > 1).length, 8);
      const fairyMouth = fairyVoice.connections[0].connections.map(node => node.frequency.value);
      const hanaMouth = voice.connections[0].connections.map(node => node.frequency.value);
      assert.notDeepEqual(fairyMouth, hanaMouth, 'The fairy has a distinct open-vowel voice.');
      assert.equal(context.nodes[1].gain.events.at(-1)[1], .05);
      // Audio and game clocks run independently. The half-second stall must not
      // stretch already scheduled notes, create another singer, or duplicate rewards.
      const planned = structuredClone(voice.frequency.events);
      let wall = 0;
      for (let i = 0; game.activeSong && i < 1500; i++) {
        const elapsed = i === 100 ? .5 : 1 / 60;
        wall += elapsed; context.advance(wall); step(game, {}, elapsed); audio.tick(game);
      }
      assert.deepEqual(voice.frequency.events, planned);
      assert.equal(context.sources().filter(source => source.wave?.imaginary.length === 33).length, 2);
      assert.ok(wall >= performance.duration && wall < performance.duration + .02);
      assert.deepEqual(game.tears, [fairy.id]);
      context.advance(wall + .1);
      assert.equal(voice.disconnected, true);
      assert.equal(breath.disconnected, true);
    });
  });
}

for (const interrupt of ['movement', 'cancel', 'pause', 'mute', 'restart']) {
  test(`${interrupt} cancels queued call, vocal folds, breath, and vibrato`, async () => {
    await withAudio(async (audio, context) => {
      let game = gameState(); Object.assign(game.player, FAIRIES[0]);
      step(game, { interact: true }, .01); audio.tick(game); audio.collect('fairy');
      const old = context.active();
      assert.ok(old.some(source => source.startTime > 5), 'A future response must be present.');
      context.advance(.2);
      if (interrupt === 'movement') step(game, { x: 1 }, .02);
      if (interrupt === 'cancel') cancelSong(game);
      if (interrupt === 'pause') audio.setPaused(true);
      if (interrupt === 'mute') audio.setEnabled(false);
      if (interrupt === 'restart') game = gameState();
      audio.tick(game);
      const singing = old.filter(source => source.wave?.imaginary.length === 33 || source instanceof BufferSource || source.startTime > 5);
      singing.forEach(source => assert.ok(source.stopTime <= .241));
      context.advance(.25);
      singing.forEach(source => assert.equal(source.disconnected, true));
      if (interrupt !== 'restart') assert.equal(game.tears.length, 0);
    });
  });
}

test('theme changes wait for a measure boundary and language changes preserve the phrase', async () => {
  await withAudio(async (audio, context) => {
    const game = createGame(); audio.tick(game);
    const initial = context.sources().length;
    setLanguage(game, 'en'); audio.tick(game); assert.equal(context.sources().length, initial);
    startGame(game); game.player = { x: 0, z: 0 };
    context.advance(.2); audio.tick(game);
    for (let f = 13; f < 150; f++) { context.advance(f / 60); audio.tick(game); }
    const boundary = 3 * 60 / 96 + .025;
    const titleNotes = context.sources().filter(source => isLead(source) && source.startTime < boundary - .001);
    assert.deepEqual(titleNotes.map(midiOf), [60, 60, 60]);
    const firstForest = context.sources().find(source => isLead(source) && source.startTime >= boundary - .001);
    assert.ok(firstForest);
    assert.ok(Math.abs(firstForest.startTime - (3 * 60 / 96 + .025)) < .001);
    assert.equal(midiOf(firstForest), 60);
  });
});

test('a long stall skips the backlog and effects respect the voice ceiling', async () => {
  await withAudio(async (audio, context) => {
    const game = gameState(); audio.tick(game);
    context.advance(3600);
    const before = context.sources().length; audio.tick(game);
    assert.ok(context.sources().length - before < 16);
    assert.ok(context.active().every(source => source.startTime >= 3600));
    for (let i = 0; i < 100; i++) audio.collect('fairy');
    assert.ok(context.active().length <= 64 && context.active().length >= 60);
  });
});

test('finish is idempotent, replay starts fresh, and disposal blocks pending work', async () => {
  await withAudio(async (audio, context) => {
    const game = gameState(); audio.tick(game);
    audio.finish(); const count = context.sources().length;
    audio.finish(); audio.tick(game); assert.equal(context.sources().length, count);
    audio.tick(gameState()); assert.ok(context.sources().length > count);
    audio.dispose(); assert.equal(context.closeCount, 1);
    const end = context.sources().length;
    assert.equal(audio.setEnabled(true), false); audio.tick(game); audio.collect('fairy'); audio.finish();
    assert.equal(context.sources().length, end);
    audio.dispose(); assert.equal(context.closeCount, 1);
    assert.ok(context.nodes.every(node => node.disconnected || node === context.nodes[0] || node === context.nodes[1]));
  });
});

test('delayed browser resume cannot override mute or disposal and rejection remains retryable', async () => {
  for (const interrupt of ['mute', 'dispose', 'reject']) {
    const previous = globalThis.window;
    let release, reject;
    class PendingContext extends FakeContext {
      resume() { return new Promise((resolve, fail) => { release = () => { this.state = 'running'; this.onstatechange?.(); resolve(); }; reject = fail; }); }
    }
    globalThis.window = { AudioContext: PendingContext };
    const changes = [], audio = createAudio(enabled => changes.push(enabled));
    try {
      audio.setPaused(false); assert.equal(audio.setEnabled(true), false);
      if (interrupt === 'mute') audio.setEnabled(false);
      if (interrupt === 'dispose') audio.dispose();
      if (interrupt === 'reject') reject(new Error('Unavailable')); else release();
      await new Promise(resolve => setImmediate(resolve));
      audio.tick(gameState()); assert.equal(FakeContext.latest.sources().length, 0);
      if (interrupt === 'reject') {
        FakeContext.latest.resume = async function () { this.state = 'running'; };
        assert.equal(audio.setEnabled(true), true); audio.tick(gameState());
        assert.ok(FakeContext.latest.sources().length > 0);
        assert.deepEqual(changes, [true]);
      }
    } finally { audio.dispose(); globalThis.window = previous; }
  }
});

test('failed instrument loading reports synthesized fallback and preserves the tune', async () => {
  const previous = globalThis.fetch;
  const urls = [], states = [];
  globalThis.fetch = async url => { urls.push(url); return { ok: false }; };
  class DecodeContext extends FakeContext { async decodeAudioData() { throw new Error('Must not decode a failed response'); } }
  try {
    await withAudio(async (audio, context) => {
      await audio.samplesReady(); assert.equal(audio.getSampleState(), 'fallback');
      const game = createGame(); audio.tick(game);
      assert.deepEqual(context.sources().filter(isLead).map(midiOf).slice(0, 2), [60, 60]);
      assert.deepEqual(states, ['fallback']);
      assert.deepEqual(urls, ['/assets/audio/manifest.json']);
      assert.equal(game.tears.length, 0);
    }, DecodeContext, status => states.push(status));
  } finally { globalThis.fetch = previous; }
});

test('decoded samples use verified roots and tuning, and disposal drops late loads', async () => {
  const previous = globalThis.fetch;
  const sample = { instrument: 'violin', rootMidi: 60, tuneCents: -20, url: '/assets/audio/test.wav' };
  globalThis.fetch = async url => ({ ok: true, json: async () => ({ samples: [sample] }), arrayBuffer: async () => new ArrayBuffer(4) });
  class DecodeContext extends FakeContext { async decodeAudioData() { return { duration: 20 }; } }
  try {
    await withAudio(async (audio, context) => {
      await audio.samplesReady(); assert.equal(audio.getSampleState(), 'ready');
      const game = gameState(); game.player = { x: 0, z: -30 }; audio.tick(game);
      const lead = context.sources().find(isLead);
      assert.ok(lead instanceof BufferSource);
      assert.ok(Math.abs(lead.playbackRate.value - 2 ** (11.8 / 12)) < 1e-10);
    }, DecodeContext);
    let resolveDecode;
    class SlowContext extends FakeContext { decodeAudioData() { return new Promise(resolve => { resolveDecode = resolve; }); } }
    await withAudio(async audio => {
      await new Promise(resolve => setImmediate(resolve));
      audio.dispose(); resolveDecode({ duration: 20 }); await audio.samplesReady();
      assert.notEqual(audio.getSampleState(), 'ready');
    }, SlowContext);
  } finally { globalThis.fetch = previous; }
});

test('title music waits briefly for recordings and falls back when loading stays slow', async () => {
  const previous = globalThis.fetch;
  let releaseFetch;
  globalThis.fetch = () => new Promise(resolve => { releaseFetch = resolve; });
  class DecodeContext extends FakeContext { async decodeAudioData() { return { duration: 20 }; } }
  try {
    await withAudio(async (audio, context) => {
      const game = createGame(); audio.tick(game);
      assert.equal(context.sources().length, 0);
      context.advance(.5); audio.tick(game);
      assert.equal(context.sources().length, 0);
      globalThis.fetch = async () => ({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) });
      releaseFetch({ ok: true, json: async () => ({ samples: [{ instrument: 'clarinet', rootMidi: 60, tuneCents: 0, url: '/test.wav' }] }) });
      await audio.samplesReady(); audio.tick(game);
      assert.ok(context.sources().find(isLead) instanceof BufferSource);
    }, DecodeContext);
    globalThis.fetch = () => new Promise(resolve => { releaseFetch = resolve; });
    await withAudio(async (audio, context) => {
      const game = createGame(); audio.tick(game);
      context.advance(1.01); audio.tick(game);
      assert.ok(context.sources().find(isLead) instanceof Oscillator);
      releaseFetch({ ok: false }); await audio.samplesReady();
      assert.equal(audio.getSampleState(), 'fallback');
    }, DecodeContext);
  } finally { globalThis.fetch = previous; }
});

test('sample gain and attack offset reach the scheduled instrument source', async () => {
  const previous = globalThis.fetch;
  const sample = { instrument: 'violin', rootMidi: 72, tuneCents: 0, gainDb: 32.8, startOffset: .02, url: '/test.wav' };
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ samples: [sample] }), arrayBuffer: async () => new ArrayBuffer(4) });
  class DecodeContext extends FakeContext { async decodeAudioData() { return { duration: 20 }; } }
  try {
    await withAudio(async (audio, context) => {
      await audio.samplesReady();
      const game = gameState(); game.player = { x: 0, z: -30 }; audio.tick(game);
      const lead = context.sources().find(source => source instanceof BufferSource);
      assert.equal(lead.startOffset, .02);
      assert.ok(lead.connections[0].gain.events.some(([kind, value]) => kind === 'linear' && Math.abs(value - .16 * 10 ** (32.8 / 20)) < 1e-8));
    }, DecodeContext);
  } finally { globalThis.fetch = previous; }
});

test('woodland encounters and the old three-zone corner keep stable area themes', () => {
  const at = (x, z) => scoreFor({ phase: 'playing', scene: 'outdoors', player: { x, z } });
  for (const z of [-23, -25, -27]) assert.equal(at(-19, z), SCORES.woodland);
  assert.equal(at(-13, -27), SCORES.woodland);
  assert.notEqual(regionAt({ x: -13, z: -27 }), 'Mountain meadow');
  assert.equal(at(16, -27), SCORES.growth);
  for (const z of [-24.1, -24, -23.9]) assert.equal(at(17.5, z), SCORES.rain);
});
test('theme changes fade down and back up independently of singing volume', async () => {
  await withAudio(async (audio, context) => {
    const game = createGame(); audio.tick(game); startGame(game); game.player = { x: 0, z: 0 };
    for (let f = 1; f < 150; f++) { context.advance(f / 60); audio.tick(game); }
    assert.ok(context.nodes.some(node => node.gain?.events.some(([kind, value]) => kind === 'linear' && value === 0) && node.gain.events.some(([kind, value]) => kind === 'linear' && value === 1)));
  });
});

// Use the bundled vocal metadata so pitch, loops, and source selection stay linked.
const vocalSamples = JSON.parse(await readFile(new URL('../public/assets/audio/manifest.json', import.meta.url), 'utf8')).samples.filter(sample => sample.instrument === 'fairy');
async function withRecordedVoice(run) {
  const previous = globalThis.fetch;
  globalThis.fetch = async () => ({ ok: true, json: async () => ({ samples: vocalSamples }), arrayBuffer: async () => new ArrayBuffer(4) });
  class DecodeContext extends FakeContext { async decodeAudioData() { return { duration: 1, recorded: true }; } }
  try { await withAudio(async (audio, context) => { await audio.samplesReady(); await run(audio, context); }, DecodeContext); }
  finally { globalThis.fetch = previous; }
}
for (const fairy of FAIRIES) {
  test(`${fairy.id} sings the recorded human syllables at the melody’s lower octave`, async () => {
    await withRecordedVoice(async (audio, context) => {
      const game = gameState(); Object.assign(game.player, fairy);
      step(game, { interact: true }, .01); audio.tick(game);
      const phrase = songPhrase(game.activeSong.songId), notes = phrase.notes.filter(n => n.note !== null);
      const recorded = context.sources().filter(source => source.buffer?.recorded);
      assert.equal(recorded.length, notes.length);
      recorded.forEach((source, i) => {
        const midi = notes[i].note - 12;
        const sample = [...vocalSamples].sort((a, b) => Math.abs(a.rootMidi - midi) - Math.abs(b.rootMidi - midi))[0];
        assert.ok(Math.abs(source.playbackRate.value - 2 ** ((midi - sample.rootMidi + sample.tuneCents / 100) / 12)) < 1e-9);
        assert.ok(Math.abs(source.startTime - notes[i].at - .025) < 1e-9);
        assert.equal(source.loop, true);
        assert.equal(source.loopStart, sample.loopStart);
        assert.equal(source.loopEnd, sample.loopEnd);
      });
      const hana = context.sources().filter(source => source.wave?.imaginary.length === 33);
      assert.equal(hana.length, 1, 'Only Hana uses synthesized humming when recordings loaded.');
      assert.ok(Math.abs(hana[0].startTime - phrase.duration - .025) < 1e-9);
      context.advance(20);
      assert.ok(recorded.every(source => source.disconnected));
    });
  });
}
for (const interrupt of ['movement', 'cancel', 'pause', 'mute', 'restart', 'dispose']) {
  test(`${interrupt} stops all current and queued recorded fairy syllables`, async () => {
    await withRecordedVoice(async (audio, context) => {
      let game = gameState(); Object.assign(game.player, FAIRIES[0]);
      step(game, { interact: true }, .01); audio.tick(game);
      const recorded = context.sources().filter(source => source.buffer?.recorded);
      assert.ok(recorded.length > 1 && recorded.some(source => source.startTime > 1));
      context.advance(.2);
      if (interrupt === 'movement') step(game, { x: 1 }, .02);
      if (interrupt === 'cancel') cancelSong(game);
      if (interrupt === 'pause') audio.setPaused(true);
      if (interrupt === 'mute') audio.setEnabled(false);
      if (interrupt === 'restart') game = gameState();
      if (interrupt === 'dispose') audio.dispose();
      audio.tick(game); context.advance(.25);
      assert.ok(recorded.every(source => source.stopTime <= .241 && source.disconnected));
      assert.equal(game.tears.length, 0);
    });
  });
}

test('only the indoor lullaby reaches the voice consumer and resumes the unplayed woodland phrase', async () => {
  const { createMoment, advanceMoment } = await import('../src/moments.js');
  await withAudio(async (audio, context) => {
    const game = gameState(); game.scene = 'house'; game.houseStep = 2;
    const folds = () => context.sources().filter(source => source.wave?.imaginary.length === 33);
    for (const kind of ['fairy-gift', 'john-bowls', 'aldo-finger']) {
      assert.doesNotThrow(() => audio.tick(game, .01, createMoment(kind, 'aldo')));
      assert.equal(folds().length, 0, `${kind} has no vocal source`);
    }
    const m = createMoment('aldo-lullaby', 'aldo', 2);
    audio.tick(game, .01, m);
    assert.equal(folds().length, 1, 'The real household consumer must schedule Hana.');
    const pitches=source=>source.frequency.events.filter(([kind])=>kind==='target').map(([,value])=>Math.round(69+12*Math.log2(value/440)));
    assert.deepEqual(pitches(folds()[0]), songPhrase('woodland').notes.filter(n=>n.note!==null).map(n=>n.note));
    assert.equal(context.nodes[1].gain.events.at(-1)[1], .05);
    context.advance(1); advanceMoment(m, 1); audio.tick(game,.05,m);
    setLanguage(game,'cs');audio.tick(game,.05,m);assert.equal(folds().length,1);
    audio.setPaused(true);context.advance(2);audio.tick(game,0,m);assert.equal(m.elapsed,1);
    audio.setPaused(false);audio.tick(game,0,m);assert.equal(folds().length,2);
    const remaining=songPhrase('woodland').notes.filter(n=>n.note!==null&&n.at+n.duration>1).map(n=>n.note);
    assert.deepEqual(pitches(folds()[1]),remaining);
    audio.setEnabled(false);advanceMoment(m,1);audio.setEnabled(true);audio.tick(game,0,m);assert.equal(folds().length,3);
    context.advance(20);advanceMoment(m,18);audio.tick(game,.05,m);audio.tick(game,.05,null);
    assert.equal(folds().length,3,'A stalled frame must not restart an expired voice.');
    assert.equal(game.tears.length,0);assert.equal(game.houseStep,2);
  });
});
