import { chromium } from '/Users/johncampbell/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const out = 'evidence/storybook-upgrade/audio-clock';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/Users/johncampbell/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell', args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
const errors = []; page.on('pageerror', e => errors.push(e.message));
try {
  await page.route('**/audio-check', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Real audio clock check</body></html>' }));
  await page.goto('http://127.0.0.1:4188/audio-check');
  const results = [];
  for (const index of [0, 1, 2]) {
    const result = await page.evaluate(async index => {
      const NativeContext = window.AudioContext;
      const sources = [], waveSizes = new WeakMap();
      let context, sink;
      window.AudioContext = class extends NativeContext {
        constructor() {
          super(); context = this; sink = this.createMediaStreamDestination();
          Object.defineProperty(this, 'destination', { value: sink });
        }
        createPeriodicWave(real, imaginary, options) { const wave = super.createPeriodicWave(real, imaginary, options); waveSizes.set(wave, imaginary.length); return wave; }
        createOscillator() {
          const source = super.createOscillator();
          const periodic = source.setPeriodicWave.bind(source);
          source.setPeriodicWave = wave => { source.waveSize = waveSizes.get(wave); periodic(wave); };
          source.pitchEvents = [];
          const target = source.frequency.setTargetAtTime.bind(source.frequency);
          source.frequency.setTargetAtTime = (value, time, decay) => { source.pitchEvents.push([value, time]); return target(value, time, decay); };
          return this.observe(source);
        }
        createBufferSource() { return this.observe(super.createBufferSource()); }
        observe(source) {
          const start = source.start.bind(source), stop = source.stop.bind(source);
          source.start = (...args) => { source.startTime = args[0]; start(...args); };
          source.stop = (...args) => { source.stopTime = args[0]; stop(...args); };
          source.addEventListener('ended', () => { source.ended = true; }); sources.push(source); return source;
        }
      };
      const [{ createAudio }, { createGame, startGame, step }, { FAIRIES }, { songPhrase }] = await Promise.all([import('/src/audio.js'), import('/src/game.js'), import('/src/data.js'), import('/src/songs.js')]);
      const audio = createAudio(); audio.setPaused(false); audio.setEnabled(true); await audio.samplesReady();
      if (audio.getSampleState() !== 'ready') throw new Error('Samples must decode for this check.');
      const recorder = new MediaRecorder(sink.stream, { mimeType: 'audio/webm;codecs=opus' });
      const chunks = []; recorder.ondataavailable = event => chunks.push(event.data);
      const stopped = new Promise(resolve => recorder.onstop = resolve); recorder.start();
      const game = startGame(createGame()); Object.assign(game.player, FAIRIES[index]);
      step(game, { interact: true }, .01); audio.tick(game);
      const performance = game.activeSong, phrase = songPhrase(performance.songId);
      let last = window.performance.now(), stallAt = null, frames = 0;
      const audioStart = context.currentTime;
      await new Promise(resolve => {
        function frame(now) {
          const elapsed = (now - last) / 1000; last = now;
          step(game, {}, elapsed); audio.tick(game); frames++;
          if (stallAt === null && performance.elapsed > phrase.duration + .5) {
            stallAt = context.currentTime - audioStart;
            const until = window.performance.now() + 500;
            while (window.performance.now() < until) { /* Deliberate stalled animation frame. */ }
          }
          if (game.activeSong) requestAnimationFrame(frame); else resolve();
        }
        requestAnimationFrame(frame);
      });
      const elapsed = context.currentTime - audioStart;
      audio.setPaused(true);
      await new Promise(resolve => setTimeout(resolve, 120));
      const remainingSources = sources.filter(source => !source.ended).length;
      recorder.stop(); await stopped;
      const encoded = await new Blob(chunks).arrayBuffer();
      const decoded = await context.decodeAudioData(encoded.slice(0));
      const data = decoded.getChannelData(0);
      const rms = (start, duration) => {
        const samples = data.subarray(Math.floor(start * decoded.sampleRate), Math.floor((start + duration) * decoded.sampleRate));
        return Math.sqrt(samples.reduce((sum, value) => sum + value * value, 0) / samples.length);
      };
      const voice = sources.filter(source => source.waveSize === 33);
      const pitches = voice[0].pitchEvents.map(([hz, time]) => ({ midi: Math.round(69 + 12 * Math.log2(hz / 440)), at: time - voice[0].startTime }));
      const expected = phrase.notes.filter(note => note.note !== null).map(note => ({ midi: note.note, at: note.at }));
      const record = { song: performance.songId, sampleState: audio.getSampleState(), elapsed, performanceDuration: performance.duration, frames, stallAt, singers: voice.length, remainingSources, pitches, expected, rms: rms(0, decoded.duration), stallRms: rms(stallAt + .05, .3), bytes: Array.from(new Uint8Array(encoded)) };
      audio.dispose(); window.AudioContext = NativeContext; return record;
    }, index);
    assert.equal(result.singers, 1);
    assert.equal(result.remainingSources, 0);
    assert.ok(Math.abs(result.elapsed - result.performanceDuration) < .1);
    assert.ok(result.rms > .0001 && result.stallRms > .0001);
    assert.equal(result.pitches.length, result.expected.length);
    result.pitches.forEach((event, i) => { assert.equal(event.midi, result.expected[i].midi); assert.ok(Math.abs(event.at - result.expected[i].at) < .001); });
    await writeFile(`${out}/${result.song}-stalled.webm`, Buffer.from(result.bytes));
    delete result.bytes; results.push(result);
    await writeFile(`${out}/results.json`, JSON.stringify({ results, errors }, null, 2));
    console.log(`${result.song}: live audio, half-second frame stall, one singer, exact scheduled rhythm, and cleanup passed.`);
  }
  assert.deepEqual(errors, []);
} finally { await browser.close(); }
