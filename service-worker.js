const CACHE_NAME = 'weekly-todo-cache-v2';
const URLS_TO_CACHE = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png',
    '/index.tsx',
    '/App.tsx',
    '/types.ts',
    '/constants.ts',
    '/components/TodoView.tsx',
    '/components/DayColumn.tsx',
    '/components/TaskItem.tsx',
    '/components/GraphView.tsx',
    '/components/Calendar.tsx',
    '/components/DonutChart.tsx',
    '/components/Confetti.tsx',
    'https://cdn.tailwindcss.com',
    'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;700&display=swap',
    'https://esm.sh/react@^19.1.1',
    'https://esm.sh/react-dom@^19.1.1/client'
];

// Install event: open cache and add all core files
self.addEventListener('install', event => {
    self.skipWaiting(); // Force the waiting service worker to become the active service worker.
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache and caching core assets');
                // Use addAll for atomic operation, but it fails if one request fails.
                // For external resources, a more robust approach is to cache them individually
                // and not fail the entire installation.
                const cachePromises = URLS_TO_CACHE.map(url => {
                    return cache.add(url).catch(err => {
                        console.warn(`Failed to cache ${url}:`, err);
                    });
                });
                return Promise.all(cachePromises);
            })
    );
});

// Fetch event: serve from cache, fallback to network, then cache the new resource
self.addEventListener('fetch', event => {
    if (event.request.method !== 'GET') {
        return;
    }
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }

                // Clone the request because it's a stream
                const fetchRequest = event.request.clone();

                return fetch(fetchRequest).then(
                    response => {
                        // Check if we received a valid response.
                        if (!response || response.status !== 200) {
                            return response;
                        }

                        // Clone the response because it's a stream
                        const responseToCache = response.clone();

                        caches.open(CACHE_NAME)
                            .then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                        return response;
                    }
                );
            })
    );
});

// Activate event: clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim()) // Take control of all pages under its scope immediately
  );
});
