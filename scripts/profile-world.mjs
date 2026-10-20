import { chromium } from '/Users/johncampbell/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
const out = process.env.PROFILE_OUT || 'evidence/storybook-upgrade/profile-before.json';
await mkdir('evidence/storybook-upgrade', { recursive: true });
const browser = await chromium.launch({ headless: true, args: process.env.NATIVE_GPU ? ['--use-angle=metal'] : [], executablePath: process.env.CHROMIUM_PATH || '/Users/johncampbell/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const page = await browser.newPage();
try {
  await page.route('**/profile-check', route => route.fulfill({ contentType: 'text/html', body: `<html><style>body{margin:0}#world{width:100vw;height:100vh}</style><div id="world"></div><script type="module">import {createWorld} from '/src/world.js';import {createGame,startGame} from '/src/game.js';window.g=startGame(createGame());window.w=createWorld(document.querySelector('#world'));await w.ready;window.frames=[];let old;function render(t){if(old)frames.push(t-old);w.update(g,old?Math.min(.05,(t-old)/1000):0,t/1000);old=t;requestAnimationFrame(render)}requestAnimationFrame(render);window.ready=true;</script></html>` }));
  const results = [];
  for (const [width, height] of [[1440, 900], [390, 844]]) {
    await page.setViewportSize({ width, height });
    await page.goto('http://127.0.0.1:4188/profile-check');
    await page.waitForFunction(() => window.ready);
    await page.waitForTimeout(1500);
    await page.evaluate(() => { window.frames.length = 0; });
    await page.waitForTimeout(5000);
    results.push(await page.evaluate(() => {
      const sorted = window.frames.slice().sort((a,b)=>a-b);
      const gl = w.renderer.getContext(), debug = gl.getExtension('WEBGL_debug_renderer_info');
      return { width: innerWidth, height: innerHeight, renderer: debug ? gl.getParameter(debug.UNMASKED_RENDERER_WEBGL) : 'unavailable', frames: sorted.length, medianMs: sorted[Math.floor(sorted.length*.5)], p95Ms: sorted[Math.floor(sorted.length*.95)], render: w.renderer.info.render, memory: w.renderer.info.memory };
    }));
  }
  await writeFile(out, JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results));
} finally { await browser.close(); }
