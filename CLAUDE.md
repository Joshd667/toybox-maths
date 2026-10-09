# Toybox Maths: notes for whoever works on this next (human or AI)

A phone web app (PWA) of early maths activities for one family: a parent and young children, the eldest about three.
`PLAN.md` says what was reviewed in October 2026, what was built from it, and what is still to do (activities for 1- to 2-year-olds).
Plain HTML, CSS and JavaScript modules. **No framework, no build step, no dependencies.** Keep it that way.

Live site: GitHub Pages, served from the `main` branch root. Pushing to `main` publishes.

## Layout

| File | What it is |
|---|---|
| `index.html` | The one page. Four bottom tabs (Play, Favourites, Progress, Settings) and an empty `<main>`. |
| `css/app.css` | All styling. Colours and fonts are variables at the top. |
| `js/app.js` | The screens and all tap handling. Routes are listed at the top of the file. |
| `js/store.js` | Children's profiles, favourites and progress (saved on the phone), and how the next activity is chosen. |
| `js/reward.js` | Stars, the dancing animal and the chime when he gets one right. Picks which of the three dances plays. |
| `js/wording.js` | Rewrites "he" text as "she" for a child's profile. |
| `js/draw.js` | Every picture. Toy "sprites" plus layout helpers. Pure functions, no DOM. |
| `js/animals.js` | The animal and rabbit drawings (used through `draw.js`). Each has named moving parts for the dance. |
| `js/brand.js` | The toy box logo: the home-screen icon and the small logo beside the app's name. |
| `js/rng.js` | Seeded random numbers, so every variation can be reproduced and tested. |
| `js/research.js` | Every source cited, with what it found and what it does not show. |
| `js/activities/index.js` | List of strands, toys, and all activities. |
| `js/activities/kit.js` | One import for activity files: all of `draw.js` plus small helpers. |
| `js/activities/<strand>.js` | The activities, one file per strand. **This is where most additions go.** |
| `sw.js` | Offline support. Has a list of every file. |
| `tools/validate.mjs` | The test. Run before every commit. |
| `tools/sheet.mjs` | Review sheets: one page per activity with two variations at each difficulty. Use it to check words, pictures and answers agree. |
| `tools/make-icons.mjs` | Rebuilds the files in `icons/` from `js/brand.js` (needs Playwright). Run it after changing the logo. |

## Adding an activity

