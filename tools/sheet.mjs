// tools/sheet.mjs — review sheets for the question bank.
//   node tools/sheet.mjs <out-folder> [activity-id ...]
// Writes one HTML page per activity showing two variations at each difficulty:
// the set-up, every question with its picture, the answer and the reveal.
// Open the pages in a browser to check the words, the pictures and the answers agree.

import fs from 'node:fs';
import path from 'node:path';
import { ACTIVITIES, levelsOf } from '../js/activities/index.js';
import { makeRng } from '../js/rng.js';
import { render } from '../js/draw.js';

const [out, ...only] = process.argv.slice(2);
if (!out) throw new Error('usage: node tools/sheet.mjs <out-folder> [activity-id ...]');
fs.mkdirSync(out, { recursive: true });
const NAMES = { 1: 'Easy', 2: 'Medium', 3: 'Hard' };
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));
const pic = (s) => `<div class="pic">${render(s)}</div>`;

function answer(a) {
  if (a.type === 'number') return `number: <b>${a.value}</b> from [${a.choices.join(', ')}]`;
  if (a.type === 'pick') return 'pick: ' + a.options.map((o) => `<span class="${o.key === a.correct ? 'ok' : ''}">${o.sprite ? `<span class="opt">${render(o.sprite)}</span>` : esc(o.label)}</span>`).join(' | ');
  if (a.type === 'tap') return `tap${a.multi ? ' (several)' : ''}: <b>${a.correct.join(', ')}</b>`;
  if (a.type === 'spinner') return `spinner: ${a.values.join(', ')}`;
  return a.type === 'do' ? 'he does it with the toys' : 'open: no single right answer';
}
function question(q, base, i) {
  const scenes = q.scenes || base;
  return `<div class="q"><p class="ask">Q${i + 1}. ${esc(q.ask)}</p>${q.note ? `<p class="note">Adult: ${esc(q.note)}</p>` : ''}
    ${scenes.map((s) => pic(s.sprite) + (s.caption ? `<p class="cap">${esc(s.caption)}</p>` : '') + (s.flash ? `<p class="cap">(shown for ${s.flash}s)</p>` : '')).join('')}
    <p class="ans">Answer: ${answer(q.answer)}</p>
    ${q.reveal ? `<p class="rev">Reveal: ${esc(q.reveal.caption)}</p>${q.reveal.sprite ? pic(q.reveal.sprite) : ''}` : ''}</div>`;
}

for (const a of ACTIVITIES) {
  if (only.length && !only.includes(a.id)) continue;
  const cols = levelsOf(a).flatMap((level) =>
    [11, 222].map((seed) => {
      const inst = a.make(makeRng(seed * 7919 + level), level, { toys: a.toys });
      return `<section><h2>${NAMES[level]} (seed ${seed})</h2><ul>${inst.setup.map((t) => `<li>${esc(t)}</li>`).join('')}</ul>
        ${[inst, ...(inst.more || [])].map((q, i) => question(q, inst.scenes, i)).join('')}
        <p class="tips">Easier: ${esc(inst.easier)}<br>Harder: ${esc(inst.harder)}</p></section>`;
    })
  );
  const html = `<!doctype html><meta charset="utf-8"><title>${esc(a.title)}</title><style>
    body{font:14px/1.35 system-ui,sans-serif;margin:12px;color:#222} h1{font-size:20px;margin:0 0 8px}
    .grid{display:grid;grid-template-columns:repeat(${cols.length},300px);gap:10px;align-items:start}
    section{border:1px solid #bbb;border-radius:8px;padding:8px} h2{font-size:15px;margin:0 0 4px} ul{margin:4px 0;padding-left:18px}
    .q{border-top:1px dashed #bbb;margin-top:6px;padding-top:6px} .ask{font-weight:700;font-size:15px;margin:0 0 4px} p{margin:3px 0}
    .pic svg{width:100%;height:auto;max-height:190px;background:#e9eef4;border-radius:6px} .opt svg{height:44px;width:auto;vertical-align:middle;background:#e9eef4}
    .ok{outline:3px solid #2e9e4b;font-weight:700} .ans{color:#1f5} .ans,.rev{color:#14351f} .note,.cap,.tips{color:#666;font-size:12px}
  </style><h1>${esc(a.title)} <small>(${a.id}; ${a.strand}${a.skill ? ' / ' + esc(a.skill) : ''}; toys: ${a.toys.join(', ') || 'none'})</small></h1><div class="grid">${cols.join('')}</div>`;
  fs.writeFileSync(path.join(out, a.id + '.html'), html);
}
