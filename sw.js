// PointPlan service worker: lets the app open and work without internet.
// Bump VERSION whenever app files change so phones pick up the new version.
const VERSION = 'pointplan-v7';
const SHELL = `${VERSION}-shell`;
const TILES = 'pointplan-tiles-osm'; // renamed so old (broken) map tiles saved on phones are thrown away
const FONTS = 'pointplan-fonts';
const MAX_TILES = 3000; // map tiles you have viewed stay available offline, up to this many

const APP_FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'vendor/leaflet.css',
  'vendor/leaflet.js',
  'vendor/topojson-client.min.js',
  'vendor/xlsx.full.min.js',
  'cloud.js',
  'firebase-config.js',
  'vendor/firebase/firebase-app.js',
  'vendor/firebase/firebase-auth.js',
  'vendor/firebase/firebase-firestore.js',
  'data/world.json',
  'data/cities.json',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/apple-touch-icon.png'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(SHELL).then(c => c.addAll(APP_FILES)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith('pointplan-') && k !== SHELL && k !== TILES && k !== FONTS).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

async function trim(cacheName, max) {
  const c = await caches.open(cacheName);
  const keys = await c.keys();
  for (let i = 0; i < keys.length - max; i++) await c.delete(keys[i]);
}

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // Pages: try the network first so updates arrive, fall back to the saved copy offline.
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then(res => { const copy = res.clone(); caches.open(SHELL).then(c => c.put('index.html', copy)); return res; })
        .catch(() => caches.match('index.html', {ignoreSearch: true}))
    );
    return;
  }

  // Map tiles: use the saved tile if we have it, otherwise download and keep it.
  if (url.hostname === 'tile.openstreetmap.org') {
    event.respondWith(caches.open(TILES).then(async c => {
      const hit = await c.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') { c.put(req, res.clone()); trim(TILES, MAX_TILES); }
      return res;
    }));
    return;
  }

  // Fonts: saved copy first, refresh in the background.
  if (/fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    event.respondWith(caches.open(FONTS).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(res => { c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }

  // Sign-in settings: always try the network first so a new config takes effect right away.
  if (url.origin === self.location.origin && url.pathname.endsWith('/firebase-config.js')) {
    event.respondWith(fetch(req).then(res => { const copy = res.clone(); caches.open(SHELL).then(c => c.put(req, copy)); return res; })
      .catch(() => caches.match(req, {ignoreSearch: true})));
    return;
  }

  // App files: answer from the saved copy, refresh it in the background.
  if (url.origin === self.location.origin) {
    event.respondWith(caches.open(SHELL).then(async c => {
      const hit = await c.match(req, {ignoreSearch: true});
      const net = fetch(req).then(res => { if (res.ok) c.put(req, res.clone()); return res; }).catch(() => hit);
      return hit || net;
    }));
  }
  // Anything else (place search) goes straight to the network.
});
