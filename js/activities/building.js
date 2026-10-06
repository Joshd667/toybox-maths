// Building: copying models, design challenges and fitting shapes together.
import {
  A, lv, times, list, has, plural, prop,
  row, column, model, build, block, car, animal, engine, frame, text, sign, qbox, trackPath, layer, sp, at, shade, PAL,
  BLOCK_SIZE, BLOCK_NAME, BRICK_COLOURS, MORE_COLOURS, FARM,
} from './kit.js';

// ---------------------------------------------------------------- Duplo models
const overlap = (a, b) => a.x < b.x + b.w && b.x < a.x + a.w;
const clash = (b, all) => all.some((o) => o.y === b.y && overlap(o, b));
const supported = (b, all) => b.y === 0 || all.some((o) => o.y === b.y - 1 && overlap(o, b));

// A random Duplo build of n bricks, front view. Every brick sits on the table or on another brick.
export function randomModel(r, n, level) {
  const widths = level === 1 ? [2] : [2, 2, 4];
  const bricks = [{ x: 0, y: 0, w: level === 1 ? 2 : r.pick([2, 4]), colour: r.pick(BRICK_COLOURS) }];
  let guard = 0;
  while (bricks.length < n && guard++ < 500) {
    const p = r.pick(bricks);
    const w = r.pick(widths);
    const ground = level > 1 && r.bool(0.2);
    const b = ground
      ? { x: r.bool() ? p.x + p.w + r.int(0, 1) : p.x - w - r.int(0, 1), y: 0, w }
      : { x: p.x + r.int(level === 1 ? 0 : -(w - 1), level === 1 ? r.int(0, 1) : p.w - 1), y: p.y + 1, w };
    if (b.y > 4 || clash(b, bricks) || !supported(b, bricks)) continue;
    const xs = [...bricks, b];
    if (Math.max(...xs.map((q) => q.x + q.w)) - Math.min(...xs.map((q) => q.x)) > 8) continue;
    const below = bricks.filter((o) => o.y === b.y - 1 && overlap(o, b)).map((o) => o.colour);
    b.colour = r.pick(BRICK_COLOURS.filter((c) => !below.includes(c)));
    bricks.push(b);
  }
  const min = Math.min(...bricks.map((b) => b.x));
  return bricks.map((b) => ({ ...b, x: b.x - min }));
}

const shopping = (bricks) => {
  const small = bricks.filter((b) => b.w === 2).length;
  const long = bricks.length - small;
  return [small && plural(small, 'square brick', 'square bricks'), long && plural(long, 'long brick', 'long bricks')].filter(Boolean).join(' and ');
};

// ---------------------------------------------------------------- wooden builds
const W = (shape, x, y) => ({ shape, x, y });
const WOODEN = {
  1: [
    () => [W('cube', 0, 0), W('cube', 0, 1)],
    () => [W('brick', 0, 0), W('roof', 0, 1)],
    (r) => [W('brick', 0, 0), W('cube', r.pick([0, 1]), 1)],
    () => [W('cyl', 0, 0), W('cube', 1.3, 0)],
    () => [W('pillar', 0, 0), W('cube', 0, 2)],
    () => [W('arch', 0, 0), W('cube', 0.5, 1)],
  ],
  2: [
    () => [W('pillar', 0, 0), W('pillar', 2, 0), W('plank', 0, 2)],
    () => [W('brick', 0, 0), W('cube', 0, 1), W('cube', 1, 1)],
    () => [W('cube', 0, 0), W('cube', 1, 0), W('roof', 0, 1)],
    () => [W('cyl', 0, 0), W('cyl', 2, 0), W('plank', 0, 2)],
    () => [W('arch', 0, 0), W('brick', 0, 1), W('roof', 0, 2)],
    () => [W('pillar', 0, 0), W('pillar', 2, 0), W('plank', 0, 2), W('roof', 0.5, 2.5)],
    (r) => [W('brick', 0, 0), W('pillar', r.pick([0, 1]), 1), W('cube', 2.3, 0)],
  ],
  3: [
    () => [W('cube', 0, 0), W('cube', 2, 0), W('plank', 0, 1), W('cube', 0, 1.5), W('cube', 2, 1.5), W('plank', 0, 2.5)],
    () => [W('pillar', 0, 0), W('arch', 1, 0), W('pillar', 3, 0), W('brick', 1, 1), W('roof', 1, 2)],
    () => [W('cube', 0, 0), W('cube', 1, 0), W('cube', 2, 0), W('brick', 0.5, 1), W('roof', 0.5, 2)],
    () => [W('pillar', 0, 0), W('pillar', 2, 0), W('cube', 1, 0), W('plank', 0, 2), W('roof', 0.5, 2.5)],
    () => [W('brick', 0, 0), W('brick', 2, 0), W('arch', 1, 1), W('cube', 0, 1), W('cube', 3, 1), W('plank', 0.5, 2)],
  ],
};
function randomWooden(r, level) {
  let blocks = r.pick(WOODEN[level])(r).map((b) => ({ ...b, colour: r.pick(MORE_COLOURS) }));
  if (r.bool()) {
    const width = Math.max(...blocks.map((b) => b.x + BLOCK_SIZE[b.shape][0]));
    blocks = blocks.map((b) => ({ ...b, x: Math.round((width - b.x - BLOCK_SIZE[b.shape][0]) * 100) / 100 }));
  }
  return blocks;
}
const woodList = (blocks) => {
  const counts = {};
  for (const b of blocks) counts[b.shape] = (counts[b.shape] || 0) + 1;
  return list(Object.entries(counts).map(([s, n]) => `${n} ${BLOCK_NAME[s]}${n > 1 ? 's' : ''}`));
};

