import * as THREE from 'three';

// Each illustration is drawn here, so the game carries no borrowed artwork.
const ink = '#283f38';

function texture(width, height, paint) {
  const canvas = document.createElement('canvas');
  // Higher resolution keeps ink and embroidery crisp without large image files.
  canvas.width = width * 1.5;
  canvas.height = height * 1.5;
  const ctx = canvas.getContext('2d');
  ctx.scale(1.5, 1.5);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  paint(ctx, width, height);
  // A restrained paper grain belongs to the painted shapes, never their surround.
  ctx.globalCompositeOperation = 'source-atop';
  for (let i = 0; i < 650; i++) {
    const x = (Math.sin(i * 127.1 + width) * 43758.5453) % 1;
    const y = (Math.sin(i * 269.5 + height) * 43758.5453) % 1;
    ctx.fillStyle = i % 3 ? '#213d3510' : '#fff2d716';
    ctx.fillRect(Math.abs(x) * width, Math.abs(y) * height, .7, .7);
  }
  ctx.globalCompositeOperation = 'source-over';
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  map.minFilter = THREE.LinearMipmapLinearFilter;
  map.magFilter = THREE.LinearFilter;
  return map;
}

function ellipse(c, x, y, rx, ry, color, rotation = 0) {
  c.fillStyle = color;
  c.beginPath();
  c.ellipse(x, y, rx, ry, rotation, 0, Math.PI * 2);
  c.fill();
}

function shape(c, points, color) {
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(...points[0]);
  points.slice(1).forEach(p => c.lineTo(...p));
  c.closePath();
  c.fill();
}

function line(c, points, color, width = 3) {
  c.strokeStyle = color;
  c.lineWidth = width;
  c.beginPath();
  c.moveTo(...points[0]);
  points.slice(1).forEach(p => c.lineTo(...p));
  c.stroke();
}

function gradient(c, x0, y0, x1, y1, colors) {
  const fill = c.createLinearGradient(x0, y0, x1, y1);
  colors.forEach((color, i) => fill.addColorStop(i / (colors.length - 1), color));
  return fill;
}

// Broad washes and an inked underside give form without a glossy plastic highlight.
function volume(c, x, y, rx, ry, light, base, dark, rotation = 0) {
  c.save(); c.translate(x, y); c.rotate(rotation); c.scale(rx, ry);
  const fill = c.createLinearGradient(-.75, -.9, .8, 1);
  fill.addColorStop(0, light); fill.addColorStop(.3, base); fill.addColorStop(1, dark);
  ellipse(c, 0, 0, 1, 1, fill);
  c.restore();
}

function leaf(c, x, y, length, width, angle, color, vein = '#d1d5a666') {
  c.save(); c.translate(x, y); c.rotate(angle);
  c.fillStyle = color; c.beginPath(); c.moveTo(0, 0);
  c.bezierCurveTo(-width, -length * .35, -width * .6, -length * .8, 0, -length);
  c.bezierCurveTo(width * .7, -length * .65, width, -length * .15, 0, 0); c.fill();
  line(c, [[0, 0], [0, -length * .87]], vein, .8);
  c.restore();
}

function embroidery(c, x, y, color, size = 3) {
  for (let p = 0; p < 4; p++) {
    const angle = p * Math.PI / 2;
    line(c, [[x + Math.cos(angle) * size, y + Math.sin(angle) * size], [x, y]], color, 1.3);
  }
  ellipse(c, x, y, 1, 1, '#b79557');
}

function paintPath(c, d, fill, stroke, width = 1) {
  const path = new Path2D(d);
  if (fill) { c.fillStyle = fill; c.fill(path); }
  if (stroke) { c.strokeStyle = stroke; c.lineWidth = width; c.stroke(path); }
}

function hand(c, x, y, angle, skin, grip = false, scale = 1) {
  c.save(); c.translate(x, y); c.rotate(angle); c.scale(scale, scale);
  paintPath(c, grip
    ? 'M-3 0 Q-5 5 -4 10 Q-3 15 1 14 Q6 14 6 10 L5 6 Q10 3 7 1 Q5 0 3 5 L3 0Z'
    : 'M-3 0 Q-3 4 -5 7 L-4 15 Q-3 18 -2 14 L-1 17 Q0 20 1 16 L2 17 Q3 19 4 15 L4 8 Q9 4 7 2 Q6 1 3 5 L3 0Z',
    skin, '#a776603c', .7);
  if (grip) for (let i = 0; i < 3; i++) line(c, [[-2, 7 + i * 2], [3, 8 + i * 2]], '#aa765e', .65);
  else { line(c, [[-2, 9], [-2, 14]], '#b6856966', .7); line(c, [[1, 10], [1, 15]], '#b6856966', .7); }
  c.restore();
}

function eye(c, x, y, size = 1, color = '#526f62') {
  c.save(); c.translate(x, y); c.scale(size, size);
  paintPath(c, 'M-4 0 Q0 -3.6 4 0 Q0 2.8 -4 0Z', '#f5e6d0');
  ellipse(c, .6, -.1, 1.8, 2, color); ellipse(c, .9, 0, .8, 1.25, '#263d35');
  ellipse(c, 1, -.8, .55, .55, '#fff4df');
  paintPath(c, 'M-4 0 Q0 -3.6 4 0', null, '#554535', 1.1);
  c.restore();
}

function basket(c, x = 141, y = 188) {
  c.save(); c.translate(x, y);
  paintPath(c, 'M-18 0 C-20 -39 21 -41 22 -2', null, '#6e4c32', 4);
  paintPath(c, 'M-17 0 C-18 -36 19 -38 21 -2', null, '#d7b476', 1.4);
  paintPath(c, 'M-24 -2 Q0 -9 24 -3 L18 28 Q0 38 -18 29Z', gradient(c, -23, 0, 24, 28, ['#d3aa6a', '#b38a52', '#765236']), '#775934', 1.2);
  ellipse(c, 0, -2, 23, 5, '#7d5733');
  for (let i = 0; i < 5; i++) paintPath(c, `M${-21 + i} ${6 + i * 5} Q0 ${12 + i * 5} ${22 - i} ${5 + i * 5}`, null, '#e1bd806b', 1.4);
  for (let x = -16; x < 20; x += 6) paintPath(c, `M${x} 2 Q${x - 2} 18 ${x * .75} 30`, null, '#74563280', .9);
  c.restore();
}

