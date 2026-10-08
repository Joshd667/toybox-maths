// Numerals: recognising written numbers and linking them to amounts and to their order.
import {
  A, lv, plural, list, times, choices, pickToy, has, numQ,
  flow, row, column, tag, card, numeral, tower, rod, numicon, hit, qbox, text, sp, at, shade, PAL, INK,
  BRICK_COLOURS, MORE_COLOURS,
} from './kit.js';

const ANY = ['cars', 'animals', 'duplo', 'cubes', 'wooden'];
const LOOKALIKE = { 6: 9, 9: 6, 2: 5, 5: 2, 1: 7, 7: 1, 3: 8, 8: 3, 12: 20, 13: 3, 15: 5, 17: 7, 16: 6 };

// The number track for the road race: coloured squares numbered left to right.
function track(n, r) {
  const S = n > 10 ? 15 : 30;
  const cols = ['#F9D8D6', '#D6E6FA', '#FDEFC2', '#D5EFDC', '#FBE0C4', '#E6DAF4'];
  let svg = '';
  for (let i = 0; i < n; i++) {
    const num = numeral(i + 1, S * 0.5);
    svg += `<rect x="${i * S + 0.5}" y=".5" width="${S - 1}" height="${S - 1}" rx="4" fill="${cols[(i + r.int(0, 5)) % 6]}" stroke="${INK}"/>` + at(num, i * S + (S - num.w) / 2, (S - num.h) / 2);
  }
  return sp(n * S, S, svg);
}

