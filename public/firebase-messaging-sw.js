// Firebase Messaging Service Worker
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.22.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyBw9fYvEkAJRmeD8QO23G3uRw5LXp_v3b0",
  authDomain: "spsdodjezdovka.firebaseapp.com",
  projectId: "spsdodjezdovka",
  storageBucket: "spsdodjezdovka.firebasestorage.app",
  messagingSenderId: "471719692247",
  appId: "1:471719692247:web:87ec4d504bb77239c12d92",
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[SW] Background message:', payload);

  const title = payload.data?.title || 'SPSD Timetable';
  const body = payload.data?.body || 'Tvůj spoj se blíží!';

  return self.registration.showNotification(title, {
    body,
    icon: '/pictures/robotz-192.png',
    badge: '/pictures/robotz-192.png',
    vibrate: [200, 100, 200],
    tag: `spsd-${Date.now()}`, // unique tag → každá notifikace zvlášť, ne overlap
    renotify: true,
    requireInteraction: true,
    data: payload.data || {},
  });
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) return clients.openWindow('/m');
    })
  );
});

console.log('[SW] Firebase Messaging SW loaded');