1. Pick the strand file in `js/activities/` and copy an existing activity that is close to what you want.
2. Fill in the fixed parts:
   - `id`: unique, lower-case-with-dashes. Never change an id later (progress is saved against it).
   - `title`, `strand`, `minutes` (1 to 10)
   - `age`: 2.5, 3 or 4. The youngest age the Easy version is aimed at (see "Ages" below).
   - `upTo`: 3, 4 or 5, and above `age`. The age the hardest version is aimed at. Together they make the age pill ("Age 3 to 5").
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
`numicon`, `numiconStack` (shapes fitted together), `card`, `numeral`, `dots`, `engine`, `wagon`, `train`,
`trackPlan` (track from above, piece by piece), `trackBridge`, `bunny`, `peek` (the rabbit game's blocks), `flat`.
(`ramp` and `trackPath` are still in `draw.js` but nothing uses them: see `PLAN.md` for why there is no ramp activity.)
`kit.js` adds `trackList`, `mirror`, `sized` (toys drawn in different sizes) and `rabbitScene`.
Layout: `row`, `column`, `grid`, `flow` (wraps), `scatter`, `layer`, `scale`, `frame`, `tag`, `ring`, `hit`.
Compose these; do not write raw SVG in activity files. If a new toy is needed, add it to `draw.js`.
Keep pictures under about 500 units wide. Use colour names from `PAL` so the words and the picture always agree.
Draw generic toys only: no branded characters or copies of a product's own artwork.

Animals are drawn in `js/animals.js` at four times their sprite size and scaled down. Keep each animal's sprite size
(`make(58, 46, ...)`) the same when redrawing, or activity layouts shift. Head, tail, legs, ears, eyes (and the duck's wing,
the elephant's trunk) are wrapped with `part(name, x, y, ...)`, where x, y is the point the part turns about. They stay still
in activity pictures; the "dancing parts" rules in `css/app.css` move them in the reward and on the finish screen.
A new animal needs those parts too, or it will dance as a stiff cut-out.

## Research rules (the owner cares about this most)

- Every activity must cite at least one entry in `js/research.js`, and `why` must not claim more than that entry's `found` line.
- Before adding a source, check it exists on a DOI page, ERIC, the publisher or the official body. Record what it found,
  the children's ages, and a `caveat` for what it does not show. If you could not read the abstract, set `checked: 'citation only'`.
- Most of this evidence is correlational and from 3½- to 5-year-olds. Say so. Do not write "proven" or "boosts".
- `NOT_CLAIMED` in `research.js` lists things we looked for and could not support (for example, any trial evidence for
  Numicon, a research-backed session length, any study of train track, ramps under 5, or patterns under 4).
  Do not add them back without a real source.
- When the only support is curriculum guidance, say so in `why` ("This rests on curriculum guidance").
- In one study familiar, detailed toys got in the way of counting (`petersen2013`), so `count-line` on Easy and Medium uses plain bricks
  and cubes when the family has them. Keep that in mind for new counting activities.
- No fads: no "brain training", learning styles, or claims of lasting advantage from starting early.

## Ages

Every activity has an `age` of 2.5, 3 or 4 and an `upTo` of 3, 4 or 5, shown as a pill ("Age 3 to 5") on each row of the lists
and at the top of the Get ready screen. The owner asked for a range, not "3+".
The first time a child opens an activity, `suggest()` in `store.js` picks the difficulty from their age and that range:
at or below `age` it is the easiest, at or above `upTo` the hardest, otherwise in between (rounding down, to start gently). After that it follows the ratings.
`upTo` is a judgement about the Hard version (4 if it stays inside the "3 and 4-year-olds" statements, 5 if it reaches Reception ideas).
A child's profile can hold a month of birth (`born: 'YYYY-MM'`, optional, typed in on the phone and saved only there).
`ageOf()` in `store.js` rounds the child's age to the nearest half year; `later(a)` says an activity is aimed at someone older.

- Nothing is ever hidden by age. In a list, activities for older children move to a "For later" group at the end.
  "Just pick one" and "Pick one of these" leave them out unless there is nothing else. With no month of birth, nothing moves.
  The owner asked for this: keep everything visible and do not add a new screen or tab for age.
- Choosing the age: 2.5 only where Development Matters lists the idea under "Birth to three" (comparing amounts and sizes,
  building, counting-like behaviour) or the Easy version is just that. 3 for the "3 and 4-year-olds" statements.
  4 for "Children in reception" ideas (counting sounds, number order, parts of a number, growing patterns) and for
  anything whose only evidence is from children of 4 and over.
- An activity he has managed (last rated "just right" or "too easy") stops counting as later and joins the main list.
- The ages are a rough guide, and the About the research page says so. Do not describe them as research findings.

There is no Guide tab any more (the owner could not see what it was for). What was worth keeping is the
"About the research" page, opened from the bottom of Settings: keeping it play, `NOT_CLAIMED`, the owner's kits, all sources.
How the app works is covered by the welcome screens and each activity's "i" button; do not add a manual back.

## The owner's toys, exactly

Ask before assuming anything beyond this. `PLAN.md` lists what is still unknown.

- **Train track.** Long straights, short straights, curves and a bridge. **No points, no tunnel.** Do not write an activity that needs them.
  The bridge is used as a landmark in `journey` (`trackBridge()` draws it from the side). Which kind of bridge it is has not been asked,
  so it is not yet part of any `trackPlan` layout.
  In `trackPlan` a curve is an eighth of a circle and about as long as a long straight, so "count the pieces" is a fair way to compare lengths.
- **Animals and cars.** A random mix in random sizes, not matched sets. So a size activity cannot say "the small cow":
  it says "pick any three that are clearly different sizes", the picture is captioned as an example, and the answer type is `do` or `open`.
  When exact sizes matter (as in `three-sizes`), use towers of bricks or cubes, which can be built to order.
- **Duplo.** Square (2 by 2) and long (2 by 4) bricks. Two squares cover one long one.
- **The rabbit game.** A wooden rabbit and three blocks: a hollow **blue box** (open at the front, round holes in the sides,
  a star-shaped hole in the top), a **yellow block** with a round hole right through it, which fits inside the blue box,
  and a low **red block** with a dip in the top. Checked against the maker's own photographs in October 2026.
  `peek()` draws our own plain versions; never copy the challenge-card artwork.
- **Numicon First Steps at home kit.** Shapes 1 to 10 (32 in all, so there are twins), pegs, a baseboard, picture overlays,
  a feely bag, numeral cards 0 to 10, a number line. The kit is labelled 3+ for small parts, so no Numicon activity starts below 3.

## Borrowing from Montessori

The owner asked whether Montessori could feature. The honest answer, recorded in `NOT_CLAIMED`, is "ideas borrowed from, not a claim".
What we borrow is what Montessori shares with general research on objects to handle (`laski2015`): change one thing at a time
(`order-size` on Easy uses one colour, so only height varies), come back to the same plain objects (`numicon-same`), and let the toy
show the mistake (a loop of track closes or it does not). Do not label an activity "Montessori" or cite the school studies as support for it.

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
  The logo is a smiling toy box with plain number blocks (1, 2, 3) jumping out; keep the blocks plain.
- Animation can be switched off in Settings (and the phone's reduce-motion setting is respected): the animal then appears standing still.

## First time, and adding to the home screen

The first time the app is opened, `welcome()` in `app.js` is shown instead of any other screen: what the app is, who is
playing, which toys are in the house, then how to add it to the home screen (left out if it is already running from there).
`welcomed` in the saved data records that it was finished; phones that already had a child saved skip it.

Until the app is on the home screen, the home screen's top bar has a round install button between the name and the child.
It opens the same help in a sheet. Android gives us an install event to fire from our own button (`beforeinstallprompt`);
iPhones do not, so they get the Share, Add to Home Screen steps. The button goes once the app runs from the home screen,
or the phone reports it was installed.

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

Progress is kept per child, along with their animal, wording (he or she) and month of birth. The Edit button beside a child on the Who is playing screen changes any of those (and the name) without touching progress; Remove is inside that form. For each activity it remembers the last difficulty and rating; `suggest()` in `store.js` opens it
one harder after "too easy", one easier after "too tricky", otherwise the same. The picker (`weight()`) prefers activities
never tried, then "just right" ones, and avoids repeats on the same day.
Saved in `localStorage` under `toybox-maths-v2`. Older records have a numeric `level` where newer ones have `mode`; both are read.
If the saved shape changes again, bump the key or migrate.

## Favourites

The owner asked for a way to favourite activities and a menu to find them. A heart marks one; the Favourites tab lists them.

- **Per child.** `favs` on the child's record is a list of activity ids, the newest first. `store.favs()`, `isFav()`, `toggleFav()`.
  Records saved before favourites existed are given an empty list when loaded, so the storage key did not change.
- **Where the heart is:** inside every row of every list, at its right-hand end (`actRow`); in the top bar of an open activity,
  beside the "i", on Get ready and all through the questions (the owner asked for it there); and as a button
  ("Add to favourites") on the finish screen once the adult has rated the turn.
  In a row the heart is plain, with no box of its own: the owner disliked it as a separate tile beside the row.
- **A heart, not a star.** Gold stars are what he earns. Do not reuse them for this.
- **A tap changes the heart where it stands** (`onTap`, 'fav'). Nothing is redrawn. On the Favourites screen the row stays until
  you leave, so a slip is one tap to undo; "Pick a favourite" skips a row whose heart has just been taken off.
- **The Favourites screen** is `favourites()`: the same rows as the other lists, one flat list, with "Pick a favourite" at the top
  when there are two or more. Two rows of chips filter it, by skill and by toy, and both can be on at once
  (the owner asked for filtering). With none, it says how to add one.
- Favourites are never moved to "For later", and "Pick a favourite" does not leave out ones aimed at older children
  (`pick(pool, not, anyAge)`): the adult chose them on purpose. One whose toys are all unticked in Settings is kept,
  in a "Toy switched off" group.
- "Just pick one" on the home screen takes no notice of favourites. It is for finding something new.
- In a list row the line under the title runs the full width, under the badge, to make room for the heart.

## Search

The owner asked for a way to search. The box is on the home screen, under "Just pick one". Typing swaps the skills or toys
below it for matching rows; clearing it brings them back. Only the part under the box is redrawn (`onSearch`), so the keyboard stays up.
What was typed is kept while the app is open, so closing an activity returns to the results.

- `search()` in `app.js` looks at the title, strand, skill, toy names (plus other names for them in `TOY_ALSO`: "train", "rabbit", "brick"),
  `needs`, and the maths `words` of each difficulty. Every word typed must match. Title matches come first.
- Nothing is hidden: an activity whose toy is unticked shows in a "Toy switched off" group, as on Favourites.
- A new toy should get a line in `TOY_ALSO` if people call it something else.

## Publishing

    node tools/validate.mjs && git add -A && git commit -m "..." && git push origin main

Phones fetch fresh files whenever they are online, and fall back to the saved copy offline (see `sw.js`).
Do not go back to serving saved files first: it once left a phone with new HTML and old CSS and JavaScript, which broke the tabs.
