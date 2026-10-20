import { launch, start } from '../reviews/storybook-upgrade/claude-review/tools/input/harness.mjs';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const h=await launch();
try {
 await start(h,'en');
 assert.equal(await h.page.evaluate(()=>document.activeElement.id),'world');
 await h.page.keyboard.press('Tab');
 assert.equal(await h.page.evaluate(()=>document.activeElement.dataset.action),'language');
 await h.page.keyboard.press('KeyM');
 const panel=h.page.locator('[data-overlay="map"]');
 assert.equal(await panel.getAttribute('aria-modal'),'true');
 const controls=panel.locator('button');
 await controls.last().focus();await h.page.keyboard.press('Tab');
 assert.equal(await h.page.evaluate(()=>document.activeElement.dataset.action),'language');
 await h.page.keyboard.press('Escape');
 assert.equal(await h.page.evaluate(()=>document.activeElement.id),'world');
 await h.page.keyboard.press('Enter');
 assert.equal((await h.state()).overlay,null);
 writeFileSync('evidence/storybook-upgrade/review-fixes/final-focus.json',JSON.stringify({nonActivatingFocus:true,tabOrder:true,modalWrap:true,enterNoPanel:true,errors:h.errors},null,2));
} finally {await h.close();}
