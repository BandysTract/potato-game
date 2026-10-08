import * as THREE from 'three';

// Each illustration is drawn here, so the game carries no borrowed artwork.
const ink = '#354d45';

function texture(width, height, paint) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  paint(ctx, width, height);
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

// A consistent light from the upper left gives the illustrations rounded volume.
function volume(c, x, y, rx, ry, light, base, dark, rotation = 0) {
  c.save(); c.translate(x, y); c.rotate(rotation); c.scale(rx, ry);
  const fill = c.createRadialGradient(-.35, -.45, .03, .05, .12, 1.12);
  fill.addColorStop(0, light); fill.addColorStop(.45, base); fill.addColorStop(1, dark);
  ellipse(c, 0, 0, 1, 1, fill);
  c.restore();
}

function hana(frame) {
  return texture(192, 320, c => {
    const step = [0, 12, 0, -12][frame];
    // Her long skirt, adult proportions, apron, and basket stay readable at play size.
    line(c, [[79, 259], [76 - step, 297]], gradient(c, 65, 270, 90, 285, ['#a28865', '#605344']), 13);
    line(c, [[111, 259], [116 + step, 297]], gradient(c, 105, 270, 126, 285, ['#a28865', '#605344']), 13);
    volume(c, 72 - step, 303, 15, 7, '#8c8062', '#5f6452', '#394b42');
    volume(c, 119 + step, 303, 16, 7, '#8c8062', '#5f6452', '#394b42');
    c.fillStyle = gradient(c, 61, 194, 137, 233, ['#75b6c4', '#43899f', '#2f5e7b']);
    c.beginPath(); c.moveTo(73, 173); c.quadraticCurveTo(94, 167, 116, 175);
    c.bezierCurveTo(119, 205, 127, 242, 136, 264);
    c.quadraticCurveTo(98, 279, 59, 266); c.quadraticCurveTo(66, 225, 73, 173); c.fill();
    c.strokeStyle = '#b0d3cf'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(63, 261); c.quadraticCurveTo(98, 271, 132, 260); c.stroke();
    c.strokeStyle = '#316f8c55'; c.lineWidth = 4;
    for (const x of [72, 89, 113, 125]) {
      c.beginPath(); c.moveTo(93 + (x - 93) * .5, 186); c.quadraticCurveTo(x - 4, 227, x, 259); c.stroke();
    }
    c.fillStyle = gradient(c, 74, 196, 119, 237, ['#fff7dc', '#f0deb2', '#c5ba94']);
    c.beginPath(); c.moveTo(79, 177); c.quadraticCurveTo(96, 182, 110, 176);
    c.lineTo(118, 240); c.quadraticCurveTo(100, 253, 73, 243); c.quadraticCurveTo(77, 206, 79, 177); c.fill();
    line(c, [[82, 188], [79, 228]], '#c8b88b66', 2);
    line(c, [[106, 187], [111, 229]], '#fff8e3', 2);
    c.fillStyle = gradient(c, 72, 116, 122, 167, ['#fff8df', '#f7e7bf', '#cfc2a0']);
    c.beginPath(); c.moveTo(77, 109); c.quadraticCurveTo(94, 104, 109, 108);
    c.quadraticCurveTo(126, 122, 125, 136); c.lineTo(116, 183);
    c.quadraticCurveTo(94, 188, 72, 183); c.lineTo(65, 135); c.quadraticCurveTo(64, 119, 77, 109); c.fill();
    volume(c, 67, 137, 14, 24, '#fff8df', '#f0dfb9', '#c7b58f', .2);
    volume(c, 120, 134, 13, 23, '#fff9e3', '#f4e3bc', '#c9b893', -.3);
    line(c, [[67, 151], [66 - step * .2, 180]], '#d2a07b', 10);
    line(c, [[65, 153], [64 - step * .2, 179]], '#efc49e', 6);
    line(c, [[123, 151], [135, 173]], '#ce9871', 10);
    line(c, [[121, 151], [133, 173]], '#f3cba6', 6);
    volume(c, 136, 177, 6, 8, '#f8d2af', '#e8b994', '#bc896a');
    line(c, [[75, 180], [93, 183], [113, 179]], '#b87555', 5);
    line(c, [[77, 181], [65, 199]], '#e4d4ac', 4);
    // Curved wicker walls and a shaded rim make the basket a small solid object.
    c.strokeStyle = '#815932'; c.lineWidth = 6;
    c.beginPath(); c.ellipse(140, 177, 18, 22, -.15, Math.PI, Math.PI * 2); c.stroke();
    c.strokeStyle = '#dab77a'; c.lineWidth = 2;
    c.beginPath(); c.ellipse(139, 176, 18, 22, -.15, Math.PI, Math.PI * 2); c.stroke();
    c.fillStyle = gradient(c, 123, 179, 159, 210, ['#e3bd7b', '#b8874c', '#825c36']);
    c.beginPath(); c.moveTo(119, 179); c.lineTo(162, 177); c.lineTo(157, 204);
    c.quadraticCurveTo(142, 217, 126, 207); c.closePath(); c.fill();
    ellipse(c, 141, 180, 22, 5, '#926337', -.04);
    c.strokeStyle = '#f2d49b'; c.lineWidth = 3;
    c.beginPath(); c.ellipse(141, 180, 21, 5, -.04, 0, Math.PI); c.stroke();
    for (let y = 191; y < 208; y += 6) {
      c.strokeStyle = '#8b643e99'; c.lineWidth = 2;
      c.beginPath(); c.moveTo(125, y); c.quadraticCurveTo(142, y + 5, 158, y - 2); c.stroke();
    }
    for (let x = 130; x < 158; x += 8) line(c, [[x, 188], [x + 1, 207]], '#e5bd7a88', 2);
    volume(c, 94, 105, 10, 16, '#f2c8a3', '#dfac87', '#ba8263');
    volume(c, 92, 75, 27, 35, '#9a6743', '#784c36', '#4e392b');
    volume(c, 100, 77, 22, 29, '#ffe0b8', '#edbd95', '#bb8569', -.08);
    c.fillStyle = '#edbd95'; c.beginPath(); c.moveTo(115, 73);
    c.quadraticCurveTo(125, 80, 120, 83); c.lineTo(115, 85); c.fill();
    volume(c, 86, 80, 6, 9, '#f2c49c', '#dba782', '#b67c5e');
    ellipse(c, 111, 75, 2.2, 2.7, ink);
    line(c, [[107, 70], [113, 69]], '#805b40', 1.7);
    ellipse(c, 111, 74, .7, .8, '#fff5da');
    line(c, [[107, 92], [112, 93], [116, 90]], '#a76b59', 1.7);
    ellipse(c, 111, 85, 5, 3, '#e29e8488');
    // The red scarf and braid retain Hana's regional character.
    c.fillStyle = gradient(c, 70, 40, 116, 74, ['#ed9371', '#c75545', '#943d38']);
    c.beginPath(); c.moveTo(64, 69); c.quadraticCurveTo(65, 44, 87, 37);
    c.quadraticCurveTo(110, 29, 119, 55); c.lineTo(121, 67);
    c.quadraticCurveTo(99, 54, 80, 66); c.closePath(); c.fill();
    c.fillStyle = gradient(c, 57, 67, 78, 93, ['#d77559', '#a33c37']);
    c.beginPath(); c.moveTo(69, 62); c.quadraticCurveTo(59, 72, 52, 90);
    c.quadraticCurveTo(65, 86, 70, 91); c.lineTo(80, 66); c.closePath(); c.fill();
    c.fillStyle = '#c95f4b'; c.beginPath(); c.moveTo(70, 68);
    c.quadraticCurveTo(62, 88, 57, 102); c.quadraticCurveTo(74, 96, 81, 84); c.closePath(); c.fill();
    c.strokeStyle = '#ffbd8e99'; c.lineWidth = 3;
    c.beginPath(); c.moveTo(72, 55); c.quadraticCurveTo(91, 39, 108, 49); c.stroke();
    for (const [x, y] of [[79, 51], [91, 44], [102, 49], [72, 74], [65, 87]]) ellipse(c, x, y, 1.5, 1.5, '#f7d4a0');
    for (let y = 89; y < 140; y += 11) volume(c, 77 + Math.sin(y) * 2, y, 7, 9, '#b17d4f', '#815236', '#513b2b', -.2);
    line(c, [[75, 139], [79, 139]], '#d57859', 4);
    line(c, [[81, 114], [86, 125], [96, 123], [103, 112]], '#d1bc91', 2);
    ellipse(c, 96, 137, 2, 2, '#b5986f');
    ellipse(c, 96, 151, 2, 2, '#b5986f');
  });
}

