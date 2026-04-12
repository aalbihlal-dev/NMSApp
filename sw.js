var CACHE = 'module-scanner-v19'; // Increment this version
var URLS = [
  '/',
  '/index.html'
];

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE).then(function(c) {
      return c.addAll(URLS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(ks) {
      return Promise.all(
        ks.filter(function(k) { return k !== CACHE; })
          .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// STALE-WHILE-REVALIDATE PATTERN
self.addEventListener('fetch', function(e) {
  if (e.request.method !== 'GET') return;
  
  var u = new URL(e.request.url);
  if (u.origin !== location.origin) return;

  e.respondWith(
    caches.open(CACHE).then(function(cache) {
      return cache.match(e.request).then(function(cachedResponse) {
        var fetchPromise = fetch(e.request).then(function(networkResponse) {
          // Update the cache with the fresh version for next time
          cache.put(e.request, networkResponse.clone());
          return networkResponse;
        }).catch(function() {
          // Fallback if network fails entirely
          return cachedResponse;
        });
        
        // Return cache first for speed, or wait for network if cache is empty
        return cachedResponse || fetchPromise;
      });
    })
  );
});
