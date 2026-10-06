// app.js — the screens. Plain JavaScript, no framework, no build step.
//
// Screens are functions that return HTML text. route() picks one from the address
// (#/, #/browse, #/a/<activity id>, #/progress, #/guide) and puts it on the page.
// All taps are handled in one place at the bottom (the "click" listener).

import { ACTIVITIES, STRANDS, TOYS, byId, levelsOf } from './activities/index.js';
import { REFS, NOT_CLAIMED } from './research.js';
import { makeRng, newSeed } from './rng.js';
import { render, numeral } from './draw.js';
import * as store from './store.js';

const view = document.getElementById('view');
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const strandOf = (a) => STRANDS.find((s) => s.id === a.strand);
const toyName = (id) => TOYS.find((t) => t.id === id).name;
// Brand names keep their capital letter; "cars", "animals" and so on do not.
const toyWord = (id) => (['duplo', 'brio', 'numicon'].includes(id) ? toyName(id) : toyName(id).toLowerCase());
const needs = (a) => {
  const t = a.toys.map(toyWord);
  if (!t.length) return 'no toys needed';
  return t.length > 2 ? 'any of: ' + t.join(', ') : t.join(' or ');
};
const cap = (s) => s[0].toUpperCase() + s.slice(1);

// ---------------------------------------------------------------- small pieces
const TIPS = [
  'Stop while it is still fun. Two good minutes beat ten reluctant ones.',
  'Say the total, then count: "Three cars. One, two, three."',
  'Wait a little longer than feels natural before helping.',
  'Praise what he did, not what he is: "You checked every one!"',
  'A wrong answer is a chance to ask "how did you work that out?"',
  'Let him set one up for you, and get it wrong sometimes so he can catch you.',
  'The toys are the lesson. The phone is only your crib sheet.',
  'Use the position words out loud as he builds: on top, under, next to, between.',
];

const toyChips = () =>
  `<div class="chips" role="group" aria-label="Toys out today">${TOYS.map(
    (t) => `<button class="chip" data-act="toy" data-id="${t.id}" aria-pressed="${store.get().toys.includes(t.id)}">${esc(t.name)}</button>`
  ).join('')}</div>`;

const RATING_WORD = { easy: 'Too easy', right: 'Just right', hard: 'Too tricky', skip: 'Not today' };

function actCard(a) {
  const s = strandOf(a);
  const last = store.actState(a.id).last;
  return `<a class="card" href="#/a/${a.id}" style="--c:${s.colour}">
    <span class="card-strand">${esc(s.name)}</span>
    <span class="card-title">${esc(a.title)}</span>
    <span class="card-meta">${a.minutes} min, ${esc(needs(a))}</span>
    ${last ? `<span class="badge r-${last.rating}">${RATING_WORD[last.rating]}</span>` : '<span class="badge r-new">New</span>'}
  </a>`;
}

// ---------------------------------------------------------------- Today
function today() {
  const three = store.todaysThree();
  const tip = TIPS[Math.floor(Date.now() / 86400000) % TIPS.length];
  return `<section class="page">
    <h1>What shall we play?</h1>
    <p class="lede">Tick the toys that are out, then pick one. Each takes a few minutes.</p>
    ${toyChips()}
    <h2>Three for today</h2>
    ${three.length ? `<div class="cards">${three.map(actCard).join('')}</div>` : '<p class="empty">Nothing matches the toys ticked above. Tick a few more.</p>'}
    <div class="row">
      <button class="btn" data-act="reroll">Pick three different ones</button>
      <button class="btn primary" data-act="surprise">${dice()} Surprise me</button>
    </div>
    <aside class="tip"><strong>Today's reminder</strong><p>${esc(tip)}</p></aside>
  </section>`;
}

const dice = () =>
  `<svg class="ico" viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>`;

