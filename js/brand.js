// brand.js — the Toybox Maths picture: a smiling toy box with three number blocks jumping out.
// One drawing, used for the home-screen icon (tools/make-icons.mjs writes the files in icons/)
// and for the small logo beside the app's name. Plain blocks on purpose: this is not a toy maker's app.

import { numeral } from './draw.js';

const INK = '#2B2350';

// A number block, centred on (x, y) and tipped by `turn` degrees.
function block(n, x, y, turn, colour, dark) {
  const d = numeral(n, 66, '#fff');
  return (
    `<g transform="translate(${x} ${y}) rotate(${turn})">` +
    `<rect x="-56" y="-50" width="112" height="112" rx="22" fill="${dark}"/>` +
    `<rect x="-56" y="-56" width="112" height="108" rx="22" fill="${colour}"/>` +
    `<rect x="-40" y="-44" width="80" height="9" rx="4.5" fill="#fff" opacity=".3"/>` +
    `<g transform="translate(${-d.w / 2} -32)">${d.svg.replace('stroke-width="12"', 'stroke-width="17"')}</g>` +
    `</g>`
  );
}

const star = (x, y, s, fill) => `<path transform="translate(${x} ${y}) scale(${s}) translate(-12 -12)" d="M12 1.8l3.1 6.5 7.1.9-5.2 4.9 1.3 7.1L12 17.8 5.7 21.2 7 14.1 1.8 9.2l7.1-.9z" fill="${fill}" stroke="${fill}" stroke-width="1.6" stroke-linejoin="round"/>`;

// The box and its blocks, drawn in a 512 by 512 square with nothing behind them.
export function mark() {
  return (
    // inside of the box, then the blocks standing in it
    `<rect x="104" y="238" width="304" height="70" rx="18" fill="#A85C0C"/>` +
    block(1, 166, 190, -13, '#F4553F', '#C73524') +
    block(3, 350, 196, 14, '#22A7F0', '#1583C4') +
    block(2, 258, 142, 4, '#34B869', '#208F4C') +
    // the box
    `<rect x="96" y="270" width="320" height="186" rx="34" fill="#E79F10"/>` +
    `<rect x="96" y="262" width="320" height="182" rx="34" fill="#FFC730"/>` +
    `<rect x="96" y="286" width="320" height="16" fill="#E79F10" opacity=".55"/>` +
    `<rect x="78" y="238" width="356" height="54" rx="24" fill="#FFDA6B"/>` +
    `<rect x="100" y="250" width="312" height="9" rx="4.5" fill="#fff" opacity=".45"/>` +
    // its face
    `<circle cx="168" cy="392" r="19" fill="#FF8C7A" opacity=".6"/><circle cx="344" cy="392" r="19" fill="#FF8C7A" opacity=".6"/>` +
    `<circle cx="206" cy="354" r="18" fill="${INK}"/><circle cx="306" cy="354" r="18" fill="${INK}"/>` +
    `<circle cx="212" cy="347" r="6" fill="#fff"/><circle cx="312" cy="347" r="6" fill="#fff"/>` +
    `<path d="M220 392Q256 426 292 392" fill="none" stroke="${INK}" stroke-width="13" stroke-linecap="round"/>`
  );
}

// The whole icon. `full` fills the square to its corners (phones cut their own shape out of it);
// `scale` shrinks the picture so nothing important is cut off.
export function icon({ full = false, scale = 1 } = {}) {
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">` +
    `<defs><linearGradient id="tb-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7566F5"/><stop offset="1" stop-color="#4532C9"/></linearGradient></defs>` +
    `<rect width="512" height="512" ${full ? '' : 'rx="116" '}fill="url(#tb-sky)"/>` +
    `<circle cx="256" cy="250" r="${Math.round(214 * scale)}" fill="#fff" opacity=".1"/>` +
    `<g transform="translate(256 262) scale(${scale}) translate(-256 -270)">` +
    star(432, 92, 2.5, '#FFD23F') + star(74, 150, 1.3, '#fff') + star(452, 196, 1.0, '#fff') +
    mark() +
    `</g></svg>`
  );
}

// The small logo for the top of the home screen.
export const logo = () => `<svg class="logo" viewBox="60 70 392 396" aria-hidden="true">${mark()}</svg>`;
