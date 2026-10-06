// app.js — the screens. Plain JavaScript, no framework, no build step.
//
// Screens are functions that return HTML text. route() picks one from the address:
//   #/                 home: choose a toy (or a skill)
//   #/toy/<id>         activities for one toy          #/skill/<id>   activities for one skill
//   #/play/<id>/<toy>  an activity (set up -> questions -> finish)
//   #/progress         #/guide         #/who  (children and sound)
// All taps are handled in one place near the bottom (onTap).

import { ACTIVITIES, STRANDS, TOYS, byId, levelsOf } from './activities/index.js';
import { REFS, NOT_CLAIMED } from './research.js';
import { makeRng, newSeed } from './rng.js';
import * as D from './draw.js';
import * as store from './store.js';
import { celebrate, finale, hush } from './reward.js';
import { reword } from './wording.js';

const { render, numeral } = D;
const view = document.getElementById('view');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const strandOf = (a) => STRANDS.find((s) => s.id === a.strand);
const pic = (sprite, o = {}) => render(sprite, { bare: true, pad: 2, zoom: 3, ...o });
const starsToFinish = () => store.settings().stars;
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
  bunny: () => D.bunny(),
  none: () => D.row([D.card(1, 40), D.card(2, 40), D.card(3, 40)], { gap: 3 }),
};
const toyName = (id) => TOY_TILES.find((t) => t.id === id)?.name || '';
const owned = () => store.settings().toys;
const toyTiles = () => TOY_TILES.filter((t) => t.id === 'none' || owned().includes(t.id));
const forToy = (id) => ACTIVITIES.filter((a) => (id === 'none' ? a.toys.length === 0 : a.toys.includes(id)));
const forSkill = (id) => ACTIVITIES.filter((a) => a.strand === id && store.playable(a));
const MASCOTS = ['giraffe', 'elephant', 'lion', 'duck', 'pig', 'cow', 'sheep', 'horse'];
const mascot = (c) => pic(D.animal(c?.animal || 'giraffe'));

const RATING_WORD = { easy: 'Too easy', right: 'Just right', hard: 'Too tricky', skip: 'Not today' };
const icon = {
  back: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  close: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/></svg>',
  dice: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="8.5" cy="8.5" r="1.7" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.7" fill="currentColor"/><circle cx="12" cy="12" r="1.7" fill="currentColor"/></svg>',
  tips: '<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2.2"/><path d="M12 11v6" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="12" cy="7.4" r="1.5" fill="currentColor"/></svg>',
  star: (on) => `<svg class="star${on ? ' on' : ''}" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.8l3.1 6.5 7.1.9-5.2 4.9 1.3 7.1L12 17.8 5.7 21.2 7 14.1 1.8 9.2l7.1-.9z"/></svg>`,
};

// The bar at the top of the browsing screens: where you are, and who is playing.
function topBar(title, back) {
  const c = store.child();
  return `<header class="top">
    ${back ? `<a class="round" href="${back}" aria-label="Back">${icon.back}</a>` : ''}
    <h1>${esc(title)}</h1>
    <a class="who" href="#/who" aria-label="Playing: ${esc(c.name)}. Change child"><span class="avatar">${mascot(c)}</span><span>${esc(c.name)}</span></a>
  </header>`;
}

// ---------------------------------------------------------------- home
let homeMode = 'toy';
function home() {
  const tiles =
    homeMode === 'toy'
      ? `<div class="tiles">${toyTiles().map((t) => {
          const n = forToy(t.id).length;
          return `<a class="tile" href="#/toy/${t.id}"><span class="tile-pic">${pic(toyArt[t.id]())}</span><span class="tile-name">${esc(t.name)}</span><span class="tile-n">${n} ${n === 1 ? 'activity' : 'activities'}</span></a>`;
        }).join('')}</div>`
      : `<div class="skills">${STRANDS.map((s) => {
          const sum = store.strandSummary(s.id);
          return `<a class="skill" href="#/skill/${s.id}" style="--c:${s.colour}"><span class="skill-name">${esc(s.name)}</span><span class="skill-blurb">${esc(s.blurb)}</span><span class="skill-n">${forSkill(s.id).length} activities, step ${sum.level}</span></a>`;
        }).join('')}</div>`;
  return `${topBar('Toybox Maths')}
  <section class="page">
    <button class="go" data-act="surprise">${icon.dice}<span>Just pick one</span></button>
    <div class="seg wide" role="group" aria-label="Browse">
      <button data-act="home-mode" data-v="toy" aria-pressed="${homeMode === 'toy'}">By toy</button>
      <button data-act="home-mode" data-v="skill" aria-pressed="${homeMode === 'skill'}">By skill</button>
    </div>
    ${tiles}
  </section>`;
}

