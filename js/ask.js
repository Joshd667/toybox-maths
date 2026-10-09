// ask.js — works out what was typed in the search box and chooses the activities to show.
//
// Two kinds of typing are handled:
//   words      "duplo", "taller", "train track"      -> search(): every word must be found (as before)
//   a sentence "quick, I have Duplo and trains, he's 4, didn't like the pattern one, loves animals"
//                                                    -> understand() picks out the time, the toys, the age,
//                                                       what to leave out and what he likes; menu() builds the list.
//
// This is plain code: there is no AI model here. It only chooses and orders the activities;
// the app then shows each one's own text (see CLAUDE.md, "Asking in a sentence").
//
// No DOM and no storage in this file, so tools/validate.mjs can test it. The app passes in what it knows
// (which toys are ticked, the child's age, what he has managed).

import { ACTIVITIES, STRANDS, TOYS, levelsOf } from './activities/index.js';
import { makeRng } from './rng.js';

const strandOf = (a) => STRANDS.find((s) => s.id === a.strand);
const toyName = (id) => (id === 'none' ? 'No toys' : TOYS.find((t) => t.id === id)?.name || '');

// Other names people use for the toys. A new toy should get a line in both lists.
// TOY_ALSO is searched as plain text. TOY_SAYS is what counts as naming the toy in a sentence, so it leaves out
// words that could mean something else ("shapes" is a skill as well as a Numicon word).
export const TOY_ALSO = { duplo: 'brick bricks lego', wooden: 'block blocks shapes', cars: 'car vehicle', animals: 'animal farm zoo', brio: 'train trains track railway engine wagon', cubes: 'cube mathlink links', numicon: 'shapes pegs', bunny: 'rabbit bunny peek' };
const TOY_SAYS = {
  duplo: ['duplo', 'lego', 'bricks', 'brick'],
  wooden: ['wooden blocks', 'wooden block', 'blocks', 'block'],
  cars: ['cars', 'car', 'vehicles', 'vehicle'],
  animals: ['animals', 'animal', 'farm', 'zoo'],
  brio: ['brio trains', 'brio', 'train track', 'train set', 'trains', 'train', 'track', 'railway'],
  cubes: ['linking cubes', 'mathlink cubes', 'mathlink', 'cubes', 'cube'],
  numicon: ['numicon'],
  bunny: ['rabbit game', 'rabbit', 'bunny'],
};
// Words that name a skill.
const STRAND_SAYS = {
  counting: ['counting', 'count'],
  numerals: ['written numbers', 'reading numbers', 'numerals', 'numeral', 'numbers', 'number'],
  comparing: ['more or fewer', 'comparing', 'compare'],
  adding: ['adding and taking away', 'taking away', 'take away', 'adding', 'addition', 'subtraction', 'subtracting', 'sums'],
  patterns: ['patterns', 'pattern'],
  building: ['building', 'construction'],
  position: ['position words', 'position', 'positional'],
  measures: ['sorting and measuring', 'sorting', 'measuring', 'measure', 'shapes', 'shape'],
};

export const plain = (s) => String(s).toLowerCase().replace(/[^a-z0-9½]+/g, ' ').trim();

// ---------------------------------------------------------------- words: the search that was here before
let searchIndex = null;
function indexOf() {
  if (searchIndex) return searchIndex;
  searchIndex = ACTIVITIES.map((a) => {
    const words = levelsOf(a).flatMap((l) => a.make(makeRng(1), l, { toys: a.toys }).words);
    const toys = a.toys.length ? a.toys.map((t) => `${toyName(t)} ${TOY_ALSO[t] || ''}`).join(' ') : 'no toys phone';
    return { a, title: ' ' + plain(a.title), mid: ' ' + plain(`${strandOf(a).name} ${a.skill} ${toys}`), rest: ' ' + plain(`${a.needs.join(' ')} ${words.join(' ')} ${strandOf(a).blurb}`) };
  });
  return searchIndex;
}
// How well one word matches one activity: the title counts most, and the start of a word beats the middle.
const termScore = (e, t) => (e.title.includes(' ' + t) ? 8 : e.title.includes(t) ? 6 : e.mid.includes(' ' + t) ? 4 : e.mid.includes(t) ? 3 : e.rest.includes(' ' + t) ? 2 : e.rest.includes(t) ? 1 : 0);
// Every word typed must be found somewhere.
export function search(q) {
  const terms = plain(q).split(' ').filter(Boolean);
  if (!terms.length) return [];
  const hits = [];
  for (const e of indexOf()) {
    let score = 0;
    for (const t of terms) {
      const s = termScore(e, t);
      if (!s) {
        score = 0;
        break;
      }
      score += s;
    }
    if (score) hits.push([score, e.a]);
  }
  return hits.sort((x, y) => y[0] - x[0]).map(([, a]) => a); // sort is stable: ties stay in the app's own order
}

