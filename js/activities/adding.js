// Adding and taking away: small numbers, real objects, and "how many now?".
import {
  A, lv, plural, times, choices, pickToy, has, numQ,
  flow, row, column, tag, tower, rod, numicon, train, wagon, cube, engine, onTrack,
  arrow, cover, frame, text, sign, qbox, card,
  BRICK_COLOURS, MORE_COLOURS,
} from './kit.js';

const HIDE = ['cars', 'animals', 'duplo', 'cubes', 'brio'];
const hideout = (id) => ({ cars: ['garage', 'drive', 'into'], animals: ['barn', 'walk', 'into'], duplo: ['tin', 'drop', 'into'], cubes: ['tin', 'drop', 'into'], brio: ['tunnel', 'roll', 'into'] }[id]);

export default [
  A({
    id: 'hidden-add',
    title: 'How many in the garage?',
    strand: 'adding',
    skill: 'Adding more',
    needs: ['A box'],
    toys: HIDE,
    minutes: 4,
    age: 3,
    upTo: 5,
    research: ['huttenlocher1994', 'hughes1986', 'devmatters'],
    why: 'Young children can work out small sums with hidden objects well before they can answer "what is 2 and 1?". Keep the numbers very small.',
    make(r, level, ctx) {
      const toy = pickToy(r, ctx, this.toys);
      const [place, verb] = hideout(toy.id);
      const total = r.int(...lv(level, [2, 3], [3, 5], [5, 8]));
      const b = level === 1 ? 1 : r.int(1, Math.min(3, total - 1));
      const a = total - b;
      const box = () => frame(cover(64, 40), { label: place, pad: 5 });
      const items = times(total, () => toy.make(r)); // the same toys appear in the story and the answer
      return {
        setup: [`Find a box and turn it on its side. That is the ${place}.`, 'He must watch them go in, but not be able to see inside afterwards.'],
        scenes: [
          { caption: `First: ${verb} ${plural(a, toy.one, toy.many)} in.${a > 1 ? ' Count them as they go.' : ''}`, sprite: row([flow(items.slice(0, a), { maxW: 170, gap: 4 }), arrow(26), box()], { gap: 10, align: 'middle' }) },
          { caption: `Then: ${verb} ${b} more in.`, sprite: row([flow(items.slice(a), { maxW: 170, gap: 4 }), arrow(26), box()], { gap: 10, align: 'middle' }) },
        ],
        ask: `How many ${toy.many} are in the ${place} now?`,
        answer: { type: 'number', value: total, choices: choices(r, total, { min: 1 }) },
        reveal: { caption: `${a} and ${b} more makes ${total}. Lift the box and count.`, sprite: flow(items.map((s, i) => tag(s, i + 1))) },
        more: [numQ(r, `One more goes in. How many now?`, total + 1), numQ(r, lv(level, 'One comes out. How many are left inside?', 'Two come out. How many are left inside?'), total + 1 - lv(level, 1, 2))],
        look: ['Does he use fingers, or stare into space and work it out? Both are real thinking.', 'If he says the first number again, repeat the story slowly and let him try once more.'],
        easier: lv(level, 'Leave the box off, so he can see them and count.', 'Use 1 and 1, or 2 and 1.'),
        harder: lv(level, 'Add two more instead of one.', 'Take the toys away and just tell the story: "2 go in, then 1 more".'),
        words: ['first', 'then', 'now', 'altogether', 'more'],
      };
    },
  }),

  A({
    id: 'hidden-takeaway',
    title: 'Some drive away',
    strand: 'adding',
    skill: 'Taking away',
    needs: ['A box or tea towel'],
    toys: HIDE,
    minutes: 4,
    age: 3,
    upTo: 5,
    research: ['huttenlocher1994', 'hughes1986'],
    why: 'Taking away with hidden objects uses the same picture-in-the-head as adding, and works with numbers up to about 3 or 4 first.',
    make(r, level, ctx) {
      const toy = pickToy(r, ctx, this.toys);
      const [place, , ] = hideout(toy.id);
      const n = r.int(...lv(level, [2, 3], [3, 5], [5, 8]));
      const k = level === 1 ? 1 : r.int(1, Math.min(3, n - 1));
      const left = n - k;
      const box = () => frame(cover(64, 40), { label: place, pad: 5 });
      const items = times(n, () => toy.make(r)); // the first `left` stay, the rest come out
      return {
        setup: [`Put ${plural(n, toy.one, toy.many)} out and count them together.`, `Cover them all with a box or tea towel. That is the ${place}.`],
        scenes: [
          { caption: `First: ${n} go in the ${place}.`, sprite: row([flow(items, { maxW: 170, gap: 4 }), arrow(26), box()], { gap: 10, align: 'middle' }) },
          { caption: `Then: take ${k} out where he can see.`, sprite: row([box(), arrow(26), flow(items.slice(left), { maxW: 170, gap: 4 })], { gap: 10, align: 'middle' }) },
        ],
        ask: `How many are still in the ${place}?`,
        answer: { type: 'number', value: left, choices: choices(r, left, { min: 0 }) },
        reveal: { caption: `${n} take away ${k} leaves ${left}. Lift the cover and count.`, sprite: left ? flow(items.slice(0, left).map((s, i) => tag(s, i + 1))) : undefined },
        more: [numQ(r, 'One goes back in. How many are hiding now?', left + 1)],
        look: ['Does he count back, or hold up fingers and fold some down?'],
        easier: lv(level, 'Leave the cover off, so he can see what is left and count.', 'Start with 2 or 3 and take 1.'),
        harder: lv(level, 'Take two out at once.', 'Take some out, then take one more out. Ask again.'),
        words: ['take away', 'left', 'fewer', 'none'],
      };
    },
  }),

  A({
    id: 'hiding-part',
    title: 'How many am I hiding?',
    strand: 'adding',
    skill: 'Parts of a number',
    needs: ['A cup or tea towel'],
    toys: ['cubes', 'duplo', 'cars', 'animals'],
    levels: [2, 3],
    minutes: 3,
    age: 4,
    upTo: 5,
    research: ['ncetm', 'devmatters'],
    why: 'Seeing one part and working out the hidden part is how numbers get broken into pairs. It is a Reception-age idea, so this one is a stretch.',
    make(r, level, ctx) {
      const toy = pickToy(r, ctx, this.toys);
      const n = r.int(...lv(level, [3, 3], [3, 5], [5, 7]));
      const hidden = r.int(1, n - 1);
      const seen = n - hidden;
      const items = times(n, () => toy.make(r));
      return {
        setup: [`Count out ${plural(n, toy.one, toy.many)} together. Agree there are ${n}.`, `Ask him to shut his eyes. Hide ${hidden} under a cup or tea towel, and leave ${seen} showing.`],
        scenes: [{ sprite: row([flow(items.slice(0, seen), { maxW: 190, gap: 5 }), cover(70, 44)], { gap: 14, align: 'middle' }) }],
        ask: `There were ${n}. You can see ${seen}. How many am I hiding?`,
        answer: { type: 'number', value: hidden, choices: choices(r, hidden, { min: 0, max: n }) },
        reveal: { caption: `${hidden}. ${seen} and ${hidden} make ${n}.`, sprite: row([flow(items.slice(0, seen), { maxW: 150, gap: 5 }), sign('+'), flow(items.slice(seen), { maxW: 150, gap: 5 })], { gap: 10, align: 'middle' }) },
        more: [(() => {
          const h2 = n > 2 ? r.pick(times(n - 1, (i) => i + 1).filter((x) => x !== hidden)) : hidden;
          return { note: `Hide ${h2} this time and leave ${n - h2} showing.`, ask: `Eyes shut again… There are still ${n}. How many am I hiding now?`, scenes: [{ sprite: row([flow(items.slice(0, n - h2), { maxW: 190, gap: 5 }), cover(70, 44)], { gap: 14, align: 'middle' }) }], answer: { type: 'number', value: h2, choices: choices(r, h2, { min: 0, max: n }) }, reveal: { caption: `${h2}. ${n - h2} and ${h2} make ${n}.` } };
        })()],
        look: ['Does he count on from what he can see ("3… 4, 5: two!")?'],
        easier: 'Use 2 or 3 altogether, and let him watch you hide them.',
        harder: 'Let him hide some and you guess. Get it wrong sometimes so he can correct you.',
        words: ['altogether', 'hiding', 'and', 'makes'],
      };
    },
  }),

  A({
    id: 'numicon-pairs',
    title: 'Which shape fills the gap?',
    strand: 'adding',
    skill: 'Parts of a number',
    needs: [],
    toys: ['numicon'],
    minutes: 4,
    age: 4,
    upTo: 5,
    research: ['eef2020', 'ncetm'],
    why: 'Laying one shape on another shows that a number is made of smaller numbers, and he can check by fitting them together.',
    make(r, level) {
      const n = r.int(...lv(level, [3, 5], [5, 7], [7, 10]));
      const a = r.int(1, n - 1);
      const b = n - a;
      const opts = r.shuffle(choices(r, b, { min: 1, max: 10 }));
      return {
        setup: [`Put the ${n} shape flat on the table. Lay the ${a} shape on top of it.`, 'Put a few other shapes nearby to choose from.'],
        scenes: [{ sprite: row([numicon(n, 17), sign('='), numicon(a, 17), sign('+'), qbox(40, 46)], { gap: 10, align: 'middle' }) }],
        ask: 'Some holes are still showing. Which shape fits on top to cover them all?',
        answer: { type: 'pick', options: opts.map((v) => ({ key: String(v), sprite: numicon(v, 13) })), correct: String(b) },
        reveal: { caption: `The ${b} shape. ${a} and ${b} make ${n}.`, sprite: row([numicon(a, 17), sign('+'), numicon(b, 17), sign('='), numicon(n, 17)], { gap: 10, align: 'middle' }) },
        look: ['Does he try shapes until one fits? Trial and error is exactly right here. Later he will start to predict.', 'You may need to turn a shape round to make it fit.'],
        easier: lv(level, 'Put out just two shapes to choose from.', 'Use the 3, 4 or 5 shape as the big one.'),
        harder: 'Find a different pair that also covers it.',
        words: ['fits', 'and', 'makes', 'the same as'],
      };
    },
  }),

  A({
    id: 'two-colours',
    title: 'Two colours, one tower',
    strand: 'adding',
    skill: 'Parts of a number',
    needs: [],
    toys: ['duplo', 'cubes'],
    minutes: 3,
    age: 3,
    upTo: 5,
    research: ['ncetm', 'eef2020'],
    why: 'A tower in two colours shows the parts and the whole at once: some red, some blue, and one total.',
    make(r, level, ctx) {
      const useCubes = has(ctx, 'cubes') && (!has(ctx, 'duplo') || r.bool(0.4));
      const total = r.int(...lv(level, [2, 4], [4, 6], [6, 9]));
      const a = r.int(1, total - 1);
      const b = total - a;
      const [c1, c2] = r.sample(BRICK_COLOURS, 2);
      const cols = [...times(a, () => c1), ...times(b, () => c2)];
      const t = useCubes ? rod(cols, true) : tower(cols);
      const askPart = level === 3 && r.bool();
      const value = askPart ? b : total;
      return {
        setup: [`Build one tower: ${a} ${c1} at the bottom, then ${b} ${c2} on top.`],
        scenes: [{ sprite: t }],
        ask: askPart ? `There are ${total} altogether, and ${a} are ${c1}. How many are ${c2}?` : `How many ${useCubes ? 'cubes' : 'bricks'} are in the tower altogether?`,
        answer: { type: 'number', value, choices: choices(r, value, { min: 1 }) },
        reveal: { caption: `${a} ${c1} and ${b} ${c2} make ${total}.` },
        more: [...(askPart ? [numQ(r, `Put one more ${c2} on top. How many altogether now?`, total + 1)] : [numQ(r, `How many are ${c1}?`, a), numQ(r, `How many are ${c2}?`, b)])],
        look: ['Can he tell you each part and the total without mixing them up?'],
        easier: lv(level, 'Count each colour together, touching each one.', `Use 3 ${useCubes ? 'cubes' : 'bricks'}: 2 of one colour and 1 of the other.`),
        harder: 'Snap it apart at the colour change and ask again. Has the total changed?',
        words: ['and', 'altogether', 'part', 'makes'],
      };
    },
  }),

];
