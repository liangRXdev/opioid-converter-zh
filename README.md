# 鴉片類劑量換算系統

**Opioid Equianalgesic Dose Converter（繁體中文版）**

臨床藥師用途的 Opioid MME（Morphine Milligram Equivalent）換算工具，支援多藥物等效換算、Fentanyl 貼片劑量對照與跨藥物輪替減量計算。

🔗 **線上使用**：[https://liangrxdev.github.io/opioid-converter-zh/](https://liangrxdev.github.io/opioid-converter-zh/)

---

## 功能特色

| 功能 | 說明 |
|------|------|
| **劑量換算計算機** | 輸入目前用藥劑量，即時輸出所有支援藥物的等效 OME 及換算劑量 |
| **不完全交叉耐受性減量** | 一鍵套用 25% 減量（opioid rotation 標準做法）|
| **Fentanyl 貼片規格建議** | 依計算結果自動推薦最近規格（保守 / 積極兩選項）|
| **高劑量警示** | OME > 200 mg/day 自動顯示警示，建議會診 |
| **貼片劑量對照表** | 以貼片強度為基準，列出所有藥物對應每日劑量 |
| **各指引換算比例比較** | UpToDate / NCCN 2026 / Reddy 2015 / Duragesic PI 並列比較 |

---

## 支援藥物

| 藥物 | 途徑 | MME 換算因子 | 備注 |
|------|------|------------|------|
| Fentanyl 貼片（TDF）| Transdermal | ÷2（mcg/h → mg OME/day）| 使用 UpToDate / NCCN 2026 ÷2 公式 |
| Morphine | 口服 | ×1（基準）| — |
| Morphine | IV / SC | ×3 | — |
| Hydromorphone | 口服 | ×5 | UpToDate 2026；NCCN 2026 採 ×4，差異 25%（見注意事項）|
| Hydromorphone | IV / SC | ×25 | UpToDate 2026；NCCN 2026 採 ×20 |
| Oxycodone | 口服 | ×1.5 | 全來源一致 |
| Tramadol | 口服 | ×0.1 | 前驅藥（CYP2D6）；最大 400 mg/day |
| Codeine | 口服 | ×0.15 | — |
| Codeine | IM | ×0.23 | IM 等效劑量 130 mg ≠ 口服 200 mg；臨床已不建議常規 IM 使用 |

---

## 重要注意事項

### Hydromorphone 換算因子差異

| 來源 | 口服 Hydromorphone = 30 MME | 換算因子 |
|------|---------------------------|---------|
| **UpToDate 2026**（本工具採用）| 6 mg | ×5 |
| **NCCN 2026 Table 2** | 7.5 mg | ×4 |

兩者相差 25%。本工具採用 UpToDate（較保守），高風險評估時為偏安全選擇。臨床使用時請選定一個來源並前後一致。

### Fentanyl 貼片（TDF）換算比例

本工具使用 **÷2 公式**（UpToDate Graphic 111216 / NCCN 2026）：

| 來源 | 換算公式 | 200 mg/day PO Morphine → TDF |
|------|---------|------------------------------|
| **本工具（UpToDate / NCCN 2026）** | ÷2 | 100 mcg/h |
| Reddy et al. 2015（高 MEDD 建議）| ÷2.5 | 80 mcg/h |
| Duragesic® PI（最保守）| ÷3–4（依區間查表）| 50 mcg/h |

> UpToDate 原文聲明：*"Suggested doses for conversion to transdermal fentanyl are LESS CONSERVATIVE than recommendations in the US product labeling."*
> 高齡、opioid-naïve、高劑量（MEDD > 300 mg/day）患者建議改用 ÷2.5（Reddy 2015）。

### Opioid Rotation 減量原則

- 疼痛已控制 → 換算後**減量 25–50%**（不完全交叉耐受性）
- 疼痛未控制 → 從 **100%** 等效劑量起始
- 換至 Methadone → 特例，需減量 **75–>90%**（本工具未支援 Methadone，請個別評估）

---

## 臨床免責聲明

本工具**僅供臨床決策輔助**，所有換算結果為近似值，不得取代臨床判斷。換算係數基於單次劑量研究，個體間差異顯著，實際劑量需依病患腎功能、疼痛控制狀態及個別反應調整。高劑量（TDF > 100 mcg/h）或老年病患請更保守換算。

---

## 技術說明

- **架構**：純靜態 HTML（單檔案），無需後端，無資料上傳
- **相依套件**：Bootstrap 5.3.2（CDN）、Noto Sans TC / JetBrains Mono（Google Fonts CDN）
- **部署**：GitHub Pages（`main` branch root）

---

## 版本記錄

| 版本 | 日期 | 變更摘要 |
|------|------|---------|
| v1.2.1 | 2026-05-22 | 修正 Codeine IM 換算因子（×0.15→×0.23）；修正 Janssen PI 標示（÷3→÷3–4）；補充 Hydromorphone 來源差異說明；新增 Tramadol 支援 |
| v1.2.0 | — | 新增 Fentanyl 貼片防呆下拉選單（取代自由輸入）；修正 resultPanel 初始顯示 bug |
| v1.1.x | — | 加入跨藥物耐受性 toggle；高劑量警示；貼片規格建議邏輯 |
| v1.0.0 | — | 初始版本 |

---

## 參考文獻

1. Broglio K, Portenoy RK. Approximate opioid dose conversions and oral total daily MMEs. **UpToDate** Graphic 111216, Version 16.0. © 2026 UpToDate, Inc.
2. NCCN Clinical Practice Guidelines in Oncology: **Adult Cancer Pain**. Version 1.2026. National Comprehensive Cancer Network, January 23, 2026.
3. Dowell D, et al. CDC Clinical Practice Guideline for Prescribing Opioids. **MMWR** 2022;71(3):1–95.
4. Reddy A, et al. The opioid rotation ratio of strong opioids to transdermal fentanyl in cancer patients. **Cancer** 2016;122(1):149–156.
5. Merative US L.P. Opioid Dose Conversion and Equianalgesic Doses. **Micromedex** Drug Consult. Last Modified: July 1, 2025.

---

## 授權

本工具由**梁哲嘉藥師**（台灣）開發，供臨床藥學教育與實務輔助用途。