// ---------------------------------------------------------------- a sentence: what does it say?
const NUM = { one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10, couple: 2, few: 3 };
const num = (t) => (t === undefined ? null : /^\d+(\.\d+)?$/.test(t) ? Number(t) : /^\d+½$/.test(t) ? parseInt(t, 10) + 0.5 : t === '½' ? 0.5 : (NUM[t] ?? null));

// Phrases that change how the words after them are read. Longest first, so "didnt like" wins over "like".
const CUES = [
  // leave these out
  ...['did not like', 'didnt like', 'does not like', 'doesnt like', 'do not like', 'dont like', 'not keen on', 'not into', 'not a fan of', 'dislikes', 'disliked', 'hates', 'hated', 'bored of', 'bored with', 'fed up of', 'fed up with', 'sick of', 'tired of', 'gone off', 'no more', 'anything but', 'anything except', 'except for', 'except', 'apart from', 'other than', 'do not have', 'dont have', 'have not got', 'havent got', 'not got', 'without', 'avoid', 'skip', 'nothing with', 'not', 'no'].map((p) => [p, 'no']),
  // he likes these
  ...['really likes', 'really loves', 'is into', 'mad about', 'mad on', 'obsessed with', 'keen on', 'a fan of', 'favourite', 'favourites', 'prefers', 'likes', 'liked', 'loves', 'loved', 'enjoys', 'enjoyed', 'adores', 'like', 'love'].map((p) => [p, 'like']),
  // these are out on the floor
  ...['i have got', 'we have got', 'ive got', 'weve got', 'i have', 'we have', 'have got', 'got out', 'got', 'have', 'with', 'using', 'use'].map((p) => [p, 'have']),
].map(([p, kind]) => ({ words: p.split(' '), kind })).sort((a, b) => b.words.length - a.words.length);

// A sentence starts again after these.
const STOPS = new Set(['.', ';', '!', '?', 'but', 'however', 'though', 'although']);
const QUICK = ['in a hurry', 'in a rush', 'not much time', 'not got long', 'not long', 'little time', 'short on time', 'quickly', 'quickie', 'quick', 'short', 'speedy', 'brief', 'fast'];
const LONGER = ['plenty of time', 'lots of time', 'loads of time', 'all afternoon', 'all morning', 'a long one', 'long one', 'longer one', 'something long', 'something longer'];
// Words that say nothing about which activity is wanted.
const FILLER = new Set(
  'a an the i we he she him his her they them it its is s are was were be been am im hes shes weve ive to for of and or some something anything activity activities game games one ones need needs want wants wanted looking look find me us my our please can could would should you give show suggest suggestion suggestions set sets that this these those in on at do does did doing have has got today now really very just so quite too year years old toy toys play playing plays idea ideas any what which there then also maybe about again more most much thing things out way kind sort good nice fun child son daughter kid boy girl toddler little bit maths math lets let make makes ask where when while keeps keep learning learn practise practice help helps working work properly instead rather than'.split(' ')
);

// Finds one of `phrases` (each a list of words) starting at token i. Returns how many tokens it used, or 0.
const at = (toks, i, words) => (words.every((w, k) => toks[i + k]?.t === w && !toks[i + k].used) ? words.length : 0);
const use = (toks, i, n) => {
  for (let k = 0; k < n; k++) toks[i + k].used = true;
};

// Activity titles, as lists of words, for "didn't like the feely bag". One-word titles of filler are left out.
let titleWords = null;
const titles = () =>
  (titleWords ||= ACTIVITIES.map((a) => ({ a, words: plain(a.title).split(' ') }))
    .filter((x) => x.words.some((w) => !FILLER.has(w)))
    .sort((x, y) => y.words.length - x.words.length));

