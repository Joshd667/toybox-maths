// Sorting, shape and measuring: comparing by colour, kind, shape, length and height.
import {
  A, lv, times, has, list, pickToy, choices, an, prop, numQ,
  row, column, flow, tower, rod, duplo, cube, car, animal, block, dots, flat, ramp, train, wagon, engine, onTrack,
  frame, text, arrow, hit, cover, gap, qbox, sp, at,
  BRICK_COLOURS, MORE_COLOURS, FARM, BLOCK_NAME,
} from './kit.js';

export default [
  A({
    id: 'sort-rule',
    title: 'Where does this one go?',
    strand: 'measures',
    skill: 'Sorting',
    needs: ['Spare toys to hold up as the new one', 'Cars and animals together for Medium', 'A car, a brick and a cube in each of two colours for Hard'],
    toys: ['cars', 'animals', 'duplo', 'cubes', 'wooden'],
    minutes: 4,
    research: ['ncetm', 'eef2020'],
    why: 'Sorting means deciding what is the same about things and ignoring what is different, which is the root of every comparison in maths.',
    make(r, level, ctx) {
      const [c1, c2] = r.sample(BRICK_COLOURS, 2);
      const grp = (items) => frame(flow(items, { maxW: 124, gap: 5, rowGap: 5 }), { pad: 8, minW: 110 });
      let L; // the first group
      let Rt; // the second group
      let mk; // mk(true) makes a new thing that belongs with L, mk(false) with Rt
      let rule;
      let setup;
      if (level === 1) {
        const toy = pickToy(r, ctx, ['cars', 'duplo', 'cubes', 'wooden']);
        L = times(3, () => toy.make(r, c1));
        Rt = times(3, () => toy.make(r, c2));
        mk = (first) => toy.make(r, first ? c1 : c2);
        rule = `colour: ${c1} on one side, ${c2} on the other`;
        setup = `Sort six ${toy.many} into two groups by colour: ${c1} and ${c2}.`;
      } else if (level === 2) {
        L = times(3, () => car(r.pick(MORE_COLOURS)));
        Rt = times(3, () => animal(r.pick(FARM)));
        mk = (first) => (first ? car(r.pick(MORE_COLOURS)) : animal(r.pick(FARM)));
        rule = 'things with wheels on one side, animals on the other. Colour does not matter';
        setup = 'Sort three cars and three animals into two groups. Mix the colours up.';
      } else {
        L = [car(c1), duplo(c1), cube(c1)];
        Rt = [car(c2), duplo(c2), cube(c2)];
        mk = (first) => r.pick([car, (c) => block('cube', c), (c) => block('roof', c)])(first ? c1 : c2);
        rule = `colour: everything ${c1} on one side, everything ${c2} on the other, whatever kind of toy it is`;
        setup = `Make two mixed groups: a ${c1} car, brick and cube, and a ${c2} car, brick and cube.`;
      }
      const swapped = r.bool(); // which side of the picture the first group is drawn on
      const groups = () => row(swapped ? [hit(grp(Rt), 'left'), hit(grp(L), 'right')] : [hit(grp(L), 'left'), hit(grp(Rt), 'right')], { gap: 12, align: 'top' });
      const firsts = r.shuffle([true, false, r.bool()]); // the three new ones never all go to the same group
      const question = (ask, i) => {
        const first = firsts[i];
        return {
          ask,
          scenes: [{ sprite: column([row([text('new one', 11, { bold: true }), mk(first)], { gap: 8, align: 'middle' }), groups()], { gap: 14 }) }],
          answer: { type: 'tap', correct: [first !== swapped ? 'left' : 'right'] },
          reveal: { caption: `The rule is ${rule}.` },
        };
      };
      return {
        setup: [setup, 'Do not tell him the rule. Hold up a new one each time.'],
        ...question('I am sorting. Which group does this one belong in?', 0),
        more: [question('And this one?', 1), question('And this one?', 2)],
        look: [`Can he say why? "Because it is ${level === 2 ? 'a car' : c1}" is the real answer; the tap is just the start.`],
        easier: lv(level, 'Use two colours that look very different, and say the colour as you hold each one up.', 'Sort by colour with one kind of toy.'),
        harder: lv(level, 'Add a third colour and a third group.', 'Sort just the cars a second way: by colour.', 'Sort the same toys a second way: by kind this time.'),
        words: ['the same', 'different', 'belongs', 'sort', 'because'],
      };
    },
  }),

  A({
    id: 'order-size',
    title: 'Shortest to tallest',
    strand: 'measures',
    skill: 'Longer and taller',
    needs: [],
    toys: ['duplo', 'cubes'],
    minutes: 4,
    research: ['devmatters', 'ncetm'],
    why: 'Putting three or more things in order of size means comparing each one with two neighbours at once.',
    make(r, level, ctx) {
      const useCubes = has(ctx, 'cubes') && (!has(ctx, 'duplo') || r.bool(0.4));
      const k = lv(level, 3, 4, 5);
      const hs = level === 1 ? r.pick([[1, 3, 5], [1, 2, 4], [1, 2, 5], [2, 3, 5]]) : r.sample([1, 2, 3, 4, 5, 6, 7], k);
      const sorted = [...hs].sort((a, b) => a - b);
      let mixed = r.shuffle(hs);
      if (mixed.every((v, i) => v === sorted[i])) mixed = [...sorted].reverse();
      const cs = {};
      hs.forEach((h, i) => (cs[h] = MORE_COLOURS[i % 6]));
      const mk = (h) => (useCubes ? rod(times(h, () => cs[h]), true) : tower(times(h, () => cs[h])));
      return {
        setup: [`Build ${k} towers with ${list(sorted.map(String))} ${useCubes ? 'cubes' : 'bricks'}. Stand them in a muddled row.`],
        scenes: [{ sprite: row(mixed.map(mk), { gap: 14 }) }],
        ask: 'Can you line them up from the shortest to the tallest?',
        answer: { type: 'do' },
        reveal: { caption: 'Like stairs going up.', sprite: row(sorted.map(mk), { gap: 14 }) },
        more: [numQ(r, `How many ${useCubes ? 'cubes' : 'bricks'} are in the tallest tower?`, sorted[k - 1], undefined, { min: 1 }), numQ(r, `How many ${useCubes ? 'cubes' : 'bricks'} are in the shortest tower?`, sorted[0], undefined, { min: 1 })],
        look: ['Does he find the shortest and tallest first, then fit the middle ones in?', 'Make sure they all stand on the same flat surface, or the comparison is unfair.'],
        easier: lv(level, 'Just two towers. Which is taller?', 'Three towers that are very different heights.'),
        harder: 'Hand him one more tower and ask where it fits.',
        words: ['shortest', 'tallest', 'taller than', 'shorter than', 'in order'],
      };
    },
  }),

  A({
    id: 'longer-train',
    title: 'Which train is longer?',
    strand: 'measures',
    skill: 'Longer and taller',
    needs: [],
    toys: ['brio'],
    minutes: 3,
    research: ['devmatters', 'ncetm'],
    why: 'Comparing lengths fairly means lining up one end. Children often judge by which one sticks out further.',
    make(r, level) {
      const a = r.int(...lv(level, [1, 2], [1, 3], [2, 3]));
      const b = a + lv(level, 2, 1, 1);
      const longTop = r.bool();
      const mk = (n, c) => row([...times(n, () => wagon(null, c)), engine(c === 'blue' ? 'red' : 'green')], { gap: 1 });
      const [cLong, cShort] = r.shuffle(['blue', 'yellow']); // so the colour never gives the answer away
      const long = mk(b, cLong);
      const short = mk(a, cShort);
      const shift = level === 3 ? 44 : 0; // step 3: the shorter train is pushed forward so its nose sticks out
      // Engines face right. Both rows are the same total width so the picture lines up.
      const longRow = row([long, gap(shift || 0.1)], { gap: 0 });
      const shortRow = row([gap(long.w - short.w + shift), short], { gap: 0 });
      const top = longTop ? longRow : shortRow;
      const bottom = longTop ? shortRow : longRow;
      const lineUp = (s) => s;
      return {
        setup: [`Make two trains: an engine with ${a} ${a === 1 ? 'wagon' : 'wagons'}, and an engine with ${b}.`, level === 3 ? 'Park them side by side with the shorter train pushed further forward.' : 'Park them side by side with the engines level.'],
        scenes: [{ sprite: column([hit(onTrack(lineUp(top), 4), 'top'), hit(onTrack(lineUp(bottom), 4), 'bottom')], { gap: 14, align: 'left' }) }],
        ask: 'Which train is longer?',
        answer: { type: 'tap', correct: [longTop ? 'top' : 'bottom'] },
        reveal: { caption: `The one with ${b} wagons. Line the engines up nose to nose to check.` },
        more: [numQ(r, 'How many wagons are on the longer train?', b), numQ(r, 'How many more wagons does it have than the short one?', b - a, undefined, { min: 1 })],
        look: [level === 3 ? 'Does he pick the one that sticks out in front? Line them up and look again together.' : 'Does he look along the whole train, or count the wagons? Either works.'],
        easier: 'One wagon against three.',
        harder: lv(level, 'Push the shorter train forward so it pokes out in front.', 'Push the shorter train forward so it pokes out in front.', 'Park the trains far apart and ask how he could check.'),
        words: ['longer', 'shorter', 'line up', 'the same length'],
      };
    },
  }),

  A({
    id: 'shape-hunt',
    title: 'Is it a triangle?',
    strand: 'measures',
    skill: 'Shapes',
    needs: [],
    toys: [],
    minutes: 3,
    research: ['fisher2013', 'devmatters'],
    why: 'In a guided-play study, 4- and 5-year-olds learned what really makes a shape (three straight sides, three corners) better than through free play or being told.',
    make(r, level) {
      const quad = level === 3 && r.bool(0.4);
      const yes = quad ? ['square', 'rect', 'rectTall', 'diamond', 'kite'] : lv(level, ['tri', 'triDown', 'triRight'], ['tri', 'triThin', 'triRight', 'triWide', 'triDown'], ['tri', 'triThin', 'triWide', 'triDown', 'triRight']);
      const no = quad ? ['tri', 'pent', 'circle', 'oval', 'triRight'] : lv(level, ['circle', 'square', 'rect'], ['triRound', 'triOpen', 'square', 'diamond'], ['triRound', 'triOpen', 'triBlunt', 'kite']);
      const nYes = lv(level, 2, 3, 3);
      const picks = r.shuffle([...r.sample(yes, nYes).map((k) => ({ k, ok: true })), ...r.sample(no, lv(level, 2, 3, 3)).map((k) => ({ k, ok: false }))]);
      const name = quad ? 'shapes with four straight sides' : 'triangles';
      return {
        setup: ['Hold the phone where he can reach. He can tap more than one.'],
        scenes: [{ sprite: flow(picks.map((p, i) => hit(flat(p.k, r.pick(MORE_COLOURS)), String(i))), { gap: 14, maxW: 190, rowGap: 14 }) }],
        ask: `Can you tap all the ${name}?`,
        answer: { type: 'tap', multi: true, correct: picks.map((p, i) => (p.ok ? String(i) : null)).filter(Boolean) },
        reveal: { caption: quad ? 'Count the sides with a finger: four straight sides and four corners, whatever the shape looks like.' : 'A triangle has three straight sides and three corners. Upside down, long or thin, it is still a triangle. Curvy sides or a gap, and it is not.' },
        look: ['Does he reject a triangle for being upside down or skinny? Run a finger round it and count sides together.', 'Then hunt for triangle faces on the wooden blocks.'],
        easier: lv(level, 'Find a triangle face on a real block and run his finger round it first.', 'Triangles against circles and squares only.'),
        harder: lv(level, 'Include shapes that nearly are triangles: curvy sides, a gap, or the top cut off.', 'Include shapes that nearly are triangles: curvy sides, a gap, or the top cut off.', 'Ask him to tell you why each of the others is not one.'),
        words: ['sides', 'corners', 'straight', 'curved', 'pointy'],
      };
    },
  }),

  A({
    id: 'feely-bag',
    title: 'Feely bag',
    strand: 'measures',
    skill: 'Shapes',
    needs: ['A bag or pillowcase'],
    toys: ['wooden'],
    minutes: 4,
    research: ['devmatters', 'zosh2015'],
    why: 'Feeling for a shape without looking makes him think about flat faces, corners and curves, and gives you both plenty of shape words to use.',
    make(r, level) {
      const sets = lv(level, [['cube', 'cyl'], ['roof', 'cyl'], ['brick', 'cyl']], [['cube', 'cyl', 'roof'], ['brick', 'roof', 'cyl']], [['cube', 'brick', 'pillar', 'roof'], ['cube', 'brick', 'arch', 'cyl']]);
      const set = r.shuffle(r.pick(sets));
      const c = r.pick(MORE_COLOURS);
      const find = (target, ask) => ({
        ask,
        scenes: [{ sprite: row([block(target, c), arrow(24), cover(74, 48)], { gap: 12, align: 'middle' }) }],
        answer: { type: 'do' },
        reveal: { caption: `The ${BLOCK_NAME[target]}. Talk about how he knew.` },
      });
      return {
        setup: [`Put these blocks in a bag or pillowcase: ${list(set.map((s) => an(BLOCK_NAME[s])))}.`, 'Show him the picture. No peeking in the bag.'],
        ...find(set[0], 'Can you find this one just by feeling?'),
        more: set.slice(1, 3).map((t) => find(t, 'Put it back. Now can you find this one?')),
        look: ['What does he say about how it feels? Feed him the words: flat, pointy, round, corners, edges, rolls.'],
        easier: lv(level, 'Let him feel both blocks and look at them before they go in the bag.', 'Two very different blocks, such as a cube and a cylinder.'),
        harder: 'Describe a block without naming it ("it has a point and three flat sides") and let him find it.',
        words: ['flat', 'round', 'corner', 'edge', 'pointy', 'rolls'],
      };
    },
  }),
];
