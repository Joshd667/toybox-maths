// app.js — the screens. Plain JavaScript, no framework, no build step.
//
// Screens are functions that return HTML text. route() picks one from the address:
//   #/                 home: choose a toy (or a skill)
//   #/toy/<id>         activities for one toy          #/skill/<id>   activities for one skill
//   #/play/<id>/<toy>  an activity (get ready -> set up -> questions -> finish)
//   #/favourites       the current child's favourite activities (hearts are on every list row and Get ready screen)
//   #/progress         #/settings      #/guide (About the research, opened from Settings)      #/who  (the children)
// The very first time, a welcome is shown instead (welcome() below), whatever the address.
// All taps are handled in one place near the bottom (onTap).

import { ACTIVITIES, STRANDS, TOYS, byId, levelsOf } from './activities/index.js';
import { REFS, NOT_CLAIMED } from './research.js';
import { makeRng, newSeed } from './rng.js';
import * as D from './draw.js';
import * as store from './store.js';
import { celebrate, finale, hush } from './reward.js';
import { reword } from './wording.js';
import { logo } from './brand.js';

const { render, numeral } = D;
const view = document.getElementById('view');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const strandOf = (a) => STRANDS.find((s) => s.id === a.strand);
const pic = (sprite, o = {}) => render(sprite, { bare: true, pad: 2, zoom: 3, ...o });
// Activity text is written about "he"; w() rewrites it for this child and makes it safe to put on the page.
const w = (s) => esc(reword(String(s), store.child()?.pronoun));

// ---------------------------------------------------------------- toys
// "none" is the group of activities that need nothing but the phone.
const TOY_TILES = [
  ...TOYS,
  { id: 'none', name: 'No toys' },
];
const toyArt = {
  duplo: () => D.model([{ x: 0, y: 0, w: 4, colour: 'red' }, { x: 1, y: 1, w: 2, colour: 'yellow' }]),
  wooden: () => D.build([{ shape: 'arch', colour: 'blue', x: 0, y: 0 }, { shape: 'roof', colour: 'green', x: 0, y: 1 }]),
  cars: () => D.car('orange'),
  animals: () => D.animal('cow'),
  brio: () => D.row([D.wagon(D.cube('yellow'), 'blue'), D.engine('red')], { gap: 1 }),
  cubes: () => D.rod(['purple', 'purple', 'green', 'green']),
  numicon: () => D.row([D.numicon(3, 13), D.numicon(4, 13)], { gap: 6 }),
  bunny: () => D.layer([[D.bunny(), 6, 0], [D.peek('yellow'), 0, 6]]),
  none: () => D.row([D.card(1, 40), D.card(2, 40), D.card(3, 40)], { gap: 3 }),
};
const toyName = (id) => TOY_TILES.find((t) => t.id === id)?.name || '';
const owned = () => store.settings().toys;
const toyTiles = () => TOY_TILES.filter((t) => t.id === 'none' || owned().includes(t.id));
const forToy = (id) => ACTIVITIES.filter((a) => (id === 'none' ? a.toys.length === 0 : a.toys.includes(id)));
const forSkill = (id) => ACTIVITIES.filter((a) => a.strand === id && store.playable(a));
// The sub-skills inside a strand, in the order they first appear.
const subSkills = (id) => [...new Set(forSkill(id).map((a) => a.skill))];
const MASCOTS = ['giraffe', 'elephant', 'lion', 'duck', 'pig', 'cow', 'sheep', 'horse'];
const mascot = (c) => pic(D.animal(c?.animal || 'giraffe'));

// Ages. An activity's `age` is the youngest age its Easy version is aimed at (2.5, 3 or 4); `upTo` is the age its hardest is aimed at.
const ageWord = (n) => (n % 1 ? `${Math.floor(n)}½` : String(n));
// The pill on every activity: the age its easiest version is aimed at, to the age its hardest is.
const agePill = (a) => `<b class="age">Age ${ageWord(a.age)} to ${ageWord(a.upTo)}</b>`;
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
// Two menus for the month of birth. `born` is 'YYYY-MM' or empty; `act` is what a change does.
function bornFields(act, born) {
  const [y, m] = (born || '').split('-');
  const year = new Date().getFullYear();
  const years = Array.from({ length: 9 }, (_, i) => String(year - i));
  if (y && !years.includes(y)) years.push(y);
  const opt = (v, label, cur) => `<option value="${v}"${v === cur ? ' selected' : ''}>${label}</option>`;
  return `<div class="born">
    <select name="born-month" data-change="${act}" aria-label="Month of birth">${opt('', 'Month', m || '')}${MONTHS.map((n, i) => opt(String(i + 1).padStart(2, '0'), n, m)).join('')}</select>
    <select name="born-year" data-change="${act}" aria-label="Year of birth">${opt('', 'Year', y || '')}${years.map((n) => opt(n, n, y)).join('')}</select>
  </div>`;
}
const bornFrom = (box) => {
  const m = box.querySelector('[name="born-month"]').value;
  const y = box.querySelector('[name="born-year"]').value;
  return m && y ? `${y}-${m}` : null;
};
const ageLine = (c) => {
  const age = store.ageOf(c);
  return age === null ? 'Not given. Every activity is offered.' : age < 1 ? 'Under 1.' : `About ${ageWord(age)}. Activities for older children are listed under "For later".`;
};

const RATING_WORD = { easy: 'Too easy', right: 'Just right', hard: 'Too tricky', skip: 'Not today' };
const icon = {
  back: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  install: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5v10M7.5 9.5l4.5 4.5 4.5-4.5M5 16.5v2a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-2" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  share: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14.5v-11M8 7l4-4 4 4M8.5 10H7a2 2 0 0 0-2 2v6.5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V12a2 2 0 0 0-2-2h-1.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  plusBox: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="3.5" width="17" height="17" rx="4.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/></svg>',
  dice: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="8.5" cy="8.5" r="1.7" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/></svg>',
  dots: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="5" r="2" fill="currentColor"/><circle cx="12" cy="12" r="2" fill="currentColor"/><circle cx="12" cy="19" r="2" fill="currentColor"/></svg>',
  book: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 6c-2-1.6-5-2-8-1.5v13c3-.5 6-.1 8 1.5 2-1.6 5-2 8-1.5v-13c-3-.5-6-.1-8 1.5ZM12 6v13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  lock: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="10.5" width="14" height="10" rx="3" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/></svg>',
  heart: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20.3C7.6 17.2 4 13.9 4 10.1A4.1 4.1 0 0 1 12 8a4.1 4.1 0 0 1 8 2.1c0 3.8-3.6 7.1-8 10.2Z" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round"/></svg>',
  tips: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 11v6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="7.4" r="1.5" fill="currentColor"/></svg>',
  star: (on, now) => `<svg class="star${on ? ' on' : ''}${now ? ' now' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.8l3.1 6.5 7.1.9-5.2 4.9 1.3 7.1L12 17.8 5.7 21.2 7 14.1 1.8 9.2l7.1-.9z"/></svg>`,
};

// The heart that makes an activity a favourite of the child who is playing. `word` adds a label beside it.
// A tap is handled in onTap ('fav'), which updates every heart for that activity on the screen without redrawing.
const FAV_WORD = (on) => (on ? 'In favourites' : 'Add to favourites');
function heart(id, word) {
  const on = store.isFav(id);
  return `<button class="${word ? 'btn fav-btn' : 'heart'}" data-act="fav" data-id="${id}" aria-pressed="${on}" aria-label="${on ? 'Remove from favourites' : 'Add to favourites'}">${icon.heart}${word ? `<span class="fav-word">${FAV_WORD(on)}</span>` : ''}</button>`;
}

// The app's name with its toy box, for the top of the home screen.
const BRAND = `<h1 class="brand" aria-label="Toybox Maths">${logo()}<span>Toybox</span> <b>Maths</b></h1>`;

