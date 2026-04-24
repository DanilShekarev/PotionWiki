const CACHE_NAME = 'potionwiki-v9';

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll([
        '/',
        '/index.html',
        '/editor.html',
        '/app.js',
        '/editor.js',
        '/style.css',
        '/editor.css',
        '/manifest.json',
        '/icons/icon-192.png',
        '/icons/icon-512.png'
      ]);
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      if (response) {
        return response;
      }

      return fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
          });
        }
        return networkResponse;
      });
    }).catch(() => {
      const url = event.request.url;
      if (url.includes('editor')) {
        return caches.match('/editor.html');
      }
      if (url.includes('index') || url.endsWith('/')) {
        return caches.match('/index.html');
      }
      return new Response('', { status: 503 });
    })
  );
});

self.addEventListener('message', (event) => {
  if (event.data === 'skipWaiting') {
    self.skipWaiting();
  }
});