function fir(variant = 0) {
  return texture(320, 480, c => {
    const palette = [
      ['#97bf83', '#4c997c', '#245c58'],
      ['#b0c887', '#66a27e', '#2d665a'],
      ['#8dbb9a', '#4d947f', '#285f5b'],
    ][variant % 3];
    c.fillStyle = gradient(c, 144, 420, 176, 465, ['#c7a775', '#8e7553', '#5b5a43']);
    c.beginPath(); c.moveTo(148, 362); c.lineTo(166, 361);
    c.quadraticCurveTo(168, 432, 176, 476); c.lineTo(143, 476); c.quadraticCurveTo(149, 424, 148, 362); c.fill();
    line(c, [[154, 424], [152, 469]], '#dfc28d88', 3);
    // Overlapping curved boughs read as soft evergreen volumes, even from afar.
    const tiers = [[159, 221, 141, 218], [158, 151, 118, 219], [157, 83, 91, 203], [157, 18, 59, 168]];
    tiers.forEach(([x, y, w, h], tier) => {
      c.beginPath(); c.moveTo(x, y);
      c.bezierCurveTo(x - w * .16, y + h * .27, x - w * .41, y + h * .49, x - w * .61, y + h * .65);
      c.quadraticCurveTo(x - w * .9, y + h * .86, x - w, y + h * .93);
      c.bezierCurveTo(x - w * .95, y + h * 1.02, x - w * .74, y + h * 1.02, x - w * .6, y + h * .98);
      c.quadraticCurveTo(x - w * .36, y + h * 1.08, x - w * .12, y + h * 1.02);
      c.quadraticCurveTo(x + w * .16, y + h * 1.1, x + w * .42, y + h * 1.02);
      c.quadraticCurveTo(x + w * .79, y + h * 1.07, x + w, y + h * .94);
      c.bezierCurveTo(x + w * .73, y + h * .75, x + w * .27, y + h * .4, x, y);
      c.closePath();
      const fill = c.createLinearGradient(x - w * .6, y + h * .3, x + w * .65, y + h * 1.05);
      fill.addColorStop(0, palette[0]); fill.addColorStop(.38, palette[1]); fill.addColorStop(1, palette[2]);
      c.fillStyle = fill; c.fill();
      c.save(); c.clip();
      // Wide translucent highlights suggest bundles of needles without line noise.
      for (let i = 0; i < 5; i++) {
        const side = i % 2 ? 1 : -1;
        const bx = x + side * w * (.19 + Math.floor(i / 2) * .23);
        const by = y + h * (.59 + Math.floor(i / 2) * .14);
        volume(c, bx, by, w * .36, h * .13, `${palette[0]}99`, `${palette[1]}55`, `${palette[2]}00`, side * .2);
      }
      const shade = c.createLinearGradient(0, y + h * .84, 0, y + h * 1.08);
      shade.addColorStop(0, '#143c3700'); shade.addColorStop(1, '#143c3766');
      c.fillStyle = shade; c.fillRect(x - w, y, w * 2, h * 1.1);
      c.strokeStyle = '#c4d79655'; c.lineWidth = 2;
      for (let i = 0; i < 7; i++) {
        const bx = x - w * .65 + i * w * .18;
        const by = y + h * (.8 + Math.sin(i * 1.8 + tier) * .09);
        c.beginPath(); c.moveTo(bx - 4, by); c.quadraticCurveTo(bx, by - 4, bx + 5, by - 3); c.stroke();
      }
      c.restore();
    });
  });
}

