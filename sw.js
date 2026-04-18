const CACHE_NAME = 'ludo-v1';
const ASSETS = [
    './', './index.html', './css/style.css', './css/animations.css',
    './js/board.js', './js/game.js', './js/sound.js', './js/cards.js', 
    './js/ai.js', './js/network.js', './manifest.json'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
    e.respondWith(caches.match(e.request).then((res) => res || fetch(e.request)));
});
