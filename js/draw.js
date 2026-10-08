// draw.js — every picture in the app is built from these small "sprites".
//
// A sprite is a plain object: { w, h, svg }  (svg is drawn in a box from 0,0 to w,h).
// Toy functions return sprites. Layout functions (row, col, grid, flow, scatter...)
// take sprites and return a bigger sprite. render() turns a sprite into an <svg>.
// Nothing here touches the DOM, so it runs in Node for tools/validate.mjs too.

import { ANIMAL, bunny as toyBunny } from './animals.js';

const R = (n) => Math.round(n * 10) / 10;

export const INK = '#22304F';

// Toy colours. Use these names in activities so words and pictures always agree.
export const PAL = {
  red: '#D7282F',
  blue: '#1F6FD0',
  yellow: '#F5BE1B',
  green: '#2E9E4B',
  orange: '#F07F1E',
  purple: '#7B4BB7',
  pink: '#E86AA6',
  white: '#F7F7F2',
  black: '#2E2E33',
  brown: '#8A5A32',
  grey: '#96A0AC',
  teal: '#1FA4A0',
  wood: '#D9B27A',
};
export const BRICK_COLOURS = ['red', 'blue', 'yellow', 'green'];
export const MORE_COLOURS = ['red', 'blue', 'yellow', 'green', 'orange', 'purple'];

// Numicon shape colours 1-10 (index 0 unused).
export const NUMICON = [
  null,
  '#F28C28', // 1 orange
  '#6EC1E4', // 2 light blue
  '#F7D038', // 3 yellow
  '#7AC943', // 4 light green
  '#E5383B', // 5 red
  '#1FA4A0', // 6 turquoise
  '#EE77A8', // 7 pink
  '#1E9E4A', // 8 bright green
  '#8E5FBF', // 9 purple
  '#2B4FA8', // 10 dark blue
];

const col = (c) => PAL[c] || c;

export function shade(hex, f) {
  const n = parseInt(hex.slice(1), 16);
  const t = f < 0 ? 0 : 255;
  const a = Math.abs(f);
  const ch = [n >> 16, (n >> 8) & 255, n & 255].map((v) => Math.round(v + (t - v) * a));
  return '#' + ch.map((v) => v.toString(16).padStart(2, '0')).join('');
}

export const sp = (w, h, svg) => ({ w, h, svg });
export const at = (s, x, y) => `<g transform="translate(${R(x)} ${R(y)})">${s.svg}</g>`;
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

// ---------------------------------------------------------------- numerals
// Hand-drawn digit shapes so numerals look the same on every phone and match
// the plain forms children are taught (open 4, no-serif 1, straight 7).
const DIG = {
  0: 'M30 9C14 9 9 30 9 50s5 41 21 41 21-21 21-41S46 9 30 9Z',
  1: 'M19 27 33 10V91',
  2: 'M11 29C11 3 51 3 50 30 49 50 22 66 11 91H51',
  3: 'M11 19C22 4 51 6 50 28 49 43 36 48 25 48 40 48 53 56 52 71 50 95 19 97 9 81',
  4: 'M40 91V10L9 66H53',
  5: 'M48 10H17L13 46C26 37 52 42 52 66 52 94 21 97 9 81',
  6: 'M44 9C23 20 9 45 9 68 9 97 52 97 52 68 52 45 17 42 10 64',
  7: 'M9 10H52L24 91',
  8: 'M30 48C9 44 9 9 30 9S51 44 30 48C5 54 5 91 30 91S55 54 30 48Z',
  9: 'M51 34C51 5 9 5 9 32 9 58 48 58 51 34V60C50 80 38 91 18 91',
};

export function numeral(n, h = 40, color = INK) {
  const ds = String(n).split('');
  const k = h / 100;
  const dw = 58 * k;
  const svg = ds
    .map(
      (d, i) =>
        `<path transform="translate(${R(i * dw)} 0) scale(${Math.round(k * 1000) / 1000})" d="${DIG[d]}" fill="none" stroke="${color}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>`
    )
    .join('');
  return sp(R(ds.length * dw + 2 * k), h, svg);
}

// A numeral card, like the ones in the Numicon kit.
export function card(n, h = 60) {
  const num = numeral(n, h * 0.6);
  const w = Math.max(h * 0.74, num.w + h * 0.3);
  return sp(
    w,
    h,
    `<rect x=".75" y=".75" width="${R(w - 1.5)}" height="${R(h - 1.5)}" rx="6" fill="#fff" stroke="${INK}" stroke-width="1.5"/>` +
      at(num, (w - num.w) / 2, (h - num.h) / 2)
  );
}

export function text(str, size = 12, o = {}) {
  const w = String(str).length * size * (o.bold ? 0.6 : 0.56);
  return sp(
    R(w),
    R(size * 1.25),
    `<text x="${R(w / 2)}" y="${R(size)}" text-anchor="middle" font-size="${size}" font-weight="${o.bold ? 700 : 500}" fill="${o.color || INK}">${esc(str)}</text>`
  );
}

// ---------------------------------------------------------------- Duplo
const U = 18; // one stud wide
const BH = 22; // brick body height
const SH = 5; // stud height

