// 已確認 bug 的回歸測試：每個 test 對應 PR「已修」一項；拿掉修正會轉紅。
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/calc.js');
const { loadApp } = require('./helpers/harness');

const NO_BAD_NUM = /NaN|Infinity|-\d/;

test('F1 非有限輸入（1e400 / Infinity）以一般輸入錯誤拒絕，不顯示 Infinity', () => {
  for (const key of ['morphine_oral', 'fentanyl_iv']) {
    for (const raw of ['1e400', 'Infinity', '-1e400']) {
      const r = C.parseEntry(key, raw, '1');
      assert.equal(r.error, '請輸入有效的正數劑量。', `${key} ${raw}`);
    }
  }
  assert.equal(C.parseEntry('fentanyl_patch', 'Infinity', '1').error, '請從下拉選單選擇有效的貼片劑量。');
});

test('F2 總 OME 超過上限時不加入清單，結果面板不殘留與清單不一致的舊結果', () => {
  const app = loadApp();
  app.el('clinicContext').value = 'noncancer'; // P8：上限 1000 僅適用非癌症
  app.add({ key: 'morphine_oral', dose: 900, freq: 1 });
  app.add({ key: 'morphine_oral', dose: 200, freq: 1 });
  const st = app.state();
  assert.equal(st.error, '總 OME 過高（1100 mg/day）。請確認輸入數值是否正確。');
  assert.equal(app.drugList().length, 1, '超限項目不應留在清單');
  assert.equal(st.listTotal, '總計 OME：900.0 mg/24h');
  assert.equal(st.ome, '900.0');
});

test('F3 同一藥物分多筆輸入（如 SR + IR）視為單一來源，來源藥物不減量', () => {
  const list = [C.parseEntry('morphine_oral', '30', '2'), C.parseEntry('morphine_oral', '10', '1')];
  const rows = C.conversions(list, 25);
  assert.equal(rows.find(r => r.key === 'morphine_oral').adjDose, 70);
  assert.equal(rows.find(r => r.key === 'oxycodone_oral').adjDose, 70 / 1.5 * 0.75);
  // 兩片 fentanyl 貼片（50 + 25）：不顯示「改貼片」建議
  const patches = [C.parseEntry('fentanyl_patch', '50', '1'), C.parseEntry('fentanyl_patch', '25', '1')];
  assert.equal(C.patchRecommendation(patches, 25).onlyFentanyl, true);
  assert.match(C.buildSummary(list, 70, 25, 'T'), /Morphine 口服：70\.0 mg\/day（來源，未減量）/);
});

test('F4 小劑量不會被四捨五入成 0（顯示有效位數）', () => {
  assert.equal(C.fmt(0.03, 1), '0.030');
  assert.equal(C.fmt(0.4, 0), '0.40');
  assert.equal(C.fmt(0.06, 1), '0.060', '不得放大成 0.1');
  assert.equal(C.fmt(0.25, 1), '0.25');
  assert.equal(C.fmt(0, 1), '0.0');
  assert.equal(C.fmt(1, 1), '1.0');
  assert.equal(C.fmt(12.345, 1), '12.3', '一般值維持原小數位');
  // 端到端：Morphine 口服 0.04 mg → 所有顯示值不得為 0
  const app = loadApp();
  app.add({ key: 'morphine_oral', dose: 0.04, freq: 1 });
  const st = app.state();
  const doses = st.grid.map(h => /<div class="drug-dose">([^<]*)</.exec(h)[1]);
  for (const d of doses) assert.ok(Number(d) > 0, `dose ${d}`);
  assert.ok(Number(st.ome) > 0, `ome ${st.ome}`);
  assert.ok(!/(^|[^\d.])0\.0 mg\/day/.test(st.list[0]), st.list[0]);
  assert.doesNotMatch(st.bt, /[^\d.]0\.0–0\.0/);
  assert.doesNotMatch(st.patchRec, /計算值 0\.0 /);
  assert.doesNotMatch(app.copy(), /：0\.0 mg|：0\.0–0\.0| 0\.0 MME/);
});

test('F5 複製摘要以未四捨五入的總 OME 計算，與畫面結果一致', () => {
  const app = loadApp();
  app.add({ key: 'hydromorphone_iv_sc', dose: 1.01, freq: 1 }); // OME 25.25 → 畫面顯示 25.3
  const morphineCard = app.state().grid.find(h => h.includes('Morphine 口服'));
  assert.match(morphineCard, /<div class="drug-dose">18\.9<\/div>/);
  assert.match(app.copy(), /Morphine 口服：18\.9 mg\/day/);
});

test('F6 Fentanyl 貼片組合規格（37.5 / 62.5 / 87.5）的數值與標示一致', () => {
  const { staticSelectOptions } = require('./helpers/harness');
  const app = loadApp();
  app.select('fentanyl_patch');
  const dynamic = app.el('selPatchDose').children.map(o => ({ value: String(o.value), text: o.textContent }));
  const fixed = staticSelectOptions(app.html, 'selPatchDose').filter(o => o.value);
  for (const opts of [dynamic, fixed]) {
    for (const { value, text } of opts) {
      const labelled = parseFloat(text); // 標示的第一個數字
      if (/\(\d+\+12\.5\)/.test(text)) assert.equal(Number(value), labelled, `${text} → value ${value}`);
    }
  }
  app.add({ key: 'fentanyl_patch', dose: '37.5' });
  assert.deepEqual(app.state().list, ['fentanyl_patch|37.5 mcg/h|75']);
});

test('F7 切換藥物（單位不同）時清除已輸入劑量，避免 mg 被當 mcg/hr 解讀', () => {
  const app = loadApp();
  app.select('morphine_oral');
  app.el('inpDose').value = '25'; // 25 mg
  app.select('fentanyl_iv');      // 單位改為 mcg/hr
  assert.equal(app.el('inpDose').value, '');
  app.run('addDrug()');
  assert.equal(app.drugList().length, 0, '不得以 25 mcg/hr（OME 180）加入');
  assert.equal(app.state().error, '請輸入有效的正數劑量。');
});
