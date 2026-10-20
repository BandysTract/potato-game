import { launch, start, grant } from '../reviews/storybook-upgrade/claude-review/tools/input/harness.mjs';
import { CREATURES } from '../src/data.js';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const task = process.argv[2], out = 'evidence/storybook-upgrade/review-fixes/';
const h = await launch({ phone: task === 't9', wavFail: task === 't10', reducedMotion: 'reduce' });
const results = [];
try {
  await h.wait(700);
  if (task === 't8') {
    await start(h, 'en');
    for (const target of CREATURES) for (const side of [-1,1]) {
      await h.teleport(target.x + side * 2, target.z - side * 2); await h.wait(250);
      const result = await h.page.evaluate(({x,z}) => {
        const object = window.__probe.world.scene.children.flatMap(g => g.children).find(o => o.isSprite && o.position.x === x && o.position.z === z && o.material.map?.image.width === 384);
        return { repeat: object.material.map.repeat.x, offset: object.material.map.offset.x, scale: object.scale.x };
      }, target);
      assert.equal(result.repeat, side); assert.equal(result.offset, side === -1 ? 1 : 0); assert.ok(result.scale > 0);
      await h.page.screenshot({ path: `${out}t8-${target.id}-${side}.png` }); results.push({ id: target.id, side, ...result });
    }
  }
  if (task === 't9') {
    await start(h, 'en'); await grant(h,{learned:['woodland'],tears:['fairy-birch']});
    await h.teleport(-13,-27); await h.wait(100); await h.page.keyboard.press('KeyE');
    for (const lang of ['en','cs']) {
      if (lang === 'cs') await h.page.locator('[data-overlay="songs"] [data-action="language"]').click();
      const text = await h.page.locator('[data-overlay="songs"]').innerText(); assert.ok(!text.includes('Esc')); results.push({lang,text});
    }
    await h.page.locator('[data-song-choice="woodland"]').click(); await h.wait(150);
    const text = await h.page.locator('.interaction').innerText(); assert.ok(!text.includes('Esc')); results.push({prompt:text});
  }
  if (task === 't10') {
    await h.page.locator('[data-overlay="intro"] [data-action="sound"]').click();
    await h.page.waitForFunction(() => window.__probe.audio.getSampleState() === 'fallback');
    for (const lang of ['cs','en']) {
      if (lang === 'en') await h.page.locator('[data-overlay="intro"] [data-action="language"]').click();
      const node = h.page.locator('.intro-sound-status'); assert.ok(await node.isVisible());
      const text = await node.innerText(); assert.ok(text.length > 20); results.push({lang,text});
      await h.page.screenshot({path:`${out}t10-${lang}-title.png`});
    }
  }
  writeFileSync(`${out}${task}-browser.json`,JSON.stringify({results,errors:h.errors},null,2));
} finally { await h.close(); }
