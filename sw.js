// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (PWA/device detection)
// ai: opencode/deepseek-v4.1-flash-free — 2026-10-22 (collision/story shell)
// App-shell service worker. three.js is pinned and cached too, so the installed game can
// start offline after one successful online visit. Bump CACHE when asset paths change.
const CACHE = 'five-sleeves-shell-v3';
const THREE = 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';
const SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './src/styles.css',
  './src/ai.js',
  './src/bindings.js',
  './src/characters.js',
  './src/collision.js',
  './src/combat.js',
  './src/config.js',
  './src/controls.js',
  './src/device.js',
  './src/devcodes.js',
  './src/events.js',
  './src/fighter.js',
  './src/game.js',
  './src/hud.js',
  './src/input.js',
  './src/log.js',
  './src/main.js',
  './src/match.js',
  './src/quests.js',
  './src/radar.js',
  './src/resources.js',
  './src/save.js',
  './src/scenery.js',
  './src/settings.js',
  './src/story.js',
  './src/weapons.js',
  './src/world.js',
  './src/worldmap.js',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png',
  './icons/apple-touch-icon.png',
  './icons/favicon-32.png',
  THREE
];

const CACHEABLE_ORIGINS = new Set([self.location.origin, 'https://cdn.jsdelivr.net']);

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE)
      .then(cache => cache.addAll(SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

function put(request, response) {
  if (!response || !response.ok) return response;
  const copy = response.clone();
  caches.open(CACHE).then(cache => cache.put(request, copy)).catch(() => {});
  return response;
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (!CACHEABLE_ORIGINS.has(url.origin)) return;

  // Navigations go to the network first so a deploy is picked up; offline falls back to shell.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then(response => put(request, response))
        .catch(() => caches.match('./index.html'))
    );
    return;
  }

  // Static modules use stale-while-revalidate: instant starts, background refresh, offline ready.
  event.respondWith(
    caches.match(request).then(cached => {
      const network = fetch(request)
        .then(response => put(request, response))
        .catch(() => cached);
      return cached || network;
    })
  );
});
