// Service Worker for KwizMe PWA
const CACHE_NAME = 'kwizme-v2';
const RUNTIME_CACHE = 'kwizme-runtime-v2';

// Assets to cache immediately on install
const PRECACHE_URLS = [
  '/',
  '/offline',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
];

// Install event - cache critical assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  const currentCaches = [CACHE_NAME, RUNTIME_CACHE];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return cacheNames.filter((cacheName) => !currentCaches.includes(cacheName));
    }).then((cachesToDelete) => {
      return Promise.all(cachesToDelete.map((cacheToDelete) => {
        return caches.delete(cacheToDelete);
      }));
    }).then(() => self.clients.claim())
  );
});

// Fetch event - network first, fall back to cache
self.addEventListener('fetch', (event) => {
  // Skip cross-origin requests
  if (!event.request.url.startsWith(self.location.origin)) {
    return;
  }

  // Skip API routes from caching (always use network)
  if (event.request.url.includes('/api/')) {
    event.respondWith(
      fetch(event.request).catch(() => {
        return new Response(
          JSON.stringify({ error: 'Offline - API unavailable' }),
          {
            headers: { 'Content-Type': 'application/json' },
            status: 503
          }
        );
      })
    );
    return;
  }

  // Network first strategy for navigation requests
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Cache successful responses
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Fall back to cache, then offline page
          return caches.match(event.request).then((cachedResponse) => {
            return cachedResponse || caches.match('/offline');
          });
        })
    );
    return;
  }

  // Cache first strategy for assets (CSS, JS, images)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }

      return fetch(event.request).then((response) => {
        // Don't cache non-successful responses or POST/PUT/DELETE requests
        if (!response || response.status !== 200 || response.type === 'error' ||
            event.request.method !== 'GET') {
          return response;
        }

        // Cache the fetched resource
        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then((cache) => {
          cache.put(event.request, responseClone);
        });

        return response;
      });
    })
  );
});

// Background sync for quiz submissions (when back online)
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-quiz-sessions') {
    event.waitUntil(syncQuizSessions());
  }
});

async function syncQuizSessions() {
  // Implementation would sync pending quiz sessions with server
  // This is a placeholder for future implementation
  console.log('Syncing quiz sessions...');
}

// Push notifications (optional - for reminders)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from KwizMe',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    }
  };

  event.waitUntil(
    self.registration.showNotification('KwizMe', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.openWindow('/')
  );
});