function hana(frame, transformed = false) {
  return texture(192, 320, c => {
    const step = [0, 9, 0, -9][frame], swing = step * .22;
    const skirt = transformed ? ['#fff2db', '#e6dcc3', '#b1b7a1'] : ['#77adb6', '#3d7d93', '#24576c'];
    // The weight rests on one foot, with shaped boots instead of round pads.
    paintPath(c, `M78 250 Q77 273 ${76 - step} 292 L${87 - step} 299 L95 255Z`, '#706f59');
    paintPath(c, `M106 249 Q109 275 ${115 + step} 293 L${126 + step} 294 L122 248Z`, '#555b4b');
    paintPath(c, `M${75 - step} 284 L${86 - step} 286 Q${85 - step} 298 ${97 - step} 301 Q${101 - step} 309 ${87 - step} 309 L${64 - step} 308 Q${61 - step} 302 ${70 - step} 295Z`, '#384d45');
    paintPath(c, `M${115 + step} 284 L${125 + step} 284 L${128 + step} 298 Q${142 + step} 300 ${141 + step} 307 Q${133 + step} 311 ${112 + step} 308 Q${109 + step} 297 ${115 + step} 284Z`, '#344940');
    line(c, [[68 - step, 305], [95 - step, 306]], '#8b97806b', 1.3);
    line(c, [[117 + step, 294], [124 + step, 294]], '#9ca68a', 1.3);
    // Broad folds change the outer contour, rather than drawing seams over a cone.
    paintPath(c, `M76 165 Q93 174 115 162 C120 196 127 233 ${139 + swing} 268 Q120 276 105 268 Q83 279 ${58 - swing} 267 Q68 224 76 165Z`, gradient(c, 58, 180, 139, 245, skirt), '#31556155', 1.1);
    paintPath(c, 'M83 175 C81 208 73 240 70 266 Q80 270 83 270 C87 233 87 206 92 179Z', skirt[2] + '70');
    paintPath(c, 'M109 173 C111 205 119 244 127 269 L135 268 C127 230 119 205 116 174Z', skirt[2] + '65');
    paintPath(c, 'M96 184 C92 217 90 246 90 269 Q98 272 103 268 C104 238 104 213 108 180Z', skirt[0] + '6b');
    paintPath(c, 'M62 261 Q82 270 99 266 Q119 273 134 262', null, transformed ? '#a45345' : '#c4dbce', 3);
    // The gathered blouse has softly angular shoulders, elbows, and a fitted waist.
    paintPath(c, 'M87 106 Q76 106 67 115 C56 125 60 146 62 155 L74 158 L77 144 Q74 164 77 177 Q96 186 117 174 L121 143 L129 153 L141 148 C134 117 121 111 107 108Z', gradient(c, 63, 113, 122, 177, ['#f7ebcd', '#e5d6b7', '#b7b59a']), '#8a927252', 1);
    paintPath(c, 'M70 116 Q60 131 65 151 L73 151 Q70 135 78 121Z', '#fff2d480');
    paintPath(c, 'M116 114 Q130 127 132 143 L140 147 Q134 120 120 114Z', '#9d9e8150');
    for (const d of ['M65 141 Q70 147 74 142', 'M79 150 Q85 166 91 173', 'M107 133 Q114 151 112 168', 'M123 132 Q127 140 134 141']) paintPath(c, d, null, '#9b9b7e', 1.2);
    // Forearms taper into wrists, and the basket arm bends towards her hip.
    paintPath(c, `M63 150 Q65 159 ${60 + swing} 174 Q${57 + swing} 185 ${61 + swing} 190 L${67 + swing} 188 Q${65 + swing} 182 ${70 + swing} 170 Q76 158 74 151Z`, gradient(c, 59, 151, 74, 185, ['#f1c5a4', '#d8aa8b', '#bb876c']));
    hand(c, 63 + swing, 185, -.06, '#e1b18e');
    paintPath(c, 'M129 146 Q130 155 140 164 Q148 166 147 176 L140 179 Q141 174 135 171 Q122 159 120 151Z', gradient(c, 121, 146, 146, 175, ['#f1c5a4', '#d6a083']));
    basket(c, 146, 187);
    hand(c, 145, 168, -.5, '#e5b795', true, 1.05);
    paintPath(c, 'M78 174 Q96 177 116 171 L118 179 Q96 186 77 180Z', transformed ? '#a35548' : '#98674d');
    paintPath(c, 'M85 181 Q97 188 109 181 C113 207 113 235 122 249 Q96 261 73 248 C76 226 80 203 85 181Z', gradient(c, 75, 183, 121, 249, ['#f8eacb', '#e6d8b6', '#bdb99a']), '#a2a18477', .8);
    paintPath(c, 'M87 188 C85 208 83 229 80 246 M107 189 Q111 216 115 244', null, '#fcf2d99c', 1.5);
    for (let y = 205; y < 242; y += 9) { embroidery(c, 86, y, transformed ? '#ab5447' : '#5d7c70', 2.8); embroidery(c, 110, y - 3, transformed ? '#ab5447' : '#5d7c70', 2.8); }
    paintPath(c, 'M81 239 Q97 247 116 239', null, transformed ? '#aa5749' : '#708775', 1.5);
    for (let x = 73; x < 132; x += 9) embroidery(c, x, 264 + Math.sin(x * .05) * 2, transformed ? '#a45345' : '#c7dbce', 2.3);
    // A shaped jaw, a three-quarter view, and a warm half-smile read as an adult.
    paintPath(c, 'M90 94 L90 111 Q94 120 104 114 L108 91Z', '#c89575');
    paintPath(c, 'M75 53 C73 33 91 28 108 36 C124 43 125 61 119 77 L112 99 Q94 111 79 91Z', '#624832');
    paintPath(c, 'M88 44 C99 38 113 45 115 57 L116 65 Q120 70 124 73 Q126 76 117 79 L116 86 C114 96 105 103 98 103 Q89 101 85 92 L81 75 Q78 65 82 57Z', gradient(c, 83, 54, 119, 90, ['#f4c7a2', '#deb08d', '#b9866d']), '#ab7a644d', .8);
    paintPath(c, 'M86 51 Q94 47 96 46 Q89 59 86 74 L80 72 Q78 57 86 51Z', '#76533a');
    paintPath(c, 'M85 73 Q78 66 77 76 Q77 86 85 85', '#d3a17e', '#a3765b', .9);
    paintPath(c, 'M80 75 Q84 73 82 81', null, '#9c6f56', .9);
    eye(c, 99, 68, .93); eye(c, 113, 68, .63);
    paintPath(c, 'M94 61 Q99 58 104 61 M110 62 Q113 60 116 63', null, '#75543f', 1.5);
    paintPath(c, 'M109 69 Q106 77 109 79 Q113 81 116 78', null, '#ac795f', .95);
    ellipse(c, 116, 77, 1.3, .7, '#96654f');
    ellipse(c, 98, 79, 7, 3, '#c9877355', -.15);
    paintPath(c, 'M103 87 Q108 91 114 86', null, '#955b52', 1.4);
    paintPath(c, 'M105 91 Q109 93 112 91', null, '#ecc6a2', 1.1);
    // A loosely tied scarf wraps around the head. Curved braid sections overlap.
    paintPath(c, 'M73 59 C69 44 76 32 90 30 Q112 24 120 45 L122 56 Q105 44 91 52 Q78 53 73 59Z', gradient(c, 74, 31, 117, 62, ['#dc8b6a', '#b95445', '#8d3c37']), '#8f493838', .8);
    paintPath(c, 'M72 59 Q64 66 56 76 Q65 78 73 72 L65 97 Q79 91 83 67Z', '#a84b40');
    paintPath(c, 'M76 61 Q76 80 69 86 Q63 91 61 103 Q76 99 83 86 L87 65Z', '#bd6250');
    paintPath(c, 'M79 42 Q94 31 110 40 M79 58 Q96 48 115 53', null, '#efaa7d9c', 1.4);
    for (const [x, y] of [[87, 39], [100, 36], [111, 42], [76, 76]]) embroidery(c, x, y, '#ead1a0', 2);
    for (let i = 0; i < 6; i++) {
      const y = 88 + i * 9, x = 83 - Math.sin(i * .5) * 7;
      paintPath(c, `M${x} ${y - 5} Q${x - 12} ${y - 1} ${x - 5} ${y + 7} Q${x + 4} ${y + 8} ${x + 6} ${y}Z`, i % 2 ? '#755036' : '#8d613e');
      paintPath(c, `M${x - 6} ${y} Q${x} ${y + 2} ${x + 3} ${y - 1}`, null, '#bd8a5685', 1.4);
    }
    line(c, [[78, 137], [82, 139]], '#c77355', 3);
    paintPath(c, 'M87 114 Q95 125 107 114 M91 128 Q96 130 101 127', null, '#a99b7c', 1.4);
    if (transformed) {
      for (const x of [76, 86, 97, 108, 120, 131]) { embroidery(c, x, 255 + Math.sin(x) * 2, '#a45345', 3.2); }
      paintPath(c, 'M69 40 Q90 15 117 34', null, '#758b50', 3);
      for (const [x, y, angle] of [[72, 32, -.65], [83, 21, -.3], [98, 18, .1], [111, 25, .4], [121, 37, .65]]) {
        leaf(c, x, y + 5, 17, 5, angle - .5, '#8f9b5a'); leaf(c, x, y + 5, 16, 4, angle + .5, '#afad68');
        line(c, [[x, y + 4], [x + Math.sin(angle) * 9, y - 10]], '#bd9b4b', 1.5);
        for (let n = 0; n < 3; n++) { ellipse(c, x - 2 + Math.sin(angle) * n * 3, y - n * 4, 2, 3.5, '#d8ba68', angle - .4); ellipse(c, x + 3 + Math.sin(angle) * n * 3, y - n * 4 - 2, 2, 3.5, '#edcd7d', angle + .4); }
      }
      for (const [x, y] of [[75, 29], [92, 20], [114, 31]]) { for (let n = 0; n < 5; n++) ellipse(c, x + Math.cos(n * 1.256) * 3, y + Math.sin(n * 1.256) * 3, 3, 2, '#f7eaca', n); ellipse(c, x, y, 2, 2, '#bc9350'); }
    }
  });
}

function john() {
  return texture(192, 320, c => {
    // Relaxed weight, a bent arm, rolled sleeves, and tailored rather than boxy clothes.
    paintPath(c, 'M74 207 Q71 248 75 286 L89 287 Q88 263 95 234 L103 220Z', gradient(c, 71, 213, 98, 280, ['#8b8668', '#676d56', '#4a5748']));
    paintPath(c, 'M100 219 Q101 246 112 288 L126 286 Q123 257 125 204Z', '#5c6550');
    paintPath(c, 'M76 281 L89 282 L91 297 Q100 303 94 308 L63 308 Q57 303 70 295Z', '#354b41');
    paintPath(c, 'M112 280 L124 279 L130 295 Q146 298 143 306 Q129 312 107 307 Q103 301 112 280Z', '#30463d');
    paintPath(c, 'M77 224 Q78 249 78 273 M117 225 Q113 253 120 274', null, '#a6a08180', 1.5);
    paintPath(c, 'M80 109 Q69 110 60 120 C53 135 54 151 58 167 L73 170 L77 148 L77 210 Q98 221 125 207 L126 150 L133 164 L146 158 Q143 123 122 114 L108 107Z', gradient(c, 65, 116, 132, 199, ['#c7c6a0', '#95a382', '#657f65']), '#506a5355', 1);
    paintPath(c, 'M58 148 Q65 145 75 150 L74 162 Q67 167 59 162Z', '#d1cfaa');
    paintPath(c, 'M126 147 Q134 143 141 149 L144 159 Q134 165 127 159Z', '#c5c6a1');
    paintPath(c, 'M59 163 Q58 173 59 184 Q64 194 77 191 L79 184 Q66 186 68 177 L70 165Z', '#d5a383');
    hand(c, 78, 184, -.7, '#e5b592', true);
    paintPath(c, 'M135 161 Q134 179 144 187 L139 193 Q127 185 124 166Z', '#d2a07f');
    hand(c, 141, 188, .23, '#ddb08b');
    paintPath(c, 'M82 111 L94 127 Q93 160 93 206 Q80 218 70 212 L74 150 Q69 121 82 111Z', gradient(c, 72, 118, 92, 210, ['#917456', '#69523f']), '#534c393b', 1);
    paintPath(c, 'M109 111 Q120 115 122 143 L130 207 Q117 216 104 208 L99 126Z', gradient(c, 103, 119, 127, 205, ['#ac8b62', '#7b6248']));
    paintPath(c, 'M84 115 L91 129 L80 145 M108 115 L103 130 L116 145', null, '#c2a378', 1.6);
    paintPath(c, 'M80 167 Q84 170 89 168 L88 185 Q83 190 77 187Z', '#a18a60', '#cfb68a', 1);
    for (const y of [146, 166, 187]) ellipse(c, 98, y, 1.8, 2, '#cfb079');
    paintPath(c, 'M98 97 L96 113 Q99 122 108 116 L114 96Z', '#c59473');
    paintPath(c, 'M76 55 C73 40 82 28 96 28 C117 23 128 43 122 62 L119 85 Q107 109 90 99 Q78 91 76 55Z', '#624830');
    paintPath(c, 'M86 47 Q103 38 117 49 L117 62 Q120 70 125 74 Q125 78 118 79 L119 87 Q116 99 105 105 Q94 103 86 96 L80 74Z', gradient(c, 82, 48, 122, 100, ['#efc4a0', '#d5a383', '#ac7c64']), '#9f725d40', .8);
    paintPath(c, 'M79 69 Q71 61 73 77 Q75 86 82 83', '#c99977', '#9d7058', 1);
    paintPath(c, 'M75 72 Q80 68 78 80', null, '#976d53', 1);
    paintPath(c, 'M77 63 C72 49 81 31 99 29 Q119 27 127 50 C115 48 111 39 104 42 Q89 52 83 52 L81 76Z', '#624b35');
    for (const d of ['M82 42 Q97 30 113 37', 'M82 48 Q96 42 100 35', 'M108 38 Q114 43 121 45']) paintPath(c, d, null, '#af865c80', 1.3);
    paintPath(c, 'M85 85 Q93 88 101 91 Q109 94 119 86 Q119 101 106 109 Q92 106 85 96Z', '#79583e');
    for (let n = 0; n < 10; n++) paintPath(c, `M${88 + n * 2.7} ${93 + Math.sin(n) * 2} L${92 + n * 2.1} ${103 + Math.sin(n) * 2}`, null, '#b38a5f88', 1);
    eye(c, 100, 66, .93, '#4f706a'); eye(c, 114, 66, .62, '#4f706a');
    paintPath(c, 'M94 59 Q100 56 105 60 M111 59 Q115 58 118 62', null, '#644b36', 1.8);
    paintPath(c, 'M110 69 Q106 77 111 79 L117 77', null, '#a3745a', 1);
    ellipse(c, 117, 77, 1.4, .7, '#805c47');
    paintPath(c, 'M103 90 Q108 94 115 89', null, '#d2a484', 1.7);
    paintPath(c, 'M93 78 Q98 80 102 78', null, '#a37b6266', .8);
    paintPath(c, 'M97 115 L91 123 L98 131 L105 122 L110 116', null, '#e4dbb8', 1.4);
    line(c, [[70, 303], [92, 304]], '#81907a', 1.3);
  });
}

