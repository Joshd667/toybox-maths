// stickers.js — the sticker dice. Not an activity: no set-up, no questions, no stars.
// The family has printed sheets of dots inside pictures and packs of round coloured stickers.
// The dice picks which colour (or which colours, in order) go on the next dots.
// No DOM here, so tools/validate.mjs can test it. The screen is stickerScreen() in app.js.

// The colours in the sticker packs. `ink` is the colour of a tick drawn on top of it.
export const STICKER_COLOURS = [
  { id: 'red', name: 'red', hex: '#D7282F', ink: '#fff' },
  { id: 'orange', name: 'orange', hex: '#F07F1E', ink: '#211d3d' },
  { id: 'yellow', name: 'yellow', hex: '#FFD21F', ink: '#211d3d' },
  { id: 'green', name: 'green', hex: '#2E9E4B', ink: '#fff' },
  { id: 'darkblue', name: 'dark blue', hex: '#1B3A8F', ink: '#fff' },
  { id: 'purple', name: 'purple', hex: '#7B4BB7', ink: '#fff' },
  { id: 'pink', name: 'pink', hex: '#F28DBB', ink: '#211d3d' },
  { id: 'brown', name: 'brown', hex: '#8A5A2E', ink: '#fff' },
  { id: 'white', name: 'white', hex: '#FFFFFF', ink: '#211d3d' },
  { id: 'black', name: 'black', hex: '#1E1E1E', ink: '#fff' },
];
export const stickerColour = (id) => STICKER_COLOURS.find((c) => c.id === id);

// How many colours each level shows.
export const DICE_LEVELS = [
  { n: 1, label: '1 colour', say: 'Find this colour. Stick it on a dot.' },
  { n: 3, label: '3 colours', say: 'Copy these, in this order.' },
  { n: 5, label: '5 colours', say: 'Copy these, in this order.' },
];

// One roll: `n` different colours (so a pack never runs out of one colour in the middle of a roll).
// With one colour, it is never the same as the last one, so every roll looks new.
export function rollDice(r, n, last = []) {
  const pool = n === 1 && last.length === 1 ? STICKER_COLOURS.filter((c) => c.id !== last[0]) : STICKER_COLOURS;
  return r.sample(pool, n).map((c) => c.id);
}

// The words to read out: "red, yellow and dark blue".
export function sayColours(ids) {
  const names = ids.map((id) => stickerColour(id).name);
  return names.length < 2 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}
