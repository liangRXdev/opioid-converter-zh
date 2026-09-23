const PREFIX = 'opioid-converter-';
const CACHE = `${PREFIX}v1.4.0`;

const PRECACHE = [
  '/opioid-converter-zh/',
  '/opioid-converter-zh/index.html',
  '/opioid-converter-zh/manifest.json',
  '/opioid-converter-zh/icons/icon-192.png',
  '/opioid-converter-zh/icons/icon-512.png',
];

// Install: pre-cache local assets
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(c => c.addAll(PRECACHE))
  );
  self.skipWaiting();
});

// Activate: remove old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    // 只汰換**本工具自己的** cache。
    // 本站與其他工具共用 liangrxdev.github.io 這個 origin，CacheStorage 是整個
    // origin 共用的——少了前綴守衛，這裡的 activate 會把鄰居工具的離線快取一起刪光。
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for local; stale-while-revalidate for CDN
self.addEventListener('fetch', e => {
  const url = e.request.url;
  const isCDN = url.includes('cdn.jsdelivr.net') ||
                url.includes('fonts.googleapis.com') ||
                url.includes('fonts.gstatic.com');

  e.respondWith(
    caches.match(e.request).then(cached => {
      const network = fetch(e.request).then(res => {
        if (res.ok && (isCDN || url.startsWith(self.location.origin))) {
          caches.open(CACHE).then(c => c.put(e.request, res.clone()));
        }
        return res;
      });
      // CDN: return cache immediately, update in background
      // Local: cache-first, fallback to network
      return cached || network.catch(() => {
        if (e.request.destination === 'document') {
          return caches.match('/opioid-converter-zh/index.html');
        }
      });
    })
  );
});