function brickSvg(x, y, studs, colour) {
  const c = col(colour);
  const d = shade(c, -0.28);
  let s = '';
  for (let i = 0; i < studs; i++)
    s += `<rect x="${x + i * U + 3}" y="${y - SH}" width="${U - 6}" height="${SH + 2}" rx="2" fill="${c}" stroke="${d}"/>`;
  s += `<rect x="${x + 0.5}" y="${y + 0.5}" width="${studs * U - 1}" height="${BH - 1}" rx="2.5" fill="${c}" stroke="${d}"/>`;
  s += `<rect x="${x + 3}" y="${y + 3}" width="${studs * U - 6}" height="3" rx="1.5" fill="#fff" opacity=".3"/>`;
  return s;
}

export function duplo(colour, studs = 2) {
  return sp(studs * U, BH + SH, brickSvg(0, SH, studs, colour));
}

// colours listed from the BOTTOM brick up.
export function tower(colours, studs = 2) {
  const n = colours.length;
  let s = '';
  for (let i = 0; i < n; i++) s += brickSvg(0, SH + (n - 1 - i) * BH, studs, colours[i]);
  return sp(studs * U, n * BH + SH, s);
}

// A Duplo build seen from the front. bricks: [{x, y, w, colour}] where x and w
// are in studs and y is the layer (0 = on the table).
export function model(bricks, o = {}) {
  const W = Math.max(...bricks.map((b) => b.x + b.w));
  const L = Math.max(...bricks.map((b) => b.y)) + 1;
  const s = bricks
    .map((b, i) => ({ b, i }))
    .sort((p, q) => p.b.y - q.b.y)
    .map(({ b, i }) => {
      const g = brickSvg(b.x * U, SH + (L - 1 - b.y) * BH, b.w, b.colour);
      return o.hit ? `<g class="hit" data-key="b${i}" tabindex="0" role="button">${g}</g>` : g;
    })
    .join('');
  return sp(W * U, L * BH + SH, s);
}

// ---------------------------------------------------------------- wooden blocks
const B = 26;
// width, height in block units
export const BLOCK_SIZE = {
  cube: [1, 1],
  brick: [2, 1],
  pillar: [1, 2],
  plank: [3, 0.5],
  roof: [2, 1],
  arch: [2, 1],
  cyl: [1, 2],
};
export const BLOCK_NAME = {
  cube: 'cube',
  brick: 'long block',
  pillar: 'tall block',
  plank: 'flat plank',
  roof: 'triangle',
  arch: 'arch',
  cyl: 'cylinder',
};

function blockSvg(shape, colour, x, y) {
  const c = col(colour);
  const d = shade(c, -0.3);
  const [bw, bh] = BLOCK_SIZE[shape];
  const w = bw * B;
  const h = bh * B;
  const st = `fill="${c}" stroke="${d}" stroke-width="1.2" stroke-linejoin="round"`;
  let s;
  if (shape === 'roof') s = `<path d="M${x + 1} ${y + h - 0.5}L${x + w / 2} ${y + 1}L${x + w - 1} ${y + h - 0.5}Z" ${st}/>`;
  else if (shape === 'arch') {
    const a = 10;
    const r = (w - 2 * a) / 2;
    s = `<path d="M${x + 0.5} ${y + h - 0.5}V${y + 0.5}H${x + w - 0.5}V${y + h - 0.5}H${x + w - a}A${r} ${r} 0 0 0 ${x + a} ${y + h - 0.5}Z" ${st}/>`;
  } else if (shape === 'cyl') {
    s =
      `<path d="M${x + 0.5} ${y + 5}V${y + h - 0.5}H${x + w - 0.5}V${y + 5}" ${st}/>` +
      `<ellipse cx="${x + w / 2}" cy="${y + 5}" rx="${w / 2 - 0.5}" ry="4.5" fill="${shade(c, 0.25)}" stroke="${d}" stroke-width="1.2"/>`;
  } else s = `<rect x="${x + 0.5}" y="${y + 0.5}" width="${w - 1}" height="${h - 1}" rx="2" ${st}/>`;
  if (shape !== 'roof' && shape !== 'cyl' && h > 10)
    s += `<rect x="${x + 3}" y="${y + 3}" width="${w - 6}" height="2.5" rx="1.2" fill="#fff" opacity=".28"/>`;
  return s;
}

export function block(shape, colour) {
  const [bw, bh] = BLOCK_SIZE[shape];
  return sp(bw * B, bh * B, blockSvg(shape, colour, 0, 0));
}

// A wooden build seen from the front. blocks: [{shape, colour, x, y}] with x
// (from the left) and y (height of the block's bottom off the table) in block units.
export function build(blocks) {
  const W = Math.max(...blocks.map((b) => b.x + BLOCK_SIZE[b.shape][0])) * B;
  const H = Math.max(...blocks.map((b) => b.y + BLOCK_SIZE[b.shape][1])) * B;
  const s = blocks.map((b) => blockSvg(b.shape, b.colour, b.x * B, H - (b.y + BLOCK_SIZE[b.shape][1]) * B)).join('');
  return sp(W, H, s);
}

