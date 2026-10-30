// 前綴必須含完整 repo 名稱：同 origin 上若有 opioid-converter-en 等相近名稱的工具，
// 只用 'opioid-converter-' 會把對方的快取當成自己的舊版刪掉。
const PREFIX = 'opioid-converter-zh-';
const CACHE = `${PREFIX}v1.4.10`;
// 改名前本工具使用的舊快取名（opioid-converter-v1.4.0 等），升級時一併清除
const LEGACY_CACHE = /^opioid-converter-v\d/;

const PRECACHE = [
  '/opioid-converter-zh/',
  '/opioid-converter-zh/index.html',
  '/opioid-converter-zh/manifest.json',
  '/opioid-converter-zh/js/calc.js',
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
        keys.filter(k => (k.startsWith(PREFIX) || LEGACY_CACHE.test(k)) && k !== CACHE).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// Fetch: cache-first for local; stale-while-revalidate for CDN
self.addEventListener('fetch', e => {
  // cache.put 不接受非 GET；交還瀏覽器處理
  if (e.request.method !== 'GET') return;

  const url = e.request.url;
  const isCDN = url.includes('cdn.jsdelivr.net') ||
                url.includes('fonts.googleapis.com') ||
                url.includes('fonts.gstatic.com');
  const cacheable = isCDN || url.startsWith(self.location.origin);

  // 網路請求一律發出（有快取時即背景更新）；clone 須在回應交出前完成
  let stored;
  const network = fetch(e.request).then(res => {
    if (res.ok && cacheable) {
      const copy = res.clone();
      stored = caches.open(CACHE).then(c => c.put(e.request, copy));
    }
    return res;
  });
  // 同步登記 waitUntil 延長 SW 生命週期；離線或 cache.put 失敗（如容量不足）在此吸收，不成為 unhandled rejection
  e.waitUntil(network.then(() => stored).catch(() => {}));

  // 有快取先回快取；否則走網路，離線時 document 退回 index.html，其餘回 network error（不可回 undefined）
  e.respondWith(
    caches.match(e.request).then(cached => cached || network
      .catch(() => (e.request.destination === 'document' ? caches.match('/opioid-converter-zh/index.html') : undefined))
      .then(res => res || Response.error()))
  );
});
