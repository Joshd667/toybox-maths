// tools/embed.mjs — run with:  node tools/embed.mjs
//
// Turns every activity into the list of numbers the meaning search compares against, and writes them
// to js/vectors.js. Run it after adding or rewording an activity. tools/validate.mjs fails if it is out of date.
// It uses the model and runtime that are already in ai/, so there is nothing to install.

import fs from 'node:fs';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as ort from '../ai/ort/ort.wasm.min.mjs';
import { ACTIVITIES } from '../js/activities/index.js';
import { makeEmbedder, pack } from '../js/meaning.js';
import { docText, mark } from '../js/ask.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
ort.env.wasm.numThreads = 1;
// A fingerprint of the model file. It is saved beside the numbers, so the validator can tell if the model was swapped
// without the numbers being made again.
export const modelMark = () => crypto.createHash('sha256').update(fs.readFileSync(path.join(root, 'ai/minilm/model.onnx'))).digest('hex').slice(0, 16);
export const embedder = () => makeEmbedder(ort, fs.readFileSync(path.join(root, 'ai/minilm/model.onnx')), fs.readFileSync(path.join(root, 'ai/minilm/vocab.txt'), 'utf8'));

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const embed = await embedder();
  const lines = [];
  for (const a of ACTIVITIES) {
    const text = docText(a);
    lines.push(`  '${a.id}': ['${mark(text)}', '${pack(await embed(text))}'],`);
  }
  const out = `// vectors.js — made by tools/embed.mjs. Do not edit by hand.
// For each activity: a fingerprint of the words that were read, then 384 numbers (one byte each, as base64)
// that stand for what the activity is about. js/ask.js compares them with what is typed in the search box.
export const MODEL_MARK = '${modelMark()}';
export const VECTORS = {
${lines.join('\n')}
};
`;
  fs.writeFileSync(path.join(root, 'js/vectors.js'), out);
  console.log(`Wrote js/vectors.js: ${ACTIVITIES.length} activities, ${(out.length / 1024).toFixed(0)} KB`);
}