// ---------------------------------------------------------------- cars
export function car(colour) {
  const c = col(colour);
  const d = shade(c, -0.3);
  return sp(
    54,
    30,
    `<path d="M11 14 16 4Q17 1.5 20 1.5H35Q38 1.5 39 4L44 14Z" fill="${c}" stroke="${d}"/>` +
      `<path d="M18.5 5H26V12.5H15Z" fill="#DDF0FA"/><path d="M28.5 5H36L39.5 12.5H28.5Z" fill="#DDF0FA"/>` +
      `<rect x=".5" y="12.5" width="53" height="12" rx="5" fill="${c}" stroke="${d}"/>` +
      `<rect x="48.5" y="15" width="4" height="4" rx="1.5" fill="#FFE98A"/>` +
      `<circle cx="13" cy="24" r="6" fill="#2E2E33"/><circle cx="13" cy="24" r="2.4" fill="#C9CFD8"/>` +
      `<circle cx="41" cy="24" r="6" fill="#2E2E33"/><circle cx="41" cy="24" r="2.4" fill="#C9CFD8"/>`
  );
}

// ---------------------------------------------------------------- animals
// The drawings live in animals.js (they are long). Each has parts that can move when it dances.
export const ANIMALS = Object.keys(ANIMAL);
export const FARM = ['cow', 'pig', 'sheep', 'horse', 'duck'];
export const animal = (kind) => ANIMAL[kind]();
export const bunny = toyBunny;

// ---------------------------------------------------------------- linking cubes
const C = 18;
function cubeSvg(x, y, colour) {
  const c = col(colour);
  return (
    `<rect x="${x + 0.5}" y="${y + 0.5}" width="${C - 1}" height="${C - 1}" rx="3" fill="${c}" stroke="${shade(c, -0.3)}"/>` +
    `<circle cx="${x + C / 2}" cy="${y + C / 2}" r="3.2" fill="${shade(c, 0.28)}" stroke="${shade(c, -0.18)}" stroke-width=".8"/>`
  );
}
export const cube = (colour) => sp(C, C, cubeSvg(0, 0, colour));

// A stick of linking cubes. Horizontal: colours left to right. Vertical: bottom to top.
export function rod(colours, vertical = false) {
  const n = colours.length;
  if (vertical) return sp(C, n * C, colours.map((c, i) => cubeSvg(0, (n - 1 - i) * C, c)).join(''));
  return sp(n * C, C, colours.map((c, i) => cubeSvg(i * C, 0, c)).join(''));
}

// ---------------------------------------------------------------- Numicon
export function numicon(n, cell = 15) {
  const rows = Math.ceil(n / 2);
  const W = n === 1 ? cell : 2 * cell;
  const H = rows * cell;
  const c = NUMICON[n];
  const odd = n % 2 === 1 && n > 1;
  const outline = odd ? `M1 1H${cell}V${cell}H${W - 1}V${H - 1}H1Z` : `M1 1H${W - 1}V${H - 1}H1Z`;
  let s = `<path d="${outline}" fill="${c}" stroke="${shade(c, -0.3)}" stroke-width="1.6" stroke-linejoin="round"/>`;
  // holes: fill pairs from the bottom up; an odd one sits on top at the left
  for (let i = 0; i < n; i++) {
    const rowFromBottom = Math.floor(i / 2);
    const colI = i % 2;
    const cx = colI * cell + cell / 2;
    const cy = H - rowFromBottom * cell - cell / 2;
    s += `<circle cx="${cx}" cy="${cy}" r="${R(cell * 0.3)}" fill="#fff" fill-opacity=".92" stroke="${shade(c, -0.3)}" stroke-width=".9"/>`;
  }
  return sp(W, H, s);
}

// ---------------------------------------------------------------- dot cards
const DICE = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [2, 0], [0, 2], [2, 2]],
  5: [[0, 0], [2, 0], [1, 1], [0, 2], [2, 2]],
  6: [[0, 0], [0, 1], [0, 2], [2, 0], [2, 1], [2, 2]],
};

// arrangement: 'dice' (1-6), 'line', 'pairs' (two rows), or 'loose' (needs rng)
export function dots(n, arrangement = 'dice', rng = null, colour = INK) {
  const S = 84;
  let pts = [];
  if (arrangement === 'dice' && DICE[n]) pts = DICE[n].map(([c, r]) => [18 + c * 24, 18 + r * 24]);
  else if (arrangement === 'line' && n <= 5) pts = Array.from({ length: n }, (_, i) => [S / 2 - ((n - 1) * 15) / 2 + i * 15, S / 2]);
  else if (arrangement === 'loose' && rng) {
    let tries = 0;
    while (pts.length < n && tries++ < 4000) {
      const p = [14 + rng.float() * (S - 28), 14 + rng.float() * (S - 28)];
      if (pts.every((q) => Math.hypot(q[0] - p[0], q[1] - p[1]) > 17)) pts.push(p);
    }
  }
  if (pts.length < n) {
    // 'pairs' and the fallback: two tidy rows, top row first
    pts = [];
    const top = Math.ceil(n / 2);
    for (let i = 0; i < n; i++) {
      const rowI = i < top ? 0 : 1;
      const k = rowI === 0 ? i : i - top;
      pts.push([S / 2 - ((top - 1) * 14) / 2 + k * 14, rowI === 0 ? S / 2 - 9 : S / 2 + 9]);
    }
  }
  const r = n > 6 ? 5 : 6.5;
  return sp(
    S,
    S,
    `<rect x=".75" y=".75" width="${S - 1.5}" height="${S - 1.5}" rx="10" fill="#fff" stroke="${INK}" stroke-width="1.5"/>` +
      pts.map(([x, y]) => `<circle cx="${R(x)}" cy="${R(y)}" r="${r}" fill="${colour}"/>`).join('')
  );
}