// The bar at the top of the browsing screens: where you are (no title means the home screen), and who is playing.
function topBar(title, back) {
  const c = store.child();
  return `<header class="top${title ? '' : ' at-home'}">
    ${back ? `<a class="round" href="${back}" aria-label="Back">${icon.back}</a>` : ''}
    ${title ? `<h1>${esc(title)}</h1>` : BRAND}
    ${!title && canInstall() ? `<button class="round get" data-act="install-sheet" aria-label="Put Toybox Maths on your home screen">${icon.install}</button>` : ''}
    <a class="who" href="#/who" aria-label="Playing: ${esc(c.name)}. Change child"><span class="avatar">${mascot(c)}</span><span>${esc(c.name)}</span></a>
  </header>`;
}

// ---------------------------------------------------------------- home
let homeMode = 'skill';
function home() {
  const tiles =
    homeMode === 'toy'
      ? `<div class="tiles">${toyTiles().map((t) => {
          const n = forToy(t.id).length;
          return `<a class="tile" href="#/toy/${t.id}"><span class="tile-pic">${pic(toyArt[t.id]())}</span><span class="tile-name">${esc(t.name)}</span><span class="tile-n">${n} ${n === 1 ? 'activity' : 'activities'}</span></a>`;
        }).join('')}</div>`
      : `<div class="skills">${STRANDS.map((s) => {
          const n = forSkill(s.id).length;
          return `<a class="skill" href="#/skill/${s.id}" style="--c:${s.colour}"><span class="skill-name">${esc(s.name)}</span><span class="skill-blurb">${esc(s.blurb)}</span><span class="skill-n">${n} ${n === 1 ? 'activity' : 'activities'}: ${esc(subSkills(s.id).join(', ').toLowerCase())}</span></a>`;
        }).join('')}</div>`;
  return `${topBar('')}
  <section class="page">
    <button class="go" data-act="surprise">${icon.dice}<span>Just pick one</span></button>
    <div class="seg wide" role="group" aria-label="Browse">
      <button data-act="home-mode" data-v="skill" aria-pressed="${homeMode === 'skill'}">By skill</button>
      <button data-act="home-mode" data-v="toy" aria-pressed="${homeMode === 'toy'}">By toy</button>
    </div>
    ${tiles}
  </section>`;
}

