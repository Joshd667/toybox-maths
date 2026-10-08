// store.js — what the app remembers, and how it chooses what to play next.
// Everything is kept in this phone's browser storage. Nothing is sent anywhere,
// including the children's names.

import { ACTIVITIES, TOYS } from './activities/index.js';

const KEY = 'toybox-maths-v2';
const fresh = () => ({
  v: 2,
  welcomed: false, // has the first-time welcome been finished on this phone?
  installed: false, // set when the phone says the app was added to the home screen
  current: null, // id of the child who is playing
  children: [], // see newChild() below
  // questions / goes: how many were chosen last time, offered again next time
  settings: { theme: 'system', sound: true, motion: true, questions: 5, goes: 1, toys: TOYS.map((t) => t.id) },
});
const newChild = (name, animal, pronoun, born) => ({
  id: 'c' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
  name,
  animal, // which drawn animal is this child's mascot
  pronoun, // 'he' or 'she': how the activity text talks about them
  born: born || null, // 'YYYY-MM' (month of birth), or null if the adult left it out. Used only to work out an age.
  stars: 0, // every star ever earned
  acts: {}, // activity id -> { n: times played, last: { t, rating, mode } }
  log: [], // most recent first: { id, t, rating, mode, stars, asked }
  // mode is '1', '2' or '3' (Easy, Medium, Hard), 'mix' or 'ramp'. Records from before October 2026 have a number, `level`, instead.
});

let state = fresh();
try {
  const raw = localStorage.getItem(KEY);
  if (raw) {
    const saved = JSON.parse(raw);
    state = { ...fresh(), ...saved, settings: { ...fresh().settings, ...saved.settings } };
    // Families who were using the app before the welcome existed have already set it up.
    if (saved.welcomed === undefined) state.welcomed = state.children.length > 0;
    for (const c of state.children) if (c.pronoun !== 'she') c.pronoun = 'he'; // "they" was removed
  }
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

// ---------------------------------------------------------------- first-time welcome, and adding to the home screen
export const welcomed = () => state.welcomed;
export function setWelcomed() {
  state.welcomed = true;
  save();
}
export const installed = () => state.installed;
export function setInstalled(yes) {
  if (state.installed === yes) return;
  state.installed = yes;
  save();
}

// ---------------------------------------------------------------- children
export const children = () => state.children;
export const child = () => state.children.find((c) => c.id === state.current) || state.children[0] || null;
export function addChild(name, animal, pronoun = 'he', born = null) {
  const c = newChild(name, animal, pronoun, born);
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
export function setPronoun(pronoun) {
  child().pronoun = pronoun;
  save();
}
export function setBorn(born) {
  child().born = /^\d{4}-\d{2}$/.test(born || '') ? born : null;
  save();
}

// ---------------------------------------------------------------- age
// Each activity has an `age`: the youngest age (in years) its Easy version is aimed at. See CLAUDE.md.
// A child's age is rounded to the nearest half year, so a child of 2 years 10 months counts as 3.
export function ageOf(c = child(), now = new Date()) {
  const m = /^(\d{4})-(\d{2})$/.exec(c?.born || '');
  if (!m) return null; // no month of birth given: nothing is held back
  const months = (now.getFullYear() - Number(m[1])) * 12 + (now.getMonth() + 1 - Number(m[2]));
  return months < 0 ? null : Math.round(months / 6) / 2;
}
// Is this activity aimed at children older than the one playing? Always false when we do not know the age.
export function later(a) {
  const age = ageOf();
  return age !== null && a.age > age;
}

// ---------------------------------------------------------------- settings (shared by everyone on this phone)
export const settings = () => state.settings;
export function set(key, value) {
  state.settings[key] = value;
  save();
}
// Can this activity be played with the toys this family owns? (Activities needing no toys always can.)
export const playable = (a) => a.toys.length === 0 || a.toys.some((t) => state.settings.toys.includes(t));

// ---------------------------------------------------------------- progress (for the current child)
export const actState = (id) => child()?.acts[id] || { n: 0, last: null };

export const RATINGS = [
  { id: 'easy', label: 'Too easy' },
  { id: 'right', label: 'Just right' },
  { id: 'hard', label: 'Too tricky' },
  { id: 'skip', label: 'Not today' },
];

// Record how a turn went: how the adult rated it, the difficulty played, stars won and questions asked.
export function rate(id, rating, mode, stars = 0, asked = 0) {
  const c = child();
  const t = Date.now();
  c.acts[id] = { n: actState(id).n + 1, last: { t, rating, mode } };
  c.log.unshift({ id, t, rating, mode, stars, asked });
  c.log = c.log.slice(0, 200);
  c.stars += stars;
  save();
}

// The difficulty to offer when an activity is opened. `modes` is what it supports, easiest first
// (e.g. ['1', '2', '3', 'mix', 'ramp']). First time: the easiest. After that: the same as last time,
// one harder if that was "too easy", one easier if it was "too tricky".
export function suggest(a, modes) {
  const last = actState(a.id).last;
  if (!last) return modes[0];
  const was = String(last.mode ?? last.level);
  const fixed = modes.filter((m) => m !== 'mix' && m !== 'ramp');
  if (!fixed.includes(was)) return modes.includes(was) ? was : modes[0];
  const i = fixed.indexOf(was) + (last.rating === 'easy' ? 1 : last.rating === 'hard' ? -1 : 0);
  return fixed[Math.max(0, Math.min(fixed.length - 1, i))];
}

const DAY = 86400000;
const dayOf = (t) => Math.floor((t - new Date().getTimezoneOffset() * 60000) / DAY);

// How keen the picker is on each activity.
function weight(a) {
  const last = actState(a.id).last;
  if (!last) return 3; // never tried: most interesting
  let w = { right: 2, easy: 1, hard: 0.6, skip: 1 }[last.rating] ?? 1;
  if (dayOf(last.t) === dayOf(Date.now())) w *= 0.15; // already done today
  return w;
}

// Choose one activity from a list (default: all of them). `not` is an id to avoid.
export function pick(pool = ACTIVITIES, not = null) {
  const can = pool.filter((a) => a.id !== not && playable(a));
  if (!can.length) return pool[0] || null;
  // Leave out the ones meant for older children, unless that is all there is to choose from.
  const now = can.filter((a) => !later(a));
  const list = now.length ? now : can;
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
  return { total: acts.length, tried: acts.filter((a) => actState(a.id).n > 0).length };
}
