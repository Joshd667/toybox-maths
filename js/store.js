// store.js — what the app remembers, and how it chooses what to play next.
// Everything is kept in this phone's browser storage. Nothing is sent anywhere,
// including the children's names.

import { ACTIVITIES, STRANDS, byId, levelsOf } from './activities/index.js';

const KEY = 'toybox-maths-v2';
const fresh = () => ({
  v: 2,
  current: null, // id of the child who is playing
  sound: true,
  children: [], // see newChild() below
});
const newChild = (name, animal) => ({
  id: 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
  name,
  animal, // which drawn animal is this child's mascot
  stars: 0, // every star ever earned
  strands: {}, // strand id -> { level: 1-3, score: running tally of easy/hard }
  acts: {}, // activity id -> { n: times played, last: { t, rating, level } }
  log: [], // most recent first: { id, t, rating, level, stars }
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

// ---------------------------------------------------------------- children
export const children = () => state.children;
export const child = () => state.children.find((c) => c.id === state.current) || state.children[0] || null;
export function addChild(name, animal) {
  const c = newChild(name, animal);
  state.children.push(c);
  state.current = c.id;
  save();
  return c;
}
export function switchTo(id) {
  if (state.children.some((c) => c.id === id)) state.current = id;
  save();
}
export function removeChild(id) {
  state.children = state.children.filter((c) => c.id !== id);
  if (state.current === id) state.current = state.children[0]?.id || null;
  save();
}
export const soundOn = () => state.sound;
export function setSound(on) {
  state.sound = on;
  save();
}

// ---------------------------------------------------------------- progress (for the current child)
export const strandState = (id) => child()?.strands[id] || { level: 1, score: 0 };
export const actState = (id) => child()?.acts[id] || { n: 0, last: null };

export function setStrandLevel(id, level) {
  child().strands[id] = { level, score: 0 };
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
export function rate(id, rating, level, stars = 0) {
  const c = child();
  const a = byId[id];
  const t = Date.now();
  c.acts[id] = { n: actState(id).n + 1, last: { t, rating, level } };
  c.log.unshift({ id, t, rating, level, stars });
  c.log = c.log.slice(0, 200);
  c.stars += stars;
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
    c.strands[a.strand] = s;
  }
  save();
  return moved;
}

const DAY = 86400000;
const dayOf = (t) => Math.floor((t - new Date().getTimezoneOffset() * 60000) / DAY);

// How keen the picker is on each activity.
function weight(a) {
  if (!levelsOf(a).includes(strandState(a.strand).level)) return 0.2; // not at this child's step: unlikely, not impossible
  const last = actState(a.id).last;
  if (!last) return 3; // never tried: most interesting
  let w = { right: 2, easy: strandState(a.strand).level === 3 ? 0.5 : 1, hard: 0.6, skip: 1 }[last.rating] ?? 1;
  if (dayOf(last.t) === dayOf(Date.now())) w *= 0.15; // already done today
  return w;
}

// Choose one activity from a list (default: all of them). `not` is an id to avoid.
export function pick(pool = ACTIVITIES, not = null) {
  const list = pool.filter((a) => a.id !== not);
  if (!list.length) return pool[0] || null;
  const total = list.reduce((s, a) => s + weight(a), 0);
  let x = Math.random() * total;
  for (const a of list) {
    x -= weight(a);
    if (x <= 0) return a;
  }
  return list[list.length - 1];
}

export function strandSummary(id) {
  const acts = ACTIVITIES.filter((a) => a.strand === id);
  return { total: acts.length, tried: acts.filter((a) => actState(a.id).n > 0).length, level: strandState(id).level };
}