// ---------------------------------------------------------------- a list of activities (one toy, one skill, or the favourites)
let listFilter = null; // the chip that is switched on, if any
function list(kind, id) {
  const isToy = kind === 'toy';
  const isFav = kind === 'fav';
  const all = isFav ? store.favs().map((f) => byId[f]) : isToy ? forToy(id) : forSkill(id);
  const title = isFav ? 'Favourites' : isToy ? toyName(id) : STRANDS.find((s) => s.id === id)?.name;
  if (!title) return null;
  if (isFav && !all.length) return noFavs();
  // Chips filter by the other thing: skills when looking at a toy, toys when looking at a skill.
  const chips = isToy
    ? STRANDS.filter((s) => all.some((a) => a.strand === s.id)).map((s) => ({ id: s.id, name: s.name, colour: s.colour }))
    : toyTiles().filter((t) => all.some((a) => (t.id === 'none' ? a.toys.length === 0 : a.toys.includes(t.id)))).map((t) => ({ id: t.id, name: t.name }));
  if (!chips.some((c) => c.id === listFilter)) listFilter = null;
  const shown = all.filter((a) => !listFilter || (isToy ? a.strand === listFilter : listFilter === 'none' ? a.toys.length === 0 : a.toys.includes(listFilter)));
  const toy = isToy ? id : listFilter && listFilter !== 'none' ? listFilter : '';
  const item = (a) => {
    const s = strandOf(a);
    const last = store.actState(a.id).last;
    return `<li><a href="#/play/${a.id}${toy && toy !== 'none' ? '/' + toy : ''}" data-id="${a.id}" style="--c:${s.colour}">
      <span class="li-title">${esc(a.title)}</span>
      <span class="li-meta">${agePill(a)}${isToy ? esc(s.name) + ': ' : isFav ? esc(s.name) + ', ' : ''}${esc(isToy ? a.skill.toLowerCase() : a.minutes + ' min')}</span>
      ${last ? `<span class="badge r-${last.rating}">${RATING_WORD[last.rating]}</span>` : '<span class="badge r-new">New</span>'}
    </a>${heart(a.id)}</li>`;
  };
  // Looking at one skill: group the activities under its sub-skills.
  // Activities aimed at older children than this one stay on the page, in a group of their own at the end.
  // Favourites are one list, the newest first, and are never moved to "For later": the adult chose them on purpose.
  // One whose toys are all switched off in Settings stays on the page, in a group of its own, so it is not lost.
  const now = shown.filter((a) => (isFav ? store.playable(a) : !store.later(a)));
  const older = isFav ? [] : shown.filter((a) => store.later(a)).sort((a, b) => a.age - b.age);
  const off = isFav ? shown.filter((a) => !store.playable(a)) : [];
  const groups = (isToy || isFav ? [['', now]] : subSkills(id).map((k) => [k, now.filter((a) => a.skill === k)])).filter(([, acts]) => acts.length);
  if (older.length) groups.push(['For later', older, `Aimed at children older than about ${ageWord(store.ageOf())}. Still fine to try: one that goes well moves up the list.`]);
  if (off.length) groups.push(['Toy switched off', off, 'These need a toy that is unticked in Settings. Tick it there to bring them back.']);
  // With only a few favourites the toy chips are clutter; they earn their place once the list is long enough to scroll.
  const showChips = !isFav || (all.length > 5 && chips.length > 1);
  return `${isFav ? topBar(title) : topBar(title, '#/')}
  <section class="page">
    ${isFav ? `<p class="lede fav-lede">${esc(store.child().name)}'s favourites. Tap a heart to take one off.</p>` : ''}
    ${!isFav || now.length > 1 ? `<button class="go small" data-act="pick-here">${icon.dice}<span>${isFav ? 'Pick a favourite' : 'Pick one of these'}</span></button>` : ''}
    <div class="chips" role="group" aria-label="Filter"${showChips ? '' : ' hidden'}>
      <button class="chip" data-act="filter" data-v="" aria-pressed="${!listFilter}">All</button>
      ${chips.map((c) => `<button class="chip${c.colour ? ' tint' : ' with-pic'}" ${c.colour ? `style="--c:${c.colour}"` : ''} data-act="filter" data-v="${c.id}" aria-pressed="${listFilter === c.id}">${c.colour ? '' : `<span class="chip-pic">${pic(toyArt[c.id]())}</span>`}${esc(c.name)}</button>`).join('')}
    </div>
    ${groups.map(([name, acts, note]) => `${name ? `<h2 class="group">${esc(name)}</h2>` : ''}${note ? `<p class="group-note">${esc(note)}</p>` : ''}<ul class="list${note ? ' later' : ''}">${acts.map(item).join('')}</ul>`).join('')}
  </section>`;
}
const shownIds = () => [...document.querySelectorAll('.list a')].map((el) => el.dataset.id);
// The Favourites tab before anything has a heart: say what it is for and how to fill it.
function noFavs() {
  return `${topBar('Favourites')}
  <section class="page">
    <div class="empty fav-empty">
      <span class="fav-big">${icon.heart}</span>
      <p class="say">No favourites yet</p>
      <p>Tap the heart beside any activity to keep it here for ${esc(store.child().name)}. You can also add one when a game has just gone well.</p>
      <a class="btn primary big wide" href="#/">Find an activity</a>
    </div>
    <p class="small-note">Each child has their own favourites. They stay on this phone.</p>
  </section>`;
}

// ---------------------------------------------------------------- playing an activity
// A turn goes: Get ready (what you need, how hard, how many) -> Start -> set-up -> questions -> done.
// flow holds everything about the turn on screen:
//   stage 'ready' | 'setup' | 'ask' | 'done'
//   mode  '1' | '2' | '3' (Easy, Medium, Hard) | 'mix' | 'ramp'      n  how many questions were asked for
//   q     which question of the turn we are on (0 is the first)      marks  'star' or 'seen' for each finished one
//   inst  the set-up on the table, qs its questions, qi which of them is showing, level its difficulty
let flow = null;
let from = '#/'; // where the close button goes back to

const LEVEL = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
const MODE = { ...LEVEL, mix: 'Mix', ramp: 'Ramp up' };
const MODE_HINT = {
  1: 'Small numbers and the simplest set-ups.',
  2: 'A step up: bigger numbers or one more thing to think about.',
  3: 'The trickiest version.',
  mix: 'A different difficulty for each set-up.',
  ramp: 'Starts easy and gets harder as you go.',
};
// The difficulties on offer for an activity, plus Mix and Ramp up when it has more than one.
const modesOf = (a) => [...levelsOf(a).map(String), ...(levelsOf(a).length > 1 ? ['mix', 'ramp'] : [])];
// A long build with one question per set-up is counted in goes (1 to 3), not questions.
const isBuild = (a) => a.minutes >= 5 && !a.make(makeRng(1), levelsOf(a)[0], { toys: a.toys }).more?.length;
const countsOf = (a) => (isBuild(a) ? [1, 2, 3] : [3, 5, 8, 10]);
const unitOf = (a, n) => (isBuild(a) ? (n === 1 ? 'go' : 'goes') : n === 1 ? 'question' : 'questions');
const stars = () => flow.marks.filter((m) => m === 'star').length;

// The difficulty of the set-up that question number q belongs to.
function levelAt(q) {
  const ls = levelsOf(flow.a);
  if (flow.mode === 'ramp') return ls[Math.min(ls.length - 1, Math.floor((q * ls.length) / flow.n))];
  if (flow.mode === 'mix') {
    const pool = ls.length > 1 ? ls.filter((l) => l !== flow.level) : ls;
    return pool[Math.floor(Math.random() * pool.length)];
  }
  return Number(flow.mode);
}
// Lay out a fresh set-up: new numbers, colours and questions.
function deal(level = levelAt(flow.q), seed = newSeed()) {
  flow.level = level;
  flow.seed = seed;
  flow.inst = flow.a.make(makeRng(flow.seed), level, { toys: flow.toy ? [flow.toy] : owned() });
  flow.qs = [flow.inst, ...(flow.inst.more || [])];
  flow.qi = 0;
  flow.setups++;
  flow.stage = 'setup';
  resetQuestion();
}
function resetQuestion() {
  flow.answered = false; // has this question been finished (right, shown, or skipped)?
  flow.wrong = 0;
  flow.picked = new Set();
}
function startActivity(id, toy) {
  const a = byId[id];
  if (!a) return null;
  if (!flow || flow.a !== a) {
    const mine = a.toys.filter((t) => owned().includes(t));
    const counts = countsOf(a);
    const saved = store.settings()[isBuild(a) ? 'goes' : 'questions'];
    flow = {
      a,
      toy: a.toys.includes(toy) ? toy : mine[0] || a.toys[0] || '',
      viaToy: a.toys.includes(toy), // opened from a toy's list, so the toy is already decided
      eg: newSeed(), // the example on the Get ready screen; it becomes the first set-up
      mode: store.suggest(a, modesOf(a)),
      n: counts.includes(saved) ? saved : counts[0],
      stage: 'ready',
      q: 0,
      marks: [],
      level: null,
      setups: 0,
      rated: null,
    };
  }
  return play();
}

// One slot for each question: gold once he gets it right, a ring round the one being asked.
const starRow = (n = flow.n) =>
  `<div class="stars${n > 5 ? ' many' : ''}" aria-label="${stars()} ${stars() === 1 ? 'star' : 'stars'} so far">${Array.from({ length: n }, (_, i) => icon.star(flow.marks[i] === 'star', i === flow.q && flow.stage !== 'done' && !flow.marks[i])).join('')}</div>`;
const track = () => `<div class="track" id="track">${starRow()}<span class="lvl">${LEVEL[flow.level]}</span></div>`;
function playTop() {
  const going = flow.stage !== 'ready';
  return `<header class="top play-top">
    <a class="round" href="${from}" aria-label="Close">${icon.close}</a>
    <h1>${going ? `${isBuild(flow.a) ? 'Go' : 'Question'} ${flow.q + 1} of ${flow.n}` : esc(flow.a.title)}</h1>
    ${going ? '' : heart(flow.a.id)}
    <button class="round" data-act="tips" aria-label="Tips and why">${icon.tips}</button>
    ${going ? track() : ''}
  </header>`;
}

function scenePic(sc) {
  const svg = render(sc.sprite, { label: sc.caption || 'Picture' });
  const cap = sc.caption ? `<figcaption>${w(sc.caption)}</figcaption>` : '';
  if (sc.flash) return `<figure class="fig flash" data-secs="${sc.flash}"><div class="flash-pic">${svg}</div><button class="btn primary" data-act="flash">Show for ${sc.flash} seconds</button>${cap}</figure>`;
  return `<figure class="fig">${svg}${cap}</figure>`;
}

const seg = (act, items, current, cls = '') =>
  `<div class="seg wide ${cls}" role="group">${items.map(([v, label]) => `<button data-act="${act}" data-v="${v}" aria-pressed="${String(v) === String(current)}">${label}</button>`).join('')}</div>`;

// The difficulty the first set-up will have (Mix and Ramp up both open on the easiest).
const firstLevel = () => (LEVEL[flow.mode] ? Number(flow.mode) : levelsOf(flow.a)[0]);
const HOW = { number: 'He taps the number.', pick: 'He picks one.', tap: 'He taps the picture.', do: 'He does it with the toys. You tap Did it.', open: 'He does it with the toys. There is no wrong answer.', spinner: 'He spins, then moves.' };

// The first screen of a turn: what the game is, what to fetch, how hard, how many.
function readyScreen() {
  const { a } = flow;
  const s = strandOf(a);
  const mine = a.toys.filter((t) => owned().includes(t));
  const toys = mine.length ? mine : a.toys;
  const modes = modesOf(a);
  const last = store.actState(a.id).last;
  const lastMode = last && MODE[last.mode ?? last.level];
  // An example of the game, drawn for the toy and difficulty chosen below. Start opens on this same set-up.
  const eg = a.make(makeRng(flow.eg), firstLevel(), { toys: flow.toy ? [flow.toy] : owned() });
  const egPic = eg.scenes[0];
  const needs = [...(flow.toy ? [esc(toyName(flow.toy))] : []), ...a.needs.map(w)];
  if (!needs.length) needs.push('Just this phone');
  const toyChips = `<div class="own">${toys.map((t) => `<button class="chip with-pic" data-act="toy" data-v="${t}" aria-pressed="${t === flow.toy}"><span class="chip-pic">${pic(toyArt[t]())}</span>${esc(toyName(t))}</button>`).join('')}</div>`;
  const choose = toys.length > 1;
  return `${playTop()}
  <section class="page stage ready">
    <p class="tagline" style="--c:${s.colour}"><span class="pill">${esc(s.name)}</span><span>${esc(a.skill)}</span>${agePill(a)}</p>
    <div class="card eg">
      <h2>The game</h2>
      ${egPic ? `<figure class="fig">${render(egPic.sprite, { label: 'Example set-up' })}</figure>` : ''}
      <dl>
        <dt>You set up</dt><dd>${eg.setup.map(w).join(' ')}</dd>
        <dt>You ask</dt><dd class="eg-ask">“${w(eg.ask)}”</dd>
        <dt>He answers</dt><dd>${w(HOW[eg.answer.type])}</dd>
      </dl>
    </div>
    ${choose && !flow.viaToy ? `<div class="card"><h2>Which toy will you use?</h2><p class="card-note">Any one of these works.</p>${toyChips}</div>` : ''}
    <div class="card">
      <h2>You need</h2>
      <ul class="needs">${needs.map((t) => `<li>${t}</li>`).join('')}</ul>
    </div>
    <div class="card">
      <h2>How hard?</h2>
      ${seg('mode', modes.filter((m) => LEVEL[m]).map((m) => [m, LEVEL[m]]), flow.mode)}
      ${modes.includes('mix') ? seg('mode', [['mix', 'Mix'], ['ramp', 'Ramp up']], flow.mode, 'second') : ''}
      <p class="card-note">${MODE_HINT[flow.mode]}${lastMode && RATING_WORD[last.rating] ? ` Last time: ${lastMode}, ${RATING_WORD[last.rating].toLowerCase()}.` : ''}</p>
    </div>
    <div class="card">
      <h2>How many ${unitOf(a, 2)}?</h2>
      ${seg('count', countsOf(a).map((n) => [n, n]), flow.n)}
      ${isBuild(a) ? '<p class="card-note">Each go is a fresh build, so one is plenty.</p>' : ''}
    </div>
    ${choose && flow.viaToy ? `<details class="card swap" ${flow.swapOpen ? 'open' : ''}><summary data-act="swap">Got a different toy out?</summary><p class="card-note">This game also works with these.</p>${toyChips}</details>` : ''}
  </section>
  <footer class="bar"><button class="btn primary big" data-act="start">Start</button></footer>`;
}

function setupScreen() {
  const { inst } = flow;
  const pics = inst.scenes.filter((s) => !s.flash);
  return `${playTop()}
  <section class="page stage">
    <div class="phase p-setup"><b>${flow.setups > 1 ? 'New set-up' : 'Set up'}</b><span>For you. Lay this out, then tap the button.</span></div>
    ${pics.map(scenePic).join('')}
    <ul class="setup">${inst.setup.map((t) => `<li>${w(t)}</li>`).join('')}</ul>
    <div class="controls"><button class="btn slim" data-act="shuffle">${icon.dice} Different numbers</button></div>
  </section>
  <footer class="bar"><button class="btn primary big" data-act="ready">It is set up. Ask him</button></footer>`;
}

function answerArea(ans) {
  if (ans.type === 'number')
    return `<div class="answers">${ans.choices.map((n) => `<button class="num" data-act="num" data-v="${n}" aria-label="${n}">${render(numeral(n, 54), { bare: true, pad: 8, zoom: 1 })}</button>`).join('')}</div>`;
  if (ans.type === 'pick')
    return `<div class="answers">${ans.options.map((o) => `<button class="pick ${o.sprite ? 'pic' : 'txt'}" data-act="pick" data-v="${esc(o.key)}">${o.sprite ? render(o.sprite, { bare: true, pad: 6, zoom: 1.6 }) : esc(o.label)}</button>`).join('')}</div>`;
  if (ans.type === 'tap') return `<p class="hint">${ans.multi ? 'Tap every one that fits, then Check.' : 'Tap the answer on the picture.'}</p>`;
  if (ans.type === 'spinner') return `<div class="spinner"><div class="spin-face" id="spin-face" aria-live="polite">?</div><button class="btn primary big" data-act="spin">Spin</button></div>`;
  return '';
}

function askScreen() {
  const q = flow.qs[flow.qi];
  const scenes = q.scenes || flow.inst.scenes;
  const hands = ['do', 'open', 'spinner'].includes(q.answer.type); // answered with the toys, not the screen
  return `${playTop()}
  <section class="page stage">
    <div class="phase p-ask"><b>Ask</b><span>Read this out loud.</span></div>
    ${q.note ? `<p class="note"><b>You</b> ${w(q.note)}</p>` : ''}
    <p class="say">${w(q.ask)}</p>
    ${scenes.map(scenePic).join('')}
    ${answerArea(q.answer)}
    <p class="feedback" id="feedback" aria-live="polite"></p>
    <div class="reveal" id="reveal" hidden>${q.reveal ? `<p>${w(q.reveal.caption)}</p>${q.reveal.sprite ? `<figure class="fig">${render(q.reveal.sprite, { label: 'Answer picture' })}</figure>` : ''}` : ''}</div>
  </section>
  <footer class="bar" id="bar">${hands ? `<button class="btn" data-act="skip">Skip</button><button class="btn primary big" data-act="did-it">Did it!</button>` : `${q.answer.multi ? '<button class="btn primary big" data-act="check">Check</button>' : ''}<button class="btn quiet" data-act="show">Show the answer</button>`}</footer>`;
}

// What the bottom bar offers once a question is finished.
function nextBar() {
  if (flow.q + 1 >= flow.n) return `<button class="btn primary big" data-act="finish">Finish</button>`;
  return `<button class="btn" data-act="finish">Stop here</button><button class="btn primary big" data-act="next">Next ${unitOf(flow.a, 1)}</button>`;
}

function doneScreen() {
  const c = store.child();
  const got = stars();
  const asked = flow.marks.length;
  return `<section class="page done">
    <div class="done-mascot" id="mascot">${mascot(c)}</div>
    ${asked ? starRow(asked) : ''}
    <p class="say">${got ? `${got} ${got === 1 ? 'star' : 'stars'} for ${esc(c.name)}!` : 'All done.'}</p>
    ${asked ? `<p class="lede">${got} right out of ${asked} ${unitOf(flow.a, asked)}.</p>` : ''}
    <div id="rate">
      <p class="kicker">Grown-up: how did it go?</p>
      <div class="rate-btns">${store.RATINGS.map((r) => `<button class="btn r-${r.id}" data-act="rate" data-v="${r.id}">${r.label}</button>`).join('')}</div>
    </div>
    <div id="after" hidden></div>
  </section>`;
}

const play = () => ({ ready: readyScreen, setup: setupScreen, ask: askScreen, done: doneScreen }[flow.stage]());

function tipsSheet() {
  const { a } = flow;
  // Before Start there is no set-up yet, so show the tips for the easiest one.
  const inst = flow.inst || a.make(makeRng(1), levelsOf(a)[0], { toys: a.toys });
  return `<div class="sheet-back" data-act="close-sheet"></div>
  <aside class="sheet" role="dialog" aria-label="Tips">
    <button class="round sheet-close" data-act="close-sheet" aria-label="Close">${icon.close}</button>
    <h2>Watch for</h2>
    <ul class="setup">${inst.look.map((t) => `<li>${w(t)}</li>`).join('')}</ul>
    <h2>Easier</h2><p>${w(inst.easier)}</p>
    <h2>Harder</h2><p>${w(inst.harder)}</p>
    <h2>Words to use</h2>
    <p class="words">${inst.words.map((w) => `<em>${esc(w)}</em>`).join('')}</p>
    <h2>Why this one</h2>
    <p>${w(a.why)}</p>
    <ul class="refs">${a.research.map(refItem).join('')}</ul>
  </aside>`;
}
const refItem = (id) => {
  const r = REFS[id];
  return `<li><a href="${r.url}" target="_blank" rel="noopener">${esc(r.cite)}</a><span>${esc(r.found)}</span><span class="caveat">${esc(r.caveat)}</span></li>`;
};

const YES = ['Yes!', 'That is it!', 'You got it!', 'Spot on!', 'Brilliant!'];
function setFeedback(ok, text) {
  const f = document.getElementById('feedback');
  if (!f) return;
  f.className = 'feedback ' + (ok ? 'ok' : 'no');
  f.textContent = text;
}
// The question is over: show the answer and what to do next.
function finishQuestion(gotIt) {
  if (flow.answered) return;
  flow.answered = true;
  flow.marks[flow.q] = gotIt ? 'star' : 'seen';
  const r = document.getElementById('reveal');
  if (r && r.innerHTML.trim()) r.hidden = false;
  document.getElementById('track').outerHTML = track();
  if (gotIt) {
    setFeedback(true, YES[Math.floor(Math.random() * YES.length)]);
    document.querySelector(`.track .star:nth-child(${flow.q + 1})`)?.classList.add('pop');
    celebrate(store.settings().sound, mascot(store.child()));
  }
  document.getElementById('bar').innerHTML = nextBar();
  document.querySelectorAll('.answers button').forEach((b) => (b.disabled = true));
  (r && !r.hidden ? r : document.getElementById('feedback')).scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}
function wrong() {
  flow.wrong++;
  const multi = flow.qs[flow.qi].answer.multi;
  setFeedback(false, multi ? 'Not quite. Check each one again.' : flow.wrong > 1 ? 'Not that one. Try it with the toys.' : 'Not that one. Have another look.');
}

// ---------------------------------------------------------------- progress
function progress() {
  const c = store.child();
  const fmt = (t) => new Date(t).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  return `${topBar('Progress')}
  <section class="page">
    <div class="hero"><span class="avatar big">${mascot(c)}</span><div><p class="hero-name">${esc(c.name)}</p><p class="hero-stars">${icon.star(true)} ${c.stars} ${c.stars === 1 ? 'star' : 'stars'} so far</p></div></div>
    <p class="lede">One dot for each activity. Tap a dot to play it. A star is one right answer.</p>
    <div class="prog">${STRANDS.map((s) => {
      const sum = store.strandSummary(s.id);
      return `<section class="prog-row" style="--c:${s.colour}">
        <header><h2>${esc(s.name)}</h2><span>${sum.tried} of ${sum.total} tried</span></header>
        <div class="dots">${forSkill(s.id).map((a) => `<a href="#/play/${a.id}" class="dot big r-${store.actState(a.id).last?.rating || 'none'}" title="${esc(a.title)}"><span class="sr">${esc(a.title)}</span></a>`).join('')}</div>
      </section>`;
    }).join('')}</div>
    <p class="key"><span class="dot r-none"></span>Not tried <span class="dot r-right"></span>Just right <span class="dot r-easy"></span>Too easy <span class="dot r-hard"></span>Too tricky <span class="dot r-skip"></span>Not today</p>
    <h2>Lately</h2>
    ${c.log.length ? `<ul class="log">${c.log.slice(0, 15).map((e) => (byId[e.id] ? `<li><a href="#/play/${e.id}">${esc(byId[e.id].title)}</a><span>${fmt(e.t)}, ${MODE[e.mode ?? e.level].toLowerCase()}${e.asked ? `, ${e.stars} of ${e.asked} right` : e.stars ? `, ${e.stars} ${e.stars === 1 ? 'star' : 'stars'}` : ''}</span><span class="badge r-${e.rating}">${RATING_WORD[e.rating]}</span></li>` : '')).join('')}</ul>` : '<p class="empty">Nothing yet. Play one and say how it went.</p>'}
  </section>`;
}

// ---------------------------------------------------------------- adding the app to the home screen
// Android and desktop Chrome hand us an "install" event we can fire from our own button.
// iPhones and iPads do not: there the adult has to use the Share menu, so we show them how.
let installEvent = null;
const standalone = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
const canInstall = () => !standalone() && !store.installed();
function installHelp() {
  if (installEvent) return `<button class="btn primary big wide" data-act="install">${icon.install}<span>Add to home screen</span></button>`;
  if (isIOS)
    return `<ol class="how">
      <li><span class="how-ico">${icon.share}</span><span>Tap <b>Share</b> in the browser's bar.</span></li>
      <li><span class="how-ico">${icon.plusBox}</span><span>Scroll down and tap <b>Add to Home Screen</b>.</span></li>
      <li><span class="how-ico">${logo()}</span><span>Tap <b>Add</b>. The toy box appears with your other apps.</span></li>
    </ol>`;
  return `<ol class="how">
      <li><span class="how-ico">${icon.dots}</span><span>Open your browser's <b>menu</b>.</span></li>
      <li><span class="how-ico">${icon.plusBox}</span><span>Tap <b>Install app</b> or <b>Add to Home screen</b>.</span></li>
    </ol>`;
}
const INSTALL_WHY = 'It opens full screen from its own icon, and works with no signal.';
function installSheet() {
  return `<div class="sheet-back" data-act="close-sheet"></div>
  <aside class="sheet" role="dialog" aria-label="Add to home screen">
    <button class="round sheet-close" data-act="close-sheet" aria-label="Close">${icon.close}</button>
    <h2>Put it on your home screen</h2>
    <p class="lede">${INSTALL_WHY}</p>
    ${installHelp()}
  </aside>`;
}
const sheetEl = () => document.getElementById('sheet');
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault(); // keep it for our own button
  installEvent = e;
  store.setInstalled(false);
  if (sheetEl().querySelector('.how')) sheetEl().innerHTML = installSheet();
  if (!flow) draw(true);
});
window.addEventListener('appinstalled', () => {
  installEvent = null;
  store.setInstalled(true);
  sheetEl().replaceChildren();
  if (!store.welcomed()) return finishWelcome();
  if (!flow) draw(true);
});

// ---------------------------------------------------------------- welcome (the first time the app is opened)
// Four short screens: what this is, who is playing, which toys are in the house, add it to the home screen.
// The last one is left out when the app is already running from the home screen.
let welcomeStep = null;
const welcomeSteps = () => ['hello', 'who', 'toys', ...(standalone() ? [] : ['install'])];
function finishWelcome() {
  store.setWelcomed();
  welcomeStep = null;
  go('#/');
}
const POINTS = [
  ['toys', 'Played with real toys', 'The phone says what to lay out and what to ask. Your child answers with the toys.'],
  ['dice', 'A few minutes at a time', 'Choose a game, or let the app choose. Stop whenever you like.'],
  ['book', 'Honest about the research', 'Each game names the study behind it, and what that study does not show.'],
  ['lock', 'Private', 'Names and progress stay on this phone. Nothing is sent anywhere.'],
];
function welcome() {
  const steps = welcomeSteps();
  if (welcomeStep === null) welcomeStep = store.children().length ? 2 : 0; // came back part-way through
  welcomeStep = Math.min(welcomeStep, steps.length - 1);
  const step = steps[welcomeStep];
  const kids = store.children();
  const last = welcomeStep === steps.length - 1;
  const dots = `<p class="dots" aria-label="Step ${welcomeStep} of ${steps.length - 1}">${steps.slice(1).map((_, i) => `<i${i < welcomeStep ? ' class="on"' : ''}></i>`).join('')}</p>`;
  const top = `<header class="top"><button class="round" data-act="welcome-back" aria-label="Back">${icon.back}</button>${dots}<span class="round ghost"></span></header>`;
  const next = (label = last ? 'Finish' : 'Next') => `<button class="btn primary big wide" data-act="welcome-next">${label}</button>`;

  if (step === 'hello')
    return `<section class="page welcome hello">
      <div class="hello-logo">${logo()}</div>
      <h1>Welcome to <span>Toybox</span> <b>Maths</b></h1>
      <p class="lede">Short maths games for little ones, played with the toys you already have.</p>
      <ul class="points">${POINTS.map(([i, title, text]) => `<li><span class="point-ico">${i === 'toys' ? pic(toyArt.wooden()) : icon[i]}</span><span><b>${title}</b>${text}</span></li>`).join('')}</ul>
      ${next('Set it up')}
      <p class="small">Three quick steps.</p>
    </section>`;

  if (step === 'who') {
    const used = kids.map((k) => k.animal);
    if (!pickedMascot || !MASCOTS.includes(pickedMascot)) pickedMascot = MASCOTS.find((m) => !used.includes(m)) || MASCOTS[0];
    return `${top}<section class="page welcome">
      <p class="say">Who is playing?</p>
      <p class="lede">Each child gets an animal that dances when they get one right. Stars and progress are kept for each child.</p>
      ${kids.length ? `<ul class="kids">${kids.map((k) => `<li class="kid"><span class="kid-main"><span class="avatar big">${mascot(k)}</span><span class="kid-name">${esc(k.name)}</span></span></li>`).join('')}</ul>${next()}` : ''}
      <form class="add" data-form="add-child">
        <h2>${kids.length ? 'Add another child' : 'First child'}</h2>
        <label class="field"><span>Name</span><input name="name" maxlength="14" autocomplete="off" autocapitalize="words" placeholder="Name or nickname" /></label>
        <p class="field-label">Their animal</p>
        <div class="mascots">${MASCOTS.map((m) => `<button type="button" class="mascot-pick" data-act="mascot" data-v="${m}" aria-pressed="${m === pickedMascot}" aria-label="${m}">${pic(D.animal(m))}</button>`).join('')}</div>
        <p class="field-label">The questions should say</p>
        ${pronounSeg('new-pronoun', pickedPronoun)}
        <p class="field-label">Born (you can leave this out)</p>
        ${bornFields('', '')}
        <p class="small">Used only to sort activities by age. It stays on this phone.</p>
        <button class="btn ${kids.length ? '' : 'primary '}big" type="submit">${kids.length ? 'Add' : 'Next'}</button>
      </form>
      <p class="small">You can add more children later, from the name at the top.</p>
    </section>`;
  }

  if (step === 'toys') {
    const n = owned().length;
    return `${top}<section class="page welcome">
      <p class="say">Which toys do you have?</p>
      <p class="lede">Tap any you do not have to switch them off. Their games are hidden.</p>
      <div class="tiles">${TOYS.map((t) => `<button class="tile own-tile" data-act="own" data-v="${t.id}" aria-pressed="${owned().includes(t.id)}"><span class="tile-pic">${pic(toyArt[t.id]())}</span><span class="tile-name">${esc(t.name)}</span><span class="tick" aria-hidden="true"></span></button>`).join('')}</div>
      <p class="small">${n ? `${n} ${n === 1 ? 'kind' : 'kinds'} of toy ticked.` : 'No toys ticked.'} Some games need no toys at all. Change this any time in Settings.</p>
      ${next()}
    </section>`;
  }

  return `${top}<section class="page welcome">
    <div class="hello-logo app-icon">${logo()}</div>
    <p class="say">Put it on your home screen</p>
    <p class="lede">${INSTALL_WHY}</p>
    ${installHelp()}
    <button class="btn ${installEvent ? 'quiet' : 'primary big'} wide" data-act="welcome-next">${installEvent ? 'Not now' : isIOS ? 'Done' : 'Finish'}</button>
    <p class="small">You can do this later from the ${icon.install} button at the top.</p>
  </section>`;
}

// ---------------------------------------------------------------- who is playing
let pickedMascot = null;
let pickedPronoun = 'he';
const PRONOUNS = [['he', 'He'], ['she', 'She']];
const pronounSeg = (act, current) => `<div class="seg" role="group" aria-label="Wording">${PRONOUNS.map(([v, label]) => `<button type="button" data-act="${act}" data-v="${v}" aria-pressed="${v === current}">${label}</button>`).join('')}</div>`;
let confirmRemove = null;
let editing = null; // id of the child whose details are being changed
// The form for changing one child's details. Remove lives in here too, so it is not tapped by mistake.
function editForm(k) {
  return `<li class="kid editing"><form class="add" data-form="edit-child" data-id="${k.id}">
    <h2>Change ${esc(k.name)}</h2>
    <label class="field"><span>Name</span><input name="name" maxlength="14" autocomplete="off" autocapitalize="words" value="${esc(k.name)}" /></label>
    <p class="field-label">Their animal</p>
    <div class="mascots">${MASCOTS.map((m) => `<button type="button" class="mascot-pick" data-act="mascot" data-v="${m}" aria-pressed="${m === pickedMascot}" aria-label="${m}">${pic(D.animal(m))}</button>`).join('')}</div>
    <p class="field-label">The questions should say</p>
    ${pronounSeg('new-pronoun', pickedPronoun)}
    <p class="field-label">Born (you can leave this out)</p>
    ${bornFields('', k.born)}
    <p class="small">Used only to sort activities by age. It stays on this phone.</p>
    <button class="btn primary big" type="submit">Save</button>
    <div class="row"><button type="button" class="btn" data-act="edit-cancel">Cancel</button><button type="button" class="btn quiet" data-act="remove-ask" data-id="${k.id}">Remove ${esc(k.name)}</button></div>
  </form></li>`;
}
function who() {
  const kids = store.children();
  const cur = store.child();
  const firstRun = !kids.length;
  const used = kids.map((k) => k.animal);
  if (!kids.some((k) => k.id === editing)) editing = null;
  if (!pickedMascot || !MASCOTS.includes(pickedMascot)) pickedMascot = MASCOTS.find((m) => !used.includes(m)) || MASCOTS[0];
  return `${firstRun ? `<header class="top">${BRAND}</header>` : `<header class="top"><a class="round" href="#/" aria-label="Back">${icon.back}</a><h1>Who is playing?</h1></header>`}
  <section class="page">
    ${firstRun ? '<p class="say">Who is playing?</p><p class="lede">Add each child once. Their progress and stars are kept separately, on this phone only.</p>' : ''}
    ${kids.length ? `<ul class="kids">${kids
      .map((k) =>
        confirmRemove === k.id
          ? `<li class="kid confirm"><p>Remove ${esc(k.name)} and all their progress?</p><div class="row"><button class="btn" data-act="remove-no">Keep</button><button class="btn r-hard" data-act="remove-yes" data-id="${k.id}">Remove</button></div></li>`
          : editing === k.id
            ? editForm(k)
            : `<li class="kid${k.id === cur.id ? ' current' : ''}"><button class="kid-main" data-act="switch" data-id="${k.id}"><span class="avatar big">${mascot(k)}</span><span class="kid-name">${esc(k.name)}</span><span class="kid-stars">${icon.star(true)} ${k.stars}</span></button><button class="btn quiet slim" data-act="edit" data-id="${k.id}">Edit</button></li>`
      )
      .join('')}</ul>` : ''}
    ${editing ? '' : `<form class="add" data-form="add-child">
      <h2>${firstRun ? 'First child' : 'Add a child'}</h2>
      <label class="field"><span>Name</span><input name="name" maxlength="14" autocomplete="off" autocapitalize="words" placeholder="Name or nickname" /></label>
      <p class="field-label">Their animal</p>
      <div class="mascots">${MASCOTS.map((m) => `<button type="button" class="mascot-pick" data-act="mascot" data-v="${m}" aria-pressed="${m === pickedMascot}" aria-label="${m}">${pic(D.animal(m))}</button>`).join('')}</div>
      <p class="field-label">The questions should say</p>
      ${pronounSeg('new-pronoun', pickedPronoun)}
      <p class="field-label">Born (you can leave this out)</p>
      ${bornFields('', '')}
      <p class="small">Used only to sort activities by age. It stays on this phone.</p>
      <button class="btn primary big" type="submit">${firstRun ? 'Start' : 'Add'}</button>
    </form>`}
  </section>`;
}

// ---------------------------------------------------------------- settings
const onOff = (key, on) => `<div class="seg" role="group"><button data-act="set" data-key="${key}" data-v="1" aria-pressed="${on}">On</button><button data-act="set" data-key="${key}" data-v="0" aria-pressed="${!on}">Off</button></div>`;
function settingsScreen() {
  const s = store.settings();
  const c = store.child();
  return `${topBar('Settings')}
  <section class="page settings">
    <div class="setting"><h2>Look</h2>
      <div class="seg" role="group" aria-label="Look">${[['system', 'Match phone'], ['light', 'Light'], ['dark', 'Dark']].map(([v, l]) => `<button data-act="set" data-key="theme" data-v="${v}" aria-pressed="${s.theme === v}">${l}</button>`).join('')}</div>
    </div>
    <div class="setting"><h2>Sound</h2>${onOff('sound', s.sound)}</div>
    <div class="setting"><h2>Animation</h2>${onOff('motion', s.motion)}<p>Stars flying and the animal dancing.</p></div>
    <div class="setting"><h2>Questions about ${esc(c.name)} say</h2>${pronounSeg('pronoun', c.pronoun || 'he')}<p>Each child has their own. Change child from the name at the top.</p></div>
    <div class="setting"><h2>${esc(c.name)} was born</h2>${bornFields('born', c.born)}<p>${ageLine(c)} This stays on this phone.</p></div>
    <div class="setting"><h2>Our toys</h2><p>Untick anything you do not have. Its activities are hidden.</p>
      <div class="own">${TOYS.map((t) => `<button class="chip" data-act="own" data-v="${t.id}" aria-pressed="${s.toys.includes(t.id)}">${esc(t.name)}</button>`).join('')}</div>
    </div>
    <a class="setting more" href="#/guide"><span><b>About the research</b><span>Keeping it play, what the studies do and do not show, and every source.</span></span>${icon.back}</a>
  </section>`;
}
// Put the look and animation settings into effect.
function applySettings() {
  const s = store.settings();
  if (s.theme === 'system') delete document.documentElement.dataset.theme;
  else document.documentElement.dataset.theme = s.theme;
  document.body.classList.toggle('calm', !s.motion);
}

// ---------------------------------------------------------------- guide
function guide() {
  return reword(guideText(), store.child()?.pronoun);
}
function guideText() {
  return `<header class="top"><a class="round" href="#/settings" aria-label="Back">${icon.back}</a><h1>About the research</h1></header>
  <section class="page guide">
    <h2>Keeping it play</h2>
    <ul class="plain">
      <li><strong>You set the goal, he leads the doing.</strong> That is guided play, the approach the evidence favours over simply telling children things.</li>
      <li><strong>Free play still matters.</strong> The research does not show free play is worse in general. These activities are an extra.</li>
      <li><strong>Stop when he has had enough.</strong> There is no research-backed number of minutes for this age. Finish early whenever you like.</li>
      <li><strong>Talk.</strong> Much of the benefit in these studies came through the words adults used.</li>
      <li><strong>Praise the doing.</strong> "You checked every one" rather than "clever boy".</li>
    </ul>

    <h2>What the research does and does not say</h2>
    <ul class="plain">
      ${NOT_CLAIMED.map((t) => `<li>${esc(t)}</li>`).join('')}
      <li>The age range on each activity is a rough guide: the first age is for the Easy version, the second for the hardest. It comes from the curriculum guidance for England and from the ages of the children in the studies. No study tested these activities at these ages.</li>
    </ul>

    <h2>The kits you already have</h2>
    <ul class="plain">
      <li><strong>Numicon First Steps.</strong> Work through its own activity book in order. The Numicon activities here are extras.</li>
      <li><strong>The rabbit game.</strong> Its own challenge cards are the main event. The rabbit activities here use the same three blocks with our own pictures.</li>
      <li><strong>Train track.</strong> The track activities use long straights, short straights and curves only. Swap in whatever lengths you have.</li>
      <li><strong>Small parts.</strong> Pegs and linking cubes are labelled 3+. Stay with him while they are out.</li>
    </ul>

    <h2>Sources</h2>
    <p>Each activity lists its own sources under the round "i" button. This is all of them.</p>
    <ul class="refs all">${Object.keys(REFS).map(refItem).join('')}</ul>
  </section>`;
}

// ---------------------------------------------------------------- routing
function parts() {
  return location.hash.replace(/^#\/?/, '').split('/');
}
function screen() {
  const [page, a, b] = parts();
  if (!store.welcomed()) return { html: welcome(), tab: '', playing: true };
  if (!store.child()) return { html: who(), tab: '', playing: true };
  if (page === 'play') {
    const html = startActivity(a, b);
    if (html) return { html, tab: '', playing: true };
  }
  if (page === 'toy' || page === 'skill') {
    const html = list(page, a);
    if (html) return { html, tab: 'home' };
  }
  if (page === 'favourites') return { html: list('fav'), tab: 'fav' };
  if (page === 'progress') return { html: progress(), tab: 'progress' };
  if (page === 'guide') return { html: guide(), tab: 'settings' };
  if (page === 'settings') return { html: settingsScreen(), tab: 'settings' };
  if (page === 'who') return { html: who(), tab: '' };
  return { html: home(), tab: 'home' };
}
function draw(keepScroll) {
  const y = window.scrollY;
  const s = screen();
  view.innerHTML = s.html;
  document.body.classList.toggle('playing', !!s.playing);
  document.querySelectorAll('.tabs a').forEach((el) => el.setAttribute('aria-current', el.dataset.tab === s.tab ? 'page' : 'false'));
  window.scrollTo(0, keepScroll ? y : 0);
  const a = parts()[0] === 'play' && byId[parts()[1]];
  document.title = a ? `${a.title} – Toybox Maths` : 'Toybox Maths';
}
let lastHash = location.hash;
window.addEventListener('hashchange', () => {
  hush();
  // Remember where an activity was opened from, so its close button goes back there.
  if (parts()[0] === 'play' && !lastHash.startsWith('#/play')) from = lastHash || '#/';
  if (parts()[0] !== 'play') flow = null;
  lastHash = location.hash;
  draw(false);
});
const go = (hash) => {
  if (location.hash === hash) draw(false);
  else location.hash = hash;
};

// ---------------------------------------------------------------- taps
function onTap(el, e) {
  const act = el.dataset.act;
  const v = el.dataset.v;

  // ----- browsing
  if (act === 'home-mode') {
    homeMode = v;
    return draw(true);
  }
  if (act === 'filter') {
    listFilter = v || null;
    return draw(true);
  }
  if (act === 'surprise') {
    const a = store.pick(ACTIVITIES, flow?.a?.id);
    flow = null;
    return go('#/play/' + a.id);
  }
  if (act === 'pick-here') {
    // On the Favourites screen a heart that has just been tapped off leaves its row in place: do not pick that one.
    const favPage = parts()[0] === 'favourites';
    const ids = shownIds().filter((id) => !favPage || store.isFav(id));
    const a = store.pick(ACTIVITIES.filter((x) => ids.includes(x.id)), null, favPage);
    const toy = parts()[0] === 'toy' ? parts()[1] : '';
    return a && go(`#/play/${a.id}${toy && toy !== 'none' ? '/' + toy : ''}`);
  }

  if (act === 'fav') {
    // Change every heart for this activity where it stands. Nothing is redrawn, so the page does not jump,
    // and on the Favourites screen the row stays put until you leave: a slip of the thumb is one more tap to undo.
    const on = store.toggleFav(el.dataset.id);
    document.querySelectorAll(`[data-act="fav"][data-id="${el.dataset.id}"]`).forEach((b) => {
      b.setAttribute('aria-pressed', on);
      b.setAttribute('aria-label', on ? 'Remove from favourites' : 'Add to favourites');
      const word = b.querySelector('.fav-word');
      if (word) word.textContent = FAV_WORD(on);
    });
    if (on) {
      el.classList.remove('beat');
      void el.offsetWidth; // restart the little animation
      el.classList.add('beat');
    }
    return;
  }

  // ----- who is playing
  if (act === 'mascot') {
    pickedMascot = v;
    document.querySelectorAll('.mascot-pick').forEach((b) => b.setAttribute('aria-pressed', b === el));
    return;
  }
  if (act === 'switch') {
    store.switchTo(el.dataset.id);
    return go('#/');
  }
  if (act === 'edit' || act === 'edit-cancel') {
    const k = act === 'edit' && store.children().find((c) => c.id === el.dataset.id);
    editing = k ? k.id : null;
    // The form opens on this child's own animal and wording; closing it clears them for the add-a-child form.
    pickedMascot = k ? k.animal : null;
    pickedPronoun = k ? k.pronoun || 'he' : 'he';
    return draw(!!k);
  }
  if (act === 'remove-ask' || act === 'remove-no') {
    confirmRemove = act === 'remove-ask' ? el.dataset.id : null;
    return draw(true);
  }
  if (act === 'remove-yes') {
    store.removeChild(el.dataset.id);
    confirmRemove = null;
    editing = null;
    pickedMascot = null;
    pickedPronoun = 'he';
    return draw(false);
  }
  if (act === 'new-pronoun') {
    pickedPronoun = v;
    return el.parentElement.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', b === el));
  }
  if (act === 'pronoun') {
    store.setPronoun(v);
    return draw(true);
  }
  if (act === 'set') {
    const key = el.dataset.key;
    store.set(key, key === 'theme' ? v : v === '1');
    applySettings();
    return draw(true);
  }
  if (act === 'own') {
    const toys = new Set(owned());
    toys.has(v) ? toys.delete(v) : toys.add(v);
    store.set('toys', TOYS.map((t) => t.id).filter((id) => toys.has(id)));
    return draw(true);
  }
  if (act === 'close-sheet') return sheetEl().replaceChildren();

  // ----- welcome, and adding to the home screen
  if (act === 'welcome-next') {
    if (welcomeStep >= welcomeSteps().length - 1) return finishWelcome();
    if (welcomeSteps()[welcomeStep] === 'who' && !store.child()) return; // a child is added with the form's own button
    welcomeStep++;
    return draw(false);
  }
  if (act === 'welcome-back') {
    welcomeStep = Math.max(0, welcomeStep - 1);
    return draw(false);
  }
  if (act === 'install-sheet') {
    sheetEl().innerHTML = installSheet();
    return;
  }
  if (act === 'install') {
    if (!installEvent) return;
    const asked = installEvent;
    installEvent = null; // the phone only lets it be used once
    asked.prompt();
    asked.userChoice.finally(() => !flow && draw(true));
    return;
  }
  if (!flow) return;

  // ----- inside an activity
  if (act === 'tips') {
    document.getElementById('sheet').innerHTML = tipsSheet();
    return;
  }
  if (act === 'toy' || act === 'mode' || act === 'count') {
    if (act === 'toy') flow.toy = v;
    if (act === 'mode') flow.mode = v;
    if (act === 'count') flow.n = Number(v);
    return draw(true);
  }
  if (act === 'swap') {
    flow.swapOpen = !flow.swapOpen; // remember it, so choosing a toy does not fold the menu away
    return;
  }
  if (act === 'start') {
    store.set(isBuild(flow.a) ? 'goes' : 'questions', flow.n);
    deal(firstLevel(), flow.eg);
    return draw(false);
  }
  if (act === 'shuffle') {
    flow.setups--;
    deal(flow.level);
    return draw(true);
  }
  if (act === 'ready') {
    flow.stage = 'ask';
    return draw(false);
  }
  if (act === 'flash') {
    const fig = el.closest('.flash');
    fig.classList.add('on');
    el.disabled = true;
    setTimeout(() => {
      fig.classList.remove('on');
      el.disabled = false;
      el.textContent = 'Show again';
    }, Number(fig.dataset.secs) * 1000);
    return;
  }
  if (act === 'spin') {
    const face = document.getElementById('spin-face');
    const vals = flow.qs[flow.qi].answer.values;
    const n = vals[Math.floor(Math.random() * vals.length)];
    face.classList.remove('landed');
    void face.offsetWidth; // restart the little animation
    face.innerHTML = render(numeral(n, 70), { bare: true, pad: 8, zoom: 1 });
    face.classList.add('landed');
    face.setAttribute('aria-label', 'You spun ' + n);
    return;
  }
  if (act === 'num' || act === 'pick') {
    if (flow.answered) return;
    const ans = flow.qs[flow.qi].answer;
    const ok = act === 'num' ? Number(v) === ans.value : v === ans.correct;
    el.classList.add(ok ? 'right' : 'wrong');
    if (!ok) {
      el.disabled = true;
      return wrong();
    }
    return finishQuestion(true);
  }
  if (act === 'check') {
    const want = new Set(flow.qs[flow.qi].answer.correct);
    const ok = want.size === flow.picked.size && [...want].every((k) => flow.picked.has(k));
    if (!ok) return wrong();
    document.querySelectorAll('.hit.sel').forEach((h) => h.classList.replace('sel', 'right'));
    return finishQuestion(true);
  }
  if (act === 'did-it') return finishQuestion(true);
  if (act === 'show' || act === 'skip') {
    // Show which one was right, without a star.
    const ans = flow.qs[flow.qi].answer;
    if (ans.type === 'tap') ans.correct.forEach((k) => document.querySelector(`.hit[data-key="${CSS.escape(k)}"]`)?.classList.add('right'));
    if (ans.type === 'number') document.querySelector(`.num[data-v="${ans.value}"]`)?.classList.add('right');
    if (ans.type === 'pick') document.querySelector(`.pick[data-v="${CSS.escape(ans.correct)}"]`)?.classList.add('right');
    return finishQuestion(false);
  }
  if (act === 'next') {
    flow.q++;
    // Carry on with this set-up while it has questions left (and, when ramping up, while it is still the right difficulty).
    const stay = flow.qi < flow.qs.length - 1 && (flow.mode !== 'ramp' || levelAt(flow.q) === flow.level);
    if (stay) {
      flow.qi++;
      resetQuestion();
    } else deal();
    return draw(false);
  }
  if (act === 'finish') {
    flow.stage = 'done';
    draw(false);
    if (stars()) finale(store.settings().sound);
    return;
  }
  if (act === 'rate') {
    if (flow.rated) return;
    flow.rated = v;
    store.rate(flow.a.id, v, flow.mode, stars(), flow.marks.length);
    document.querySelectorAll('.rate-btns button').forEach((b) => {
      b.disabled = true;
      if (b === el) b.classList.add('chosen');
    });
    const nextMode = store.suggest(flow.a, modesOf(flow.a));
    const moved = nextMode !== flow.mode ? `Next time this opens on ${MODE[nextMode]}.` : '';
    const box = document.getElementById('after');
    box.hidden = false;
    box.innerHTML = `${moved ? `<p class="moved">${moved}</p>` : ''}${heart(flow.a.id, true)}<div class="after-btns"><a class="btn primary big" href="${from}">Done</a><button class="btn" data-act="again">Same again</button><button class="btn" data-act="surprise">${icon.dice} Another</button></div>`;
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    return;
  }
  if (act === 'again') {
    const { a, toy } = flow;
    flow = null;
    view.innerHTML = startActivity(a.id, toy);
    return window.scrollTo(0, 0);
  }
}

