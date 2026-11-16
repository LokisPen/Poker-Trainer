/* Card Room service worker: keeps a copy of the app so it opens and plays with no connection.
   Everything in ASSETS is fetched at install. After that, files are served from the copy and refreshed in the
   background, so a new version shows up the second time the app is opened. tests/pwa.test.js checks that
   ASSETS lists every file the app ships. */
const CACHE = 'card-room-v1';
const ASSETS = [
  './',
  './index.html',
  './manifest.webmanifest',
  './styles/app.css',
  './icons/icon.svg',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  /* src:start */
  './src/app/flow.js',
  './src/app/main.js',
  './src/app/router.js',
  './src/app/sound.js',
  './src/app/state.js',
  './src/app/storage.js',
  './src/app/tutor.js',
  './src/app/views/drills.js',
  './src/app/views/grid.js',
  './src/app/views/history.js',
  './src/app/views/learn.js',
  './src/app/views/lobby.js',
  './src/app/views/ranges.js',
  './src/app/views/results.js',
  './src/app/views/setup.js',
  './src/app/views/sheets.js',
  './src/app/views/stats.js',
  './src/app/views/table.js',
  './src/app/visuals.js',
  './src/core/cards.js',
  './src/core/icm.js',
  './src/game/bots.js',
  './src/game/coach.js',
  './src/game/drills.js',
  './src/game/engine.js',
  './src/game/session.js',
  './src/game/state.js',
  './src/tutorial/course.js',
  './src/tutorial/glossary.js',
  './src/tutorial/hands.js',
  './src/tutorial/lessons.js',
  /* src:end */
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches
      .open(CACHE)
      .then((c) => c.addAll(ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  const fonts = url.hostname === 'fonts.googleapis.com' || url.hostname === 'fonts.gstatic.com';
  if (url.origin !== self.location.origin && !fonts) return;
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const hit = await cache.match(req, { ignoreSearch: url.origin === self.location.origin });
      const fresh = fetch(req)
        .then((res) => {
          if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      if (hit) {
        e.waitUntil(fresh);
        return hit;
      }
      return (await fresh) || (req.mode === 'navigate' && (await cache.match('./index.html'))) || Response.error();
    }),
  );
});
