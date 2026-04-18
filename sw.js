/* =============================================
   LUDO NEXUS — Service Worker (sw.js)
   PWA Offline Support
   Developer: Muhammad Shourov (V4MPIR3)
   ============================================= */

const CACHE_NAME = 'ludo-nexus-v1.0.0';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/css/themes.css',
  '/css/animations.css',
  '/js/sound.js',
  '/js/board.js',
  '/js/cards.js',
  '/js/ai.js',
  '/js/network.js',
  '/js/game.js',
  '/manifest.json',
  'https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@700;900&family=Rajdhani:wght@400;500;600;700&family=Orbitron:wght@400;700;900&display=swap'
];

// ─── Install ───
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.allSettled(
        ASSETS.map(url => cache.add(url).catch(e => console.warn('Cache miss:', url)))
      );
    }).then(() => self.skipWaiting())
  );
});

// ─── Activate ───
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// ─── Fetch ───
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Don't cache Firebase requests
  if (url.hostname.includes('firebase') || url.hostname.includes('google') && url.pathname.includes('api')) {
    event.respondWith(fetch(request).catch(() => new Response('offline', { status: 503 })));
    return;
  }

  // Cache-first for static assets
  event.respondWith(
    caches.match(request).then(cached => {
      if (cached) return cached;
      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type === 'opaque') return response;
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(request, clone));
        return response;
      }).catch(() => {
        if (request.destination === 'document') return caches.match('/index.html');
        return new Response('', { status: 404 });
      });
    })
  );
});

// ─── Message ───
self.addEventListener('message', event => {
  if (event.data === 'skipWaiting') self.skipWaiting();
});
