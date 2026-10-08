// Sorting, shape and measuring: comparing by colour, kind, shape, length and height.
import {
  A, lv, times, has, list, plural, pickToy, choices, an, prop, numQ, trackList, mirror, sized,
  row, column, flow, tower, rod, duplo, model, cube, car, animal, block, dots, flat, train, wagon, engine, onTrack, trackPlan, numicon,
  frame, ring, text, arrow, hit, cover, gap, qbox, sp, at,
  BRICK_COLOURS, MORE_COLOURS, FARM, BLOCK_NAME,
} from './kit.js';

export default [
  A({
    id: 'sort-rule',
    title: 'Where does this one go?',
    strand: 'measures',
    skill: 'Sorting',
    needs: ['Spare toys to hold up as the new one', 'Cars and animals together, or long and square Duplo bricks, for Medium', 'A car, a brick and a cube in each of two colours for Hard'],
    toys: ['cars', 'animals', 'duplo', 'cubes', 'wooden'],
    minutes: 4,
    age: 2.5,
    upTo: 4,
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
      let because = `it is ${c1}`;
      let again = '';
      if (level === 1) {
        const toy = pickToy(r, ctx, ['cars', 'duplo', 'cubes', 'wooden']);
        L = times(3, () => toy.make(r, c1));
        Rt = times(3, () => toy.make(r, c2));
        mk = (first) => toy.make(r, first ? c1 : c2);
        rule = `colour: ${c1} on one side, ${c2} on the other`;
        setup = `Sort six ${toy.many} into two groups by colour: ${c1} and ${c2}.`;
      } else if (level === 2 && has(ctx, 'duplo') && (!(has(ctx, 'cars') && has(ctx, 'animals')) || r.bool(0.5))) {
        // by size: long bricks against square ones, colours mixed so colour cannot be the rule
        L = times(3, () => duplo(r.pick(BRICK_COLOURS), 4));
        Rt = times(3, () => duplo(r.pick(BRICK_COLOURS), 2));
        mk = (first) => duplo(r.pick(BRICK_COLOURS), first ? 4 : 2);
        rule = 'size: long bricks on one side, square bricks on the other. Colour does not matter';
        setup = 'Sort three long Duplo bricks and three square ones into two groups. Mix the colours up.';
        because = 'it is a long one';
        again = 'Sort the same bricks a second way: by colour.';
      } else if (level === 2) {
        L = times(3, () => car(r.pick(MORE_COLOURS)));
        Rt = times(3, () => animal(r.pick(FARM)));
        mk = (first) => (first ? car(r.pick(MORE_COLOURS)) : animal(r.pick(FARM)));
        rule = 'things with wheels on one side, animals on the other. Colour does not matter';
        setup = 'Sort three cars and three animals into two groups. Mix the colours up.';
        because = 'it is a car';
        again = 'Sort just the cars a second way: by colour.';
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
        look: [`Can he say why? "Because ${because}" is the real answer; the tap is just the start.`],
        easier: lv(level, 'Use two colours that look very different, and say the colour as you hold each one up.', 'Sort by colour with one kind of toy.'),
        harder: lv(level, 'Add a third colour and a third group.', again, 'Sort the same toys a second way: by kind this time.'),
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
    age: 3,
    upTo: 5,
    research: ['devmatters', 'ncetm', 'laski2015'],
    why: 'Putting three or more things in order of size means comparing each one with two neighbours at once.',
    make(r, level, ctx) {
      const useCubes = has(ctx, 'cubes') && (!has(ctx, 'duplo') || r.bool(0.4));
      const k = lv(level, 3, 4, 5);
      const hs = level === 1 ? r.pick([[1, 3, 5], [1, 2, 4], [1, 2, 5], [2, 3, 5]]) : r.sample([1, 2, 3, 4, 5, 6, 7], k);
      const sorted = [...hs].sort((a, b) => a - b);
      let mixed = r.shuffle(hs);
      if (mixed.every((v, i) => v === sorted[i])) mixed = [...sorted].reverse();
      const cs = {};
      const one = r.pick(MORE_COLOURS); // Easy: every tower the same colour, so height is the only thing that changes
      hs.forEach((h, i) => (cs[h] = level === 1 ? one : MORE_COLOURS[i % 6]));
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
    age: 2.5,
    upTo: 4,
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
    age: 3,
    upTo: 5,
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
    age: 3,
    upTo: 4,
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
  A({
    id: 'track-longer',
    title: 'Which track is longer?',
    strand: 'measures',
    skill: 'Longer and taller',
    needs: [],
    toys: ['brio'],
    minutes: 4,
    age: 3,
    upTo: 5,
    research: ['ncetm', 'devmatters'],
    why: 'Length is one of the measures in the six areas of early maths. A bendy track shows whether he is judging how far it reaches or how much track there is. This rests on curriculum guidance, not on a study of track.',
    make(r, level) {
      let top;
      let bottom;
      let longKey;
      let setup;
      let caption;
      let nLong;
      let nShort;
      if (level === 3) {
        let [bendy, straight] = r.pick([['LLRR', 'SSS'], ['SLLRRS', 'SSSSS'], ['LLRRRRLL', 'SSSSSS']]);
        if (r.bool()) bendy = mirror(bendy);
        nLong = bendy.length;
        nShort = straight.length;
        const bendyTop = r.bool();
        [top, bottom] = bendyTop ? [trackPlan(bendy), trackPlan(straight)] : [trackPlan(straight), trackPlan(bendy)];
        longKey = bendyTop ? 'top' : 'bottom';
        setup = [`Build a straight track with ${plural(nShort, 'long straight', 'long straights')}, and a bendy one with ${trackList(bendy)}.`, 'Lay them side by side, starting level.'];
        caption = `The bendy one: ${nLong} pieces against ${nShort}. It does not reach as far, but there is more track to drive along.`;
      } else {
        nShort = r.int(...lv(level, [1, 2], [2, 4]));
        nLong = nShort + lv(level, 2, 1);
        const longTop = r.bool();
        const long = trackPlan('S'.repeat(nLong));
        // Medium: the shorter track is pushed along so the far ends are level, and he has to look at both ends
        const short = level === 2 ? row([gap(long.w - trackPlan('S'.repeat(nShort)).w), trackPlan('S'.repeat(nShort))], { gap: 0 }) : trackPlan('S'.repeat(nShort));
        [top, bottom] = longTop ? [long, short] : [short, long];
        longKey = longTop ? 'top' : 'bottom';
        setup = [`Build two straight tracks: one with ${plural(nShort, 'long straight', 'long straights')}, one with ${nLong}.`, level === 2 ? 'Lay them side by side with the far ends level, so the near ends are not.' : 'Lay them side by side, starting level.'];
        caption = `The one with ${nLong} pieces. Line up one end of each to check.`;
      }
      return {
        setup,
        scenes: [{ caption: 'Seen from above', sprite: column([hit(top, 'top'), hit(bottom, 'bottom')], { gap: 16, align: 'left' }) }],
        ask: level === 3 ? 'Which track is the longer drive for the train?' : 'Which track is longer?',
        answer: { type: 'tap', correct: [longKey] },
        reveal: { caption },
        more: [numQ(r, 'How many pieces long is the longer track?', nLong, undefined, { min: 1 }), numQ(r, 'How many more pieces does it have than the other one?', nLong - nShort, undefined, { min: 1 })],
        look: [level === 3 ? 'Does he pick the one that reaches further? Drive a train along each, counting the pieces as it goes.' : 'Does he look at both ends, or only at the end that sticks out?', 'The curves and the long straights are about the same length, so counting pieces is a fair way to measure.'],
        easier: lv(level, 'One piece against four.', 'Start them level at one end.', 'Straighten the bendy track out next to the other one.'),
        harder: lv(level, 'Push the shorter track along so the far ends are level.', 'Bend the longer track so it does not reach as far.', 'Build the two tracks far apart and ask how he could check.'),
        words: ['longer', 'shorter', 'the same length', 'straight', 'bendy', 'how many pieces'],
      };
    },
  }),

  A({
    id: 'brick-swap',
    title: 'How many small bricks?',
    strand: 'measures',
    skill: 'Longer and taller',
    needs: [],
    toys: ['duplo'],
    minutes: 3,
    age: 3,
    upTo: 5,
    research: ['devmatters', 'ncetm'],
    why: 'Two square bricks cover one long brick. Finding that out by pressing them on is combining shapes, which is on the 3-and-4-year-old list, and a first go at measuring one thing with another. This rests on curriculum guidance.',
    make(r, level) {
      const cs = r.shuffle(BRICK_COLOURS);
      const top = r.pick(BRICK_COLOURS);
      if (level === 3) {
        // the other way round: squares first, how many long bricks match them
        const squares = r.pick([4, 6, 8]);
        const longs = squares / 2;
        const line = (w, n, y, colour) => times(n, (i) => ({ x: i * w, y, w, colour: colour || cs[i % 4] }));
        return {
          setup: [`Press ${squares} square bricks in a line onto a base plate, or line them up on the table.`, 'Give him a pile of long bricks.'],
          scenes: [{ sprite: model(line(2, squares, 0)) }],
          ask: 'How many long bricks make a line just as long as this?',
          answer: { type: 'number', value: longs, choices: choices(r, longs, { min: 1 }) },
          reveal: { caption: `${longs}. Each long brick covers two square ones.`, sprite: model([...line(2, squares, 0), ...line(4, longs, 1, top)]) },
          more: [numQ(r, 'How many square bricks are underneath?', squares, undefined, { min: 1 }), numQ(r, 'Add two more square bricks to the line. How many long bricks now?', longs + 1, undefined, { min: 1 })],
          look: ['Does he lay the long bricks on top to check?', 'Say it back: "one long brick is as long as two square ones".'],
          easier: 'Start with long bricks and cover them with square ones.',
          harder: 'Give him 5 square bricks. Can long bricks match that exactly? Why not?',
          words: ['as long as', 'the same length', 'cover', 'long', 'short'],
        };
      }
      const longs = r.int(...lv(level, [1, 2], [2, 4]));
      const extra = level === 2 && r.bool(0.5) ? 1 : 0; // Medium: sometimes one square brick is in the line as well
      const n = longs * 2 + extra;
      const base = times(longs, (i) => ({ x: i * 4, y: 0, w: 4, colour: cs[i % 4] }));
      if (extra) base.push({ x: longs * 4, y: 0, w: 2, colour: cs[longs % 4] });
      return {
        setup: [`Put ${plural(longs, 'long brick', 'long bricks')}${extra ? ' and one square brick' : ''} end to end in a line.`, 'Give him a pile of square bricks.'],
        scenes: [{ sprite: model(base) }],
        ask: 'How many square bricks does it take to cover the whole line?',
        answer: { type: 'number', value: n, choices: choices(r, n, { min: 1 }) },
        reveal: { caption: `${n}. Two square bricks cover each long one.`, sprite: model([...base, ...times(n, (i) => ({ x: i * 2, y: 1, w: 2, colour: top }))]) },
        more: [numQ(r, 'How many long bricks are underneath?', longs, undefined, { min: 1 }), numQ(r, 'Add one more long brick to the line. How many square bricks to cover it all now?', n + 2, undefined, { min: 1 })],
        look: ['Does he press the square bricks on to check, or guess?', 'Say it back: "two square bricks are as long as one long brick".'],
        easier: lv(level, 'One long brick and two square ones. Do they match?', 'One long brick at a time.'),
        harder: lv(level, 'Use three long bricks in the line.', 'Line up six square bricks and ask how many long ones match them.'),
        words: ['as long as', 'the same length', 'cover', 'long', 'short'],
      };
    },
  }),

  A({
    id: 'big-little',
    title: 'Big and little',
    strand: 'measures',
    skill: 'Bigger and smaller',
    needs: [],
    toys: ['animals', 'cars'],
    minutes: 3,
    age: 2.5,
    upTo: 4,
    research: ['serasmith1987', 'devmatters'],
    why: 'Even 2-year-olds use "big" and "little" as comparisons between the things in front of them. Bringing in a bigger toy and asking again shows him that big depends on what it is next to.',
    make(r, level, ctx) {
      const n = lv(level, 2, 3, r.int(4, 5));
      const t = sized(r, ctx, level === 1 ? 3 : n); // Easy draws a third, bigger toy for the follow-up
      const pic = (items) => ({ caption: 'Yours will look different', sprite: row(items.map((i) => i.sprite), { gap: 12 }) });
      const doQ = (ask, caption, extra = {}) => ({ ask, answer: { type: 'do' }, ...(caption ? { reveal: { caption } } : {}), ...extra });
      const common = {
        look: ['A toy duck can be bigger than a toy elephant. Go by the toys in front of him, not the real animals.', 'Stand them side by side on the same surface so the comparison is fair.'],
        words: ['big', 'little', 'bigger', 'smaller', 'biggest', 'smallest', 'in the middle'],
      };
      if (level === 1) {
        const two = r.shuffle(t.items.slice(0, 2));
        const askBig = r.bool();
        return {
          setup: [`Pick any two ${t.many} that are clearly different sizes. The picture is only an example.`, 'Keep a third, much bigger toy out of sight.'],
          scenes: [pic(two)],
          ...doQ(askBig ? 'Which one is big?' : 'Which one is little?', 'He points to it or picks it up.'),
          more: [
            doQ(askBig ? 'Which one is little?' : 'Which one is big?'),
            doQ('Which one is big now?', 'The new one. The one that was big is the middle one now: big depends on what it is next to.', { note: 'Bring out the third, much bigger toy and stand it with the others.', scenes: [pic(r.shuffle(t.items))] }),
          ],
          ...common,
          easier: 'Use two toys of the same kind, one tiny and one huge.',
          harder: 'With all three out, ask which is the biggest and which is the smallest.',
        };
      }
      if (level === 2) {
        return {
          setup: [`Pick any three ${t.many} that are clearly different sizes. The picture is only an example.`, 'Stand them in a muddled row.'],
          scenes: [pic(r.shuffle(t.items))],
          ...doQ('Which one is the biggest?'),
          more: [doQ('Which one is the smallest?'), doQ('Which one is in the middle: not the biggest and not the smallest?', 'Ask "is it big or little?" Both answers are right: it is bigger than one and smaller than the other.')],
          ...common,
          easier: 'Use two toys. Which is big, and which is little?',
          harder: 'Ask him to line them up from the smallest to the biggest.',
        };
      }
      return {
        setup: [`Pick any ${n} ${t.many} that are all different sizes. The picture is only an example.`, 'Stand them in a muddled row. Keep one more toy back.'],
        scenes: [pic(r.shuffle(t.items))],
        ...doQ('Can you line them up from the smallest to the biggest?', 'Like steps going up.', {}),
        reveal: { caption: 'Like steps going up.', sprite: row(t.items.map((i) => i.sprite), { gap: 12 }) },
        more: [doQ('Which one comes just after the smallest?'), doQ('Where does this one go in the line?', 'He has to compare it with the ones on both sides.', { note: 'Hand him the toy you kept back.' })],
        ...common,
        easier: 'Three toys that are very different sizes.',
        harder: 'Line them up from the biggest to the smallest instead.',
      };
    },
  }),

  A({
    id: 'three-sizes',
    title: 'Daddy, Mummy, Baby',
    strand: 'measures',
    skill: 'Bigger and smaller',
    needs: [],
    toys: ['duplo', 'cubes'],
    minutes: 4,
    age: 3,
    upTo: 4,
    research: ['rattermann1998', 'serasmith1987'],
    why: 'In one study, 3-year-olds were far better at finding "the same size in my set" once the three sizes were called Daddy, Mummy and Baby. It was a small study, with 3-year-olds only.',
    make(r, level, ctx) {
      const useCubes = has(ctx, 'cubes') && (!has(ctx, 'duplo') || r.bool(0.4));
      const unit = useCubes ? 'cubes' : 'bricks';
      const [c1, c2] = r.sample(MORE_COLOURS, 2);
      const mine = [1, 2, 3];
      const yours = level === 1 ? [1, 2, 3] : [2, 3, 4]; // from Medium on, his family is taller, so "same height" is the wrong answer
      const ROLE = ['Baby', 'Mummy', 'Daddy'];
      const SIZE = ['shortest', 'middle', 'tallest'];
      const mk = (h, c) => (useCubes ? rod(times(h, () => c), true) : tower(times(h, () => c)));
      const myOrder = level === 3 ? r.shuffle(mine) : mine;
      const yourOrder = level === 1 ? yours : r.shuffle(yours);
      const roles = r.shuffle(lv(level, [0, 2], [0, 2], [1, 2, 0])); // which family member to ask about, in turn
      const question = (k, first) => {
        const lure = yours.includes(mine[k]) && yours.indexOf(mine[k]) !== k;
        return {
          note: `Point to your ${ROLE[k]} tower, the ${SIZE[k]} one.`,
          ask: `This is my ${ROLE[k]} one. Which is your ${ROLE[k]} one?`,
          scenes: [
            {
              sprite: row(
                [
                  frame(row(myOrder.map((h) => (h === mine[k] ? ring(mk(h, c1)) : mk(h, c1))), { gap: 10 }), { label: 'my towers', pad: 8 }),
                  frame(row(yourOrder.map((h) => hit(mk(h, c2), 'h' + h)), { gap: 12 }), { label: 'your towers', pad: 8 }),
                ],
                { gap: 12, align: 'bottom' }
              ),
            },
          ],
          answer: { type: 'tap', correct: ['h' + yours[k]] },
          reveal: { caption: `The ${SIZE[k]} one in his family, with ${plural(yours[k], useCubes ? 'cube' : 'brick', unit)}.${lure ? ' Not the one that is the same height as yours.' : ''}${first ? ' Name his three together: Daddy, Mummy, Baby.' : ''}` },
        };
      };
      const [first, ...rest] = roles.slice(0, 2).map((k, i) => question(k, i === 0));
      return {
        setup: [
          `Build two families of towers: yours ${list(mine.map(String))} ${c1} ${unit} tall, his ${list(yours.map(String))} ${c2} ${unit} tall.`,
          level === 1 ? 'Stand each family in a row, shortest to tallest.' : level === 2 ? 'Stand yours in a row, shortest to tallest. Muddle his.' : 'Muddle both families.',
          'Name yours together first: Daddy is the tallest, Mummy the middle one, Baby the shortest.',
        ],
        ...first,
        more: [...rest, numQ(r, `How many ${unit} are in your Daddy tower?`, yours[2], undefined, { min: 1 })],
        look: [level === 1 ? 'Can he use the three names for his own towers without help?' : 'Does he pick the tower that is the same height as yours? That is the usual slip at 3. Name his three together and ask again.'],
        easier: lv(level, 'Two towers each: just Daddy and Baby.', 'Make both families the same heights.', 'Stand both families in order, shortest to tallest.'),
        harder: lv(level, 'Make his family one taller all round, so the same height is not the same name.', 'Muddle your own towers too, and ask about Mummy.', 'Try it with three animals or cars of different sizes against his three towers.'),
        words: ['tallest', 'shortest', 'middle', 'the same', 'bigger', 'smaller'],
      };
    },
  }),

  A({
    id: 'numicon-same',
    title: 'Find one the same',
    strand: 'measures',
    skill: 'Sorting',
    needs: ['The feely bag from the kit, or a pillowcase, for Medium and Hard'],
    toys: ['numicon'],
    minutes: 3,
    age: 3,
    upTo: 4,
    research: ['carbonneau2013', 'laski2015', 'eef2020'],
    why: 'Matching a shape to its twin, by eye and then by feel, gets him used to how each number looks before any counting. Coming back to the same plain objects again and again is one of the habits the research on objects to handle supports.',
    make(r, level) {
      let n;
      let others;
      if (level === 3) {
        n = r.int(3, 8);
        others = [n - 1, n + 1, n + 2];
      } else {
        n = r.int(1, 10);
        const far = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].filter((v) => Math.abs(v - n) >= (level === 1 ? 3 : 2));
        others = r.sample(far, 2);
      }
      const set = r.shuffle([n, ...others]);
      const shapes = row(set.map((v) => numicon(v, 13)), { gap: 9 });
      const bag = level > 1;
      return {
        setup: [`You need two ${n} shapes, and the ${list([...others].sort((a, b) => a - b).map(String))} shapes.`, bag ? 'Keep one of the twins. Put all the others in the bag. No peeking.' : 'Keep one of the twins. Lay the others out in front of him.'],
        scenes: [{ sprite: row([numicon(n, 17), arrow(22), frame(shapes, { label: bag ? 'in the bag' : 'on the table', pad: 8 })], { gap: 12, align: 'middle' }) }],
        ask: bag ? 'Can you find one the same as mine, just by feeling?' : 'Can you find one the same as mine?',
        answer: { type: 'do' },
        reveal: { caption: `The ${n} shape. Lay one on top of the other to check: no holes left over.` },
        more: [numQ(r, 'How many holes does it have?', n, undefined, { min: 1, max: 10 }), level === 3 ? { ask: 'Put it back. Now can you feel for the one that is one hole bigger?', answer: { type: 'do' }, reveal: { caption: `The ${n + 1} shape.` } } : { ask: bag ? 'Tip them all out. Which shape is the biggest?' : 'Which of these shapes is the biggest?', answer: { type: 'do' }, reveal: { caption: `The ${Math.max(...set)} shape.` } }],
        look: ['Does he check by laying one on the other?', bag ? 'What does he say about how it feels? Feed him the words: long, short, a bump on top, flat on top.' : 'Does he go by colour or by shape? Both work here. The bag takes colour away.'],
        easier: lv(level, 'Two shapes to choose from, one tiny and one huge.', 'Let him look in the bag first, then feel.', 'Use shapes that are further apart in size.'),
        harder: lv(level, 'Put them in a bag and find it by feel.', 'Use shapes that are close in size.', 'He holds one up and you find its twin with your eyes shut. He checks you.'),
        words: ['the same', 'different', 'bigger', 'smaller', 'bump', 'flat'],
      };
    },
  }),
];