// ---------------------------------------------------------------- trains
export function engine(colour = 'red') {
  const c = col(colour);
  const d = shade(c, -0.3);
  return sp(
    54,
    40,
    `<rect x="35" y="6" width="7" height="12" rx="1.5" fill="#2E2E33"/>` +
      `<rect x="14" y="15" width="34" height="16" rx="5" fill="${c}" stroke="${d}"/>` +
      `<rect x="2.5" y="5.5" width="17" height="25.5" rx="2.5" fill="${c}" stroke="${d}"/>` +
      `<rect x=".5" y="2.5" width="21" height="4.5" rx="2" fill="${d}"/>` +
      `<rect x="6" y="10" width="9.5" height="8" rx="1.5" fill="#DDF0FA"/>` +
      [10, 26, 41].map((x) => `<circle cx="${x}" cy="34" r="5.5" fill="#2E2E33"/><circle cx="${x}" cy="34" r="2" fill="#C9CFD8"/>`).join('') +
      `<circle cx="51.5" cy="27" r="2.3" fill="#8D97A3"/>`
  );
}

// A wagon, optionally carrying a sprite (a cube, a brick, an animal...).
export function wagon(cargo = null, colour = 'blue') {
  const c = col(colour);
  const ch = cargo ? cargo.h : 10;
  const w = Math.max(40, cargo ? cargo.w + 8 : 40);
  return sp(
    w,
    ch + 16,
    (cargo ? at(cargo, (w - cargo.w) / 2, 0) : '') +
      `<rect x="2.5" y="${ch}" width="${w - 5}" height="7" rx="2" fill="${c}" stroke="${shade(c, -0.3)}"/>` +
      [11, w - 11].map((x) => `<circle cx="${x}" cy="${ch + 10.5}" r="5.2" fill="#2E2E33"/><circle cx="${x}" cy="${ch + 10.5}" r="1.9" fill="#C9CFD8"/>`).join('') +
      `<circle cx="1.8" cy="${ch + 4}" r="1.8" fill="#8D97A3"/><circle cx="${w - 1.8}" cy="${ch + 4}" r="1.8" fill="#8D97A3"/>`
  );
}

// engine on the right, pulling the wagons listed front-to-back
export function train(wagons, engineColour = 'red') {
  return onTrack(row([...wagons].reverse().concat(engine(engineColour)), { gap: 1 }));
}

// put any sprite on a length of wooden track (side view)
export function onTrack(s, extra = 8) {
  const w = s.w + extra * 2;
  return sp(
    w,
    s.h + 6,
    `<rect x="0" y="${s.h - 1}" width="${w}" height="7" rx="2" fill="${PAL.wood}" stroke="${shade(PAL.wood, -0.3)}"/>` + at(s, extra, 0)
  );
}

// Wooden track seen from above. d is an SVG path for the centre line of the track.
export function trackPath(d, w, h) {
  const base = `fill="none" stroke-linecap="butt" stroke-linejoin="round"`;
  return sp(
    w,
    h,
    `<path d="${d}" ${base} stroke="${shade(PAL.wood, -0.3)}" stroke-width="20"/>` +
      `<path d="${d}" ${base} stroke="${PAL.wood}" stroke-width="18"/>` +
      `<path d="${d}" ${base} stroke="${shade(PAL.wood, -0.22)}" stroke-width="11"/>` +
      `<path d="${d}" ${base} stroke="${PAL.wood}" stroke-width="8.5"/>`
  );
}