// A ring of blocks seen from above, around whatever is inside.
function fence(inner) {
  const S = 15;
  const cols = Math.ceil((inner.w + 14) / S) + 2;
  const rows = Math.ceil((inner.h + 10) / S) + 2;
  let svg = '';
  let k = 0;
  for (let y = 0; y < rows; y++)
    for (let x = 0; x < cols; x++)
      if (x === 0 || y === 0 || x === cols - 1 || y === rows - 1) {
        const c = PAL[MORE_COLOURS[k++ % 4]];
        svg += `<rect x="${x * S + 0.5}" y="${y * S + 0.5}" width="${S - 1}" height="${S - 1}" rx="2" fill="${c}" stroke="${shade(c, -0.3)}"/>`;
      }
  const w = cols * S;
  const h = rows * S;
  return sp(w, h, svg + at(inner, (w - inner.w) / 2, (h - inner.h) / 2));
}

export default [
  A({
    id: 'copy-duplo',
    title: 'Copy my model',
    strand: 'building',
    toys: ['duplo'],
    minutes: 5,
    research: ['verdine2014', 'ferrara2011'],
    why: 'This is the task from the research: 3-year-olds who were better at copying a brick model also did better at early maths. It is a link, not proof that one causes the other.',
    make(r, level) {
      const n = r.int(...lv(level, [2, 3], [4, 5], [6, 8]));
      const m = randomModel(r, n, level);
      return {
        setup: [`Find ${shopping(m)} in these colours, plus a few spares.`, 'Build the model yourself first, or let him work straight from the picture.'],
        scenes: [{ caption: 'Seen from the front', sprite: model(m) }],
        ask: 'Can you build one exactly like this?',
        answer: { type: 'do' },
        look: ['Does he check back against the model as he goes?', 'Which goes wrong first: the colours, or where a brick sits? Position is the harder part.', 'Talk as he builds: "on top", "sticking out", "next to", "in the middle".'],
        easier: 'Two bricks, one straight on top of the other.',
        harder: 'Show the picture for ten seconds, hide it, and let him build from memory.',
        words: ['on top of', 'next to', 'underneath', 'sticking out', 'in the middle'],
      };
    },
  }),

  A({
    id: 'copy-wooden',
    title: 'Copy my building',
    strand: 'building',
    toys: ['wooden'],
    minutes: 5,
    research: ['verdine2014', 'casey2008', 'devmatters'],
    why: 'Choosing the right block for each job, like a flat one to bridge a gap or a triangle for a roof, is on the 3-and-4-year-old list.',
    make(r, level) {
      const blocks = randomWooden(r, level);
      return {
        setup: [`You need ${woodList(blocks)}. Use the nearest shapes you have; the colours do not matter.`],
        scenes: [{ caption: 'Seen from the front', sprite: build(blocks) }],
        ask: 'Can you build one like this?',
        answer: { type: 'do' },
        look: ['Does he pick the right shape for each place?', 'When it falls, does he change something or try the same again? Ask "what could we change?"'],
        easier: 'Two blocks, one on top of the other.',
        harder: 'Ask him to build it again from the other side of the table, so it faces you.',
        words: ['on top of', 'across', 'balance', 'flat', 'pointy'],
      };
    },
  }),

  A({
    id: 'bridge',
    title: 'Build a bridge',
    strand: 'building',
    toys: ['wooden', 'duplo'],
    minutes: 6,
    research: ['casey2008', 'ferrara2011', 'devmatters'],
    why: 'Building to a goal inside a little story gave the best spatial results in a block-building study, and brings out far more position words than free play.',
    make(r, level, ctx) {
      const goer = has(ctx, 'brio') && r.bool(0.4) ? { name: 'train', s: engine() } : has(ctx, 'cars') || !has(ctx, 'animals') ? { name: 'car', s: car(r.pick(MORE_COLOURS)) } : { name: 'cow', s: animal('cow') };
      const job = lv(
        level,
        [`The ${goer.name} needs to get to the other side. Can you build a bridge it can go under?`],
        [`Can you build a bridge wide enough for two ${goer.name}s to go under side by side?`, `Can you build a bridge the ${goer.name} can go under AND another toy can stand on top?`],
        ['Can you build a bridge tall enough for the tallest toy we have to walk under?', `Can you build a bridge with a road going up to it, so the ${goer.name} can drive over the top?`]
      );
      const posts = 'pillar';
      const sketch = layer([
        [build([{ shape: posts, colour: 'blue', x: 0, y: 0 }, { shape: posts, colour: 'blue', x: 2, y: 0 }, { shape: 'plank', colour: 'yellow', x: 0, y: 2 }]), 0, 0],
        [goer.s, 78 + 8, 65 - goer.s.h],
      ]);
      return {
        setup: ['Put out a mix of blocks, including some long flat ones.', 'The picture is one idea only. Let him find his own way.'],
        scenes: [{ caption: 'One way to start', sprite: sketch }],
        ask: r.pick(job),
        answer: { type: 'open' },
        look: ['Does he test it by driving the toy through?', 'If it does not fit, does he change the height or the gap?', 'Hold back from fixing it. Ask "what is stopping it?"'],
        easier: 'Build the two posts for him and let him find the piece to go across.',
        harder: 'Make it wider, taller, or strong enough to hold a toy on top.',
        words: ['under', 'over', 'across', 'wide', 'tall', 'gap'],
      };
    },
  }),

  A({
    id: 'tall-as',
    title: 'As tall as…',
    strand: 'building',
    toys: ['duplo', 'wooden', 'cubes'],
    minutes: 5,
    research: ['devmatters', 'ncetm'],
    why: 'Building to match a height is measuring before rulers: he has to compare, adjust, and decide when it is "the same".',
    make(r, level, ctx) {
      const things = [
        has(ctx, 'animals') && { name: 'the tallest animal', s: animal('giraffe') },
        { name: 'a mug', s: prop('mug', 40, 52) },
        { name: 'this phone standing on its end', s: prop('phone', 34, 70) },
        { name: 'a shoe standing on its heel', s: prop('shoe', 36, 80) },
        level > 1 && { name: 'his knee', s: prop('knee', 30, 96) },
        level === 3 && { name: 'the seat of a chair', s: prop('chair seat', 60, 110) },
      ].filter(Boolean);
      const { name: thing, s: thingPic } = r.pick(things);
      return {
        setup: [`Stand ${thing} on the floor or table.`, 'Put a pile of bricks next to it.'],
        scenes: [{ sprite: row([thingPic, model(times(3, (i) => ({ x: 0, y: i, w: 2, colour: BRICK_COLOURS[i] }))), qbox(36, 30)], { gap: 12 }) }],
        ask: `Can you build a tower exactly as tall as ${thing}? How many bricks did it take?`,
        answer: { type: 'open' },
        look: ['Does he stand the tower right next to it to check?', 'Does he notice when one more brick makes it too tall?'],
        easier: 'Pick something short: two or three bricks high.',
        harder: 'Ask him to guess how many bricks before he starts.',
        words: ['tall', 'taller', 'too tall', 'the same', 'how many'],
      };
    },
  }),

  A({
    id: 'spot-difference',
    title: 'What did I change?',
    strand: 'building',
    toys: ['duplo'],
    minutes: 3,
    research: ['verdine2014', 'levine2012'],
    why: 'Copying a model starts with looking closely at how its parts are arranged. Comparing two models practises exactly that looking.',
    make(r, level) {
      const n = r.int(...lv(level, [3, 3], [4, 5], [5, 6]));
      const a = randomModel(r, n, level);
      const b = a.map((x) => ({ ...x }));
      const free = b.map((x, i) => i).filter((i) => !b.some((o) => o.y === b[i].y + 1 && overlap(o, b[i])));
      let key;
      let what;
      let moved = false;
      if (level === 3) {
        // try to slide a top brick sideways
        for (const i of r.shuffle(free.filter((j) => b[j].y > 0))) {
          const rest = b.filter((_, j) => j !== i);
          const spots = [-2, -1, 1, 2].map((d) => ({ ...b[i], x: b[i].x + d })).filter((c) => c.x >= 0 && !clash(c, rest) && supported(c, rest));
          if (spots.length) {
            b[i] = r.pick(spots);
            key = 'b' + i;
            what = 'One brick has slid along.';
            moved = true;
            break;
          }
        }
      }
      if (!moved) {
        const i = r.pick(level === 1 ? free : b.map((_, j) => j));
        b[i].colour = r.pick(BRICK_COLOURS.filter((c) => c !== b[i].colour));
        key = 'b' + i;
        what = `One brick is ${b[i].colour} instead of ${a[i].colour}.`;
      }
      return {
        setup: ['Build the first model. Let him look, then ask him to hide his eyes while you make the one change shown.', 'Or just use the two pictures.'],
        scenes: [{ sprite: row([frame(model(a), { label: 'before', pad: 9 }), frame(model(b, { hit: true }), { label: 'after', pad: 9 })], { gap: 14, align: 'bottom' }) }],
        ask: 'I changed one brick. Which one?',
        answer: { type: 'tap', correct: [key] },
        reveal: { caption: what },
        look: ['Does he scan across from one to the other, brick by brick?'],
        easier: 'Use three bricks and change the top one.',
        harder: 'Move a brick instead of swapping its colour.',
        words: ['the same', 'different', 'changed', 'moved'],
      };
    },
  }),

  A({
    id: 'enclosure',
    title: 'Make a field',
    strand: 'building',
    toys: ['animals'],
    minutes: 6,
    research: ['casey2008', 'ferrara2011'],
    why: 'Fencing something in is one of the classic block-building steps: he has to close every gap and judge how much space is needed.',
    make(r, level) {
      const n = r.int(...lv(level, [2, 3], [3, 5], [4, 6]));
      const kinds = times(n, () => r.pick(FARM));
      const job = lv(
        level,
        'The animals keep wandering off. Can you build a fence all the way round so none can get out?',
        'Can you build a field just big enough for all of them, with no gaps?',
        r.pick(['Can you build a field with a gate that opens and shuts?', 'Can you build two fields that share a fence in the middle?'])
      );
      return {
        setup: [`Stand ${n} animals close together.`, 'Put out wooden blocks or Duplo bricks for the fence.'],
        scenes: [{ caption: 'Seen from above', sprite: fence(row(kinds.slice(0, 3).map((k) => animal(k)), { gap: 6 })) }],
        ask: job,
        answer: { type: 'open' },
        look: ['Does he close the loop, or leave it open at one end?', 'When an animal does not fit, does he move the fence or squash the animals?', 'Count the fence blocks together at the end.'],
        easier: 'Build three sides and let him finish the fourth.',
        harder: 'Add a gate, or split the field in two.',
        words: ['inside', 'outside', 'all the way round', 'gap', 'corner', 'enough room'],
      };
    },
  }),

  A({
    id: 'track-loop',
    title: 'Round and back again',
    strand: 'building',
    toys: ['brio'],
    minutes: 8,
    research: ['levine2012', 'devmatters'],
    why: 'Making track pieces join up is a jigsaw in disguise: he has to turn and flip pieces and think about where the track is heading.',
    make(r, level) {
      const shapes = {
        1: { d: 'M22 70A48 48 0 1 1 118 70A48 48 0 1 1 22 70Z', w: 140, h: 140, job: 'Can you build a track that goes all the way round and joins up with itself?' },
        2: { d: 'M60 22H150A40 40 0 0 1 150 102H60A40 40 0 0 1 60 22Z', w: 210, h: 124, job: 'Can you build a long loop, with straight bits on both sides?' },
        3: { d: 'M60 22H150A40 40 0 0 1 150 102H60A40 40 0 0 1 60 22Z', w: 210, h: 124, job: r.pick(['Can you build a loop with a bridge or tunnel somewhere on it?', 'Can you build a loop with a station where a second train can wait?']) },
      }[level];
      return {
        setup: ['Tip out the track. Keep the curves and the straights in two piles.'],
        scenes: [{ caption: level === 3 ? 'Start from a loop like this, seen from above' : 'Seen from above', sprite: trackPath(shapes.d, shapes.w, shapes.h) }],
        ask: shapes.job,
        answer: { type: 'open' },
        look: ['When the ends do not meet, does he swap a piece, or push harder?', 'How many curves did it take to get all the way round? Count them together.', level > 1 ? 'Does he work out that both straight sides need the same number of pieces?' : 'Does he notice a curve can be flipped to bend the other way?'],
        easier: 'Lay most of the circle yourself and leave a two-piece gap for him.',
        harder: 'Add a straight section on each side and see what happens.',
        words: ['curve', 'straight', 'round', 'join', 'turn it over'],
      };
    },
  }),

  A({
    id: 'combine-shapes',
    title: 'Two make one',
    strand: 'building',
    toys: ['wooden'],
    minutes: 4,
    research: ['devmatters', 'fisher2013'],
    why: 'Putting shapes together to make a new one is on the 3-and-4-year-old list, and is early practice in seeing shapes inside shapes.',
    make(r, level) {
      const c = r.sample(MORE_COLOURS, 3);
      const jobs = [
        { parts: ['cube', 'cube'], target: block('brick', c[2]), made: build([{ shape: 'cube', colour: c[0], x: 0, y: 0 }, { shape: 'cube', colour: c[1], x: 1, y: 0 }]), say: 'two cubes', goal: 'a long block' },
        { parts: ['cube', 'cube'], target: block('pillar', c[2]), made: build([{ shape: 'cube', colour: c[0], x: 0, y: 0 }, { shape: 'cube', colour: c[1], x: 0, y: 1 }]), say: 'two cubes', goal: 'a tall block' },
        { parts: ['brick', 'brick'], target: build([{ shape: 'brick', colour: c[2], x: 0, y: 0 }, { shape: 'brick', colour: c[2], x: 0, y: 1 }]), made: build([{ shape: 'pillar', colour: c[0], x: 0, y: 0 }, { shape: 'pillar', colour: c[1], x: 1, y: 0 }]), say: 'two long blocks', goal: 'a big square', twist: 'There are two ways: lying down or standing up.' },
        { parts: ['cube', 'cube', 'cube'], target: block('plank', c[2]), made: build([{ shape: 'cube', colour: c[0], x: 0, y: 0 }, { shape: 'cube', colour: c[1], x: 1, y: 0 }, { shape: 'cube', colour: c[0], x: 2, y: 0 }]), say: 'three cubes', goal: 'a row as long as the plank' },
      ];
      const j = jobs[level === 1 ? r.int(0, 1) : level === 2 ? r.int(0, 2) : r.int(2, 3)];
      const parts = j.parts.map((p, i) => block(p, c[i % 2]));
      const lhs = [];
      parts.forEach((p, i) => {
        if (i) lhs.push(sign('+'));
        lhs.push(p);
      });
      return {
        setup: [`Find ${j.say} and the block in the picture to match against.`],
        scenes: [{ sprite: row([...lhs, sign('='), qbox(40, 40)], { gap: 9, align: 'middle' }) }],
        ask: `Can you put ${j.say} together to make ${j.goal}?`,
        answer: { type: 'do' },
        reveal: { caption: `Hold them side by side to check they match.${j.twist ? ' ' + j.twist : ''}`, sprite: row([j.made, sign('='), j.target], { gap: 12, align: 'middle' }) },
        look: ['Does he turn the blocks to try different ways?', 'Does he check by holding his shape against the real one?'],
        easier: 'Show him one way, pull it apart, and let him remake it.',
        harder: 'Ask "what else can two triangles make?" and see what he finds.',
        words: ['fits', 'the same shape', 'turn', 'long', 'square', 'side'],
      };
    },
  }),
];
