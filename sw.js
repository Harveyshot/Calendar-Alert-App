const CACHE_NAME = 'calendarcco-v2';
const urlsToCache = [
  '/Calendar-Alert-App/',
  '/Calendar-Alert-App/index.html',
  '/Calendar-Alert-App/manifest.json',
  '/Calendar-Alert-App/favicon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