export default [
  A({
    id: 'tap-number',
    title: 'Find the number',
    strand: 'numerals',
    skill: 'Reading numbers',
    needs: [],
    toys: [],
    minutes: 2,
    research: ['devmatters', 'ramani2008'],
    why: 'Naming written numbers is a separate skill from counting, and one of the things number games were shown to improve.',
    make(r, level) {
      const target = r.int(...lv(level, [1, 5], [0, 10], [6, 20]));
      const count = lv(level, 3, 4, 5);
      const pool = new Set([target]);
      if (level > 1 && LOOKALIKE[target] !== undefined) pool.add(LOOKALIKE[target]);
      const [lo, hi] = lv(level, [1, 5], [0, 10], [0, 20]);
      while (pool.size < count) pool.add(r.int(lo, hi));
      const nums = r.shuffle([...pool]);
      const find = (t) => ({ ask: `Can you find number ${t}?`, answer: { type: 'tap', correct: [String(t)] }, reveal: { caption: `This is ${t}.`, sprite: card(t, 90) } });
      return {
        setup: ['Hold the phone so he can reach it. Real number cards on the floor work just as well.'],
        scenes: [{ sprite: flow(nums.map((n) => hit(card(n, 76), String(n))), { gap: 10, maxW: 300 }) }],
        ask: `Can you find number ${target}?`,
        answer: { type: 'tap', correct: [String(target)] },
        reveal: { caption: `This is ${target}.`, sprite: card(target, 90) },
        more: [...r.shuffle(nums.filter((x) => x !== target)).slice(0, 2).map(find)],
        look: ['Which numbers does he mix up? 6 and 9, and 2 and 5, are the usual ones.'],
        easier: 'Use only 1, 2 and 3.',
        harder: 'Ask him to find the number that is one more than the one you say.',
        words: ['number'],
      };
    },
  }),

  A({
    id: 'numeral-to-set',
    title: 'Read it, make it',
    strand: 'numerals',
    skill: 'Matching numbers to amounts',
    needs: [],
    toys: ANY,
    minutes: 4,
    research: ['devmatters', 'wynn1990'],
    why: 'Matching a written number to the right amount of toys is on the 3-and-4-year-old maths list (up to 5).',
    make(r, level, ctx) {
      const toy = pickToy(r, ctx, this.toys);
      const n = r.int(...lv(level, [1, 3], [2, 5], [5, 10]));
      return {
        setup: ['Show him the number. Try not to say it for him.', `Have a pile of ${toy.many} ready.`],
        scenes: [{ sprite: card(n, 90) }],
        ask: `What number is this? Can you put that many ${toy.many} next to it?`,
        answer: { type: 'do' },
        reveal: { caption: `${n}. Count them together, next to the card.`, sprite: row([card(n, 60), flow(times(n, (i) => tag(toy.make(r), i + 1)), { maxW: 240 })], { gap: 12, align: 'middle' }) },
        more: [numQ(r, 'Put one more next to it. How many are there now?', n + 1)],
        look: ['Does he read the number himself?', 'Does he stop at the right amount?'],
        easier: 'Say the number as you show it.',
        harder: 'Lay out three number cards and make all three sets.',
        words: ['number', 'how many', 'the same as'],
      };
    },
  }),

  A({
    id: 'numicon-match',
    title: 'Which number is this shape?',
    strand: 'numerals',
    skill: 'Matching numbers to amounts',
    needs: [],
    toys: ['numicon'],
    minutes: 3,
    research: ['eef2020', 'devmatters'],
    why: 'Each Numicon shape is a fixed picture of its number, which gives the written numeral something to stand for.',
    make(r, level) {
      const n = r.int(...lv(level, [1, 5], [3, 10], [3, 10]));
      if (level === 3) {
        const opts = r.shuffle(choices(r, n, { min: 1, max: 10 }));
        return {
          setup: [`Put out three Numicon shapes: the ${list([...opts].sort((a, b) => a - b))}.`],
          scenes: [{ sprite: card(n, 86) }],
          ask: `This says ${n}. Which shape is the ${n} shape?`,
          answer: { type: 'pick', options: opts.map((v) => ({ key: String(v), sprite: numicon(v, 13) })), correct: String(n) },
          reveal: { caption: `The ${n} shape has ${plural(n, 'hole', 'holes')}.`, sprite: row([card(n, 56), numicon(n, 16)], { gap: 14, align: 'middle' }) },
          look: ['Does he know the shape on sight, or count the holes? Both are right.'],
          easier: 'Offer only two shapes to choose from.',
          harder: 'Put all ten shapes in order, smallest to biggest, then add the cards.',
          words: ['shape', 'holes', 'number'],
        };
      }
      const holes = (k) => `${plural(k, 'hole', 'holes')}, so it is the ${k} shape.`;
      const again = (m) => {
        return { ask: 'And which number goes with this one?', scenes: [{ sprite: numicon(m, 22) }], answer: { type: 'number', value: m, choices: choices(r, m, { min: 1, max: 10 }) }, reveal: { caption: holes(m) } };
      };
      return {
        more: r.sample(times(lv(level, 5, 8), (i) => i + lv(level, 1, 3)).filter((x) => x !== n), 2).map(again),
        setup: ['Hold up the Numicon shape.'],
        scenes: [{ sprite: numicon(n, 22) }],
        ask: 'Which number goes with this shape?',
        answer: { type: 'number', value: n, choices: choices(r, n, { min: 1, max: 10 }) },
        reveal: { caption: holes(n), sprite: row([numicon(n, 16), card(n, 56)], { gap: 14, align: 'middle' }) },
        look: ['Does he know the shape on sight, or count the holes? Both are right.'],
        easier: 'Use the 1 to 4 shapes.',
        harder: 'Give him the number card first and ask him to find the shape.',
        words: ['shape', 'holes', 'number'],
      };
    },
  }),

  A({
    id: 'number-hunt',
    title: 'Number hunt',
    strand: 'numerals',
    skill: 'Reading numbers',
    needs: [],
    toys: [],
    minutes: 5,
    research: ['eef2020', 'levine2010'],
    why: 'Maths talk that happens through the day, not just at a set time, is one of the main early-years recommendations.',
    make(r, level) {
      const n = r.int(...lv(level, [1, 5], [0, 9], [10, 20]));
      const places = r.sample(level === 3 ? ['a calendar', 'a book page', 'a ruler or tape measure'] : ['a clock', 'the TV remote', 'the front door', 'a book page', 'the oven', 'a calendar', 'a ruler or tape measure', 'a phone keypad', 'a car number plate'], 3);
      return {
        setup: ['Show him the number, then go looking around the house together.', `Good places to try: ${places.join(', ')}.`],
        scenes: [{ sprite: card(n, 96) }],
        ask: `This is ${n}. Can we find the number ${n} somewhere in the house?`,
        answer: { type: 'open' },
        look: ['Does he recognise it when it is a different size, colour or style?'],
        easier: 'Hunt for 1, 2 or 3.',
        harder: 'Hunt for two numbers at once, or for his age.',
        words: ['number', 'the same'],
      };
    },
  }),

  A({
    id: 'tower-labels',
    title: 'Which tower?',
    strand: 'numerals',
    skill: 'Matching numbers to amounts',
    needs: [],
    toys: ['duplo', 'cubes'],
    minutes: 3,
    research: ['devmatters', 'eef2020'],
    why: 'Picking the tower that matches a numeral links the symbol to an amount he can see and hold.',
    make(r, level, ctx) {
      const useCubes = has(ctx, 'cubes') && (!has(ctx, 'duplo') || r.bool(0.4));
      const [lo, hi] = lv(level, [1, 4], [2, 7], [5, 10]);
      const hs = r.sample(times(hi - lo + 1, (i) => lo + i), 3);
      const target = r.pick(hs);
      const mk = (h) => {
        const c = r.pick(BRICK_COLOURS);
        return useCubes ? rod(times(h, () => c), true) : tower(times(h, () => c));
      };
      const ts = hs.map((h) => ({ h, s: mk(h) }));
      const scene = (n) => ({ sprite: row([card(n, 64), row(ts.map((t) => hit(t.s, String(t.h))), { gap: 22 })], { gap: 26, align: 'bottom' }) });
      return {
        setup: [`Build three towers: ${hs.join(', ')} ${useCubes ? 'cubes' : 'bricks'} tall. Stand them side by side.`],
        scenes: [scene(target)],
        ask: `Which tower has ${target}?`,
        answer: { type: 'tap', correct: [String(target)] },
        reveal: { caption: `The tower with ${target}. Count to check.`, sprite: row(ts.map((t) => column([t.s, card(t.h, 36)], { gap: 5 })), { gap: 20, align: 'bottom' }) },
        more: hs.filter((h) => h !== target).map((h) => ({ ask: `Which tower has ${h}?`, scenes: [scene(h)], answer: { type: 'tap', correct: [String(h)] }, reveal: { caption: `The tower with ${h}.` } })),
        look: ['Does he count each tower, or go straight to it by size?'],
        easier: 'Make the towers very different: 1, 3 and 6.',
        harder: 'Hand him the three number cards and let him label every tower.',
        words: ['how many', 'taller', 'shorter'],
      };
    },
  }),

  A({
    id: 'missing-number',
    title: 'Who is hiding?',
    strand: 'numerals',
    skill: 'Number order',
    needs: [],
    toys: [],
    minutes: 3,
    research: ['ramani2008', 'devmatters'],
    why: 'Seeing numbers in a line, in order, builds a mental number line.',
    make(r, level) {
      const len = lv(level, 4, 5, 5);
      const start = lv(level, 1, r.int(1, 6), r.int(6, 16));
      const gapAt = r.int(1, len - (level === 1 ? 1 : 2));
      const nums = times(len, (i) => start + i);
      const missing = nums[gapAt];
      const h = 58;
      return {
        setup: ['Lay number cards in a row in order, with one turned face down. Or just use the picture.'],
        scenes: [{ sprite: row(nums.map((n, i) => (i === gapAt ? qbox(card(n, h).w, h) : card(n, h))), { gap: 5 }) }],
        ask: 'One number is hiding. Which one?',
        answer: { type: 'number', value: missing, choices: choices(r, missing, { min: 0 }) },
        reveal: { caption: `${missing}. Say them all in order, pointing.`, sprite: row(nums.map((n) => card(n, h)), { gap: 5 }) },
        more: [...(nums[len - 1] < 20 ? [numQ(r, `What number would come next, after ${nums[len - 1]}?`, nums[len - 1] + 1)] : []), { ask: 'Which of these numbers is the smallest?', answer: { type: 'number', value: nums[0], choices: [nums[0], ...r.sample(nums.filter((x, i) => i > 0 && i !== gapAt), 2)].sort((a, b) => a - b) } }],
        look: ['Does he count from the start to find it? That is the right strategy.'],
        easier: lv(level, 'Use 1, 2 and 3 and hide the last card.', 'Use 1 to 4 and hide the last card.'),
        harder: 'Hide two cards.',
        words: ['before', 'after', 'next', 'between'],
      };
    },
  }),

  A({
    id: 'next-number',
    title: 'What comes next?',
    strand: 'numerals',
    skill: 'Number order',
    needs: [],
    toys: [],
    minutes: 2,
    research: ['sarnecka2008', 'purpura2017'],
    why: '"After" and "before" are maths words, and knowing what comes next is the start of adding one.',
    make(r, level) {
      const before = level === 3 && r.bool(0.4);
      const n = r.int(...lv(level, [1, 4], [4, 9], [9, 19]));
      const value = before ? n - 1 : n + 1;
      const pic = (k) => ({ sprite: before ? row([qbox(54, 76), card(k, 76)], { gap: 8 }) : row([card(k, 76), qbox(54, 76)], { gap: 8 }) });
      return {
        setup: ['Show him the number.'],
        scenes: [pic(n)],
        ask: before ? `This is ${n}. What number comes just before ${n}?` : `This is ${n}. What number comes after ${n}?`,
        answer: { type: 'number', value, choices: choices(r, value, { min: 0 }) },
        reveal: { caption: `${value}. Count up to it together.`, sprite: row(times(3, (i) => card(Math.max(0, Math.min(n, value) - 1) + i, 54)), { gap: 5 }) },
        more: (before ? [numQ(r, `And what comes just before ${value}?`, value - 1)] : value < 20 ? [numQ(r, `And what comes after ${value}?`, value + 1)] : []).map((q) => ({ ...q, scenes: [pic(value)] })),
        look: ['Does he need to count from 1 to get there? That is fine, and it will speed up.'],
        easier: lv(level, 'Stay with 1, 2 and 3.', 'Stay below 5.', 'Stay below 10.'),
        harder: lv(level, 'Ask for the number before.', 'Ask for the number before.', 'Ask without showing him the number.'),
        words: ['after', 'before', 'next'],
      };
    },
  }),

  A({
    id: 'road-race',
    title: 'The road race',
    strand: 'numerals',
    skill: 'Number order',
    needs: ['Number cards, or paper and a pen'],
    toys: ['cars', 'animals', 'brio'],
    minutes: 6,
    research: ['ramani2008'],
    why: 'This is the board game from the research: a straight track numbered 1 to 10, a spinner with 1 and 2, and saying the numbers you land on. About an hour of play in total improved four different number skills in 4-year-olds.',
    make(r, level, ctx) {
      const n = lv(level, 5, 10, 10);
      const mover = has(ctx, 'cars') ? 'car' : has(ctx, 'brio') ? 'engine' : 'animal';
      return {
        setup: [
          `Make a straight track of ${n} spaces, numbered 1 to ${n} from left to right. Number cards in a row work.`,
          `Each choose a ${mover} and start to the left of number 1. Take turns to spin and move.`,
          'Say the numbers you land on as you move. On 3 and spin a 2? Say "4, 5", not "1, 2".',
        ],
        scenes: [{ caption: 'Start on the left, finish on the right', sprite: track(n, r) }],
        ask: level === 3 ? 'Spin first. Before you move, where will you land?' : 'Your turn to spin. Say the numbers as you go.',
        answer: { type: 'spinner', values: [1, 2] },
        look: ['Does he say the numbers on the squares, or count "1, 2" for his hops? Gently model the first.', 'Can he name the number he has landed on?'],
        easier: `Use a short track of 5${n === 5 ? ' (this one)' : ''}, and say the numbers with him.`,
        harder: lv(level, `Ask where he will land before he moves, or who is closer to ${n}.`, `Ask where he will land before he moves, or who is closer to ${n}.`, 'Ask who is closer to 10, and how many more to get there.'),
        words: ['next', 'further', 'closer', 'how many more'],
      };
    },
  }),

  A({
    id: 'order-cards',
    title: 'Put them in order',
    strand: 'numerals',
    skill: 'Number order',
    needs: ['Number cards, or paper and a pen'],
    toys: [],
    minutes: 4,
    research: ['devmatters', 'ramani2008'],
    why: 'Ordering numerals builds the sense that numbers sit in a fixed line, each one bigger than the last.',
    make(r, level) {
      const len = lv(level, 3, 5, 5);
      const start = lv(level, 1, 1, r.int(2, 6));
      const nums = times(len, (i) => start + i);
      let mixed = r.shuffle(nums);
      if (mixed.every((v, i) => v === nums[i])) mixed = [...nums].reverse();
      // answer buttons are numbers on the cards, so the biggest button is the biggest card
      const end = (ask, value) => ({ ask, answer: { type: 'number', value, choices: [value, ...r.sample(nums.filter((x) => x !== value), 2)].sort((a, b) => a - b) } });
      return {
        setup: [`Find number cards ${nums[0]} to ${nums[len - 1]} and mix them up in a row.`],
        scenes: [{ sprite: row(mixed.map((n) => card(n, 58)), { gap: 6 }) }],
        ask: 'These numbers are all muddled. Can you put them in order?',
        answer: { type: 'do' },
        reveal: { caption: 'Smallest on the left. Read them along the row.', sprite: row(nums.map((n) => card(n, 58)), { gap: 6 }) },
        more: [end('Which number is the biggest?', nums[len - 1]), end('Which number is the smallest?', nums[0])],
        look: ['Does he find the first number, then hunt for the next? Or place them by trial and error?'],
        easier: lv(level, 'Use just 1 and 2, then add 3.', 'Use 1, 2 and 3.'),
        harder: lv(level, 'Use 1 to 5.', 'Start from a number other than 1, or put a matching tower under each card.', 'Use more cards, or put a matching tower under each card.'),
        words: ['first', 'next', 'last', 'before', 'after'],
      };
    },
  }),
];
