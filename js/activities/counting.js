// Counting: saying one number for each thing, and knowing the last number is "how many".
import {
  A, lv, plural, times, choices, pickToy, has, numQ,
  flow, scatter, row, column, tag, card, dots, tower, rod, numicon, train, wagon, cube, duplo, animal,
  arrow, cover, frame, text, FARM, BRICK_COLOURS, MORE_COLOURS,
} from './kit.js';

const ANY = ['cars', 'animals', 'duplo', 'cubes', 'wooden'];

export default [
  A({
    id: 'count-line',
    title: 'How many are there?',
    strand: 'counting',
    skill: 'Counting things',
    needs: [],
    toys: [...ANY, 'brio'],
    minutes: 3,
    age: 2.5,
    research: ['gelman1978', 'mix2012', 'devmatters'],
    why: 'Touching each toy once with one number each, then saying the total again, is what links counting to "how many".',
    make(r, level, ctx) {
      const toy = pickToy(r, ctx, this.toys);
      const n = r.int(...lv(level, [2, 5], [4, 8], [7, 12]));
      const vals = times(n, () => r.pick(toy.vary));
      const items = vals.map((v) => toy.make(r, v));
      const v = r.pick(vals);
      const k = vals.filter((x) => x === v).length;
      return {
        setup: [`Put out ${plural(n, toy.one, toy.many)} ${level === 3 ? 'in a jumble' : 'in a line'}.`],
        scenes: [{ sprite: level === 3 ? scatter(items, r) : flow(items) }],
        ask: `How many ${toy.many} are there?`,
        answer: { type: 'number', value: n, choices: choices(r, n, { min: 1 }) },
        reveal: {
          caption: `There are ${n}. Say the total first, then count them, touching each one as you go.`,
          sprite: flow(items.map((s, i) => tag(s, i + 1))),
        },
        more: [
          numQ(r, `How many are ${toy.say(v)}?`, k, `${k}. Point to each one.`),
          numQ(r, `One more ${toy.one} comes along. How many now?`, n + 1, `${n + 1}. One more than ${n}.`),
        ],
        look: [
          'Does he touch each toy once, with one number for each?',
          'Ask "so how many?" afterwards. Does he say the last number, or start counting again?',
        ],
        easier: 'Use fewer toys, spaced out in a line.',
        harder: lv(level, 'Jumble them up.', 'Jumble them up.', 'Add a few more toys.') + ' Show him how to slide each one aside as he counts it.',
        words: ['how many', 'altogether'],
      };
    },
  }),

  A({
    id: 'give-n',
    title: 'Bring me…',
    strand: 'counting',
    skill: 'Counting out',
    needs: ['A plate or box'],
    toys: ANY,
    minutes: 4,
    age: 3,
    research: ['wynn1990', 'sarnecka2008'],
    why: 'Fetching exactly the right number is harder than counting a line, and shows whether a number word really means that amount to him.',
    make(r, level, ctx) {
      const toy = pickToy(r, ctx, this.toys);
      const n = r.int(...lv(level, [1, 4], [3, 7], [6, 10]));
      return {
        setup: [`Put a pile of at least ${n + 4} ${toy.many} a few steps away from you.`, 'Sit with an empty plate or box in front of you.'],
        scenes: [{ sprite: row([card(n, 70), dots(n, n <= 6 ? 'dice' : 'pairs')], { gap: 14, align: 'middle' }) }],
        ask: `Can you bring me ${plural(n, toy.one, toy.many)}?`,
        answer: { type: 'do' },
        reveal: { caption: `Count what he brought together. It should be ${n}.`, sprite: flow(times(n, (i) => tag(toy.make(r), i + 1))) },
        more: [numQ(r, 'Now fetch one more. How many have I got?', n + 1, `${n + 1}. One more than ${n}.`)],
        look: ['Does he count them out and stop, or grab a handful?', 'If the number is wrong, ask "Is that ' + n + '? Can you check?" before fixing it yourself.'],
        easier: lv(level, 'Ask for 1 or 2.', 'Ask for 1, 2 or 3.'),
        harder: 'Ask for a bigger number, or ask for "one more than that".',
        words: ['how many', 'enough', 'too many'],
      };
    },
  }),

  A({
    id: 'feed-animals',
    title: 'One each',
    strand: 'counting',
    skill: 'Counting out',
    needs: ['Duplo bricks or cubes for dinners'],
    toys: ['animals'],
    minutes: 4,
    age: 2.5,
    research: ['gelman1978', 'devmatters'],
    why: 'Giving one to each is the same one-to-one matching that counting depends on.',
    make(r, level, ctx) {
      const n = r.int(...lv(level, [2, 4], [4, 6], [5, 8]));
      const kinds = times(n, () => r.pick(FARM));
      const food = has(ctx, 'cubes') && r.bool() ? { name: 'cubes', make: () => cube('green') } : { name: 'Duplo bricks', make: () => duplo('green') };
      return {
        setup: [`Stand ${n} animals in a row.`, `Put a pile of ${food.name} nearby. They are the animals' dinner.`],
        scenes: [{ sprite: flow(kinds.map((k) => animal(k)), { gap: 10 }) }],
        ask: 'Every animal is hungry. Can you give each one a dinner? How many dinners did you need?',
        answer: { type: 'number', value: n, choices: choices(r, n, { min: 1 }) },
        reveal: {
          caption: `${n} animals, so ${n} dinners. One each.`,
          sprite: flow(kinds.map((k, i) => tag(column([animal(k), food.make()], { gap: 4 }), i + 1)), { gap: 10 }),
        },
        more: [
          { ask: 'Are there more animals, more dinners, or the same?', answer: { type: 'pick', options: [{ key: 'a', label: 'More animals' }, { key: 'd', label: 'More dinners' }, { key: 's', label: 'The same' }], correct: 's' }, reveal: { caption: `The same: ${n} and ${n}.` } },
          numQ(r, 'One more animal comes for dinner. How many dinners do we need now?', n + 1),
        ],
        look: ['Does every animal get exactly one?', 'Does he know how many dinners without recounting, because he counted the animals?'],
        easier: lv(level, 'Use 2 animals.', 'Use 2 or 3 animals.'),
        harder: 'Ask him to fetch the right number of dinners in one trip.',
        words: ['one each', 'enough', 'the same number'],
      };
    },
  }),

  A({
    id: 'quick-look',
    title: 'Quick look',
    strand: 'counting',
    skill: 'Seeing without counting',
    needs: [],
    toys: [],
    minutes: 2,
    age: 3,
    research: ['clements1999', 'devmatters'],
    why: 'Seeing "three" at a glance without counting is called subitising. It is one of the first things on the 3-and-4-year-old maths list.',
    make(r, level) {
      let last = 0;
      const one = () => {
        let n;
        do n = r.int(...lv(level, [1, 3], [1, 5], [3, 6])); while (n === last); // never the same number twice running
        last = n;
        const how = level === 1 ? 'dice' : level === 2 ? r.pick(['dice', 'line']) : r.pick(['dice', 'loose', 'pairs']);
        const d = dots(n, how, r);
        return {
          ask: 'How many dots did you see? No counting, just look.',
          scenes: [{ sprite: d, flash: 2 }],
          answer: { type: 'number', value: n, choices: choices(r, n, { min: 1, max: 7 }) },
          reveal: { caption: `${n}. Show him again and say the number.`, sprite: d },
        };
      };
      return {
        setup: ['Hold the phone where he can see it.', 'The dots show for two seconds, then hide.'],
        ...one(),
        more: [one(), one()],
        look: ['Is the answer quick? Quick means he saw it. Slow usually means he counted in his head.'],
        easier: lv(level, 'Keep to 1 and 2.', 'Keep to 1, 2 and 3.'),
        harder: 'Do it with real toys: put a few under a tea towel, lift it for a moment, cover them again.',
        words: ['how many'],
      };
    },
  }),

  A({
    id: 'count-wagons',
    title: 'How many wagons?',
    strand: 'counting',
    skill: 'Counting things',
    needs: ['Bricks or cubes to load'],
    toys: ['brio'],
    minutes: 3,
    age: 2.5,
    research: ['gelman1978', 'gunderson2011'],
    why: 'Counting only the wagons, and not the engine, means deciding what counts before you start.',
    make(r, level) {
      const n = r.int(...lv(level, [1, 3], [2, 5], [4, 6]));
      const loaded = times(n, () => level === 3 && r.bool(0.45));
      if (level === 3 && !loaded.some(Boolean)) loaded[r.int(0, n - 1)] = true;
      if (level === 3 && loaded.every(Boolean)) loaded[r.int(0, n - 1)] = false;
      const ws = loaded.map((l) => wagon(level < 3 || l ? cube(r.pick(MORE_COLOURS)) : null, r.pick(['blue', 'green', 'yellow'])));
      const full = loaded.filter(Boolean).length;
      const value = level === 3 ? full : n;
      return {
        setup: [`Hook ${plural(n, 'wagon', 'wagons')} behind the engine.`, level === 3 ? `Put a brick or cube on ${full} of them and leave the rest empty.` : 'Put a brick or cube on each wagon.'],
        scenes: [{ sprite: train(ws) }],
        ask: level === 3 ? 'How many wagons are carrying something?' : 'How many wagons is the engine pulling?',
        answer: { type: 'number', value, choices: choices(r, value, { min: 0 }) },
        reveal: { caption: level === 3 ? `${value}. Only the full wagons count this time.` : `${value}. The engine is not a wagon.` },
        more: [...(level === 3
          ? [numQ(r, 'How many wagons altogether, full and empty?', n)]
          : [numQ(r, 'Unhook the last wagon. How many is the engine pulling now?', n - 1, undefined, { min: 0 }), numQ(r, 'Hook it back on, and one more. How many now?', n + 1)])],
        look: ['Does he leave out the engine? If he counts it, ask "is that one a wagon?"'],
        easier: lv(level, 'One or two wagons.', 'One or two wagons.', 'Put something on every wagon and count them all.'),
        harder: lv(level, 'Leave some wagons empty and ask how many are carrying something.', 'Leave some wagons empty and ask how many are carrying something.', 'Ask how many wagons are empty.'),
        words: ['how many', 'empty', 'full'],
      };
    },
  }),

  A({
    id: 'one-more',
    title: 'One more',
    strand: 'counting',
    skill: 'One more',
    needs: [],
    toys: ['duplo', 'cubes'],
    minutes: 3,
    age: 3,
    research: ['sarnecka2008', 'devmatters'],
    why: 'Knowing that the next number means exactly one more is the idea that turns the counting chant into real numbers.',
    make(r, level) {
      const n = r.int(...lv(level, [1, 3], [3, 6], [6, 9]));
      const fewer = level === 3 && r.bool(0.4);
      const c = r.pick(BRICK_COLOURS);
      const value = fewer ? n - 1 : n + 1;
      const before = times(n, () => c);
      const after = fewer ? before.slice(1) : [...before, 'yellow'];
      const scene = (bricks) => ({ sprite: row([tower(bricks), text(fewer ? 'take 1 off' : 'and 1 more', 12, { bold: true }), fewer ? arrow(24) : duplo('yellow')], { gap: 10, align: 'middle' }) });
      return {
        setup: [`Build a tower of ${n}. Count it together so you both agree it is ${n}.`, fewer ? 'Hold your hand ready to take the top one off.' : 'Hold one more brick in your hand.'],
        scenes: [scene(before)],
        ask: fewer ? `There are ${n}. If I take one off, how many will there be?` : `There are ${n}. If I put one more on, how many will there be?`,
        answer: { type: 'number', value, choices: choices(r, value, { min: 0 }) },
        reveal: { caption: `${value}. Do it and count to check.`, sprite: tower(after) },
        more: [{ ...(fewer ? numQ(r, 'And if I take one more off?', value - 1) : numQ(r, 'And one more again?', value + 1)), scenes: [scene(after)] }],
        look: ['Does he answer straight away, or need to count from 1 again? Both are fine. Straight away shows he knows what comes next.'],
        easier: lv(level, 'Start from 1.', 'Start from 1 or 2.'),
        harder: `Ask before he sees the tower: "I have ${n}. One more makes…?"`,
        words: ['one more', 'one fewer', 'next'],
      };
    },
  }),

  A({
    id: 'numicon-holes',
    title: 'Fill the holes',
    strand: 'counting',
    skill: 'Counting out',
    needs: ['Numicon pegs or small cubes'],
    toys: ['numicon'],
    minutes: 3,
    age: 3,
    research: ['eef2020', 'gelman1978'],
    why: 'One peg in each hole is one-to-one matching you can see, and each shape always looks like its number.',
    make(r, level) {
      const n = r.int(...lv(level, [1, 4], [3, 7], [6, 10]));
      return {
        setup: ['Put the Numicon shape on the table with a pile of pegs (or small cubes).'],
        scenes: [{ sprite: numicon(n, 22) }],
        ask: 'Can you put a peg in every hole? How many pegs did it take?',
        answer: { type: 'number', value: n, choices: choices(r, n, { min: 1, max: 10 }) },
        reveal: { caption: `${n} holes, ${n} pegs. This is the ${n} shape.` },
        more: [numQ(r, 'Take one peg out. How many pegs are left?', n - 1, undefined, { min: 0, max: 10 })],
        look: ['Does he count the pegs or the holes? Either works, and it is worth noticing they match.'],
        easier: lv(level, 'Use the 1 and 2 shapes.', 'Use the 1, 2, 3 and 4 shapes.'),
        harder: 'Hide the shape in a bag and let him feel how many holes before he looks.',
        words: ['how many', 'one in each', 'the same number'],
      };
    },
  }),

  A({
    id: 'count-sounds',
    title: 'Listen and count',
    strand: 'counting',
    skill: 'Counting things',
    needs: ['A tin or saucepan', 'A handful of bricks'],
    toys: [],
    minutes: 2,
    age: 4,
    research: ['gelman1978', 'devmatters'],
    why: 'Anything can be counted, including sounds you cannot see or touch.',
    make(r, level) {
      let last = 0;
      const one = (first) => {
        let n;
        do n = r.int(...lv(level, [1, 3], [2, 5], [4, 7])); while (n === last); // never the same number twice running
        last = n;
        return {
          note: `${first ? '' : 'Tip them out. '}Eyes closed. Drop ${plural(n, 'brick', 'bricks')} in, slowly, one at a time.`,
          scenes: [{ sprite: row([flow(times(n, () => duplo('red')), { maxW: 150, gap: 4 }), arrow(26), frame(text('clonk', 13, { bold: true }), { label: 'tin', pad: 10 })], { gap: 10, align: 'middle' }) }],
          ask: 'How many bricks did you hear?',
          answer: { type: 'number', value: n, choices: choices(r, n, { min: 1 }) },
          reveal: { caption: `${n}. Tip them out and count to check.` },
        };
      };
      return {
        setup: ['Find a tin or saucepan and a handful of bricks.', 'He closes his eyes while you drop some in.'],
        ...one(true),
        more: [one(), one()],
        look: ['Does he count under his breath or on fingers as he listens? That is a good strategy.'],
        easier: 'Drop 1 or 2, with a long pause between.',
        harder: 'Clap instead, a little faster.',
        words: ['how many', 'listen'],
      };
    },
  }),

  A({
    id: 'spot-mistake',
    title: 'Did Teddy count right?',
    strand: 'counting',
    skill: 'Counting things',
    needs: ['A teddy or toy animal'],
    toys: ANY,
    minutes: 4,
    age: 3,
    research: ['gelmanmeck1983', 'gelman1978'],
    why: 'Children can often spot a counting mistake before they can count that many themselves. Catching it means they know the rules.',
    make(r, level, ctx) {
      const toy = pickToy(r, ctx, this.toys);
      const n = r.int(...lv(level, [3, 4], [4, 6], [5, 8]));
      const items = times(n, () => toy.make(r));
      // One of Teddy's counts. kind says what (if anything) goes wrong.
      const count = (kind) => {
        let labels = times(n, (i) => i + 1);
        let ok = true;
        let said = n;
        let what = 'Teddy touched each one once and said the numbers in order.';
        let how = 'Touch each toy once, saying the numbers in order.';
        if (kind === 'backwards') {
          labels = times(n, (i) => n - i);
          what = 'Teddy started from the other end, but still touched each one once. Any order works.';
          how = 'Start from the far end and count back along the line.';
        } else if (kind === 'skip') {
          const k = r.int(1, n - 1);
          labels = times(n, (i) => (i < k ? i + 1 : i === k ? null : i));
          ok = false;
          said = n - 1;
          what = `Teddy missed one out, so said ${n - 1}. There are really ${n}.`;
          how = 'Skip over the toy with no number, without touching it.';
        } else if (kind === 'double') {
          const k = r.int(0, n - 1);
          labels = times(n, (i) => (i < k ? i + 1 : i === k ? [k + 1, k + 2] : i + 2));
          ok = false;
          said = n + 1;
          what = `Teddy counted one toy twice, so said ${n + 1}. There are really ${n}.`;
          how = 'Touch the toy with two numbers twice.';
        } else if (kind === 'muddle') {
          const k = r.int(1, n - 2);
          labels[k] = k + 2;
          labels[k + 1] = k + 1;
          ok = false;
          said = labels[n - 1];
          what = 'Teddy said the numbers in a muddled order.';
          how = 'Say the numbers in the muddled order shown.';
        }
        return {
          note: `Make Teddy count out loud as the picture shows. ${how} Finish with "There are ${said}!"`,
          scenes: [{ caption: 'What Teddy says at each toy', sprite: flow(items.map((s, i) => tag(s, labels[i]))) }],
          ask: 'Did Teddy count them right?',
          answer: { type: 'pick', options: [{ key: 'yes', label: 'Yes, right' }, { key: 'no', label: 'No, a mistake' }], correct: ok ? 'yes' : 'no' },
          reveal: { caption: what + (ok ? '' : ' Ask him to show Teddy how to do it.'), sprite: flow(items.map((s, i) => tag(s, i + 1))) },
        };
      };
      const kinds = r.shuffle(lv(level, ['skip', 'double', 'right'], ['skip', 'double', 'right'], ['skip', 'double', 'muddle', 'backwards', 'right'])).slice(0, 3);
      const [first, ...rest] = kinds.map(count);
      return {
        setup: [`Line up ${plural(n, toy.one, toy.many)}.`, 'Pick a teddy or animal to do the counting.'],
        ...first,
        more: rest,
        look: ['Can he say what went wrong, not just that something did?'],
        easier: 'Make the mistake big and slow: skip a toy with a pause.',
        harder: lv(level, 'Have Teddy start at the other end and count correctly. Is that allowed? (It is.)', 'Have Teddy start at the other end and count correctly. Is that allowed? (It is.)', 'Use more toys, and make the mistake quick and quiet.'),
        words: ['each one', 'once', 'missed', 'twice'],
      };
    },
  }),

];
