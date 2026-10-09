// meaning.js — turns a sentence into a list of 384 numbers, so that sentences which mean
// similar things get similar numbers. Search uses it to match "he loves animals" to activities
// that never use the word "loves".
//
// Everything it needs is in this repo, under ai/ (see ai/README.md):
//   ai/minilm/model.onnx   the model (all-MiniLM-L6-v2, about 23 MB)
//   ai/minilm/vocab.txt    its word list
//   ai/ort/                ONNX Runtime Web, the program that runs the model
// Nothing is fetched from another site. The same code runs on the phone and in tools/embed.mjs,
// so the numbers saved for the activities always agree with the numbers made for what is typed.

export const DIMS = 384;
const MAX_TOKENS = 128;

// ---- the tokenizer: BERT "uncased" WordPiece, written out so no library is needed
const isPunct = (c) => {
  const n = c.codePointAt(0);
  return (n >= 33 && n <= 47) || (n >= 58 && n <= 64) || (n >= 91 && n <= 96) || (n >= 123 && n <= 126) || /\p{P}/u.test(c);
};
const isCjk = (n) => (n >= 0x4e00 && n <= 0x9fff) || (n >= 0x3400 && n <= 0x4dbf) || (n >= 0xf900 && n <= 0xfaff) || (n >= 0x20000 && n <= 0x2fa1f);

export function basicTokens(text) {
  const clean = String(text)
    .normalize('NFD')
    .replace(/\p{Mn}/gu, '')
    .toLowerCase();
  const out = [];
  let word = '';
  const flush = () => {
    if (word) out.push(word);
    word = '';
  };
  for (const c of clean) {
    const n = c.codePointAt(0);
    if (n === 0 || n === 0xfffd || (/\p{C}/u.test(c) && !/\s/.test(c))) continue;
    if (/\s/.test(c)) flush();
    else if (isPunct(c) || isCjk(n)) {
      flush();
      out.push(c);
    } else word += c;
  }
  flush();
  return out;
}

export function makeTokenizer(vocabText) {
  const vocab = new Map(vocabText.split('\n').map((w, i) => [w.replace(/\r$/, ''), i]));
  const id = (w) => vocab.get(w);
  const UNK = id('[UNK]');
  const CLS = id('[CLS]');
  const SEP = id('[SEP]');
  return (text) => {
    const ids = [CLS];
    for (const word of basicTokens(text)) {
      const chars = [...word];
      if (chars.length > 100) {
        ids.push(UNK);
        continue;
      }
      const pieces = [];
      let start = 0;
      let bad = false;
      while (start < chars.length) {
        let end = chars.length;
        let found = -1;
        while (start < end) {
          const piece = (start ? '##' : '') + chars.slice(start, end).join('');
          if (vocab.has(piece)) {
            found = id(piece);
            break;
          }
          end--;
        }
        if (found < 0) {
          bad = true;
          break;
        }
        pieces.push(found);
        start = end;
      }
      if (bad) ids.push(UNK);
      else ids.push(...pieces);
      if (ids.length >= MAX_TOKENS - 1) break;
    }
    ids.length = Math.min(ids.length, MAX_TOKENS - 1);
    ids.push(SEP);
    return ids;
  };
}

// ---- running the model
// `ort` is the ONNX Runtime module, `model` the bytes of model.onnx, `vocabText` the text of vocab.txt.
export async function makeEmbedder(ort, model, vocabText) {
  const tokenize = makeTokenizer(vocabText);
  const session = await ort.InferenceSession.create(model, { executionProviders: ['wasm'], graphOptimizationLevel: 'all' });
  return async (text) => {
    const ids = tokenize(text);
    const n = ids.length;
    const big = (v) => BigInt64Array.from(v, (x) => BigInt(x));
    const feeds = {
      input_ids: new ort.Tensor('int64', big(ids), [1, n]),
      attention_mask: new ort.Tensor('int64', big(ids.map(() => 1)), [1, n]),
      token_type_ids: new ort.Tensor('int64', big(ids.map(() => 0)), [1, n]),
    };
    const out = await session.run(feeds);
    const h = (out.last_hidden_state || out[session.outputNames[0]]).data; // n rows of 384
    const v = new Float32Array(DIMS);
    for (let t = 0; t < n; t++) for (let d = 0; d < DIMS; d++) v[d] += h[t * DIMS + d];
    let len = 0;
    for (let d = 0; d < DIMS; d++) len += v[d] * v[d];
    len = Math.sqrt(len) || 1;
    for (let d = 0; d < DIMS; d++) v[d] /= len;
    return v;
  };
}

// ---- saving vectors small: one byte per number, written as base64 text
export function pack(v) {
  const b = new Uint8Array(DIMS);
  for (let d = 0; d < DIMS; d++) b[d] = Math.max(0, Math.min(255, Math.round(v[d] * 127) + 128));
  let s = '';
  for (const x of b) s += String.fromCharCode(x);
  return btoa(s);
}
export function unpack(text) {
  const s = atob(text);
  const v = new Float32Array(DIMS);
  let len = 0;
  for (let d = 0; d < DIMS; d++) {
    v[d] = (s.charCodeAt(d) - 128) / 127;
    len += v[d] * v[d];
  }
  len = Math.sqrt(len) || 1;
  for (let d = 0; d < DIMS; d++) v[d] /= len;
  return v;
}
export function cosine(a, b) {
  let s = 0;
  for (let d = 0; d < DIMS; d++) s += a[d] * b[d];
  return s;
}

// ---- loading it on the phone. Called only when the adult has switched "Understand sentences" on.
let ready = null;
export function loadEmbedder(base = new URL('../ai/', import.meta.url).href) {
  if (ready) return ready;
  ready = (async () => {
    const ort = await import(base + 'ort/ort.wasm.min.mjs');
    ort.env.wasm.wasmPaths = base + 'ort/';
    ort.env.wasm.numThreads = 1; // GitHub Pages cannot send the headers that threads need
    const [model, vocab] = await Promise.all([fetch(base + 'minilm/model.onnx').then(ok).then((r) => r.arrayBuffer()), fetch(base + 'minilm/vocab.txt').then(ok).then((r) => r.text())]);
    return makeEmbedder(ort, new Uint8Array(model), vocab);
  })();
  ready.catch(() => (ready = null)); // let a later try start again
  return ready;
}
const ok = (r) => {
  if (!r.ok) throw new Error('could not fetch ' + r.url);
  return r;
};
