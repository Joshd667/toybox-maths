// sw.js — makes the app work with no connection once it has been opened once.
//
// How it behaves: when there is a connection, every file is fetched fresh, so a
// published change shows up straight away and the files always match each other.
// With no connection (or a very slow one) the copy saved on the phone is used instead.
//
// When you add a new file to the app, add it to FILES below.
// tools/validate.mjs checks this list against the repo and fails if they differ.

const CACHE = 'toybox-maths-18';
// The big files behind search by sentence and the chat helper (see ai/README.md). They are not in FILES:
// they are kept the first time they are used, and are not thrown away when the app is updated.
const AI_CACHE = 'toybox-ai-1';

const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/store.js',
  './js/reward.js',
  './js/wording.js',
  './js/draw.js',
  './js/animals.js',
  './js/brand.js',
  './js/rng.js',
  './js/research.js',
  './js/ask.js',
  './js/meaning.js',
  './js/vectors.js',
  './js/chat.js',
  './js/activities/index.js',
  './js/activities/kit.js',
  './js/activities/counting.js',
  './js/activities/numerals.js',
  './js/activities/comparing.js',
  './js/activities/adding.js',
  './js/activities/patterns.js',
  './js/activities/building.js',
  './js/activities/position.js',
  './js/activities/measures.js',
  './fonts/fredoka.woff2',
  './fonts/atkinson-400.woff2',
  './fonts/atkinson-700.woff2',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE && k !== AI_CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  // The model files never change once published, so the saved copy is used first. (Only these: the app's own
  // files are always asked for fresh, see below.)
  if (url.pathname.includes('/ai/')) {
    e.respondWith(
      caches.open(AI_CACHE).then(async (cache) => {
        const saved = await cache.match(e.request);
        if (saved) return saved;
        const res = await fetch(e.request);
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      })
    );
    return;
  }
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const saved = await cache.match(e.request, { ignoreSearch: true });
      // Ask the network first, bypassing the browser's own cache. Give up after 4 seconds if a saved copy exists.
      const fresh = fetch(e.request, { cache: 'no-cache' }).then((res) => {
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      });
      if (!saved) return fresh;
      const slow = new Promise((resolve) => setTimeout(() => resolve(saved), 4000));
      return Promise.race([fresh.catch(() => saved), slow]);
    })
  );
});
