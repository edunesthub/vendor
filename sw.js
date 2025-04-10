const CACHE_NAME = "vendor-portal-cache-v8"; // Updated cache version
const urlsToCache = [
    "/",
    "/index.html",
    "index.html",
    "manifest.json",
    "https://cdn.tailwindcss.com",
    "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js",
    "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js",
    "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js",
    "https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@300;500;700&display=swap",
    "https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css",
    "icons/icon-192x192.png",
    "icons/icon-512x512.png"
];

// Install event - Cache essential files
self.addEventListener("install", event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log("Caching vendor portal files");
                return Promise.all(
                    urlsToCache.map(url => {
                        return cache.add(url).catch(err => {
                            console.warn(`Failed to cache ${url}: ${err}`);
                        });
                    })
                );
            })
            .then(() => self.skipWaiting())
            .catch(err => console.error("Installation failed:", err))
    );
});

// Activate event - Clean up old caches
self.addEventListener("activate", event => {
    const cacheWhitelist = [CACHE_NAME];
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        if (!cacheWhitelist.includes(cacheName)) {
                            console.log("Deleting old cache:", cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => self.clients.claim())
            .catch(err => console.error("Activation failed:", err))
    );
});

// Fetch event - Cache-first strategy with network fallback
self.addEventListener("fetch", event => {
    const request = event.request;

    // Skip non-GET requests and requests to other domains
    if (request.method !== "GET" || !request.url.startsWith(self.location.origin)) {
        return;
    }

    // Serve app shell immediately for navigation requests
    if (request.mode === 'navigate') {
        event.respondWith(
            caches.match('/index.html')
                .then(cachedResponse => {
                    const networkFetch = fetch(request).catch(() => cachedResponse);
                    event.waitUntil(updateCache(request)); // Update cache in background
                    return cachedResponse || networkFetch;
                })
        );
        return;
    }

    // Standard cache strategy for other resources
    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                // Return cached response if available
                if (cachedResponse) {
                    // Update cache in background for non-static assets
                    if (!request.url.includes('/icons/')) {
                        event.waitUntil(updateCache(request));
                    }
                    return cachedResponse;
                }

                // Fetch from network if not cached
                return fetch(request)
                    .then(networkResponse => {
                        const responseToCache = networkResponse.clone();
                        if (networkResponse && networkResponse.status === 200) {
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(request, responseToCache))
                                .catch(err => console.warn("Cache update failed:", err));
                        }
                        return networkResponse;
                    })
                    .catch(err => {
                        console.warn("Fetch failed:", err);
                        if (request.mode === "navigate") {
                            return caches.match("index.html")
                                .then(fallback => fallback || Promise.reject("No fallback available"));
                        }
                        return Promise.reject("Network and cache unavailable");
                    });
            })
    );
});

// Helper function to update cache in background
function updateCache(request) {
    return fetch(request)
        .then(networkResponse => {
            if (networkResponse && networkResponse.status === 200) {
                return caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(request, networkResponse.clone());
                    });
            }
        })
        .catch(err => console.warn("Background update failed:", err));
}

// OneSignal integration (if needed)
self.addEventListener('push', function(event) {
    const options = {
        body: event.data.text(),
        icon: 'icons/icon-192x192.png',
        badge: 'icons/icon-512x512.png'
    };

    event.waitUntil(
        self.registration.showNotification('New Notification', options)
    );
});