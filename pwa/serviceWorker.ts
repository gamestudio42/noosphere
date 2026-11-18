import { createHash } from 'node:crypto';

// Builds the service worker that makes the web build playable offline. Vite
// calls this at build time with every file it wrote; nothing here runs in
// the page.
//
// - Install caches every file of this build, so the first visit is enough.
// - Navigations go to the network first and fall back to the cached page.
// - Everything else is served from the cache first: asset names carry a
//   content hash, so a new build never collides with an old one. Vary is
//   ignored: servers send Vary: Origin, and module scripts ask with an Origin
//   header that the precache request did not have.
// - Cache names carry the registration scope: gamestudio42.github.io hosts
//   other games and pull request previews, each with its own worker, and none
//   may delete another's cache.

export const cacheVersion = (files: string[]) =>
  createHash('sha256')
    .update([...files].sort().join('\n'))
    .digest('hex')
    .slice(0, 12);

export const serviceWorkerSource = (files: string[], version = cacheVersion(files)) => {
  // The page itself is emitted after other plugins see the bundle, so it is always listed here
  const others = files.filter((f) => f !== 'index.html' && f !== 'sw.js');
  const precache = ['./', './index.html', ...others.map((f) => `./${f}`)];
  return `// Generated at build time by pwa/serviceWorker.ts. Do not edit.
const PREFIX = 'noosphere:' + self.registration.scope + ':';
const CACHE = PREFIX + ${JSON.stringify(version)};
const FILES = ${JSON.stringify(precache)};

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
`;
};