// ---------------------------------------------------------------- Browse
function browse() {
  return `<section class="page">
    <h1>All activities</h1>
    <p class="lede">${ACTIVITIES.length} activities in ${STRANDS.length} strands. Greyed ones need a toy that is not ticked.</p>
    ${toyChips()}
    <nav class="jump" aria-label="Jump to a strand">${STRANDS.map((s) => `<a href="#/browse/${s.id}" data-act="jump" data-id="${s.id}" style="--c:${s.colour}">${esc(s.name)}</a>`).join('')}</nav>
    ${STRANDS.map((s) => {
      const acts = ACTIVITIES.filter((a) => a.strand === s.id);
      const lvl = store.strandState(s.id).level;
      return `<section class="strand" id="strand-${s.id}" style="--c:${s.colour}">
        <header><h2>${esc(s.name)}</h2><span class="step">Step ${lvl}</span></header>
        <p class="blurb">${esc(s.blurb)}</p>
        <ul class="list">${acts
          .map((a) => {
            const last = store.actState(a.id).last;
            const ls = levelsOf(a);
            return `<li class="${store.available(a) ? '' : 'off'}"><a href="#/a/${a.id}">
              <span class="li-title">${esc(a.title)}</span>
              <span class="li-meta">${a.minutes} min, ${esc(needs(a))}${ls.length < 3 ? `, steps ${ls.join(' and ')} only` : ''}</span>
              ${last ? `<span class="dot r-${last.rating}" title="${RATING_WORD[last.rating]}"></span>` : ''}
            </a></li>`;
          })
          .join('')}</ul>
      </section>`;
    }).join('')}
  </section>`;
}

// ---------------------------------------------------------------- Activity
let cur = null; // { a, seed, level, inst, wrong, picked:Set, done }

function openActivity(id, keep) {
  const a = byId[id];
  if (!a) return null;
  if (!keep || !cur || cur.a !== a) cur = { a, seed: newSeed(), level: store.levelFor(a) };
  cur.inst = a.make(makeRng(cur.seed), cur.level, { toys: store.get().toys });
  cur.wrong = 0;
  cur.done = false;
  cur.picked = new Set();
  cur.rated = null;
  return activity();
}

function scenePic(sc) {
  const pic = render(sc.sprite, { label: sc.caption || 'Set-up picture' });
  const cap = sc.caption ? `<figcaption>${esc(sc.caption)}</figcaption>` : '';
  if (sc.flash)
    return `<figure class="fig flash" data-secs="${sc.flash}"><div class="flash-pic">${pic}</div><button class="btn primary" data-act="flash">Show for ${sc.flash} seconds</button>${cap}</figure>`;
  return `<figure class="fig">${pic}${cap}</figure>`;
}

function answerArea(ans) {
  if (ans.type === 'number')
    return `<div class="answers nums">${ans.choices.map((n) => `<button class="num" data-act="num" data-v="${n}" aria-label="${n}">${render(numeral(n, 54), { bare: true, pad: 8, zoom: 1 })}</button>`).join('')}</div>`;
  if (ans.type === 'pick')
    return `<div class="answers picks">${ans.options
      .map((o) => `<button class="pick ${o.sprite ? 'pic' : 'txt'}" data-act="pick" data-v="${esc(o.key)}">${o.sprite ? render(o.sprite, { bare: true, pad: 6, zoom: 1.6 }) : esc(o.label)}</button>`)
      .join('')}</div>`;
  if (ans.type === 'tap') return ans.multi ? `<p class="hint">Tap every one that fits, then check.</p><div class="answers"><button class="btn primary" data-act="check">Check</button></div>` : `<p class="hint">Tap the answer on the picture.</p>`;
  if (ans.type === 'spinner') return `<div class="spinner"><div class="spin-face" id="spin-face" aria-live="polite">?</div><button class="btn primary big" data-act="spin">Spin</button></div>`;
  return '';
}

