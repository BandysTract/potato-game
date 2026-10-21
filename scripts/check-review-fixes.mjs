import { chromium } from '/Users/johncampbell/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
const out = process.env.REVIEW_OUT || 'evidence/storybook-upgrade/review-fixes';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--use-angle=metal'], executablePath: '/Users/johncampbell/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
try {
  await page.route('**/gather-check', route => route.fulfill({ contentType: 'text/html', body: `<html><style>body{margin:0}#world{width:100vw;height:100vh}</style><div id="world"></div><script type="module">import {createWorld} from '/src/world.js';import {createGame,startGame,step} from '/src/game.js';import {POTATOES} from '/src/data.js';window.g=startGame(createGame());Object.assign(g.player,POTATOES[0]);window.step=step;window.w=createWorld(document.querySelector('#world'));await w.ready;w.update(g,.05,0);window.potato=w.scene.getObjectsByProperty('type','Sprite').find(o=>o.position.x===POTATOES[0].x&&o.position.z===POTATOES[0].z+.25&&o.scale.x===1.35);window.ready=true;</script></html>` }));
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('http://127.0.0.1:4188/gather-check');
  await page.waitForFunction(() => window.ready);
  const phases = await page.evaluate(() => {
    const states=[];
    const observe=label=>{w.update(g,.05,0);states.push({label,visible:potato.visible,count:g.potatoes.length});};
    step(g,{interact:true},.016);observe('reach');
    step(g,{},.38);observe('lift');
    step(g,{},.38);observe('basket');
    // Simulate the state cleared by the actual entry point’s pause handler.
    // The production pause/retry is exercised separately below.
    g.actionAnimation=null;observe('cancelled');
    step(g,{interact:true},.016);step(g,{},1.1);observe('completed retry');
    return states;
  });
  assert.deepEqual(phases, [
    {label:'reach',visible:true,count:0}, {label:'lift',visible:false,count:0},
    {label:'basket',visible:false,count:0}, {label:'cancelled',visible:true,count:0},
    {label:'completed retry',visible:false,count:1},
  ]);
  for (const muted of [true, false]) {
    let release, requested;
    const requestedPromise = new Promise(resolve => { requested=resolve; });
    const released = new Promise(resolve => { release=resolve; });
    await page.route('**/assets/audio/manifest.json', async route => { requested(); await released; await route.abort(); });
    await page.goto('http://127.0.0.1:4190');
    await page.locator('[data-overlay="intro"] [data-action="language"]').click();
    await page.locator('[data-action="start"]').click(); await requestedPromise;
    if(muted)await page.locator('.sound-button:visible').click();else await page.keyboard.press('Escape');
    release();
    await page.waitForFunction(()=>document.querySelector('.event-toast').textContent.includes('Music will use synthesized sounds'));
    assert.equal(await page.locator('.sound-button').first().getAttribute('aria-pressed'),String(!muted));
    if(!muted)await page.locator('[data-action="resume"]').click();
    await page.unroute('**/assets/audio/manifest.json');
  }
  for(let n=0;n<40;n++) {
    const [x,z]=await page.locator('[data-map-player]').evaluate(el=>el.getAttribute('transform').match(/[-\d.]+/g).map(Number));
    const dx=-4-x,dz=12-z,d=Math.hypot(dx,dz);if(d<.25)break;
    const sx=(dx-dz)*Math.SQRT1_2,sy=(dx+dz)*Math.SQRT1_2,keys=[];
    if(Math.abs(sx)>.12)keys.push(sx>0?'KeyD':'KeyA');if(Math.abs(sy)>.12)keys.push(sy>0?'KeyS':'KeyW');
    for(const key of keys)await page.keyboard.down(key);
    await page.waitForTimeout(Math.min(250,Math.max(30,d/5*750)));
    for(const key of keys)await page.keyboard.up(key);
  }
  const count=()=>page.locator('[data-potato-count]').evaluate(el=>Number(el.firstChild.textContent));
  await page.keyboard.press('KeyE');await page.waitForTimeout(430);
  await page.screenshot({path:`${out}/lift.png`});
  await page.keyboard.press('Escape');assert.equal(await count(),0);
  await page.locator('[data-action="resume"]').click();await page.waitForTimeout(200);
  await page.screenshot({path:`${out}/cancelled.png`});assert.equal(await count(),0);
  await page.keyboard.press('KeyE');await page.waitForTimeout(1250);assert.equal(await count(),1);
  await writeFile(`${out}/results.json`,JSON.stringify({phases,mutedFailure:true,pausedFailure:true,productionPauseAndRetry:true},null,2));
  console.log('PASS review fixes: reach/lift/basket/cancel/retry rendering, delayed muted and paused sample failures, and production pause/retry.');
} finally { await browser.close(); }
