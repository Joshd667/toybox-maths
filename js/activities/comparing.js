// Comparing: more, fewer, the same, and how many more.
import {
  A, lv, plural, times, choices, pickToy, has, numQ,
  flow, row, column, tag, tower, rod, duplo, cube, animal, car, hit, frame, text, gap,
  FARM, BRICK_COLOURS, MORE_COLOURS,
} from './kit.js';

const ANY = ['cars', 'animals', 'duplo', 'cubes', 'wooden'];

export default [
  A({
    id: 'who-has-more',
    title: 'Which has more?',
    strand: 'comparing',
    toys: ANY,
    minutes: 3,
    research: ['devmatters', 'purpura2017'],
    why: '"More" and "fewer" are among the first maths words on the curriculum, and teaching maths words was shown to improve maths itself.',
    make(r, level, ctx) {
      const toy = pickToy(r, ctx, this.toys);
      let a;
      let b;
      if (level === 1) {
        a = r.int(1, 3);
        b = a + r.int(3, 4);
      } else if (level === 2) {
        a = r.int(2, 5);
        b = a + r.int(1, 2);
      } else {
        a = r.int(4, 7);
        b = a + 1;
      }
      const moreOnLeft = r.bool();
      const askFewer = level > 1 && r.bool(0.4);
      const left = moreOnLeft ? b : a;
      const right = moreOnLeft ? a : b;
      // At step 3 the smaller group is spread out so it LOOKS bigger.
      const group = (n, spread) => frame(flow(times(n, () => toy.make(r)), { maxW: spread ? 150 : 120, gap: spread ? 16 : 3, rowGap: spread ? 14 : 4 }), { pad: 7, minW: 60 });
      const L = group(left, level === 3 && left < right);
      const Rt = group(right, level === 3 && right < left);
      const correct = (left > right) !== askFewer ? 'left' : 'right';
      return {
        setup: [`Make two groups of ${toy.many}: ${left} on one side and ${right} on the other.`, level === 3 ? 'Spread the smaller group out so it takes up more room.' : 'Keep a clear gap between the groups.'],
        scenes: [{ sprite: row([hit(L, 'left'), hit(Rt, 'right')], { gap: 14, align: 'middle' }) }],
        ask: askFewer ? 'Which group has fewer?' : 'Which group has more?',
        answer: { type: 'tap', correct: [correct] },
        reveal: { caption: `${Math.max(a, b)} is more than ${Math.min(a, b)}. Line them up in pairs to see the extra ${b - a === 1 ? 'one' : 'ones'}.` },
        more: [numQ(r, 'How many are in the bigger group?', b), numQ(r, 'How many more is that than the smaller group?', b - a, `${b - a} more.`, { min: 1 })],
        look: ['Does he judge by eye or count? For close numbers, counting or pairing up is the reliable way.'],
        easier: 'Make one group much bigger than the other.',
        harder: 'Ask "how many more?" after he has chosen.',
        words: ['more', 'fewer', 'the same'],
      };
    },
  }),

  A({
    id: 'fair-shares',
    title: 'Fair shares',
    strand: 'comparing',
    toys: ['animals'],
    minutes: 4,
    research: ['frydman1988', 'devmatters'],
    why: 'Dealing out "one for you, one for you" is how young children first make equal groups.',
    make(r, level, ctx) {
      const k = lv(level, 2, r.pick([2, 3]), r.pick([2, 3]));
      const each = r.int(...lv(level, [1, 2], [2, 3], [2, 4]));
      const extra = level === 3 ? 1 : 0;
      const total = k * each + extra;
      const kinds = r.sample(FARM, k);
      const food = has(ctx, 'cubes') ? () => cube('yellow') : () => duplo('yellow');
      const name = has(ctx, 'cubes') ? 'cubes' : 'bricks';
      return {
        setup: [`Stand ${k} animals apart from each other.`, `Give him ${total} ${name} in a pile. They are biscuits.`],
        scenes: [{ sprite: column([flow(times(total, food), { maxW: 220, gap: 4 }), row(kinds.map((a) => animal(a)), { gap: 34 })], { gap: 18 }) }],
        ask: `Can you share the biscuits so every animal gets the same?`,
        answer: { type: 'do' },
        reveal: {
          caption: extra ? `${each} each, and 1 left over. Ask him what to do with the spare one.` : `${each} each. Nobody has more than anybody else.`,
          sprite: row(kinds.map((a) => column([flow(times(each, food), { maxW: 46, gap: 3, rowGap: 3 }), animal(a)], { gap: 6 })), { gap: 26, align: 'bottom' }),
        },
        more: [numQ(r, 'How many biscuits did each animal get?', each)],
        look: ['Does he deal them out one at a time? That is the reliable method.', 'Does he check at the end that the piles match?'],
        easier: 'Two animals and 4 biscuits.',
        harder: 'Add one extra biscuit so it does not share out evenly.',
        words: ['share', 'the same', 'fair', 'each', 'left over'],
      };
    },
  }),

  A({
    id: 'taller-tower',
    title: 'Taller and shorter',
    strand: 'comparing',
    toys: ['duplo', 'cubes'],
    minutes: 3,
    research: ['devmatters', 'ncetm'],
    why: 'Standing two towers side by side turns "more" into something he can see, and "how many more" into bricks he can count.',
    make(r, level, ctx) {
      const useCubes = has(ctx, 'cubes') && (!has(ctx, 'duplo') || r.bool(0.4));
      const a = r.int(...lv(level, [1, 3], [2, 5], [3, 6]));
      const d = r.int(...lv(level, [3, 4], [1, 2], [2, 4]));
      const b = a + d;
      const tallLeft = r.bool();
      const [ca, cb] = r.sample(BRICK_COLOURS, 2);
      const mk = (n, c) => (useCubes ? rod(times(n, () => c), true) : tower(times(n, () => c)));
      const L = tallLeft ? mk(b, cb) : mk(a, ca);
      const Rt = tallLeft ? mk(a, ca) : mk(b, cb);
      const thing = useCubes ? 'cubes' : 'bricks';
      const base = { more: [numQ(r, 'How many are in the tall tower?', b)], setup: [`Build two towers, one with ${a} ${thing} and one with ${b}. Stand them side by side on the table.`], words: ['taller', 'shorter', 'the same', 'how many more'] };
      if (level === 1) {
        const askShort = r.bool(0.4);
        return {
          ...base,
          scenes: [{ sprite: row([hit(L, 'left'), hit(Rt, 'right')], { gap: 34 }) }],
          ask: askShort ? 'Which tower is shorter?' : 'Which tower is taller?',
          answer: { type: 'tap', correct: [tallLeft !== askShort ? 'left' : 'right'] },
          reveal: { caption: `The ${b} tower is taller. The ${a} tower is shorter.` },
          look: ['Does he use the words himself? Say them back in a full sentence: "Yes, the red one is taller."'],
          easier: 'Make one tower much taller.',
          harder: 'Ask how many more the short one needs to catch up.',
        };
      }
      return {
        ...base,
        scenes: [{ sprite: row([L, Rt], { gap: 34 }) }],
        ask: 'How many more does the short tower need to be the same as the tall one?',
        answer: { type: 'number', value: d, choices: choices(r, d, { min: 1, max: 6 }) },
        reveal: { caption: `${d} more. Add them one at a time until the tops are level.`, sprite: row([L, Rt, text('needs ' + d + ' more', 12, { bold: true })], { gap: 18, align: 'middle' }) },
        look: ['Does he add bricks until they match and then count what he added? That is a good way in.'],
        easier: 'Just ask which is taller.',
        harder: 'Ask how many to take off the tall one instead.',
      };
    },
  }),

  A({
    id: 'one-more-than-mine',
    title: 'Build one like mine',
    strand: 'comparing',
    toys: ['duplo', 'cubes'],
    minutes: 4,
    research: ['devmatters', 'sarnecka2008'],
    why: 'Making "the same" and then "one more" compares two amounts without needing big numbers.',
    make(r, level, ctx) {
      const useCubes = has(ctx, 'cubes') && (!has(ctx, 'duplo') || r.bool(0.4));
      const n = r.int(...lv(level, [2, 4], [2, 5], [3, 7]));
      const rule = lv(level, 'same', 'more', r.pick(['fewer', 'two more']));
      const target = { same: n, more: n + 1, fewer: n - 1, 'two more': n + 2 }[rule];
      const words = { same: 'the same number as', more: 'one more than', fewer: 'one fewer than', 'two more': 'two more than' }[rule];
      const mk = (k, c) => (useCubes ? rod(times(k, () => c), true) : tower(times(k, () => c)));
      return {
        setup: [`Build a tower of ${n} and stand it in front of him.`, 'Give him a pile of loose bricks.'],
        scenes: [{ caption: 'Your tower', sprite: mk(n, 'red') }],
        ask: `This is my tower. Can you build one with ${words} mine?`,
        answer: { type: 'do' },
        reveal: { caption: `Mine has ${n}. His should have ${target}.`, sprite: row([column([mk(n, 'red'), text('mine', 11)], { gap: 4 }), column([mk(target, 'blue'), text('his', 11)], { gap: 4 })], { gap: 30, align: 'bottom' }) },
        more: [numQ(r, 'How many are in your tower?', target)],
        look: ['Does he build alongside yours and compare, or count yours first?'],
        easier: 'Ask for one exactly the same.',
        harder: 'Ask for one fewer, or two more.',
        words: ['the same', 'one more', 'one fewer'],
      };
    },
  }),

  A({
    id: 'enough-garages',
    title: 'Enough for everyone?',
    strand: 'comparing',
    toys: ['cars', 'animals'],
    minutes: 4,
    research: ['gelman1978', 'devmatters'],
    why: 'Matching one to one shows which group has more without counting at all, and makes "how many more do we need" a real problem.',
    make(r, level, ctx) {
      const cars = has(ctx, 'cars') && (!has(ctx, 'animals') || r.bool(0.6));
      const n = r.int(...lv(level, [2, 4], [3, 6], [4, 8]));
      const short = level === 1 ? r.pick([0, Math.min(2, n - 1)]) : r.int(0, Math.min(lv(level, 2, 2, 3), n - 1));
      const homes = n - short;
      const item = cars ? () => car(r.pick(MORE_COLOURS)) : () => animal(r.pick(FARM));
      const home = () => duplo('blue', 4);
      const things = cars ? 'cars' : 'animals';
      const place = cars ? 'parking space' : 'bed';
      const scene = column([flow(times(n, item), { gap: 6 }), flow(times(homes, home), { gap: 8 })], { gap: 14 });
      const base = {
        setup: [`Put out ${n} ${things}.`, `Lay out ${plural(homes, 'long Duplo brick', 'long Duplo bricks')} in a row. Each one is a ${place}.`],
        scenes: [{ sprite: scene }],
        words: ['enough', 'not enough', 'one each', 'how many more'],
        more: [numQ(r, `How many ${things} are there altogether?`, n)],
        look: ['Does he match them up one by one to find out?'],
        easier: 'Use 2 or 3, with none missing or lots missing.',
        harder: `Ask how many more ${place}s are needed.`,
      };
      if (level === 1)
        return {
          ...base,
          ask: `Is there a ${place} for every one of the ${things}?`,
          answer: { type: 'pick', options: [{ key: 'yes', label: 'Yes, enough' }, { key: 'no', label: 'No, not enough' }], correct: short === 0 ? 'yes' : 'no' },
          reveal: { caption: short === 0 ? 'Yes. One each, none left over.' : `No. ${short} of the ${things} have nowhere to go.` },
        };
      return {
        ...base,
        ask: `Every one needs its own ${place}. How many more ${place}s do we need?`,
        answer: { type: 'number', value: short, choices: choices(r, short, { min: 0, max: 5 }) },
        reveal: { caption: short === 0 ? 'None. There is one each already.' : `${short} more. Put each one on its ${place} to see who is left out.` },
      };
    },
  }),
];
