import { launch } from '../reviews/storybook-upgrade/claude-review/tools/input/harness.mjs';
import assert from 'node:assert/strict';
import { writeFileSync } from 'node:fs';
const h = await launch();
try {
  const result = await h.page.evaluate(async (baseline) => {
    const source = new Image(); source.src = baseline ? '/assets/characters/actions.png' : '/assets/characters/actions-headroom.png'; await source.decode();
    const canvas = document.createElement('canvas'); canvas.width=source.width;canvas.height=source.height;
    const ctx=canvas.getContext('2d');ctx.drawImage(source,0,0);const pixels=ctx.getImageData(0,0,source.width,source.height).data;
    const y=baseline ? Math.floor(source.height*2/3) : 0;
    let cutEdgePixels=0;
    for(let x=0;x<source.width;x++) if(pixels[(y*source.width+x)*4+3]>100) cutEdgePixels++;
    const { createPaintedCharacters } = await import('/src/characters.js');
    const painted = createPaintedCharacters(); await painted.ready;
    const frames = painted.actions.slice(8,11).map(map => {
      const c = map.image, data = c.getContext('2d').getImageData(0,0,c.width,c.height).data;
      let left=c.width, right=0, top=c.height,bottom=0;
      for(let y=0;y<c.height;y++) for(let x=0;x<c.width;x++) if(data[(y*c.width+x)*4+3]>100){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
      return {left,right,top,bottom,url:c.toDataURL()};
    });
    document.body.replaceChildren(); document.body.style='background:#eee5cc;display:flex;gap:20px';
    for(const frame of frames){ const image=new Image(); image.style='width:384px;height:384px;flex:none'; image.src=frame.url; document.body.append(image); delete frame.url; }
    painted.dispose();return {frames,cutEdgePixels};
  }, process.env.BASELINE === '1');
  assert.equal(result.cutEdgePixels,0,'No figure may cross the top edge of its source cell');
  for(const frame of result.frames){assert.ok(frame.left>0 && frame.right<383);assert.ok(frame.top>10);assert.ok(frame.bottom<=381);}
  await h.page.screenshot({path:'evidence/storybook-upgrade/review-fixes/t12-prepared-frames.png'});
  writeFileSync('evidence/storybook-upgrade/review-fixes/t12-prepared-frames.json',JSON.stringify(result,null,2));
} finally { await h.close(); }
