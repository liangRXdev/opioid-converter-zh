// tests/tools/statecmp.js 的純函式（不啟動 git worktree）
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseArgs, compare } = require('./tools/statecmp');

test('statecmp parseArgs：預設 main；--ignore 可重複；--only 以逗號分隔', () => {
  assert.deepEqual(parseArgs([]), { base: 'main', ignore: [], only: null, show: false });
  const o = parseArgs(['HEAD~1', '--ignore', 'a+', '--ignore', 'b', '--only', 'grid,bt', '--show']);
  assert.equal(o.base, 'HEAD~1');
  assert.deepEqual(o.ignore.map(r => r.source), ['a+', 'b']);
  assert.deepEqual(o.only, ['grid', 'bt']);
  assert.equal(o.show, true);
  assert.throws(() => parseArgs(['--bogus']), /未知選項/);
});

test('statecmp compare：逐欄比對、--ignore 排除已知文字、新增與移除情境', () => {
  const a = { s1: { ome: '30.0', note: 'v1 舊字' }, s2: { ome: '1' }, gone: { ome: '0' } };
  const b = { s1: { ome: '30.0', note: 'v2 新字' }, s2: { ome: '2' }, added: { ome: '0' } };
  assert.deepEqual(compare(a, b, []), { changed: { s1: ['note'], s2: ['ome'], added: ['(新增情境)'] }, removed: ['gone'] });
  assert.deepEqual(compare(a, b, [/v\d [舊新]字/g]).changed, { s2: ['ome'], added: ['(新增情境)'] });
});

test('statecmp compare：欄位只出現在一側也算變動', () => {
  assert.deepEqual(compare({ s: { a: 1 } }, { s: { a: 1, cdcMme: 'x' } }, []).changed, { s: ['cdcMme'] });
});
