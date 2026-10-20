import { readFileSync, writeFileSync } from 'node:fs';
import assert from 'node:assert/strict';
import { SCORES } from '../src/music.js';
const root = 'evidence/storybook-upgrade/review-fixes/';
const results = JSON.parse(readFileSync(root+'final-audio/q3-render.json'));
assert.equal(results.length,72);
for (const result of results) { assert.equal(result.errors.length,0,result.name); assert.equal(result.clippedSamples,0,result.name); assert.ok(result.truePeakDb < -6,result.name); }
const scores = results.filter(r => /^samples-(score|animal)-/.test(r.name));
const levels = scores.map(r => r.overall.rmsDb);
const spread = Math.max(...levels)-Math.min(...levels);
assert.ok(spread < 5);
for(const score of scores){const fallback=results.find(r=>r.name===score.name.replace('samples-','synth-'));assert.ok(Math.abs(fallback.overall.rmsDb-score.overall.rmsDb)<5,score.name);}
const dither = results.find(r=>r.name==='dither-owl-threshold-2.5s');
const starts = dither.log.filter(e=>e.sample?.startsWith('clarinet')).map(e=>e.t);
const score=SCORES.woodland, expected=[];
for(let loop=0;loop<2;loop++) for(const event of score.events.filter(e=>e.melody)){
 const at=.025+(loop*score.beats+event.at)*score.beat;
 if(at<32+.99) expected.push(at);
}
assert.equal(starts.length,expected.length);
starts.forEach((at,i)=>assert.ok(Math.abs(at-expected[i])<.0002,`owl dither restarted at ${at}, expected ${expected[i]}`));
writeFileSync(root+'final-audio-summary.json',JSON.stringify({scenarios:results.length,spreadDb:spread,peakDb:Math.max(...results.map(r=>r.truePeakDb)),clips:0,owlMelodyStarts:starts.length,owlRestarts:0,scores:scores.map(r=>({name:r.name,rmsDb:r.overall.rmsDb}))},null,2));
console.log('PASS 72 scenarios, no clipping, balanced scores, and continuous woodland melody during owl dither');
