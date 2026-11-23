
const CACHE_NAME = "todo-app-cache-v1";

// Service Worker di-install
self.addEventListener("install", function(event) {
    console.log("Service Worker: Installing...");
    self.skipWaiting();
});

// Service Worker diaktifkan
self.addEventListener("activate", function(event) {
    console.log("Service Worker: Activated...");
    event.waitUntil(self.clients.claim());
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
            return self.clients.openWindow("./");
        })
    );
});