// Wooden track seen from above, drawn piece by piece so the joins show and the pieces can be counted.
// pieces is a string, one letter per piece, laid end to end from the left:
//   S long straight   s short straight (half as long)   L curve bending left   R curve bending right
// A curve is an eighth of a circle (8 make a ring) and about as long as a long straight, as in wooden train sets.
// o.gap: index of a piece to leave out, drawn as a dashed "?" space.
const TL = 40;
const TR = 51;
export const TRACK_NAME = { S: 'long straight', s: 'short straight', L: 'curve', R: 'curve' };
export function trackPlan(pieces, o = {}) {
  const rad = (d) => (d * Math.PI) / 180;
  let x = 0;
  let y = 0;
  let h = 0; // heading in degrees: 0 is to the right, and y grows down the screen
  const segs = [];
  const pts = [[0, 0]];
  for (const k of pieces) {
    const from = [x, y, h];
    let d;
    if (k === 'S' || k === 's') {
      const len = k === 'S' ? TL : TL / 2;
      x += len * Math.cos(rad(h));
      y += len * Math.sin(rad(h));
      d = `M${R(from[0])} ${R(from[1])}L${R(x)} ${R(y)}`;
      pts.push([x, y]);
    } else {
      const side = k === 'L' ? -1 : 1; // left is anticlockwise on the screen
      const cx = x - side * TR * Math.sin(rad(h));
      const cy = y + side * TR * Math.cos(rad(h));
      const a0 = Math.atan2(y - cy, x - cx);
      for (const t of [0.5, 1]) pts.push([cx + TR * Math.cos(a0 + side * rad(45) * t), cy + TR * Math.sin(a0 + side * rad(45) * t)]);
      [x, y] = pts[pts.length - 1];
      h += side * 45;
      d = `M${R(from[0])} ${R(from[1])}A${TR} ${TR} 0 0 ${side === 1 ? 1 : 0} ${R(x)} ${R(y)}`;
    }
    segs.push({ d, from, mid: pts[pts.length - (k === 'S' || k === 's' ? 1 : 2)] });
    if (k === 'S' || k === 's') segs[segs.length - 1].mid = [(from[0] + x) / 2, (from[1] + y) / 2];
  }
  const P = 10;
  const minX = Math.min(...pts.map((p) => p[0])) - P;
  const minY = Math.min(...pts.map((p) => p[1])) - P;
  const w = Math.max(...pts.map((p) => p[0])) + P - minX;
  const hgt = Math.max(...pts.map((p) => p[1])) + P - minY;
  const base = `fill="none" stroke-linecap="butt"`;
  const dark = shade(PAL.wood, -0.3);
  let svg = '';
  segs.forEach((g, i) => {
    if (i === o.gap) {
      svg += `<path d="${g.d}" ${base} stroke="#fff" stroke-opacity=".7" stroke-width="14"/><path d="${g.d}" ${base} stroke="#7A8499" stroke-width="14" stroke-opacity=".28" stroke-dasharray="4 4"/>`;
      const q = text('?', 13, { bold: true, color: '#4A5670' });
      svg += at(q, g.mid[0] - q.w / 2, g.mid[1] - q.h / 2);
      return;
    }
    svg +=
      `<path d="${g.d}" ${base} stroke="${dark}" stroke-width="15"/>` +
      `<path d="${g.d}" ${base} stroke="${PAL.wood}" stroke-width="13"/>` +
      `<path d="${g.d}" ${base} stroke="${shade(PAL.wood, -0.22)}" stroke-width="8"/>` +
      `<path d="${g.d}" ${base} stroke="${PAL.wood}" stroke-width="5.6"/>`;
  });
  // a line across the track at each join
  segs.forEach((g, i) => {
    if (!i) return;
    const [jx, jy, jh] = g.from;
    const nx = -Math.sin(rad(jh)) * 7.5;
    const ny = Math.cos(rad(jh)) * 7.5;
    svg += `<path d="M${R(jx - nx)} ${R(jy - ny)}L${R(jx + nx)} ${R(jy + ny)}" stroke="${dark}" stroke-width="1.4"/>`;
  });
  return sp(R(w), R(hgt), `<g transform="translate(${R(-minX)} ${R(-minY)})">${svg}</g>`);
}

// A wooden train bridge seen from the side: a humped length of track on two legs, tall enough for a train to pass under.
export function trackBridge() {
  const c = PAL.wood;
  const d = shade(c, -0.3);
  return sp(
    96,
    44,
    `<rect x="26" y="12" width="8" height="32" rx="1.5" fill="${shade(c, -0.12)}" stroke="${d}"/><rect x="62" y="12" width="8" height="32" rx="1.5" fill="${shade(c, -0.12)}" stroke="${d}"/>` +
      `<path d="M1 43Q20 6 48 6T95 43H86Q70 14 48 14T10 43Z" fill="${c}" stroke="${d}" stroke-width="1.2" stroke-linejoin="round"/>`
  );
}

