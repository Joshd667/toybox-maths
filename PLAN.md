# Toybox Maths: plan

Kept so that work can carry on across sessions. Update it when something here is done or decided.

## Review of October 2026

The owner asked for a review against the research for ages 1 to 4. What it found:

- Most toys were being used as things to count, not for what they are. Trains never used track. The rabbit game was only a rabbit.
  Nothing used the sizes of animals, cars or Duplo bricks. Only four activities used Numicon.
- Nothing was aimed below 2½.
- Ages were shown as "3+" with no upper end.

## Built from that review

| Gap | Activities | Rests on | Limit, stated in the app |
|---|---|---|---|
| Train track | `copy-track`, `track-gap`, `track-longer` | Copying a brick model (`verdine2014`), fitting flat shapes to a picture (`bower2020`), using a picture as a guide (`deloache1991`); length is curriculum guidance | No study of track building exists |
| Size | `big-little`, `three-sizes`, `will-it-fit` | `serasmith1987`, `rattermann1998` | The family-labels study is small, 3-year-olds only, a conference chapter |
| Duplo sizes | `brick-swap`; `sort-rule` now sometimes sorts long against square bricks | Curriculum guidance | Guidance only |
| Rabbit game | `rabbit-copy`; `where-does-it-go` and `you-tell-me` now use the game's blocks | `deloache1991`, `pruden2011` | Rests on the general case, not the product |
| Numicon | `numicon-same`, `numicon-order`, `numicon-fit` | `carbonneau2013`, `eef2020`, `bower2020`, `sarnecka2008` | Still no trial of Numicon itself |
| Counting | `count-line` on Easy and Medium prefers plain bricks and cubes | `petersen2013` | One lab study |
| Ages | Every activity has `age` and `upTo`; pill reads "Age 3 to 5"; first difficulty is chosen from the child's age | Curriculum guidance | A rough guide, not a research finding |

Montessori: recorded in `NOT_CLAIMED` and in `CLAUDE.md`. Ideas borrowed, no claim made.

## Favourites (October 2026)

Built: a heart inside every list row, in the top bar of an open activity and on the finish screen; a Favourites tab with
"Pick a favourite" and filters by skill and toy; a search box on the home screen.
Kept per child, on the phone. `CLAUDE.md` has the rules. Left out on purpose, to add only if asked:

- Putting favourites in an order by hand (they are listed newest first).
- Showing favourites on the Progress dots.
- Making "Just pick one" lean towards favourites.
- Remembering which toy and difficulty a favourite was played with (it opens as any activity does, on the suggested difficulty).

## Still to do

1. **Activities for 1- to 2-year-olds.** The owner said "later". Sources are already in `research.js`
   (`feigenson2002`, `greenfield1972`, `ornkloo2009`, `levine2010`). Candidates: naming sets of 1 to 3, nesting and stacking,
   which has more (1 against 2, 2 against 3), fitting shapes, in and out. Decide first:
   - These are "do it and watch" activities with no tapping and no right answer. They need their own, simpler screen,
     or an answer type that shows only "what to watch for".
   - `age` would need a value below 2.5 (validator, `ageWord`, the "For later" rule).
   - Small parts: linking cubes and Numicon pegs must be left out for this band.
   - Be plain that the research here describes what is typical. Nothing shows that practising early helps later maths.
2. **Ask the owner:** are there nesting cups or a shape sorter in the house (for the youngest band)? And which kind of train bridge is it
   (one humped piece, or ramps on supports)? He has a bridge: `journey` uses it as a landmark. Knowing the kind would let it go into
   `copy-track` layouts, with one track crossing over another.
3. **Sources to re-check.** Four pages would not load on the day (rate limits), so their entries point at the page that was read
   and leave out page numbers: `deloache1991`, `courtier2021`, `huttenlocher1999`, `feigenson2002`. Add DOIs when they can be confirmed.
4. **Per-age wording.** The age range picks the starting difficulty. If the owner wants more than that (different set-up text
   for a 2½-year-old and a 4-year-old at the same difficulty), that is a bigger change to `make()`.

## Looked at and not built

- **Ramps and rolling cars.** No credible study under 5. `ramp()` is still in `draw.js`, unused.
- **Patterns for under-threes.** No study of children under 4; the curriculum guidance starts at 3.
- **Anything labelled "Montessori".** See `CLAUDE.md`.
- **Block-play programmes as "improving maths".** The one small trial (Schmitt et al. 2018) found no significant main effect.
