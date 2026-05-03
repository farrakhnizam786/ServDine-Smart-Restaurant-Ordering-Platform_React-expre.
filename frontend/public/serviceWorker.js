self.addEventListener("install", (event) => {
    console.log("Service Worker installed");
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("Service Worker activated");
    event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
    // basic fetch handling — pass through all requests
    event.respondWith(fetch(event.request));
});
