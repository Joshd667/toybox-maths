// index.js — the list of everything in the pack.
// To add a new strand file: import it here and add it to ACTIVITIES.

import counting from './counting.js';
import numerals from './numerals.js';
import comparing from './comparing.js';
import adding from './adding.js';
import patterns from './patterns.js';
import building from './building.js';
import position from './position.js';
import measures from './measures.js';

export const ACTIVITIES = [...counting, ...numerals, ...comparing, ...adding, ...patterns, ...building, ...position, ...measures];

// The eight strands, in the order they appear in the app.
// "area" is the NCETM early-years area each one belongs to.
export const STRANDS = [
  { id: 'counting', name: 'Counting', colour: '#D7282F', area: 'Cardinality and counting', blurb: 'One number for each thing, and the last number is how many.' },
  { id: 'numerals', name: 'Numbers', colour: '#1F6FD0', area: 'Cardinality and counting', blurb: 'Reading written numbers and putting them in order.' },
  { id: 'comparing', name: 'More or fewer', colour: '#A87400', area: 'Comparison', blurb: 'More, fewer, the same, and how many more.' },
  { id: 'adding', name: 'Adding and taking away', colour: '#2E9E4B', area: 'Composition', blurb: 'Small numbers, real toys, and "how many now?"' },
  { id: 'patterns', name: 'Patterns', colour: '#7B4BB7', area: 'Pattern', blurb: 'Copy, continue, fix and invent things that repeat.' },
  { id: 'building', name: 'Building', colour: '#F07F1E', area: 'Shape and space', blurb: 'Copying models and solving building problems.' },
  { id: 'position', name: 'Position words', colour: '#1FA4A0', area: 'Shape and space', blurb: 'On, under, behind, between, first, last.' },
  { id: 'measures', name: 'Sorting and measuring', colour: '#D2518F', area: 'Measures', blurb: 'Same and different, shapes, longer and taller.' },
];

// Toys the family might have out. Activities list which of these they can use.
export const TOYS = [
  { id: 'duplo', name: 'Duplo' },
  { id: 'wooden', name: 'Wooden blocks' },
  { id: 'cars', name: 'Cars' },
  { id: 'animals', name: 'Animals' },
  { id: 'brio', name: 'Brio trains' },
  { id: 'cubes', name: 'Linking cubes' },
  { id: 'numicon', name: 'Numicon' },
  { id: 'bunny', name: 'Rabbit game' },
];

export const byId = Object.fromEntries(ACTIVITIES.map((a) => [a.id, a]));
export const levelsOf = (a) => a.levels || [1, 2, 3];
