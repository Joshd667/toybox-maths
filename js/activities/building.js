// Building: copying models, design challenges and fitting shapes together.
import {
  A, lv, times, list, has, plural, prop, numQ, trackList, mirror, sized, rabbitScene,
  row, column, model, build, block, car, animal, engine, frame, text, sign, qbox, trackPlan, numicon, numiconStack, arrow, layer, sp, at, shade, PAL,
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

// ---------------------------------------------------------------- train track
// Layouts for trackPlan: S long straight, s short straight, L and R curves. Eight curves make a ring,
// so every loop has eight more curves one way than the other. No points, tunnels or bridges: the owner has none.
const TRACKS = {
  1: ['SS', 'SL', 'LL', 'SSL', 'SLS', 'sS', 'SLL'],
  2: ['SLR', 'SLLS', 'SSLL', 'LSR', 'SLRS', 'sLLS', 'SLLRR', 'SLsRS'],
  3: ['LLLLLLLL', 'SLLLLSLLLL', 'SSLLLLSSLLLL', 'SLLSLLSLLSLL', 'sLLLLsLLLL'],
};
// Tracks to leave a gap in. Open ones have a piece at each end that always stays.
const GAPS = {
  1: ['SSS', 'SLS', 'SSL', 'LLS', 'SsS'],
  2: ['SLRS', 'SsLL', 'SLLsS', 'SSLLS', 'LsRS'],
  3: ['LLLLLLLL', 'SLLLLSLLLL', 'sLLLLsLLLL', 'SSLLLLSSLLLL', 'SLLSLLSLLSLL'],
};
// Numicon shapes that together cover a bigger one. Step 1 stacks without turning; step 2 has two odd shapes,
// so one must turn round; step 3 uses three.
const FITS = {
  1: [[2, 2], [2, 4], [4, 4], [2, 6], [2, 1], [2, 3], [4, 3], [4, 1]],
  2: [[1, 3], [3, 3], [3, 5], [1, 5], [5, 5], [3, 7], [1, 7]],
  3: [[1, 2, 3], [2, 3, 3], [2, 3, 5], [1, 3, 4], [1, 4, 5], [1, 3, 6], [2, 2, 4]],
};

export default [
  A({
    id: 'copy-duplo',
    title: 'Copy my model',
    strand: 'building',
    skill: 'Copying a model',
    needs: [],
    toys: ['duplo'],
    minutes: 5,
    age: 3,
    upTo: 5,
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
    age: 3,
    upTo: 5,
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
    age: 3,
    upTo: 5,
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
    age: 2.5,
    upTo: 4,
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
    age: 3,
    upTo: 5,
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

  A({
    id: 'copy-track',
    title: 'Copy my track',
    strand: 'building',
    skill: 'Copying a model',
    needs: [],
    toys: ['brio'],
    minutes: 6,
    age: 3,
    upTo: 5,
    research: ['verdine2014', 'deloache1991', 'bower2020'],
    why: 'Copying a layout from a picture is the same kind of task as copying a brick model, which is linked to early maths at 3. Nobody has tested it with train track, so treat it as a good puzzle and no more.',
    make(r, level) {
      let track = r.pick(TRACKS[level]);
      if (r.bool()) track = mirror(track);
      const loop = level === 3;
      const curves = [...track].filter((k) => k === 'L' || k === 'R').length;
      return {
        setup: [`Put out ${trackList(track)}, plus a few spare pieces.`, 'Show him the picture and let him work from it.'],
        scenes: [{ caption: 'Seen from above', sprite: trackPlan(track) }],
        ask: 'Can you build a track just like this one?',
        answer: { type: 'do' },
        ...(loop ? { reveal: { caption: 'Run a train all the way round to check it joins up.' } } : {}),
        more: [numQ(r, 'How many pieces did you use?', track.length, undefined, { min: 1 }), numQ(r, 'How many of them are bendy?', curves)],
        look: ['Does he turn a curve over when it bends the wrong way?', 'Does he check back against the picture after each piece?', loop ? 'A loop only closes if every piece matches. Let him find that out before you help.' : 'Which is harder for him: how many pieces, or which way it bends?'],
        easier: lv(level, 'Two pieces: one straight and one curve.', 'Build the first two pieces for him.', 'Build half the loop and let him finish it.'),
        harder: lv(level, 'He adds one more piece and you copy his track.', 'Show the picture for ten seconds, then hide it.', 'Turn the phone so the picture is on its side.'),
        words: ['straight', 'curve', 'bend', 'the same', 'turn it over', 'all the way round'],
      };
    },
  }),

  A({
    id: 'track-gap',
    title: 'Which piece fits?',
    strand: 'building',
    skill: 'Building challenges',
    needs: [],
    toys: ['brio'],
    minutes: 5,
    age: 3,
    upTo: 5,
    research: ['bower2020', 'levine2012', 'verdine2014'],
    why: 'Choosing the piece for a gap means judging length and bend before trying it. In one trial, 3-year-olds who practised fitting flat shapes to a picture got better at fitting them. Track itself has not been tested.',
    make(r, level) {
      let track = r.pick(GAPS[level]);
      if (r.bool()) track = mirror(track);
      // which piece to leave out: never an end piece of an open track, so the gap has two sides to join
      const loop = level === 3;
      const i = loop ? r.int(0, track.length - 1) : r.int(1, track.length - 2);
      const key = { S: 'S', s: 's', L: 'C', R: 'C' }[track[i]];
      const name = { S: 'long straight', s: 'short straight', C: 'curve' };
      const keys = level === 1 ? (key === 's' ? ['s', 'S'] : ['S', 'C']) : ['S', 's', 'C'];
      const rest = track.slice(0, i) + track.slice(i + 1);
      return {
        setup: [`Build this track with ${trackList(rest)}, leaving a gap where the "?" is.`, `Put ${list(keys.map((k) => `a ${name[k]}`))} beside it.`],
        scenes: [{ caption: 'Seen from above', sprite: trackPlan(track, { gap: i }) }],
        ask: 'Which piece fits in the gap?',
        answer: { type: 'pick', options: keys.map((k) => ({ key: k, sprite: trackPlan(k === 'C' ? 'L' : k) })), correct: key },
        reveal: { caption: `The ${name[key]}. Let him try the others too and see why they do not fit.`, sprite: trackPlan(track) },
        more: [{ ...numQ(r, 'How many pieces are in the track now?', track.length, undefined, { min: 1 }), scenes: [{ caption: 'Seen from above', sprite: trackPlan(track) }] }, { ask: 'Shut your eyes while I take one piece out. Which one is missing now?', scenes: [], answer: { type: 'do' } }],
        look: ['Does he choose by looking, or try each piece in turn? Both are fine; looking first comes later.', 'Does he turn the curve over when it bends the wrong way?'],
        easier: lv(level, 'Take out a piece from the end of the track, not the middle.', 'Offer two pieces only: the right one and a very different one.', 'Use an open track, not a loop.'),
        harder: lv(level, 'Add the short straight as a third choice.', 'Take out two pieces next to each other.', 'Take out two pieces from different places.'),
        words: ['fits', 'gap', 'too long', 'too short', 'straight', 'curve'],
      };
    },
  }),

  A({
    id: 'rabbit-copy',
    title: 'Where is the rabbit?',
    strand: 'building',
    skill: 'Copying a model',
    needs: [],
    toys: ['bunny'],
    minutes: 3,
    age: 2.5,
    upTo: 4,
    research: ['deloache1991', 'verdine2014', 'pruden2011'],
    why: 'Building what a picture shows, then saying where the rabbit is, joins copying a model with position words. Children of 2½ can already use a picture as a guide.',
    make(r, level) {
      const s = rabbitScene(r, level);
      const where = s.rel
        ? { ask: 'Where is the rabbit: in, on or behind?', answer: { type: 'pick', options: [{ key: 'in', label: 'In' }, { key: 'on', label: 'On' }, { key: 'behind', label: 'Behind' }], correct: s.rel }, reveal: { caption: `The rabbit is ${s.words}.` } }
        : { ask: 'Tell me where the rabbit is.', answer: { type: 'do' }, reveal: { caption: `Listen for: "${s.words}".` } };
      return {
        setup: [`You need the rabbit and ${s.need}.`, 'Show him the picture and let him build it.'],
        scenes: [{ caption: 'Seen from the front', sprite: s.sprite }],
        ask: 'Can you make yours look like this?',
        answer: { type: 'do' },
        more: [where, { ask: 'Now you hide the rabbit somewhere new. Tell me where it is.', scenes: [], answer: { type: 'open' } }],
        look: ['Does he look back at the picture as he builds?', 'Say his answer back in a full sentence: "Yes, the rabbit is inside the box."', 'Ask what the rabbit can see from there.'],
        easier: lv(level, 'Build it yourself and let him copy your blocks, not the picture.', 'Use one block only.', 'Build the blocks for him and let him place the rabbit.'),
        harder: lv(level, 'Add a second block.', 'Use all three blocks.', 'Show the picture for five seconds, then hide it.'),
        words: ['in', 'on top of', 'behind', 'inside', 'through', 'hidden'],
      };
    },
  }),

  A({
    id: 'will-it-fit',
    title: 'Will it fit under?',
    strand: 'building',
    skill: 'Building challenges',
    needs: ['Blocks or bricks for a bridge'],
    toys: ['cars', 'animals'],
    minutes: 5,
    age: 2.5,
    upTo: 4,
    research: ['serasmith1987', 'ferrara2011', 'devmatters'],
    why: 'Guessing whether a toy will fit and then testing it gives "big", "tall" and "too big" something to be checked against. Even 2-year-olds use "big" as a comparison between the things in front of them.',
    make(r, level, ctx) {
      const n = lv(level, 2, 3, 3);
      const t = sized(r, ctx, n);
      const bridge = build([{ shape: 'pillar', colour: 'blue', x: 0, y: 0 }, { shape: 'pillar', colour: 'blue', x: 2, y: 0 }, { shape: 'plank', colour: 'yellow', x: 0, y: 2 }]);
      const pic = row([bridge, ...r.shuffle(t.items).map((i) => i.sprite)], { gap: 12 });
      const first = lv(
        level,
        { ask: 'Which one will fit under the bridge? Have a guess, then try.', answer: { type: 'do' }, reveal: { caption: 'Whatever happens, say it: "too tall", "it fits", "only just".' } },
        { ask: 'Which ones will fit under the bridge, and which will not? Guess first, then try.', answer: { type: 'do' }, reveal: { caption: 'Line them up as "fits" and "does not fit".' } },
        { ask: 'How many blocks tall must the bridge be for the biggest one? Guess, then build it.', answer: { type: 'open' }, reveal: { caption: 'Count the blocks in one leg together.' } }
      );
      return {
        setup: [`Pick ${n} ${t.many} that are clearly different sizes. The picture is only an example.`, lv(level, 'Build a low bridge that the smallest one fits under.', 'Build a bridge that only the smallest one fits under.', 'Put out blocks for a bridge, but do not build it.')],
        scenes: [{ caption: 'Yours will look different', sprite: pic }],
        ...first,
        more: [
          { ask: lv(level, 'Can you make the bridge taller, so the big one fits too?', 'Can you make it just tall enough for the middle one?', 'Now make it wide enough for two of them side by side.'), answer: { type: 'do' } },
          { ask: 'Find something else that fits under. And something that does not.', scenes: [], answer: { type: 'open' } },
        ],
        look: ['Does he guess before he tries? Either guess is fine. The checking is the point.', 'Does he change the bridge, or push harder?', 'A toy duck can be bigger than a toy elephant. Go by the toys in front of him.'],
        easier: lv(level, 'Use one very small toy and one very big one.', 'Use two toys.', 'Build the bridge for him and let him test each toy.'),
        harder: lv(level, 'Add a third toy, in between the other two.', 'Ask how many blocks tall the bridge would need to be for the biggest.', 'Ask for a bridge the middle one fits under but the biggest does not.'),
        words: ['fits', 'too big', 'too tall', 'taller', 'wider', 'just right'],
      };
    },
  }),

  A({
    id: 'numicon-fit',
    title: 'Fit them together',
    strand: 'building',
    skill: 'Building challenges',
    needs: [],
    toys: ['numicon'],
    minutes: 4,
    age: 3,
    upTo: 5,
    research: ['bower2020', 'carbonneau2013', 'eef2020'],
    why: 'Covering a big shape with smaller ones means turning them in his hands until they fit. Three-year-olds who practised fitting flat shapes to a picture got better at fitting them. Numicon itself has not been tested.',
    make(r, level) {
      const parts = r.pick(FITS[level]);
      const total = parts.reduce((a, b) => a + b, 0);
      const names = parts.every((p) => p === parts[0]) ? `${parts.length === 2 ? 'two' : 'three'} ${parts[0]} shapes` : `the ${list(parts.map(String))} shapes`;
      const top = [...parts.filter((p) => p % 2 === 0), ...parts.filter((p) => p % 2 === 1)].pop(); // the one that ends up on top in the answer picture
      return {
        setup: [`Put out the ${total} shape and ${names}.`],
        scenes: [{ sprite: row([numicon(total, 17), arrow(22), row(parts.map((p) => numicon(p, 17)), { gap: 8 })], { gap: 12, align: 'middle' }) }],
        ask: `Can you cover the ${total} shape with the other ${parts.length === 2 ? 'two' : 'three'}, so that every hole is covered?`,
        answer: { type: 'do' },
        reveal: { caption: level === 1 ? 'They sit one above the other.' : 'One of them has to turn right round to lock in.', sprite: numiconStack(parts, 17) },
        more: [numQ(r, `How many holes does the ${total} shape have?`, total, undefined, { min: 1 }), numQ(r, `Lift the ${top} shape off. How many holes are showing now?`, top, undefined, { min: 1 })],
        look: ['Does he turn a shape round when it will not fit, or reach for a different one?', 'Laying them on top, or pressing them side by side on the baseboard, both work.'],
        easier: lv(level, 'Use two 2 shapes on the 4 shape.', 'Start with shapes that stack without turning, like the 2 and the 4.', 'Use two shapes, not three.'),
        harder: lv(level, 'Use two shapes with a bump on, like the 3 and the 5.', 'Use three shapes.', 'Ask him to find a different set of shapes that covers the same one.'),
        words: ['cover', 'fits', 'turn it round', 'together', 'the same as'],
      };
    },
  }),

];
