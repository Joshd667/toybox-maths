// tools/make-icons.mjs — rebuilds the files in icons/ from the drawing in js/brand.js.
//   node tools/make-icons.mjs
// Needs Playwright with Chromium (npm i -g playwright). Only run it after changing js/brand.js.

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { icon } from '../js/brand.js';

const out = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'icons');
const require = createRequire(import.meta.url);
let chromium;
try {
  ({ chromium } = require('playwright'));
} catch {
  ({ chromium } = require(process.env.PLAYWRIGHT_PATH || '/opt/npm-tools/node_modules/playwright'));
}

fs.writeFileSync(path.join(out, 'icon.svg'), icon());
// name, size, the drawing, and whether the corners outside the rounded square are see-through
const jobs = [
  ['icon-192.png', 192, icon(), true],
  ['icon-512.png', 512, icon(), true],
  ['icon-maskable-512.png', 512, icon({ full: true, scale: 0.78 }), false], // Android cuts a circle or squircle out of this
  ['apple-touch-icon.png', 180, icon({ full: true, scale: 0.94 }), false], // iPhone rounds the corners itself
];
const browser = await chromium.launch();
for (const [name, size, svg, clear] of jobs) {
  const page = await browser.newPage({ viewport: { width: size, height: size } });
  await page.setContent(`<body style="margin:0;background:transparent">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`);
  await page.screenshot({ path: path.join(out, name), omitBackground: clear });
  await page.close();
}
await browser.close();
console.log('icons written to', out);
