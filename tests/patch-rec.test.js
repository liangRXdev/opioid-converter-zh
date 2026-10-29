// Fentanyl 貼片建議：規格相符（容差）與 > 100 mcg/h 組合貼片
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/calc.js');
const { loadApp } = require('./helpers/harness');

function rec(steps, crossTol = '25') {
  const app = loadApp();
  app.el('crossTolSelect').value = crossTol;
  for (const s of steps) app.add(s);
  return { text: app.state().patchRec, copy: app.copy() };
}
const firstLine = t => t.split('<br>')[0];

// ---- #1 目標等於規格 ----
test('#1 Fentanyl IV 25 mcg/hr → 只建議 25（舊：25 或 50）', () => {
  const { text } = rec([{ key: 'fentanyl_iv', dose: 25 }]);
  assert.equal(firstLine(text), ' 計算值 25.0 mcg/h → 建議 <strong>25 mcg/h</strong>（與規格相符）。');
});

test('#1 Fentanyl IV 100 mcg/hr → 只建議 100', () => {
  const { text } = rec([{ key: 'fentanyl_iv', dose: 100 }]);
  assert.equal(firstLine(text), ' 計算值 100.0 mcg/h → 建議 <strong>100 mcg/h</strong>（與規格相符）。');
});

test('#1 容差邊界：25.04 / 24.96 → 只建議 25；25.06 / 24.94 → 兩檔', () => {
  assert.ok(C.PATCH_MATCH_TOL > 0 && C.PATCH_MATCH_TOL <= 0.05);
  for (const t of [25.04, 24.96, 25, 72 / 2.88]) assert.equal(C.recommendPatch(t).match.dose, 25, String(t));
  assert.deepEqual(pick(C.recommendPatch(25.06)), { match: undefined, lower: 25, higher: 50 });
  assert.deepEqual(pick(C.recommendPatch(24.94)), { match: undefined, lower: 12, higher: 25 });
});
function pick(r) { return { match: r.match && r.match.dose, lower: r.lower && r.lower.dose, higher: r.higher && r.higher.dose }; }

test('#1 Morphine 口服 60 mg/day、減 25% → 目標 22.5 → 12 或 25（與現行相同）', () => {
  const { text } = rec([{ key: 'morphine_oral', dose: 60, freq: 1 }]);
  assert.equal(text, ' 計算值 22.5 mcg/h → 建議選 <strong>12 mcg/h</strong>（保守）或 <strong>25 mcg/h</strong>（積極）。');
});

test('最小規格以下處理不變', () => {
  const { text } = rec([{ key: 'morphine_oral', dose: 10, freq: 1 }]);
  assert.equal(text, ' 計算值 3.8 mcg/h → 劑量低於最小規格 12 mcg/h，需重新評估是否適合貼片。');
});

// ---- #3 複製摘要 ----
test('#3 複製摘要不含貼片建議（現行無此段，不新增）', () => {
  const { copy } = rec([{ key: 'fentanyl_iv', dose: 139 }]);
  assert.doesNotMatch(copy, /建議選|與規格相符|100\+/);
});
