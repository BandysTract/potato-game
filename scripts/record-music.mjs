import { chromium } from '/Users/johncampbell/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
const out = 'evidence/storybook-upgrade/listening';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/Users/johncampbell/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell', args: ['--autoplay-policy=no-user-gesture-required'] });
const page = await browser.newPage();
try {
  await page.route('**/music-check', route => route.fulfill({ contentType: 'text/html', body: '<html><body>Local listening capture</body></html>' }));
  await page.goto(`${process.env.GAME_URL || 'http://127.0.0.1:4188'}/music-check`);
  for (const [id, position, seconds] of [['growth', { x: 0, z: -30 }, 28], ['woodland', { x: 0, z: 0 }, 28], ['rain', { x: 23, z: -10 }, 13]]) {
    const result = await page.evaluate(async ({ id, position, seconds }) => {
      const NativeContext = window.AudioContext;
      let recordingContext, sink;
      window.AudioContext = class extends NativeContext {
        constructor() {
          super(); recordingContext = this;
          sink = this.createMediaStreamDestination();
          Object.defineProperty(this, 'destination', { value: sink });
        }
      };
      const { createAudio } = await import('/src/audio.js');
      const audio = createAudio();
      audio.setPaused(false); audio.setEnabled(true);
      await audio.samplesReady();
      if (audio.getSampleState() !== 'ready') throw new Error('Listening capture requires decoded instrument recordings.');
      const recorder = new MediaRecorder(sink.stream, { mimeType: 'audio/webm;codecs=opus' });
      const chunks = [];
      recorder.ondataavailable = event => chunks.push(event.data);
      const stopped = new Promise(resolve => recorder.onstop = resolve);
      recorder.start();
      const game = { phase: 'playing', scene: 'outdoors', player: position, activeSong: null };
      const started = recordingContext.currentTime;
      const timer = setInterval(() => audio.tick(game), 20);
      await new Promise(resolve => setTimeout(resolve, seconds * 1000));
      clearInterval(timer); recorder.stop(); await stopped;
      const data = new Uint8Array(await new Blob(chunks).arrayBuffer());
      const elapsed = recordingContext.currentTime - started;
      audio.dispose(); window.AudioContext = NativeContext;
      return { id, elapsed, data: Array.from(data) };
    }, { id, position, seconds });
    await writeFile(`${out}/${id}.webm`, Buffer.from(result.data));
    console.log(`${id}: ${result.elapsed.toFixed(2)} seconds recorded from actual browser playback.`);
  }
} finally { await browser.close(); }
