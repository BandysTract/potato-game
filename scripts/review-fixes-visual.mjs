import { launch, start, grant } from '../reviews/storybook-upgrade/claude-review/tools/input/harness.mjs';
import { SONG_SITES } from '../src/data.js';
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
const out = 'evidence/storybook-upgrade/review-fixes/';
const task = process.argv[2];
const results = [];
for (const phone of [false, true]) {
  const h = await launch({ phone });
  try {
    const mode = phone ? 'phone' : 'desktop';
    await h.page.waitForTimeout(700);
    await h.page.screenshot({ path: `${out}${task}-${mode}-title.png` });
    await start(h, phone ? 'en' : 'cs');
    await h.wait(1000);
    await h.page.screenshot({ path: `${out}${task}-${mode}-start.png` });
    if (task === 't3') {
      await grant(h, { tears: ['fairy-birch','fairy-ridge','fairy-stream'], learned: ['rain'] });
      const site = SONG_SITES.find(s => s.id === 'cottage');
      await h.teleport(site.x, site.z); await h.wait(700);
      await h.page.keyboard.press('KeyE');
      await h.page.locator('[data-song-choice="rain"]').click();
      await h.wait(3000);
      assert.equal((await h.worldState()).rain, true);
      await h.page.screenshot({ path: `${out}${task}-${mode}-rain.png` });
      await h.page.waitForFunction(() => window.__probe.game.restoredSites.includes('cottage'));
      await h.wait(1200);
      await h.page.screenshot({ path: `${out}${task}-${mode}-restored.png` });
      const color = await h.page.evaluate(() => window.__probe.world.scene.getObjectByName('dry-cottage-garden').material.color.getHexString());
      assert.equal(color, '52633b');
      results.push({ mode, color, state: await h.state(), errors: h.errors });
    }
    if (task.startsWith('t11')) {
      for (const [name,x,z] of [['birch',-23,-17],['woodland',-13,-27],['meadow',16,-27]]) {
        await h.teleport(x,z); await h.wait(1300);
        await h.page.screenshot({path:`${out}${task}-${mode}-${name}.png`});
      }
    }
    if (task === 't6') {
      await grant(h, { potatoes: Array.from({length:6},(_,i)=>`potato-${i+1}`), tears: ['fairy-birch','fairy-ridge','fairy-stream'], learned: ['woodland','growth','rain'], restored: ['woodland','meadow','cottage'] });
      await h.teleport(0,18); await h.wait(150); await h.page.keyboard.press('KeyE'); await h.wait(300);
      await h.teleport(-6,0); await h.wait(150); await h.page.keyboard.press('KeyE'); await h.wait(300);
      const box = await h.page.locator('[data-character-portrait]').boundingBox();
      assert.equal(box.width, box.height);
      await h.page.screenshot({ path: `${out}${task}-${mode}-john.png` });
      results.push({ mode, portrait: box, errors: h.errors });
    }
    assert.equal(h.errors.length, 0);
  } finally { await h.close(); }
}
writeFileSync(`${out}${task}-visual.json`, JSON.stringify(results, null, 2));
