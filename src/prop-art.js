import * as THREE from 'three';

// Every new small prop shares one painted atlas, so the new scenery adds one
// texture upload rather than one per prop. Cells keep transparent margins so
// mipmaps don't bleed between neighbors.
const ink = '#283f38';
export const ATLAS_SIZE = 2048;
export const PROP_CELLS = {
  basketCovered: [0, 0, 256, 256], basketChosen: [256, 0, 256, 256], basketOpen: [512, 0, 256, 256],
  coinHeads: [768, 0, 256, 256], coinTails: [1024, 0, 256, 256], coinEdge: [1280, 0, 256, 256], coinSlot: [1536, 0, 256, 256], pennant: [1792, 0, 256, 256],
  pairHH: [0, 256, 256, 160], pairHT: [256, 256, 256, 160], pairTH: [512, 256, 256, 160], pairTT: [768, 256, 256, 160],
  cardA: [1024, 256, 256, 256], cardD: [1280, 256, 256, 256], card4: [1536, 256, 256, 256], card7: [1792, 256, 256, 256],
  cardLeaf: [0, 512, 256, 256], cardFlower: [256, 512, 256, 256], cardCircle: [512, 512, 256, 256], cardSquare: [768, 512, 256, 256],
  cardHidden: [1024, 512, 256, 256], violationPair: [1280, 512, 384, 256], sunLeaf: [1664, 512, 256, 256],
  lichenRock: [0, 768, 512, 256], logMushroom: [512, 768, 512, 256], sandPiles: [1024, 768, 512, 256], brookRoots: [1536, 768, 512, 256],
  sunRays: [0, 1024, 256, 256], lichenAlgae: [256, 1024, 512, 256], co2: [768, 1024, 256, 256], spores: [1024, 1024, 256, 256],
  boatRepaired: [1280, 1024, 256, 256], boatOld: [1536, 1024, 256, 256], grain: [1792, 1024, 128, 128], gradientBand: [1792, 1152, 256, 96],
  machine: [0, 1280, 256, 256], thoughtNotes: [256, 1280, 256, 256], blankSheet: [512, 1280, 256, 256], songStone: [768, 1280, 256, 256],
  birdPerched: [1024, 1280, 256, 256], birdSinging: [1280, 1280, 256, 256], noteClean: [1536, 1280, 256, 256], noteWobbly: [1792, 1280, 256, 256],
  mycelium: [0, 1536, 512, 128], dustPuff: [0, 1664, 256, 128], soilCrumbs: [256, 1664, 256, 128],
  reflectionBloom: [512, 1536, 256, 256], capBrown: [768, 1536, 256, 256], stem: [1024, 1536, 256, 256], wateringCan: [1280, 1536, 256, 256],
  drip: [1536, 1536, 256, 256], wetGlint: [1792, 1536, 256, 256],
  emStar: [0, 1792, 256, 256], emBranch: [256, 1792, 256, 256], emFlower: [512, 1792, 256, 256],
  peekFox: [768, 1792, 256, 256], peekOwl: [1024, 1792, 256, 256], peekDeer: [1280, 1792, 256, 256], peekBadger: [1536, 1792, 256, 256],
  hare: [1792, 1792, 256, 256],
};

function ellipse(c, x, y, rx, ry, color, rotation = 0) {
  c.fillStyle = color; c.beginPath(); c.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2); c.fill();
}
function shape(c, points, color, stroke = null, width = 2) {
  c.beginPath(); points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.closePath();
  if (color) { c.fillStyle = color; c.fill(); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(); }
}
function line(c, points, color, width = 3) {
  c.strokeStyle = color; c.lineWidth = width; c.beginPath();
  points.forEach(([x, y], i) => i ? c.lineTo(x, y) : c.moveTo(x, y)); c.stroke();
}
function gradient(c, x0, y0, x1, y1, colors) {
  const fill = c.createLinearGradient(x0, y0, x1, y1);
  colors.forEach((color, i) => fill.addColorStop(i / (colors.length - 1), color));
  return fill;
}
function radial(c, x, y, r, colors) {
  const fill = c.createRadialGradient(x, y, 0, x, y, r);
  colors.forEach((color, i) => fill.addColorStop(i / (colors.length - 1), color));
  return fill;
}
function path(c, d, fill, stroke, width = 2) {
  const p = new Path2D(d);
  if (fill) { c.fillStyle = fill; c.fill(p); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(p); }
}
function leaf(c, x, y, length, width, angle, color, vein = '#e8eab866') {
  c.save(); c.translate(x, y); c.rotate(angle);
  c.fillStyle = color; c.beginPath(); c.moveTo(0, 0);
  c.bezierCurveTo(-width, -length * .35, -width * .6, -length * .8, 0, -length);
  c.bezierCurveTo(width * .7, -length * .65, width, -length * .15, 0, 0); c.fill();
  line(c, [[0, 0], [0, -length * .87]], vein, Math.max(.8, width * .12));
  c.restore();
}
function serifText(c, text, x, y, size, color) {
  c.fillStyle = color; c.textAlign = 'center'; c.textBaseline = 'middle';
  c.font = `700 ${size}px Georgia, 'Times New Roman', serif`;
  c.fillText(text, x, y);
}

