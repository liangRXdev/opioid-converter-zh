// 極端值：0、負值、空白、非數字、極大值、多位小數、極小值 —— 任何輸出不得出現 NaN / Infinity / 負劑量 / 被捨成 0
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/calc.js');
const { loadApp } = require('./helpers/harness');

const BAD = /NaN|Infinity|undefined|(^|[^\w.])-\d/;
const KEYS = Object.keys(C.DRUGS).filter(k => !C.DRUGS[k].isPatch);

function allText(app) {
  const st = app.state();
  return JSON.stringify(st) + (app.drugList().length ? app.copy() : '');
}

const REJECT = { '0 劑量': '0', '負值': '-5', '空白': '', '非數字': 'abc', '極大值 Infinity': '1e400', '僅空白字元': '   ' };
for (const [name, raw] of Object.entries(REJECT)) {
  test(`極端值｜${name}（${JSON.stringify(raw)}）：所有非貼片藥物皆拒絕、不加入清單`, () => {
    for (const key of KEYS) {
      const app = loadApp();
      app.add({ key, dose: raw, freq: 1 });
      assert.equal(app.drugList().length, 0, key);
      assert.equal(app.state().error, '請輸入有效的正數劑量。', key);
      assert.doesNotMatch(allText(app), BAD, key);
    }
  });
}

test('極端值｜極大值：非癌症 Morphine 口服 10,000、癌症 100,000 mg/day 拒絕，訊息無 Infinity/NaN', () => {
  for (const [context, dose] of [['noncancer', 10000], ['cancer', 100000]]) {
    const app = loadApp();
    app.el('clinicContext').value = context;
    app.add({ key: 'morphine_oral', dose, freq: 1 });
    assert.equal(app.drugList().length, 0, context);
    assert.equal(app.state().error, `單項 OME 過高（${dose} mg）。請確認輸入數值是否正確。`, context);
  }
});

test('極端值｜上限邊界（非癌症）：OME 剛好 1000 可加入、累計超過則拒絕且不殘留', () => {
  const app = loadApp();
  app.el('clinicContext').value = 'noncancer';
  app.add({ key: 'morphine_oral', dose: 1000, freq: 1 });
  assert.equal(app.drugList().length, 1);
  app.add({ key: 'oxycodone_oral', dose: 0.01, freq: 1 });
  assert.equal(app.drugList().length, 1);
  assert.match(app.state().error, /總 OME 過高/);
});

test('極端值｜多位小數與極小值：輸出無 NaN/Infinity/負值，正劑量不顯示為 0', () => {
  for (const key of KEYS) {
    for (const raw of ['1.23456789', '0.000001', '33.33333333333', '999.999999']) {
      const app = loadApp();
      app.add({ key, dose: raw, freq: 1 });
      if (app.drugList().length === 0) continue; // 超過單項上限者已由上個測試涵蓋
      const st = app.state();
      assert.doesNotMatch(allText(app), BAD, `${key} ${raw}`);
      for (const h of st.grid) {
        const d = /<div class="drug-dose">([^<]*)</.exec(h)[1];
        assert.ok(Number(d) > 0, `${key} ${raw} → ${d}`);
      }
    }
  }
});

test('極端值｜貼片空白選項拒絕', () => {
  for (const key of ['fentanyl_patch', 'buprenorphine_td']) {
    const app = loadApp();
    app.add({ key, dose: '' });
    assert.equal(app.drugList().length, 0);
    assert.equal(app.state().error, '請從下拉選單選擇有效的貼片劑量。');
  }
});

test('極端值｜全部藥物 × 交叉耐受 0/25/50 × 正常劑量：無負劑量、無 NaN', () => {
  for (const key of Object.keys(C.DRUGS)) {
    const raw = C.DRUGS[key].isPatch ? (C.DRUGS[key].isBupPatch ? '20' : '50') : '10';
    for (const tol of [0, 25, 50]) {
      const e = C.parseEntry(key, raw, '1');
      for (const r of C.conversions([e], tol)) {
        assert.ok(Number.isFinite(r.adjDose) && r.adjDose > 0, `${key} tol${tol} ${r.key}`);
        assert.doesNotMatch(r.display, BAD);
      }
    }
  }
});
