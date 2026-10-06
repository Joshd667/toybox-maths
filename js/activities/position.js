// Position words: on, under, behind, between, first, last… said, heard and acted out.
import {
  A, lv, times, has, list,
  row, column, model, build, block, car, animal, bunny, engine, frame, text, arrow, hit, tag, flag, scale, layer, flow,
  BRICK_COLOURS, MORE_COLOURS, FARM,
} from './kit.js';

function figure(r, ctx) {
  if (has(ctx, 'bunny')) return { name: 'rabbit', s: bunny() };
  const k = r.pick(['duck', 'pig', 'sheep']);
  return { name: k, s: animal(k) };
}

// One random "put the toy somewhere" picture and the sentence that goes with it.
function placement(r, level, ctx) {
  const f = figure(r, ctx);
  const [c1, c2] = r.sample(MORE_COLOURS, 2);
  const rel = r.pick(lv(level, ['on top of', 'under', 'next to', 'in'], ['behind', 'in front of', 'between', 'under', 'next to'], ['two']));
  const cubeBig = (c) => build([{ shape: 'brick', colour: c, x: 0, y: 0 }, { shape: 'brick', colour: c, x: 0, y: 1 }]);
  const small = scale(f.s, 0.72);
  if (rel === 'on top of') return { f, rel, words: `on top of the ${c1} block`, sprite: column([f.s, block('brick', c1)], { gap: 0 }), need: `a ${c1} block` };
  if (rel === 'next to') return { f, rel, words: `next to the ${c1} block`, sprite: row(r.bool() ? [block('cube', c1), f.s] : [f.s, block('cube', c1)], { gap: 5 }), need: `a ${c1} block` };
  if (rel === 'in') return { f, rel, words: 'in the box', sprite: frame(f.s, { label: 'box', pad: 7 }), need: 'a small box or tub' };
  if (rel === 'under') {
    const bridge = build([{ shape: 'pillar', colour: c1, x: 0, y: 0 }, { shape: 'pillar', colour: c1, x: 2.2, y: 0 }, { shape: 'plank', colour: c2, x: 0.1, y: 2 }]);
    return { f, rel, words: 'under the bridge', sprite: layer([[bridge, 0, 0], [small, (bridge.w - small.w) / 2, bridge.h - small.h]]), need: 'a bridge made from two tall blocks and a flat one' };
  }
  if (rel === 'behind') {
    const wall = cubeBig(c1);
    return { f, rel, words: `behind the ${c1} block`, sprite: layer([[f.s, 0, Math.max(0, wall.h - f.s.h) - 14], [wall, f.s.w * 0.45, Math.max(0, f.s.h - 14 - wall.h)]]), need: `a big ${c1} block (or two stacked)` };
  }
  if (rel === 'in front of') {
    const wall = cubeBig(c1);
    return { f, rel, words: `in front of the ${c1} block`, sprite: layer([[wall, f.s.w * 0.35, 0], [f.s, 0, Math.max(0, wall.h - f.s.h) + 12]]), need: `a big ${c1} block (or two stacked)` };
  }
  if (rel === 'between') return { f, rel, words: `between the ${c1} block and the ${c2} block`, sprite: row([block('pillar', c1), f.s, block('pillar', c2)], { gap: 5 }), need: `a ${c1} block and a ${c2} block` };
  // two-part instruction for step 3
  const friend = r.pick(['cow', 'horse', 'pig'].filter((k) => k !== f.name));
  return {
    f,
    rel: 'two',
    words: `between the ${c1} block and the ${c2} block, and the ${friend} on top of the ${c2} block`,
    sprite: row([block('brick', c1), f.s, column([animal(friend), block('brick', c2)], { gap: 0 })], { gap: 6 }),
    need: `a ${c1} block, a ${c2} block and a ${friend}`,
  };
}

const WORDS = ['on top of', 'under', 'next to', 'in', 'behind', 'in front of', 'between'];