// ---------------------------------------------------------------- rabbit game blocks
// Our own plain drawings of the three wooden pieces in the owner's rabbit hide-and-seek game, seen from the front:
// a hollow blue box (open at the front, a star-shaped hole in the top), a yellow block with a round hole
// right through it, and a low red block with a dip in the top. See CLAUDE.md, "The rabbit game".
export const PEEK_NAME = { blue: 'blue box', yellow: 'yellow block', red: 'red block' };
export function peek(kind, inside = null) {
  if (kind === 'blue') {
    const c = PAL.blue;
    const d = shade(c, -0.3);
    const S = 66;
    const T = 9;
    return sp(
      S,
      S + T,
      `<rect x=".6" y=".6" width="${S - 1.2}" height="${T + 2}" rx="2" fill="${shade(c, 0.22)}" stroke="${d}" stroke-width="1.2"/>` +
        `<path transform="translate(${S / 2 - 6} -1.2) scale(.5)" d="M12 1.8l3.1 6.5 7.1.9-5.2 4.9 1.3 7.1L12 17.8 5.7 21.2 7 14.1 1.8 9.2l7.1-.9z" fill="${shade(c, -0.55)}"/>` +
        `<rect x=".6" y="${T + 0.6}" width="${S - 1.2}" height="${S - 1.2}" rx="3" fill="${c}" stroke="${d}" stroke-width="1.2"/>` +
        `<rect x="9" y="${T + 9}" width="${S - 18}" height="${S - 18}" rx="2" fill="${shade(c, -0.5)}" stroke="${d}" stroke-width="1"/>` +
        (inside ? at(inside, (S - inside.w) / 2, T + S - 9 - inside.h) : '')
    );
  }
  if (kind === 'yellow') {
    const c = PAL.yellow;
    return sp(
      46,
      46,
      `<path fill-rule="evenodd" d="M3 .6H43Q45.4 .6 45.4 3V43Q45.4 45.4 43 45.4H3Q.6 45.4 .6 43V3Q.6 .6 3 .6ZM23 10A13 13 0 1 0 23.01 10Z" fill="${c}" stroke="${shade(c, -0.3)}" stroke-width="1.2"/>`
    );
  }
  const c = PAL.red;
  return sp(54, 20, `<path d="M3 .6H12A15 11 0 0 0 42 .6H51Q53.4 .6 53.4 3V19.4H.6V3Q.6 .6 3 .6Z" fill="${c}" stroke="${shade(c, -0.3)}" stroke-width="1.2" stroke-linejoin="round"/>`);
}

// ---------------------------------------------------------------- Numicon shapes fitted together
// Stack Numicon shapes so they cover the same holes as one bigger shape. parts: the numbers, e.g. [3, 5].
// Even shapes go at the bottom; an odd one sits upright on them; a second odd one is turned round to lock into the first.
// At most two odd shapes.
export function numiconStack(parts, cell = 15) {
  const total = parts.reduce((a, b) => a + b, 0);
  const H = Math.ceil(total / 2) * cell;
  const order = [...parts.filter((p) => p % 2 === 0), ...parts.filter((p) => p % 2 === 1)];
  let rowsDone = 0; // full rows covered so far
  let half = false; // is the next row already half covered (left hole only)?
  let svg = '';
  for (const p of order) {
    const s = numicon(p, cell);
    if (p % 2 === 0) {
      svg += at(s, 0, H - rowsDone * cell - s.h);
      rowsDone += p / 2;
    } else if (!half) {
      svg += at(s, 0, H - rowsDone * cell - s.h);
      rowsDone += (p - 1) / 2;
      half = true;
    } else {
      const x = p === 1 ? cell : 0;
      svg += `<g transform="translate(${R(x)} ${R(H - rowsDone * cell - s.h)}) rotate(180 ${R(s.w / 2)} ${R(s.h / 2)})">${s.svg}</g>`;
      rowsDone += (p + 1) / 2;
      half = false;
    }
  }
  return sp(2 * cell, H, svg);
}

// ---------------------------------------------------------------- flat shapes
// For "is it a triangle?" games. Some are deliberately NOT what they nearly look like.
const SHAPES = {
  tri: 'M22 4 41 38H3Z',
  triThin: 'M22 2 29 42H15Z',
  triDown: 'M3 6H41L22 40Z',
  triRight: 'M5 5V39H41Z',
  triWide: 'M2 34H42L32 14Z',
  triRound: 'M22 4Q40 20 41 38Q22 44 3 38Q4 20 22 4Z', // curvy sides: not a triangle
  triOpen: 'M27 12 41 38H3L17 12', // doesn't join up: not a triangle
  triBlunt: 'M17 6H27L41 38H3Z', // top chopped off: four corners
  square: 'M6 6H38V38H6Z',
  rect: 'M2 12H42V32H2Z',
  rectTall: 'M13 2H31V42H13Z',
  diamond: 'M22 3 41 22 22 41 3 22Z',
  kite: 'M22 2 36 16 22 42 8 16Z',
  circle: 'M22 4A18 18 0 1 1 21.9 4Z',
  oval: 'M22 10A20 12 0 1 1 21.9 10Z',
  pent: 'M22 3 41 17 34 39H10L3 17Z',
};
export const SHAPE_KINDS = Object.keys(SHAPES);
export function flat(kind, colour) {
  const c = col(colour);
  const open = kind === 'triOpen';
  return sp(
    44,
    44,
    `<path d="${SHAPES[kind]}" fill="${open ? 'none' : c}" stroke="${open ? c : shade(c, -0.3)}" stroke-width="${open ? 4 : 1.4}" stroke-linejoin="round" stroke-linecap="round"/>`
  );
}

