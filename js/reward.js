// reward.js — what happens on screen when he gets one right.
// A burst of stars, the child's animal jumps, and a short chime (if sound is on).
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

const calm = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
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

function jump(cls) {
  const m = document.getElementById('mascot');
  if (!m) return;
  m.classList.remove('jump', 'dance');
  void m.offsetWidth; // restart the animation
  m.classList.add(cls);
}

// One right answer.
export function celebrate(sound) {
  burst(14, 150);
  jump('jump');
  document.querySelector('.stars .star.on:last-of-type')?.classList.add('pop');
  if (sound) chime([[659, 0, 0.18], [784, 0.09, 0.18], [1047, 0.18, 0.32]]);
}

// The end of a turn.
export function finale(sound) {
  burst(26, 240);
  setTimeout(() => burst(18, 170), 350);
  jump('dance');
  if (sound) chime([[523, 0, 0.16], [659, 0.12, 0.16], [784, 0.24, 0.16], [1047, 0.36, 0.2], [784, 0.5, 0.14], [1047, 0.62, 0.45]]);
}

// Leaving the screen: clear anything still flying.
export function hush() {
  document.querySelectorAll('.burst').forEach((b) => b.remove());
}