function activity() {
  const { a, inst, level } = cur;
  const s = strandOf(a);
  const ls = levelsOf(a);
  const showLabel = inst.answer.type === 'do' ? 'Show what it should look like' : 'Show the answer';
  return `<article class="page act" style="--c:${s.colour}">
    <header class="brick">
      <a class="back" href="#/browse/${s.id}">${esc(s.name)}</a>
      <h1>${esc(a.title)}</h1>
      <p class="meta">${a.minutes} min. ${esc(cap(needs(a)))}.</p>
    </header>
    <div class="controls">
      <div class="seg" role="group" aria-label="Step">${[1, 2, 3].map((l) => `<button data-act="level" data-v="${l}" aria-pressed="${l === level}" ${ls.includes(l) ? '' : 'disabled'}>Step ${l}</button>`).join('')}</div>
      <button class="btn" data-act="shuffle">${dice()} Shuffle</button>
    </div>

    <section class="block">
      <h2>Set up</h2>
      <ul class="setup">${inst.setup.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      ${inst.scenes.map(scenePic).join('')}
    </section>

    <section class="block ask">
      <h2>Ask</h2>
      <p class="say">${esc(inst.ask)}</p>
      ${answerArea(inst.answer)}
      <p class="feedback" id="feedback" aria-live="polite"></p>
      ${inst.reveal ? `<button class="btn quiet" data-act="reveal" id="reveal-btn">${showLabel}</button>` : ''}
      <div class="reveal" id="reveal" hidden>${
        inst.reveal ? `<p>${esc(inst.reveal.caption)}</p>${inst.reveal.sprite ? `<figure class="fig">${render(inst.reveal.sprite, { label: 'Answer picture' })}</figure>` : ''}` : ''
      }</div>
    </section>

    <section class="block">
      <h2>Watch for</h2>
      <ul class="setup">${inst.look.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
      <dl class="adjust"><dt>Easier</dt><dd>${esc(inst.easier)}</dd><dt>Harder</dt><dd>${esc(inst.harder)}</dd></dl>
      <p class="words"><span>Words to use</span>${inst.words.map((w) => `<em>${esc(w)}</em>`).join('')}</p>
    </section>

    <details class="block why">
      <summary>Why this one</summary>
      <p>${esc(a.why)}</p>
      <ul class="refs">${a.research.map((id) => refItem(id)).join('')}</ul>
    </details>

    <section class="block rate" id="rate">
      <h2>How did it go?</h2>
      <div class="rate-btns">${store.RATINGS.map((r) => `<button class="btn r-${r.id}" data-act="rate" data-v="${r.id}">${r.label}</button>`).join('')}</div>
      <div id="after" hidden></div>
    </section>
  </article>`;
}

const refItem = (id) => {
  const r = REFS[id];
  return `<li><a href="${r.url}" target="_blank" rel="noopener">${esc(r.cite)}</a><span>${esc(r.found)}</span><span class="caveat">${esc(r.caveat)}</span></li>`;
};

const YES = ['Yes!', 'That is it!', 'You found it!', 'Spot on!'];
function setFeedback(ok, text) {
  const f = document.getElementById('feedback');
  f.className = 'feedback ' + (ok ? 'ok' : 'no');
  f.textContent = text;
}
function showReveal() {
  const r = document.getElementById('reveal');
  if (r && r.innerHTML.trim()) r.hidden = false;
  const b = document.getElementById('reveal-btn');
  if (b) b.hidden = true;
}
function correct() {
  cur.done = true;
  setFeedback(true, YES[Math.floor(Math.random() * YES.length)]);
  showReveal();
}
function wrong() {
  cur.wrong++;
  if (cur.inst.answer.multi) return setFeedback(false, 'Not quite. Check each one again: is anything missing, or tapped by mistake?');
  setFeedback(false, cur.wrong > 1 ? 'Not that one. Work it out together with the toys, or show the answer.' : 'Not that one. Have another look.');
}

// ---------------------------------------------------------------- Progress
function progress() {
  const st = store.get();
  const fmt = (t) => new Date(t).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' });
  return `<section class="page">
    <h1>Progress</h1>
    <p class="lede">Each strand has its own step. Two "too easy" in a row moves a strand up; two "too tricky" moves it down. You can also set it yourself.</p>
    <div class="prog">${STRANDS.map((s) => {
      const sum = store.strandSummary(s.id);
      const acts = ACTIVITIES.filter((a) => a.strand === s.id);
      return `<section class="prog-row" style="--c:${s.colour}">
        <header><h2>${esc(s.name)}</h2><span>${sum.tried} of ${sum.total} tried</span></header>
        <div class="dots">${acts.map((a) => `<a href="#/a/${a.id}" class="dot big r-${store.actState(a.id).last?.rating || 'none'}" title="${esc(a.title)}"><span class="sr">${esc(a.title)}</span></a>`).join('')}</div>
        <div class="seg" role="group" aria-label="${esc(s.name)} step">${[1, 2, 3].map((l) => `<button data-act="strand-level" data-id="${s.id}" data-v="${l}" aria-pressed="${l === sum.level}">Step ${l}</button>`).join('')}</div>
      </section>`;
    }).join('')}</div>
    <p class="key"><span class="dot r-none"></span>Not tried <span class="dot r-right"></span>Just right <span class="dot r-easy"></span>Too easy <span class="dot r-hard"></span>Too tricky <span class="dot r-skip"></span>Not today</p>
    <h2>Lately</h2>
    ${st.log.length ? `<ul class="log">${st.log.slice(0, 15).map((e) => (byId[e.id] ? `<li><a href="#/a/${e.id}">${esc(byId[e.id].title)}</a><span>${fmt(e.t)}, step ${e.level}</span><span class="badge r-${e.rating}">${RATING_WORD[e.rating]}</span></li>` : '')).join('')}</ul>` : '<p class="empty">Nothing yet. Play one and tell the app how it went.</p>'}
    <div class="danger" id="reset-box"><button class="btn quiet" data-act="reset-ask">Clear all progress</button></div>
  </section>`;
}

