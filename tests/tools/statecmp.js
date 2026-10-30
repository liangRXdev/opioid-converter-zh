#!/usr/bin/env node
// 完整狀態比對：以 git worktree 取出基準版本，兩邊各跑全部 characterization 情境，逐欄比對 UI 狀態。
// golden 只存 sha256，看不出「哪些欄位、為何」改變；刻意改輸出的 PR 用本工具證明變動範圍。
//
// 用法：node tests/tools/statecmp.js [base-ref] [選項]
//   base-ref            比對基準（預設 main）
//   --ignore <regex>    比對前自各欄位 JSON 字串移除符合的文字（可重複；用來排除已知的文字變動）
//   --only <f1,f2>      僅允許這些欄位改變，其他欄位有變動時 exit 1
//   --show              列出每個變動情境的欄位（預設只列前 20 個）
'use strict';
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { execFileSync } = require('node:child_process');

const ROOT = path.join(__dirname, '..', '..');

function parseArgs(argv) {
  const opts = { base: 'main', ignore: [], only: null, show: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--ignore') opts.ignore.push(new RegExp(argv[++i], 'g'));
    else if (a === '--only') opts.only = argv[++i].split(',');
    else if (a === '--show') opts.show = true;
    else if (a.startsWith('--')) throw new Error(`未知選項：${a}`);
    else opts.base = a;
  }
  return opts;
}

// 以 root 自己的 harness 與情境清單執行（兩版的情境清單可能不同，依名稱對齊）
function runAll(root) {
  const { loadApp } = require(path.join(root, 'tests/helpers/harness'));
  const { scenarios, runScenario } = require(path.join(root, 'tests/helpers/scenarios'));
  const htmlFile = path.join(root, 'index.html');
  const out = {};
  for (const sc of scenarios()) out[sc.name] = runScenario(o => loadApp({ ...o, htmlFile }), sc);
  return out;
}

function compare(a, b, ignore) {
  const norm = v => ignore.reduce((s, re) => s.replace(re, ''), JSON.stringify(v) ?? '');
  const changed = {};
  for (const name of Object.keys(b)) {
    if (!(name in a)) { changed[name] = ['(新增情境)']; continue; }
    const fields = Object.keys({ ...a[name], ...b[name] }).filter(f => norm(a[name][f]) !== norm(b[name][f]));
    if (fields.length) changed[name] = fields;
  }
  const removed = Object.keys(a).filter(n => !(n in b));
  return { changed, removed };
}

function main() {
  const opts = parseArgs(process.argv.slice(2));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'statecmp-'));
  const wt = path.join(tmp, 'base');
  execFileSync('git', ['-C', ROOT, 'worktree', 'add', '--detach', '-q', wt, opts.base], { stdio: 'inherit' });
  let code = 0;
  try {
    const current = runAll(ROOT);
    const { changed, removed } = compare(runAll(wt), current, opts.ignore);
    const names = Object.keys(changed);
    const fieldCount = {};
    names.forEach(n => changed[n].forEach(f => { fieldCount[f] = (fieldCount[f] || 0) + 1; }));
    const total = Object.keys(current).length;
    console.log(`基準 ${opts.base}：${total} 個情境，${names.length} 個變動，${removed.length} 個移除`);
    console.log('變動欄位：', fieldCount);
    (opts.show ? names : names.slice(0, 20)).forEach(n => console.log(`  ${n} | ${changed[n].join(',')}`));
    if (!opts.show && names.length > 20) console.log(`  …另 ${names.length - 20} 個（--show 列出全部）`);
    if (removed.length) console.log('移除的情境：', removed.join(' / '));
    if (opts.only) {
      const extra = Object.keys(fieldCount).filter(f => !opts.only.includes(f));
      if (extra.length) { console.error(`✖ 預期外欄位變動：${extra.join(',')}`); code = 1; }
      else console.log(`✔ 僅 ${opts.only.join(',')} 變動`);
    }
  } finally {
    execFileSync('git', ['-C', ROOT, 'worktree', 'remove', '--force', wt]);
    fs.rmSync(tmp, { recursive: true, force: true });
  }
  process.exit(code);
}

if (require.main === module) main();
module.exports = { parseArgs, compare };