// A plank ramp resting on a stack of blocks, with a car at the top.
export function ramp(blocksHigh, colour = 'red') {
  const top = blocksHigh * B;
  const len = 110;
  const H = top + 30;
  const stack = build(Array.from({ length: blocksHigh }, (_, i) => ({ shape: 'cube', colour: 'wood', x: 0, y: i })));
  const ang = (Math.atan2(top, len) * 180) / Math.PI;
  return sp(
    B + len,
    H,
    at(stack, 0, H - top) +
      `<path d="M${B - 4} ${H - top}L${B + len} ${H - 3}V${H}H${B + len - 12}L${B - 4} ${H - top + 5}Z" fill="${PAL.wood}" stroke="${shade(PAL.wood, -0.3)}" stroke-linejoin="round"/>` +
      `<g transform="translate(${B + 2} ${H - top - 31}) rotate(${R(ang)} 0 30) scale(.8)">${car(colour).svg}</g>`
  );
}

// A finish flag.
export function flag() {
  return sp(
    20,
    50,
    `<path d="M3 2V49" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><path d="M4 3H19L14 9 19 15H4Z" fill="${PAL.red}" stroke="${shade(PAL.red, -0.3)}"/>`
  );
}

// ---------------------------------------------------------------- props
export function qbox(w = 40, h = 44) {
  const q = text('?', Math.min(w, h) * 0.6, { bold: true, color: '#7A8499' });
  return sp(
    w,
    h,
    `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="7" fill="#fff" fill-opacity=".6" stroke="#7A8499" stroke-width="1.6" stroke-dasharray="5 4"/>` +
      at(q, (w - q.w) / 2, (h - q.h) / 2)
  );
}

// A tea towel hiding something.
export function cover(w = 80, h = 44) {
  let stripes = '';
  for (let x = 12; x < w - 4; x += 14) stripes += `<path d="M${x} 3V${h - 3}" stroke="#9CC3EA" stroke-width="4"/>`;
  const q = text('?', 24, { bold: true });
  return sp(
    w,
    h,
    `<rect x="1" y="1" width="${w - 2}" height="${h - 2}" rx="8" fill="#F4F8FC" stroke="${INK}" stroke-width="1.4"/>` +
      stripes +
      `<circle cx="${w / 2}" cy="${h / 2}" r="15" fill="#fff" stroke="${INK}" stroke-width="1.4"/>` +
      at(q, (w - q.w) / 2, (h - q.h) / 2 - 1)
  );
}

// An open-fronted box / garage / field around a sprite, with an optional label.
export function frame(s, o = {}) {
  const p = o.pad ?? 8;
  const lab = o.label ? text(o.label, 11, { bold: true }) : null;
  const top = lab ? lab.h + 2 : 0;
  const w = Math.max(s.w + p * 2, lab ? lab.w + 8 : 0, o.minW || 0);
  const h = s.h + p * 2;
  return sp(
    w,
    h + top,
    (lab ? at(lab, (w - lab.w) / 2, 0) : '') +
      `<rect x="1" y="${top + 1}" width="${w - 2}" height="${h - 2}" rx="${o.rx ?? 9}" fill="${o.fill || '#fff'}" fill-opacity="${o.opacity ?? 0.55}" stroke="${o.stroke || INK}" stroke-width="1.4"${o.dash ? ' stroke-dasharray="5 4"' : ''}/>` +
      at(s, (w - s.w) / 2, top + p)
  );
}

export function arrow(len = 28, dir = 'right') {
  const a = `<path d="M2 8H${len - 3}M${len - 9} 2.5 ${len - 2.5} 8 ${len - 9} 13.5" fill="none" stroke="${INK}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`;
  if (dir === 'left') return sp(len, 16, `<g transform="translate(${len} 0) scale(-1 1)">${a}</g>`);
  if (dir === 'down') return sp(16, len, `<g transform="translate(16 0) rotate(90)">${a}</g>`);
  return sp(len, 16, a);
}

export const sign = (ch, size = 22) => text(ch, size, { bold: true });
export const gap = (w = 8, h = 1) => sp(w, h, '');

// Numbered bubble(s) above a sprite (used when showing how to count).
// n can be a number, a list of numbers (said two numbers for one toy), or null (no number said).
export function tag(s, n) {
  const ns = n == null ? [] : [].concat(n);
  const bubbles = ns.map((v) => {
    const num = numeral(v, 11, '#fff');
    const bw = Math.max(18, num.w + 9);
    return sp(bw, 18, `<rect width="${bw}" height="18" rx="9" fill="${INK}"/>` + at(num, (bw - num.w) / 2, 3.5));
  });
  const top = bubbles.length ? row(bubbles, { gap: 2 }) : sp(1, 18, '');
  const w = Math.max(s.w, top.w);
  return sp(w, s.h + 22, at(top, (w - top.w) / 2, 0) + at(s, (w - s.w) / 2, 22));
}

// Ring a sprite to point it out.
export function ring(s, colour = '#D7282F') {
  return sp(
    s.w + 12,
    s.h + 12,
    at(s, 6, 6) + `<rect x="1.5" y="1.5" width="${s.w + 9}" height="${s.h + 9}" rx="10" fill="none" stroke="${colour}" stroke-width="3"/>`
  );
}

