// Fentanyl IV 持續輸注：穩態換算比 ×2.88 與 IV→貼片 1:1（NCCN Adult Cancer Pain v1.2026）
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/calc.js');
const { loadApp } = require('./helpers/harness');

const NCCN_HINT = '依 NCCN 2026 PAIN-G 13：持續輸注→貼片 1:1。貼上後 6 小時輸注速率減半，12 小時停止（或 6 小時直接停止）；部分病人需再調整貼片劑量。';
const MIXED_HINT = '混合來源，未套用 IV→貼片 1:1';
const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);
const card = (st, label) => st.grid.find(h => h.includes(`<div class="drug-name">${label}`));
const cardDose = h => /<div class="drug-dose">([^<]*)</.exec(h)[1];

function run(steps, crossTol = '25') {
  const app = loadApp();
  app.el('crossTolSelect').value = crossTol;
  for (const s of steps) app.add(s);
  return { app, st: app.state(), copy: app.copy() };
}

test('#1 穩態係數：Fentanyl IV 25 mcg/hr → OME 72 mg/day（舊 180）', () => {
  close(C.DRUGS.fentanyl_iv.toOME(1), 2.88);
  close(C.parseEntry('fentanyl_iv', '25', '1').ome, 72);
  const { st } = run([{ key: 'fentanyl_iv', dose: 25 }]);
  assert.equal(st.ome, '72.0');
});

test('#1 IV→其他藥物走 OME 路徑並減量：25 mcg/hr、減 25% → Morphine 口服 54 mg/day', () => {
  const list = [C.parseEntry('fentanyl_iv', '25', '1')];
  close(C.conversions(list, 25).find(r => r.key === 'morphine_oral').adjDose, 54);
  const { st, copy } = run([{ key: 'fentanyl_iv', dose: 25 }]);
  assert.equal(cardDose(card(st, 'Morphine 口服')), '54.0');
  assert.match(copy, /Morphine 口服：54\.0 mg\/day/);
});

test('#1 UI 文字不再出現 ×7.2', () => {
  const { st, app } = run([{ key: 'fentanyl_iv', dose: 25 }]);
  assert.doesNotMatch(card(st, 'Fentanyl IV'), /7\.2/);
  assert.match(card(st, 'Fentanyl IV'), /2\.88/);
  assert.doesNotMatch(app.html, /×7\.2/);
});

test('#2 IV→貼片 1:1：25 mcg/hr、減 25% → 貼片目標 25（不減量），結果格與摘要一致，顯示停輸注提示', () => {
  const pr = C.patchRecommendation([C.parseEntry('fentanyl_iv', '25', '1')], 25);
  assert.equal(pr.target, 25);
  assert.equal(pr.lower, 25);
  assert.equal(pr.ivDirect, true);
  const { st, copy } = run([{ key: 'fentanyl_iv', dose: 25 }]);
  assert.equal(cardDose(card(st, 'Fentanyl 貼片')), '25.0');
  assert.match(st.patchRec, /計算值 25\.0 mcg\/h → 建議選 <strong>25 mcg\/h<\/strong>/);
  assert.ok(st.patchRec.includes(NCCN_HINT), st.patchRec);
  assert.match(copy, /Fentanyl 貼片：25\.0 mcg\/h/);
});

test('#2 同藥多筆 IV（20 + 5 mcg/hr）仍屬單一來源，貼片目標 = IV 總和', () => {
  const list = [C.parseEntry('fentanyl_iv', '20', '1'), C.parseEntry('fentanyl_iv', '5', '1')];
  assert.equal(C.patchRecommendation(list, 50).target, 25);
  assert.equal(C.conversions(list, 50).find(r => r.key === 'fentanyl_patch').adjDose, 25);
});

test('#2 混合來源（Fentanyl IV 25 + Morphine 口服 30）不套 1:1，顯示混合來源提示', () => {
  const list = [C.parseEntry('fentanyl_iv', '25', '1'), C.parseEntry('morphine_oral', '30', '1')];
  const pr = C.patchRecommendation(list, 25);
  assert.equal(pr.ivDirect, false);
  close(pr.target, (72 + 30) / 2 * 0.75);
  const { st, copy } = run([{ key: 'fentanyl_iv', dose: 25 }, { key: 'morphine_oral', dose: 30, freq: 1 }]);
  assert.ok(st.patchRec.includes(MIXED_HINT), st.patchRec);
  assert.ok(!st.patchRec.includes(NCCN_HINT));
  assert.equal(cardDose(card(st, 'Fentanyl 貼片')), '38.3');
  assert.match(copy, /Fentanyl 貼片：38\.3 mcg\/h/);
});

test('#2 反向（貼片→IV）不新增規則：Fentanyl 貼片 25 → IV 走 OME 路徑並減量', () => {
  const rows = C.conversions([C.parseEntry('fentanyl_patch', '25', '1')], 25);
  close(rows.find(r => r.key === 'fentanyl_iv').adjDose, 50 / 2.88 * 0.75);
  assert.equal(C.patchRecommendation([C.parseEntry('fentanyl_patch', '25', '1')], 25).ivDirect, false);
});

test('非 IV 來源不顯示 IV 相關提示', () => {
  const { st } = run([{ key: 'morphine_oral', dose: 60, freq: 1 }]);
  assert.ok(!st.patchRec.includes(NCCN_HINT) && !st.patchRec.includes(MIXED_HINT));
});
