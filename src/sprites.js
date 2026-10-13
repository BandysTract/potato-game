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

export function createSpriteTextures() {
  const maps = {
    aldoCot: aldoCot(),
    fir: [0, 1, 2].map(fir),
    birch: [0, 1].map(birch),
    flowers: flowers('cream'),
    blueFlowers: flowers('blue'),
    mushrooms: flowers('mushrooms'),
    potatoLeaves: potatoLeaves(),
    potato: potato(),
    fern: fern(),
    grasses: grasses(),
    stone: stone(),
    stump: stump(),
    conversation: texture(96, 96, c => {
      c.fillStyle = '#fff2ce';
      c.beginPath(); c.roundRect(12, 12, 72, 56, 22); c.fill();
      shape(c, [[31, 64], [29, 81], [48, 65]], '#fff2ce');
      for (let i = 0; i < 3; i++) ellipse(c, 31 + i * 17, 40, 4, 4, '#7b8160');
    }),
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