function aldoCot() {
  return texture(384, 300, c => {
    // Aldo lies on his back on a flat mattress, inside a cot with raised rails.
    const wood = gradient(c, 70, 90, 310, 270, ['#e0c391', '#b58c58', '#886d49']);
    for (const x of [58, 315]) line(c, [[x, 99], [x, 285]], '#9b7d54', 12);
    shape(c, [[56, 126], [288, 100], [330, 161], [96, 192]], '#b49364');
    shape(c, [[64, 136], [285, 112], [319, 160], [99, 185]], '#eee6cc');
    line(c, [[73, 139], [284, 117], [308, 156]], '#fff5dd', 4);
    // A fitted sleeper follows the baby's bent knees and relaxed little arms.
    paintPath(c, 'M163 143 Q178 132 199 137 Q216 125 233 134 L261 143 Q276 155 260 171 L233 174 Q215 181 196 171 L176 172 Q161 164 163 143Z', gradient(c, 165, 134, 258, 170, ['#f2e5c5', '#d8d1ad', '#b7b799']), '#b7b49366', .8);
    paintPath(c, 'M219 139 Q224 152 239 155 L259 155 M206 151 Q217 157 218 170 M174 144 Q184 152 189 160', null, '#9eaa8c90', 1.2);
    paintPath(c, 'M128 132 C137 119 157 125 166 139 Q173 157 161 169 Q146 180 130 170 C119 159 119 143 128 132Z', gradient(c, 127, 133, 162, 165, ['#f0c7a5', '#dfad8c', '#b8896b']), '#b5886c44', .8);
    paintPath(c, 'M158 151 Q171 149 167 157 Q161 164 157 158Z', '#d6a381');
    paintPath(c, 'M127 135 Q139 125 150 131 M131 133 Q140 127 146 131', null, '#9a7653', 2);
    paintPath(c, 'M129 151 Q134 155 139 151 M146 150 Q151 154 155 150', null, '#76654e', 1.25);
    paintPath(c, 'M141 153 Q138 159 143 159', null, '#b77f64', .8);
    paintPath(c, 'M137 164 Q142 168 148 163', null, '#ae725c', 1.1);
    ellipse(c, 130, 160, 4, 2, '#cc8e7666');
    paintPath(c, 'M177 146 Q169 139 160 144 L162 150 Q170 148 175 156Z', '#e2b48f');
    hand(c, 159, 143, -1.35, '#e6ba97', true, .62);
    paintPath(c, 'M177 159 Q171 164 178 169 Q185 173 192 168', '#e4b895', '#ba967880', .8);
    for (const x of [102, 146, 190, 234, 278, 322]) line(c, [[x, 173 - (x - 102) * .11], [x, 252 - (x - 102) * .11]], wood, 8);
    line(c, [[94, 181], [331, 155]], wood, 13);
    line(c, [[94, 255], [331, 229]], wood, 12);
    line(c, [[58, 126], [95, 182]], wood, 12);
    line(c, [[58, 208], [95, 254]], wood, 12);
    for (const [x, y] of [[58, 103], [95, 157], [315, 78], [332, 131]]) volume(c, x, y, 8, 9, '#efd6a2', '#c5a06c', '#92734d');
    line(c, [[97, 179], [329, 153]], '#f1d7a7', 3);
  });
}

function fir(variant = 0) {
  return texture(320, 480, c => {
    const colors = [
      ['#83a67b', '#426e60', '#21483f'],
      ['#b0ba7b', '#647e59', '#304e3e'],
      ['#8cb3a0', '#517f70', '#294e49'],
    ][variant % 3];
    shape(c, [[151, 287], [166, 285], [172, 471], [145, 475]], gradient(c, 144, 300, 174, 440, ['#af9065', '#735c45', '#423f35']));
    for (let i = 0; i < 9; i++) line(c, [[151 + i % 3 * 5, 353 + i * 12], [148 + i % 3 * 5, 389 + i * 9]], '#d2ae7666', 1.3);
    // Separate branches keep daylight between the ragged, layered needle fans.
    for (let tier = 0; tier < 11; tier++) {
      const y = 45 + tier * 32 + Math.sin(tier * 2.1 + variant) * 5, spread = 14 + tier * 11;
      for (const side of [-1, 1]) {
        const span = spread * (1 + Math.sin(tier * 1.8 + side + variant) * .1);
        line(c, [[160, y - 13], [160 + side * span * .56, y + 27], [160 + side * span, y + 47]], '#3e5140', 4);
        const points = [[160, y - 21], [160 + side * span * .3, y + 1]];
        for (let n = 1; n <= 12; n++) {
          const x = 160 + side * (span * n / 12);
          points.push([x - side * 4, y + 12 + n * 1.8], [x + side * (5 + Math.sin(n * 2) * 2), y + 30 + n * 1.6]);
        }
        points.push([160 + side * span * .6, y + 51], [160 + side * span * .29, y + 43], [160, y + 32]);
        shape(c, points, gradient(c, 160 - span, y, 160 + span, y + 60, colors));
        for (let n = 0; n < 8; n++) {
          const x = 160 + side * (12 + n * span / 9), by = y + 17 + n * 3.3;
          line(c, [[x, by - 10], [x - side * 8, by + 8], [x + side * 10, by + 4]], n % 3 ? colors[0] + '70' : '#d5d7a560', 1.4);
          line(c, [[x + side * 5, by + 11], [x + side * 14, by + 15]], '#183c3755', 1.3);
        }
      }
    }
    line(c, [[159, 11], [160, 72]], colors[1], 3);
    for (let i = 0; i < 5; i++) line(c, [[160, 20 + i * 9], [151 - i * 2, 38 + i * 9]], colors[0], 1.7);
    for (const x of [139, 153, 169, 181]) leaf(c, x, 479, 17, 4, (x - 160) * .04, '#67845b');
  });
}

function birch(variant) {
  return texture(320, 480, c => {
    const seed = n => Math.abs(Math.sin(n * 117.3 + variant * 14.7));
    // Long visible branches and pointed leaves avoid a cloud-shaped canopy.
    const branches = [[158, 380, 95, 252, 51, 155], [156, 304, 214, 194, 264, 113], [157, 243, 129, 149, 112, 62], [160, 218, 183, 106, 203, 43]];
    for (let i = 0; i < 44; i++) {
      const angle = i * 2.399, r = 18 + seed(i) * 119;
      const x = 158 + Math.cos(angle) * r, y = 147 + Math.sin(angle) * r * .92;
      shape(c, [[x - 25, y + 18], [x - 34, y - 2], [x - 21, y - 24], [x + 6, y - 32], [x + 31, y - 13], [x + 27, y + 13], [x + 5, y + 27]], i % 3 ? '#738b56' : '#a1ac65');
    }
    shape(c, [[150, 142], [163, 140], [162, 345], [176, 474], [143, 475], [150, 330]], gradient(c, 144, 260, 173, 340, ['#e5dfbe', '#c6caae', '#7d917b']));
    line(c, [[155, 152], [154, 331], [150, 465]], '#f8efd680', 3);
    for (const [x0, y0, x1, y1, x2, y2] of branches) {
      line(c, [[x0, y0], [x1, y1], [x2, y2]], '#a7b7a0', 7);
      line(c, [[x0 - 2, y0], [x1 - 2, y1], [x2 - 2, y2]], '#ede8cb', 2.3);
      for (let i = 1; i < 5; i++) {
        const t = i / 5, x = x1 + (x2 - x1) * t, y = y1 + (y2 - y1) * t;
        line(c, [[x, y], [x + (i % 2 ? 23 : -23), y - 26]], '#b0bda0', 2);
      }
    }
    for (let i = 0; i < 13; i++) {
      const y = 204 + i * 20;
      line(c, i % 2 ? [[146, y], [155, y + 2], [159, y + 1]] : [[162, y], [171, y - 2]], '#435c4b', 2.5);
      line(c, [[149 + i % 3 * 6, y + 7], [153 + i % 3 * 6, y + 8]], '#768875', 1);
    }
    for (let i = 0; i < 220; i++) {
      const angle = i * 2.399, r = 12 + seed(i + 14) * 122;
      const x = 158 + Math.cos(angle) * r, y = 140 + Math.sin(angle) * r * .96;
      leaf(c, x, y, 14 + seed(i + 17) * 10, 5 + seed(i + 12) * 3, angle + .4,
        ['#b8c580', '#d0d494', '#91aa6e', '#82995d', '#c1c785'][i % 5]);
    }
    for (let i = 0; i < 8; i++) leaf(c, 153 + i * 3, 472, 24, 7, (i - 4) * .2, '#567655');
  });
}

function fern() {
  return texture(256, 208, c => {
    for (let frond = 0; frond < 9; frond++) {
      const angle = (frond - 4) * .24, length = 82 + Math.sin(frond * 1.7) * 29;
      c.save(); c.translate(128, 202); c.rotate(angle);
      c.strokeStyle = '#779369'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(0, 0); c.quadraticCurveTo(-4, -length * .5, 0, -length * 1.55); c.stroke();
      for (let n = 1; n < 11; n++) {
        const y = -n * length * .13, l = 26 * Math.sin(n / 11 * Math.PI);
        for (const side of [-1, 1]) leaf(c, 0, y, l, 4 + l * .08, side * 1.05, ['#426b51', '#73985f', '#96ac71'][frond % 3]);
      }
      c.restore();
    }
  });
}

