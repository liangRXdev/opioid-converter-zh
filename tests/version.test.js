// 版本號一致：badge、script 註解為 App 版本；sw.js CACHE 每次發佈 +1
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(ROOT, 'index.html'), 'utf8');
const sw = fs.readFileSync(path.join(ROOT, 'sw.js'), 'utf8');
const APP_VERSION = 'v1.4.4';

test('index.html badge 與 script 註解版本一致', () => {
  assert.equal(/<div class="version-badge">(v[\d.]+) /.exec(html)[1], APP_VERSION);
  assert.equal(/\/\/ (v[\d.]+) \|/.exec(html)[1], APP_VERSION);
});

test('sw.js CACHE 版本為 v1.4.3（v1.4.2 → +1）', () => {
  assert.match(sw, /const CACHE = `\$\{PREFIX\}v1\.4\.3`;/);
});
