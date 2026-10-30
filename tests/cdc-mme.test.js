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
  assert.deepEqual(all.unlisted, ['Fentanyl IV 持續輸注', 'Tramadol IV/IM', 'Codeine IM', 'Hydromorphone IV/SC', 'Morphine IV/SC']);
  assert.deepEqual(all.excluded, ['Buprenorphine 貼片']);
  close(all.mme, 28.8 + 14 + 60 * 0.23 + 20 + 30);
});

// CDC 2022 Recommendation 4 正文："Buprenorphine should not be counted in the total MME/day in calculations
// because of its partial agonist properties at opioid receptors that confer a ceiling effect on respiratory depression."
test('#1 Buprenorphine 不計入 CDC MME（CDC 2022 正文）', () => {
  const only = C.cdcRiskMME([E('buprenorphine_td', 10)]);
  close(only.mme, 0);
  assert.deepEqual(only.unlisted, []);
  assert.deepEqual(only.excluded, ['Buprenorphine 貼片']);
  const mixed = C.cdcRiskMME([E('buprenorphine_td', 5), E('oxycodone_oral', 20)]);
  close(mixed.mme, 30);
  assert.deepEqual(mixed.excluded, ['Buprenorphine 貼片']);
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

// ---- #2 非癌症情境 UI ----
const { loadApp } = require('./helpers/harness');
const MME_LINE = x => `CDC 2022 MME（風險評估）：${x} mg/day — 僅供風險評估，不用於換算劑量（CDC 2022 表格注意事項 3）`;
const BUP_NOTE = 'Buprenorphine 貼片不計入 MME（CDC 2022：部分促效劑，呼吸抑制有天花板效應）';

function ui(steps, context = 'noncancer', crossTol = '25') {
  const app = loadApp();
  app.el('clinicContext').value = context;
  app.el('crossTolSelect').value = crossTol;
  for (const s of steps) app.add(s);
  return { st: app.state(), copy: app.copy() };
}
const cardDose = (st, label) => /<div class="drug-dose">([^<]*)</.exec(st.grid.find(h => h.includes(`<div class="drug-name">${label}`)))[1];

test('#2 非癌症 Tramadol 口服 300 → MME 60、「注意」；OME 30；Morphine 口服 22.5', () => {
  const { st, copy } = ui([{ key: 'tramadol_oral', dose: 300, freq: 1 }]);
  assert.ok(st.cdcMme.startsWith(MME_LINE('60.0')), st.cdcMme);
  assert.equal(st.caution, true);
  assert.match(st.cautionText, /MME ≥ 50 mg\/day/);
  assert.doesNotMatch(st.cautionText, /OME/);
  assert.equal(st.highDose, null);
  assert.equal(st.ome, '30.0');
  assert.equal(cardDose(st, 'Morphine 口服'), '22.5');
  assert.ok(copy.includes(MME_LINE('60.0')), copy);
});

test('#2 非癌症 Fentanyl 貼片 25 → MME 60、「注意」；OME 50', () => {
  const { st } = ui([{ key: 'fentanyl_patch', dose: 25 }]);
  assert.ok(st.cdcMme.startsWith(MME_LINE('60.0')));
  assert.equal(st.caution, true);
  assert.equal(st.highDose, null);
  assert.equal(st.ome, '50.0');
});

test('#2 非癌症 Fentanyl 貼片 37.5 → MME 90、高劑量（CDC 2016 門檻，P12）；OME 75', () => {
  const { st } = ui([{ key: 'fentanyl_patch', dose: 37.5 }]);
  assert.ok(st.cdcMme.startsWith(MME_LINE('90.0')));
  assert.equal(st.caution, false);
  assert.match(st.highDose, /高劑量（CDC 2016 門檻）/);
  assert.match(st.highDose, /MME ≥ 90 mg\/day/);
  assert.doesNotMatch(st.highDose, /OME/);
  assert.equal(st.ome, '75.0');
});

test('#2 非癌症 Morphine 口服 60 → MME 60 = OME 60', () => {
  const { st } = ui([{ key: 'morphine_oral', dose: 60, freq: 1 }]);
  assert.equal(st.cdcMme, MME_LINE('60.0'));
  assert.equal(st.ome, '60.0');
});

test('#2 非癌症 Morphine IV/SC 10 → MME 30，CDC 表未列註記', () => {
  const { st } = ui([{ key: 'morphine_iv_sc', dose: 10, freq: 1 }]);
  assert.equal(st.cdcMme, `${MME_LINE('30.0')}<br>CDC 表未列：Morphine IV/SC，以本工具換算係數計入`);
  assert.ok(!st.cdcMme.includes(BUP_NOTE));
});

test('#2 非癌症 Buprenorphine 貼片 10 → MME 0，不計入註記；OME 仍 25', () => {
  const { st } = ui([{ key: 'buprenorphine_td', dose: 10 }]);
  assert.equal(st.cdcMme, `${MME_LINE('0.0')}<br>${BUP_NOTE}`);
  assert.equal(st.ome, '25.0');
});

// ---- #3 癌症情境不變 ----
test('#3 癌症情境：無 MME 行、摘要無 MME，警示仍以 OME', () => {
  for (const steps of [[{ key: 'tramadol_oral', dose: 300, freq: 1 }], [{ key: 'fentanyl_patch', dose: 37.5 }],
    [{ key: 'buprenorphine_td', dose: 10 }], [{ key: 'morphine_iv_sc', dose: 100, freq: 1 }]]) {
    const { st, copy } = ui(steps, 'cancer');
    assert.equal(st.cdcMme, undefined);
    assert.equal(st.cautionText, undefined);
    assert.doesNotMatch(copy, /MME（風險評估）/);
  }
  const { st } = ui([{ key: 'morphine_iv_sc', dose: 100, freq: 1 }], 'cancer');
  assert.match(st.highDose, /高劑量警示（NCCN 2026）：<\/strong> OME &gt; 200/);
});

// ---- #4 換算係數出處與 CDC 分開 ----
test('#4 換算係數出處不標示為 CDC；Tramadol 口服 ×0.1 標示 Micromedex 2025', () => {
  const fs = require('node:fs');
  const html = fs.readFileSync(require('node:path').join(__dirname, '..', 'index.html'), 'utf8');
  const caption = /以 Fentanyl 貼片強度為基準[^<]*/.exec(html)[0];
  assert.doesNotMatch(caption, /CDC/, caption);
  const factors = /換算係數：[\s\S]*?<\/footer>/.exec(html)[0];
  assert.doesNotMatch(factors, /CDC/);
  assert.match(factors, /Tramadol oral ×0\.1（Micromedex 2025）/);
  assert.doesNotMatch(/UpToDate Opioid Conversion Table \(([^)]*)\)/.exec(html)[1], /CDC/);
  assert.doesNotMatch(C.DRUGS.tramadol_oral.warn, /CDC/);
});