function basketBody(c) {
  path(c, 'M58 128 C55 54 201 50 198 128', null, '#6e4c32', 9);
  path(c, 'M62 128 C60 62 196 58 194 128', null, '#d7b476', 3);
  path(c, 'M40 124 Q128 104 216 124 L196 214 Q128 238 60 214Z', gradient(c, 40, 120, 216, 220, ['#d8b06e', '#b38a52', '#765236']), '#6b4d2e', 3);
  for (let i = 0; i < 5; i++) path(c, `M${46 + i * 3} ${140 + i * 16} Q128 ${158 + i * 16} ${210 - i * 3} ${138 + i * 16}`, null, '#ecc98a70', 3);
  for (let x = 62; x < 200; x += 18) path(c, `M${x} 128 Q${x - 4} 176 ${128 + (x - 128) * .78} 222`, null, '#5f432870', 2);
}
function cloth(c, embroidery = '#b4483d') {
  path(c, 'M34 132 Q60 96 128 92 Q196 96 222 132 Q214 150 196 146 Q170 160 128 156 Q86 160 60 146 Q42 150 34 132Z', gradient(c, 40, 90, 220, 160, ['#fbf1d8', '#efe0bd', '#d7c49c']), '#9c8b6a', 2.2);
  line(c, [[52, 138], [92, 147], [128, 148], [166, 147], [204, 138]], embroidery, 3);
  for (let x = 66; x < 200; x += 22) shape(c, [[x, 141], [x + 5, 136], [x + 10, 141], [x + 5, 146]], embroidery);
}
function coin(c, kind) {
  ellipse(c, 128, 132, 92, 92, '#8b6a2c');
  ellipse(c, 128, 128, 90, 90, kind === 'tails' ? gradient(c, 50, 40, 200, 220, ['#f6e8c2', '#d8c08a', '#a98a4d']) : gradient(c, 50, 40, 200, 220, ['#fbe39a', '#e1b456', '#a8782d']));
  c.strokeStyle = '#fff4cf90'; c.lineWidth = 4; c.beginPath(); c.arc(128, 128, 76, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = '#7d5e2690'; c.lineWidth = 2; c.beginPath(); c.arc(128, 128, 70, 0, Math.PI * 2); c.stroke();
  if (kind === 'heads') {
    // A crown for heads.
    shape(c, [[84, 154], [80, 98], [104, 124], [128, 88], [152, 124], [176, 98], [172, 154]], '#9a6c20', '#6d4b14', 3);
    for (const x of [80, 128, 176]) ellipse(c, x, x === 128 ? 86 : 96, 7, 7, '#fff1bf');
    line(c, [[86, 140], [170, 140]], '#fff1bf', 4);
  } else {
    // A bird for tails, after the Czech eagle side.
    path(c, 'M128 92 Q140 96 138 108 Q160 98 186 104 Q170 116 150 120 Q170 128 178 146 Q152 140 138 132 L134 160 L122 160 L118 132 Q104 140 78 146 Q86 128 106 120 Q86 116 70 104 Q96 98 118 108 Q116 96 128 92Z', '#8d7440', '#5f4b25', 2.5);
    ellipse(c, 128, 100, 4, 4, '#f6e8c2');
  }
}
function card(c, glyphColor, draw) {
  c.save();
  c.shadowColor = '#2a3a2f40'; c.shadowBlur = 10; c.shadowOffsetY = 5;
  c.fillStyle = '#f7efd9'; c.beginPath(); c.roundRect(46, 14, 164, 228, 18); c.fill();
  c.restore();
  c.strokeStyle = '#6f5b3e'; c.lineWidth = 4; c.beginPath(); c.roundRect(46, 14, 164, 228, 18); c.stroke();
  c.strokeStyle = '#c5a978'; c.lineWidth = 2; c.beginPath(); c.roundRect(58, 26, 140, 204, 12); c.stroke();
  draw(c, glyphColor);
}
function leafGlyph(c, x = 128, y = 128, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  path(c, 'M0 70 C-62 30 -54 -46 0 -78 C54 -46 62 30 0 70Z', gradient(c, -50, -70, 50, 70, ['#9fbf6e', '#5d8c4b', '#3f6b3e']), '#2f5034', 4);
  line(c, [[0, 74], [0, -66]], '#e6efc0', 4);
  for (let i = -2; i <= 2; i++) { line(c, [[0, i * 22], [-30, i * 22 - 18]], '#d6e5aa', 2.5); line(c, [[0, i * 22], [30, i * 22 - 18]], '#d6e5aa', 2.5); }
  c.restore();
}
function flowerGlyph(c, x = 128, y = 128, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  line(c, [[0, 30], [0, 92]], '#5a7d4c', 6);
  for (let i = 0; i < 5; i++) ellipse(c, Math.cos(i * 1.2566 - 1.57) * 34, Math.sin(i * 1.2566 - 1.57) * 34, 26, 17, '#e9a3a6', i * 1.2566 - 1.57);
  for (let i = 0; i < 5; i++) ellipse(c, Math.cos(i * 1.2566 - 1.57) * 34, Math.sin(i * 1.2566 - 1.57) * 34, 14, 8, '#f6d1cf', i * 1.2566 - 1.57);
  ellipse(c, 0, 0, 18, 18, '#e2b24e'); ellipse(c, -4, -4, 7, 7, '#f7da86');
  c.restore();
}
function circleGlyph(c, x = 128, y = 128, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = '#3c6f92'; c.lineWidth = 16; c.beginPath(); c.arc(0, 0, 58, 0, Math.PI * 2); c.stroke();
  c.strokeStyle = '#8fb6cf'; c.lineWidth = 4; c.beginPath(); c.arc(0, 0, 58, 3.6, 5.2); c.stroke();
  c.restore();
}
function squareGlyph(c, x = 128, y = 128, s = 1) {
  c.save(); c.translate(x, y); c.scale(s, s);
  c.strokeStyle = '#9a5a35'; c.lineWidth = 16; c.strokeRect(-54, -54, 108, 108);
  line(c, [[-46, -46], [10, -46]], '#d79a6c', 4);
  c.restore();
}
function boat(c, planks) {
  // A small rowboat in profile: five strakes over a curved keel.
  const hull = 'M24 132 Q40 196 128 202 Q216 196 236 128 Z';
  c.save(); c.clip(new Path2D(hull));
  for (let i = 0; i < 5; i++) {
    c.fillStyle = planks[i % planks.length]; c.fillRect(0, 128 + i * 15, 256, 15);
    line(c, [[0, 128 + i * 15], [256, 128 + i * 15]], '#3d2c1c90', 2);
    for (let g = 0; g < 7; g++) line(c, [[20 + g * 34 + i * 7, 133 + i * 15], [44 + g * 34 + i * 7, 135 + i * 15]], '#ffffff22', 1.5);
  }
  c.restore();
  path(c, hull, null, '#3d2c1c', 4);
  line(c, [[20, 128], [240, 124]], '#5a4128', 8);
  line(c, [[26, 125], [236, 121]], '#c8a575', 2.5);
  for (const x of [92, 164]) line(c, [[x, 128], [x + 2, 146]], '#5a4128', 6);
}
function bird(c, singing) {
  // A small brown songbird on a twig.
  line(c, [[30, 196], [226, 186]], '#6d553b', 9);
  line(c, [[160, 190], [204, 166]], '#6d553b', 5);
  leaf(c, 206, 166, 26, 9, -.6, '#7f9a5c');
  line(c, [[118, 166], [114, 192]], '#8a6a46', 4); line(c, [[136, 168], [138, 191]], '#8a6a46', 4);
  path(c, 'M70 132 Q66 100 100 92 Q130 84 156 104 Q176 124 160 152 Q142 174 106 170 Q76 166 70 132Z', gradient(c, 70, 90, 160, 170, ['#9c7a54', '#7c5d3f', '#5d4630']), '#3c2c1d', 2.5);
  path(c, 'M98 128 Q112 160 148 154 Q156 132 142 118 Q118 112 98 128Z', gradient(c, 100, 118, 150, 160, ['#f0a066', '#d97c47']), null);
  path(c, 'M74 128 Q40 122 26 138 Q52 142 76 144Z', '#6e5238', '#3c2c1d', 2);
  path(c, 'M92 116 Q104 136 128 134 Q120 112 92 116Z', '#5e4630', null);
  const head = singing ? [-.35, 160, 92] : [0, 160, 100];
  c.save(); c.translate(head[1], head[2]); c.rotate(head[0]);
  ellipse(c, 0, 0, 24, 21, '#8a6a49');
  ellipse(c, 6, 6, 15, 12, '#ec9a63');
  ellipse(c, 8, -5, 4, 4, '#1f1a16'); ellipse(c, 9, -6, 1.4, 1.4, '#ffffff');
  if (singing) { shape(c, [[20, -6], [42, -12], [24, 0]], '#d9a441', '#6e4f1d', 1.5); shape(c, [[20, 2], [40, 8], [22, 6]], '#c7922f', '#6e4f1d', 1.5); }
  else shape(c, [[20, -3], [38, 0], [20, 3]], '#d9a441', '#6e4f1d', 1.5);
  c.restore();
}
function note(c, wobbly) {
  c.save();
  if (wobbly) { c.translate(128, 128); c.rotate(.28); c.translate(-128, -128); }
  ellipse(c, 104, 182, 34, 25, '#f2d27a', -.4);
  c.strokeStyle = ink; c.lineWidth = 6; c.beginPath(); c.ellipse(104, 182, 34, 25, -.4, 0, Math.PI * 2); c.stroke();
  if (wobbly) {
    // A stem that can't quite hold the pitch, with a drooping flag.
    line(c, [[136, 176], [130, 150], [142, 124], [130, 98], [140, 70], [134, 52]], ink, 7);
    path(c, 'M134 52 Q168 66 166 102 Q160 126 176 150', null, ink, 7);
    for (const [x, y] of [[178, 72], [190, 92], [182, 112]]) line(c, [[x, y], [x + 16, y - 6]], '#a8743c', 4);
  } else {
    line(c, [[136, 174], [136, 48]], ink, 7);
    path(c, 'M136 48 Q176 64 178 100 Q176 114 168 124 Q170 92 136 82', ink, null);
  }
  c.restore();
}
function embroidery(c, kind) {
  c.save(); c.translate(128, 128);
  c.shadowColor = '#5a4a3a70'; c.shadowBlur = 6;
  if (kind === 'star') {
    for (let i = 0; i < 8; i++) {
      c.save(); c.rotate(i * Math.PI / 4);
      shape(c, [[0, 0], [-22, -38], [0, -104], [22, -38]], '#ffffff', '#c9bfae', 3);
      shape(c, [[0, -22], [-9, -40], [0, -78], [9, -40]], '#e9e2d4');
      c.restore();
    }
    ellipse(c, 0, 0, 22, 22, '#ffffff'); ellipse(c, 0, 0, 10, 10, '#d9d0c0');
  } else if (kind === 'branch') {
    line(c, [[0, 112], [6, 40], [-4, -40], [2, -108]], '#ffffff', 9);
    for (let i = 0; i < 5; i++) {
      const y = 80 - i * 40;
      for (const side of [-1, 1]) leaf(c, side * 3, y, 56 - i * 5, 22, side * (1.05 - i * .06), '#ffffff', '#cfc5b4');
    }
    ellipse(c, 2, -112, 13, 13, '#ffffff');
  } else {
    for (let i = 0; i < 6; i++) {
      c.save(); c.rotate(i * Math.PI / 3);
      path(c, 'M0 -18 C-30 -50 -26 -92 0 -104 C26 -92 30 -50 0 -18Z', '#ffffff', '#c9bfae', 3);
      line(c, [[0, -28], [0, -88]], '#ddd5c6', 3);
      c.restore();
    }
    ellipse(c, 0, 0, 24, 24, '#ffffff');
    for (let i = 0; i < 6; i++) ellipse(c, Math.cos(i) * 12, Math.sin(i) * 12, 4, 4, '#d6ccbb');
  }
  c.restore();
}

const PAINTERS = {
  basketCovered: c => { basketBody(c); cloth(c); },
  basketChosen: c => {
    basketBody(c); cloth(c);
    // Hana's red ribbon marks her chosen basket.
    path(c, 'M128 58 Q100 34 86 52 Q94 72 124 64Z', '#c8463b', '#7e2a24', 2);
    path(c, 'M130 58 Q160 34 172 54 Q162 72 132 64Z', '#c8463b', '#7e2a24', 2);
    path(c, 'M124 62 L110 100 L120 96 L126 108 Z M134 62 L148 100 L138 96 L132 108 Z', '#b73c33', '#7e2a24', 1.5);
    ellipse(c, 129, 61, 9, 8, '#d8584b');
  },
  basketOpen: c => {
    basketBody(c);
    ellipse(c, 128, 126, 86, 18, '#3f2c1c');
    ellipse(c, 128, 130, 70, 11, '#5a4128');
    // The cloth hangs over the side, and the basket is plainly empty.
    path(c, 'M150 120 Q206 112 230 132 Q236 176 214 214 Q200 220 196 204 Q206 168 188 140 Q170 132 150 130Z', gradient(c, 150, 110, 230, 220, ['#fbf1d8', '#e6d4ad']), '#9c8b6a', 2);
    line(c, [[206, 140], [214, 170], [206, 202]], '#b4483d', 3);
  },
  coinHeads: c => coin(c, 'heads'),
  coinTails: c => coin(c, 'tails'),
  coinEdge: c => {
    c.fillStyle = gradient(c, 104, 0, 152, 0, ['#a8782d', '#f2cf74', '#a8782d']);
    c.beginPath(); c.roundRect(110, 38, 36, 184, 16); c.fill();
    c.strokeStyle = '#6d4b14'; c.lineWidth = 3; c.beginPath(); c.roundRect(110, 38, 36, 184, 16); c.stroke();
    for (let y = 52; y < 210; y += 12) line(c, [[114, y], [142, y]], '#7d5e2660', 2);
  },
  coinSlot: c => {
    c.setLineDash([14, 12]); c.strokeStyle = '#6f5b3e'; c.lineWidth = 6;
    c.beginPath(); c.arc(128, 128, 84, 0, Math.PI * 2); c.stroke(); c.setLineDash([]);
    serifText(c, '?', 128, 134, 112, '#6f5b3e');
  },
  pennant: c => {
    line(c, [[96, 240], [96, 24]], '#6d553b', 8);
    shape(c, [[100, 30], [214, 62], [100, 96]], '#f2e6c4', '#6f5b3e', 3);
    shape(c, [[100, 52], [168, 62], [100, 74]], '#4c8ca5');
  },
  pairHH: c => pair(c, 'heads', 'heads'), pairHT: c => pair(c, 'heads', 'tails'), pairTH: c => pair(c, 'tails', 'heads'),
  pairTT: c => { pair(c, 'tails', 'tails'); line(c, [[30, 140], [226, 22]], '#8f3b30', 9); },
  cardA: c => card(c, ink, () => serifText(c, 'A', 128, 132, 150, '#30443d')),
  cardD: c => card(c, ink, () => serifText(c, 'D', 128, 132, 150, '#30443d')),
  card4: c => card(c, ink, () => serifText(c, '4', 128, 134, 150, '#7a3c2e')),
  card7: c => card(c, ink, () => serifText(c, '7', 128, 134, 150, '#7a3c2e')),
  cardLeaf: c => card(c, ink, () => leafGlyph(c, 128, 124, .95)),
  cardFlower: c => card(c, ink, () => flowerGlyph(c, 128, 110, .95)),
  cardCircle: c => card(c, ink, () => circleGlyph(c, 128, 128, 1)),
  cardSquare: c => card(c, ink, () => squareGlyph(c, 128, 128, 1)),
  cardHidden: c => {
    c.save(); c.shadowColor = '#2a3a2f40'; c.shadowBlur = 10; c.shadowOffsetY = 5;
    c.fillStyle = '#7d4a3a'; c.beginPath(); c.roundRect(46, 14, 164, 228, 18); c.fill(); c.restore();
    c.strokeStyle = '#4d2b20'; c.lineWidth = 4; c.beginPath(); c.roundRect(46, 14, 164, 228, 18); c.stroke();
    c.strokeStyle = '#e2c699'; c.lineWidth = 3; c.beginPath(); c.roundRect(60, 28, 136, 200, 10); c.stroke();
    for (let y = 48; y < 220; y += 34) for (let x = 78; x < 190; x += 34) shape(c, [[x, y - 10], [x + 10, y], [x, y + 10], [x - 10, y]], '#c98f6a');
    ellipse(c, 128, 128, 44, 44, '#7d4a3a');
    serifText(c, '?', 128, 134, 84, '#f4e2bd');
  },
  violationPair: c => {
    // A leaf card whose other side shows a square, so the rule is broken.
    c.save(); c.translate(-10, 0); c.scale(.82, .82); c.translate(14, 22); card(c, ink, () => leafGlyph(c, 128, 124, .9)); c.restore();
    c.save(); c.translate(164, 0); c.scale(.82, .82); c.translate(14, 22); card(c, ink, () => squareGlyph(c, 128, 128, .95)); c.restore();
    path(c, 'M168 118 L206 118 M196 106 L210 118 L196 130 M218 140 L180 140 M190 128 L176 140 L190 152', null, '#5d4b35', 5);
    line(c, [[316, 18], [362, 64]], '#a33a2c', 11); line(c, [[362, 18], [316, 64]], '#a33a2c', 11);
  },
  sunLeaf: c => {
    line(c, [[128, 236], [128, 178]], '#5a7d4c', 8);
    path(c, 'M128 196 C40 168 34 70 128 18 C222 70 216 168 128 196Z', gradient(c, 60, 20, 200, 200, ['#c7e08a', '#7fae58', '#4a7c45']), '#2f5034', 4);
    line(c, [[128, 196], [128, 36]], '#eef6c8', 5);
    for (let i = 0; i < 5; i++) { const y = 170 - i * 28; line(c, [[128, y], [84, y - 30]], '#dcebb0', 3); line(c, [[128, y], [172, y - 30]], '#dcebb0', 3); }
    ellipse(c, 98, 80, 18, 34, '#ffffff30', -.5);
  },
  sunRays: c => {
    // Seven soft rays fan downward from the top of the cell.
    c.fillStyle = radial(c, 128, 0, 250, ['#fff6cfaa', '#ffeeb444', '#ffeeb400']);
    for (let i = 0; i < 7; i++) {
      const a = Math.PI / 2 + (i - 3) * .2;
      c.beginPath(); c.moveTo(128, 0);
      c.lineTo(128 + Math.cos(a - .05) * 300, Math.sin(a - .05) * 300);
      c.lineTo(128 + Math.cos(a + .05) * 300, Math.sin(a + .05) * 300); c.fill();
    }
    ellipse(c, 128, 8, 46, 30, radial(c, 128, 8, 46, ['#fff8dccc', '#fff3c000']));
  },
  lichenRock: c => {
    shape(c, [[30, 226], [52, 132], [120, 74], [230, 52], [362, 64], [452, 118], [488, 218], [420, 240], [110, 244]], gradient(c, 60, 50, 460, 240, ['#b5bdb0', '#8d978d', '#5f6b64']), '#3f4a45', 3);
    shape(c, [[120, 74], [230, 52], [250, 128], [150, 150]], '#c4cabe90');
    line(c, [[250, 128], [262, 196], [244, 240]], '#4b5751', 3);
    // Pale rosettes and an orange crust: the lichen itself.
    for (const [x, y, r, color] of [[132, 128, 34, '#c9d2a6'], [204, 98, 26, '#b5c590'], [318, 104, 38, '#cbd3a9'], [392, 156, 28, '#d9a548'], [176, 192, 30, '#c2cc9c'], [300, 186, 24, '#e0b257'], [96, 196, 18, '#b5c590']]) {
      ellipse(c, x, y, r, r * .7, color);
      for (let i = 0; i < 9; i++) ellipse(c, x + Math.cos(i * .7) * r * .8, y + Math.sin(i * .7) * r * .55, r * .22, r * .16, color === '#d9a548' || color === '#e0b257' ? '#f0c86e' : '#e3e8c8');
    }
  },
  lichenAlgae: c => {
    // Bright green partner cells sit inside the lichen patches.
    for (const [x, y, r] of [[132, 128, 34], [204, 98, 26], [318, 104, 38], [176, 192, 30], [96, 196, 18]]) {
      ellipse(c, x, y, r * 1.1, r * .8, radial(c, x, y, r * 1.1, ['#c8ff9a90', '#9be06a40', '#9be06a00']));
      for (let i = 0; i < 12; i++) ellipse(c, x + Math.cos(i * 2.4) * r * .6 * ((i % 3 + 1) / 3), y + Math.sin(i * 2.4) * r * .4 * ((i % 3 + 1) / 3), 4, 4, '#b8f27a');
    }
  },
  logMushroom: c => {
    ellipse(c, 240, 226, 210, 20, '#2e4c3a40');
    path(c, 'M40 150 Q36 112 70 104 L366 92 Q400 96 402 132 Q404 172 368 180 L72 196 Q42 194 40 150Z', gradient(c, 60, 92, 400, 196, ['#9d8160', '#6f5840', '#4a3c2c']), '#33291e', 3);
    ellipse(c, 382, 136, 28, 42, '#c9a87a'); for (const r of [8, 16, 24]) { c.strokeStyle = '#8a6d4c'; c.lineWidth = 2; c.beginPath(); c.ellipse(382, 136, r * .66, r, 0, 0, Math.PI * 2); c.stroke(); }
    for (let i = 0; i < 9; i++) line(c, [[70 + i * 34, 110], [76 + i * 34, 186]], '#3e322470', 2);
    for (let i = 0; i < 26; i++) ellipse(c, 70 + i * 11, 104 + Math.sin(i) * 3, 9, 6, i % 2 ? '#7f9a5c' : '#9aae6c');
    // A mushroom beside the log.
    path(c, 'M436 222 Q432 176 444 150 L462 150 Q472 178 468 222Z', gradient(c, 432, 150, 470, 222, ['#f2e6c6', '#d8c6a0']), '#8a7a5c', 2);
    path(c, 'M400 158 Q404 104 452 98 Q500 104 506 158 Q454 170 400 158Z', gradient(c, 410, 98, 500, 168, ['#d39a64', '#a5643f', '#6f3f28']), '#4f2c1b', 2.5);
    line(c, [[408, 156], [454, 164], [500, 156]], '#f0d7a8', 3);
    for (const [x, y] of [[436, 124], [466, 116], [482, 138]]) ellipse(c, x, y, 6, 4, '#f3e2bd');
  },
  mycelium: c => {
    c.fillStyle = gradient(c, 0, 0, 0, 128, ['#5b463000', '#5b463070', '#5b463090']);
    c.beginPath(); c.roundRect(10, 16, 492, 100, 40); c.fill();
    let seed = 17; const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let n = 0; n < 34; n++) {
      let x = 400 + (random() - .5) * 60, y = 30 + random() * 10;
      c.strokeStyle = '#fff8e8d0'; c.lineWidth = 1.2 + random() * 1.6; c.beginPath(); c.moveTo(x, y);
      for (let s = 0; s < 9; s++) { x += (random() - .62) * 46; y += random() * 10; c.lineTo(x, Math.min(110, y)); }
      c.stroke();
    }
  },
  co2: c => {
    ellipse(c, 128, 128, 100, 100, radial(c, 110, 100, 110, ['#ffffffcc', '#e6f2f2a0', '#c4dede60']));
    c.strokeStyle = '#6f9294'; c.lineWidth = 5; c.beginPath(); c.arc(128, 128, 98, 0, Math.PI * 2); c.stroke();
    serifText(c, 'CO', 116, 132, 74, '#36545a');
    serifText(c, '2', 178, 160, 44, '#36545a');
  },
  spores: c => { for (const [x, y, r] of [[96, 120, 13], [146, 96, 10], [150, 156, 12], [196, 128, 8]]) ellipse(c, x, y, r, r, radial(c, x, y, r, ['#fffbeaff', '#f2e4c2c0', '#f2e4c200'])); },
  boatRepaired: c => boat(c, ['#e3bc84', '#d8ae74', '#e8c690']),
  boatOld: c => boat(c, ['#6d5640', '#5d4a37', '#7a6148']),
  sandPiles: c => {
    const sand = (x, y, r) => ellipse(c, x, y, r, r * .8, '#d6bd86');
    ellipse(c, 256, 226, 240, 18, '#2e4c3a35');
    sand(60, 214, 6);
    for (const [x, y] of [[148, 214], [162, 216], [155, 206]]) sand(x, y, 6);
    path(c, 'M222 220 Q256 168 292 220Z', gradient(c, 222, 170, 292, 220, ['#ecd7a0', '#cfb37a', '#a98d58']), '#8a7246', 2);
    path(c, 'M340 222 Q420 70 500 222Z', gradient(c, 340, 80, 500, 222, ['#f0dca6', '#d2b67c', '#a48654']), '#806842', 2.5);
    let seed = 5; const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (let i = 0; i < 220; i++) {
      const t = random(), x = 350 + t * 140, top = 222 - Math.sin(t * Math.PI) * 140;
      ellipse(c, x, top + random() * (222 - top), 2.2, 1.8, random() > .5 ? '#a98d5890' : '#fff0c890');
    }
    for (let i = 0; i < 30; i++) ellipse(c, 232 + random() * 52, 206 + random() * 14, 2, 1.6, '#a98d5890');
  },
  grain: c => ellipse(c, 64, 64, 30, 24, radial(c, 58, 58, 32, ['#f7e4b0', '#d6bd86', '#a98d58'])),
  gradientBand: c => {
    c.fillStyle = gradient(c, 10, 0, 246, 0, ['#f4ead000', '#e9d6a460', '#c9a86490', '#8d6f3cb0']);
    c.beginPath(); c.roundRect(10, 24, 236, 48, 24); c.fill();
  },
  machine: c => {
    ellipse(c, 128, 236, 100, 12, '#2e4c3a40');
    c.fillStyle = gradient(c, 50, 90, 206, 234, ['#c49a64', '#8f6a42', '#5e4430']);
    c.beginPath(); c.roundRect(50, 96, 156, 136, 12); c.fill();
    c.strokeStyle = '#3d2c1c'; c.lineWidth = 4; c.beginPath(); c.roundRect(50, 96, 156, 136, 12); c.stroke();
    for (const [x, y] of [[90, 140], [146, 140]]) {
      ellipse(c, x, y, 22, 22, '#e9c873'); ellipse(c, x, y, 16, 16, '#fbf1d0');
      line(c, [[x, y], [x + 9, y - 10]], '#5a3c22', 3);
    }
    for (let i = 0; i < 4; i++) ellipse(c, 76 + i * 34, 196, 7, 7, ['#c8463b', '#4c8ca5', '#e2b24e', '#7f9a5c'][i]);
    // A small dome helmet on a curling cord.
    path(c, 'M150 96 Q150 60 182 54 Q208 50 214 30', null, '#5a3c22', 4);
    path(c, 'M178 46 Q180 6 214 6 Q248 6 250 46 Z', gradient(c, 178, 6, 250, 46, ['#f6e2a6', '#c9a453', '#8a6a2e']), '#5a4220', 3);
    line(c, [[176, 46], [252, 46]], '#5a4220', 5);
  },
  thoughtNotes: c => {
    for (const [x, y, r] of [[60, 220, 10], [84, 196, 15]]) ellipse(c, x, y, r, r, '#fbf6e8');
    const cloud = 'M70 130 Q50 96 84 80 Q92 40 136 48 Q168 22 196 52 Q238 52 232 96 Q252 126 220 146 Q212 178 172 168 Q140 190 112 164 Q72 172 70 130Z';
    path(c, cloud, '#fbf6e8', '#8f8370', 3);
    for (const [x, y, s] of [[116, 120, 1], [170, 104, .85]]) {
      c.save(); c.translate(x, y); c.scale(s, s);
      ellipse(c, -6, 22, 14, 10, ink, -.4); line(c, [[6, 20], [6, -30]], ink, 5); path(c, 'M6 -30 Q24 -22 26 -6', null, ink, 5);
      c.restore();
    }
  },
  blankSheet: c => {
    c.save(); c.shadowColor = '#2a3a2f40'; c.shadowBlur = 8; c.shadowOffsetY = 4;
    shape(c, [[40, 30], [216, 22], [222, 232], [46, 238]], '#fbf3dc'); c.restore();
    shape(c, [[40, 30], [216, 22], [222, 232], [46, 238]], null, '#9c8b6a', 3);
    for (const top of [64, 142]) for (let i = 0; i < 5; i++) line(c, [[58, top + i * 11], [206, top - 3 + i * 11]], '#8f8370', 2);
  },
  songStone: c => {
    ellipse(c, 128, 210, 104, 26, '#2e4c3a45');
    path(c, 'M30 196 Q24 140 72 112 Q128 84 186 106 Q236 128 228 190 Q200 222 128 220 Q56 222 30 196Z', gradient(c, 40, 90, 220, 220, ['#b9c1b2', '#8a978b', '#5f6e66']), '#3f4a45', 3);
    for (let i = 0; i < 14; i++) ellipse(c, 60 + i * 9, 120 + Math.sin(i * 1.7) * 8, 8, 5, i % 2 ? '#87a062' : '#a7b874');
    c.save(); c.translate(124, 162); c.scale(.62, .62);
    ellipse(c, -10, 30, 22, 16, '#f2d27a', -.4); c.strokeStyle = '#6d5a2c'; c.lineWidth = 6; c.beginPath(); c.ellipse(-10, 30, 22, 16, -.4, 0, Math.PI * 2); c.stroke();
    line(c, [[10, 26], [10, -50]], '#6d5a2c', 7); path(c, 'M10 -50 Q40 -36 42 -10', null, '#6d5a2c', 7);
    c.restore();
  },
  hare: c => {
    // A meadow hare sitting up, facing left, ready to sing back.
    ellipse(c, 128, 228, 92, 16, '#2e4c3a40');
    path(c, 'M112 104 Q92 34 104 14 Q118 24 124 100Z', gradient(c, 100, 14, 124, 104, ['#3f3326', '#9c7f5c']), '#3c2c1d', 2.5);
    path(c, 'M128 102 Q124 30 142 16 Q152 32 140 104Z', gradient(c, 128, 16, 150, 104, ['#3f3326', '#a88a63']), '#3c2c1d', 2.5);
    path(c, 'M134 30 Q144 24 142 92 Q136 92 134 30Z', '#e7c9b0', null);
    path(c, 'M104 148 Q96 104 130 96 Q176 92 196 132 Q214 176 196 210 Q170 228 126 222 Q96 214 104 148Z', gradient(c, 100, 96, 210, 226, ['#b8976b', '#9a7a54', '#6f5639']), '#3c2c1d', 2.5);
    ellipse(c, 176, 184, 34, 30, '#8f6f4b');
    ellipse(c, 212, 176, 15, 13, '#f2ead8');
    path(c, 'M110 168 Q116 200 138 214 Q148 196 140 170 Q126 158 110 168Z', '#ead9b9', null);
    for (const x of [112, 132]) ellipse(c, x, 216, 13, 7, '#d9c4a0');
    ellipse(c, 112, 120, 38, 31, '#a5855e');
    ellipse(c, 84, 132, 15, 12, '#c9ad85');
    ellipse(c, 100, 112, 7, 7, '#1f1a16'); ellipse(c, 102, 110, 2.2, 2.2, '#ffffff');
    ellipse(c, 74, 128, 4.5, 3.5, '#7a4e3c');
    for (const dy of [-4, 3]) line(c, [[78, 134 + dy], [54, 130 + dy * 2]], '#f6efe0b0', 1.5);
  },
  birdPerched: c => bird(c, false),
  birdSinging: c => bird(c, true),
  noteClean: c => note(c, false),
  noteWobbly: c => note(c, true),
  dustPuff: c => { for (const [x, y, r] of [[96, 84, 44], [150, 76, 38], [126, 64, 30]]) ellipse(c, x, y, r, r * .7, radial(c, x, y, r, ['#eadfc2d0', '#e3d6b070', '#e3d6b000'])); },
  soilCrumbs: c => { for (const [x, y, r] of [[70, 90, 9], [96, 80, 7], [124, 94, 10], [150, 82, 6], [176, 92, 8], [110, 70, 5], [140, 66, 6]]) ellipse(c, x, y, r, r * .8, '#5a4128'); },
  reflectionBloom: c => {
    ellipse(c, 128, 128, 120, 60, radial(c, 128, 128, 120, ['#f6fbf2c0', '#dcefe880', '#dcefe800']));
    for (let i = 0; i < 8; i++) {
      c.save(); c.translate(128, 128); c.scale(1, .5); c.rotate(i * Math.PI / 4);
      path(c, 'M0 -10 C-22 -36 -16 -74 0 -86 C16 -74 22 -36 0 -10Z', '#ffffffa0', null);
      c.restore();
    }
    ellipse(c, 128, 128, 24, 12, '#fffbe8');
  },
  capBrown: c => {
    path(c, 'M20 168 Q24 64 128 48 Q232 64 236 168 Q128 192 20 168Z', gradient(c, 30, 48, 230, 190, ['#dba36a', '#a8653f', '#6c3c25']), '#4a2a19', 4);
    line(c, [[30, 166], [128, 182], [226, 166]], '#f2d9a8', 6);
    for (const [x, y, r] of [[86, 104, 12], [140, 84, 10], [176, 124, 13], [112, 140, 8]]) ellipse(c, x, y, r, r * .7, '#f6e6c2');
  },
  stem: c => {
    path(c, 'M96 246 Q86 150 104 30 L152 30 Q170 150 160 246Z', gradient(c, 90, 30, 166, 246, ['#fbf1d6', '#e3d2ab', '#bfa982']), '#8a7a5c', 3);
    line(c, [[116, 50], [112, 226]], '#ffffff80', 4);
  },
  wateringCan: c => {
    ellipse(c, 128, 226, 96, 14, '#2e4c3a40');
    path(c, 'M150 120 L232 62 L240 74 L164 140Z', gradient(c, 150, 60, 240, 140, ['#a9bcae', '#6f8a7b']), '#33463d', 3);
    ellipse(c, 236, 66, 16, 10, '#8ba596', -.6);
    path(c, 'M54 100 Q56 222 66 226 L176 226 Q186 222 186 100 Z', gradient(c, 54, 100, 186, 226, ['#b8cbbd', '#7c9a88', '#4d6a5b']), '#2f4339', 3);
    ellipse(c, 120, 100, 66, 14, '#5a7566'); ellipse(c, 120, 100, 56, 9, '#2f4339');
    path(c, 'M74 98 Q74 40 120 40 Q166 40 166 98', null, '#3f584b', 9);
    for (let i = 0; i < 3; i++) line(c, [[60, 140 + i * 30], [182, 140 + i * 30]], '#e6efe740', 3);
  },
  drip: c => path(c, 'M128 40 Q92 112 92 148 Q92 196 128 196 Q164 196 164 148 Q164 112 128 40Z', radial(c, 116, 132, 70, ['#ffffff', '#d7f3f8', '#7fc4d4']), '#5d9aa8', 3),
  wetGlint: c => {
    for (const [a, r] of [[0, 110], [Math.PI / 2, 110], [Math.PI / 4, 54], [Math.PI * .75, 54]]) {
      c.save(); c.translate(128, 128); c.rotate(a);
      shape(c, [[0, -r], [10, 0], [0, r], [-10, 0]], '#ffffffd0'); c.restore();
    }
    ellipse(c, 128, 128, 22, 22, '#ffffff');
  },
  emStar: c => embroidery(c, 'star'),
  emBranch: c => embroidery(c, 'branch'),
  emFlower: c => embroidery(c, 'flower'),
  brookRoots: c => {
    // Dark roots arch from the bank into the water.
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * 52, sway = Math.sin(i * 1.9) * 26;
      c.strokeStyle = i % 2 ? '#2f2a22' : '#3d342a'; c.lineWidth = 16 - i % 3 * 4; c.lineCap = 'round';
      c.beginPath(); c.moveTo(x, 30); c.bezierCurveTo(x + sway, 90, x - 40 + sway, 150, x + 10, 226); c.stroke();
      c.strokeStyle = '#6b5a4470'; c.lineWidth = 3; c.beginPath(); c.moveTo(x - 4, 36); c.bezierCurveTo(x + sway - 4, 92, x - 44 + sway, 150, x + 4, 220); c.stroke();
      for (let r = 0; r < 3; r++) line(c, [[x - 20 + sway * .5, 120 + r * 30], [x - 44 + r * 10 + sway * .4, 150 + r * 30]], '#2f2a22', 4);
    }
    c.fillStyle = gradient(c, 0, 0, 0, 70, ['#3b4a34', '#3b4a3400']);
    c.beginPath(); c.roundRect(4, 4, 504, 70, 30); c.fill();
    for (let i = 0; i < 40; i++) ellipse(c, 16 + i * 12.5, 26 + Math.sin(i * 1.3) * 10, 10, 6, i % 2 ? '#56704a' : '#6f8a58');
  },
};