// ---------------------------------------------------------------- a list of activities (one toy, or one skill)
let listFilter = null; // the chip that is switched on, if any
function list(kind, id) {
  const isToy = kind === 'toy';
  const all = isToy ? forToy(id) : forSkill(id);
  const title = isToy ? toyName(id) : STRANDS.find((s) => s.id === id)?.name;
  if (!title) return null;
  // Chips filter by the other thing: skills when looking at a toy, toys when looking at a skill.
  const chips = isToy
    ? STRANDS.filter((s) => all.some((a) => a.strand === s.id)).map((s) => ({ id: s.id, name: s.name }))
    : toyTiles().filter((t) => all.some((a) => (t.id === 'none' ? a.toys.length === 0 : a.toys.includes(t.id)))).map((t) => ({ id: t.id, name: t.name }));
  if (!chips.some((c) => c.id === listFilter)) listFilter = null;
  const shown = all.filter((a) => !listFilter || (isToy ? a.strand === listFilter : listFilter === 'none' ? a.toys.length === 0 : a.toys.includes(listFilter)));
  const toy = isToy ? id : listFilter && listFilter !== 'none' ? listFilter : '';
  return `${topBar(title, '#/')}
  <section class="page">
    <button class="go small" data-act="pick-here">${icon.dice}<span>Pick one of these</span></button>
    <div class="chips" role="group" aria-label="Filter">
      <button class="chip" data-act="filter" data-v="" aria-pressed="${!listFilter}">All</button>
      ${chips.map((c) => `<button class="chip" data-act="filter" data-v="${c.id}" aria-pressed="${listFilter === c.id}">${esc(c.name)}</button>`).join('')}
    </div>
    <ul class="list">${shown
      .map((a) => {
        const s = strandOf(a);
        const last = store.actState(a.id).last;
        return `<li><a href="#/play/${a.id}${toy && toy !== 'none' ? '/' + toy : ''}" style="--c:${s.colour}">
          <span class="li-title">${esc(a.title)}</span>
          <span class="li-meta">${isToy ? esc(s.name) + ', ' : ''}${a.minutes} min</span>
          ${last ? `<span class="badge r-${last.rating}">${RATING_WORD[last.rating]}</span>` : '<span class="badge r-new">New</span>'}
        </a></li>`;
      })
      .join('')}</ul>
  </section>`;
}
const shownIds = () => [...document.querySelectorAll('.list a')].map((el) => el.getAttribute('href').split('/')[2]);

// ---------------------------------------------------------------- playing an activity
// flow holds everything about the activity on screen.
let flow = null;
let from = '#/'; // where the close button goes back to

function deal() {
  // Draw a fresh variation of the activity: new numbers, colours and questions.
  const toys = flow.toy ? [flow.toy] : owned();
  flow.inst = flow.a.make(makeRng(flow.seed), flow.level, { toys });
  flow.qs = [flow.inst, ...(flow.inst.more || [])];
  flow.qi = 0;
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
    flow = { a, toy: a.toys.includes(toy) ? toy : '', seed: newSeed(), level: store.levelFor(a), stars: 0, asked: 0, rated: null };
    deal();
  }
  return play();
}

const starRow = () => `<div class="stars" aria-label="${flow.stars} of ${starsToFinish()} stars">${Array.from({ length: Math.max(starsToFinish(), flow.stars) }, (_, i) => icon.star(i < flow.stars)).join('')}</div>`;
const playTop = () => `<header class="top play-top">
    <a class="round" href="${from}" aria-label="Close">${icon.close}</a>
    <h1>${esc(flow.a.title)}</h1>
    ${starRow()}
    <button class="round" data-act="tips" aria-label="Tips and why">${icon.tips}</button>
  </header>`;