// ---------------------------------------------------------------- Guide
function guide() {
  const usedRefs = Object.keys(REFS);
  return `<section class="page guide">
    <h1>Guide</h1>

    <h2>How to use this</h2>
    <ol class="steps">
      <li>Tick the toys that are out and pick an activity, or tap Surprise me.</li>
      <li>Set up from the picture. Read out the question under Ask.</li>
      <li>He answers with the toys. Where there are big buttons or a picture to tap, he can tap those too.</li>
      <li>Tell the app how it went. That is what decides the next step.</li>
    </ol>
    <p>Shuffle gives the same activity with new numbers, colours and toys, so one activity can be played many times.</p>

    <h2>Keeping it play</h2>
    <ul class="plain">
      <li><strong>You set the goal, he leads the doing.</strong> That is the definition of guided play, the approach the evidence favours over simply telling children things.</li>
      <li><strong>Free play still matters.</strong> The research does not show free play is worse in general. Guided play beat it on spatial vocabulary; on most things no difference was found. These activities are an extra, not a replacement.</li>
      <li><strong>Keep it short and stop when he has had enough.</strong> There is no research-backed number of minutes for this age. A few minutes, following his interest, is sensible practice.</li>
      <li><strong>Talk.</strong> Much of the benefit in these studies came through the words adults used: number words about things the child can see, and position words while building.</li>
      <li><strong>Praise the doing.</strong> "You checked every one" rather than "clever boy". Early praise for effort was linked to children later believing ability can grow.</li>
    </ul>

    <h2>The steps</h2>
    <p>Every activity has up to three steps. Step 1 uses the smallest numbers and simplest set-ups. Everything starts at step 1, so the first few sessions may feel easy: mark them "Too easy" and the strand moves up. Strands move separately, because a child can be at step 3 for patterns and step 1 for taking away.</p>

    <h2>The kits you already have</h2>
    <ul class="plain">
      <li><strong>Numicon First Steps.</strong> Work through its own activity book in order. The Numicon activities here are extras.</li>
      <li><strong>The rabbit game.</strong> Its own challenge cards are the main event. Tick "Rabbit game" on the Today screen and the position-word activities will use the rabbit.</li>
      <li><strong>Small parts.</strong> Pegs and linking cubes are labelled 3+. Stay with him while they are out.</li>
    </ul>

    <h2>What the research does and does not say</h2>
    <ul class="plain">${NOT_CLAIMED.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>

    <h2>On your phone</h2>
    <p>To install: open this page in your phone's browser, open the share or menu button, and choose Add to Home Screen. It then works without a connection. Progress is stored on this phone only and is never sent anywhere.</p>

    <h2>Sources</h2>
    <p>Every activity lists the sources it rests on under "Why this one". Here is the full list, with what each found and what it does not show.</p>
    <ul class="refs all">${usedRefs.map(refItem).join('')}</ul>
  </section>`;
}