// Make a sprite tappable. The app reports which key was tapped.
export function hit(s, key) {
  return sp(
    s.w,
    s.h,
    `<g class="hit" data-key="${esc(key)}" tabindex="0" role="button"><rect x="-5" y="-5" width="${s.w + 10}" height="${s.h + 10}" rx="8" fill="#fff" fill-opacity="0"/>${s.svg}</g>`
  );
}

// ---------------------------------------------------------------- layout
export function row(items, o = {}) {
  const g = o.gap ?? 8;
  const align = o.align || 'bottom';
  const h = Math.max(...items.map((s) => s.h));
  let x = 0;
  let svg = '';
  for (const s of items) {
    const y = align === 'bottom' ? h - s.h : align === 'top' ? 0 : (h - s.h) / 2;
    svg += at(s, x, y);
    x += s.w + g;
  }
  return sp(x - g, h, svg);
}

export function column(items, o = {}) {
  const g = o.gap ?? 8;
  const align = o.align || 'center';
  const w = Math.max(...items.map((s) => s.w));
  let y = 0;
  let svg = '';
  for (const s of items) {
    const x = align === 'left' ? 0 : align === 'right' ? w - s.w : (w - s.w) / 2;
    svg += at(s, x, y);
    y += s.h + g;
  }
  return sp(w, y - g, svg);
}

// rows of at most `per` items
export function grid(items, per, o = {}) {
  const rows = [];
  for (let i = 0; i < items.length; i += per) rows.push(row(items.slice(i, i + per), o));
  return column(rows, { gap: o.rowGap ?? o.gap ?? 8, align: o.rowAlign || 'left' });
}

// like words in a paragraph: wrap onto a new row when the row gets too wide
export function flow(items, o = {}) {
  const maxW = o.maxW ?? 320;
  const g = o.gap ?? 8;
  const rows = [];
  let cur = [];
  let w = 0;
  for (const s of items) {
    if (cur.length && w + s.w > maxW) {
      rows.push(row(cur, o));
      cur = [];
      w = 0;
    }
    cur.push(s);
    w += s.w + g;
  }
  if (cur.length) rows.push(row(cur, o));
  return column(rows, { gap: o.rowGap ?? 10, align: o.rowAlign || 'center' });
}

// Scatter sprites at random without overlapping. Falls back to tidy rows.
export function scatter(items, rng, o = {}) {
  const W = o.w ?? 310;
  const pad = o.pad ?? 6;
  for (let H = o.h ?? 150; H <= 420; H += 40) {
    const placed = [];
    let ok = true;
    for (const s of items) {
      let done = false;
      for (let t = 0; t < 300 && !done; t++) {
        const x = rng.float() * (W - s.w);
        const y = rng.float() * (H - s.h);
        if (placed.every((p) => x + s.w + pad < p.x || p.x + p.s.w + pad < x || y + s.h + pad < p.y || p.y + p.s.h + pad < y)) {
          placed.push({ s, x, y });
          done = true;
        }
      }
      if (!done) {
        ok = false;
        break;
      }
    }
    if (ok) return sp(W, H, placed.map((p) => at(p.s, p.x, p.y)).join(''));
  }
  return flow(items, { maxW: W });
}

// Mirror a sprite left-to-right (e.g. an engine facing the other way).
export const flip = (s) => sp(s.w, s.h, `<g transform="translate(${s.w} 0) scale(-1 1)">${s.svg}</g>`);

// A five-pointed star (rewards).
export function star(size = 24, colour = '#F2B01E') {
  return sp(size, size, `<path transform="scale(${size / 24})" d="M12 1.8l3.1 6.5 7.1.9-5.2 4.9 1.3 7.1L12 17.8 5.7 21.2 7 14.1 1.8 9.2l7.1-.9z" fill="${colour}" stroke="${shade(colour, -0.25)}" stroke-width="1" stroke-linejoin="round"/>`);
}

// Draw a sprite bigger or smaller.
export const scale = (s, k) => sp(R(s.w * k), R(s.h * k), `<g transform="scale(${k})">${s.svg}</g>`);

// Draw sprites on top of each other, each at its own x,y. parts: [[sprite, x, y], ...]
export function layer(parts) {
  const w = Math.max(...parts.map(([s, x]) => x + s.w));
  const h = Math.max(...parts.map(([s, , y]) => y + s.h));
  return sp(w, h, parts.map(([s, x, y]) => at(s, x, y)).join(''));
}

export const pad = (s, p = 6) => sp(s.w + p * 2, s.h + p * 2, at(s, p, p));

// ---------------------------------------------------------------- render
export function render(s, o = {}) {
  const p = o.pad ?? 14;
  const W = R(s.w + p * 2);
  const H = R(s.h + p * 2);
  const max = Math.round(W * (o.zoom ?? 2.3));
  return (
    `<svg class="scene${o.bare ? ' bare' : ''}" viewBox="0 0 ${W} ${H}" style="max-width:${max}px" role="img" aria-label="${esc(o.label || 'diagram')}" font-family="system-ui,sans-serif">` +
    (o.bare ? '' : `<rect class="mat" width="${W}" height="${H}" rx="14" fill="#E9EEF4"/>`) +
    at(s, p, p) +
    `</svg>`
  );
}
