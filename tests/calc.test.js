// js/calc.js 純函式單元測試
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../js/calc.js');

// 換算比清單（toOME 係數）＋程式內標示的出處。數值屬臨床裁決：改值須同步更新此表並附出處。
const RATIOS = {
  fentanyl_patch:      [2,    'UpToDate Graphic 111216 / NCCN 2026（÷2，mcg/h → mg OME/day）'],
  buprenorphine_td:    [2.5,  '程式內無文獻出處（僅註「20 mcg/h = 50 mg OME」）→ 待決'],
  fentanyl_iv:         [2.88, 'NCCN 2026 Table 2 註 c（穩態：250 mcg IV fentanyl ≈ 10 mg IV morphine）'],
  morphine_oral:       [1,    '基準'],
  morphine_iv_sc:      [3,    'footer：UpToDate / NCCN 2026'],
  hydromorphone_oral:  [5,    'MASCC-ASCO 2025 Table 3 5:1 / UpToDate 2026（NCCN 2026 ×4）'],
  hydromorphone_iv_sc: [20,   'NCCN 2026 Table 2（1.5 mg IV ≈ 30 mg PO morphine）；UpToDate ×25'],
  oxycodone_oral:      [1.5,  'README：全來源一致'],
  tramadol_oral:       [0.1,  'Micromedex 2025（CDC 2022 MME 表 0.2 僅用於 cdcRiskMME 風險評估）'],
  tramadol_iv:         [0.14, '推算值（oral ×0.1 ÷ BA 0.70），無主要指引 → 待決'],
  codeine_oral:        [0.15, 'footer / README，無單獨出處標示'],
  codeine_im:          [0.23, 'Micromedex 2025（IM 130 mg ≈ 30 OME）'],
};

test('換算比清單完整且與程式一致', () => {
  assert.deepEqual(Object.keys(C.DRUGS).sort(), Object.keys(RATIOS).sort());
  for (const [key, [k]] of Object.entries(RATIOS)) {
    assert.equal(C.DRUGS[key].toOME(1), k, key);
  }
});

test('不提供 methadone 線性換算', () => {
  assert.ok(!Object.keys(C.DRUGS).some(k => /methadone/i.test(k)));
});

test('雙向換算對稱：A→OME→B→OME→A 回到原值（不含減量）', () => {
  const doses = [0.01, 1, 7.5, 33.3333, 100, 999.9];
  for (const a of Object.keys(C.DRUGS)) {
    for (const b of Object.keys(C.DRUGS)) {
      for (const d of doses) {
        const back = C.DRUGS[a].fromOME(C.DRUGS[b].toOME(C.DRUGS[b].fromOME(C.DRUGS[a].toOME(d))));
        assert.ok(Math.abs(back - d) <= 1e-9 * Math.max(1, d), `${a}→${b}→${a} ${d} → ${back}`);
      }
    }
  }
});

test('雙向換算扣除交叉耐受減量：A→B 減 25% 後，B→A 再減 25% = 原值 × 0.75²', () => {
  const list1 = [C.parseEntry('morphine_oral', '60', '1')];
  const oxy = C.conversions(list1, 25).find(r => r.key === 'oxycodone_oral').adjDose;
  assert.equal(oxy, 30);
  const list2 = [C.parseEntry('oxycodone_oral', String(oxy), '1')];
  const mor = C.conversions(list2, 25).find(r => r.key === 'morphine_oral').adjDose;
  assert.equal(mor, 60 * 0.75 * 0.75);
});

test('單一來源藥物本身不減量', () => {
  const rows = C.conversions([C.parseEntry('oxycodone_oral', '20', '2')], 50);
  assert.equal(rows.find(r => r.key === 'oxycodone_oral').adjDose, 40);
  assert.equal(rows.find(r => r.key === 'morphine_oral').adjDose, 30);
});

test('breakthroughRange = 總 OME × 10–20%', () => {
  assert.deepEqual(C.breakthroughRange(100), { min: 10, max: 20 });
});
