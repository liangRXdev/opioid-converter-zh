// P6 Hydromorphone IV/SC ×25 → ×20（NCCN Adult Cancer Pain v2.2026 Table 2：1.5 mg IV ≈ 10 mg IV morphine ≈ 30 mg PO）；
//    口服維持 ×5（MASCC-ASCO-AAHPM-HPNA-NICSO 2025 Table 3：oral morphine:oral hydromorphone 5:1，89.1% 共識）
// P9 同藥換途徑不套交叉耐受減量：NCCN PAIN-G「reduce ... to allow for incomplete cross-tolerance between different opioids」
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/calc.js');
const { loadApp } = require('./helpers/harness');

const close = (a, b, msg) => assert.ok(Math.abs(a - b) < 1e-9, `${msg || ''} ${a} ≠ ${b}`);
const E = (key, dose, freq = 1) => C.parseEntry(key, String(dose), String(freq));
const conv = (list, tol) => Object.fromEntries(C.conversions(list, tol).map(r => [r.key, r]));

// ---- P6 ----
test('P6 Hydromorphone IV/SC ×20、口服 ×5', () => {
  assert.equal(C.DRUGS.hydromorphone_iv_sc.toOME(1), 20);
  assert.equal(C.DRUGS.hydromorphone_oral.toOME(1), 5);
  close(C.DRUGS.hydromorphone_iv_sc.fromOME(30), 1.5, 'NCCN Table 2：30 mg PO morphine ≈ 1.5 mg IV HM');
});

test('P6 UI 換算說明改為 NCCN ×20，口服註明 MASCC-ASCO 2025', () => {
  const app = loadApp();
  app.add({ key: 'morphine_oral', dose: 30, freq: 1 });
  const grid = app.state().grid;
  const iv = grid.find(h => h.includes('Hydromorphone IV/SC'));
  const po = grid.find(h => h.includes('Hydromorphone 口服'));
  assert.match(iv, /NCCN 2026 ×20/);
  assert.doesNotMatch(iv, /UpToDate ×25/);
  assert.match(po, /MASCC-ASCO 2025/);
});

// ---- P9 calc ----
test('P9 Morphine 口服 30（減 25%）→ Morphine IV/SC 10 不減量；換 Hydromorphone 口服仍減量', () => {
  const r = conv([E('morphine_oral', 30)], 25);
  close(r.morphine_iv_sc.adjDose, 10);
  assert.equal(r.morphine_iv_sc.sameMolecule, true);
  close(r.hydromorphone_oral.adjDose, 30 / 5 * 0.75);
  assert.equal(r.hydromorphone_oral.sameMolecule, false);
});

test('P9 Hydromorphone IV/SC 2 mg/day（OME 40，減 50%）→ 口服 8 mg 不減量；Morphine 口服 20', () => {
  const r = conv([E('hydromorphone_iv_sc', 2)], 50);
  close(r.hydromorphone_oral.adjDose, 8);
  close(r.morphine_oral.adjDose, 20);
});

test('P9 Tramadol 口服 → IV/IM、Codeine 口服 → IM 不減量', () => {
  close(conv([E('tramadol_oral', 200)], 25).tramadol_iv.adjDose, 20 / 0.14);
  close(conv([E('codeine_oral', 120)], 25).codeine_im.adjDose, 18 / 0.23);
});

test('P9 同分子多途徑來源（Morphine 口服＋IV/SC）視為單一分子，兩途徑皆不減量', () => {
  const r = conv([E('morphine_oral', 30), E('morphine_iv_sc', 10)], 25); // OME 60
  close(r.morphine_oral.adjDose, 60);
  close(r.morphine_iv_sc.adjDose, 20);
  close(r.oxycodone_oral.adjDose, 60 / 1.5 * 0.75);
});

test('P9 混合不同分子來源 → 仍全部減量（僅來源單一藥物時沿用原規則）', () => {
  const r = conv([E('morphine_oral', 30), E('oxycodone_oral', 20)], 25); // OME 60
  close(r.morphine_iv_sc.adjDose, 60 / 3 * 0.75);
  assert.equal(r.morphine_iv_sc.sameMolecule, false);
});

test('P9 Fentanyl 不納入同分子規則（貼片→IV 方向 NCCN 未規定，維持減量）', () => {
  const r = conv([E('fentanyl_patch', 50)], 25);
  close(r.fentanyl_iv.adjDose, 100 / 2.88 * 0.75);
  assert.equal(r.fentanyl_iv.sameMolecule, false);
});

test('P9 不減量時 sameMolecule 不影響原本的 0% 結果', () => {
  const r = conv([E('morphine_oral', 30)], 0);
  close(r.morphine_iv_sc.adjDose, 10);
  close(r.hydromorphone_oral.adjDose, 6);
});

// ---- P9 UI / 摘要 ----
test('P9 結果卡與複製摘要標示同藥換途徑未減量', () => {
  const app = loadApp();
  app.el('crossTolSelect').value = '25';
  app.add({ key: 'hydromorphone_iv_sc', dose: 2, freq: 1 });
  const po = app.state().grid.find(h => h.includes('Hydromorphone 口服'));
  assert.match(po, /<div class="drug-dose">8\.0<\/div>/);
  assert.match(po, /同藥換途徑/);
  const morphine = app.state().grid.find(h => h.includes('Morphine 口服'));
  assert.doesNotMatch(morphine, /同藥換途徑/);
  assert.match(app.copy(), /Hydromorphone 口服：8\.0 mg\/day（同藥換途徑，未減量）/);
});
