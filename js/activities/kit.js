// kit.js — everything an activity file needs, in one import.
// It re-exports all the drawing functions and adds a few small helpers.

export * from '../draw.js';
import { car, animal, duplo, cube, block, wagon, frame, gap, bunny, peek, scale, column, layer, ANIMALS, MORE_COLOURS, BRICK_COLOURS, PEEK_NAME } from '../draw.js';

// A(def) just returns def. It marks "this object is an activity" for readers.
export const A = (def) => def;

// lv(level, a, b, c) picks a for step 1, b for step 2, c for step 3.
export const lv = (level, ...options) => options[Math.min(level, options.length) - 1];

export const plural = (n, one, many) => `${n} ${n === 1 ? one : many}`;
export const times = (n, f) => Array.from({ length: n }, (_, i) => f(i));
export const cap = (s) => s[0].toUpperCase() + s.slice(1);
export const list = (arr) => (arr.length < 2 ? arr.join('') : arr.slice(0, -1).join(', ') + ' and ' + arr[arr.length - 1]);

// Number buttons for an answer: the right number plus near misses, smallest first.
export function choices(r, value, o = {}) {
  const min = o.min ?? 0;
  const max = o.max ?? 20;
  const n = o.n ?? 3;
  const set = new Set([value]);
  for (const v of r.shuffle([value - 1, value + 1, value + 2, value - 2])) if (set.size < n && v >= min && v <= max) set.add(v);
  for (let v = min; set.size < n && v <= max; v++) set.add(v);
  return [...set].sort((a, b) => a - b);
}

// A follow-up question with number buttons: numQ(r, 'How many now?', 5, 'optional caption').
export const numQ = (r, ask, value, caption, o) => ({ ask, answer: { type: 'number', value, choices: choices(r, value, o) }, ...(caption ? { reveal: { caption } } : {}) });

// Things you can count. make(r) gives a random one; make(r, x) a specific colour/kind.
const KINDS = {
  cars: { one: 'car', many: 'cars', vary: MORE_COLOURS, say: (v) => v, make: (r, c) => car(c || r.pick(MORE_COLOURS)) },
  animals: { one: 'animal', many: 'animals', vary: ANIMALS, say: (v) => (v === 'sheep' ? 'sheep' : v + 's'), make: (r, k) => animal(k || r.pick(ANIMALS)) },
  duplo: { one: 'Duplo brick', many: 'Duplo bricks', vary: BRICK_COLOURS, say: (v) => v, make: (r, c) => duplo(c || r.pick(BRICK_COLOURS)) },
  cubes: { one: 'cube', many: 'cubes', vary: MORE_COLOURS, say: (v) => v, make: (r, c) => cube(c || r.pick(MORE_COLOURS)) },
  wooden: { one: 'wooden block', many: 'wooden blocks', vary: MORE_COLOURS, say: (v) => v, make: (r, c) => block('cube', c || r.pick(MORE_COLOURS)) },
  brio: { one: 'wagon', many: 'wagons', vary: ['blue', 'green', 'yellow', 'red'], say: (v) => v, make: (r, c) => wagon(null, c || r.pick(['blue', 'green', 'yellow', 'red'])) },
};

// Choose which toy to draw: one the family has out today if possible.
export function pickToy(r, ctx, allowed) {
  const have = allowed.filter((t) => KINDS[t] && ctx.toys.includes(t));
  const pool = have.length ? have : allowed.filter((t) => KINDS[t]);
  const id = r.pick(pool);
  return { id, ...KINDS[id] };
}

export const has = (ctx, toy) => ctx.toys.includes(toy);

// "a cube" / "an orange cube"
export const an = (words) => (/^[aeiou]/i.test(words) ? 'an ' : 'a ') + words;

// A labelled outline standing in for a household object we have no drawing of (a mug, a shoe...).
export const prop = (label, w, h) => frame(gap(w, h), { label, dash: true, pad: 0, rx: 8, opacity: 0.35 });

// ---------------------------------------------------------------- train track
// "2 long straights and 4 curves" for a trackPlan string such as 'SLLLLS'.
export function trackList(pieces) {
  const n = (set) => [...pieces].filter((k) => set.includes(k)).length;
  return list(
    [
      [n('S'), 'long straight', 'long straights'],
      [n('s'), 'short straight', 'short straights'],
      [n('LR'), 'curve', 'curves'],
    ]
      .filter(([k]) => k)
      .map(([k, one, many]) => plural(k, one, many))
  );
}
// The same track bending the other way.
export const mirror = (pieces) => [...pieces].map((k) => (k === 'L' ? 'R' : k === 'R' ? 'L' : k)).join('');