function grasses() {
  return texture(224, 168, c => {
    for (let i = 0; i < 31; i++) {
      const x = 26 + i * 5.5, height = 22 + Math.abs(Math.sin(i * 2.7)) * 88;
      c.strokeStyle = ['#607e51', '#8eaa68', '#b0ba75', '#496c4c'][i % 4]; c.lineWidth = i % 3 ? 2 : 3;
      c.beginPath(); c.moveTo(x, 164); c.quadraticCurveTo(x + Math.sin(i) * 22, 164 - height * .6, x + Math.sin(i) * 32, 164 - height); c.stroke();
      if (i % 6 === 0) {
        line(c, [[x, 151], [x + 7, 84]], '#8f9560', 1.5);
        for (let n = 0; n < 5; n++) ellipse(c, x + 7 + Math.sin(n) * 2, 80 + n * 5, 2, 4, '#c8b98b', .3);
      }
    }
  });
}

function stone() {
  return texture(256, 176, c => {
    shape(c, [[24, 147], [38, 83], [80, 43], [149, 32], [212, 72], [235, 134], [195, 161], [91, 166]], '#526960');
    shape(c, [[38, 83], [80, 43], [149, 32], [163, 88], [104, 105]], '#a7b0a1');
    shape(c, [[163, 88], [149, 32], [212, 72], [235, 134], [186, 125]], '#82998c');
    shape(c, [[38, 83], [104, 105], [91, 166], [24, 147]], '#74877b');
    shape(c, [[104, 105], [163, 88], [186, 125], [195, 161], [91, 166]], '#658073');
    line(c, [[80, 47], [107, 55], [142, 39]], '#d9dac070', 2);
    line(c, [[102, 108], [112, 128], [104, 155]], '#38594d80', 1.5);
    for (let i = 0; i < 20; i++) {
      const x = 49 + i * 7, y = 82 + Math.sin(i * 2.8) * 18;
      leaf(c, x, y, 8 + i % 3 * 3, 5, i * .7, ['#718756', '#9ca46a', '#b5b47b'][i % 3], '#c5cba066');
    }
    for (const [x, y] of [[75, 119], [190, 89], [140, 134], [66, 146]]) {
      line(c, [[x, y], [x + 4, y - 3]], '#c6cbae55', 1);
    }
  });
}

function stump() {
  return texture(224, 216, c => {
    shape(c, [[57, 62], [161, 58], [169, 171], [191, 198], [143, 191], [117, 207], [88, 192], [33, 202], [56, 161]], gradient(c, 46, 76, 169, 168, ['#a3885d', '#746344', '#424c36']));
    for (let i = 0; i < 12; i++) {
      const x = 58 + i * 9;
      line(c, [[x, 82], [x + Math.sin(i) * 5, 146], [x + Math.sin(i * 2) * 7, 183]], i % 2 ? '#c6a47477' : '#4d503588', 2);
    }
    ellipse(c, 109, 65, 59, 22, '#c4ac7b', -.04);
    for (const radius of [11, 24, 39, 53]) {
      c.strokeStyle = '#8f7953'; c.lineWidth = 1.7; c.beginPath(); c.ellipse(109, 65, radius, radius * .34, -.04, 0, Math.PI * 2); c.stroke();
    }
    line(c, [[79, 49], [101, 64], [142, 76]], '#766448', 2);
    for (let i = 0; i < 8; i++) leaf(c, 151 + i * 4, 191, 26, 7, (i - 4) * .24, '#5f8354');
    for (const [x, y] of [[61, 117], [47, 140], [160, 130]]) {
      ellipse(c, x, y, 12, 5, '#c3b088'); line(c, [[x - 10, y], [x + 9, y - 1]], '#e2d1a8', 1);
    }
  });
}

function flowers(kind) {
  return texture(192, 160, c => {
    const positions = [[31, 80], [63, 40], [103, 77], [139, 47], [162, 99]];
    for (let i = 0; i < positions.length; i++) {
      const [x, y] = positions[i];
      if (kind === 'mushrooms') {
        shape(c, [[x - 5, 151], [x - 3, y + 12], [x + 5, y + 11], [x + 10, 150]], '#ddd0a4');
        line(c, [[x - 1, y + 28], [x + 2, 147]], '#a99b7770', 1.5);
        c.fillStyle = gradient(c, x - 20, y - 4, x + 20, y + 19, ['#d5a875', i % 2 ? '#b77850' : '#9b5d44', '#704837']);
        c.beginPath(); c.moveTo(x - 23, y + 16); c.quadraticCurveTo(x - 7, y - 18, x + 7, y - 7); c.quadraticCurveTo(x + 21, y + 2, x + 23, y + 15); c.quadraticCurveTo(x, y + 23, x - 23, y + 16); c.fill();
        line(c, [[x - 20, y + 16], [x, y + 20], [x + 21, y + 15]], '#edcd98', 2);
        for (let n = -2; n < 3; n++) line(c, [[x + n * 7, y + 18], [x + n * 4, y + 23]], '#8c6c4977', 1);
        for (const [dx, dy] of [[-8, 5], [5, -1], [14, 8]]) ellipse(c, x + dx, y + dy, 2.5, 1.7, '#e9d8b1');
      } else {
        line(c, [[x, 158], [x - 3, y + 30], [x, y]], '#527451', 2);
        leaf(c, x - 1, y + 47, 27, 6, -.9, '#6e8e58');
        leaf(c, x, y + 65, 23, 5, .8, '#8ca366');
        if (kind === 'blue') {
          for (let n = 0; n < 4; n++) {
            const bx = x + (n % 2 ? 9 : -9), by = y + n * 10;
            line(c, [[x, by + 5], [bx, by]], '#688457', 1.5);
            shape(c, [[bx - 5, by], [bx + 4, by - 1], [bx + 7, by + 9], [bx + 2, by + 7], [bx - 2, by + 11], [bx - 7, by + 9]], n % 2 ? '#708bad' : '#92a7ca');
            line(c, [[bx - 3, by + 2], [bx - 2, by + 7]], '#d1dbe9', 1);
          }
        } else {
          for (let petal = 0; petal < 8; petal++) ellipse(c, x + Math.cos(petal * .785) * 7, y + Math.sin(petal * .785) * 7, 5, 2.5, i % 2 ? '#f2d69b' : '#f4ead4', petal * .785);
          ellipse(c, x, y, 4.4, 4, '#c3964e');
          ellipse(c, x - 1, y - 1, 2, 1.6, '#f0cb72');
        }
      }
    }
    for (let i = 0; i < 14; i++) leaf(c, 24 + i * 10, 159, 15 + i % 3 * 7, 3, (i % 5 - 2) * .4, '#688351');
  });
}

function potatoLeaves() {
  return texture(256, 192, c => {
    for (let i = 0; i < 9; i++) {
      const x = 43 + i * 21;
      const y = 65 + Math.sin(i * 2.3) * 19;
      line(c, [[127, 185], [x, y]], '#547a43', 5);
      volume(c, x - 11, y + 14, 20, 9, '#b0c571', '#70914f', '#4d734b', -.5);
      volume(c, x + 8, y, 20, 11, '#c4d07c', '#88a458', '#527b50', .4);
      line(c, [[x - 6, y + 13], [x + 15, y + 2]], '#c0c47a', 2);
      if (i % 3 === 0) {
        for (let p = 0; p < 5; p++) ellipse(c, x + 8 + Math.cos(p * 1.257) * 6, y - 9 + Math.sin(p * 1.257) * 6, 4, 4, '#eee4d0');
        ellipse(c, x + 8, y - 9, 3, 3, '#debd58');
      }
    }
  });
}

function potato() {
  return texture(128, 112, c => {
    volume(c, 65, 61, 45, 32, '#ffe0a0', '#d8b574', '#987045', -.33);
    [[39, 48], [74, 37], [86, 61], [52, 72]].forEach(([x, y]) => {
      ellipse(c, x, y, 2.8, 2, '#a67e4d', -.2);
      line(c, [[x - 4, y - 2], [x - 1, y - 4]], '#f0d79b', 2);
    });
  });
}