export function understand(q) {
  const toks = (String(q).toLowerCase().replace(/['’`]/g, '').match(/\d+(?:\.\d+)?½?|[a-z]+|½|[.,;!?]/g) || []).map((t) => ({ t, used: false }));
  const p = { time: null, age: null, have: [], avoid: [], likeToys: [], noToys: false, yes: [], no: [], notIds: [], pos: [], neg: [], cued: false };
  const add = (list, v) => list.includes(v) || list.push(v);
  const say = (i, phrases) => {
    for (const ph of phrases) {
      const n = at(toks, i, ph.split(' '));
      if (n) return n;
    }
    return 0;
  };

  // ---- pass 1: things that read the same wherever they are: how long, how old, "no toys"
  for (let i = 0; i < toks.length; i++) {
    if (toks[i].used) continue;
    let n;
    if ((n = say(i, ['no toys', 'without toys', 'without any toys', 'no toys needed', 'just the phone', 'nothing to hand', 'nothing out']))) {
      p.noToys = true;
      use(toks, i, n);
    } else if ((n = say(i, QUICK))) {
      p.time = { max: 3, label: 'Quick: 3 minutes or less' };
      use(toks, i, n);
    } else if ((n = say(i, LONGER))) {
      p.time = { min: 5, label: 'Longer: 5 minutes or more' };
      use(toks, i, n);
    }
  }
  for (let i = 0; i < toks.length; i++) {
    if (toks[i].used) continue;
    const v = num(toks[i].t);
    if (v === null) continue;
    const next = toks[i + 1]?.t;
    const prev = toks[i - 1]?.t;
    // "3 and a half", "3 1/2" written as "3½" is already one token
    let val = v;
    let len = 1;
    if (next === 'and' && toks[i + 2]?.t === 'a' && toks[i + 3]?.t === 'half') {
      val += 0.5;
      len = 4;
    }
    const after = toks[i + len]?.t;
    if (/^(min|mins|minute|minutes)$/.test(after || '')) {
      p.time = { max: Math.max(2, Math.round(val)), label: `Up to ${Math.max(2, Math.round(val))} minutes` };
      use(toks, i, len + 1);
      if (prev === 'of') toks[i - 1].used = true; // "a couple of minutes"
      continue;
    }
    if (NUM[toks[i].t] && toks[i].t.length > 3 && !/^(year|years|yr|yrs|yo)$/.test(after || '') && !agePrefix(toks, i) && !alone(toks, i, len)) continue; // "three bricks" is not an age
    if (toks[i].t === 'couple' || toks[i].t === 'few') continue;
    const isAge = /^(year|years|yr|yrs|yo)$/.test(after || '') || agePrefix(toks, i) || alone(toks, i, len);
    if (isAge && val >= 1 && val <= 7) {
      const nearly = ['nearly', 'almost'].includes(prev) || ['nearly', 'almost'].includes(toks[i - 2]?.t);
      p.age = nearly ? val - 0.5 : val;
      use(toks, i, len);
      for (let k = i + len; k < i + len + 3 && /^(year|years|yr|yrs|yo|old)$/.test(toks[k]?.t || ''); k++) toks[k].used = true;
      for (let k = i - 1; k >= i - 4 && k >= 0 && AGE_LEAD.has(toks[k].t); k--) toks[k].used = true;
    }
  }

  // ---- pass 2: read left to right. A cue ("didn't like", "loves", "I have") colours what follows it,
  // up to the end of the sentence or the next cue.
  let mood = 'plain';
  for (let i = 0; i < toks.length; i++) {
    const tok = toks[i];
    if (tok.used) continue;
    if (STOPS.has(tok.t)) {
      mood = 'plain';
      tok.used = true;
      continue;
    }
    if (tok.t === ',') {
      tok.used = true;
      continue;
    }
    const cue = CUES.find((c) => at(toks, i, c.words));
    if (cue) {
      mood = cue.kind;
      p.cued = true;
      use(toks, i, cue.words.length);
      i += cue.words.length - 1;
      continue;
    }
    let n;
    const title = titles().find((x) => at(toks, i, x.words));
    if (title && (mood === 'no' || title.words.length > 1)) {
      if (mood === 'no') {
        add(p.notIds, title.a.id);
        use(toks, i, title.words.length);
        i += title.words.length - 1;
        continue;
      }
    }
    const toy = Object.keys(TOY_SAYS).find((id) => (n = say(i, TOY_SAYS[id])));
    if (toy) {
      add(mood === 'no' ? p.avoid : mood === 'like' ? p.likeToys : p.have, toy);
      // "loves animals" should also find activities with the word in their title, so it stays as a word to look for
      if (mood === 'like') p.pos.push(toks[i].t);
      use(toks, i, n);
      i += n - 1;
      continue;
    }
    const strand = Object.keys(STRAND_SAYS).find((id) => (n = say(i, STRAND_SAYS[id])));
    if (strand) {
      add(mood === 'no' ? p.no : p.yes, strand);
      use(toks, i, n);
      i += n - 1;
      continue;
    }
    if (/^[a-z]/.test(tok.t) && !FILLER.has(tok.t) && tok.t.length > 1) (mood === 'no' ? p.neg : p.pos).push(tok.t);
  }
  // A toy cannot be both out and left out; a skill cannot be both wanted and not.
  p.have = p.have.filter((t) => !p.avoid.includes(t));
  p.likeToys = p.likeToys.filter((t) => !p.avoid.includes(t));
  p.yes = p.yes.filter((s) => !p.no.includes(s));

  // Is this a sentence, or just words to look up? Bare toy and skill words stay with the plain search.
  p.sentence = !!(p.time || p.age !== null || p.noToys || p.cued || p.avoid.length || p.no.length || p.notIds.length);
  return p;
}
const AGE_LEAD = new Set(['he', 'she', 'hes', 'shes', 'is', 'they', 'theyre', 'are', 'age', 'aged', 'nearly', 'almost', 'just', 'turned', 'about', 'around', 'only', 'now', 'son', 'daughter', 'boy', 'girl', 'child', 'kid', 'toddler', 'my', 'our', 'for', 'a']);
// Is the number at i introduced as an age? ("he's 4", "aged 3", "my son is nearly 4", "for a 3 year old")
function agePrefix(toks, i) {
  let sawWho = false;
  for (let k = i - 1; k >= i - 4 && k >= 0; k--) {
    const t = toks[k].t;
    if (!AGE_LEAD.has(t)) break;
    if (['he', 'she', 'hes', 'shes', 'theyre', 'age', 'aged', 'turned', 'son', 'daughter', 'boy', 'girl', 'child', 'kid', 'toddler'].includes(t)) sawWho = true;
  }
  return sawWho;
}
// A number with nothing round it ("... and trains. 4. But ...") is taken as an age.
function alone(toks, i, len) {
  const edge = (t) => t === undefined || STOPS.has(t) || t === ',';
  return edge(toks[i - 1]?.t) && edge(toks[i + len]?.t);
}

// ---------------------------------------------------------------- the chips that say what was understood
const ageWord = (n) => (n % 1 ? `${Math.floor(n)}½` : String(n));
const strandName = (id) => STRANDS.find((s) => s.id === id)?.name || id;
export function chipsOf(p) {
  const chips = [];
  if (p.time) chips.push({ key: 'time', label: p.time.label });
  if (p.age !== null) chips.push({ key: 'age', label: `Age ${ageWord(p.age)}` });
  if (p.noToys) chips.push({ key: 'notoys', label: 'No toys needed' });
  for (const t of p.have) chips.push({ key: 'have:' + t, label: `Have: ${toyName(t)}` });
  for (const s of p.yes) chips.push({ key: 'yes:' + s, label: strandName(s) });
  for (const t of p.likeToys) chips.push({ key: 'like:' + t, label: `Likes: ${toyName(t)}` });
  for (const t of p.avoid) chips.push({ key: 'avoid:' + t, label: `Not: ${toyName(t)}`, no: true });
  for (const s of p.no) chips.push({ key: 'no:' + s, label: `Not: ${strandName(s)}`, no: true });
  for (const id of p.notIds) chips.push({ key: 'not:' + id, label: `Not: ${ACTIVITIES.find((a) => a.id === id).title}`, no: true });
  return chips;
}
// Take out whatever the adult has tapped away.
function without(p, drop) {
  if (!drop || !drop.size) return p;
  const keep = (kind) => (v) => !drop.has(kind + ':' + v);
  return {
    ...p,
    time: drop.has('time') ? null : p.time,
    age: drop.has('age') ? null : p.age,
    noToys: drop.has('notoys') ? false : p.noToys,
    have: p.have.filter(keep('have')),
    yes: p.yes.filter(keep('yes')),
    likeToys: p.likeToys.filter(keep('like')),
    avoid: p.avoid.filter(keep('avoid')),
    no: p.no.filter(keep('no')),
    notIds: p.notIds.filter(keep('not')),
  };
}

// ---------------------------------------------------------------- the menu
// q: what was typed.
// o.drop:      Set of chip keys the adult has tapped away
// o.age:       the child's age from his profile, or null
// o.playable:  (a) => can it be played with the toys ticked in Settings?
// o.managed:   (a) => has he already managed it? (then it never counts as "for later")
// o.weight:    (a) => how keen the picker is on it (new ones first)
// Returns { mode, chips, groups: [{ name, note, acts: [{ a, toy }] }], count, parse }. mode is 'words' or 'sentence'.
export function menu(q, o = {}) {
  const full = understand(q);
  const p = without(full, o.drop);
  const chips = chipsOf(full).map((c) => ({ ...c, off: !!o.drop?.has(c.key) }));
  const playable = (a) => (o.playable ? o.playable(a) : true) || a.toys.some((t) => p.have.includes(t));
  const row = (a) => ({ a, toy: a.toys.find((t) => p.have.includes(t)) || a.toys.find((t) => p.likeToys.includes(t)) || '' });
  const split = (acts, name = '') => {
    const on = acts.filter(playable);
    const off = acts.filter((a) => !playable(a));
    const groups = [];
    if (on.length) groups.push({ name, acts: on.map(row) });
    if (off.length) groups.push({ name: 'Toy switched off', note: 'off', acts: off.map(row) });
    return groups;
  };

  // ---- just words: the search as it has always been
  const strict = full.sentence ? [] : search(q);
  if (strict.length) return { mode: 'words', chips: [], groups: split(strict), count: strict.length };

  // ---- a sentence
  const fits = (a) => {
    if (p.notIds.includes(a.id) || p.no.includes(a.strand)) return false;
    if (p.yes.length && !p.yes.includes(a.strand)) return false;
    if (p.noToys && a.toys.length) return false;
    if (p.have.length && !a.toys.some((t) => p.have.includes(t))) return false;
    if (p.avoid.length && a.toys.length && a.toys.every((t) => p.avoid.includes(t))) return false;
    if (p.time?.max && a.minutes > p.time.max) return false;
    if (p.time?.min && a.minutes < p.time.min) return false;
    return true;
  };
  // "Narrowed" means the sentence cut the list down to a kind of activity (a toy, a skill, a length of time).
  // Leaving things out, or giving an age, does not: on their own they would list nearly everything.
  const narrowed = !!(p.yes.length || p.noToys || p.have.length || p.time);
  const filtered = narrowed || !!(p.avoid.length || p.no.length || p.notIds.length || p.age !== null);
  const index = new Map(indexOf().map((e) => [e.a.id, e]));
  const wanted = !!(p.pos.length || p.likeToys.length);
  const scored = ACTIVITIES.filter(fits).map((a) => {
    const e = index.get(a.id);
    const lex = p.pos.length ? p.pos.reduce((s, t) => s + termScore(e, t), 0) / (8 * p.pos.length) : 0;
    const liked = a.toys.some((t) => p.likeToys.includes(t)) ? 0.35 : 0;
    const badLex = p.neg.some((t) => e.title.includes(' ' + t) || e.mid.includes(' ' + t)) ? 0.6 : 0;
    const hit = lex > 0 || liked > 0;
    const tooYoung = p.age !== null && a.upTo < p.age ? 0.15 : 0;
    return { a, hit, score: lex * 0.6 + liked - badLex - tooYoung + 0.02 * (o.weight ? o.weight(a) : 0) };
  });
  scored.sort((x, y) => y.score - x.score);
  const age = p.age !== null ? p.age : (o.age ?? null);
  const later = (a) => age !== null && a.age > age && !(o.managed && o.managed(a));

  let best = scored.filter((s) => (wanted ? s.hit : true) && s.score > -0.3).map((s) => s.a);
  let also = wanted && narrowed ? scored.filter((s) => !best.includes(s.a)).map((s) => s.a) : [];
  if (!wanted && !filtered && !chips.length) best = []; // nothing was understood and no word matched
  const groups = [];
  const now = (list) => list.filter((a) => !later(a));
  const main = split(now(best), wanted && also.length ? 'Best fit' : '');
  const off = [];
  for (const g of main) (g.note === 'off' ? off : groups).push(g);
  const alsoNow = now(also).filter(playable);
  if (alsoNow.length) groups.push({ name: best.length ? 'Also fits' : '', acts: alsoNow.map(row) });
  const laterActs = [...best, ...also].filter(later).filter(playable).sort((x, y) => x.age - y.age);
  if (laterActs.length) groups.push({ name: 'For later', note: 'later', acts: laterActs.map(row) });
  const offActs = [...off.flatMap((g) => g.acts), ...[...also].filter((a) => !playable(a)).map(row)];
  if (offActs.length) groups.push({ name: 'Toy switched off', note: 'off', acts: offActs });
  return { mode: 'sentence', chips, groups, count: groups.reduce((n, g) => n + g.acts.length, 0), parse: p };
}