function pair(c, a, b) {
  c.fillStyle = '#f7efd9'; c.beginPath(); c.roundRect(10, 10, 236, 140, 18); c.fill();
  c.strokeStyle = '#6f5b3e'; c.lineWidth = 4; c.beginPath(); c.roundRect(10, 10, 236, 140, 18); c.stroke();
  for (const [kind, x] of [[a, 76], [b, 180]]) { c.save(); c.translate(x - 64, 16); c.scale(.5, .5); coin(c, kind); c.restore(); }
}

// Paper grain sits only on painted pixels, matching the existing sprites.
function grain(c, x0, y0, width, height) {
  c.save(); c.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < width * height / 220; i++) {
    const x = Math.abs(Math.sin(i * 127.1 + x0) * 43758.5453) % 1, y = Math.abs(Math.sin(i * 269.5 + y0) * 43758.5453) % 1;
    c.fillStyle = i % 3 ? '#213d3510' : '#fff2d716'; c.fillRect(x0 + x * width, y0 + y * height, 1.2, 1.2);
  }
  c.restore();
}

export function createPropAtlas() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = ATLAS_SIZE;
  const c = canvas.getContext('2d');
  c.lineCap = 'round'; c.lineJoin = 'round';
  for (const [name, [x, y, width, height]] of Object.entries(PROP_CELLS)) {
    const painter = PAINTERS[name];
    if (!painter) continue;
    c.save(); c.beginPath(); c.rect(x + 3, y + 3, width - 6, height - 6); c.clip(); c.translate(x, y);
    painter(c); c.restore();
    grain(c, x, y, width, height);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  const cells = new Map();
  return {
    texture,
    // One shared image upload. Each cell is a lightweight view into it.
    cell(name) {
      if (cells.has(name)) return cells.get(name);
      const rect = PROP_CELLS[name];
      if (!rect) throw new Error(`Unknown prop cell: ${name}`);
      const view = texture.clone();
      view.offset.set(rect[0] / ATLAS_SIZE, 1 - (rect[1] + rect[3]) / ATLAS_SIZE);
      view.repeat.set(rect[2] / ATLAS_SIZE, rect[3] / ATLAS_SIZE);
      cells.set(name, view); return view;
    },
    aspect(name) { const rect = PROP_CELLS[name]; return rect[2] / rect[3]; },
    // Draws the upper part of a painted animal into a window cell, once art has loaded.
    paintPeek(name, image, flip = false) {
      const [x, y, width, height] = PROP_CELLS[name];
      const probe = document.createElement('canvas'); probe.width = image.width; probe.height = image.height;
      const pc = probe.getContext('2d', { willReadFrequently: true }); pc.drawImage(image, 0, 0);
      const pixels = pc.getImageData(0, 0, probe.width, probe.height).data;
      let minX = probe.width, maxX = 0, top = probe.height, bottom = 0;
      for (let py = 0; py < probe.height; py++) for (let px = 0; px < probe.width; px++) {
        if (pixels[(py * probe.width + px) * 4 + 3] > 90) { minX = Math.min(minX, px); maxX = Math.max(maxX, px); top = Math.min(top, py); bottom = Math.max(bottom, py); }
      }
      if (maxX <= minX) return;
      const cropHeight = (bottom - top) * .5, cropWidth = maxX - minX;
      const scale = Math.min((width - 16) / cropWidth, (height - 12) / cropHeight);
      c.save(); c.beginPath(); c.rect(x, y, width, height); c.clip(); c.clearRect(x, y, width, height);
      c.translate(x + width / 2, y + height - 4);
      if (flip) c.scale(-1, 1);
      c.drawImage(image, minX, top, cropWidth, cropHeight, -cropWidth * scale / 2, -cropHeight * scale, cropWidth * scale, cropHeight * scale);
      c.restore();
      texture.needsUpdate = true;
      cells.forEach(view => { view.needsUpdate = true; });
    },
    dispose() { cells.forEach(view => view.dispose()); texture.dispose(); },
  };
}