function fairy(kind, wingPhase = 0) {
  return texture(192, 240, c => {
    const palettes = [
      { skin: '#e2b994', hair: '#806149', dress: '#d7d3a1', shadow: '#8b9c6d', wing: '#e4dfbba0' },
      { skin: '#d6a383', hair: '#ab654b', dress: '#d79673', shadow: '#a55f5b', wing: '#f2d6b1a0' },
      { skin: '#ddb59a', hair: '#375f61', dress: '#8bb5b3', shadow: '#4f7f86', wing: '#b8d8d4a0' },
    ];
    const p = palettes[kind];
    // Birch leaves, sunrise moth wings, and brook dragonfly wings distinguish them.
    for (const side of [-1, 1]) {
      c.save(); c.translate(96, 122); c.scale(side * (1 + wingPhase), 1);
      if (kind === 0) {
        leaf(c, -2, 6, 91, 33, -.58, p.wing, '#fff8d799');
        leaf(c, -2, 10, 66, 25, -1.7, p.wing, '#fff8d799');
        for (let i = 0; i < 4; i++) line(c, [[-18 - i * 7, -20 - i * 10], [-33 - i * 8, -18 - i * 10]], '#fff4d180', 1);
      } else if (kind === 1) {
        shape(c, [[0, 4], [-24, -58], [-64, -73], [-75, -44], [-65, -18], [-36, 9], [-63, 16], [-58, 41], [-41, 49], [-17, 27]], p.wing);
        line(c, [[-1, 5], [-27, -26], [-62, -52]], '#f5e3c1', 1.6);
        line(c, [[-6, 10], [-42, 30], [-54, 34]], '#f5e3c1', 1.4);
        ellipse(c, -47, -40, 10, 14, '#b8876670', -.6); ellipse(c, -47, -40, 5, 7, '#f2d99c90', -.6);
      } else {
        for (const [y, angle] of [[-3, -1.08], [18, -1.72]]) {
          ellipse(c, -40, y, 17, 61, p.wing, angle);
          line(c, [[-4, 9], [-83, y - 28]], '#e4f1dd99', 1.4);
          for (let i = 0; i < 6; i++) line(c, [[-15 - i * 10, y - 4 - i * 3], [-18 - i * 10, y - 20 - i * 3]], '#d9e8d680', .8);
        }
      }
      c.restore();
    }
    // A softly curved adult figure, layered clothing, and a different gesture for each.
    const lean = kind === 1 ? -3 : kind === 2 ? 2 : 0;
    c.save(); c.translate(lean, 0);
    paintPath(c, 'M87 173 Q85 188 83 203 Q79 211 82 216 L87 214 Q89 201 94 187 L98 175Z', gradient(c, 80, 183, 97, 215, [p.skin, '#b58e75']));
    paintPath(c, 'M102 173 Q102 196 111 211 L115 214 L120 211 Q116 207 115 200 L113 174Z', p.skin);
    paintPath(c, 'M81 209 Q83 213 86 212 L87 216 Q80 221 73 218 Q74 214 81 209Z', p.shadow);
    paintPath(c, 'M111 208 Q117 207 118 212 Q126 213 126 217 Q119 220 112 215Z', p.shadow);
    paintPath(c, 'M85 102 C78 109 80 127 85 137 Q84 152 72 179 Q84 190 96 182 Q109 192 125 180 C116 159 110 148 110 136 Q117 111 108 103Z', gradient(c, 78, 102, 124, 182, ['#f0e1bf', p.dress, p.shadow]), p.shadow + '80', .8);
    paintPath(c, 'M82 106 Q85 127 92 134 L85 144 Q79 125 82 106Z', p.shadow + '65');
    paintPath(c, 'M107 105 Q103 124 104 137 Q109 156 116 176 L123 180 Q115 150 111 135Z', p.shadow + '6b');
    paintPath(c, 'M91 141 Q90 158 83 177 Q90 178 95 182 L105 180 Q98 159 100 142Z', '#f3e9cd60');
    for (const d of ['M91 147 Q87 167 85 177', 'M105 145 Q112 161 114 174', 'M95 110 Q93 118 98 128']) paintPath(c, d, null, p.shadow + '85', 1);
    paintPath(c, 'M83 135 Q96 140 111 135 L111 141 Q94 146 84 141Z', '#b7a378');
    // Small overlapping leaf panels move with the dress contour.
    for (let n = 0; n < 5; n++) {
      const x = 77 + n * 10, y = 179 + Math.sin(n) * 4;
      paintPath(c, `M${x} ${y - 22} Q${x + 12} ${y - 8} ${x + 4} ${y + 12} Q${x - 4} ${y} ${x} ${y - 22}Z`, n % 2 ? p.dress : p.shadow + 'cc');
      paintPath(c, `M${x + 2} ${y - 18} Q${x + 6} ${y - 4} ${x + 3} ${y + 7}`, null, '#e8ddad80', 1);
    }
    // Arms include a shoulder, elbow, tapered wrist, and a shaped hand.
    const leftPalm = kind === 1 ? [75, 133] : kind === 2 ? [50, 125] : [48, 117];
    const leftArm = kind === 1
      ? 'M85 106 Q77 109 72 122 Q68 131 75 137 L81 133 Q77 129 82 121 L91 111Z'
      : kind === 2
      ? 'M85 106 Q79 114 73 131 Q70 136 60 131 L49 126 L51 121 Q66 127 68 126 L78 106Z'
      : 'M83 103 Q77 107 72 123 Q69 129 60 124 L49 118 L51 113 Q66 119 67 117 L77 104Z';
    paintPath(c, leftArm, gradient(c, 48, 109, 86, 138, ['#eac6a4', p.skin, '#b4876c']));
    hand(c, leftPalm[0], leftPalm[1], -1.1, p.skin, kind === 1, .74);
    paintPath(c, 'M107 104 Q116 105 121 119 Q126 127 133 118 L140 109 L145 112 Q138 129 128 134 Q117 133 110 118Z', gradient(c, 110, 108, 141, 130, ['#e8c4a2', p.skin, '#b28770']));
    hand(c, 140, 110, -.4, p.skin, true, .8);
    paintPath(c, 'M82 104 Q87 112 89 116 L79 124 Q75 115 79 108Z', '#ece5c488');
    paintPath(c, 'M105 103 Q114 105 121 116 L116 123 Q109 112 104 113Z', '#ede2c688');
    paintPath(c, 'M90 89 L90 104 Q99 113 107 101 L106 85Z', '#ba8c70');
    // Wavy locks frame the face, with distinct cuts and highlights rather than a slab.
    const hairBack = kind === 0
      ? 'M79 53 C67 71 80 80 74 97 C66 108 79 116 75 136 Q90 139 103 125 C116 143 129 133 125 121 Q117 110 119 93 C128 68 115 39 95 39 Q81 40 79 53Z'
      : kind === 1
      ? 'M82 47 C68 53 73 77 68 85 C58 103 80 110 70 130 Q85 145 102 128 C114 137 128 126 119 114 C113 103 125 86 116 72 C124 52 106 34 91 39Z'
      : 'M83 48 C75 58 72 78 78 93 Q83 107 77 123 C74 139 98 143 106 131 C125 151 138 133 129 122 Q117 102 122 80 C125 54 109 36 93 39Z';
    paintPath(c, hairBack, gradient(c, 78, 47, 127, 128, [p.hair, p.hair, kind === 2 ? '#284e52' : '#674a38']));
    paintPath(c, 'M87 48 C97 43 110 49 113 62 L113 71 Q116 77 116 82 Q113 95 102 101 C92 100 83 93 82 81 Q79 64 87 48Z', gradient(c, 83, 53, 115, 92, ['#edc9a7', p.skin, '#b0836d']), '#aa7f6640', .7);
    paintPath(c, 'M83 73 Q76 69 78 79 Q79 84 84 83', p.skin, '#9e765e', .7);
    paintPath(c, 'M81 70 C75 53 84 39 99 41 Q118 42 119 64 Q109 54 104 49 Q98 61 87 63 L84 76Z', p.hair);
    for (const d of ['M82 55 Q89 45 98 45', 'M105 52 Q114 58 115 69', 'M79 87 Q90 97 84 113 Q81 125 86 132', 'M113 87 Q111 108 122 128']) paintPath(c, d, null, kind === 2 ? '#82aba480' : '#d4aa7470', 1.3);
    eye(c, 92, 73, .77, kind === 2 ? '#457b77' : '#6c7353'); eye(c, 107, 72, .67, kind === 2 ? '#457b77' : '#6c7353');
    paintPath(c, kind === 1 ? 'M88 66 Q92 63 97 66 M104 65 Q108 62 111 65' : 'M88 66 Q92 65 97 67 M104 65 Q108 63 111 66', null, p.hair, 1.2);
    paintPath(c, 'M101 74 Q98 81 101 83 L105 82', null, '#a77862', .8);
    ellipse(c, 89, 82, 4, 2, '#c58f7b55'); ellipse(c, 109, 81, 3, 2, '#c58f7b4d');
    paintPath(c, kind === 1 ? 'M96 90 Q103 95 109 88' : 'M96 90 Q102 93 107 89', null, '#925c54', 1.25);
    paintPath(c, 'M98 94 Q102 96 106 94', null, '#eac4a0', .8);
    for (let i = 0; i < 5; i++) {
      const x = 81 + i * 8, y = 45 - Math.sin(i / 4 * Math.PI) * 8;
      if (kind === 0) leaf(c, x, y + 3, 13, 4, (i - 2) * .5, '#b7c086');
      else if (kind === 1) { for (let n = 0; n < 5; n++) ellipse(c, x + Math.cos(n * 1.256) * 3, y + Math.sin(n * 1.256) * 3, 3, 2, '#efd3a4', n); ellipse(c, x, y, 2, 2, '#aa7255'); }
      else leaf(c, x, y, 13, 4, (i - 2) * .5, '#a5c6b9');
    }
    for (const [x, y] of [[91, 117], [102, 122], [89, 153], [109, 171]]) embroidery(c, x, y, '#f5e2b7', 2.2);
    paintPath(c, 'M94 110 Q99 115 106 109', null, '#d8c294', 1.3);
    line(c, [[142, 112], [159, 87]], '#a99466', 2);
    const blossom = kind === 2 ? '#d5ece1' : kind === 1 ? '#f7d4a0' : '#f4e6b7';
    for (let i = 0; i < 5; i++) leaf(c, 159, 88, 10, 3, i * 1.256, blossom);
    ellipse(c, 159, 87, 2, 2, '#b59e60');
    c.restore();
  });
}

