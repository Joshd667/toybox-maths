// Patterns: copying, continuing, fixing and describing things that repeat.
import {
  A, lv, times, choices, pickToy, list, an, cap, numQ,
  flow, row, column, rod, cube, duplo, hit, qbox, frame, text, scatter, scale, ring, wagon, engine, onTrack, flip,
  FARM, BRICK_COLOURS, MORE_COLOURS,
} from './kit.js';

const ALL = ['cubes', 'duplo', 'cars', 'animals', 'wooden'];
const SMALL = ['cubes', 'duplo'];

// Repeating units by step. 0, 1, 2 stand for the first, second and third kind of thing.
const UNITS = {
  1: [[0, 1]],
  2: [[0, 0, 1], [0, 1, 1], [0, 1, 2]],
  3: [[0, 0, 1, 1], [0, 1, 1, 2], [0, 0, 1, 2], [0, 1, 2, 1]],
};
const LETTERS = ['A', 'B', 'C'];
const unitName = (u) => u.map((i) => LETTERS[i]).join('');
const seqOf = (unit, len) => times(len, (i) => unit[i % unit.length]);

// What the pattern is made from: three different colours (or animals) of one toy.
function medium(r, ctx, len) {
  const toy = pickToy(r, ctx, len > 8 ? SMALL : ALL);
  const vals = r.sample(toy.id === 'animals' ? FARM : toy.vary, 3);
  const short = { cars: 'car', duplo: 'brick', cubes: 'cube', wooden: 'block' }[toy.id];
  return {
    toy,
    el: (i) => toy.make(r, vals[i]),
    name: (i) => (toy.id === 'animals' ? vals[i] : vals[i]),
    full: (i) => (toy.id === 'animals' ? vals[i] : `${vals[i]} ${short}`),
    things: toy.id === 'animals' ? 'animals' : `${short}s`,
  };
}
const line = (m, seq, o = {}) => row(seq.map((v, i) => (o.wrap ? o.wrap(m.el(v), i) : m.el(v))), { gap: o.gap ?? 4 });
const say = (m, seq) => seq.map((v) => m.name(v)).join(', ');

