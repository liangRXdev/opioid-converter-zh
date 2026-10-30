// 出處與說明文字：P10 BT 說明、P4 Buprenorphine 貼片 ×2.5 出處、NCCN 版本標示 v2.2026
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { loadApp } = require('./helpers/harness');

const ROOT = path.join(__dirname, '..');
const read = f => fs.readFileSync(path.join(ROOT, f), 'utf8');

test('NCCN 版本：程式、頁面、README 不再引用 v1.2026；複製摘要標 v2.2026', () => {
  for (const f of ['js/calc.js', 'index.html', 'README.md', 'README.zh-TW.md']) {
    assert.doesNotMatch(read(f), /v1\.2026|NCCN 2026 v1\b/, f);
  }
  const app = loadApp();
  app.add({ key: 'morphine_oral', dose: 30, freq: 1 });
  assert.match(app.copy(), /NCCN Adult Cancer Pain v2\.2026/);
});

test('footer 參考指引列出 NCCN v2.2026 與 MASCC-ASCO 2025', () => {
  const footer = /參考指引：[\s\S]*?<br>/.exec(read('index.html'))[0];
  assert.match(footer, /NCCN Adult Cancer Pain v2\.2026/);
  assert.match(footer, /MASCC-ASCO 2025/);
});

test('P10 BT 說明與實際列出的藥物一致，並註明 MASCC 起始 10–15%', () => {
  const app = loadApp();
  app.add({ key: 'fentanyl_patch', dose: 50 });
  const bt = app.state().bt;
  assert.doesNotMatch(bt, /用於相同藥物補救/);
  assert.match(bt, /優先使用與長效藥相同成分的短效劑型/);
  assert.match(bt, /MASCC-ASCO 2025 建議起始 10–15%/);
  assert.match(bt, /Oxycodone 口服/, 'BT 仍列出不同藥物');
});

test('P4 Buprenorphine 貼片 ×2.5 標示推論出處（NCCN：20 mcg/h ≈ TDF 25 mcg/h）', () => {
  const app = loadApp();
  app.add({ key: 'morphine_oral', dose: 30, freq: 1 });
  const card = app.state().grid.find(h => h.includes('Buprenorphine 貼片'));
  assert.match(card, /NCCN 2026：20 mcg\/h ≈ TDF 25 mcg\/h/);
  assert.match(card, /推論/);
  assert.match(read('js/calc.js'), /transdermal fentanyl 25 mcg\/h」× TDF ×2 → 20 mcg\/h ≈ 50 mg OME/);
  for (const f of ['README.md', 'README.zh-TW.md']) assert.match(read(f), /NCCN 2026[^|\n]*20 mcg\/h ≈ TDF 25 mcg\/h/, f);
});
