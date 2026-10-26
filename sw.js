// Avisos Venezuela — service worker prudente: solo se cachea la carcasa
// estática propia (página, manifest e iconos), con caché versionada.
// Las peticiones a las APIs (Open-Meteo, Marine, IEM, NWS, NHC) y a cualquier
// otro origen van SIEMPRE a la red: no se interceptan ni se cachean datos.
const CACHE = 'avisos-ve-v1';
const SHELL = ['./', './avisos-venezuela.html', './manifest.webmanifest',
  './icon-192.png', './icon-512.png', './icon-maskable-512.png', './apple-touch-icon.png'];
self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return; // otros orígenes: siempre red, sin caché
  // Lo propio: red primero (el HTML llega fresco) y la caché como reserva
  // para cuando no hay conexión.
  e.respondWith(
    fetch(e.request)
      .then((r) => { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(e.request, copy)); return r; })
      .catch(() => caches.match(e.request).then((m) => m || caches.match('./avisos-venezuela.html')))
  );
});
