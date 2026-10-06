// wording.js — activity text is written about "he". This rewrites it for "she" or "they"
// when a child's profile says so, so nobody has to write every sentence three times.

const cap = (s) => s[0].toUpperCase() + s.slice(1);
const keepCase = (from, to) => (from[0] === from[0].toUpperCase() ? cap(to) : to);
// "his" on its own ("Does his match?") becomes "hers"/"theirs"; before a noun it becomes "her"/"their".
const STANDALONE_HIS = /\bhis\b(?=\s+(match|should)\b|\s*[.?!,'"]|$)/gi;

export function reword(text, pronoun) {
  if (!pronoun || pronoun === 'he') return text;
  const she = pronoun === 'she';
  let t = text;
  t = t.replace(/clever boy/g, she ? 'clever girl' : 'so clever');
  t = t.replace(STANDALONE_HIS, (m) => keepCase(m, she ? 'hers' : 'theirs'));
  t = t.replace(/\bhimself\b/gi, (m) => keepCase(m, she ? 'herself' : 'themselves'));
  t = t.replace(/\bhim\b/gi, (m) => keepCase(m, she ? 'her' : 'them'));
  t = t.replace(/\bhis\b/gi, (m) => keepCase(m, she ? 'her' : 'their'));
  if (she) return t.replace(/\bhe\b/gi, (m) => keepCase(m, 'she'));
  // "they" needs the verb changed too: "Does he count" -> "Do they count", "he has" -> "they have", "he says" -> "they say".
  t = t.replace(/\bdoes he\b/gi, (m) => keepCase(m, 'do they'));
  t = t.replace(/\bhe (is|has|does|goes)\b/gi, (m, v) => keepCase(m, 'they ' + { is: 'are', has: 'have', does: 'do', goes: 'go' }[v.toLowerCase()]));
  t = t.replace(/\bhe (sees|says|moves|counts|tells|starts|runs|looks|listens|leads|knows|gives|finds|closes|builds|asks|answers|needs|wants|uses|makes|keeps|picks|reads|checks|stops)\b/gi, (m, v) => keepCase(m, 'they ' + v.slice(0, -1)));
  return t.replace(/\bhe\b/gi, (m) => keepCase(m, 'they'));
}
