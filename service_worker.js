const CACHE_NAME = 'sharklearn-v13';
const ASSETS = [
    './',
    'index.html',
    'shark_style.css?v=11',
    'quiz_engine.js?v=11',
    'content/bio_7.js?v=11',
    'content/geo_5.js?v=11',
    'content/eng_5.js?v=11',
    'content/ger_5.js?v=11',
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
