// chat.js — the optional chat helper: a small language model that runs on the phone and picks
// activities from a short list. Loaded only when "Chat helper" is switched on in Settings.
//
// THE RULE: the model never writes a word that is shown. It is given up to twelve activities that
// js/ask.js has already found, and it may only answer with which of them to put first and, if it
// wants, which one of three set questions to ask. Its answer is locked to that shape (a JSON schema),
// and anything else is thrown away. Every word the adult reads about an activity or its research is
// the activity's own text. Small models add claims of their own in a noticeable share of answers
// (see PLAN.md, "Search by sentence and the chat helper"), so do not let this one write prose.
//
// What comes from outside this repo, once, when it is switched on:
//   the model itself (Gemma 3 1B, about 600 MB)  from huggingface.co/mlc-ai
//   a small program built for that model         from raw.githubusercontent.com/mlc-ai
// The library that runs it (WebLLM) is in ai/webllm/. See ai/README.md.

export const CHAT_MODEL = 'gemma3-1b-it-q4f16_1-MLC';
export const FOLLOW_UPS = ['none', 'toys', 'time', 'skill'];
const MAX_PICKS = 4;

let lib = null;
let engine = null;
let loading = null;
const getLib = async () => (lib ||= await import(new URL('../ai/webllm/index.js', import.meta.url).href));

// Fetch the model (the first time) and start it. onProgress(fraction from 0 to 1).
export function loadChat(onProgress = () => {}) {
  if (engine) return Promise.resolve(engine);
  if (loading) return loading;
  loading = (async () => {
    const webllm = await getLib();
    if (!(await navigator.gpu.requestAdapter())) throw new Error('no graphics adapter');
    engine = await webllm.CreateMLCEngine(CHAT_MODEL, { initProgressCallback: (r) => onProgress(r.progress || 0) });
    return engine;
  })();
  loading.catch(() => {}).finally(() => (loading = null));
  return loading;
}
export const chatReady = () => !!engine;
// Switch it off and give the storage back.
export async function removeChat() {
  try {
    if (engine) await engine.unload();
  } catch {
    /* already gone */
  }
  engine = null;
  try {
    const webllm = await getLib();
    await webllm.deleteModelAllInfoInCache(CHAT_MODEL);
  } catch {
    /* nothing was saved */
  }
}

// ---------------------------------------------------------------- what the model is told, and what it may say
const ageWord = (n) => (n % 1 ? `${Math.floor(n)}½` : String(n));
// cands: [{ a, strand, toys: [names] }]. Each gets a short key (a1, a2 ...) so the model has little to write.
export function buildPrompt(asked, cands) {
  const lines = cands.map((c, i) => `a${i + 1} | ${c.a.title} | ${c.strand}: ${c.a.skill} | age ${ageWord(c.a.age)} to ${ageWord(c.a.upTo)} | ${c.a.minutes} min | ${c.toys.length ? c.toys.join(', ') : 'no toys'}`);
  return `You help a parent choose maths play activities for a young child.

The parent wrote: "${asked.replace(/"/g, "'").slice(0, 400)}"

Activities to choose from (key | title | skill | age | minutes | toys):
${lines.join('\n')}

Choose up to ${MAX_PICKS} of these that fit what the parent wrote, best first. Leave out anything the parent says the child did not like.
"ask" is one more thing worth asking the parent: "toys" (which toys are out), "time" (how long they have), "skill" (which skill), or "none".
Answer with JSON only, like {"picks":["a2","a5"],"ask":"none"}.`;
}
export function schemaFor(n) {
  return JSON.stringify({
    type: 'object',
    properties: {
      picks: { type: 'array', items: { type: 'string', enum: Array.from({ length: n }, (_, i) => `a${i + 1}`) }, minItems: 1, maxItems: MAX_PICKS },
      ask: { type: 'string', enum: FOLLOW_UPS },
    },
    required: ['picks', 'ask'],
  });
}
// Read the model's answer. Anything that is not one of the keys it was given is dropped.
export function readAnswer(text, cands) {
  let j;
  try {
    j = JSON.parse(text);
  } catch {
    return null;
  }
  const picks = [];
  for (const k of Array.isArray(j?.picks) ? j.picks : []) {
    const m = /^a(\d+)$/.exec(String(k));
    const c = m && cands[Number(m[1]) - 1];
    if (c && !picks.includes(c.a.id)) picks.push(c.a.id);
  }
  if (!picks.length) return null;
  return { picks: picks.slice(0, MAX_PICKS), ask: FOLLOW_UPS.includes(j.ask) && j.ask !== 'none' ? j.ask : null };
}

// Ask the model. Returns { picks: [activity ids], ask: 'toys' | 'time' | 'skill' | null }, or null if it gave nothing usable.
// `eng` can be passed in so tools/validate.mjs can test this with a stand-in.
export async function choose(asked, cands, eng = engine) {
  if (!eng || !cands.length) return null;
  await eng.resetChat();
  const reply = await eng.chat.completions.create({
    messages: [{ role: 'user', content: buildPrompt(asked, cands) }],
    temperature: 0,
    max_tokens: 60,
    response_format: { type: 'json_object', schema: schemaFor(cands.length) },
  });
  return readAnswer(reply?.choices?.[0]?.message?.content || '', cands);
}
