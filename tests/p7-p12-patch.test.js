// P7 Codeine 口服上限 400 → 360 mg/day（Codeine Sulfate Tablets 美國仿單，Hikma，Revised 12/2025，§2.3）
// P12 ≥90 MME 標為 CDC 2016 門檻（CDC 2022 Rec 4 只對 ≥50 MME 要求暫停並重新評估）
// 貼片建議：目標 > 500 mcg/h（超過 5 片 100 mcg/h）不給建議規格
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/calc.js');
const { loadApp } = require('./helpers/harness');

const E = (key, dose, freq = 1) => C.parseEntry(key, String(dose), String(freq), 'cancer');
const card = (app, label) => app.state().grid.find(h => h.includes(`>${label}`));

// ---- P7 ----
test('P7 Codeine 口服上限常數 360', () => {
  assert.equal(C.CODEINE_ORAL_MAX, 360);
});

test('P7 換算出 Codeine 口服 361 mg 顯示超量警示、360 mg 不顯示', () => {
  // Morphine 口服 54 mg → codeine 54 / 0.15 = 360（來源單一，不減量的是 morphine 本身；codeine 套減量 → 取 0%）
  const at = loadApp();
  at.el('crossTolSelect').value = '0';
  at.add({ key: 'morphine_oral', dose: 54, freq: 1 });
  assert.doesNotMatch(card(at, 'Codeine 口服'), /超過每日最大劑量/);
  const over = loadApp();
  over.el('crossTolSelect').value = '0';
  over.add({ key: 'morphine_oral', dose: 54.15, freq: 1 });
  assert.match(card(over, 'Codeine 口服'), /超過每日最大劑量（360 mg，美國仿單）/);
});

test('P7 參考表 Codeine 口服以 360 為界標紅（667 標紅、333 不標）', () => {
  const row = loadApp().el('refTableBody').children.map(r => r.innerHTML).find(h => h.includes('<td>Codeine 口服</td>'));
  assert.match(row, /<td>333 mg<\/td>/);
  assert.match(row, /<span style="color:var\(--danger\);">667 mg ⚠<\/span>/);
  assert.match(require('node:fs').readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8'),
    /row\.key === 'codeine_oral' && dose > CODEINE_ORAL_MAX/);
});

// ---- P12 ----
test('P12 非癌症 ≥90 警示標 CDC 2016 門檻，註明 CDC 2022 不設硬性上限', () => {
  const app = loadApp();
  app.el('clinicContext').value = 'noncancer';
  app.add({ key: 'morphine_oral', dose: 100, freq: 1 });
  const w = app.state().highDose;
  assert.match(w, /CDC 2016 門檻/);
  assert.match(w, /CDC 2022 已不設硬性上限/);
  assert.doesNotMatch(w, /高劑量警示（CDC 2022）/);
});

test('P12 情境列提示：MME ≥50 重新評估（CDC 2022）、≥90 為 2016 門檻', () => {
  const app = loadApp();
  app.el('clinicContext').value = 'noncancer';
  app.run('updateContextNote()');
  assert.equal(app.el('contextNote').textContent, 'MME ≥50 重新評估（CDC 2022）／≥90 高劑量（CDC 2016 門檻）');
});

// ---- 貼片上限 ----
test('貼片建議：PATCH_REC_MAX = 500；patchRecommendation 回傳 tooHigh', () => {
  assert.equal(C.PATCH_REC_MAX, 500);
  assert.equal(C.patchRecommendation([E('morphine_oral', 1000)], 0).tooHigh, false); // 500 mcg/h
  assert.equal(C.patchRecommendation([E('morphine_oral', 1000.2)], 0).tooHigh, true);
});

test('貼片建議：目標 > 500 mcg/h 不顯示規格組合，改提示不適合貼片', () => {
  const app = loadApp();
  app.add({ key: 'morphine_oral', dose: 2000, freq: 1 }); // 減 25% → 750 mcg/h
  const rec = app.state().patchRec;
  assert.doesNotMatch(rec, /建議選|與規格相符|100×|100\+/);
  assert.match(rec, /超過 500 mcg\/h（5 片 100 mcg\/h），不建議以貼片給予/);
  assert.match(card(app, 'Fentanyl 貼片'), /不適合以貼片給予/);
  assert.match(app.copy(), /Fentanyl 貼片：750\.0 mcg\/h（超過 5 片 100 mcg\/h，不適合以貼片給予）/);
});

test('貼片建議：Fentanyl IV 單一來源 > 500 mcg/h 不附 IV→貼片停輸注提示', () => {
  const app = loadApp();
  app.add({ key: 'fentanyl_iv', dose: 600 });
  const rec = app.state().patchRec;
  assert.match(rec, /不建議以貼片給予/);
  assert.doesNotMatch(rec, /PAIN-G 13/);
});

test('貼片建議：500 mcg/h 以下維持原行為', () => {
  const app = loadApp();
  app.el('crossTolSelect').value = '0';
  app.add({ key: 'morphine_oral', dose: 1000, freq: 1 });
  assert.match(app.state().patchRec, /與規格相符/);
  assert.doesNotMatch(card(app, 'Fentanyl 貼片'), /不適合以貼片給予/);
});
