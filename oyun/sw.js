// İlk ziyaretten sonra oyunun internetsiz açılmasını sağlar.
const CACHE = "arkadas-arenasi-14facd8454";
const FILES = ["./", "./index.html", "./manifest.webmanifest", "./icon-180.png", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("arkadas-arenasi-") && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET" || new URL(req.url).origin !== self.location.origin) return;
  if (req.mode === "navigate") {
    // İnternet varsa en yeni sürüm; yoksa ya da yavaşsa kayıtlı kopya
    const network = fetch(req).then((res) => {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put("./index.html", copy));
      return res;
    });
    const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), 3000));
    event.respondWith(Promise.race([network, timeout]).catch(() => caches.match("./index.html")));
    return;
  }
  event.respondWith(caches.match(req).then((hit) => hit || fetch(req)));
});
