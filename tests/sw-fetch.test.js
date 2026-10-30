// sw.js fetch：離線時不得回 undefined；背景更新失敗不得產生 unhandled rejection；非 GET 不攔截
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');
const ORIGIN = 'https://liangrxdev.github.io';

// cacheMap：url → response；online=false 時 fetch reject；putFails=true 時 cache.put reject
function loadSW({ cacheMap = {}, online = true, putFails = false } = {}) {
  const listeners = {};
  const puts = [];
  const ErrorResponse = { type: 'error' };
  const sandbox = {
    self: {
      addEventListener: (t, fn) => { listeners[t] = fn; },
      skipWaiting() {}, clients: { claim() {} }, location: { origin: ORIGIN },
    },
    Response: { error: () => ErrorResponse },
    fetch: async req => {
      if (!online) throw new TypeError('Failed to fetch');
      return { ok: true, clone() { return { cloned: req.url }; }, body: `net:${req.url}` };
    },
    caches: {
      match: async req => cacheMap[typeof req === 'string' ? req : req.url],
      keys: async () => [],
      delete: async () => true,
      open: async () => ({
        addAll: async () => {},
        put: async (req, res) => { if (putFails) throw new Error('QuotaExceededError'); puts.push(req.url); },
      }),
    },
  };
  vm.createContext(sandbox);
  vm.runInContext(SRC, sandbox);
  return { listeners, puts, ErrorResponse };
}

// 觸發 fetch 事件：回傳 respondWith 的結果與所有 waitUntil promise
async function dispatch(sw, { url, method = 'GET', destination = '' }) {
  let responded = null;
  const waits = [];
  sw.listeners.fetch({
    request: { url, method, destination },
    respondWith(p) { responded = p; },
    waitUntil(p) { waits.push(p); },
  });
  const res = responded === null ? null : await responded;
  await Promise.allSettled(waits);
  return { responded: responded !== null, res, waits };
}

// 收集本測試期間的 unhandledRejection
async function noUnhandled(fn) {
  const seen = [];
  const h = e => seen.push(e);
  process.on('unhandledRejection', h);
  try {
    await fn();
    await new Promise(r => setTimeout(r, 20));
  } finally {
    process.off('unhandledRejection', h);
  }
  return seen;
}

test('sw fetch：離線且無快取的非 document 請求 → Response.error()，不是 undefined', async () => {
  const sw = loadSW({ online: false });
  const { res } = await dispatch(sw, { url: `${ORIGIN}/opioid-converter-zh/icons/x.png`, destination: 'image' });
  assert.equal(res, sw.ErrorResponse);
});

test('sw fetch：離線 document → 回快取的 index.html', async () => {
  const idx = { body: 'index' };
  const sw = loadSW({ online: false, cacheMap: { '/opioid-converter-zh/index.html': idx } });
  const { res } = await dispatch(sw, { url: `${ORIGIN}/opioid-converter-zh/?x=1`, destination: 'document' });
  assert.equal(res, idx);
});

test('sw fetch：離線 document 且 index.html 也不在快取 → Response.error()', async () => {
  const sw = loadSW({ online: false });
  const { res } = await dispatch(sw, { url: `${ORIGIN}/opioid-converter-zh/`, destination: 'document' });
  assert.equal(res, sw.ErrorResponse);
});

test('sw fetch：有快取時離線，背景更新失敗不產生 unhandled rejection', async () => {
  const url = `${ORIGIN}/opioid-converter-zh/js/calc.js`;
  const cached = { body: 'cached' };
  const seen = await noUnhandled(async () => {
    const sw = loadSW({ online: false, cacheMap: { [url]: cached } });
    const { res } = await dispatch(sw, { url, destination: 'script' });
    assert.equal(res, cached);
  });
  assert.deepEqual(seen, []);
});

test('sw fetch：cache.put 失敗（如容量不足）不產生 unhandled rejection，仍回網路回應', async () => {
  const url = `${ORIGIN}/opioid-converter-zh/manifest.json`;
  const seen = await noUnhandled(async () => {
    const sw = loadSW({ putFails: true });
    const { res } = await dispatch(sw, { url });
    assert.equal(res.body, `net:${url}`);
  });
  assert.deepEqual(seen, []);
});

test('sw fetch：背景更新以 waitUntil 延長 SW 生命週期，並寫入快取', async () => {
  const url = `${ORIGIN}/opioid-converter-zh/js/calc.js`;
  const sw = loadSW({ cacheMap: { [url]: { body: 'old' } } });
  const { waits } = await dispatch(sw, { url });
  assert.ok(waits.length >= 1);
  assert.deepEqual(sw.puts, [url]);
});

test('sw fetch：非 GET 請求不攔截', async () => {
  const sw = loadSW();
  const { responded } = await dispatch(sw, { url: `${ORIGIN}/opioid-converter-zh/api`, method: 'POST' });
  assert.equal(responded, false);
});

test('sw fetch：第三方非 CDN 回應不寫入快取', async () => {
  const sw = loadSW();
  await dispatch(sw, { url: 'https://example.com/a.js' });
  assert.deepEqual(sw.puts, []);
});
