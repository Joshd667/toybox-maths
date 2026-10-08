// wording.js — activity text is written about "he". This rewrites it as "she"
// when a child's profile says so, so nobody has to write every sentence twice.

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const keepCase = (from, to) => (from[0] === from[0].toUpperCase() ? cap(to) : to);
// "his" on its own ("Does his match?") becomes "hers"; before a noun it becomes "her".
const STANDALONE_HIS = /\bhis\b(?=\s+(match|should)\b|\s*[.?!,'"]|$)/gi;

export function reword(text, pronoun) {
  if (pronoun !== 'she') return text;
  let t = text;
  t = t.replace(/clever boy/g, 'clever girl');
  t = t.replace(STANDALONE_HIS, (m) => keepCase(m, 'hers'));
  t = t.replace(/\bhimself\b/gi, (m) => keepCase(m, 'herself'));
  t = t.replace(/\bhim\b/gi, (m) => keepCase(m, 'her'));
  t = t.replace(/\bhis\b/gi, (m) => keepCase(m, 'her'));
  return t.replace(/\bhe\b/gi, (m) => keepCase(m, 'she'));
}
