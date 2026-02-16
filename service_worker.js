/**
 * SharkLearn Service Worker - v39
 */
const CACHE_NAME = 'sharklearn-v39';
const ASSETS = [
    './',
    'index.html?v=26',
    'shark_style.css?v=26',
    'quiz_engine.js?v=26',
    'content/bio_7.js?v=12',
    'content/geo_5.js?v=12',
    'content/eng_5.js?v=12',
    'content/ger_5.js?v=12',
    'content/his_7.js?v=13',
    'content/geo_7.js?v=13',
    'content/hrv_5.js?v=13',
    'content/hrv_7.js?v=13',
    'assets/img/shark_icon.svg',
    'manifest.json'
];

self.addEventListener('install', event => {
    self.skipWaiting();
    event.waitUntil(
        caches.open(CACHE_NAME).then(cache => {
            return cache.addAll(ASSETS);
        })
    );
});

self.addEventListener('activate', event => {
    event.waitUntil(
        caches.keys().then(keys => {
            return Promise.all(
                keys.filter(key => key !== CACHE_NAME).map(key => caches.delete(key))
            );
        })
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request).then(response => {
            return response || fetch(event.request);
        })
    );
});
