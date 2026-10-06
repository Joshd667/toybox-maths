// store.js — what the app remembers, and how it chooses what to play next.
// Everything is kept in this phone's browser storage. Nothing is sent anywhere.

import { ACTIVITIES, STRANDS, TOYS, byId, levelsOf } from './activities/index.js';
import { makeRng } from './rng.js';

const KEY = 'toybox-maths-v1';
const fresh = () => ({
  v: 1,
  toys: TOYS.map((t) => t.id), // toys ticked as "out today"
  strands: {}, // strand id -> { level: 1-3, score: running tally of easy/hard }
  acts: {}, // activity id -> { n: times played, last: { t, rating, level } }
  log: [], // most recent first: { id, t, rating, level }
  salt: 0, // bumped by "pick three different ones"
});

let state = fresh();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) state = { ...fresh(), ...JSON.parse(raw) };
} catch {
  /* private mode or storage blocked: carry on without saving */
}
const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
};

export const get = () => state;
export const strandState = (id) => state.strands[id] || { level: 1, score: 0 };
export const actState = (id) => state.acts[id] || { n: 0, last: null };

export function setToys(list) {
  state.toys = list;
  save();
}
export function setStrandLevel(id, level) {
  state.strands[id] = { level, score: 0 };
  save();
}
export function bumpSalt() {
  state.salt++;
  save();
}
export function reset() {
  state = fresh();
  save();
}

// The step to open an activity at: its strand's step, or the nearest one it supports.
export function levelFor(a) {
  const want = strandState(a.strand).level;
  const ls = levelsOf(a);
  return ls.includes(want) ? want : ls.reduce((best, l) => (Math.abs(l - want) < Math.abs(best - want) ? l : best), ls[0]);
}

export const RATINGS = [
  { id: 'easy', label: 'Too easy' },
  { id: 'right', label: 'Just right' },
  { id: 'hard', label: 'Too tricky' },
  { id: 'skip', label: 'Not today' },
];

// Record how an activity went. Two "too easy" in a row in one strand moves that
// strand up a step; two "too tricky" in a row moves it down. Returns a message if it moved.
export function rate(id, rating, level) {
  const a = byId[id];
  const t = Date.now();
  const prev = actState(id);
  state.acts[id] = { n: prev.n + 1, last: { t, rating, level } };
  state.log.unshift({ id, t, rating, level });
  state.log = state.log.slice(0, 200);
  let moved = null;
  const s = { ...strandState(a.strand) };
  if (level === s.level) {
    if (rating === 'easy') s.score = Math.max(s.score, 0) + 1;
    else if (rating === 'hard') s.score = Math.min(s.score, 0) - 1;
    else if (rating === 'right') s.score = 0;
    const name = STRANDS.find((x) => x.id === a.strand).name;
    if (s.score >= 2 && s.level < 3) {
      s.level++;
      s.score = 0;
      moved = `${name} moves up to step ${s.level}`;
    } else if (s.score <= -2 && s.level > 1) {
      s.level--;
      s.score = 0;
      moved = `${name} drops back to step ${s.level}`;
    }
    state.strands[a.strand] = s;
  }
  save();
  return moved;
}

const DAY = 86400000;
const today = () => Math.floor((Date.now() - new Date().getTimezoneOffset() * 60000) / DAY);

export const available = (a) => a.toys.length === 0 || a.toys.some((t) => state.toys.includes(t));
const atStep = (a) => levelsOf(a).includes(strandState(a.strand).level);

// How keen the picker is on each activity.
function weight(a) {
  if (!available(a) || !atStep(a)) return 0;
  const last = actState(a.id).last;
  if (!last) return 3; // never tried: most interesting
  let w = { right: 2, easy: strandState(a.strand).level === 3 ? 0.5 : 1, hard: 0.6, skip: 1 }[last.rating] ?? 1;
  if (Math.floor((last.t - new Date().getTimezoneOffset() * 60000) / DAY) === today()) w *= 0.15; // already done today
  return w;
}

function weighted(pool, rnd) {
  const total = pool.reduce((s, a) => s + weight(a), 0);
  if (total <= 0) return null;
  let x = rnd() * total;
  for (const a of pool) {
    x -= weight(a);
    if (x <= 0) return a;
  }
  return pool[pool.length - 1];
}

// One activity, any strand. `not` is an id to avoid (the one just played).
export function surprise(not) {
  return weighted(ACTIVITIES.filter((a) => a.id !== not), Math.random) || null;
}

// Three for today, from three different strands. Stays the same all day unless re-rolled.
export function todaysThree() {
  const r = makeRng(today() * 131 + state.salt * 7 + 5);
  const out = [];
  let pool = ACTIVITIES.filter((a) => weight(a) > 0);
  while (out.length < 3 && pool.length) {
    const a = weighted(pool, r.float);
    if (!a) break;
    out.push(a);
    pool = pool.filter((p) => p.strand !== a.strand);
  }
  return out;
}

export function strandSummary(id) {
  const acts = ACTIVITIES.filter((a) => a.strand === id);
  return { total: acts.length, tried: acts.filter((a) => actState(a.id).n > 0).length, level: strandState(id).level };
}
