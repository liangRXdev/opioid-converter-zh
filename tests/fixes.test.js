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
