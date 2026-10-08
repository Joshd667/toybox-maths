// Building: copying models, design challenges and fitting shapes together.
import {
  A, lv, times, list, has, plural, prop, numQ,
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
    skill: 'Copying a model',
    needs: [],
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
        more: [numQ(r, 'How many bricks did you use?', m.length, undefined, { min: 1 }), numQ(r, `How many of them are ${m[0].colour}?`, m.filter((b) => b.colour === m[0].colour).length)],
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
    skill: 'Copying a model',
    needs: [],
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
        more: [numQ(r, 'How many blocks did you use?', blocks.length, undefined, { min: 1 })],
        look: ['Does he pick the right shape for each place?', 'When it falls, does he change something or try the same again? Ask "what could we change?"'],
        easier: lv(level, 'Build it with him once, knock it down, and let him try alone.', 'Two blocks, one on top of the other.', 'Two blocks, one on top of the other.'),
        harder: 'Ask him to build it again from the other side of the table, so it faces you.',
        words: ['on top of', 'across', 'balance', 'flat', 'pointy'],
      };
    },
  }),

  A({
    id: 'bridge',
    title: 'Build a bridge',
    strand: 'building',
    skill: 'Building challenges',
    needs: ['A toy car, train or animal to go under'],
    toys: ['wooden', 'duplo'],
    minutes: 6,
    research: ['casey2008', 'ferrara2011', 'devmatters'],
    why: 'Building to a goal inside a little story gave the best spatial results in a block-building study, and brings out far more position words than free play.',
    make(r, level, ctx) {
      const goer = has(ctx, 'brio') && r.bool(0.4) ? { name: 'train', go: 'drive', s: engine() } : has(ctx, 'cars') || !has(ctx, 'animals') ? { name: 'car', go: 'drive', s: car(r.pick(MORE_COLOURS)) } : { name: 'cow', go: 'walk', s: animal('cow') };
      const job = lv(
        level,
        [`The ${goer.name} needs to get to the other side. Can you build a bridge it can go under?`],
        [`Can you build a bridge wide enough for two ${goer.name}s to go under side by side?`, `Can you build a bridge the ${goer.name} can go under AND another toy can stand on top?`],
        ['Can you build a bridge tall enough for the tallest toy we have to walk under?', `Can you build a bridge with a road going up to it, so the ${goer.name} can ${goer.go} over the top?`]
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
        look: ['Does he test it by sending the toy through?', 'If it does not fit, does he change the height or the gap?', 'Hold back from fixing it. Ask "what is stopping it?"'],
        easier: 'Build the two posts for him and let him find the piece to go across.',
        harder: lv(level, 'Make it wider, taller, or strong enough to hold a toy on top.', 'Make it long enough to cross a book laid flat.', 'Make it long enough to cross a book laid flat.'),
        words: ['under', 'over', 'across', 'wide', 'tall', 'gap'],
      };
    },
  }),

  A({
    id: 'tall-as',
    title: 'As tall as…',
    strand: 'building',
    skill: 'Building challenges',
    needs: ['A mug, bottle or shoe to measure against'],
    toys: ['duplo', 'wooden', 'cubes'],
    minutes: 5,
    research: ['devmatters', 'ncetm'],
    why: 'Building to match a height is measuring before rulers: he has to compare, adjust, and decide when it is "the same".',
    make(r, level, ctx) {
      const things = lv(
        level,
        [has(ctx, 'animals') && { say: 'the tallest animal', set: 'Stand the tallest animal on the floor or table.', s: animal('giraffe') }, { say: 'the mug', set: 'Stand a mug on the floor or table.', s: prop('mug', 40, 52) }],
        [{ say: 'the bottle', set: 'Stand a drinks bottle on the floor or table.', s: prop('bottle', 30, 76) }, { say: 'the shoe', set: 'Prop a shoe up on its heel against a wall.', s: prop('shoe', 36, 80) }],
        [{ say: 'your knee', set: 'Ask him to stand up straight on the floor.', near: 'him', s: prop('knee', 30, 96) }, { say: 'the seat of the chair', set: 'Find a chair he can stand next to.', s: prop('chair seat', 60, 110) }]
      ).filter(Boolean);
      const { say: thing, set, near, s: thingPic } = r.pick(things);
      return {
        setup: [set, `Put a pile of bricks next to ${near || 'it'}.`],
        scenes: [{ sprite: row([thingPic, model(times(3, (i) => ({ x: 0, y: i, w: 2, colour: BRICK_COLOURS[i] }))), qbox(36, 30)], { gap: 12 }) }],
        ask: `Can you build a tower as tall as ${thing}?`,
        answer: { type: 'open' },
        more: [{ ask: 'How many bricks tall is your tower?', answer: { type: 'open' }, reveal: { caption: 'Count them together, touching each brick from the bottom up.' } }],
        look: ['Does he stand the tower right next to it to check?', 'Does he notice when one more brick makes it too tall?'],
        easier: 'Pick something short: two or three bricks high.',
        harder: 'Ask him to guess how many bricks before he starts.',
        words: ['tall', 'taller', 'too tall', 'the same', 'how many'],
      };
    },
  }),

  A({
    id: 'enclosure',
    title: 'Make a field',
    strand: 'building',
    skill: 'Building challenges',
    needs: ['Wooden blocks or Duplo bricks for the fence'],
    toys: ['animals'],
    minutes: 6,
    research: ['casey2008', 'ferrara2011'],
    why: 'Fencing something in is one of the classic block-building steps: he has to close every gap and judge how much space is needed.',
    make(r, level) {
      const n = r.int(...lv(level, [2, 3], [3, 5], [4, 6]));
      const kinds = times(n, () => r.pick(FARM));
      const beasts = (ks) => row(ks.map((k) => animal(k)), { gap: 6 });
      const job = lv(
        level,
        'The animals keep wandering off. Can you build a fence all the way round so none can get out?',
        'Can you build a field just big enough for all of them, with no gaps?',
        r.pick(['Can you build a field with a gate that opens and shuts?', 'Can you build two fields that share a fence in the middle?'])
      );
      return {
        setup: [`Stand ${n} animals close together.`, 'Put out wooden blocks or Duplo bricks for the fence.'],
        scenes: [{ caption: 'Seen from above', sprite: fence(n > 3 ? column([beasts(kinds.slice(0, Math.ceil(n / 2))), beasts(kinds.slice(Math.ceil(n / 2)))], { gap: 6 }) : beasts(kinds)) }],
        ask: job,
        answer: { type: 'open' },
        more: [numQ(r, 'How many animals are inside your fence?', n, undefined, { min: 1 })],
        look: ['Does he close the loop, or leave it open at one end?', 'When an animal does not fit, does he move the fence or squash the animals?', 'Count the fence blocks together at the end.'],
        easier: 'Build three sides and let him finish the fourth.',
        harder: lv(level, 'Add a gate, or split the field in two.', 'Add a gate, or split the field in two.', 'Ask for both: a gate, and a fence down the middle.'),
        words: ['inside', 'outside', 'all the way round', 'gap', 'corner', 'enough room'],
      };
    },
  }),

];
