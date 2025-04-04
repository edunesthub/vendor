const CACHE_NAME = "vendor-portal-cache-v2";
const urlsToCache = [
    "/",
    "vendor-login.html",
    "vendor-dashboard.html",
    "vendor-menu.html",
    "vendor-orders.html",
    "vendor-settings.html",
    "https://cdn.tailwindcss.com",
    "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js",
    "https://www.gstatic.com/firebasejs/10.9.0/firebase-firestore.js",
    "https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js",
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
    const url = new URL(request.url);

    // Handle only GET requests
    if (request.method !== "GET") {
        return;
    }

    event.respondWith(
        caches.match(request)
            .then(cachedResponse => {
                // Return cached response if available
                if (cachedResponse) {
                    // Update cache in background
                    event.waitUntil(updateCache(request));
                    return cachedResponse;
                }

                // Fetch from network if not cached
                return fetch(request)
                    .then(networkResponse => {
                        // Cache successful responses
                        if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
                            const responseToCache = networkResponse.clone();
                            caches.open(CACHE_NAME)
                                .then(cache => cache.put(request, responseToCache))
                                .catch(err => console.warn("Cache update failed:", err));
                        }
                        return networkResponse;
                    })
                    .catch(err => {
                        console.warn("Fetch failed:", err);
                        // Offline fallback for navigation requests
                        if (request.mode === "navigate") {
                            return caches.match("vendor-login.html")
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
            if (networkResponse && networkResponse.status === 200 && networkResponse.type === "basic") {
                return caches.open(CACHE_NAME)
                    .then(cache => {
                        cache.put(request, networkResponse.clone());
                    });
            }
        })
        .catch(err => console.warn("Background update failed:", err));
}