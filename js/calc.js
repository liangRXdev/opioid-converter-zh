// ============================================================
// OPIOID CONVERSION — 純計算模組（無 DOM）
// 瀏覽器：<script src="js/calc.js"> → window.OpioidCalc
// Node：  require('./js/calc.js')
// 換算比、交叉耐受減量比例、劑量上限屬臨床裁決，修改須附出處。
// ============================================================
(function (root) {
  'use strict';

  const DRUGS = {
    fentanyl_patch:        { label: 'Fentanyl 貼片', route: 'transdermal', unit: 'mcg/h',   toOME: d => d * 2,   fromOME: ome => ome / 2,   isPatch: true },
    buprenorphine_td:      { label: 'Buprenorphine 貼片', route: 'transdermal', unit: 'mcg/h', toOME: d => d * 2.5, fromOME: ome => ome / 2.5, isPatch: true, isBupPatch: true },
    // Fentanyl IV 持續輸注（穩態）— NCCN Adult Cancer Pain v1.2026 Table 2 註 c（穩態）：
    //   重複給藥（steady-state）時 10 mg IV morphine ≈ 250 mcg IV fentanyl（單次給藥為 100 mcg，不適用持續輸注）
    //   1 mcg/h × 24 h = 24 mcg/day；250 mcg IV fentanyl ≈ 10 mg IV morphine ≈ 30 mg PO morphine
    //   → 24 × 30/250 = 2.88 mg OME/day per mcg/h
    fentanyl_iv:           { label: 'Fentanyl IV 持續輸注', route: 'IV', unit: 'mcg/hr',    toOME: d => d * 2.88, fromOME: ome => ome / 2.88, isIVInfusion: true },
    morphine_oral:         { label: 'Morphine 口服',  route: 'oral',        unit: 'mg/day',  toOME: d => d * 1,   fromOME: ome => ome / 1 },
    morphine_iv_sc:        { label: 'Morphine IV/SC', route: 'IV/SC',       unit: 'mg/day',  toOME: d => d * 3,   fromOME: ome => ome / 3 },
    hydromorphone_oral:    { label: 'Hydromorphone 口服', route: 'oral',    unit: 'mg/day',  toOME: d => d * 5,   fromOME: ome => ome / 5 },
    hydromorphone_iv_sc:   { label: 'Hydromorphone IV/SC', route: 'IV/SC', unit: 'mg/day',  toOME: d => d * 25,  fromOME: ome => ome / 25 },
    oxycodone_oral:        { label: 'Oxycodone 口服', route: 'oral',        unit: 'mg/day',  toOME: d => d * 1.5, fromOME: ome => ome / 1.5 },
    tramadol_oral:         { label: 'Tramadol 口服',  route: 'oral',        unit: 'mg/day',  toOME: d => d * 0.1,  fromOME: ome => ome / 0.1,  isWeak: true, warn: '⚠ 前驅藥（CYP2D6 活化）；最大劑量 400 mg/day；腎衰竭需調整（Micromedex 2025）' },
    tramadol_iv:           { label: 'Tramadol IV/IM', route: 'IV/IM',       unit: 'mg/day',  toOME: d => d * 0.14, fromOME: ome => ome / 0.14, isWeak: true, warn: '⚠ [推算值] 換算因子 ×0.14（單次給藥 oral BA ≈70%，Grond 2004）；長期服藥後 oral BA 升至 90–100%，慢性輪換情境下 IV/IM 與口服差異縮小；UpToDate/NCCN 均無明確 IV 換算因子；CYP2D6 個體差異大，結果僅供估算參考' },
    codeine_oral:          { label: 'Codeine 口服',   route: 'oral',        unit: 'mg/day',  toOME: d => d * 0.15,fromOME: ome => ome / 0.15, isWeak: true },
    codeine_im:            { label: 'Codeine IM',     route: 'IM',          unit: 'mg/day',  toOME: d => d * 0.23,fromOME: ome => ome / 0.23, isWeak: true, warn: '⚠ Codeine IM 不建議常規使用（組胺釋放風險）；IM 等效劑量 130 mg（≠ 口服 200 mg，Micromedex 2025）' },
  };

  const PATCH_SIZES = [12, 25, 50, 75, 100]; // fentanyl patch sizes for reference table
  const BUP_PATCH_SIZES = [5, 10, 20];       // Norspan® mcg/h
  const FENTANYL_PATCH_OPTIONS = [
    [12, '12 mcg/h (或12.5)'], [25, '25 mcg/h'], [37.5, '37.5 mcg/h (25+12.5)'],
    [50, '50 mcg/h'], [62.5, '62.5 mcg/h (50+12.5)'], [75, '75 mcg/h'],
    [87.5, '87.5 mcg/h (75+12.5)'], [100, '100 mcg/h'], [125, '125 mcg/h'], [150, '150 mcg/h'],
  ];

  // 單項與總 OME 的防呆上限（mg/day）
  const MAX_OME = 1000;

  // Renal adjustment flags (Micromedex 2025 / UpToDate 2026)
  const RENAL_FLAGS = {
    morphine_oral:       { level: 'danger',  note: 'GFR<30：M6G 蓄積 → CNS 毒性，避免使用（Micromedex 2025）' },
    morphine_iv_sc:      { level: 'danger',  note: 'GFR<30：M6G 蓄積 → CNS 毒性，避免使用（Micromedex 2025）' },
    hydromorphone_oral:  { level: 'caution', note: 'GFR<30：H3G 蓄積 → 神經毒性（肌陣攣），減量並監測（Micromedex 2025）' },
    hydromorphone_iv_sc: { level: 'caution', note: 'GFR<30：H3G 蓄積 → 神經毒性（肌陣攣），減量並監測（Micromedex 2025）' },
    codeine_oral:        { level: 'danger',  note: 'GFR<30：活性代謝物蓄積 → CNS 毒性，應避免（Micromedex 2025）' },
    codeine_im:          { level: 'danger',  note: 'GFR<30：活性代謝物蓄積 → CNS 毒性，應避免（Micromedex 2025）' },
    tramadol_oral:       { level: 'caution', note: 'GFR<30：代謝物蓄積 → 癲癇閾值降低，需延長給藥間隔（Micromedex 2025）' },
    tramadol_iv:         { level: 'caution', note: 'GFR<30：代謝物蓄積 → 癲癇閾值降低，需延長給藥間隔（Micromedex 2025）' },
    oxycodone_oral:      { level: 'caution', note: 'GFR<30：代謝物蓄積，建議減量（Micromedex 2025）' },
    fentanyl_patch:      { level: 'ok',      note: '腎衰竭可選：無活性代謝物蓄積（UpToDate 2026）' },
    fentanyl_iv:         { level: 'ok',      note: '腎衰竭可選：無活性代謝物蓄積（UpToDate 2026）' },
    buprenorphine_td:    { level: 'ok',      note: '腎衰竭首選：非腎臟清除，GFR<15 仍可使用（UpToDate 2026）' },
  };

  const DRUG_DISPLAY_ORDER = [
    'fentanyl_patch', 'buprenorphine_td', 'fentanyl_iv',
    'morphine_oral', 'morphine_iv_sc',
    'hydromorphone_oral', 'hydromorphone_iv_sc',
    'oxycodone_oral',
    'tramadol_oral', 'tramadol_iv',
    'codeine_oral', 'codeine_im',
  ];

  function crossTolFactor(crossTolPct) {
    return 1 - crossTolPct / 100;
  }

  function totalOME(list) {
    return list.reduce((s, i) => s + i.ome, 0);
  }

  // 將表單原始輸入轉為用藥清單項目；回傳 { error } 或 { key, label, doseLabel, ome }
  function parseEntry(key, rawDose, rawFreq) {
    const drug = DRUGS[key];
    const freq = parseFloat(rawFreq) || 1;
    let doseInput, doseLabel;

    if (drug.isPatch) {
      doseInput = parseFloat(rawDose);
      if (!Number.isFinite(doseInput)) return { error: '請從下拉選單選擇有效的貼片劑量。' };
      doseLabel = `${doseInput} mcg/h`;
    } else if (drug.isIVInfusion) {
      doseInput = parseFloat(rawDose);
      if (!Number.isFinite(doseInput) || doseInput <= 0) return { error: '請輸入有效的正數劑量。' };
      doseLabel = `${doseInput} mcg/hr 持續輸注`;
    } else {
      doseInput = parseFloat(rawDose);
      if (!Number.isFinite(doseInput) || doseInput <= 0) return { error: '請輸入有效的正數劑量。' };
      const td = doseInput * freq;
      doseLabel = freq > 1 ? `${doseInput} mg × ${freq} = ${fmt(td, 1)} mg/day` : `${fmt(td, 1)} mg/day`;
    }

    const totalDose = (drug.isPatch || drug.isIVInfusion) ? doseInput : doseInput * freq;
    const ome = drug.toOME(totalDose);
    if (ome > MAX_OME) return { error: `單項 OME 過高（${ome.toFixed(0)} mg）。請確認輸入數值是否正確。` };

    return { key, label: drug.label, doseLabel, ome, dose: totalDose };
  }

  // 加入 entry 後總 OME 是否超過上限；超過回傳錯誤訊息（不得先加入清單再檢查）
  function totalOMEError(list, entry) {
    const total = totalOME(list.concat(entry));
    return total > MAX_OME ? `總 OME 過高（${total.toFixed(0)} mg/day）。請確認輸入數值是否正確。` : null;
  }

  function sourceInfo(list) {
    const sourceKeys = new Set(list.map(i => i.key));
    // 以「不同藥物/途徑數」判斷：同藥同途徑分多筆（SR + IR、貼片組合）仍屬單一來源
    return { sourceKeys, singleSource: sourceKeys.size === 1 };
  }

  // NCCN Adult Cancer Pain v1.2026 PAIN-G 13：持續輸注 fentanyl → 貼片 straight 1:1（mcg/h）
  const IV_PATCH_HINT = '依 NCCN 2026 PAIN-G 13：持續輸注→貼片 1:1。貼上後 6 小時輸注速率減半，12 小時停止（或 6 小時直接停止）；部分病人需再調整貼片劑量。';
  const IV_MIXED_HINT = '混合來源，未套用 IV→貼片 1:1';

  // 來源僅 fentanyl_iv（可多筆）→ 貼片 1:1、不減量；含 fentanyl_iv 的混合來源 → 維持 OME 路徑
  // 反向（貼片→IV）NCCN 未規定，不另設規則
  function ivPatchMode(list) {
    const { sourceKeys, singleSource } = sourceInfo(list);
    const hasIV = sourceKeys.has('fentanyl_iv');
    const ivTotal = list.filter(i => i.key === 'fentanyl_iv').reduce((s, i) => s + i.dose, 0);
    return { ivDirect: hasIV && singleSource, ivMixed: hasIV && !singleSource, ivTotal };
  }

  // 各藥物換算劑量（依 DRUG_DISPLAY_ORDER）；單一來源藥物不減量，其餘套用交叉耐受減量
  function conversions(list, crossTolPct) {
    const factor = crossTolFactor(crossTolPct);
    const ome = totalOME(list);
    const { sourceKeys, singleSource } = sourceInfo(list);
    const { ivDirect: ivMode, ivTotal } = ivPatchMode(list);
    return DRUG_DISPLAY_ORDER.map(key => {
      const drug = DRUGS[key];
      const isSource = sourceKeys.has(key);
      const ivDirect = ivMode && key === 'fentanyl_patch';
      const rawDose = ivDirect ? ivTotal : drug.fromOME(ome);
      const adjDose = (ivDirect || (isSource && singleSource)) ? rawDose : rawDose * factor;
      return { key, drug, isSource, singleSource, ivDirect, rawDose, adjDose, display: formatDose(drug, adjDose) };
    });
  }

  // toFixed 的安全版：0 < v < 1 時固定小數位會捨成 0 或相對誤差過大（0.06 → 0.1，+67%），
  // 改以 2 位有效數字顯示；v ≥ 1 維持原小數位
  function fmt(v, digits) {
    return (v > 0 && v < 1) ? v.toPrecision(2) : v.toFixed(digits);
  }

  function formatDose(drug, dose) {
    return (drug.isPatch || !drug.isWeak) ? fmt(dose, 1) : fmt(dose, 0);
  }

  // 目標與可用劑量的比對容差（mcg/h）：吸收浮點誤差（如 72/2.88 = 24.999…），
  // |target − 劑量| ≤ 此值即視為與規格相符，只建議該劑量
  const PATCH_MATCH_TOL = 0.05;

  // > 100 mcg/h 的組合：100×n + r（n ≥ 1），r 取自此清單；≤ 100 仍只用 PATCH_SIZES（不改既有輸出）
  const PATCH_COMBO_REMAINDERS = [0, 12, 25, 50, 75];

  // 可用貼片劑量（遞增）：PATCH_SIZES，再接 > 100 的組合直到第一個 > target 者。
  // 不另設上限，上限由 MAX_OME 決定。
  function availablePatches(target) {
    const out = PATCH_SIZES.map(dose => ({ dose, label: `${dose} mcg/h` }));
    for (let n = 1; out[out.length - 1].dose <= target + PATCH_MATCH_TOL; n++) {
      for (const r of PATCH_COMBO_REMAINDERS) {
        const dose = 100 * n + r;
        if (dose <= 100) continue;
        const parts = Array(n).fill(100).concat(r ? [r] : []);
        out.push({ dose, label: `${dose} mcg/h（${parts.join('+')}）` });
      }
    }
    return out;
  }

  // 依目標 mcg/h 選規格：相符 → match；否則 lower（≤ 目標最大，保守）/ higher（> 目標最小，積極）
  function recommendPatch(target) {
    const avail = availablePatches(target);
    const match = avail.find(p => Math.abs(target - p.dose) <= PATCH_MATCH_TOL);
    if (match) return { match, lower: undefined, higher: undefined };
    const lower  = avail.filter(p => p.dose <= target).slice(-1)[0];
    const higher = avail.find(p => p.dose > target);
    return { match: undefined, lower, higher };
  }

  // Fentanyl 貼片建議規格
  function patchRecommendation(list, crossTolPct) {
    const { sourceKeys, singleSource } = sourceInfo(list);
    const onlyFentanyl = sourceKeys.has('fentanyl_patch') && singleSource;
    const { ivDirect, ivMixed, ivTotal } = ivPatchMode(list);
    const patchFactor = onlyFentanyl ? 1 : crossTolFactor(crossTolPct);
    const target = ivDirect ? ivTotal : DRUGS.fentanyl_patch.fromOME(totalOME(list)) * patchFactor;
    return { onlyFentanyl, ivDirect, ivMixed, target, ...recommendPatch(target) };
  }

  // Breakthrough dose：總 OME × 10–20%
  function breakthroughRange(ome) {
    return { min: ome * 0.10, max: ome * 0.20 };
  }

  // 複製用純文字摘要
  function buildSummary(list, ome, crossTolPct, now) {
    const factor = crossTolFactor(crossTolPct);
    const { sourceKeys, singleSource } = sourceInfo(list);
    const { ivDirect, ivTotal } = ivPatchMode(list);

    let txt = `═══ Opioid MME 換算摘要 ═══\n${now}\n\n`;
    txt += `【目前用藥】\n`;
    list.forEach(item => { txt += `  • ${item.label}  ${item.doseLabel}  →  ${fmt(item.ome, 1)} MME\n`; });
    txt += `  總計：${fmt(ome, 1)} mg OME/24h\n\n`;

    if (crossTolPct > 0) txt += `【跨藥物減量】減量 ${crossTolPct}%（換算因子 ×${factor.toFixed(2)}）\n\n`;

    txt += `【等效換算劑量（建議起始劑量）】\n`;
    ['morphine_oral', 'hydromorphone_oral', 'oxycodone_oral', 'fentanyl_patch'].forEach(dk => {
      const d = DRUGS[dk];
      const isSource = sourceKeys.has(dk);
      const iv = ivDirect && dk === 'fentanyl_patch';
      const adj = iv ? ivTotal : (isSource && singleSource) ? d.fromOME(ome) : d.fromOME(ome) * factor;
      const val = d.isPatch ? `${fmt(adj, 1)} mcg/h` : `${fmt(adj, 1)} mg/day`;
      txt += `  • ${d.label}：${val}${isSource && singleSource ? '（來源，未減量）' : ''}${iv ? '（IV→貼片 1:1，未減量）' : ''}\n`;
    });

    txt += `\n【Breakthrough Dose（PRN q1–4h）】\n`;
    const bt = breakthroughRange(ome);
    txt += `  OME × 10–20% = ${fmt(bt.min, 1)}–${fmt(bt.max, 1)} mg\n`;
    [['morphine_oral', 'Morphine 口服'], ['hydromorphone_oral', 'Hydromorphone 口服']].forEach(([k, lbl]) => {
      const d = DRUGS[k];
      txt += `  • ${lbl}：${fmt(d.fromOME(bt.min), 1)}–${fmt(d.fromOME(bt.max), 1)} mg  Q4H PRN\n`;
    });

    txt += `\n⚠ 本工具僅供臨床輔助參考，不取代臨床判斷。\n（UpToDate 2026 Graphic 111216 / NCCN 2026 v1）`;
    return txt;
  }

  const api = {
    DRUGS, PATCH_SIZES, PATCH_MATCH_TOL, BUP_PATCH_SIZES, FENTANYL_PATCH_OPTIONS, MAX_OME, RENAL_FLAGS, DRUG_DISPLAY_ORDER,
    IV_PATCH_HINT, IV_MIXED_HINT,
    crossTolFactor, fmt, totalOME, totalOMEError, parseEntry, sourceInfo, ivPatchMode, conversions, formatDose,
    recommendPatch, patchRecommendation, breakthroughRange, buildSummary,
  };

  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.OpioidCalc = api;
})(this);
