# Toybox Maths: notes for whoever works on this next (human or AI)

A phone web app (PWA) of early maths activities for one family: a parent and young children, the eldest about three.
Plain HTML, CSS and JavaScript modules. **No framework, no build step, no dependencies.** Keep it that way.

Live site: GitHub Pages, served from the `main` branch root. Pushing to `main` publishes.

## Layout

| File | What it is |
|---|---|
| `index.html` | The one page. Bottom tabs and an empty `<main>`. |
| `css/app.css` | All styling. Colours and fonts are variables at the top. |
| `js/app.js` | The screens and all tap handling. Routes are listed at the top of the file. |
| `js/store.js` | Children's profiles and progress (saved on the phone), and how the next activity is chosen. |
| `js/reward.js` | Stars, the dancing animal and the chime when he gets one right. |
| `js/wording.js` | Rewrites "he" text as "she" for a child's profile. |
| `js/draw.js` | Every picture. Toy "sprites" plus layout helpers. Pure functions, no DOM. |
| `js/rng.js` | Seeded random numbers, so every variation can be reproduced and tested. |
| `js/research.js` | Every source cited, with what it found and what it does not show. |
| `js/activities/index.js` | List of strands, toys, and all activities. |
| `js/activities/kit.js` | One import for activity files: all of `draw.js` plus small helpers. |
| `js/activities/<strand>.js` | The activities, one file per strand. **This is where most additions go.** |
| `sw.js` | Offline support. Has a list of every file. |
| `tools/validate.mjs` | The test. Run before every commit. |
| `tools/sheet.mjs` | Review sheets: one page per activity with two variations at each difficulty. Use it to check words, pictures and answers agree. |
| `tools/make-icons.py` | Rebuilds the icons (needs Playwright). |

## Adding an activity

1. Pick the strand file in `js/activities/` and copy an existing activity that is close to what you want.
2. Fill in the fixed parts:
   - `id`: unique, lower-case-with-dashes. Never change an id later (progress is saved against it).
   - `title`, `strand`, `minutes` (1 to 10)
   - `skill`: the sub-skill inside the strand, shown to the parent ("Counting out"). Reuse one the strand already has; a strand has 2 to 4.
   - `needs`: extra things to fetch besides the toys ("A plate or box"), listed on the Get ready screen. `[]` if none.
   - `toys`: ids from `TOYS` in `index.js`; any one of them is enough to play. `[]` means no toys needed.
   - `levels`: leave out for all three difficulties (1 Easy, 2 Medium, 3 Hard), or give e.g. `[2, 3]`.
   - `research`: ids from `js/research.js` (see the rules below). `why`: one plain sentence.
3. Write `make(r, level, ctx)`. It returns one concrete variation:
   - `setup`: at most 3 short lines telling the adult what to lay out (the validator enforces 3)
   - `scenes`: list of `{ sprite, caption?, flash? }` pictures (`flash: 2` shows it for 2 seconds). May be `[]`.
   - `ask`: the words to say to the child. Short. Spoken English.
   - `answer`: one of
     - `{ type: 'number', value, choices }` (use `choices(r, value)`) for big number buttons
     - `{ type: 'pick', options: [{ key, label }] or [{ key, sprite }], correct }`
     - `{ type: 'tap', correct: [key] }` where parts of a scene are wrapped in `hit(sprite, key)`; add `multi: true` for several
     - `{ type: 'do' }` when the child does it with toys and the adult checks
     - `{ type: 'open' }` when there is no single right answer
     - `{ type: 'spinner', values: [1, 2] }`
   - `reveal`: optional `{ caption, sprite? }` shown after answering
   - `note`: optional line for the adult only, shown above the question ("Drop 3 bricks in, slowly")
   - `more`: list of follow-up questions on the SAME set-up, each `{ ask, answer, reveal?, scenes?, note? }`.
     Give every activity follow-ups where it sensibly can ("How many are red?", "One more comes. How many now?").
     `numQ(r, ask, value, caption?)` builds a number follow-up in one line. A follow-up with its own `scenes` replaces the picture.
   - `look`: list of things for the adult to watch for
   - `easier`, `harder`: one sentence each
   - `words`: maths words to use out loud
4. Use `r` (never `Math.random`) for anything random: `r.int(a, b)`, `r.pick(list)`, `r.sample(list, k)`, `r.shuffle(list)`, `r.bool(p)`.
   Use `lv(level, a, b, c)` to choose by difficulty. Make `easier` and `harder` fit the level too: do not suggest what that level already does. Use `pickToy(r, ctx, [...])` to draw a toy the family has out.
5. Run `node tools/validate.mjs`. It must print `All good`.
6. Look at it. `node tools/sheet.mjs <folder> <id>` writes a review page; also serve the folder (`python3 -m http.server`), open `#/play/<id>` at phone width and play a turn on Ramp up.

