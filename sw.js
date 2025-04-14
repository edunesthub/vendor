const CACHE_NAME = "vendor-portal-cache-v14";
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",
  "https://cdn.tailwindcss.com",
  "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js",
  "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js",
  "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js",
  "https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@300;500;700&display=swap",
  "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
  "/img/icon-192x192.png",
];

// sw.js
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js');
importScripts('https://www.gstatic.com/firebasejs/10.9.0/firebase-messaging.js');

const firebaseConfig = {
    apiKey: "AIzaSyADvpUQWo75ExePGoCRirD2mM-lmfM4Cmc",
    authDomain: "von600-7982d.firebaseapp.com",
    projectId: "von600-7982d",
    storageBucket: "von600-7982d.appspot.com",
    messagingSenderId: "164591218045",
    appId: "1:164591218045:web:afe17512e16573e7903014",
    measurementId: "G-E69DMPLXBK",
    vapidKey: "BDN5OP5zbD5oeO9Dw1iqr_Bl9t0GGk-Bm0rnh14gzLDU3frlOMGxLzXAXb82A3VrqI3REnmkdTTu1OkcYCeg9Rk"
};

firebase.initializeApp(firebaseConfig);
const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
    const notificationTitle = payload.notification.title;
    const notificationOptions = {
        body: payload.notification.body,
        icon: '/img/icon-192x192.png',
        badge: '/img/icon-192x192.png',
        vibrate: [200, 100, 200],
        data: { url: '/' } // Redirect to vendor portal on click
    };

    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    const url = event.notification.data.url;
    event.waitUntil(clients.openWindow(url));
});

// Install event: Cache essential files
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log("Caching assets");
      return cache.addAll(urlsToCache);
    }).then(() => self.skipWaiting())
  );
});

// Activate event: Clean up old caches
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log("Deleting old cache:", cache);
            return caches.delete(cache);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event: Serve cached content or fetch from network
self.addEventListener("fetch", (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).catch(() => {
        return caches.match("/index.html");
      });
    })
  );
});

// Push event: Handle push notifications
self.addEventListener("push", (event) => {
  const data = event.data.json();
  const title = data.title || "Chawp Vendor Portal";
  const options = {
    body: data.body || "New update available!",
    icon: "/img/icon-192x192.png",
    badge: "/img/icon-192x192.png",
    vibrate: [200, 100, 200],
    tag: data.tag || "chawp-notification",
    renotify: true,
  };
  event.waitUntil(self.registration.showNotification(title, options));
});

// Notification click event: Focus or open the portal
self.addEventListener("notificationclick", (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes("index.html") && "focus" in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});