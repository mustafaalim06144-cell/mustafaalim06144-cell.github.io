// Service worker for Ağ Şehri: precaches the game so it runs with no connection.
const CACHE = 'ag-sehri-29a3e2f667';
const FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-icon.png',
  'lib/CopyShader.js',
  'lib/EffectComposer.js',
  'lib/LuminosityHighPassShader.js',
  'lib/RenderPass.js',
  'lib/ShaderPass.js',
  'lib/UnrealBloomPass.js',
  'lib/three.min.js'
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k.startsWith('ag-sehri-') && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  // The page itself: newest version when online (3 s limit), saved copy when offline.
  if (req.mode === 'navigate') {
    const net = fetch(req).then(res => { if (res && res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put('index.html', copy)); } return res; });
    const slow = new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 3000));
    e.respondWith(Promise.race([net, slow]).catch(() => caches.match('index.html', { ignoreSearch: true }).then(hit => hit || net)));
    return;
  }
  // Everything else cache first; fonts and anything else fetched once get stored for next time.
  e.respondWith(caches.match(req, { ignoreSearch: true }).then(hit => {
    if (hit) return hit;
    return fetch(req).then(res => {
      if (res && (res.ok || res.type === 'opaque')) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(req, copy)); }
      return res;
    }).catch(() => req.mode === 'navigate' ? caches.match('index.html') : Response.error());
  }));
});