export default [
  A({
    id: 'pattern-next',
    title: 'What comes next?',
    strand: 'patterns',
    skill: 'What comes next',
    needs: [],
    toys: ALL,
    minutes: 3,
    age: 3,
    research: ['rittle2013', 'devmatters', 'rittle2019'],
    why: 'Continuing a repeating pattern is on the 3-and-4-year-old list, and pattern skill at this age predicts later maths.',
    make(r, level, ctx) {
      const unit = r.pick(UNITS[level]);
      const len = unit.length * (level === 1 ? 3 : 2) + (level === 1 ? 0 : r.int(0, unit.length - 1));
      const m = medium(r, ctx, len + 1);
      const seq = seqOf(unit, len);
      const next = unit[len % unit.length];
      return {
        setup: [`Lay out this pattern with ${m.things}, left to right: ${say(m, seq)}.`, 'Point along the row and say it aloud together, in a sing-song.'],
        scenes: [{ sprite: row([line(m, seq), qbox(34, 34)], { gap: 6, align: 'middle' }) }],
        ask: 'What comes next?',
        answer: { type: 'pick', options: r.shuffle([0, 1, 2]).map((i) => ({ key: String(i), sprite: m.el(i) })), correct: String(next) },
        reveal: { caption: `${cap(an(m.full(next)))}. The pattern goes ${say(m, unit)}, over and over.`, sprite: line(m, [...seq, next], { wrap: (s, i) => (i === len ? ring(s) : s) }) },
        more: [...[1, 2].map((j) => {
          const nx = unit[(len + j) % unit.length];
          const shown = row([line(m, seqOf(unit, len + j)), qbox(34, 34)], { gap: 6, align: 'middle' });
          return { ask: 'And what comes after that?', scenes: [{ sprite: shown.w > 500 ? scale(shown, 500 / shown.w) : shown }], answer: { type: 'pick', options: r.shuffle([0, 1, 2]).map((i) => ({ key: String(i), sprite: m.el(i) })), correct: String(nx) }, reveal: { caption: `${cap(an(m.full(nx)))}.` } };
        })],
        look: ['Does he say the pattern aloud to work it out? That is the strategy to encourage.'],
        easier: lv(level, 'Say it aloud together again and let him finish the last word.', 'Use two colours taking turns, and show lots of repeats.'),
        harder: 'Let him carry on for five or six more without help.',
        words: ['pattern', 'next', 'again', 'repeat'],
      };
    },
  }),

  A({
    id: 'pattern-fix',
    title: 'Spot my mistake',
    strand: 'patterns',
    skill: 'Spotting the rule',
    needs: [],
    toys: ALL,
    minutes: 3,
    age: 3,
    research: ['devmatters', 'rittle2013'],
    why: 'Noticing and fixing an error in a repeating pattern is named directly on the 3-and-4-year-old maths list.',
    make(r, level, ctx) {
      const unit = r.pick(UNITS[level]);
      const len = unit.length * 3;
      const m = medium(r, ctx, len);
      const seq = seqOf(unit, len);
      const e = r.int(unit.length, len - 1);
      const right = seq[e];
      // step 1: a colour that isn't in the pattern at all (easy to see). Later: one that is.
      const wrongPool = level === 1 ? [2] : [...new Set(unit)].filter((v) => v !== right);
      const wrong = r.pick(wrongPool.length ? wrongPool : [2]);
      const bad = [...seq];
      bad[e] = wrong;
      return {
        setup: [`Build this row with ${m.things}, mistake and all: ${say(m, bad)}.`, 'Tell him you were trying to make a pattern but got one wrong.'],
        scenes: [{ sprite: line(m, bad, { wrap: (s, i) => hit(s, String(i)) }) }],
        ask: 'I made a mistake in my pattern. Can you find it?',
        answer: { type: 'tap', correct: [String(e)] },
        reveal: { caption: `It should be ${an(m.full(right))}, not ${an(m.full(wrong))}. Ask him to swap it.`, sprite: line(m, seq, { wrap: (s, i) => (i === e ? ring(s) : s) }) },
        look: ['Does he read along from the start to find it?', 'Can he fix it as well as find it?'],
        easier: lv(level, 'Point along the row and say it together until one sounds wrong.', 'Put in a colour that does not belong at all.'),
        harder: 'Make two mistakes.',
        words: ['pattern', 'mistake', 'should be', 'instead'],
      };
    },
  }),

  A({
    id: 'pattern-copy',
    title: 'Copy my pattern',
    strand: 'patterns',
    skill: 'Copying and making',
    needs: [],
    toys: ALL,
    minutes: 4,
    age: 3,
    research: ['rittle2013', 'devmatters'],
    why: 'Copying is the first step in the research on how pattern skill grows: copy, continue, then rebuild it with different things.',
    make(r, level, ctx) {
      const unit = r.pick(UNITS[level]);
      const len = unit.length * 2;
      const m = medium(r, ctx, len);
      const seq = seqOf(unit, len);
      return {
        setup: [`Make this row with ${m.things}: ${say(m, seq)}.`, 'Give him the same pieces, plus a few spares.'],
        scenes: [{ sprite: line(m, seq) }],
        ask: 'Can you make one just like mine, underneath?',
        answer: { type: 'do' },
        look: ['Does he match piece by piece under yours, or look and build from memory?', 'When he has finished, ask him to keep it going.'],
        easier: lv(level, 'Build it together, one piece each in turn.', 'Two colours taking turns.'),
        harder: 'Show it, cover it, and see if he can rebuild it.',
        words: ['pattern', 'the same', 'next'],
      };
    },
  }),

  A({
    id: 'pattern-translate',
    title: 'Same pattern, different toys',
    strand: 'patterns',
    skill: 'Copying and making',
    needs: ['A second kind of toy, such as animals or blocks'],
    toys: ALL,
    levels: [2, 3],
    minutes: 5,
    age: 4,
    research: ['rittle2013', 'fyfe2015'],
    why: 'Rebuilding a pattern with different things shows he has the structure, not just the colours. Naming it "A, B, B" helped children do this in one study.',
    make(r, level, ctx) {
      const unit = level === 2 ? r.pick([[0, 1], [0, 1, 1], [0, 0, 1]]) : r.pick([[0, 1, 2], [0, 0, 1, 1], [0, 1, 1, 2]]);
      const len = unit.length * 2;
      const m = medium(r, ctx, 6);
      const seq = seqOf(unit, len);
      const kinds = [...new Set(unit)].length;
      const beasts = m.toy.id === 'animals';
      const other = r.pick(kinds === 2
        ? ['big blocks and small blocks', 'claps and stomps', beasts ? 'two colours of brick' : 'two other colours', ...(beasts || m.toy.id === 'cars' ? [] : ['cars and animals'])]
        : ['a clap, a stomp and a jump', ...(beasts ? ['three colours of brick'] : ['three different animals', 'three other colours'])]);
      const letters = row(seq.map((v) => frame(text(LETTERS[v], 14, { bold: true }), { pad: 5, minW: 24 })), { gap: 4 });
      return {
        setup: [`Make this row with ${m.things}: ${say(m, seq)}.`, 'Say it aloud together first.'],
        scenes: [{ sprite: line(m, seq) }],
        ask: `Can you make the same pattern, but using ${other}?`,
        answer: { type: 'do' },
        reveal: { caption: `The pattern is ${unitName(unit)}, ${unitName(unit)}. Any toys in that order are right.`, sprite: column([line(m, seq), letters], { gap: 8 }) },
        look: ['Does the new row have the same rhythm, even though the pieces differ?', 'Try calling it "A, B, B" as you point. Letters can help more than colour names.'],
        easier: 'Use two colours taking turns, and swap only the colours.',
        harder: 'Do it as sounds or actions with no toys at all.',
        words: ['pattern', 'the same', 'different'],
      };
    },
  }),

  A({
    id: 'staircase',
    title: 'Staircase',
    strand: 'patterns',
    skill: 'What comes next',
    needs: [],
    toys: ['cubes', 'duplo', 'numicon'],
    levels: [2, 3],
    minutes: 4,
    age: 4,
    research: ['ncetm', 'sarnecka2008'],
    why: 'A staircase is a pattern that grows. Each step is one more than the last, which is the same idea as counting.',
    make(r, level) {
      const step = level === 3 && r.bool(0.5) ? 2 : 1;
      const down = level === 3 && step === 1;
      const start = down ? r.int(5, 6) : r.int(1, 2);
      const hs = times(3, (i) => start + (down ? -i : i * step));
      const next = start + (down ? -3 : 3 * step);
      const c = r.pick(MORE_COLOURS);
      const stair = (list2) => row(list2.map((h) => rod(times(h, () => c), true)), { gap: 6 });
      return {
        setup: [`Build towers of ${list(hs.map(String))} and stand them in a row like stairs.`],
        scenes: [{ sprite: row([stair(hs), qbox(22, 40)], { gap: 8 }) }],
        ask: 'How many will be in the next tower?',
        answer: { type: 'number', value: next, choices: choices(r, next, { min: 0 }) },
        reveal: { caption: `${next}. Each tower is ${step === 2 ? 'two' : 'one'} ${down ? 'fewer' : 'more'} than the one before.`, sprite: stair([...hs, next]) },
        more: [{ ...numQ(r, 'And the tower after that?', next + (down ? -1 : step)), scenes: [{ sprite: row([stair([...hs, next]), qbox(22, 40)], { gap: 8 }) }] }],
        look: ['Can he say what is changing each time?', 'Walk a toy up the stairs, counting each step.'],
        easier: 'Start with 1, 2, 3 and build the 4 together.',
        harder: lv(level, 'Build a staircase that goes down, or up in twos.', 'Build a staircase that goes down, or up in twos.', 'Let him build the next three towers on his own.'),
        words: ['one more', 'bigger', 'next', 'steps'],
      };
    },
  }),

  A({
    id: 'action-pattern',
    title: 'Clap, stomp',
    strand: 'patterns',
    skill: 'What comes next',
    needs: [],
    toys: [],
    minutes: 2,
    age: 3,
    research: ['rittle2013', 'devmatters'],
    why: 'A pattern is a rule, not a set of colours. Doing one with your body shows the same idea with no toys at all.',
    make(r, level) {
      const unit = r.pick(UNITS[level]);
      const acts = r.sample(['clap', 'stomp', 'pat knees', 'tap head', 'jump'], 3);
      const seq = seqOf(unit, unit.length * 2);
      return {
        setup: ['Stand facing each other. Do the pattern slowly, saying each action as you do it.'],
        scenes: [{ sprite: flow(seq.map((v) => frame(text(acts[v], 12, { bold: true }), { pad: 7, minW: 44 })), { gap: 5, maxW: 320 }) }],
        ask: `Watch me: ${seq.map((v) => acts[v]).join(', ')}… now you carry it on!`,
        answer: { type: 'do' },
        look: ['Can he keep it going for three or four more rounds?', 'Can he make up one for you to copy?'],
        easier: lv(level, 'Do it together, holding hands, before he tries alone.', 'Two actions taking turns.'),
        harder: 'Build the same pattern with bricks afterwards.',
        words: ['pattern', 'again', 'next'],
      };
    },
  }),

  A({
    id: 'pattern-unit',
    title: 'Which bit repeats?',
    strand: 'patterns',
    skill: 'Spotting the rule',
    needs: [],
    toys: SMALL,
    levels: [3],
    minutes: 3,
    age: 4,
    research: ['rittle2013'],
    why: 'Naming the part that repeats is the hardest pattern skill. In the research few 4-year-olds could do it, so this is a real stretch.',
    make(r, level, ctx) {
      const unit = r.pick([[0, 1], [0, 1, 1], [0, 0, 1], [0, 1, 2], [0, 0, 1, 1]]);
      const m = medium(r, ctx, 12);
      const seq = seqOf(unit, unit.length * 3);
      const pool = [[0, 1], [0, 1, 1], [0, 0, 1], [0, 0, 1, 1], [0, 1, 2]].filter((u) => unitName(u) !== unitName(unit) && Math.max(...u) <= Math.max(...unit));
      const opts = r.shuffle([unit, ...r.sample(pool, 2)]);
      return {
        setup: [`Make this row with ${m.things}: ${say(m, seq)}.`],
        scenes: [{ sprite: line(m, seq, { gap: 3 }) }],
        ask: 'Which little bit is repeating over and over?',
        answer: { type: 'pick', options: opts.map((u) => ({ key: unitName(u), sprite: line(m, u, { gap: 3 }) })), correct: unitName(unit) },
        reveal: { caption: `${say(m, unit)}. Snap the row into those chunks to show him.`, sprite: row(times(3, () => line(m, unit, { gap: 2 })), { gap: 12 }) },
        look: ['If cubes are linked, can he break the row into matching chunks?'],
        easier: 'Go back to "Copy my pattern" and split the row into chunks together.',
        harder: 'Ask him to make a pattern and tell you its repeating bit.',
        words: ['pattern', 'repeat', 'over and over', 'chunk'],
      };
    },
  }),

  A({
    id: 'pattern-make',
    title: 'Your turn to make one',
    strand: 'patterns',
    skill: 'Copying and making',
    needs: [],
    toys: ALL,
    minutes: 5,
    age: 3,
    research: ['devmatters', 'weisberg2013'],
    why: 'Making his own pattern for you to copy puts him in charge, which is the heart of guided play.',
    make(r, level, ctx) {
      const m = medium(r, ctx, 6);
      const kinds = lv(level, 2, 2, 3);
      const each = lv(level, 4, 5, 4);
      const pile = r.shuffle(times(kinds * each, (i) => i % kinds));
      return {
        setup: [`Give him a pile of ${m.things} in ${kinds} ${m.toy.id === 'animals' ? 'kinds' : 'colours'}: about ${each} of each.`],
        scenes: [{ sprite: scatter(pile.map((v) => m.el(v)), r, { w: 280, h: 110 }) }],
        ask: 'Can you make a pattern for me to copy?',
        answer: { type: 'open' },
        look: ['Is it a real repeat, or a pretty row? Ask him to "read" it to you.', 'Copy it, and make one mistake on purpose for him to catch.'],
        easier: 'Start the first two pieces for him.',
        harder: lv(level, 'Ask for a pattern with three things, or one where a colour comes twice.', 'Ask for a pattern with three things, or one where a colour comes twice.', 'Ask for a pattern where one thing comes twice in a row.'),
        words: ['pattern', 'repeat', 'my turn', 'your turn'],
      };
    },
  }),
];