// The painted Krkonoše ridge seen beyond the open meadow: sky, the long ridge
// with Sněžka's cone, dwarf-pine bands, snowfields, and a forest edge below.
export function createRidgeTexture() {
  const canvas = document.createElement('canvas'); canvas.width = 2048; canvas.height = 512;
  const c = canvas.getContext('2d');
  c.fillStyle = gradient(c, 0, 0, 0, 300, ['#f3ead2', '#dfe6dc', '#c9d8d6']); c.fillRect(0, 0, 2048, 512);
  for (let i = 0; i < 7; i++) ellipse(c, 160 + i * 300, 60 + Math.sin(i * 2) * 26, 150, 22, '#fffaf055');
  const ridge = (points, fill) => {
    c.beginPath(); c.moveTo(0, 512); points.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(2048, 512); c.closePath();
    c.fillStyle = fill; c.fill();
  };
  // Far ridge: a long, rounded crest rising to Sněžka near the center.
  const far = [];
  for (let x = 0; x <= 2048; x += 16) {
    const peak = Math.exp(-(((x - 1180) / 120) ** 2)) * 118 + Math.exp(-(((x - 1180) / 300) ** 2)) * 40;
    const hills = Math.sin(x / 210) * 14 + Math.sin(x / 90 + 1) * 6 + Math.exp(-(((x - 520) / 260) ** 2)) * 46;
    far.push([x, 236 - peak - hills]);
  }
  ridge(far, gradient(c, 0, 90, 0, 330, ['#a7b6bd', '#94a7ad', '#87999a']));
  // Snowfields and dwarf-pine bands on the upper slopes.
  c.save(); c.beginPath(); c.moveTo(0, 512); far.forEach(([x, y]) => c.lineTo(x, y)); c.lineTo(2048, 512); c.closePath(); c.clip();
  for (let i = 0; i < 26; i++) {
    const x = (i * 157) % 2048, y = far[Math.floor(x / 16)][1];
    ellipse(c, x + 20, y + 16 + (i % 3) * 7, 40 + (i % 4) * 14, 6, '#eef3f2b0', -.08);
  }
  for (let band = 0; band < 3; band++) for (let x = 0; x < 2048; x += 7) {
    const y = far[Math.floor(x / 16)][1] + 46 + band * 18 + Math.sin(x / 37 + band) * 6;
    ellipse(c, x, y, 6, 3.2, band === 1 ? '#6f857a90' : '#7b8f8480');
  }
  c.restore();
  // A middle shoulder and the forest edge in front.
  const middle = [];
  for (let x = 0; x <= 2048; x += 16) middle.push([x, 300 + Math.sin(x / 260 + 2) * 22 + Math.sin(x / 70) * 5]);
  ridge(middle, gradient(c, 0, 270, 0, 400, ['#8aa293', '#7b9585']));
  for (let x = -10; x < 2060; x += 15) {
    const base = 372 + Math.sin(x / 140) * 10, h = 40 + Math.abs(Math.sin(x * 1.37)) * 34;
    shape(c, [[x - 12, base + 24], [x, base - h], [x + 12, base + 24]], x % 2 ? '#5d7a63' : '#526f5b');
  }
  c.fillStyle = gradient(c, 0, 380, 0, 512, ['#61805f', '#6f8c61', '#7a946a']); c.fillRect(0, 392, 2048, 120);
  for (let x = 0; x < 2048; x += 9) shape(c, [[x - 7, 420], [x, 384 - Math.abs(Math.sin(x * 2.1)) * 26], [x + 7, 420]], '#4f6d55');
  // Haze softens the far ridge into the distance.
  c.fillStyle = gradient(c, 0, 0, 0, 512, ['#ffffff00', '#f4f6f018', '#f4f6f030', '#ffffff00']); c.fillRect(0, 0, 2048, 512);
  // The painted meadow at the foot fades out, so the real ground meets the forest edge softly.
  c.globalCompositeOperation = 'destination-out';
  c.fillStyle = gradient(c, 0, 432, 0, 512, ['#00000000', '#000000ff']); c.fillRect(0, 432, 2048, 80);
  c.globalCompositeOperation = 'source-over';
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.MirroredRepeatWrapping;
  return texture;
}