function scenePic(sc) {
  const svg = render(sc.sprite, { label: sc.caption || 'Picture' });
  const cap = sc.caption ? `<figcaption>${w(sc.caption)}</figcaption>` : '';
  if (sc.flash) return `<figure class="fig flash" data-secs="${sc.flash}"><div class="flash-pic">${svg}</div><button class="btn primary" data-act="flash">Show for ${sc.flash} seconds</button>${cap}</figure>`;
  return `<figure class="fig">${svg}${cap}</figure>`;
}

function setupScreen() {
  const { a, inst, level } = flow;
  const ls = levelsOf(a);
  const pics = inst.scenes.filter((s) => !s.flash);
  return `${playTop()}
  <section class="page stage">
    <p class="kicker">Set up</p>
    ${pics.map(scenePic).join('')}
    <ul class="setup">${inst.setup.map((t) => `<li>${w(t)}</li>`).join('')}</ul>
    <div class="preview">
      <p class="kicker">${flow.qs.length > 1 ? 'The questions' : 'The question'}</p>
      <ol>${flow.qs.map((q) => `<li>${w(q.ask)}</li>`).join('')}</ol>
    </div>
    <div class="controls">
      <div class="seg" role="group" aria-label="Step">${[1, 2, 3].map((l) => `<button data-act="level" data-v="${l}" aria-pressed="${l === level}" ${ls.includes(l) ? '' : 'disabled'}>Step ${l}</button>`).join('')}</div>
      <button class="btn slim" data-act="shuffle">${icon.dice} Change it</button>
    </div>
  </section>
  <footer class="bar"><button class="btn primary big" data-act="ready">Ready</button></footer>`;
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
    ${q.note ? `<p class="note"><b>You</b> ${w(q.note)}</p>` : ''}
    <p class="say">${w(q.ask)}</p>
    ${scenes.map(scenePic).join('')}
    ${answerArea(q.answer)}
    <p class="feedback" id="feedback" aria-live="polite"></p>
    <div class="reveal" id="reveal" hidden>${q.reveal ? `<p>${w(q.reveal.caption)}</p>${q.reveal.sprite ? `<figure class="fig">${render(q.reveal.sprite, { label: 'Answer picture' })}</figure>` : ''}` : ''}</div>
    <div class="mascot" id="mascot">${mascot(store.child())}</div>
  </section>
  <footer class="bar" id="bar">${hands ? `<button class="btn" data-act="skip">Skip</button><button class="btn primary big" data-act="did-it">Did it!</button>` : `${q.answer.multi ? '<button class="btn primary big" data-act="check">Check</button>' : ''}<button class="btn quiet" data-act="show">Show the answer</button>`}</footer>`;
}

// What the bottom bar offers once a question is finished.
function nextBar() {
  const more = flow.qi < flow.qs.length - 1;
  const enough = flow.stars >= starsToFinish();
  const next = more ? 'Next question' : 'New set-up';
  return enough
    ? `<button class="btn" data-act="next">${more ? 'One more' : 'New set-up'}</button><button class="btn primary big" data-act="finish">Finish</button>`
    : `<button class="btn" data-act="finish">Finish</button><button class="btn primary big" data-act="next">${next}</button>`;
}

function doneScreen() {
  const c = store.child();
  return `<section class="page done">
    <div class="done-mascot" id="mascot">${mascot(c)}</div>
    ${starRow()}
    <p class="say">${flow.stars ? `${flow.stars} ${flow.stars === 1 ? 'star' : 'stars'} for ${esc(c.name)}!` : 'All done.'}</p>
    <div id="rate">
      <p class="kicker">Grown-up: how did it go?</p>
      <div class="rate-btns">${store.RATINGS.map((r) => `<button class="btn r-${r.id}" data-act="rate" data-v="${r.id}">${r.label}</button>`).join('')}</div>
    </div>
    <div id="after" hidden></div>
  </section>`;
}

const play = () => ({ setup: setupScreen, ask: askScreen, done: doneScreen }[flow.stage]());

function tipsSheet() {
  const { a, inst } = flow;
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
  flow.asked++;
  const r = document.getElementById('reveal');
  if (r && r.innerHTML.trim()) r.hidden = false;
  if (gotIt) {
    flow.stars++;
    setFeedback(true, YES[Math.floor(Math.random() * YES.length)]);
    document.querySelector('.play-top .stars').outerHTML = starRow();
    celebrate(store.settings().sound);
  }
  document.getElementById('bar').innerHTML = nextBar();
  document.querySelectorAll('.answers button').forEach((b) => (b.disabled = true));
  document.getElementById('bar').scrollIntoView({ block: 'nearest' });
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
    <p class="lede">Each skill has its own step. Two "too easy" in a row moves it up, two "too tricky" moves it down, or set it here.</p>
    <div class="prog">${STRANDS.map((s) => {
      const sum = store.strandSummary(s.id);
      return `<section class="prog-row" style="--c:${s.colour}">
        <header><h2>${esc(s.name)}</h2><span>${sum.tried} of ${sum.total} tried</span></header>
        <div class="dots">${forSkill(s.id).map((a) => `<a href="#/play/${a.id}" class="dot big r-${store.actState(a.id).last?.rating || 'none'}" title="${esc(a.title)}"><span class="sr">${esc(a.title)}</span></a>`).join('')}</div>
        <div class="seg" role="group" aria-label="${esc(s.name)} step">${[1, 2, 3].map((l) => `<button data-act="strand-level" data-id="${s.id}" data-v="${l}" aria-pressed="${l === sum.level}">Step ${l}</button>`).join('')}</div>
      </section>`;
    }).join('')}</div>
    <p class="key"><span class="dot r-none"></span>Not tried <span class="dot r-right"></span>Just right <span class="dot r-easy"></span>Too easy <span class="dot r-hard"></span>Too tricky <span class="dot r-skip"></span>Not today</p>
    <h2>Lately</h2>
    ${c.log.length ? `<ul class="log">${c.log.slice(0, 15).map((e) => (byId[e.id] ? `<li><a href="#/play/${e.id}">${esc(byId[e.id].title)}</a><span>${fmt(e.t)}, step ${e.level}${e.stars ? `, ${e.stars} ${e.stars === 1 ? 'star' : 'stars'}` : ''}</span><span class="badge r-${e.rating}">${RATING_WORD[e.rating]}</span></li>` : '')).join('')}</ul>` : '<p class="empty">Nothing yet. Play one and say how it went.</p>'}
  </section>`;
}

