// Generated at build time by pwa/serviceWorker.ts. Do not edit.
const PREFIX = 'noosphere:' + self.registration.scope + ':';
const CACHE = PREFIX + "6631d36d5140";
const FILES = ["./","./index.html","./assets/space-grotesk-latin-300-normal-DiSf0yqz.woff2","./assets/space-grotesk-latin-700-normal-RjhwGPKo.woff2","./assets/space-grotesk-latin-400-normal-CJ-V5oYT.woff2","./assets/space-grotesk-latin-300-normal-Byd1NLsn.woff","./assets/space-grotesk-latin-700-normal-CwsQ-cCU.woff","./assets/space-grotesk-latin-400-normal-BnQMeOim.woff","./assets/index-DmxiGCcf.css","./assets/index-D-_duZyq.js","./apple-touch-icon.png","./icon-192.png","./icon-512.png","./icon-maskable-512.png","./icon.svg","./manifest.webmanifest"];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(FILES))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => k.startsWith(PREFIX) && k !== CACHE).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET' || new URL(request.url).origin !== self.location.origin) return;
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() =>
        caches.open(CACHE).then((cache) => cache.match('./index.html')),
      ),
    );
    return;
  }
  event.respondWith(
    caches
      .open(CACHE)
      .then((cache) => cache.match(request, { ignoreSearch: true, ignoreVary: true }))
      .then((hit) => hit || fetch(request)),
  );
});
