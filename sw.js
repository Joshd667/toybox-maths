// sw.js — makes the app work with no connection once it has been opened once.
//
// How it behaves: every file is served straight from the phone's saved copy (fast,
// works offline), and at the same time a fresh copy is fetched in the background
// for next time. So after you publish a change, people see it the SECOND time they
// open the app.
//
// When you add a new file to the app, add it to FILES below.
// tools/validate.mjs checks this list against the repo and fails if they differ.

const CACHE = 'toybox-maths-1';

const FILES = [
  './',
  './index.html',
  './manifest.webmanifest',
  './css/app.css',
  './js/app.js',
  './js/store.js',
  './js/draw.js',
  './js/rng.js',
  './js/research.js',
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
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const saved = await cache.match(e.request, { ignoreSearch: true });
      const fresh = fetch(e.request)
        .then((res) => {
          if (res.ok) cache.put(e.request, res.clone());
          return res;
        })
        .catch(() => saved);
      return saved || fresh;
    })
  );
});