function cottage() {
  return texture(640, 560, c => {
    // Weathered plaster, timber, and individual tiles make a lived-in cottage.
    c.fillStyle = gradient(c, 145, 300, 486, 515, ['#fff3cc', '#f3deb0', '#cfbc8e']);
    c.beginPath(); c.moveTo(136, 266); c.lineTo(473, 267); c.lineTo(488, 526);
    c.quadraticCurveTo(486, 540, 471, 540); c.lineTo(137, 540);
    c.quadraticCurveTo(120, 539, 123, 522); c.closePath(); c.fill();
    shape(c, [[471, 267], [562, 225], [572, 484], [488, 540]],
      gradient(c, 478, 280, 574, 469, ['#d8d2a6', '#b5bb8e', '#969e79']));
    // The side wall stays darker, while the eaves cast a wide soft painted shadow.
    shape(c, [[137, 282], [476, 291], [478, 333], [135, 322]],
      gradient(c, 0, 288, 0, 334, ['#927d5255', '#927d5200']));
    shape(c, [[476, 280], [565, 228], [567, 269], [478, 324]], '#596f5633');
    c.fillStyle = gradient(c, 286, 113, 553, 276, ['#d78a58', '#ba5d43', '#793f35']);
    c.beginPath(); c.moveTo(268, 89); c.quadraticCurveTo(432, 136, 594, 207);
    c.quadraticCurveTo(551, 257, 478, 301); c.lineTo(96, 285); c.closePath(); c.fill();
    c.strokeStyle = '#f1ad7388'; c.lineWidth = 4;
    for (let i = 0; i < 7; i++) {
      const t = (i + 1) / 8;
      c.beginPath(); c.moveTo(275 + t * 306, 100 + t * 108);
      c.quadraticCurveTo(390 + t * 160, 202 + t * 48, 480 + t * 93, 284 - t * 69); c.stroke();
    }
    c.fillStyle = gradient(c, 181, 144, 385, 295, ['#eda66a', '#d9784e', '#ad4e3b']);
    c.beginPath(); c.moveTo(96, 281); c.quadraticCurveTo(183, 181, 268, 89);
    c.quadraticCurveTo(367, 181, 481, 281); c.quadraticCurveTo(293, 301, 96, 281); c.fill();
    // Rounded tile rows follow the roof's slope, with a lighter lip on each row.
    c.save(); c.beginPath(); c.moveTo(107, 280); c.lineTo(269, 103); c.lineTo(467, 280); c.closePath(); c.clip();
    for (let row = 0; row < 8; row++) {
      const y = 129 + row * 21;
      const half = (y - 92) * 1.02;
      c.strokeStyle = '#8c463755'; c.lineWidth = 4;
      c.beginPath(); c.moveTo(270 - half, y); c.quadraticCurveTo(279, y + 13, 280 + half, y); c.stroke();
      c.strokeStyle = '#ffd49a66'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(270 - half, y - 4); c.quadraticCurveTo(279, y + 7, 280 + half, y - 4); c.stroke();
      for (let i = -6; i <= 6; i++) {
        const x = 277 + i * 29 + (row % 2) * 14;
        c.strokeStyle = '#9c4c3a55'; c.lineWidth = 2;
        c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + 6, y + 9, x + 9, y + 20); c.stroke();
      }
    }
    c.restore();
    c.strokeStyle = '#7f4a36'; c.lineWidth = 10;
    c.beginPath(); c.moveTo(96, 284); c.quadraticCurveTo(291, 301, 479, 286); c.lineTo(592, 209); c.stroke();
    c.strokeStyle = '#f1ae7366'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(99, 280); c.quadraticCurveTo(293, 295, 478, 281); c.stroke();
    // Chimney faces have separate light and shaded surfaces.
    shape(c, [[421, 108], [452, 117], [455, 189], [423, 178]],
      gradient(c, 421, 110, 456, 180, ['#ead5a6', '#bba17d']));
    shape(c, [[452, 116], [461, 111], [464, 184], [455, 189]], '#8f765c');
    shape(c, [[417, 103], [452, 112], [460, 108], [426, 98]], '#f9dfae');
    for (let row = 0; row < 3; row++) line(c, [[424, 132 + row * 17], [453, 141 + row * 17]], '#a0876955', 2);
    // Timber edging, a recessed green door, and flower boxes keep the Czech cottage cues.
    line(c, [[139, 291], [136, 527], [475, 528], [469, 301]], '#876f4f', 11);
    line(c, [[142, 300], [140, 522]], '#c7ab7888', 3);
    line(c, [[140, 309], [467, 320]], '#fff3cb66', 3);
    c.fillStyle = '#6c7050'; c.beginPath(); c.roundRect(266, 364, 79, 166, [16, 16, 2, 2]); c.fill();
    c.fillStyle = gradient(c, 278, 380, 337, 515, ['#a8ac73', '#7d8e61', '#586e53']);
    c.beginPath(); c.roundRect(277, 375, 57, 151, [12, 12, 2, 2]); c.fill();
    line(c, [[285, 391], [283, 521]], '#d0cd8a55', 3);
    for (const x of [301, 319]) line(c, [[x, 382], [x, 522]], '#536b4e77', 2);
    volume(c, 325, 455, 4, 5, '#fff3bd', '#d9ba72', '#957644');
    shape(c, [[261, 528], [348, 528], [361, 544], [248, 544]],
      gradient(c, 0, 528, 0, 544, ['#d4c8a3', '#969b7f']));
    line(c, [[250, 544], [359, 544]], '#858d7533', 3);
    for (const x of [177, 373]) {
      c.fillStyle = '#8e805c'; c.beginPath(); c.roundRect(x - 3, 352, 59, 67, 4); c.fill();
      c.fillStyle = gradient(c, x + 6, 360, x + 47, 409, ['#e0e5bc', '#9dbdaf', '#6b998b']);
      c.fillRect(x + 5, 360, 43, 50);
      shape(c, [[x + 8, 361], [x + 27, 361], [x + 7, 392]], '#fffce255');
      line(c, [[x + 26, 357], [x + 26, 415]], '#fff1c5', 5);
      line(c, [[x + 2, 384], [x + 51, 384]], '#f5e8ba', 5);
      for (const sx of [x - 18, x + 57]) {
        c.fillStyle = gradient(c, sx, 350, sx + 14, 416, ['#9db794', '#608e76', '#477663']);
        c.beginPath(); c.roundRect(sx, 351, 14, 66, 3); c.fill();
        for (let y = 359; y < 414; y += 9) line(c, [[sx + 2, y], [sx + 11, y]], '#c6d2a666', 1.5);
      }
      c.fillStyle = gradient(c, x - 4, 422, x + 60, 438, ['#d6a769', '#a27349', '#805f3e']);
      c.beginPath(); c.roundRect(x - 5, 421, 65, 16, 4); c.fill();
      for (let i = 0; i < 6; i++) {
        volume(c, x + i * 10, 420, 9, 9, '#a8be75', '#779758', '#4e754e');
        volume(c, x + i * 10 + 2, 412 - i % 2 * 5, 5, 5, '#ffe1a0', i % 2 ? '#efbb73' : '#df8062', '#b6614c');
      }
    }
    volume(c, 304, 336, 12, 10, '#fff4c6', '#e6c88b', '#ac8b60');
    ellipse(c, 304, 336, 6, 6, '#8c8760');
    for (let i = 0; i < 8; i++) {
      const x = 128 + i * 44;
      shape(c, [[x, 524], [x + 29, 521], [x + 39, 536], [x + 6, 540]], i % 3 ? '#9da78a' : '#bac0a0');
      line(c, [[x + 4, 525], [x + 26, 524]], '#dbd9b066', 1.5);
    }
    for (const [x, y] of [[153, 340], [442, 490], [360, 453], [148, 475]]) {
      line(c, [[x, y], [x + 5, y + 10], [x + 2, y + 22]], '#b8ad8560', 1.5);
    }
    for (let i = 0; i < 35; i++) {
      const x = 153 + i % 7 * 43, y = 324 + Math.floor(i / 7) * 41;
      line(c, [[x, y], [x + 17, y + 1]], '#fff7d32e', 1.6);
    }
    // Ivy follows the shaded corner instead of covering the door or windows.
    line(c, [[493, 525], [504, 442], [488, 388], [506, 314]], '#62784b', 4);
    for (let i = 0; i < 22; i++) {
      const y = 515 - i * 9, x = 498 + Math.sin(i * .7) * 10;
      leaf(c, x, y, 17 + i % 3 * 3, 7, i % 2 ? .8 : -.8, ['#658455', '#8b9d65', '#a4ab72'][i % 3]);
    }
    for (let i = 0; i < 18; i++) {
      const x = 120 + i * 18, y = 271 + Math.sin(i * .8) * 5;
      leaf(c, x, y, 11, 6, i * .7, '#819063aa');
    }
    line(c, [[189, 359], [189, 406]], '#f8efcf88', 1);
    line(c, [[414, 359], [414, 406]], '#f8efcf88', 1);
    shape(c, [[278, 485], [332, 485], [332, 490], [278, 490]], '#597351');
    for (let x = 282; x < 331; x += 9) line(c, [[x, 403], [x, 460]], '#c4c59450', .9);
  });
}

function worktop() {
  return texture(384, 320, c => {
    // A timber sideboard, with a stone work surface and visible joined doors.
    shape(c, [[64, 140], [282, 103], [328, 163], [114, 200]], '#bba477');
    shape(c, [[71, 155], [279, 120], [280, 253], [117, 298], [77, 267]], '#6e654c');
    shape(c, [[116, 191], [323, 156], [319, 278], [115, 308]], gradient(c, 123, 184, 321, 285, ['#b89b6e', '#8c7758', '#5d5d48']));
    for (const x of [123, 316]) line(c, [[x, 198], [x, 302]], '#d6b585', 5);
    line(c, [[119, 215], [316, 184]], '#4c5341', 3);
    line(c, [[121, 286], [316, 258]], '#d8b780', 3);
    for (let door = 0; door < 2; door++) {
      const x = 131 + door * 91;
      shape(c, [[x, 220 - door * 14], [x + 71, 209 - door * 14], [x + 70, 274 - door * 14], [x, 286 - door * 14]], '#8b7958');
      line(c, [[x + 6, 225 - door * 14], [x + 64, 216 - door * 14], [x + 64, 268 - door * 14]], '#c4a67b', 2);
      for (let i = 0; i < 6; i++) line(c, [[x + 12 + i * 8, 226 - door * 14], [x + 12 + i * 8, 275 - door * 14]], '#554f3940', 1);
      ellipse(c, x + (door ? 12 : 60), 238 - door * 14, 3, 4, '#d6b771');
    }
    line(c, [[68, 144], [113, 187], [326, 155]], '#ead7ac', 4);
    line(c, [[72, 152], [113, 196], [323, 164]], '#73694f', 3);
    for (let i = 0; i < 18; i++) {
      const x = 104 + i * 10;
      line(c, [[x, 155], [x + 19, 151]], '#eee2bd55', 1);
    }
    shape(c, [[73, 146], [112, 140], [137, 176], [131, 241], [108, 247], [108, 182]], '#b0c2b6');
    for (let i = 0; i < 7; i++) line(c, [[109 + i * 3, 181], [110 + i * 3, 237]], '#edf0d380', 1);
    for (let i = 0; i < 5; i++) embroidery(c, 117, 193 + i * 9, '#496f67', 2);
    ellipse(c, 263, 123, 18, 10, '#aa7556');
    shape(c, [[246, 109], [279, 105], [277, 127], [250, 130]], '#bd8a63');
    ellipse(c, 263, 107, 17, 7, '#dfad7d'); ellipse(c, 263, 107, 12, 4, '#6e5740');
    for (let i = 0; i < 5; i++) leaf(c, 263, 109, 28 + i % 3 * 5, 6, (i - 2) * .3, '#6e8f61');
  });
}

