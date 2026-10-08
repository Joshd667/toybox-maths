// reward.js — what happens on screen when he gets one right.
// A burst of stars, the child's animal dances in the middle of the screen, and a short chime (if sound is on).
// With animation switched off (in Settings, or on the phone) the animal still appears, standing still.
// Sounds are made in code, so there are no audio files to download.

let audio = null;
function tone(freq, start, length, volume = 0.16) {
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = 'triangle';
  osc.frequency.value = freq;
  const t = audio.currentTime + start;
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(volume, t + 0.02);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + length);
  osc.connect(gain).connect(audio.destination);
  osc.start(t);
  osc.stop(t + length + 0.05);
}
function chime(notes) {
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === 'suspended') audio.resume();
    notes.forEach(([freq, start, length]) => tone(freq, start, length));
  } catch {
    /* no sound available: the pictures still work */
  }
}

const calm = () => document.body.classList.contains('calm') || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const COLOURS = ['#F2B01E', '#F2B01E', '#FF7A59', '#5746E0', '#2E9E4B', '#E86AA6'];

// Stars fly out from the middle of the screen.
function burst(count, spread) {
  if (calm()) return;
  const box = document.createElement('div');
  box.className = 'burst';
  box.setAttribute('aria-hidden', 'true');
  for (let i = 0; i < count; i++) {
    const s = document.createElement('i');
    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const far = spread * (0.55 + Math.random() * 0.45);
    s.style.setProperty('--dx', Math.cos(angle) * far + 'px');
    s.style.setProperty('--dy', Math.sin(angle) * far - 40 + 'px');
    s.style.setProperty('--turn', Math.random() * 540 - 270 + 'deg');
    s.style.setProperty('--size', 16 + Math.random() * 20 + 'px');
    s.style.background = COLOURS[i % COLOURS.length];
    s.style.animationDelay = Math.random() * 80 + 'ms';
    box.appendChild(s);
  }
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 1400);
}

// The child's animal pops up in the middle of the screen, dances, and drops away again.
// It floats above the page, so it is never hidden behind the buttons, and taps pass straight through it.
// Each right answer gets the next of three dances (the moves themselves are in css/app.css).
const MOVES = ['bop', 'twirl', 'shimmy'];
let move = Math.floor(Math.random() * MOVES.length);
const NOTE = '<svg class="tune" viewBox="0 0 24 24"><path d="M8 5.5l11-2.4v11.5a3.2 3.2 0 1 1-2-3V6.7l-7 1.5v8.5a3.2 3.2 0 1 1-2-3z"/></svg>';
function cheer(animal) {
  document.querySelectorAll('.cheer').forEach((c) => c.remove());
  if (!animal) return;
  const still = calm();
  move = (move + 1) % MOVES.length;
  const box = document.createElement('div');
  box.className = `cheer ${still ? 'still' : 'move-' + MOVES[move]}`;
  box.setAttribute('aria-hidden', 'true');
  box.innerHTML = `<div class="cheer-stage">${still ? '' : '<div class="cheer-rays"></div>'}<div class="cheer-disc"></div><div class="cheer-shadow"></div><div class="cheer-animal">${animal}</div>${still ? '' : NOTE.repeat(3)}</div>`;
  document.body.appendChild(box);
  setTimeout(() => box.remove(), 2900);
}

// One right answer. `animal` is the picture (SVG text) of the child's animal.
export function celebrate(sound, animal) {
  cheer(animal);
  burst(16, 170);
  if (sound) chime([[659, 0, 0.18], [784, 0.09, 0.18], [1047, 0.18, 0.32]]);
}

// The end of a turn: the animal on the finish screen dances.
export function finale(sound) {
  burst(26, 240);
  setTimeout(() => burst(18, 170), 350);
  const m = document.getElementById('mascot');
  if (m && !calm()) {
    m.classList.remove('dance', 'alive');
    void m.offsetWidth; // restart the animation
    m.classList.add('dance');
    // two dances, then it stands there blinking and swishing its tail
    setTimeout(() => m.isConnected && (m.classList.remove('dance'), m.classList.add('alive')), 4400);
  }
  if (sound) chime([[523, 0, 0.16], [659, 0.12, 0.16], [784, 0.24, 0.16], [1047, 0.36, 0.2], [784, 0.5, 0.14], [1047, 0.62, 0.45]]);
}

// Leaving the screen: clear anything still flying.
export function hush() {
  document.querySelectorAll('.burst, .cheer').forEach((b) => b.remove());
}