// ---------------------------------------------------------------- toys in different sizes
// n toys of one kind, each a clearly different size, smallest first. The family's toys come in random sizes,
// so these pictures are examples: go by the real toys.
export function sized(r, ctx, n) {
  const useCars = has(ctx, 'cars') && (!has(ctx, 'animals') || r.bool(0.4));
  const scales = { 2: [0.6, 1.3], 3: [0.55, 0.9, 1.35], 4: [0.5, 0.75, 1.05, 1.4], 5: [0.45, 0.65, 0.9, 1.15, 1.45] }[n];
  // No giraffe: it is so tall and thin that "which is bigger?" has two fair answers in a picture.
  const kinds = r.sample(useCars ? MORE_COLOURS : ANIMALS.filter((k) => k !== 'giraffe'), n);
  // Every drawing is first brought to the same height, so the sizes in the picture really are in order.
  const draw = (k) => (useCars ? car(k) : animal(k));
  const fit = (s, k) => scale(s, Math.round(((useCars ? 30 : 44) * k * 100) / s.h) / 100);
  return {
    one: useCars ? 'car' : 'animal',
    many: useCars ? 'cars' : 'animals',
    items: kinds.map((k, i) => ({ name: useCars ? `${k} car` : k, sprite: fit(draw(k), scales[i]) })),
  };
}

// ---------------------------------------------------------------- the rabbit game
// One arrangement of the rabbit and the game's three blocks, with the words for where the rabbit is.
// rel is 'in', 'on' or 'behind' when exactly one of those is true, otherwise null.
export function rabbitScene(r, level) {
  const b = bunny();
  const small = scale(b, 0.8); // fits inside the blue box
  const Y = () => peek('yellow');
  const onRed = () => layer([[peek('red'), 0, b.h - 9], [b, 10, 0]]);
  const peeping = () => layer([[b, 6, 0], [Y(), 0, 6]]);
  const stack = (...parts) => column(parts, { gap: 0 });
  const all = {
    1: [
      { rel: 'on', words: 'on top of the yellow block', pieces: ['yellow'], sprite: stack(b, Y()) },
      { rel: 'on', words: 'on top of the blue box', pieces: ['blue'], sprite: stack(b, peek('blue')) },
      { rel: 'on', words: 'on the red block', pieces: ['red'], sprite: onRed() },
      { rel: 'in', words: 'inside the blue box', pieces: ['blue'], sprite: peek('blue', small) },
    ],
    2: [
      { rel: 'behind', words: 'behind the yellow block, peeping through the round hole', pieces: ['yellow'], sprite: peeping() },
      { rel: 'in', words: 'inside the blue box, with the yellow block on top of the box', pieces: ['blue', 'yellow'], sprite: stack(Y(), peek('blue', small)) },
      { rel: 'on', words: 'on top of the yellow block, with the blue box underneath', pieces: ['yellow', 'blue'], sprite: stack(b, Y(), peek('blue')) },
      { rel: 'on', words: 'on the red block, on top of the blue box', pieces: ['red', 'blue'], sprite: stack(onRed(), peek('blue')) },
    ],
    3: [
      { rel: 'on', words: 'on top of the blue box, with the yellow block inside the box', pieces: ['blue', 'yellow'], sprite: stack(b, peek('blue', Y())) },
      { rel: null, words: 'inside the blue box, hiding behind the yellow block', pieces: ['blue', 'yellow'], sprite: peek('blue', layer([[small, (46 - small.w) / 2, 46 - small.h], [Y(), 0, 0]])) },
      { rel: null, words: 'on top of the blue box, behind the yellow block', pieces: ['blue', 'yellow'], sprite: stack(peeping(), peek('blue')) },
      { rel: 'in', words: 'inside the blue box, with the red block on top and the yellow block on top of that', pieces: ['blue', 'red', 'yellow'], sprite: stack(Y(), peek('red'), peek('blue', small)) },
    ],
  };
  const s = r.pick(all[level]);
  return { ...s, need: `the ${list(s.pieces.map((k) => PEEK_NAME[k]))} from the rabbit game` };
}
