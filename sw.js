const CACHE_NAME = 'ludo-royale-v1';
const urlsToCache = [
  '/ludo-game/',
  '/ludo-game/index.html',
  '/ludo-game/css/style.css',
  '/ludo-game/css/themes.css',
  '/ludo-game/css/animations.css',
  '/ludo-game/js/main.js',
  '/ludo-game/js/game.js',
  '/ludo-game/js/board.js',
  '/ludo-game/js/ai.js',
  '/ludo-game/js/network.js',
  '/ludo-game/js/cards.js',
  '/ludo-game/js/sound.js',
  '/ludo-game/manifest.json',
  'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css',
  'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;600;700&display=swap'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
  );
});