A new file anywhere under `js/`, `css/`, `icons/` or `fonts/` must be added to `FILES` in `sw.js` (the validator checks).
A new strand file must also be imported in `js/activities/index.js`.

## Pictures

A sprite is `{ w, h, svg }`. Toys: `car`, `animal`, `duplo`, `tower`, `model`, `block`, `build`, `cube`, `rod`,
`numicon`, `card`, `numeral`, `dots`, `engine`, `wagon`, `train`, `bunny`, `flat`, `ramp`.
Layout: `row`, `column`, `grid`, `flow` (wraps), `scatter`, `layer`, `scale`, `frame`, `tag`, `ring`, `hit`.
Compose these; do not write raw SVG in activity files. If a new toy is needed, add it to `draw.js`.
Keep pictures under about 500 units wide. Use colour names from `PAL` so the words and the picture always agree.
Draw generic toys only: no branded characters or copies of a product's own artwork.

## Research rules (the owner cares about this most)

- Every activity must cite at least one entry in `js/research.js`, and `why` must not claim more than that entry's `found` line.
- Before adding a source, check it exists on a DOI page, ERIC, the publisher or the official body. Record what it found,
  the children's ages, and a `caveat` for what it does not show. If you could not read the abstract, set `checked: 'citation only'`.
- Most of this evidence is correlational and from 3½- to 5-year-olds. Say so. Do not write "proven" or "boosts".
- `NOT_CLAIMED` in `research.js` lists things we looked for and could not support (for example, any trial evidence for
  Numicon, or a research-backed session length). Do not add them back without a real source.
- No fads: no "brain training", learning styles, or claims of lasting advantage from starting early.

## Writing rules

- The reader is a parent holding a toddler's attention with one hand. Short sentences. UK spelling.
- `ask` is spoken to a child under three: concrete, one question.
- The child is referred to as "he". There is no name anywhere in the app or repo, and it should stay that way (the site is public).
- Write activity text about "he"; `wording.js` converts it to "she" for a child set to She. There is no "they" option (the owner removed it).
- The child is "he" in activity text. Buttons and screens the app draws itself stay neutral, because there can be several children.
- Children's names are typed into the app and saved on that phone only. Never put a name in the code or the repo.
- Feedback to the child is never negative. Wrong taps fade. Right answers earn a star, a burst, and the child's animal dancing in the middle of the screen (the owner asked for this; it must never sit where the bottom bar can hide it).
- The toys do the teaching. Do not turn activities into screen games; tapping is for answers only.
- The adult is stressed and wants an activity in ten seconds. One thing per screen, big buttons, no scrolling to find the next step.
- This is not a toy maker's app. No brick-shaped headers, studs, or brand colours in the interface. Toys appear only in the pictures.

## How a turn works

1. **Get ready** (`readyScreen` in `app.js`): "The game" (an example picture, what you set up, what you ask, how he answers;
   Start opens on that same set-up), what you need, how hard, how many questions. Opened from a skill, it asks which toy;
   opened from a toy's list, that toy is taken as given and a folded "Got a different toy out?" menu sits at the end.
   Difficulty is Easy, Medium, Hard, Mix (a different one for each set-up) or Ramp up (easy at the start, hard by the end).
   Questions are 3, 5, 8 or 10. Long builds with one question per set-up (`isBuild`) are counted in goes: 1, 2 or 3.
2. **Start**, then for each set-up: the set-up screen (orange "Set up" banner, for the adult), then its questions one per screen, each under a purple "Ask" banner. Keep the two looking different: the owner could not tell them apart before.
   The questions are the main one, then its `more` follow-ups. When a set-up runs out, or Ramp up moves to the next difficulty, a new one is dealt.
   The header always says "Question 2 of 5". It stops at the number asked for, even part-way through a set-up's follow-ups.
3. **Stars**: one slot per question. A right answer (or Did it) fills it. Show the answer and Skip leave it empty. Nothing is taken away.
4. **Done**: stars out of questions, then the adult taps Too easy / Just right / Too tricky / Not today.

The owner found the old design confusing (steps 1 to 3, a separate "stars to finish" number, and no way to tell how many
questions were coming). Do not bring back per-strand steps or a stars target.

Progress is kept per child. For each activity it remembers the last difficulty and rating; `suggest()` in `store.js` opens it
one harder after "too easy", one easier after "too tricky", otherwise the same. The picker (`weight()`) prefers activities
never tried, then "just right" ones, and avoids repeats on the same day.
Saved in `localStorage` under `toybox-maths-v2`. Older records have a numeric `level` where newer ones have `mode`; both are read.
If the saved shape changes again, bump the key or migrate.

## Publishing

    node tools/validate.mjs && git add -A && git commit -m "..." && git push origin main

Phones fetch fresh files whenever they are online, and fall back to the saved copy offline (see `sw.js`).
Do not go back to serving saved files first: it once left a phone with new HTML and old CSS and JavaScript, which broke the tabs.
