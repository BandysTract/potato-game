import { chromium } from '/Users/johncampbell/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import assert from 'node:assert/strict';

const out = 'evidence/storybook-upgrade/presentation-final';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, args: ['--use-angle=metal'], executablePath: process.env.CHROMIUM_PATH || '/Users/johncampbell/Library/Caches/ms-playwright/chromium-1243/chrome-mac-arm64/Google Chrome for Testing.app/Contents/MacOS/Google Chrome for Testing' });
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const errors = []; page.on('pageerror', error => errors.push(error.message));
try {
  await page.goto('http://127.0.0.1:4190');
  await page.locator('[data-action="start"]').click();
  await page.waitForTimeout(1800);
  await page.screenshot({ path: `${out}/desktop.png` });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: `${out}/phone.png` });
  const desktopErrors = errors.slice();
  await page.route('**/presentation-check', route => route.fulfill({ contentType: 'text/html', body: `<html><style>body{margin:0}#world{width:100vw;height:100vh}</style><div id="world"></div><script type="module">import {createWorld} from '/src/world.js';import {createGame,startGame} from '/src/game.js';window.g=startGame(createGame());window.w=createWorld(document.querySelector('#world'));await w.ready;window.ready=true;</script></html>` }));
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://127.0.0.1:4188/presentation-check');
  await page.waitForFunction(() => window.ready);
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  await page.evaluate(() => { w.update(g, .05, 1); w.update(g, .05, 2); });
  await page.emulateMedia({ reducedMotion: 'reduce' });
  const still = await page.evaluate(() => {
    const snapshot = time => {
      w.update(g, .05, time);
      const objects = [];
      w.scene.traverse(object => objects.push({ position: object.position.toArray(), rotation: object.rotation.toArray(), scale: object.scale.toArray(), opacity: object.material?.opacity, map: object.material?.map?.uuid }));
      return { objects, camera: w.camera.position.toArray() };
    };
    return [snapshot(3), snapshot(12)];
  });
  assert.deepEqual(still[0], still[1], 'Live reduced motion must stop decorative transforms, texture animation, and camera easing.');
  await page.evaluate(() => { g.scene = 'house'; Object.assign(g.player, {x:0,z:2}); w.update(g,.05,13); });
  await page.screenshot({ path: `${out}/house.png` });
  await page.evaluate(() => { Object.assign(g.player, {x:2.8,z:-1.5}); w.update(g,.05,14); });
  await page.screenshot({ path: `${out}/percy.png` });
  const atlasBounds = await page.evaluate(async () => {
    const sheet = new Image(); sheet.src = '/assets/characters/idle.png'; await sheet.decode();
    const canvas = document.createElement('canvas'); canvas.width = sheet.width; canvas.height = sheet.height;
    const ctx = canvas.getContext('2d'); ctx.drawImage(sheet,0,0);
    const pixels = ctx.getImageData(0,0,canvas.width,canvas.height).data;
    return Array.from({length:6}, (_,i) => {
      const x0=Math.floor(i%3*sheet.width/3), y0=Math.floor(Math.floor(i/3)*sheet.height/2), width=Math.floor(sheet.width/3), height=Math.floor(sheet.height/2);
      let top=height,bottom=0;
      for(let y=0;y<height;y++)for(let x=0;x<width;x++)if(pixels[((y+y0)*sheet.width+x+x0)*4+3]>100){top=Math.min(top,y);bottom=Math.max(bottom,y);}
      return {frame:i,top:top/height,bottom:bottom/height};
    });
  });
  for (const bound of atlasBounds) { assert.ok(bound.top > .02); assert.ok(bound.bottom < .98); }
  const failedArt = await browser.newPage();
  await failedArt.route('**/assets/characters/idle.png', route => route.abort());
  await failedArt.goto('http://127.0.0.1:4190');
  await failedArt.locator('.graphics-error').waitFor();
  await failedArt.getByRole('button', { name: 'English', exact: true }).click();
  assert.match(await failedArt.locator('.graphics-error').textContent(), /character artwork couldn’t load/);
  await failedArt.close();
  const manifest = JSON.parse(await readFile('public/assets/audio/manifest.json','utf8'));
  let sampleBytes=0;
  for (const sample of manifest.samples) {
    const data = await readFile(`public${sample.url}`); sampleBytes += data.length;
    assert.equal(data.length,sample.bytes); assert.equal(createHash('sha256').update(data).digest('hex'),sample.sha256);
  }
  assert.equal(sampleBytes,manifest.totalBytes);
  assert.deepEqual(errors, []); assert.deepEqual(desktopErrors, []);
  await writeFile(`${out}/results.json`,JSON.stringify({liveReducedMotion:true,atlasBounds,artFailureLocalized:true,samples:manifest.samples.length,sampleBytes,errors},null,2));
  console.log('PASS presentation: live reduced motion, atlas cell margins, localized missing-art recovery, sample hashes, and final desktop/phone/cottage captures.');
} finally { await browser.close(); }
