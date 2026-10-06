# Toybox Maths

Short, play-based early maths activities for a child of about three, built around toys already
in the house: Duplo, wooden blocks, cars, animals, Brio trains, linking cubes, Numicon and a rabbit game.

It is a web app that installs on a phone (open the site, then "Add to Home Screen") and works offline.
The adult reads the set-up and the question; the child answers with the toys, and sometimes by tapping.

- 66 activities in 8 skills, browsed by toy or by skill, each with up to three steps of difficulty
- one screen to set up, then one question per screen, with follow-up questions on the same set-up
- a profile for each child, with their own progress and stars
- every activity is randomised (numbers, colours, toys), so it can be replayed
- every picture is drawn in code (SVG), so there are no image files to manage
- every activity cites the research it rests on, with what that research does *not* show
- names and progress are stored on the phone only

## Run it

No build step. Serve the folder and open it:

    python3 -m http.server 8000     # then open http://localhost:8000

## Check it

    node tools/validate.mjs

This generates every activity thousands of times and checks the answers and pictures.
Run it before every commit.

## Change it

See [CLAUDE.md](CLAUDE.md) for how the code is laid out and how to add an activity.

Fonts: Fredoka and Atkinson Hyperlegible, both under the SIL Open Font License (see `fonts/LICENSES.txt`).
