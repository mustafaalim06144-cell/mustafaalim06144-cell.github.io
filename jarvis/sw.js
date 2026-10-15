// Service worker: keeps the app usable with no internet after the first visit.
const CACHE = "jarvis-offline-4fbf084608";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", event => {
  event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", event => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    // Online: fetch the newest page (and keep a copy). Offline or slow: the saved copy.
    const network = fetch(req).then(res => {
      const copy = res.clone();
      caches.open(CACHE).then(cache => cache.put("./index.html", copy));
      return res;
    });
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000));
    event.respondWith(Promise.race([network, timeout]).catch(() => caches.match("./index.html")));
    return;
  }
  event.respondWith(caches.match(req).then(hit => hit || fetch(req)));
});
