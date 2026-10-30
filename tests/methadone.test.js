// Methadone：工具不支援線性換算，UI 需明示（原本只寫在 README）
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/calc.js');
const { loadApp } = require('./helpers/harness');

test('Methadone：藥物選單列出但不可選（disabled、無 value）', () => {
  const { html } = loadApp();
  const m = /<optgroup label="Methadone[^"]*">\s*<option([^>]*)>([^<]*)<\/option>\s*<\/optgroup>/.exec(html);
  assert.ok(m, '選單應有 Methadone optgroup');
  assert.match(m[1], /\bdisabled\b/);
  assert.match(m[1], /value=""/);
  assert.match(m[2], /不支援/);
  assert.ok(!Object.keys(C.DRUGS).some(k => /methadone/i.test(k)), 'DRUGS 仍不得有 methadone');
});

test('Methadone：免責聲明說明不支援原因與出處', () => {
  const { html } = loadApp();
  const box = /<div class="disclaimer[^"]*">[\s\S]*?<\/div>/.exec(html)[0];
  assert.match(box, /Methadone/);
  assert.match(box, /半衰期長（15–120 h）/);
  assert.match(box, /MASCC-ASCO 2025 Rec 2\.6/);
  assert.match(box, /75–90%（Fine 2009）/);
});
