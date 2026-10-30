// P8 OME 上限依情境：癌症 > 1000 警示照算、> 10000 拒絕（防打錯字）；非癌症維持 > 1000 拒絕
// NCCN Adult Cancer Pain v2.2026 未列 full agonist 劑量上限，劑量依前 24h 總量調升 30–100%（PAIN-6）；
// 「癌症情境不設臨床上限」為依此推論，非 NCCN 原文
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/calc.js');
const { loadApp } = require('./helpers/harness');

const E = (key, dose, ctx) => C.parseEntry(key, String(dose), '1', ctx);

function appIn(context) {
  const app = loadApp();
  app.el('clinicContext').value = context;
  return app;
}
// 等同 index.html 的 change listener
const switchTo = (app, context) => { app.el('clinicContext').value = context; app.run('updateContextNote(); if (drugList.length > 0) calculate();'); };

// ---- calc.js ----
test('P8 omeLimit：癌症 10000、非癌症 1000；未指定情境採嚴格值 1000', () => {
  assert.equal(C.omeLimit('cancer'), 10000);
  assert.equal(C.omeLimit('noncancer'), 1000);
  assert.equal(C.omeLimit(undefined), 1000);
  assert.equal(C.OME_WARN_CANCER, 1000);
});

test('P8 parseEntry 單項邊界：癌症 10000 可、10000.01 拒；非癌症 1000 可、1000.01 拒', () => {
  assert.equal(E('morphine_oral', 10000, 'cancer').error, undefined);
  assert.equal(E('morphine_oral', 10000.01, 'cancer').error, '單項 OME 過高（10000 mg）。請確認輸入數值是否正確。');
  assert.equal(E('morphine_oral', 1000, 'noncancer').error, undefined);
  assert.match(E('morphine_oral', 1000.01, 'noncancer').error, /單項 OME 過高/);
  assert.match(E('morphine_oral', 1000.01).error, /單項 OME 過高/, '未指定情境 → 1000');
});

test('P8 totalOMEError 累計邊界依情境', () => {
  const list = [E('morphine_oral', 900, 'cancer')];
  assert.equal(C.totalOMEError(list, E('morphine_oral', 200, 'cancer'), 'cancer'), null);
  assert.equal(C.totalOMEError(list, E('morphine_oral', 200), 'noncancer'), '總 OME 過高（1100 mg/day）。請確認輸入數值是否正確。');
  const big = [E('morphine_oral', 9000, 'cancer')];
  assert.equal(C.totalOMEError(big, E('morphine_oral', 1000, 'cancer'), 'cancer'), null, '剛好 10000');
  assert.match(C.totalOMEError(big, E('morphine_oral', 1000.01, 'cancer'), 'cancer'), /總 OME 過高（10000 mg\/day）/);
});

test('P8 超高劑量貼片組合：n > 5 改以 100×n + r 表示，≤ 5 維持逐片列出', () => {
  assert.equal(C.recommendPatch(500).match.label, '500 mcg/h（100+100+100+100+100）');
  assert.equal(C.recommendPatch(600).match.label, '600 mcg/h（100×6）');
  assert.equal(C.recommendPatch(5000).match.label, '5000 mcg/h（100×50）');
  assert.equal(C.recommendPatch(637.5).lower.label, '625 mcg/h（100×6+25）');
});

// ---- UI ----
test('P8 癌症：OME 1100 照算，顯示超高劑量警示（取代 > 200 警示）', () => {
  const app = appIn('cancer');
  app.add({ key: 'morphine_oral', dose: 900, freq: 1 });
  app.add({ key: 'morphine_oral', dose: 200, freq: 1 });
  const st = app.state();
  assert.equal(st.error, null);
  assert.equal(app.drugList().length, 2);
  assert.equal(st.ome, '1100.0');
  assert.ok(st.resultVisible);
  assert.match(st.highDose, /超高劑量/);
  assert.match(st.highDose, /OME &gt; 1000/);
  assert.match(app.copy(), /超高劑量/);
});

test('P8 癌症：OME 剛好 1000 → 仍為一般 > 200 高劑量警示', () => {
  const app = appIn('cancer');
  app.add({ key: 'morphine_oral', dose: 1000, freq: 1 });
  const st = app.state();
  assert.doesNotMatch(st.highDose, /超高劑量/);
  assert.match(st.highDose, /OME &gt; 200/);
  assert.doesNotMatch(app.copy(), /超高劑量/);
});

test('P8 癌症：單項 > 10000 拒絕（防打錯字），清單不殘留', () => {
  const app = appIn('cancer');
  app.add({ key: 'morphine_oral', dose: 100000, freq: 1 });
  assert.equal(app.drugList().length, 0);
  assert.equal(app.state().error, '單項 OME 過高（100000 mg）。請確認輸入數值是否正確。');
});

test('P8 非癌症：維持 > 1000 拒絕', () => {
  const app = appIn('noncancer');
  app.add({ key: 'morphine_oral', dose: 900, freq: 1 });
  app.add({ key: 'morphine_oral', dose: 200, freq: 1 });
  assert.equal(app.drugList().length, 1);
  assert.equal(app.state().error, '總 OME 過高（1100 mg/day）。請確認輸入數值是否正確。');
});

test('P8 情境切換：癌症 1100 → 非癌症即拒絕並隱藏結果；切回癌症恢復', () => {
  const app = appIn('cancer');
  app.add({ key: 'morphine_oral', dose: 1100, freq: 1 });
  assert.ok(app.state().resultVisible);
  switchTo(app, 'noncancer');
  let st = app.state();
  assert.equal(st.error, '總 OME 過高（1100 mg/day）。非癌症情境上限 1000 mg/day，請確認輸入數值是否正確。');
  assert.equal(st.resultVisible, false);
  switchTo(app, 'cancer');
  st = app.state();
  assert.equal(st.error, null);
  assert.ok(st.resultVisible);
  assert.match(st.highDose, /超高劑量/);
});