function stove() {
  return texture(320, 440, c => {
    // Blue glazed tiles, an iron fire door, and a copper soup pot.
    shape(c, [[77, 265], [137, 237], [257, 278], [202, 306]], '#6a6b59');
    shape(c, [[78, 270], [204, 307], [203, 422], [77, 383]], '#7d998f');
    shape(c, [[204, 307], [257, 280], [255, 395], [203, 422]], '#496f68');
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const x = 84 + col * 29, y = 281 + row * 28 + col * 8.5;
        shape(c, [[x, y], [x + 25, y + 7], [x + 25, y + 30], [x, y + 23]], ['#7f9f92', '#a1b5a1', '#6d9185'][row % 3]);
        line(c, [[x + 2, y + 3], [x + 22, y + 9]], '#d9ddbd70', 1.4);
        if ((col + row) % 3 === 0) embroidery(c, x + 13, y + 16, '#d3d7b4', 4);
      }
      line(c, [[210, 313 + row * 25], [252, 291 + row * 25]], '#9cbaaa70', 1.5);
    }
    shape(c, [[106, 334], [169, 352], [169, 397], [106, 378]], '#2f443d');
    line(c, [[111, 339], [163, 354], [164, 390], [111, 376], [111, 339]], '#b3b598', 2);
    shape(c, [[120, 352], [151, 361], [151, 380], [120, 371]], '#a96542');
    line(c, [[121, 366], [148, 374]], '#d99e58', 3);
    line(c, [[154, 371], [176, 375]], '#c7c3a1', 3);
    shape(c, [[150, 25], [165, 31], [165, 254], [149, 249]], '#3e5049');
    shape(c, [[165, 31], [173, 26], [173, 249], [165, 254]], '#273e38');
    line(c, [[153, 36], [153, 241]], '#839788', 1.5);
    for (const y of [66, 153, 223]) line(c, [[149, y], [165, y + 5], [173, y]], '#849789', 2);
    ellipse(c, 167, 274, 44, 19, '#273f36');
    shape(c, [[126, 234], [209, 236], [204, 273], [139, 289], [126, 267]], gradient(c, 125, 236, 212, 281, ['#d8ac77', '#a37652', '#70533f']));
    ellipse(c, 167, 236, 42, 17, '#c59f6d'); ellipse(c, 167, 236, 36, 12, '#c8b978');
    for (const [x, y] of [[148, 232], [178, 241], [187, 229]]) ellipse(c, x, y, 6, 3, '#e3d3a4', -.2);
    line(c, [[122, 245], [111, 240], [104, 248], [112, 257], [127, 259]], '#6d6450', 4);
    line(c, [[209, 244], [224, 243], [229, 253], [218, 260], [206, 259]], '#6d6450', 4);
    line(c, [[134, 258], [193, 264]], '#efd0a077', 2);
  });
}

function supperTable() {
  return texture(384, 320, c => {
    shape(c, [[115, 162], [135, 161], [131, 290], [113, 287]], '#625843');
    shape(c, [[270, 151], [288, 150], [286, 274], [269, 280]], '#625843');
    line(c, [[122, 251], [277, 238]], '#867052', 8);
    shape(c, [[61, 138], [256, 98], [325, 155], [140, 211], [62, 166]], '#745e45');
    shape(c, [[61, 136], [256, 98], [325, 152], [140, 195]], gradient(c, 76, 124, 313, 172, ['#d6b982', '#b39266', '#91764f']));
    for (let i = 0; i < 7; i++) line(c, [[74 + i * 8, 141 + i * 6], [271 + i * 6, 111 + i * 6]], '#6e614044', 1.2);
    line(c, [[64, 136], [140, 194], [324, 151]], '#ebcda0', 2.5);
    shape(c, [[136, 120], [179, 112], [255, 170], [253, 227], [218, 237], [218, 183]], '#c2c9a4');
    for (let i = 0; i < 5; i++) {
      line(c, [[221 + i * 6, 185], [222 + i * 6, 229]], '#78947b', 1);
      embroidery(c, 232, 186 + i * 9, '#668377', 2.8);
    }
    for (let i = 0; i < 9; i++) line(c, [[219 + i * 4, 233], [219 + i * 4, 242]], '#ded6b2', 1.2);
  });
}

