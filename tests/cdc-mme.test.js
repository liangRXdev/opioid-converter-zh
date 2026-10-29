// CDC 2022 MME（風險評估）：Dowell D, et al. MMWR Recomm Rep 2022;71(3):1–95
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/calc.js');

const close = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} ≠ ${b}`);
const E = (key, dose) => C.parseEntry(key, String(dose), '1');

// ---- #1 CDC_MME_FACTORS / cdcRiskMME ----
test('#1 CDC_MME_FACTORS 僅含工具內已有且 CDC 表有列者，數值照表', () => {
  assert.deepEqual(C.CDC_MME_FACTORS, {
    morphine_oral: 1.0, hydromorphone_oral: 5.0, oxycodone_oral: 1.5,
    tramadol_oral: 0.2, codeine_oral: 0.15, fentanyl_patch: 2.4,
  });
});

test('#1 Tramadol 口服 300 mg/day → MME 60（OME 仍 30）', () => {
  const list = [E('tramadol_oral', 300)];
  close(C.cdcRiskMME(list).mme, 60);
  assert.deepEqual(C.cdcRiskMME(list).unlisted, []);
  close(C.totalOME(list), 30);
});

test('#1 Fentanyl 貼片 25 / 37.5 mcg/h → MME 60 / 90（OME 50 / 75）', () => {
  close(C.cdcRiskMME([E('fentanyl_patch', 25)]).mme, 60);
  close(C.cdcRiskMME([E('fentanyl_patch', 37.5)]).mme, 90);
  close(C.totalOME([E('fentanyl_patch', 37.5)]), 75);
});

test('#1 Morphine 口服 60 → MME 60 = OME', () => {
  close(C.cdcRiskMME([E('morphine_oral', 60)]).mme, 60);
});

test('#1 CDC 表未列者沿用 toOME 計入並列入 unlisted（Morphine IV/SC 10 → 30）', () => {
  const r = C.cdcRiskMME([E('morphine_iv_sc', 10)]);
  close(r.mme, 30);
  assert.deepEqual(r.unlisted, ['Morphine IV/SC']);
  const all = C.cdcRiskMME([E('fentanyl_iv', 10), E('tramadol_iv', 100), E('codeine_im', 60),
    E('buprenorphine_td', 10), E('hydromorphone_iv_sc', 1), E('morphine_iv_sc', 5), E('morphine_iv_sc', 5)]);
  assert.deepEqual(all.unlisted, ['Fentanyl IV 持續輸注', 'Tramadol IV/IM', 'Codeine IM', 'Buprenorphine 貼片', 'Hydromorphone IV/SC', 'Morphine IV/SC']);
  close(all.mme, 28.8 + 14 + 60 * 0.23 + 25 + 25 + 30);
});

test('#1 混合：CDC 係數與工具係數分別計入', () => {
  const r = C.cdcRiskMME([E('tramadol_oral', 100), E('morphine_iv_sc', 10)]);
  close(r.mme, 20 + 30);
  assert.deepEqual(r.unlisted, ['Morphine IV/SC']);
});

test('#1 換算係數不變：tramadol_oral toOME 仍 0.1', () => {
  assert.equal(C.DRUGS.tramadol_oral.toOME(1), 0.1);
  assert.equal(C.DRUGS.fentanyl_patch.toOME(1), 2);
});
