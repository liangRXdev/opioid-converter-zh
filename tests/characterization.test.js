// 鎖住 UI 端到端輸出：同一組輸入，重構前後必須逐位相同（golden 由 tests/update-golden.js 產生）。
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const golden = require('./golden/characterization.json');
const { loadApp } = require('./helpers/harness');
const { scenarios, runScenario, digest } = require('./helpers/scenarios');

for (const sc of scenarios()) {
  test(`characterization: ${sc.name}`, () => {
    assert.ok(golden[sc.name], 'golden 缺少此情境，請執行 node tests/update-golden.js');
    assert.deepEqual(digest(runScenario(loadApp, sc)), golden[sc.name]);
  });
}

test('characterization: 貼片對照表', () => {
  // 表格以 appendChild 逐列建立，innerHTML 恆為空字串；改比對各列內容
  assert.equal(loadApp().el('refTableBody').children.map(r => r.innerHTML).join('\n'), golden.__refTable);
});
