// sw.js：同 origin（liangrxdev.github.io）多站共用 CacheStorage，activate 只能刪本 repo 自己的舊快取
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const SRC = fs.readFileSync(path.join(__dirname, '..', 'sw.js'), 'utf8');

function loadSW(existingKeys) {
  const listeners = {};
  const deleted = [];
  const sandbox = {
    self: {
      addEventListener: (t, fn) => { listeners[t] = fn; },
      skipWaiting() {}, clients: { claim() {} }, location: { origin: 'https://liangrxdev.github.io' },
    },
    caches: {
      keys: async () => existingKeys.slice(),
      delete: async k => { deleted.push(k); return true; },
      open: async () => ({ addAll: async () => {}, put: async () => {} }),
    },
  };
  vm.createContext(sandbox);
  const exported = vm.runInContext(`${SRC}\n;({ CACHE, PRECACHE })`, sandbox);
  return { listeners, deleted, ...exported };
}

async function activate(keys) {
  const sw = loadSW(keys);
  let p;
  sw.listeners.activate({ waitUntil: x => { p = x; } });
  await p;
  return sw;
}

test('CACHE 名稱以 repo 名稱（opioid-converter-zh-）為前綴', () => {
  assert.match(loadSW([]).CACHE, /^opioid-converter-zh-/);
});

test('activate 不刪除同 origin 其他工具（含名稱相近者）的快取', async () => {
  const { CACHE, deleted } = await activate([
    'opioid-converter-en-v2.0.0', 'opioid-converter-pediatric-v1', 'renal-dose-v3', 'workbox-precache',
  ]);
  assert.deepEqual(deleted, [], `誤刪：${deleted}`);
  assert.ok(CACHE);
});

test('activate 刪除本工具舊版快取（含改名前的 opioid-converter-vX 舊名），保留目前版本', async () => {
  const sw0 = loadSW([]);
  const { deleted } = await activate([sw0.CACHE, 'opioid-converter-zh-v1.3.0', 'opioid-converter-v1.4.0', 'opioid-converter-v1.3.9']);
  assert.deepEqual(deleted.sort(), ['opioid-converter-v1.3.9', 'opioid-converter-v1.4.0', 'opioid-converter-zh-v1.3.0']);
});

test('PRECACHE 含 js/calc.js', () => {
  assert.ok(loadSW([]).PRECACHE.includes('/opioid-converter-zh/js/calc.js'));
});
