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