// A tap on part of a picture (activities where the answer is "tap the right one").
function onHit(g) {
  if (!flow || flow.stage !== 'ask' || flow.answered) return;
  const ans = flow.qs[flow.qi].answer;
  if (ans.type !== 'tap') return;
  const key = g.dataset.key;
  if (ans.multi) {
    g.classList.toggle('sel');
    flow.picked.has(key) ? flow.picked.delete(key) : flow.picked.add(key);
    return;
  }
  if (ans.correct.includes(key)) {
    g.classList.add('right');
    finishQuestion(true);
  } else {
    g.classList.add('wrong');
    wrong();
  }
}

document.addEventListener('click', (e) => {
  const hitEl = e.target.closest('.hit');
  if (hitEl) return onHit(hitEl);
  const el = e.target.closest('[data-act]');
  if (el) onTap(el, e);
});
document.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.classList?.contains('hit')) {
    e.preventDefault();
    onHit(e.target);
  }
});
document.addEventListener('change', (e) => {
  if (e.target.dataset?.change !== 'born') return; // the menus in the add-a-child form are read when it is sent
  const box = e.target.closest('.born');
  const born = bornFrom(box);
  // Save once both menus are filled in, or when both have been cleared.
  if (born || (!box.querySelector('[name="born-month"]').value && !box.querySelector('[name="born-year"]').value)) {
    store.setBorn(born);
    draw(true);
  }
});
document.addEventListener('submit', (e) => {
  if (e.target.dataset.form === 'edit-child') {
    e.preventDefault();
    const k = store.children().find((c) => c.id === e.target.dataset.id);
    store.updateChild(k.id, { name: new FormData(e.target).get('name').trim() || k.name, animal: pickedMascot, pronoun: pickedPronoun, born: bornFrom(e.target) });
    editing = null;
    pickedMascot = null;
    pickedPronoun = 'he';
    return draw(false);
  }
  if (e.target.dataset.form !== 'add-child') return;
  e.preventDefault();
  const typed = new FormData(e.target).get('name').trim();
  const name = typed || pickedMascot[0].toUpperCase() + pickedMascot.slice(1); // no name typed: call them by their animal
  store.addChild(name, pickedMascot, pickedPronoun, bornFrom(e.target));
  pickedMascot = null;
  pickedPronoun = 'he';
  if (!store.welcomed()) {
    welcomeStep = 2; // on to the toys
    return draw(false);
  }
  go('#/');
});

applySettings();
draw(false);

// Works offline once installed.
if ('serviceWorker' in navigator && location.protocol === 'https:') {
  // When a newer version of the app takes over, reload once so every file on screen matches it.
  const hadOne = !!navigator.serviceWorker.controller;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (hadOne && !reloaded) {
      reloaded = true;
      location.reload();
    }
  });
  navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' }).then((reg) => reg.update()).catch(() => {});
}
