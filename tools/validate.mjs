// tools/validate.mjs — run with:  node tools/validate.mjs
//
// Generates every activity at every difficulty with many random seeds and checks the
// result is well formed: text filled in, pictures valid, answers consistent.
// Also checks the service worker's file list matches the files in the repo.
// Run this before every commit. It must end with "All good".

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ACTIVITIES, STRANDS, TOYS, levelsOf } from '../js/activities/index.js';
import { REFS } from '../js/research.js';
import { makeRng } from '../js/rng.js';
import { render } from '../js/draw.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const SEEDS = Number(process.argv[2]) || 300;
const errors = [];
const err = (where, msg) => errors.push(`${where}: ${msg}`);

const strandIds = new Set(STRANDS.map((s) => s.id));
const toyIds = new Set(TOYS.map((t) => t.id));
const ANSWER_TYPES = ['number', 'pick', 'tap', 'do', 'open', 'spinner'];
const isSprite = (s) => s && typeof s.svg === 'string' && s.w > 0 && s.h > 0 && Number.isFinite(s.w) && Number.isFinite(s.h);
const badText = (t) => typeof t !== 'string' || !t.trim() || /undefined|NaN|\[object|null/.test(t);
const hitKeys = (svg) => [...svg.matchAll(/data-key="([^"]*)"/g)].map((m) => m[1]);

// A few different "toys we have out" situations.
const TOY_SETS = [TOYS.map((t) => t.id), ['duplo'], ['cars', 'animals'], ['cubes', 'numicon', 'bunny'], ['brio', 'wooden'], []];

const ids = new Set();
let generated = 0;
const widest = { w: 0, where: '' };

for (const a of ACTIVITIES) {
  const W = a.id || '(no id)';
  if (!a.id || !/^[a-z0-9-]+$/.test(a.id)) err(W, 'id must be lower-case words joined with dashes');
  if (ids.has(a.id)) err(W, 'duplicate id');
  ids.add(a.id);
  if (badText(a.title)) err(W, 'missing title');
  if (!strandIds.has(a.strand)) err(W, `unknown strand "${a.strand}"`);
  if (!Array.isArray(a.toys)) err(W, 'toys must be a list ([] means no toys needed)');
  else for (const t of a.toys) if (!toyIds.has(t)) err(W, `unknown toy "${t}"`);
  if (!(a.minutes >= 1 && a.minutes <= 10)) err(W, 'minutes should be between 1 and 10');
  if (badText(a.why)) err(W, 'missing "why"');
  if (badText(a.skill)) err(W, 'missing "skill" (the sub-skill inside its strand)');
  if (!Array.isArray(a.needs) || a.needs.some(badText)) err(W, '"needs" must be a list of extra things to fetch ([] if none)');
  if (!Array.isArray(a.research) || !a.research.length) err(W, 'needs at least one research source');
  else for (const r of a.research) if (!REFS[r]) err(W, `research id "${r}" is not in js/research.js`);
  for (const l of levelsOf(a)) if (![1, 2, 3].includes(l)) err(W, `bad level ${l}`);

  for (const level of levelsOf(a)) {
    for (let seed = 1; seed <= SEEDS; seed++) {
      const where = `${a.id} step ${level} seed ${seed}`;
      let inst;
      try {
        inst = a.make(makeRng(seed * 7919 + level), level, { toys: TOY_SETS[seed % TOY_SETS.length] });
      } catch (e) {
        err(where, 'crashed: ' + e.message);
        break;
      }
      generated++;
      if (!Array.isArray(inst.setup) || !inst.setup.length || inst.setup.some(badText)) err(where, 'setup must be a list of sentences');
      if (inst.setup && inst.setup.length > 3) err(where, 'keep setup to 3 short lines; the adult is in a hurry');
      if (!Array.isArray(inst.look) || !inst.look.length || inst.look.some(badText)) err(where, '"look" must be a list of sentences');
      if (badText(inst.easier) || badText(inst.harder)) err(where, 'needs "easier" and "harder"');
      if (!Array.isArray(inst.words) || !inst.words.length) err(where, 'needs "words" to use');
      if (!Array.isArray(inst.scenes)) err(where, 'scenes must be a list (can be empty)');
      if (inst.more !== undefined && !Array.isArray(inst.more)) err(where, '"more" must be a list of follow-up questions');
      // The first question is the activity itself; follow-ups are in "more". Each may bring its own pictures.
      const questions = [inst, ...(inst.more || [])];
      questions.forEach((q, qi) => {
        const at = qi ? `${where} follow-up ${qi}` : where;
        checkQuestion(q, q.scenes || inst.scenes || [], at);
      });
    }
  }
}

function checkQuestion(q, scenes, where) {
  if (badText(q.ask)) err(where, `bad "ask": ${q.ask}`);
  if (q.note !== undefined && badText(q.note)) err(where, 'bad note');
  let keys = [];
  for (const sc of scenes) {
    if (!isSprite(sc.sprite)) {
      err(where, 'a scene has no valid picture');
      continue;
    }
    if (sc.caption !== undefined && badText(sc.caption)) err(where, 'bad scene caption');
    const svg = render(sc.sprite);
    if (/NaN|undefined|Infinity/.test(svg)) err(where, 'picture contains NaN/undefined');
    keys = keys.concat(hitKeys(svg));
    if (sc.sprite.w > widest.w) Object.assign(widest, { w: sc.sprite.w, where });
    if (sc.sprite.w > 700) err(where, `picture is ${Math.round(sc.sprite.w)} wide; keep under 700 or it gets tiny on a phone`);
  }
  if (q.reveal) {
    if (badText(q.reveal.caption)) err(where, 'bad reveal caption');
    if (q.reveal.sprite) {
      if (!isSprite(q.reveal.sprite)) err(where, 'reveal picture invalid');
      else if (/NaN|undefined|Infinity/.test(render(q.reveal.sprite))) err(where, 'reveal picture contains NaN/undefined');
    }
  }
  const ans = q.answer;
  if (!ans || !ANSWER_TYPES.includes(ans.type)) return err(where, 'bad answer type');
  if (ans.type === 'number') {
    if (!Number.isInteger(ans.value) || ans.value < 0 || ans.value > 20) err(where, `number answer ${ans.value} out of range`);
    if (!Array.isArray(ans.choices) || ans.choices.length < 2) err(where, 'number answer needs choices');
    else {
      if (!ans.choices.includes(ans.value)) err(where, `choices ${ans.choices} do not include the answer ${ans.value}`);
      if (new Set(ans.choices).size !== ans.choices.length) err(where, 'duplicate choices');
      if (ans.choices.some((c) => !Number.isInteger(c) || c < 0 || c > 20)) err(where, 'choice out of range');
    }
  }
  if (ans.type === 'pick') {
    const ks = (ans.options || []).map((o) => o.key);
    if (ks.length < 2) err(where, 'pick needs at least two options');
    if (new Set(ks).size !== ks.length) err(where, 'duplicate pick options');
    if (!ks.includes(ans.correct)) err(where, `correct option "${ans.correct}" is not one of ${ks}`);
    for (const o of ans.options || []) if (!o.label && !isSprite(o.sprite)) err(where, 'pick option needs a label or picture');
  }
  if (ans.type === 'tap') {
    if (!Array.isArray(ans.correct) || !ans.correct.length) err(where, 'tap needs a correct list');
    if (new Set(keys).size !== keys.length) err(where, `tappable keys are not unique: ${keys}`);
    for (const c of ans.correct || []) if (!keys.includes(c)) err(where, `correct tap "${c}" is not on the picture (${keys})`);
    if (keys.length < 2) err(where, 'tap needs at least two things to tap');
    if (!ans.multi && ans.correct.length !== 1) err(where, 'single tap must have exactly one correct key');
  }
  if (ans.type === 'spinner' && (!Array.isArray(ans.values) || !ans.values.length)) err(where, 'spinner needs values');
}

// A strand should have 2 to 4 sub-skills, so the grouping means something.
for (const s of STRANDS) {
  const n = new Set(ACTIVITIES.filter((a) => a.strand === s.id).map((a) => a.skill)).size;
  if (n < 2 || n > 4) err(s.id, `has ${n} sub-skills; aim for 2 to 4`);
}

// Every strand should have something at every difficulty.
for (const s of STRANDS)
  for (const l of [1, 2, 3]) if (!ACTIVITIES.some((a) => a.strand === s.id && levelsOf(a).includes(l))) err(s.id, `no activity at step ${l}`);

// Service worker file list must match the repo.
const sw = fs.readFileSync(path.join(root, 'sw.js'), 'utf8');
const listed = new Set([...sw.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean));
const walk = (dir) => fs.readdirSync(path.join(root, dir), { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]));
const shipped = ['index.html', 'manifest.webmanifest', ...walk('js'), ...walk('css'), ...walk('icons'), ...walk('fonts')].filter((f) => !f.endsWith('.txt'));
for (const f of shipped) if (!listed.has(f)) err('sw.js', `"${f}" is not in the FILES list, so it will not work offline`);
for (const f of listed) if (!fs.existsSync(path.join(root, f))) err('sw.js', `lists "${f}" but that file does not exist`);

const perStrand = STRANDS.map((s) => `${s.name} ${ACTIVITIES.filter((a) => a.strand === s.id).length}`).join(', ');
console.log(`${ACTIVITIES.length} activities (${perStrand})`);
console.log(`${generated} variations generated. Widest picture: ${Math.round(widest.w)} (${widest.where})`);
if (errors.length) {
  const shown = [...new Set(errors)].slice(0, 40);
  console.log(`\n${errors.length} problems:\n` + shown.map((e) => '  - ' + e).join('\n'));
  process.exit(1);
}
console.log('All good');