// ---------------------------------------------------------------- who is playing
let pickedMascot = null;
let pickedPronoun = 'he';
const PRONOUNS = [['he', 'He'], ['she', 'She'], ['they', 'They']];
const pronounSeg = (act, current) => `<div class="seg" role="group" aria-label="Wording">${PRONOUNS.map(([v, label]) => `<button type="button" data-act="${act}" data-v="${v}" aria-pressed="${v === current}">${label}</button>`).join('')}</div>`;
let confirmRemove = null;
function who() {
  const kids = store.children();
  const cur = store.child();
  const firstRun = !kids.length;
  const used = kids.map((k) => k.animal);
  if (!pickedMascot || !MASCOTS.includes(pickedMascot)) pickedMascot = MASCOTS.find((m) => !used.includes(m)) || MASCOTS[0];
  return `${firstRun ? '<header class="top"><h1>Toybox Maths</h1></header>' : `<header class="top"><a class="round" href="#/" aria-label="Back">${icon.back}</a><h1>Who is playing?</h1></header>`}
  <section class="page">
    ${firstRun ? '<p class="say">Who is playing?</p><p class="lede">Add each child once. Their progress and stars are kept separately, on this phone only.</p>' : ''}
    ${kids.length ? `<ul class="kids">${kids
      .map((k) =>
        confirmRemove === k.id
          ? `<li class="kid confirm"><p>Remove ${esc(k.name)} and all their progress?</p><div class="row"><button class="btn" data-act="remove-no">Keep</button><button class="btn r-hard" data-act="remove-yes" data-id="${k.id}">Remove</button></div></li>`
          : `<li class="kid${k.id === cur.id ? ' current' : ''}"><button class="kid-main" data-act="switch" data-id="${k.id}"><span class="avatar big">${mascot(k)}</span><span class="kid-name">${esc(k.name)}</span><span class="kid-stars">${icon.star(true)} ${k.stars}</span></button><button class="btn quiet slim" data-act="remove-ask" data-id="${k.id}">Remove</button></li>`
      )
      .join('')}</ul>` : ''}
    <form class="add" data-form="add-child">
      <h2>${firstRun ? 'First child' : 'Add a child'}</h2>
      <label class="field"><span>Name</span><input name="name" maxlength="14" autocomplete="off" autocapitalize="words" placeholder="Name or nickname" /></label>
      <p class="field-label">Their animal</p>
      <div class="mascots">${MASCOTS.map((m) => `<button type="button" class="mascot-pick" data-act="mascot" data-v="${m}" aria-pressed="${m === pickedMascot}" aria-label="${m}">${pic(D.animal(m))}</button>`).join('')}</div>
      <p class="field-label">The questions should say</p>
      ${pronounSeg('new-pronoun', pickedPronoun)}
      <button class="btn primary big" type="submit">${firstRun ? 'Start' : 'Add'}</button>
    </form>
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
    <div class="setting"><h2>Animation</h2>${onOff('motion', s.motion)}<p>Stars flying and the animal jumping.</p></div>
    <div class="setting"><h2>Stars to finish a turn</h2>
      <div class="seg" role="group" aria-label="Stars to finish">${[2, 3, 5].map((n) => `<button data-act="set" data-key="stars" data-v="${n}" aria-pressed="${s.stars === n}">${n}</button>`).join('')}</div>
    </div>
    <div class="setting"><h2>Questions about ${esc(c.name)} say</h2>${pronounSeg('pronoun', c.pronoun || 'he')}<p>Each child has their own. Change child from the name at the top.</p></div>
    <div class="setting"><h2>Our toys</h2><p>Untick anything you do not have. Its activities are hidden.</p>
      <div class="own">${TOYS.map((t) => `<button class="chip" data-act="own" data-v="${t.id}" aria-pressed="${s.toys.includes(t.id)}">${esc(t.name)}</button>`).join('')}</div>
    </div>
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
  return `${topBar('Guide')}
  <section class="page guide">
    <h2>How it works</h2>
    <ol class="steps">
      <li>Pick a toy, then an activity. Or tap Just pick one.</li>
      <li>Set up from the picture and tap Ready.</li>
      <li>Read the question out. He answers with the toys or by tapping.</li>
      <li>Keep going for three stars, then say how it went.</li>
    </ol>
    <p>The round "i" button on any activity has what to watch for, easier and harder versions, and the research behind it.</p>

    <h2>Keeping it play</h2>
    <ul class="plain">
      <li><strong>You set the goal, he leads the doing.</strong> That is guided play, the approach the evidence favours over simply telling children things.</li>
      <li><strong>Free play still matters.</strong> The research does not show free play is worse in general. These activities are an extra.</li>
      <li><strong>Stop when he has had enough.</strong> There is no research-backed number of minutes for this age. Finish early whenever you like.</li>
      <li><strong>Talk.</strong> Much of the benefit in these studies came through the words adults used.</li>
      <li><strong>Praise the doing.</strong> "You checked every one" rather than "clever boy".</li>
      <li><strong>Stars are a thank-you, not the point.</strong> They mark the end of a turn. The learning is in the toys and the talk.</li>
    </ul>

    <h2>Steps</h2>
    <p>Every skill starts at step 1, the smallest numbers and simplest set-ups. Mark an activity "Too easy" twice and that skill moves up. Each child has their own steps.</p>

    <h2>The kits you already have</h2>
    <ul class="plain">
      <li><strong>Numicon First Steps.</strong> Work through its own activity book in order. The Numicon activities here are extras.</li>
      <li><strong>The rabbit game.</strong> Its own challenge cards are the main event.</li>
      <li><strong>Small parts.</strong> Pegs and linking cubes are labelled 3+. Stay with him while they are out.</li>
    </ul>

    <h2>What the research does and does not say</h2>
    <ul class="plain">${NOT_CLAIMED.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>

    <h2>On your phone</h2>
    <p>To install, open this page in your phone's browser, open the share or menu button, and choose Add to Home Screen. It then works without a connection. Names and progress stay on this phone and are never sent anywhere.</p>

    <h2>Sources</h2>
    <ul class="refs all">${Object.keys(REFS).map(refItem).join('')}</ul>
  </section>`;
}

// ---------------------------------------------------------------- routing
function parts() {
  return location.hash.replace(/^#\/?/, '').split('/');
}
function screen() {
  const [page, a, b] = parts();
  if (!store.child()) return { html: who(), tab: '', playing: true };
  if (page === 'play') {
    const html = startActivity(a, b);
    if (html) return { html, tab: '', playing: true };
  }
  if (page === 'toy' || page === 'skill') {
    const html = list(page, a);
    if (html) return { html, tab: 'home' };
  }
  if (page === 'progress') return { html: progress(), tab: 'progress' };
  if (page === 'guide') return { html: guide(), tab: 'guide' };
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
    const ids = shownIds();
    const a = store.pick(ACTIVITIES.filter((x) => ids.includes(x.id)));
    const toy = parts()[0] === 'toy' ? parts()[1] : '';
    return a && go(`#/play/${a.id}${toy && toy !== 'none' ? '/' + toy : ''}`);
  }
  if (act === 'strand-level') {
    store.setStrandLevel(el.dataset.id, Number(v));
    return draw(true);
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
  if (act === 'remove-ask' || act === 'remove-no') {
    confirmRemove = act === 'remove-ask' ? el.dataset.id : null;
    return draw(true);
  }
  if (act === 'remove-yes') {
    store.removeChild(el.dataset.id);
    confirmRemove = null;
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
    store.set(key, key === 'stars' ? Number(v) : key === 'theme' ? v : v === '1');
    applySettings();
    return draw(true);
  }
  if (act === 'own') {
    const toys = new Set(owned());
    toys.has(v) ? toys.delete(v) : toys.add(v);
    store.set('toys', TOYS.map((t) => t.id).filter((id) => toys.has(id)));
    return draw(true);
  }
  if (act === 'close-sheet') return document.getElementById('sheet').replaceChildren();
  if (!flow) return;

  // ----- inside an activity
  if (act === 'tips') {
    document.getElementById('sheet').innerHTML = tipsSheet();
    return;
  }
  if (act === 'level' || act === 'shuffle') {
    if (act === 'level') flow.level = Number(v);
    flow.seed = newSeed();
    deal();
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
    if (flow.qi < flow.qs.length - 1) {
      flow.qi++;
      resetQuestion();
    } else {
      flow.seed = newSeed();
      deal(); // back to a new set-up; stars carry on
    }
    return draw(false);
  }
  if (act === 'finish') {
    flow.stage = 'done';
    draw(false);
    if (flow.stars) finale(store.settings().sound);
    return;
  }
  if (act === 'rate') {
    if (flow.rated) return;
    flow.rated = v;
    const moved = store.rate(flow.a.id, v, flow.level, flow.stars);
    document.querySelectorAll('.rate-btns button').forEach((b) => {
      b.disabled = true;
      if (b === el) b.classList.add('chosen');
    });
    const box = document.getElementById('after');
    box.hidden = false;
    box.innerHTML = `${moved ? `<p class="moved">${esc(moved)}.</p>` : ''}<div class="row"><button class="btn" data-act="again">Same again</button><button class="btn" data-act="surprise">${icon.dice} Another</button><a class="btn primary" href="${from}">Done</a></div>`;
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
document.addEventListener('submit', (e) => {
  if (e.target.dataset.form !== 'add-child') return;
  e.preventDefault();
  const typed = new FormData(e.target).get('name').trim();
  const name = typed || pickedMascot[0].toUpperCase() + pickedMascot.slice(1); // no name typed: call them by their animal
  store.addChild(name, pickedMascot, pickedPronoun);
  pickedMascot = null;
  pickedPronoun = 'he';
  go('#/');
});

applySettings();
draw(false);

// Works offline once installed.
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(() => {});
