# ai/: the files behind "search by sentence" and the chat helper

Nothing in this folder is loaded until the adult switches one of the two on (Settings, or the offer under a search).
The files are big, so they are **not** in the service worker's `FILES` list. `sw.js` keeps them in a cache of their own
(`toybox-ai-1`) the first time they are fetched, and that cache is not cleared when the app is updated.
If a file here is ever replaced, put it in a new folder (or bump the cache name in `sw.js`), or phones will keep the old one.

These are other people's programs, copied in unchanged so the app does not depend on another website for them.
They are the one exception to "no dependencies"; there is still no build step and nothing to install.

| Folder | What | From | Licence |
|---|---|---|---|
| `minilm/model.onnx` | all-MiniLM-L6-v2, the model that turns a sentence into 384 numbers. 23 MB. | The ONNX file from the `Xenova/all-MiniLM-L6-v2` repo on Hugging Face (SHA-256 `759c3cd2…c46e`, checked against the Hugging Face file page on 9 October 2026), fetched through the npm package `@alvix/all-minilm-l6-v2` 1.0.1, then shrunk from 90 MB to 23 MB with ONNX Runtime's `quantize_dynamic` (8-bit weights). | Apache-2.0 |
| `minilm/vocab.txt` | Its word list. | Same repo. | Apache-2.0 |
| `ort/` | ONNX Runtime Web 1.30.0: the program that runs the model (WebAssembly, no graphics card needed). | npm `onnxruntime-web` 1.30.0, three files from `dist/`. | MIT |
| `webllm/index.js` | WebLLM 0.2.85: the program that runs the chat helper's model on the phone's graphics chip. | npm `@mlc-ai/web-llm` 0.2.85, `lib/index.js`. | Apache-2.0 (`webllm/LICENSE`) |

The chat helper's own model (Gemma 3 1B, about 600 MB) is too big for GitHub Pages. WebLLM fetches it from
`huggingface.co/mlc-ai/gemma3-1b-it-q4f16_1-MLC`, and a small compiled program for it from
`raw.githubusercontent.com/mlc-ai/binary-mlc-llm-libs`, the first time the chat helper is switched on. It keeps them in the
browser's storage. Gemma is Google's model and comes under the Gemma terms of use.

To rebuild `minilm/model.onnx` from the original:

    python3 -c "from onnxruntime.quantization import quantize_dynamic, QuantType; quantize_dynamic('model.onnx', 'out.onnx', weight_type=QuantType.QUInt8)"

Then run `node tools/embed.mjs`, because the saved numbers for the activities must come from the same file.
