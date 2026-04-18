// sw.js - Service Worker by V4MPIR3
const CACHE_NAME = 'ludo-v1';
const ASSETS = [
    './',
    './index.html',
    './css/style.css',
    './css/themes.css',
    './css/animations.css',
    './js/board.js',
    './js/game.js',
    './js/sound.js',
    './js/cards.js',
    './js/ai.js',
    './js/network.js',
    './manifest.json'
];

// ইন্সটল করার সময় ফাইলগুলো সেভ করা
self.addEventListener('install', (e) => {
    e.waitUntil(
        caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
    );
});

// অফলাইনে ফাইলগুলো সার্ভ করা
self.addEventListener('fetch', (e) => {
    e.respondWith(
        caches.match(e.request).then((res) => res || fetch(e.request))
    );
});