// ---------------------------------------------------------------- routing
function route() {
  const parts = location.hash.replace(/^#\/?/, '').split('/');
  const [page, arg] = parts;
  let html;
  let tab = page || 'today';
  if (page === 'a') {
    html = openActivity(arg, false);
    tab = 'browse';
  } else if (page === 'browse') html = browse();
  else if (page === 'progress') html = progress();
  else if (page === 'guide') html = guide();
  if (!html) {
    html = today();
    tab = 'today';
  }
  view.innerHTML = html;
  document.querySelectorAll('.tabs a').forEach((el) => el.setAttribute('aria-current', el.dataset.tab === tab ? 'page' : 'false'));
  if (page === 'browse' && arg) document.getElementById('strand-' + arg)?.scrollIntoView();
  else window.scrollTo(0, 0);
  const a = page === 'a' && byId[arg];
  document.title = a ? `${a.title} – Toybox Maths` : 'Toybox Maths';
}
// Re-draw the current screen in place (after a toy chip or step button changes something).
const SCREENS = { today, browse, progress, guide, a: activity };
const redraw = () => {
  const y = window.scrollY;
  const page = location.hash.replace(/^#\/?/, '').split('/')[0] || 'today';
  view.innerHTML = (SCREENS[page] || today)();
  window.scrollTo(0, y);
};
window.addEventListener('hashchange', route);

// ---------------------------------------------------------------- taps
function onTap(el, e) {
  const act = el.dataset.act;
  const v = el.dataset.v;

  if (act === 'toy') {
    const toys = new Set(store.get().toys);
    toys.has(el.dataset.id) ? toys.delete(el.dataset.id) : toys.add(el.dataset.id);
    store.setToys([...toys]);
    return redraw();
  }
  if (act === 'reroll') {
    store.bumpSalt();
    return redraw();
  }
  if (act === 'surprise') {
    const a = store.surprise(cur?.a?.id);
    if (a) location.hash = '#/a/' + a.id;
    return;
  }
  if (act === 'jump') {
    e.preventDefault();
    return document.getElementById('strand-' + el.dataset.id)?.scrollIntoView({ behavior: 'smooth' });
  }
  if (act === 'strand-level') {
    store.setStrandLevel(el.dataset.id, Number(v));
    return redraw();
  }
  if (act === 'reset-ask') {
    document.getElementById('reset-box').innerHTML = `<p>Clear every rating and put all strands back to step 1?</p><div class="row"><button class="btn" data-act="reset-no">Keep it</button><button class="btn r-hard" data-act="reset-yes">Clear it all</button></div>`;
    return;
  }
  if (act === 'reset-no') return redraw();
  if (act === 'reset-yes') {
    store.reset();
    return redraw();
  }
  if (!cur) return;

  // ----- inside an activity
  if (act === 'level') {
    cur.level = Number(v);
    cur.seed = newSeed();
    view.innerHTML = openActivity(cur.a.id, true);
    return;
  }
  if (act === 'shuffle' || act === 'again') {
    cur.seed = newSeed();
    if (act === 'again') cur.level = store.levelFor(cur.a);
    view.innerHTML = openActivity(cur.a.id, true);
    return window.scrollTo(0, 0);
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
  if (act === 'reveal') return showReveal();
  if (act === 'spin') {
    const face = document.getElementById('spin-face');
    const vals = cur.inst.answer.values;
    const n = vals[Math.floor(Math.random() * vals.length)];
    face.classList.remove('landed');
    void face.offsetWidth; // restart the little animation
    face.innerHTML = render(numeral(n, 70), { bare: true, pad: 8, zoom: 1 });
    face.classList.add('landed');
    face.setAttribute('aria-label', 'You spun ' + n);
    return;
  }
  if (act === 'num' || act === 'pick') {
    const ans = cur.inst.answer;
    const ok = act === 'num' ? Number(v) === ans.value : v === ans.correct;
    el.classList.add(ok ? 'right' : 'wrong');
    if (!ok) el.disabled = true;
    return ok ? correct() : wrong();
  }
  if (act === 'check') {
    const want = new Set(cur.inst.answer.correct);
    const ok = want.size === cur.picked.size && [...want].every((k) => cur.picked.has(k));
    if (ok) {
      document.querySelectorAll('.hit.sel').forEach((h) => h.classList.replace('sel', 'right'));
      return correct();
    }
    return wrong();
  }
  if (act === 'rate') {
    if (cur.rated) return;
    cur.rated = v;
    const moved = store.rate(cur.a.id, v, cur.level);
    document.querySelectorAll('.rate-btns button').forEach((b) => {
      b.disabled = true;
      if (b === el) b.classList.add('chosen');
    });
    const box = document.getElementById('after');
    box.hidden = false;
    box.innerHTML = `${moved ? `<p class="moved">${esc(moved)}.</p>` : ''}<div class="row"><button class="btn" data-act="again">Same again, new numbers</button><button class="btn primary" data-act="surprise">${dice()} Something different</button></div>`;
    box.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
}

// A tap on part of a picture (activities where the answer is "tap the right one").
function onHit(g) {
  if (!cur || cur.inst.answer.type !== 'tap' || cur.done) return;
  const ans = cur.inst.answer;
  const key = g.dataset.key;
  if (ans.multi) {
    g.classList.toggle('sel');
    cur.picked.has(key) ? cur.picked.delete(key) : cur.picked.add(key);
    return;
  }
  if (ans.correct.includes(key)) {
    g.classList.add('right');
    correct();
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

route();

// Works offline once installed.
if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('./sw.js').catch(() => {});
