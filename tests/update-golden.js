// 重新產生 characterization golden：node tests/update-golden.js
// 僅在「刻意修 bug 造成輸出變化」時執行，並於 PR 逐一說明差異。
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { loadApp } = require('./helpers/harness');
const { scenarios, runScenario, digest } = require('./helpers/scenarios');

const out = {};
for (const sc of scenarios()) out[sc.name] = digest(runScenario(loadApp, sc));
out.__refTable = loadApp().el('refTableBody').innerHTML;
const file = path.join(__dirname, 'golden', 'characterization.json');
fs.writeFileSync(file, JSON.stringify(out, null, 1) + '\n');
console.log(`wrote ${Object.keys(out).length} entries → ${path.relative(process.cwd(), file)}`);