function forestCreature(kind) {
  return texture(256, 320, c => {
    if (kind === 'fox') {
      // Seated fox: a curved spine, separate hocks, a heavy brush, and a narrow muzzle.
      paintPath(c, 'M130 236 C110 224 58 230 30 251 C16 262 21 286 47 290 Q102 297 145 272Z', gradient(c, 28, 234, 139, 285, ['#d79c60', '#ad623e', '#77432f']));
      paintPath(c, 'M29 254 C15 270 22 289 47 290 Q68 290 71 279 Q62 264 45 259Z', '#e8d8b7');
      paintPath(c, 'M142 164 C113 176 111 203 118 238 Q108 250 118 275 L139 285 L182 275 Q190 233 179 192Z', gradient(c, 115, 180, 179, 269, ['#dfa366', '#bb6b40', '#854a32']), '#5c493830', 1);
      paintPath(c, 'M141 170 Q134 190 137 213 L133 235 L144 239 L146 250 Q155 234 161 243 L166 219 Q184 205 173 179Z', '#e7dbc0');
      paintPath(c, 'M130 235 Q134 261 132 283 L125 296 Q120 304 137 306 Q151 305 146 298 L144 253Z', '#554c3a');
      paintPath(c, 'M165 237 Q166 265 176 284 L177 298 Q171 305 191 306 Q204 304 194 297 L185 284 L180 241Z', '#493f32');
      for (const x of [128, 137, 181, 189]) paintPath(c, `M${x} 299 L${x + 2} 304`, null, '#b3a887', .9);
      // Ears and cheeks have a furry edge rather than a single geometric mask.
      paintPath(c, 'M119 141 Q112 114 118 86 Q135 98 148 122 C162 116 183 118 189 128 Q202 111 216 102 Q221 129 210 150 Q213 168 198 182 L178 194 L166 184 L146 190 L130 172 L123 175Z', gradient(c, 117, 116, 214, 184, ['#dea568', '#bb7043', '#834e36']), '#71473266', 1.2);
      paintPath(c, 'M120 96 Q128 106 137 128 L120 137 Q119 115 120 96Z', '#5b4e3a');
      paintPath(c, 'M211 111 Q211 132 202 145 L191 132Z', '#554a38');
      paintPath(c, 'M126 151 Q143 163 158 158 L170 169 Q190 158 210 158 Q205 174 192 183 L175 190 Q154 185 146 176 L135 178Z', '#eddfc0');
      paintPath(c, 'M166 165 Q181 172 209 170 Q213 176 199 182 L177 193 Q170 186 161 184Z', '#f3e6cb');
      paintPath(c, 'M204 169 Q213 168 215 174 Q213 181 204 181 L198 175Z', '#263b32');
      paintPath(c, 'M139 146 Q145 140 151 146 M179 140 Q185 136 191 141', null, '#473e2e', 1.7);
      ellipse(c, 147, 146, 2.3, 3, '#243b31'); ellipse(c, 186, 141, 2.2, 3, '#243b31');
      ellipse(c, 148, 145, .8, .8, '#f8ebcf'); ellipse(c, 187, 140, .8, .8, '#f8ebcf');
      paintPath(c, 'M177 186 Q185 189 192 183', null, '#7a6547', 1.3);
      for (let i = 0; i < 16; i++) {
        const x = 130 + i % 4 * 13, y = 193 + Math.floor(i / 4) * 17;
        paintPath(c, `M${x} ${y} Q${x - 3} ${y + 6} ${x + 1} ${y + 10}`, null, i % 2 ? '#e8b67970' : '#a9886355', 1.2);
      }
      for (let i = 0; i < 15; i++) paintPath(c, `M${36 + i * 6} ${253 - Math.sin(i * .3) * 8} Q${40 + i * 6} 269 ${40 + i * 6} 275`, null, '#e6b57865', 1.3);
      for (const d of ['M143 175 L130 171', 'M140 181 L127 181', 'M195 181 L209 185']) paintPath(c, d, null, '#c9bc9680', .8);
    } else if (kind === 'owl') {
      paintPath(c, 'M82 279 L176 273 L190 319 L73 319Z', gradient(c, 79, 284, 179, 316, ['#aa9369', '#716c4c']));
      ellipse(c, 130, 278, 49, 12, '#c0ac7e');
      for (let n = 0; n < 5; n++) paintPath(c, `M${86 + n * 20} 288 Q${91 + n * 20} 300 ${82 + n * 21} 318`, null, '#e4c69b55', 1.4);
      // A hooded crown and heart-shaped facial disc, with overlapping flight feathers.
      paintPath(c, 'M96 153 C74 178 68 222 86 250 L80 257 L95 260 L99 276 L116 270 L127 283 L140 273 L160 278 L166 260 L177 258 C195 218 184 178 162 157Z', gradient(c, 85, 167, 173, 269, ['#c3b085', '#9b8f68', '#667356']), '#4a5b4666', .9);
      paintPath(c, 'M107 163 C98 200 99 230 112 257 L125 266 L145 254 Q159 217 148 165Z', '#cfc39a');
      paintPath(c, 'M92 169 C72 196 74 231 88 252 Q92 254 96 245 Q105 199 104 176Z', '#777e5d');
      paintPath(c, 'M156 170 Q181 187 180 223 Q176 242 166 250 L157 242 Q164 201 149 178Z', '#637054');
      for (let n = 0; n < 7; n++) {
        paintPath(c, `M${91 - n * .6} ${188 + n * 7} Q${77 + n} ${216 + n * 3} ${90 + n * .5} ${243 + n}`, null, '#b6b38a85', 1.7);
        paintPath(c, `M${162 + n * .7} ${190 + n * 6} Q${179 - n} ${215 + n * 3} ${166 - n * .3} ${244 + n}`, null, '#a4ad8390', 1.5);
      }
      paintPath(c, 'M68 120 C68 80 92 51 129 58 C165 49 191 81 189 119 Q185 156 157 175 L129 167 L101 175 Q73 157 68 120Z', gradient(c, 75, 67, 183, 159, ['#b8a67a', '#827e5e', '#58694f']), '#4d5c4366', 1);
      paintPath(c, 'M127 101 C106 64 77 94 78 123 Q80 151 112 164 L128 149 Q143 168 169 152 C194 119 163 79 141 94 Q130 102 127 111Z', '#ded0a6');
      paintPath(c, 'M87 119 Q93 100 111 108 M143 106 Q163 96 176 119', null, '#817c57', 2.1);
      ellipse(c, 104, 121, 10, 11, '#b39452'); ellipse(c, 155, 119, 10, 11, '#b39452');
      ellipse(c, 105, 121, 4.3, 7, '#263a31'); ellipse(c, 154, 119, 4.3, 7, '#263a31');
      ellipse(c, 107, 118, 1.6, 2, '#f5eacd'); ellipse(c, 156, 116, 1.6, 2, '#f5eacd');
      paintPath(c, 'M121 138 Q129 133 137 137 L129 155Z', '#b99251', '#8b7546', .8);
      for (let side = 0; side < 2; side++) for (let n = 0; n < 17; n++) {
        const angle = n / 17 * Math.PI * 2, x = side ? 155 : 103, y = side ? 119 : 121;
        paintPath(c, `M${x + Math.cos(angle) * 18} ${y + Math.sin(angle) * 22} L${x + Math.cos(angle) * 24} ${y + Math.sin(angle) * 28}`, null, '#8f8b6270', .9);
      }
      for (let n = 0; n < 25; n++) {
        const x = 107 + n % 5 * 9, y = 182 + Math.floor(n / 5) * 16;
        paintPath(c, `M${x - 3} ${y} Q${x} ${y + 7} ${x + 4} ${y}`, null, n % 3 ? '#8f8860' : '#eee0b7', 1.4);
      }
      for (const x of [110, 150]) {
        paintPath(c, `M${x} 266 L${x - 1} 278 M${x - 1} 277 Q${x - 9} 276 ${x - 12} 281 M${x - 1} 277 L${x + 6} 281`, null, '#6a6449', 3);
        line(c, [[x - 12, 281], [x - 13, 284]], '#c3b88c', 1.2);
      }
    } else if (kind === 'badger') {
      // Broad shoulders, a low muzzle, bent short legs, and long digging claws.
      paintPath(c, 'M49 239 Q31 232 26 240 Q21 249 42 255Z', '#6e7c70');
      paintPath(c, 'M64 228 Q62 255 59 275 Q55 291 71 297 L95 298 Q104 292 92 286 L97 248Z', '#35473d');
      paintPath(c, 'M151 239 Q153 256 166 274 L159 290 Q169 300 196 297 Q205 292 194 287 L188 269 L182 236Z', '#30473c');
      paintPath(c, 'M39 231 C29 190 53 158 94 160 C134 152 157 167 178 190 Q193 209 190 248 Q149 272 109 265 Q56 266 39 231Z', gradient(c, 47, 175, 187, 259, ['#a7b3a6', '#7a8c7b', '#405d4c']), '#40544366', 1);
      paintPath(c, 'M45 190 Q88 151 134 175 Q166 178 171 197 Q118 182 60 203Z', '#c2c9b166');
      paintPath(c, 'M173 203 C159 188 167 166 181 170 Q193 171 194 186 Q205 181 216 187 C230 202 225 216 236 231 Q243 241 228 248 L208 254 Q186 247 173 225Z', '#d5d8c0', '#67806a60', .8);
      paintPath(c, 'M171 181 Q170 166 181 164 Q193 166 192 181Z', '#34493d');
      paintPath(c, 'M210 187 Q210 171 220 176 Q228 181 223 193Z', '#34493d');
      paintPath(c, 'M176 179 Q177 171 181 171 Q186 173 186 182Z', '#b6b9a0');
      paintPath(c, 'M212 184 Q215 178 219 182 L218 190Z', '#a5af95');
      paintPath(c, 'M180 187 Q184 178 191 185 C193 200 204 214 219 239 L208 247 Q189 229 180 205Z', '#2d473a');
      paintPath(c, 'M211 187 Q221 192 223 205 Q226 220 234 232 L226 243 Q217 222 211 207 L204 192Z', '#2d473a');
      paintPath(c, 'M229 235 Q239 234 241 241 Q239 249 229 249 L222 243Z', '#243d31');
      paintPath(c, 'M189 203 Q194 200 198 205 M215 206 Q219 202 222 208', null, '#182b22', 1.6);
      ellipse(c, 194, 205, 2.2, 2.7, '#15271f'); ellipse(c, 219, 208, 1.7, 2.5, '#15271f');
      ellipse(c, 195, 204, .65, .65, '#f2e4c8'); ellipse(c, 220, 207, .65, .65, '#f2e4c8');
      paintPath(c, 'M213 250 Q220 254 228 250', null, '#6e816b', 1.1);
      for (let n = 0; n < 62; n++) {
        const x = 48 + n * 13 % 124, y = 180 + n % 5 * 14 + Math.sin(n) * 7;
        paintPath(c, `M${x} ${y} Q${x + 3} ${y + 1} ${x + 7} ${y + 6}`, null, n % 3 ? '#d5d7bd70' : '#36554370', 1.1);
      }
      for (let n = 0; n < 4; n++) {
        paintPath(c, `M${74 + n * 5} 293 L${73 + n * 5} 301 M${174 + n * 5} 292 L${176 + n * 5} 301`, null, '#c7c3a3', 1.6);
      }
      for (let n = 0; n < 3; n++) paintPath(c, `M214 ${238 + n * 4} L194 ${236 + n * 6}`, null, '#e0e1c590', .7);
    } else {
      // Roe deer: slim neck, an alert muzzle, and the visible knees and hocks of four legs.
      paintPath(c, 'M69 203 Q61 235 71 254 L66 292 L76 293 L82 249 L80 215Z', '#877c56');
      paintPath(c, 'M94 210 L99 254 L91 300 L100 300 Q110 259 111 244 L106 214Z', '#9c8e61');
      paintPath(c, 'M157 207 L151 248 L157 300 L166 300 L164 247 L171 212Z', '#806f4d');
      paintPath(c, 'M174 206 Q181 232 190 247 L185 293 L194 294 L202 247 L191 208Z', '#a09163');
      for (const [x, y] of [[67, 292], [92, 300], [158, 300], [186, 294]]) paintPath(c, `M${x} ${y - 3} L${x + 8} ${y - 3} L${x + 9} ${y + 6} Q${x + 1} ${y + 9} ${x - 2} ${y + 4}Z`, '#3d4b37');
      paintPath(c, 'M56 190 C56 168 84 152 115 162 Q139 161 163 175 L177 160 L191 171 Q193 194 180 215 Q167 220 151 216 Q127 231 99 217 Q69 220 56 190Z', gradient(c, 59, 167, 181, 214, ['#d4b77e', '#ad9361', '#797c50']), '#5d6c463b', 1);
      paintPath(c, 'M57 176 Q43 170 44 185 Q45 199 59 202 Q69 192 62 182Z', '#e4ddba');
      paintPath(c, 'M157 183 C164 156 163 119 171 94 L189 92 Q196 131 191 158 L191 195 Q174 210 157 202Z', gradient(c, 163, 108, 192, 192, ['#cdb37a', '#a8905f', '#74805a']));
      paintPath(c, 'M176 107 Q177 148 176 178 L165 199 Q175 203 183 192 Q188 149 185 110Z', '#dbcca17a');
      // A soft wedge-shaped head with a dark, sensitive nose and big listening ears.
      paintPath(c, 'M169 62 Q180 51 192 65 Q205 74 201 91 L213 107 Q211 119 195 117 L177 106 Q162 94 167 76Z', gradient(c, 166, 62, 205, 110, ['#d7bb83', '#ac9566', '#7a7e52']), '#6f79534d', .8);
      paintPath(c, 'M172 69 C152 63 144 45 148 29 Q171 32 180 57Z', '#a48f62');
      paintPath(c, 'M187 58 Q188 35 209 29 C214 47 207 65 194 72Z', '#b8a275');
      paintPath(c, 'M170 60 Q153 47 153 36 Q168 38 173 55Z', '#dbba96');
      paintPath(c, 'M194 59 Q197 43 205 36 Q207 50 197 63Z', '#d8b991');
      paintPath(c, 'M190 96 Q204 96 213 107 Q209 120 192 113 L186 106Z', '#d9cfaa');
      paintPath(c, 'M207 104 Q215 102 217 108 Q215 116 208 114Z', '#344934');
      paintPath(c, 'M184 81 Q190 76 196 81', null, '#514d36', 1.4);
      ellipse(c, 191, 82, 3.1, 3.6, '#344936'); ellipse(c, 192, 81, 1, 1, '#f2e5c9');
      paintPath(c, 'M193 116 Q201 119 207 115', null, '#857a52', 1);
      for (let n = 0; n < 40; n++) {
        const x = 69 + n * 11 % 93, y = 178 + n % 4 * 9 + Math.sin(n) * 5;
        paintPath(c, `M${x} ${y} L${x + 5} ${y + 3}`, null, n % 3 ? '#dec69060' : '#737c5044', 1);
      }
      paintPath(c, 'M72 167 Q117 158 149 178', null, '#e2ca9770', 2);
    }
  });
}

export function createSpriteTextures() {
  const maps = {
    hana: [0, 1, 2, 3].map(frame => hana(frame)),
    goddess: hana(0, true),
    john: john(),
    aldoCot: aldoCot(),
    fir: [0, 1, 2].map(fir),
    birch: [0, 1].map(birch),
    flowers: flowers('cream'),
    blueFlowers: flowers('blue'),
    mushrooms: flowers('mushrooms'),
    potatoLeaves: potatoLeaves(),
    potato: potato(),
    cottage: cottage(),
    fox: forestCreature('fox'),
    owl: forestCreature('owl'),
    deer: forestCreature('deer'),
    badger: forestCreature('badger'),
    fern: fern(),
    grasses: grasses(),
    stone: stone(),
    stump: stump(),
    worktop: worktop(),
    stove: stove(),
    supperTable: supperTable(),
    conversation: texture(96, 96, c => {
      c.fillStyle = '#fff2ce';
      c.beginPath(); c.roundRect(12, 12, 72, 56, 22); c.fill();
      shape(c, [[31, 64], [29, 81], [48, 65]], '#fff2ce');
      for (let i = 0; i < 3; i++) ellipse(c, 31 + i * 17, 40, 4, 4, '#7b8160');
    }),
    fairies: [0, 1, 2].map(kind => fairy(kind)),
    fairyFlutter: [0, 1, 2].map(kind => [fairy(kind, -.08), fairy(kind, .04)]),
    glow: texture(128, 128, c => {
      const gradient = c.createRadialGradient(64, 64, 0, 64, 64, 64);
      gradient.addColorStop(0, '#fffdeeee');
      gradient.addColorStop(.24, '#fff4cba0');
      gradient.addColorStop(.6, '#fff1bd24');
      gradient.addColorStop(1, '#fff1bd00');
      c.fillStyle = gradient; c.fillRect(0, 0, 128, 128);
    }),
    shadow: texture(128, 64, c => {
      c.save(); c.translate(64, 32); c.scale(1, .5);
      const gradient = c.createRadialGradient(0, 0, 0, 0, 0, 62);
      gradient.addColorStop(0, '#2e4c3a66');
      gradient.addColorStop(.3, '#2e4c3a42');
      gradient.addColorStop(.68, '#2e4c3a16');
      gradient.addColorStop(1, '#2e4c3a00');
      c.fillStyle = gradient; c.fillRect(-64, -64, 128, 128); c.restore();
    }),
  };
  maps.dispose = () => {
    const disposed = new Set();
    const disposeValue = value => {
      if (Array.isArray(value)) value.forEach(disposeValue);
      else if (value?.isTexture && !disposed.has(value)) { disposed.add(value); value.dispose(); }
    };
    Object.values(maps).forEach(disposeValue);
  };
  return maps;
}
