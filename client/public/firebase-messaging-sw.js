
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');
importScripts('https://storage.googleapis.com/workbox-cdn/releases/7.0.0/workbox-sw.js');

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCmGVvlQ8QciED-R6EShzOxuGmZ_hiHKO4",
  authDomain: "seavice-a25e0.firebaseapp.com",
  projectId: "seavice-a25e0",
  storageBucket: "seavice-a25e0.firebasestorage.app",
  messagingSenderId: "243409020515",
  appId: "1:243409020515:web:cfe39747aa24eaacd43a56"
};

// Initialize Firebase
try {
  firebase.initializeApp(firebaseConfig);
  console.log('🔥 Firebase app initialized');
} catch (error) {
  console.error('❌ Firebase initialization error:', error);
}

const messaging = firebase.messaging();
console.log('🔥 Firebase Messaging Service Worker initialized');

// Workbox PWA caching
if (workbox) {
  console.log('✅ Workbox loaded');
  
  workbox.core.skipWaiting();
  workbox.core.clientsClaim();
  
  // Precache static assets
  workbox.precaching.precacheAndRoute(self.__WB_MANIFEST || []);
  
  // Runtime caching strategies
  workbox.routing.registerRoute(
    /^https:\/\/fonts\.googleapis\.com\/.*/i,
    new workbox.strategies.CacheFirst({
      cacheName: 'google-fonts-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 10,
          maxAgeSeconds: 60 * 60 * 24 * 365
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        })
      ]
    })
  );
  
  workbox.routing.registerRoute(
    /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
    new workbox.strategies.StaleWhileRevalidate({
      cacheName: 'firebase-storage-cache',
      plugins: [
        new workbox.expiration.ExpirationPlugin({
          maxEntries: 50,
          maxAgeSeconds: 60 * 60 * 24 * 30
        }),
        new workbox.cacheableResponse.CacheableResponsePlugin({
          statuses: [0, 200]
        })
      ]
    })
  );
}

// Handle background messages - UNTUK PWA NATIVE APP
messaging.onBackgroundMessage((payload) => {
  console.log('📩 [SW Background] Message received:', payload);
  console.log('📩 [SW Background] Full payload:', JSON.stringify(payload));

  const notificationTitle = payload.notification?.title || payload.data?.title || 'SeaVice';
  const notificationBody = payload.notification?.body || payload.data?.body || 'Ada pesan baru untuk Anda';
  
  // Use messageId from payload for consistent tag across devices
  const messageId = payload.data?.messageId || `seavice-${Date.now()}`;
  
  console.log('📩 [SW Background] Title:', notificationTitle);
  console.log('📩 [SW Background] Body:', notificationBody);
  console.log('📩 [SW Background] MessageID:', messageId);

  const notificationOptions = {
    body: notificationBody,
    icon: '/icons/pwa-192x192.png',
    badge: '/icons/pwa-192x192.png',
    image: payload.notification?.image || payload.data?.imageUrl,
    data: {
      ...payload.data,
      url: payload.data?.actionUrl || '/',
      messageId: messageId
    },
    vibrate: [300, 100, 200, 100, 300],
    tag: messageId, // Gunakan messageId yang sama dari server untuk grouping
    requireInteraction: true,
    renotify: false, // Set false agar tidak duplicate notification
    silent: false
  };

  console.log('📩 [SW Background] Showing notification with tag:', messageId);

  return self.registration.showNotification(notificationTitle, notificationOptions)
    .then(() => {
      console.log('✅ [SW Background] Notification shown successfully');
    })
    .catch((error) => {
      console.error('❌ [SW Background] Error showing notification:', error);
    });
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  console.log('🖱️ [SW] Notification clicked');
  
  event.notification.close();

  const urlToOpen = event.notification.data?.url || '/';

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (let client of windowClients) {
          if (client.url.includes(urlToOpen) && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

self.addEventListener('activate', (event) => {
  console.log('✅ [SW] Service Worker activated');
});

self.addEventListener('install', (event) => {
  console.log('📦 [SW] Service Worker installed');
  self.skipWaiting();
});

// CRITICAL: Add direct push event listener as fallback
self.addEventListener('push', (event) => {
  console.log('📩 [SW PUSH EVENT] Push event received!');
  console.log('📩 [SW PUSH EVENT] Event data:', event.data ? event.data.text() : 'No data');
  
  if (!event.data) {
    console.error('❌ [SW PUSH EVENT] No data in push event');
    return;
  }

  let payload;
  try {
    payload = event.data.json();
    console.log('📩 [SW PUSH EVENT] Parsed payload:', JSON.stringify(payload));
  } catch (error) {
    console.error('❌ [SW PUSH EVENT] Error parsing push data:', error);
    return;
  }

  const notificationTitle = payload.notification?.title || payload.data?.title || 'SeaVice';
  const notificationBody = payload.notification?.body || payload.data?.body || 'Ada pesan baru untuk Anda';
  const messageId = payload.data?.messageId || `seavice-${Date.now()}`;
  
  console.log('📩 [SW PUSH EVENT] Showing notification:', notificationTitle, notificationBody);

  const notificationOptions = {
    body: notificationBody,
    icon: '/icons/pwa-192x192.png',
    badge: '/icons/pwa-192x192.png',
    image: payload.notification?.image || payload.data?.imageUrl,
    data: {
      ...payload.data,
      url: payload.data?.actionUrl || '/',
      messageId: messageId
    },
    vibrate: [300, 100, 200, 100, 300],
    tag: messageId,
    requireInteraction: true,
    renotify: false,
    silent: false
  };

  event.waitUntil(
    self.registration.showNotification(notificationTitle, notificationOptions)
      .then(() => {
        console.log('✅ [SW PUSH EVENT] Notification shown successfully');
      })
      .catch((error) => {
        console.error('❌ [SW PUSH EVENT] Error showing notification:', error);
      })
  );
});
