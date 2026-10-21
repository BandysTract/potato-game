import { chromium } from '/Users/johncampbell/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { writeFile, mkdir } from 'node:fs/promises';
const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4188';
const out = process.env.ART_OUT || 'evidence/storybook-upgrade/visual-01';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/Users/johncampbell/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = [];
page.on('pageerror', e => errors.push(e.message));
try {
  await page.goto(baseURL);
  await page.locator('[data-action="start"]').click();
  await page.waitForTimeout(1600);
  await page.screenshot({ path: `${out}/desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: `${out}/phone.png` });
  await page.route('**/art-check', route => route.fulfill({contentType:'text/html',body:`<html><style>body{margin:0}#world{width:100vw;height:100vh}</style><div id="world"></div><script type="module">import {createWorld} from '/src/world.js';import {createGame,startGame} from '/src/game.js';const g=startGame(createGame('en'));g.scene='house';g.player={x:0,z:2,facing:1};const w=createWorld(document.querySelector('#world'));await w.ready;window.fixture={g,w};let old=0;function render(t){w.update(g,Math.min(.05,(t-old)/1000),t/1000);old=t;requestAnimationFrame(render)}requestAnimationFrame(render);</script></html>`}));
  await page.setViewportSize({ width:1440,height:900 });
  await page.goto(`${baseURL}/art-check`);
  await page.waitForFunction(()=>window.fixture);
  await page.waitForTimeout(1000);
  await page.screenshot({path:`${out}/house.png`});
  await writeFile(`${out}/result.json`,JSON.stringify({errors},null,2));
  if(errors.length)throw new Error(errors.join('\n'));
  console.log('PASS art captures: desktop, phone, and house (fixture).');
} finally {await browser.close();}