function birch(variant) {
  return texture(320, 480, c => {
    const seed = n => Math.abs(Math.sin(n * 117.3 + variant * 14.7));
    // Small shaded crowns overlap like rounded clusters, with air between them.
    for (let i = 0; i < 27; i++) {
      const angle = i * 2.399;
      const r = 35 + seed(i) * 78;
      const x = 156 + Math.cos(angle) * r;
      const y = 146 + Math.sin(angle) * r * .85;
      volume(c, x, y, 35 + seed(i + 1) * 13, 31 + seed(i + 2) * 16,
        i % 3 ? '#e0e5a4' : '#cbdc9b', i % 3 ? '#a9c37e' : '#98b777', '#658f66', angle * .12);
    }
    c.fillStyle = gradient(c, 144, 215, 178, 280, ['#fff5d7', '#e6e5c9', '#b7c2ab']);
    c.beginPath(); c.moveTo(148, 125); c.lineTo(163, 121);
    c.quadraticCurveTo(163, 322, 175, 474); c.lineTo(144, 474); c.quadraticCurveTo(154, 300, 148, 125); c.fill();
    line(c, [[156, 230], [118, 169], [111, 114]], '#d9dfbf', 9);
    line(c, [[153, 227], [116, 169], [110, 114]], '#f7f0cf', 4);
    line(c, [[163, 292], [202, 209], [221, 172]], '#bdc9ad', 8);
    line(c, [[160, 289], [199, 209], [219, 173]], '#eef0ce', 3);
    for (let i = 0; i < 10; i++) {
      const y = 204 + i * 27;
      line(c, i % 2 ? [[147, y], [156, y + 2]] : [[165, y], [171, y - 1]], '#637b6444', 3 + i % 2);
    }
    for (let i = 0; i < 10; i++) {
      const x = 94 + seed(i + 33) * 120;
      const y = 57 + seed(i + 68) * 157;
      volume(c, x, y, 30, 26, '#e4e9ac', '#b6cb84', '#749965', i * .7);
    }
    for (let i = 0; i < 24; i++) {
      const x = 68 + seed(i + 43) * 187;
      const y = 43 + seed(i + 78) * 195;
      ellipse(c, x, y, 5, 3, '#edf0b366', i * .7);
    }
  });
}

