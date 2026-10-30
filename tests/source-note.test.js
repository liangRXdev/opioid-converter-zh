// OME 來源說明：原本以清單筆數當「N 種藥物」（SR + IR 同藥兩筆會顯示「2 種藥物」）
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/calc.js');
const { loadApp } = require('./helpers/harness');

const E = (key, dose, freq = 1) => C.parseEntry(key, String(dose), String(freq));

test('sourceNote：單筆維持原格式', () => {
  assert.equal(C.sourceNote([E('morphine_oral', 30)]), '來源：Morphine 口服 30.0 mg/day → OME');
});

test('sourceNote：同藥同途徑多筆 → 「N 筆加總」，不稱 2 種藥物', () => {
  assert.equal(C.sourceNote([E('morphine_oral', 30, 2), E('morphine_oral', 10)]), '來源：Morphine 口服 2 筆加總');
  assert.equal(C.sourceNote([E('fentanyl_patch', 50), E('fentanyl_patch', 25)]), '來源：Fentanyl 貼片 2 筆加總');
});

test('sourceNote：不同藥物／途徑以種類數計，筆數較多時另註', () => {
  assert.equal(C.sourceNote([E('morphine_oral', 30), E('oxycodone_oral', 10)]), '來源：2 種藥物／途徑加總');
  assert.equal(C.sourceNote([E('morphine_oral', 30), E('morphine_iv_sc', 10)]), '來源：2 種藥物／途徑加總');
  assert.equal(C.sourceNote([E('morphine_oral', 30), E('morphine_oral', 10), E('oxycodone_oral', 10)]),
    '來源：2 種藥物／途徑加總（共 3 筆）');
});

test('sourceNote：空清單回空字串', () => {
  assert.equal(C.sourceNote([]), '');
});

test('UI omeNote 使用 sourceNote（F3 情境：SR + IR 同藥）', () => {
  const app = loadApp();
  app.add({ key: 'morphine_oral', dose: 30, freq: 2 });
  app.add({ key: 'morphine_oral', dose: 10, freq: 1 });
  assert.equal(app.state().omeNote, '來源：Morphine 口服 2 筆加總');
});
