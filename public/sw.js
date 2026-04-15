const CACHE_NAME = 'spsd-timetable-v1';
const urlsToCache = [
  '/',
  '/pragensis',
  '/moravska',
  '/kosire',
  '/static/js/bundle.js',
  '/static/css/main.css',
  '/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png',
  '/pictures/snow_spsd.png',
  '/pictures/b1729e07-3fec-4e02-8298-7438ffe7f242.png',
  '/pictures/robotz.png',
  '/pictures/robot-christmas.png',
  '/pictures/robot-newyear.png',
  '/pictures/robot-halloween.png',
  '/pictures/robot-spring.png',
  '/pictures/robot-summer.png',
  '/pictures/robot-autumn.png',
  '/pictures/robot-winter.png',
  '/pictures/robot-easter.png'
];

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// Fetch event
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => {
        // Return cached version or fetch from network
        if (response) {
          return response;
        }

        return fetch(event.request).then((response) => {
          // Check if we received a valid response
          if (!response || response.status !== 200 || response.type !== 'basic') {
            return response;
          }

          // Clone the response
          const responseToCache = response.clone();

          caches.open(CACHE_NAME)
            .then((cache) => {
              cache.put(event.request, responseToCache);
            });

          return response;
        });
      })
  );
});

// Activate event
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
    })
  );
});

// Background sync for offline data
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Sync cached data when back online
    console.log('Background sync triggered');
  } catch (error) {
    console.error('Background sync failed:', error);
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'Nová aktualizace odjezdů',
    icon: '/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png',
    badge: '/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png',
    vibrate: [200, 100, 200],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'Zobrazit odjezdy',
        icon: '/pictures/fedda8c8-51ba-4dc4-a842-29979e71d4a8.png'
      },
      {
        action: 'close',
        title: 'Zavřít'
      }
    ]
  };

  event.waitUntil(
    self.registration.showNotification('SPSD Tramvaje', options)
  );
});

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});