function flowers(kind) {
  return texture(192, 160, c => {
    const positions = [[35, 88], [72, 54], [109, 90], [143, 61], [161, 109]];
    for (let i = 0; i < positions.length; i++) {
      const [x, y] = positions[i];
      line(c, [[x, 155], [x, y]], '#628052', 4);
      ellipse(c, x - 9, y + 34, 13, 4, '#7e975b', -.5);
      ellipse(c, x + 9, y + 20, 12, 4, '#8eaa6e', .4);
      if (kind === 'mushrooms') {
        line(c, [[x, 153], [x + 1, y + 17]], '#eadbb7', 12);
        c.fillStyle = gradient(c, x - 15, y, x + 15, y + 18, ['#f3b172', i % 2 ? '#d6774e' : '#bc5943', '#8e493a']);
        c.beginPath(); c.ellipse(x, y + 16, 22, 21, 0, Math.PI, Math.PI * 2); c.fill();
        line(c, [[x - 21, y + 16], [x + 21, y + 16]], '#ecbe82', 3);
        ellipse(c, x - 8, y + 6, 3, 3, '#f6e5bb');
        ellipse(c, x + 6, y + 1, 3, 2, '#f6e5bb');
      } else {
        const color = kind === 'blue' ? '#8ba8c5' : (i % 2 ? '#f1d079' : '#f4ebcb');
        for (let p = 0; p < 5; p++) ellipse(c, x + Math.cos(p * 1.257) * 8, y + Math.sin(p * 1.257) * 8, 6, 5, color, p);
        ellipse(c, x, y, 4, 4, '#d4a45c');
      }
    }
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

function fairy(color) {
  return texture(192, 240, c => {
    ellipse(c, 54, 104, 28, 58, '#e9f5d79c', -.48);
    ellipse(c, 136, 102, 28, 58, '#e9f5d79c', .48);
    ellipse(c, 65, 144, 22, 38, '#edf5d2b0', -.8);
    ellipse(c, 126, 144, 22, 38, '#edf5d2b0', .8);
    line(c, [[42, 63], [71, 123], [59, 158]], '#ffffff9c', 2);
    line(c, [[150, 63], [121, 123], [132, 158]], '#ffffff9c', 2);
    line(c, [[86, 177], [81, 215]], '#d7bc9c', 5);
    line(c, [[105, 177], [111, 215]], '#d7bc9c', 5);
    shape(c, [[84, 105], [105, 105], [121, 181], [96, 171], [71, 181]], gradient(c, 75, 111, 122, 181, ['#fff9dc', color, '#9bb6a6']));
    line(c, [[85, 113], [64, 146], [53, 134]], '#efcfac', 6);
    line(c, [[106, 114], [125, 136], [141, 121]], '#efcfac', 6);
    volume(c, 94, 80, 21, 26, '#dfbe7d', '#b99461', '#7a7550');
    volume(c, 96, 84, 17, 22, '#ffe7c2', '#f4d1ac', '#c59f80');
    shape(c, [[74, 78], [79, 56], [99, 51], [114, 68], [100, 64], [89, 77]], '#b99461');
    ellipse(c, 91, 84, 1.5, 2, ink);
    ellipse(c, 103, 84, 1.5, 2, ink);
    line(c, [[93, 94], [98, 96], [102, 93]], '#bb8173', 1.5);
    for (let p = 0; p < 5; p++) ellipse(c, 83 + p * 7, 59 + Math.sin(p) * 3, 5, 4, p % 2 ? '#b1c788' : '#fff1bc');
    line(c, [[144, 122], [153, 104]], '#c9ac72', 3);
    ellipse(c, 155, 100, 5, 5, '#fff5cb');
  });
}

function cottage() {
  return texture(640, 560, c => {
    // Warm plaster and a deep roof give the cottage the weight of a small model.
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
    for (let i = 0; i < 8; i++) volume(c, 141 + i * 43, 533, 20, 7, '#d5d3a1', '#aab787', '#7d9772');
  });
}

function forestCreature(kind) {
  return texture(256, 320, c => {
    if (kind === 'fox') {
      // A curled brush, white bib, long muzzle, and dark stockings.
      volume(c, 92, 258, 76, 33, '#e6a35c', '#b75e39', '#814b33', -.25);
      volume(c, 60, 264, 42, 26, '#f5bc77', '#d97e42', '#a45635', -.4);
      volume(c, 30, 273, 24, 18, '#fff0cc', '#f1dfb8', '#b4aa86', -.4);
      volume(c, 141, 219, 41, 65, '#edaa62', '#c66d3b', '#874931', -.12);
      volume(c, 154, 222, 24, 49, '#fff5d2', '#efe0b8', '#baad88', -.13);
      line(c, [[134, 259], [128, 306]], '#5a5243', 11);
      line(c, [[164, 258], [171, 306]], '#5a5243', 10);
      ellipse(c, 129, 308, 15, 5, '#4d4c3e');
      ellipse(c, 172, 308, 14, 5, '#4d4c3e');
      shape(c, [[108, 149], [109, 95], [141, 132], [174, 122], [207, 101], [198, 161], [175, 187], [134, 182]], gradient(c, 112, 118, 200, 178, ['#f5b974', '#d78044', '#a05a36']));
      shape(c, [[115, 135], [116, 110], [132, 135]], '#675243');
      shape(c, [[182, 136], [199, 116], [193, 146]], '#675243');
      shape(c, [[113, 151], [148, 163], [177, 151], [199, 156], [175, 184], [143, 187]], '#f2e4c1');
      shape(c, [[143, 174], [187, 163], [172, 185]], '#f8ebcd');
      ellipse(c, 182, 169, 7, 5, '#41483c', -.2);
      ellipse(c, 138, 151, 3, 3, '#41483c');
      ellipse(c, 176, 146, 3, 3, '#41483c');
      line(c, [[160, 182], [169, 183], [175, 180]], '#9c7652', 2);
    } else if (kind === 'owl') {
      shape(c, [[83, 278], [176, 271], [188, 319], [76, 319]], '#8f815d');
      ellipse(c, 131, 277, 49, 13, '#b2a27a');
      for (let i = 0; i < 4; i++) line(c, [[90 + i * 22, 289], [87 + i * 23, 317]], '#796e53', 3);
      volume(c, 129, 192, 58, 82, '#d2c495', '#a5946a', '#6e7055');
      volume(c, 126, 204, 43, 64, '#eee0b2', '#c0b58a', '#8e916c');
      volume(c, 81, 201, 19, 58, '#b0a77b', '#857e5d', '#5a644e', -.18);
      volume(c, 176, 199, 17, 58, '#b0a77b', '#857e5d', '#5a644e', .18);
      volume(c, 128, 118, 66, 61, '#d1c18c', '#918665', '#5d6b52');
      volume(c, 100, 125, 32, 37, '#fff1c7', '#d7cda6', '#a6a17e', -.15);
      volume(c, 154, 125, 32, 37, '#fff1c7', '#d7cda6', '#a6a17e', .15);
      ellipse(c, 104, 122, 13, 16, '#514f3d');
      ellipse(c, 151, 122, 13, 16, '#514f3d');
      ellipse(c, 108, 117, 4, 5, '#f6edce');
      ellipse(c, 155, 117, 4, 5, '#f6edce');
      shape(c, [[119, 143], [137, 143], [128, 161]], '#c7a768');
      for (let row = 0; row < 4; row++) for (let i = 0; i < 4; i++) line(c, [[98 + i * 18, 184 + row * 19], [102 + i * 18, 191 + row * 19]], '#8b815c', 3);
      line(c, [[104, 270], [102, 280], [94, 282]], '#6f6950', 4);
      line(c, [[151, 270], [155, 280], [164, 281]], '#6f6950', 4);
    } else {
      // A quiet roe deer with a pale rump and alert, wide ears.
      line(c, [[75, 206], [70, 297]], '#886f4e', 8);
      line(c, [[95, 217], [101, 303]], '#a38a5c', 8);
      line(c, [[161, 213], [156, 304]], '#886f4e', 8);
      line(c, [[179, 203], [188, 298]], '#a38a5c', 8);
      for (const [x, y] of [[70, 299], [101, 305], [156, 306], [188, 300]]) line(c, [[x - 3, y], [x + 4, y]], '#514e3c', 7);
      volume(c, 121, 196, 71, 38, '#e5cb8f', '#b39663', '#7c7952', -.07);
      volume(c, 65, 193, 17, 26, '#fff0c8', '#e3d6ad', '#b2b18a', -.2);
      shape(c, [[155, 183], [168, 91], [190, 98], [191, 203]], gradient(c, 161, 130, 193, 173, ['#e1c58c', '#b39663', '#827a53']));
      shape(c, [[178, 118], [181, 202], [167, 210]], '#d7c393');
      volume(c, 177, 86, 23, 33, '#e7cc92', '#b39663', '#827b53', -.12);
      ellipse(c, 161, 61, 12, 26, '#ac915f', -.55);
      ellipse(c, 194, 59, 11, 26, '#ac915f', .5);
      ellipse(c, 161, 61, 5, 19, '#dbbf96', -.55);
      ellipse(c, 194, 59, 5, 19, '#dbbf96', .5);
      volume(c, 187, 103, 17, 10, '#f9e4b8', '#d9c49a', '#9a9672', -.18);
      ellipse(c, 199, 102, 5, 4, '#514e3c');
      ellipse(c, 187, 81, 3, 4, '#3f493c');
      ellipse(c, 187, 80, 1, 1, '#f6edce');
      line(c, [[75, 181], [121, 173], [153, 178]], '#ceb784', 4);
    }
  });
}

export function createSpriteTextures() {
  const maps = {
    hana: [0, 1, 2, 3].map(hana),
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
    conversation: texture(96, 96, c => {
      c.fillStyle = '#fff2ce';
      c.beginPath(); c.roundRect(12, 12, 72, 56, 22); c.fill();
      shape(c, [[31, 64], [29, 81], [48, 65]], '#fff2ce');
      for (let i = 0; i < 3; i++) ellipse(c, 31 + i * 17, 40, 4, 4, '#7b8160');
    }),
    fairies: ['#ffeac3', '#ffcfb1', '#bce9e7'].map(fairy),
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
  maps.dispose = () => Object.values(maps).forEach(value => {
    if (Array.isArray(value)) value.forEach(map => map.dispose());
    else if (value?.isTexture) value.dispose();
  });
  return maps;
}
