// Offline support. The app's own files are network-first, so a deploy shows up
// on the next launch; the face-tracking runtime and model (versioned CDN URLs)
// are cache-first because they're large and never change.
const CACHE = 'parallax-v1';
const CDN = ['https://cdn.jsdelivr.net/', 'https://storage.googleapis.com/mediapipe-models/'];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(['./', './manifest.webmanifest', './icon-192.png'])));
  self.skipWaiting();
});

self.addEventListener('activate', event => {
  event.waitUntil(caches.keys()
    .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', event => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = request.url;
  if (CDN.some(prefix => url.startsWith(prefix))) {
    event.respondWith(caches.match(request).then(hit => hit || fetch(request).then(response => {
      if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(request, copy)); }
      return response;
    })));
    return;
  }
  if (new URL(url).origin !== self.location.origin) return;
  event.respondWith(fetch(request).then(response => {
    if (response.ok) { const copy = response.clone(); caches.open(CACHE).then(cache => cache.put(request, copy)); }
    return response;
  }).catch(() => caches.match(request, { ignoreSearch: request.mode === 'navigate' })
    .then(hit => hit || (request.mode === 'navigate' ? caches.match('./') : Response.error()))));
});
