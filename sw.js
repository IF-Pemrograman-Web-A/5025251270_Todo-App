const CACHE_NAME = "todo-app-cache-v4";

// Lokasi dasar aplikasi, misalnya /pweb_E05/
const BASE_PATH = new URL("./", self.location).pathname;

// File yang akan disimpan ketika Service Worker di-install
const APP_SHELL = [
    BASE_PATH,
    BASE_PATH + "index.php",
    BASE_PATH + "offline.html",
    BASE_PATH + "manifest.json",
    BASE_PATH + "style.css?v=4",
    BASE_PATH + "script.js?v=3"
];

// Proses install: menyimpan app shell ke Cache Storage
self.addEventListener("install", function(event) {
    console.log("Service Worker: Installing...");

    event.waitUntil(
        caches.open(CACHE_NAME).then(function(cache) {
            return cache.addAll(APP_SHELL);
        })
    );

    self.skipWaiting();
});

// Proses activate: menghapus cache versi lama
self.addEventListener("activate", function(event) {
    console.log("Service Worker: Activated...");

    event.waitUntil(
        caches.keys().then(function(cacheNames) {
            return Promise.all(
                cacheNames
                    .filter(function(name) {
                        return name.startsWith("todo-app-cache-")
                            && name !== CACHE_NAME;
                    })
                    .map(function(name) {
                        return caches.delete(name);
                    })
            );
        }).then(function() {
            return self.clients.claim();
        })
    );
});

// Menangani permintaan halaman dan file
self.addEventListener("fetch", function(event) {
    const request = event.request;

    // Hanya menangani permintaan GET
    if (request.method !== "GET") return;

    const url = new URL(request.url);

    // Jangan meng-cache permintaan ke luar aplikasi
    if (url.origin !== self.location.origin) return;

    // Navigasi halaman: Network First
    if (request.mode === "navigate") {
        event.respondWith(
            fetch(request).catch(async function() {
                return await caches.match(request)
                    || await caches.match(BASE_PATH + "offline.html");
            })
        );
        return;
    }

    // File statis: Cache First
    event.respondWith(
        caches.match(request).then(function(cachedResponse) {
            if (cachedResponse) return cachedResponse;

            return fetch(request).then(function(response) {
                if (response.ok) {
                    const responseClone = response.clone();

                    caches.open(CACHE_NAME).then(function(cache) {
                        cache.put(request, responseClone);
                    });
                }

                return response;
            });
        })
    );
});

// Menangani klik notifikasi
self.addEventListener("notificationclick", function(event) {
    event.notification.close();

    event.waitUntil(
        self.clients.matchAll({
            type: "window",
            includeUncontrolled: true
        }).then(function(clientList) {
            if (clientList.length > 0) {
                return clientList[0].focus();
            }

            return self.clients.openWindow(BASE_PATH);
        })
    );
});