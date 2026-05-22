# 鴉片類劑量換算系統

**Opioid Equianalgesic Dose Converter（繁體中文版）**

臨床藥師用途的 Opioid MME（Morphine Milligram Equivalent）換算工具，支援多藥物等效換算、情境切換（癌症 / 非癌症）、腎功能風險提示、Buprenorphine 貼片、Fentanyl IV 輸注，以及跨藥物輪替減量計算。

 [![Live Demo](https://img.shields.io/badge/Live%20Demo-Click%20Here-blue?style=for-the-badge)](https://liangrxdev.github.io/opioid-converter-zh/)
---

## 功能特色

| 功能 | 說明 |
|------|------|
| **劑量換算計算機** | 輸入目前用藥劑量，即時輸出所有支援藥物的等效 OME 及換算劑量 |
| **多藥物累積清單** | 同時輸入多種藥物，累計總 OME 後統一換算（複合疼痛管理情境）|
| **情境切換** | 癌症疼痛（NCCN 2026）vs. 非癌症慢性疼痛（CDC 2022），自動切換警示閾值 |
| **高劑量警示** | 癌症：OME > 200 警示；非癌症：≥ 50 注意 / ≥ 90 警示（CDC 2022）|
| **腎功能注意提示** | 每張結果卡片顯示 🫘 腎衰竭風險標籤（危險 / 注意 / 安全，Micromedex 2025）|
| **不完全交叉耐受性減量** | 不減量 / 減 25% / 減 50% 三選項（opioid rotation 標準做法）|
| **Breakthrough Dose** | 自動計算 PRN 搶救劑量（總 OME × 10–20%，含 Morphine / Hydromorphone / Oxycodone 換算）|
| **Fentanyl 貼片規格建議** | 依計算結果自動推薦最近規格（保守 / 積極兩選項）|
| **複製換算摘要** | 一鍵複製純文字換算報告，可直接貼入病歷或交班記錄 |
| **貼片劑量對照表** | 以 Fentanyl 貼片強度為基準，列出所有藥物對應每日劑量（含 Buprenorphine）|
| **各指引換算比例比較** | UpToDate / NCCN 2026 / Reddy 2015 / Duragesic PI 並列比較 |

---

## 支援藥物

| 藥物 | 途徑 | MME 換算因子 | 備注 |
|------|------|------------|------|
| Fentanyl 貼片（TDF）| Transdermal | ÷2（mcg/h → mg OME/day）| UpToDate / NCCN 2026 ÷2 公式 |
| Buprenorphine 貼片（Norspan®）| Transdermal | ×2.5（20 mcg/h = 50 mg OME）| 規格：5 / 10 / 20 mcg/h |
| Fentanyl IV 持續輸注 | IV Infusion | ×7.2（mcg/hr → mg OME/day）| 1 mcg/hr × 24h × 0.3 生體可用率 |
| Morphine | 口服 | ×1（基準）| — |
| Morphine | IV / SC | ×3 | — |
| Hydromorphone | 口服 | ×5 | UpToDate 2026；NCCN 2026 採 ×4，差異 25%（見注意事項）|
| Hydromorphone | IV / SC | ×25 | UpToDate 2026；NCCN 2026 採 ×20 |
| Oxycodone | 口服 | ×1.5 | 全來源一致 |
| Tramadol | 口服 | ×0.1 | 前驅藥（CYP2D6）；最大 400 mg/day |
| Tramadol | IV/IM | ×0.14 ⚠ | **推算值**（oral ×0.1 ÷ bioavailability 0.70）；無主要指引支持，僅供估算 |
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

### Buprenorphine 貼片換算說明

本工具使用 **×2.5 公式**（20 mcg/h = 50 mg OME/day）：

| Norspan® 規格 | OME 等效 |
|-------------|---------|
| 5 mcg/h | 12.5 mg/day |
| 10 mcg/h | 25 mg/day |
| 20 mcg/h | 50 mg/day |

> Buprenorphine 為部分 μ 受體促效劑，高劑量時換算不確定性增加。本工具換算因子適用於低至中劑量（≤ 20 mcg/h）；高劑量或從 full agonist 轉換請諮詢疼痛科。

### Fentanyl IV 持續輸注換算說明

換算因子 **×7.2**（1 mcg/hr 持續輸注 ≈ 7.2 mg OME/day）：

計算依據：1 mcg/hr × 24 hr/day × 0.3（IV fentanyl 對應口服嗎啡等效近似值）= 7.2 mg OME/day

> 此為臨床常用近似值，IV fentanyl 個體間藥代動力學差異大，實際換算需結合鎮靜深度評估（如 CPOT / NRS）。

### 腎功能風險分級（本工具採用）

| 風險等級 | 藥物 | 機制 / 臨床意義 | 來源 |
|---------|------|-------------|------|
| 🔴 **避免**（GFR < 30）| Morphine（口服/IV）| M6G 蓄積 → CNS 抑制加重 | Micromedex 2025 |
| 🔴 **避免**（GFR < 30）| Codeine（口服/IM）| 活性代謝物蓄積 → CNS 毒性 | Micromedex 2025 |
| 🟡 **減量監測**（GFR < 30）| Hydromorphone（口服/IV）| H3G 蓄積 → 肌陣攣、癲癇 | Micromedex 2025 |
| 🟡 **減量監測**（GFR < 30）| Tramadol（口服 / IV/IM）| 代謝物蓄積 → 癲癇閾值降低，需延長給藥間隔 | Micromedex 2025 |
| 🟡 **減量監測**（GFR < 30）| Oxycodone（口服）| 代謝物蓄積 | Micromedex 2025 |
| 🟢 **可選**（腎衰竭）| Fentanyl（貼片/IV）| 無活性代謝物蓄積 | UpToDate 2026 |
| 🟢 **首選**（腎衰竭）| Buprenorphine（貼片）| 非腎臟清除；GFR < 15 仍可使用 | UpToDate 2026 |

### 情境切換閾值說明

| 情境 | 警示等級 | 閾值 | 建議動作 |
|------|---------|------|---------|
| **癌症疼痛**（NCCN 2026）| 🔴 高劑量警示 | OME > 200 mg/day | 疼痛科 / 安寧療護會診 |
| **非癌症慢性疼痛**（CDC 2022）| 🟡 注意 | OME ≥ 50 mg/day | 重新評估治療目標與風險效益 |
| **非癌症慢性疼痛**（CDC 2022）| 🔴 高劑量警示 | OME ≥ 90 mg/day | 強烈建議逐步減量、多模式鎮痛策略 |

### Tramadol 口服 vs IV/IM 換算差異

| 途徑 | 等效劑量（= 30 MME）| 換算因子 | 來源 |
|------|-------------------|---------|------|
| **口服** | 300 mg | ×0.1 | Micromedex 2025 |
| **IV/IM** | ~214 mg（推算）| **×0.14 ⚠ 推算值** | 藥理推算（無主要指引）|

推算依據：Tramadol 口服生體可用率（bioavailability）≈ 70%；IV/IM ≈ 100%。
換算：oral ×0.1 ÷ 0.70 ≈ **×0.143**，取整為 ×0.14。

> **UpToDate 2026、NCCN 2026、Micromedex 2025 均未明確列出 IV/IM Tramadol 的 MME 換算因子。**
> 工具內結果已標記「[推算值]」，僅供估算參考，不作為臨床決策主要依據。

**額外不確定性：CYP2D6 多型性**
Tramadol 需經 CYP2D6 代謝為 O-desmethyltramadol（M1）才具 μ 受體活性。弱代謝者（poor metabolizer）實際鎮痛效果可能大幅低於計算值，使固定 MME 因子的參考價值進一步降低。

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
| v1.4.2 | 2026-05-22 | 新增 Tramadol IV/IM（×0.14，推算值；標記無主要指引支持）|
| v1.4.1 | 2026-05-22 | PWA 支援：manifest.json、Service Worker、OME Calc 圖示（#FD7E14）|
| v1.4.0 | 2026-05-22 | 情境切換（癌症 NCCN 2026 / 非癌症 CDC 2022）；腎功能提示標籤；新增 Buprenorphine 貼片（Norspan®）；新增 Fentanyl IV 持續輸注 |
| v1.3.0 | 2026-05-22 | 多藥物累積清單；Breakthrough dose 計算；複製換算摘要按鈕；跨耐受性三選項（0/25/50%）|
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
