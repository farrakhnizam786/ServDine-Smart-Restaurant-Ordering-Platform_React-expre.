self.addEventListener("install", (event) => {
    console.log("Service Worker installed");
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    console.log("Service Worker activated");
    event.waitUntil(clients.claim());
});

self.addEventListener("fetch", (event) => {
    // Currently bypassing SW fetch interception to prevent network errors in dev mode.
    // Add caching strategies here later if needed.
});