export default [
  A({
    id: 'where-does-it-go',
    title: 'Where does it go?',
    strand: 'position',
    toys: ['bunny', 'animals', 'wooden', 'duplo'],
    minutes: 3,
    research: ['devmatters', 'pruden2011', 'purpura2017'],
    why: 'Understanding position "through words alone, with no pointing" is on the 3-and-4-year-old list. Children who hear more of these words do better on later spatial tasks.',
    make(r, level, ctx) {
      const p = placement(r, level, ctx);
      return {
        setup: [`You need the ${p.f.name} and ${p.need}.`, 'Keep your hands still and do not look at the spot. Words only.'],
        scenes: [{ caption: 'Where it should end up', sprite: p.sprite }],
        ask: `Can you put the ${p.f.name} ${p.words}?`,
        answer: { type: 'do' },
        look: ['Does he manage with no pointing or nodding from you?', '"Behind" and "in front of" depend on where he is sitting. Sit beside him, facing the same way.'],
        easier: 'Use "on top of" and "in" only.',
        harder: 'Give two instructions in one go.',
        words: WORDS,
      };
    },
  }),

  A({
    id: 'you-tell-me',
    title: 'You be the boss',
    strand: 'position',
    toys: ['bunny', 'animals', 'wooden', 'duplo'],
    minutes: 4,
    research: ['pruden2011', 'ferrara2011'],
    why: 'It was children saying spatial words themselves, not just hearing them, that predicted later spatial skill.',
    make(r, level, ctx) {
      const p = placement(r, level, ctx);
      return {
        setup: [`You need the ${p.f.name} and ${p.need}.`, 'Show him the picture, then sit on your hands. You may only do what his words tell you.'],
        scenes: [{ caption: 'Only he sees this', sprite: p.sprite }],
        ask: `You are the boss. Tell me where to put the ${p.f.name}, using your words.`,
        answer: { type: 'do' },
        reveal: { caption: `The words to listen for: "${p.words}".` },
        look: ['When he says "there!", put it somewhere silly and ask "here?" so he has to find a better word.', 'Say his instruction back in a full sentence.'],
        easier: 'Offer a choice: "on top of the block, or under it?"',
        harder: 'Use two toys so he has to say which one goes where.',
        words: WORDS,
      };
    },
  }),

  A({
    id: 'build-from-words',
    title: 'Build what I say',
    strand: 'position',
    toys: ['duplo'],
    minutes: 4,
    research: ['devmatters', 'ferrara2011', 'verdine2014'],
    why: 'Building from spoken steps joins two things the research links to early maths: position words and putting a model together.',
    make(r, level) {
      const n = lv(level, 2, 3, 4);
      const cs = r.shuffle(BRICK_COLOURS);
      const bricks = [{ x: 2, y: 0, w: 2, colour: cs[0] }];
      const steps = [`Put the ${cs[0]} brick on the table.`];
      if (n === 2) {
        bricks.push({ x: 2, y: 1, w: 2, colour: cs[1] });
        steps.push(`Put the ${cs[1]} brick on top of the ${cs[0]} one.`);
      } else {
        const side = r.bool() ? 4 : 0;
        bricks.push({ x: side, y: 0, w: 2, colour: cs[1] });
        steps.push(`Put the ${cs[1]} brick next to the ${cs[0]} one, touching.`);
        const under = r.int(0, 1);
        bricks.push({ x: bricks[under].x, y: 1, w: 2, colour: cs[2] });
        steps.push(`Put the ${cs[2]} brick on top of the ${cs[under]} one.`);
        if (n === 4) {
          const onTop = r.bool();
          const base = onTop ? bricks[2] : bricks[1 - under];
          bricks.push({ x: base.x, y: base.y + 1, w: 2, colour: cs[3] });
          steps.push(`Put the ${cs[3]} brick on top of the ${base.colour} one.`);
        }
      }
      const min = Math.min(...bricks.map((b) => b.x));
      return {
        setup: [`Give him ${n} square Duplo bricks: ${list(cs.slice(0, n))}.`, 'Read one step at a time. Keep the picture to yourself until the end.', ...steps.map((s, i) => `Step ${i + 1}: ${s}`)],
        scenes: [],
        ask: steps[0] + ' Ready for the next one?',
        answer: { type: 'do' },
        reveal: { caption: n > 2 ? 'Does his match? "Next to" can be either side, so a mirror image is right too.' : 'Does his match?', sprite: model(bricks.map((b) => ({ ...b, x: b.x - min }))) },
        look: ['Which words does he act on straight away, and which make him pause?'],
        easier: 'Two bricks: one down, one on top.',
        harder: 'Swap roles. He tells you what to build, a step at a time.',
        words: ['on top of', 'next to', 'touching', 'first', 'then'],
      };
    },
  }),

  A({
    id: 'parade',
    title: 'Who is first?',
    strand: 'position',
    toys: ['animals'],
    minutes: 3,
    research: ['devmatters', 'purpura2017'],
    why: '"First", "last", "behind" and "in front of" are both position words and maths words. They describe order, which is what a number line is.',
    make(r, level) {
      const n = lv(level, 3, 4, 5);
      const kinds = r.sample(['cow', 'pig', 'sheep', 'horse', 'duck', 'lion', 'elephant'], n); // left to right; front of the queue is on the RIGHT
      const front = (i) => kinds[n - 1 - i]; // i = 0 is first in line
      let ask;
      let correct;
      if (level === 1) {
        const first = r.bool();
        ask = first ? 'Who is first in the line?' : 'Who is last in the line?';
        correct = first ? front(0) : front(n - 1);
      } else if (level === 2) {
        const i = r.int(1, n - 2);
        const behind = r.bool();
        ask = behind ? `Who is just behind the ${front(i)}?` : `Who is just in front of the ${front(i)}?`;
        correct = behind ? front(i + 1) : front(i - 1);
      } else {
        const t = r.pick(['second', 'third', 'between']);
        if (t === 'between') {
          const i = r.int(1, n - 2);
          ask = `Who is between the ${front(i - 1)} and the ${front(i + 1)}?`;
          correct = front(i);
        } else {
          ask = `Who is ${t} in the line?`;
          correct = front(t === 'second' ? 1 : 2);
        }
      }
      return {
        setup: [`Line up these ${n} animals nose to tail, all facing the same way.`, 'Put something at the front for them to walk towards: a gate, a cup, a flag.'],
        scenes: [{ sprite: row([row(kinds.map((k) => hit(animal(k), k)), { gap: 6 }), flag()], { gap: 10 }) }],
        ask,
        answer: { type: 'tap', correct: [correct] },
        reveal: { caption: `The ${correct}. The ${front(0)} is first because it is nearest the flag.` },
        look: ['Does he know which end is the front? The way they face decides it.'],
        easier: 'Three animals, and ask only for first and last.',
        harder: 'Ask who is second, or who is between two others.',
        words: ['first', 'last', 'behind', 'in front of', 'between', 'second'],
      };
    },
  }),

  A({
    id: 'journey',
    title: 'Listen, then go',
    strand: 'position',
    toys: ['cars', 'brio', 'animals'],
    minutes: 5,
    research: ['devmatters', 'pruden2011'],
    why: 'Describing a route and using "first… then…" for a sequence are both on the 3-and-4-year-old list.',
    make(r, level, ctx) {
      const mover = has(ctx, 'cars') ? 'car' : has(ctx, 'brio') ? 'train' : 'cow';
      const marks = r.sample(
        [
          { s: block('arch', 'blue'), put: 'an arch or tunnel', go: 'through the tunnel' },
          { s: build([{ shape: 'pillar', colour: 'brown', x: 0.5, y: 0 }, { shape: 'roof', colour: 'green', x: 0, y: 2 }]), put: 'a tree (a triangle on a tall block)', go: 'round the tree' },
          { s: animal('sheep'), put: 'a sheep', go: 'past the sheep' },
          { s: build([{ shape: 'cube', colour: 'red', x: 0, y: 0 }, { shape: 'cube', colour: 'yellow', x: 0, y: 1 }, { shape: 'cube', colour: 'red', x: 0, y: 2 }]), put: 'a tower of three blocks', go: 'all the way round the tower' },
          { s: block('brick', 'orange'), put: 'a long orange block', go: 'over the orange block' },
        ],
        lv(level, 2, 3, 4)
      );
      const route = marks.map((m, i) => `${i === 0 ? 'First' : i === marks.length - 1 && marks.length > 2 ? 'and last of all' : 'then'} ${m.go}`).join(', ');
      const parts = [];
      marks.forEach((m, i) => {
        if (i) parts.push(arrow(20));
        parts.push(tag(m.s, i + 1));
      });
      return {
        setup: [`Spread these around the floor, well apart: ${list(marks.map((m) => m.put))}.`, `Give him the ${mover}. Say the whole route before he moves.`],
        scenes: [{ caption: 'The order to visit them', sprite: row(parts, { gap: 8, align: 'bottom' }) }],
        ask: `Listen first. ${route}. Go!`,
        answer: { type: 'do' },
        look: ['Does he hold the whole route in his head, or need a reminder half way?', 'Does he do "through", "round" and "over" differently?'],
        easier: 'Two places, and say them again as he goes.',
        harder: 'He gives you a route, and you drive it.',
        words: ['first', 'then', 'last', 'through', 'round', 'over', 'past'],
      };
    },
  }),
];
