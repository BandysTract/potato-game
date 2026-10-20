import { chromium } from '/Users/johncampbell/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright/index.mjs';
import { mkdir, writeFile } from 'node:fs/promises';
import assert from 'node:assert/strict';
import { POTATOES, FAIRIES, CREATURES, SONG_SITES, HOME, HOUSE_TARGETS, HOUSE_CAT } from '../src/data.js';

const out = process.env.JOURNEY_OUT || 'evidence/storybook-upgrade/journeys';
const baseURL = process.env.GAME_URL || 'http://127.0.0.1:4190';
await mkdir(out, { recursive: true });
const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || '/Users/johncampbell/Library/Caches/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-mac-arm64/chrome-headless-shell', args: ['--enable-precise-memory-info', ...(process.env.NATIVE_GPU ? ['--use-angle=metal'] : [])] });
const results = [];
try {
  for (const language of (process.env.JOURNEY_LANGS || 'cs,en').split(',')) {
    const phone = language === 'en';
    const context = await browser.newContext({ viewport: phone ? { width: 390, height: 844 } : { width: 1440, height: 900 }, hasTouch: phone, deviceScaleFactor: phone ? 2 : 1 });
    const page = await context.newPage();
    const touchSession = phone ? await context.newCDPSession(page) : null;
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.addInitScript(() => {
      window.measurement = { frames: [], resources: {} };
      let previous;
      function measure(t) { if (previous) window.measurement.frames.push(t - previous); previous = t; requestAnimationFrame(measure); }
      requestAnimationFrame(measure);
      for (const prototype of [WebGLRenderingContext.prototype, WebGL2RenderingContext.prototype]) {
        for (const kind of ['Buffer', 'Texture', 'Program', 'Shader', 'Framebuffer', 'Renderbuffer']) {
          for (const [verb, sign] of [['create', 1], ['delete', -1]]) {
            const original = prototype[verb + kind];
            prototype[verb + kind] = function (...args) {
              const result = original.apply(this, args);
              if (sign === 1 ? result : args[0]) window.measurement.resources[kind] = (window.measurement.resources[kind] || 0) + sign;
              return result;
            };
          }
        }
      }
    });
    if (phone) await page.route('**/assets/audio/*.wav', route => route.abort());
    await page.goto(baseURL);
    if (language === 'en') await page.locator('[data-overlay="intro"] [data-action="language"]').click();
    await page.locator('[data-action="start"]').click();
    await page.waitForTimeout(1500);
    if (phone) assert.match(await page.locator('.event-toast').textContent(), /Music will use synthesized sounds/);
    await page.screenshot({ path: `${out}/${language}-start.png` });
    const position = () => page.evaluate(() => {
      const indoors = !document.querySelector('[data-map-house]').hidden;
      const value = document.querySelector(indoors ? '[data-house-player]' : '[data-map-player]').getAttribute('transform');
      return value.match(/[-\d.]+/g).map(Number);
    });
    const counts = () => page.evaluate(() => [Number(document.querySelector('[data-potato-count]').firstChild.textContent), Number(document.querySelector('[data-tear-count]').firstChild.textContent)]);
    async function go(target) {
      let last = '', stuck = 0;
      for (let n = 0; n < 150; n++) {
        const [x, z] = await position();
        const dx = target.x - x, dz = target.z - z, distance = Math.hypot(dx, dz);
        if (distance < .45) return;
        const sx = (dx - dz) * Math.SQRT1_2, sy = (dx + dz) * Math.SQRT1_2;
        const keys = [];
        if (Math.abs(sx) > .16) keys.push(sx > 0 ? 'KeyD' : 'KeyA');
        if (Math.abs(sy) > .16) keys.push(sy > 0 ? 'KeyS' : 'KeyW');
        const now = `${x.toFixed(2)},${z.toFixed(2)}`;
        stuck = now === last ? stuck + 1 : 0; last = now;
        assert.ok(stuck < 5, `Blocked walking to ${target.id || JSON.stringify(target)} from ${now}`);
        if (phone) {
          const names = { KeyD: 'east', KeyA: 'west', KeyS: 'south', KeyW: 'north' };
          const touchPoints = [];
          for (const key of keys) {
            const box = await page.locator(`[data-direction="${names[key]}"]`).boundingBox();
            touchPoints.push({ x: box.x + box.width / 2, y: box.y + box.height / 2, id: touchPoints.length + 1 });
          }
          await touchSession.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints });
        } else for (const key of keys) await page.keyboard.down(key);
        await page.waitForTimeout(Math.min(420, Math.max(45, distance / 5 * 750)));
        if (phone) await touchSession.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
        else for (const key of keys) await page.keyboard.up(key);
      }
      throw new Error(`Movement did not reach ${target.id}`);
    }
    const action = async () => { if (phone) await page.locator('.touch-action').tap(); else await page.keyboard.press('KeyE'); await page.waitForTimeout(80); };
    async function gather(index) {
      const before = await counts(); await go(POTATOES[index]); await action(); await page.waitForTimeout(1200);
      assert.equal((await counts())[0], before[0] + 1);
    }
    async function learn(index, cancel = false) {
      const fairy = FAIRIES[index], before = await counts(); await go(fairy); await action();
      if (cancel) {
        await page.waitForTimeout(500); await page.keyboard.press('Escape');
        assert.equal((await counts())[1], before[1]);
        assert.equal(await page.locator('.song-track').isVisible(), false);
        await action();
        await page.waitForTimeout(500);
        await page.evaluate(() => window.dispatchEvent(new Event('blur')));
        await page.locator('[data-overlay="pause"]').waitFor({ state: 'visible' });
        assert.equal((await counts())[1], before[1]);
        await page.evaluate(() => window.dispatchEvent(new Event('focus')));
        await page.locator('[data-action="resume"]').click();
        await action();
        await page.locator('.sound-button:visible').click();
        assert.equal(await page.locator('.sound-button:visible').getAttribute('aria-pressed'), 'false');
        await page.emulateMedia({ reducedMotion: 'reduce' });
      }
      await page.waitForFunction(count => Number(document.querySelector('[data-tear-count]').firstChild.textContent) === count, before[1] + 1, { timeout: 22000 });
      assert.equal(await page.locator(`[data-map-fairy="${fairy.id}"]`).getAttribute('data-learned'), 'true');
      if (cancel) {
        await page.locator('.sound-button:visible').click();
        await page.emulateMedia({ reducedMotion: 'no-preference' });
      }
      console.log(`${language}: learned ${fairy.name}`);
    }
    async function restore(id, wrong) {
      const site = SONG_SITES.find(site => site.id === id); await go(site); await action();
      await page.locator('[data-overlay="songs"]').waitFor({ state: 'visible' });
      if (id === 'woodland') {
        const siteBefore = await page.locator('[data-song-site]').textContent();
        for (let i = 0; i < 2; i++) await page.locator('[data-overlay="songs"] [data-action="language"]').click();
        assert.equal(await page.locator('[data-song-site]').textContent(), siteBefore);
        assert.equal(await page.locator(`[data-song-choice="${site.songId}"]`).isEnabled(), true);
      }
      if (wrong) {
        await page.locator(`[data-song-choice="${wrong}"]`).click();
        await page.waitForTimeout(8200);
        assert.equal(await page.locator(`[data-map-site="${id}"]`).getAttribute('data-restored'), 'false');
        await action();
      }
      await page.locator(`[data-song-choice="${site.songId}"]`).click();
      await page.waitForFunction(id => document.querySelector(`[data-map-site="${id}"]`).dataset.restored === 'true', id, { timeout: 11000 });
      await page.waitForTimeout(600);
      await page.screenshot({ path: `${out}/${language}-${id}.png` });
      console.log(`${language}: restored ${id}`);
    }
    async function talk(index) {
      await go(CREATURES[index]); await action();
      await page.locator('[data-dialogue-choice="0"]').click();
      await page.locator('.dialogue-result [data-action="dialogueFinish"]').click();
    }
    // Read the displayed position, then use real keys and buttons. No state,
    // inventory, positions, timers, or frame clocks are changed by this harness.
    await go(HOME);
    if (phone) assert.equal(await page.locator('.touch-action').isDisabled(), true);
    else await action();
    assert.equal(await page.locator('[data-map-house]').evaluate(el => el.hidden), true);
    await go(SONG_SITES[2]); await action();
    assert.equal(await page.locator('[data-song-choice]:disabled').count(), 3);
    await page.keyboard.press('Escape');
    await gather(0);
    if (!phone) {
      await gather(1); await talk(0); await gather(2); await learn(0, true); await talk(1);
      await restore('woodland'); await gather(3); await learn(1); await talk(2);
      await restore('meadow', 'woodland'); await gather(4); await learn(2); await gather(5); await talk(3);
    } else {
      await go({ x: 12, z: 7 }); await talk(3); await gather(5); await learn(2);
      await go(SONG_SITES[1]); await talk(2); await learn(1);
      await restore('meadow', 'rain'); await gather(4); await go({ x: 5, z: -32 });
      await talk(1); await learn(0); await restore('woodland'); await gather(3);
      await gather(2); await talk(0); await gather(1);
    }
    assert.deepEqual(await counts(), [6, 3]);
    await go({ x: 0, z: 10 }); await restore('cottage');
    await go(HOME); await action();
    await page.waitForFunction(() => !document.querySelector('[data-map-house]').hidden);
    for (const target of HOUSE_TARGETS) {
      await go(target); await action();
      if (['john', 'aldo'].includes(target.id)) {
        await page.screenshot({ path: `${out}/${language}-${target.id}.png` });
        await page.locator('[data-dialogue-choice="0"]').click();
        await page.locator('.dialogue-result [data-action="dialogueFinish"]').click();
        if (target.id === 'aldo') { await go(HOUSE_CAT); await action(); await page.waitForTimeout(1300); await page.screenshot({ path: `${out}/${language}-percy.png` }); }
      } else { await page.waitForTimeout(target.id === 'cook' ? 3400 : 2100); }
    }
    await page.locator('[data-overlay="win"]').waitFor({ state: 'visible', timeout: 10000 });
    assert.deepEqual(await counts(), [6, 3]);
    await page.screenshot({ path: `${out}/${language}-ending.png` });
    const beforeRestart = await page.evaluate(() => ({ ...window.measurement.resources }));
    await page.locator('[data-action="restart"]').click();
    await page.waitForTimeout(500);
    assert.deepEqual(await counts(), [0, 0]);
    assert.equal(await page.locator('[data-map-site][data-restored="true"]').count(), 0);
    assert.equal(await page.locator('[data-map-fairy][data-learned="true"]').count(), 0);
    const metrics = await page.evaluate(() => {
      const frames = window.measurement.frames.slice(120).sort((a, b) => a - b);
      return { frames: frames.length, medianFrameMs: frames[Math.floor(frames.length * .5)], p95FrameMs: frames[Math.floor(frames.length * .95)], resources: window.measurement.resources, heapBytes: performance.memory?.usedJSHeapSize };
    });
    assert.deepEqual(metrics.resources, beforeRestart, 'Restart must not create more GPU resources.');
    assert.deepEqual(errors, []);
    results.push({ language, route: phone ? 'east first' : 'west first', input: phone ? 'CDP touch contacts' : 'keyboard', phoneLayoutEmulation: phone, audioLoadingFailure: phone, focusEventsInjected: !phone, liveReducedMotionAndMute: !phone, metrics, errors, completed: true });
    await writeFile(`${out}/results.json`, JSON.stringify(results, null, 2));
    console.log(`${language}: complete journey, ending, and empty restart passed.`);
    await context.close();
  }
} finally { await browser.close(); }
