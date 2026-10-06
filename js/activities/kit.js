// kit.js — everything an activity file needs, in one import.
// It re-exports all the drawing functions and adds a few small helpers.

export * from '../draw.js';
import { car, animal, duplo, cube, block, frame, gap, ANIMALS, MORE_COLOURS, BRICK_COLOURS } from '../draw.js';

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

// Things you can count. make(r) gives a random one; make(r, x) a specific colour/kind.
const KINDS = {
  cars: { one: 'car', many: 'cars', vary: MORE_COLOURS, make: (r, c) => car(c || r.pick(MORE_COLOURS)) },
  animals: { one: 'animal', many: 'animals', vary: ANIMALS, make: (r, k) => animal(k || r.pick(ANIMALS)) },
  duplo: { one: 'Duplo brick', many: 'Duplo bricks', vary: BRICK_COLOURS, make: (r, c) => duplo(c || r.pick(BRICK_COLOURS)) },
  cubes: { one: 'cube', many: 'cubes', vary: MORE_COLOURS, make: (r, c) => cube(c || r.pick(MORE_COLOURS)) },
  wooden: { one: 'wooden block', many: 'wooden blocks', vary: MORE_COLOURS, make: (r, c) => block('cube', c || r.pick(MORE_COLOURS)) },
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
