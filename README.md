# Opioid Equianalgesic Dose Converter (鴉片類劑量換算系統)

**English** | [繁體中文](README.zh-TW.md)

**Opioid Equianalgesic Dose Converter (Traditional Chinese edition)**

An opioid MME (morphine milligram equivalent) conversion tool for clinical pharmacists. It supports multi-drug equianalgesic conversion, scenario switching (cancer / non-cancer), renal-risk flags, buprenorphine patches, fentanyl IV infusion, and cross-drug rotation dose reduction. The interface is in Traditional Chinese.

 [![Live Demo](https://img.shields.io/badge/Live%20Demo-Click%20Here-blue?style=for-the-badge)](https://liangrxdev.github.io/opioid-converter-zh/)
---

## Features

| Feature | Description |
|------|------|
| **Dose conversion calculator** | Enter the current dose and instantly get the equivalent OME and converted dose for every supported drug |
| **Multi-drug cumulative list** | Enter several drugs at once; total OME is summed and then converted (combined pain-management scenarios) |
| **Scenario switch** | Cancer pain (NCCN 2026) vs. chronic non-cancer pain (CDC 2022), with warning thresholds switching automatically |
| **High-dose warnings** | Cancer: warning at OME > 200; non-cancer: reassess at MME ≥ 50 (CDC 2022) / high dose at ≥ 90 (CDC 2016 threshold; CDC 2022 sets no hard limit) |
| **Renal caution flags** | Each result card shows a 🫘 renal-failure risk label (avoid / caution / safe, Micromedex 2025) |
| **Incomplete cross-tolerance reduction** | Three options: no reduction / reduce 25% / reduce 50% (standard opioid-rotation practice) |
| **Breakthrough dose** | Automatically computes the PRN rescue dose (total OME × 10–20%, NCCN 2026; MASCC-ASCO 2025 recommends starting at 10–15%), listing morphine / hydromorphone / oxycodone equivalents; prefer the short-acting form of the same agent as the long-acting opioid |
| **Fentanyl patch strength suggestion** | Recommends the nearest patch strength from the result (conservative / aggressive options; a single strength when the target matches; combinations above 100 mcg/h) |
| **Copy conversion summary** | One-click copy of a plain-text conversion report for pasting into notes or handoff records |
| **Patch dose reference table** | Lists each drug's daily dose corresponding to each fentanyl patch strength (including buprenorphine) |
| **Guideline ratio comparison** | Side-by-side comparison of UpToDate / NCCN 2026 / Reddy 2015 / Duragesic PI |

---

## Supported Drugs

| Drug | Route | MME factor | Notes |
|------|------|------------|------|
| Fentanyl patch (TDF) | Transdermal | ÷2 (mcg/h → mg OME/day) | UpToDate / NCCN 2026 ÷2 formula |
| Buprenorphine patch (Norspan®) | Transdermal | ×2.5 (20 mcg/h = 50 mg OME) | Strengths: 5 / 10 / 20 mcg/h; derived from NCCN 2026 "20 mcg/h ≈ TDF 25 mcg/h" × TDF ×2 (NCCN does not state ×2.5 directly) |
| Fentanyl continuous IV infusion | IV infusion | ×2.88 (mcg/hr → mg OME/day) | NCCN 2026 Table 2 note c (steady state); IV → patch 1:1 (PAIN-G 13) |
| Morphine | Oral | ×1 (reference) | — |
| Morphine | IV / SC | ×3 | — |
| Hydromorphone | Oral | ×5 | MASCC-ASCO 2025 consensus 5:1, UpToDate 2026; NCCN 2026 uses ×4, a 25% difference (see notes) |
| Hydromorphone | IV / SC | ×20 | NCCN 2026 Table 2 (1.5 mg IV ≈ 30 mg PO morphine); UpToDate uses ×25; no MASCC-ASCO 2025 consensus ratio |
| Oxycodone | Oral | ×1.5 | Consistent across all sources |
| Tramadol | Oral | ×0.1 | Micromedex 2025; prodrug (CYP2D6); max 400 mg/day. CDC 2022 MME factor 0.2 is used only for non-cancer risk MME |
| Tramadol | IV/IM | ×0.14 ⚠ | **Derived value** (oral ×0.1 ÷ bioavailability 0.70); not supported by any major guideline, estimate only |
| Codeine | Oral | ×0.15 | — |
| Codeine | IM | ×0.23 | IM equianalgesic dose 130 mg ≠ oral 200 mg; routine IM use is no longer recommended clinically |

---

## Important Notes

### Hydromorphone conversion factor discrepancy

| Source | Oral hydromorphone = 30 MME | Factor |
|------|---------------------------|---------|
| **MASCC-ASCO 2025 Table 3** (used by this tool) | 6 mg | ×5 (5:1, 89.1% consensus) |
| UpToDate 2026 | 6 mg | ×5 |
| NCCN 2026 Table 2 | 7.5 mg | ×4 |

| Source | IV/SC hydromorphone = 30 MME | Factor |
|------|---------------------------|---------|
| **NCCN 2026 Table 2** (used by this tool from v1.4.7) | 1.5 mg | ×20 |
| UpToDate 2026 | 1.2 mg | ×25 |
| MASCC-ASCO 2025 | — | no consensus ratio |

Oral uses the international consensus ×5; IV/SC uses NCCN ×20, giving a hydromorphone PO:IV ratio of 4, inside the NCCN PO:IV range of 2.5–5 (×25 gives 5, at the upper limit, and overestimates OME by 25% when converting from IV hydromorphone).

### Fentanyl patch (TDF) conversion ratio

This tool uses the **÷2 formula** (UpToDate Graphic 111216 / NCCN 2026):

| Source | Formula | 200 mg/day PO morphine → TDF |
|------|---------|------------------------------|
| **This tool (UpToDate / NCCN 2026)** | ÷2 | 100 mcg/h |
| Reddy et al. 2015 (recommended for high MEDD) | ÷2.5 | 80 mcg/h |
| Duragesic® PI (most conservative) | ÷3–4 (table lookup by range) | 50 mcg/h |

> UpToDate states: *"Suggested doses for conversion to transdermal fentanyl are LESS CONSERVATIVE than recommendations in the US product labeling."*
> For elderly, opioid-naïve or high-dose (MEDD > 300 mg/day) patients, ÷2.5 (Reddy 2015) is recommended instead.

### Buprenorphine patch conversion

This tool uses the **×2.5 formula** (20 mcg/h = 50 mg OME/day):

| Norspan® strength | OME equivalent |
|-------------|---------|
| 5 mcg/h | 12.5 mg/day |
| 10 mcg/h | 25 mg/day |
| 20 mcg/h | 50 mg/day |

> Buprenorphine is a partial μ-receptor agonist, and conversion uncertainty increases at high doses. This factor applies to low-to-moderate doses (≤ 20 mcg/h); for high doses or switching from a full agonist, consult the pain service.

### Fentanyl continuous IV infusion conversion

Factor **×2.88** (1 mcg/hr continuous infusion ≈ 2.88 mg OME/day; NCCN Adult Cancer Pain v2.2026 Table 2 note c, steady state):

Basis: 1 mcg/hr × 24 h = 24 mcg/day; at steady state 250 mcg IV fentanyl ≈ 10 mg IV morphine ≈ 30 mg PO morphine → 24 × 30/250 = 2.88 mg OME/day (the single-dose 100 mcg ≈ 10 mg ratio does not apply to infusions).

**IV → patch**: when fentanyl IV is the only source, convert 1:1 (mcg/h) per NCCN PAIN-G 13 with no cross-tolerance reduction; halve the basal rate 6 h after patch placement and stop it at 12 h (or stop at 6 h).

> This is a commonly used clinical approximation. IV fentanyl pharmacokinetics vary widely between individuals; actual conversion should be combined with sedation-depth assessment (e.g. CPOT / NRS).

### Renal risk grading (used by this tool)

| Risk level | Drug | Mechanism / clinical significance | Source |
|---------|------|-------------|------|
| 🔴 **Avoid** (GFR < 30) | Morphine (oral/IV) | M6G accumulation → increased CNS depression | Micromedex 2025 |
| 🔴 **Avoid** (GFR < 30) | Codeine (oral/IM) | Active metabolite accumulation → CNS toxicity | Micromedex 2025 |
| 🟡 **Reduce dose and monitor** (GFR < 30) | Hydromorphone (oral/IV) | H3G accumulation → myoclonus, seizures | Micromedex 2025 |
| 🟡 **Reduce dose and monitor** (GFR < 30) | Tramadol (oral / IV/IM) | Metabolite accumulation → lower seizure threshold; extend dosing interval | Micromedex 2025 |
| 🟡 **Reduce dose and monitor** (GFR < 30) | Oxycodone (oral) | Metabolite accumulation | Micromedex 2025 |
| 🟢 **Acceptable** (renal failure) | Fentanyl (patch/IV) | No active metabolite accumulation | UpToDate 2026 |
| 🟢 **Preferred** (renal failure) | Buprenorphine (patch) | Non-renal clearance; usable even at GFR < 15 | UpToDate 2026 |

### Scenario thresholds

| Scenario | Warning level | Threshold | Suggested action |
|------|---------|------|---------|
| **Cancer pain** (NCCN 2026) | 🔴 High-dose warning | OME > 200 mg/day | Pain service / palliative care consult |
| **Chronic non-cancer pain** (CDC 2022) | 🟡 Caution | MME ≥ 50 mg/day (CDC 2022 factors) | Reassess treatment goals and risk–benefit |
| **Chronic non-cancer pain** (CDC 2022) | 🔴 High dose | MME ≥ 90 mg/day (CDC 2022 factors; threshold from CDC 2016) | CDC 2022 sets no hard limit; review the plan, consider gradual tapering (avoid abrupt discontinuation) and multimodal analgesia |

### Tramadol oral vs IV/IM conversion

| Route | Equianalgesic dose (= 30 MME) | Factor | Source |
|------|-------------------|---------|------|
| **Oral** | 300 mg | ×0.1 | Micromedex 2025 |
| **IV/IM** | ~214 mg (derived) | **×0.14 ⚠ derived value** | Pharmacological derivation (no major guideline) |

Basis: tramadol oral bioavailability ≈ 70%; IV/IM ≈ 100%.
Conversion: oral ×0.1 ÷ 0.70 ≈ **×0.143**, rounded to ×0.14.

> **UpToDate 2026, NCCN 2026 and Micromedex 2025 do not explicitly list an MME factor for IV/IM tramadol.**
> Results in the tool are labelled "[derived value]" and are for estimation only, not a primary basis for clinical decisions.

**Additional uncertainty: CYP2D6 polymorphism**
Tramadol must be metabolized by CYP2D6 to O-desmethyltramadol (M1) to have μ-receptor activity. In poor metabolizers the actual analgesic effect may be far below the calculated value, further reducing the reference value of a fixed MME factor.

### Opioid rotation dose-reduction principles

- Pain controlled → **reduce by 25–50%** when switching to a **different opioid** (incomplete cross-tolerance)
- **Same opioid, route change only** (e.g. morphine PO ↔ IV/SC): no reduction. NCCN PAIN-G limits the reduction to cross-tolerance "between different opioids". Applied automatically when all sources are the same molecule (fentanyl excluded)
- MASCC-ASCO 2025 did **not reach consensus** on automatic 25–50% reductions (no clinical experience with the reduced doses; higher withdrawal risk); the tool keeps the 0/25/50% choice to the user
- Pain uncontrolled → start at **100%** of the equianalgesic dose
- Switching to methadone → special case, usually a **75–90%** reduction from the calculated equianalgesic dose (Fine 2009), managed by an experienced pain/palliative specialist (NCCN 2026; MASCC-ASCO 2025 Rec 2.6). Methadone is not supported by this tool; the drug menu and disclaimer say so

---

## Clinical Disclaimer

This tool is **for clinical decision support only**. All conversions are approximations and must not replace clinical judgment. Conversion factors are based on single-dose studies with substantial inter-individual variation; actual doses must be adjusted to the patient's renal function, pain control and individual response. Convert more conservatively at high doses (TDF > 100 mcg/h) or in elderly patients.

---

## Technical Notes

- **Architecture**: pure static HTML, no backend, no data upload; conversion logic lives in `js/calc.js` (pure functions, loaded via `<script>`, also `require`-able from Node)
- **Tests**: `node --test` (zero dependencies; characterization golden regenerated with `node tests/update-golden.js` only for intentional output changes). GitHub Actions runs them on pushes to main and on PRs, in both UTC and Asia/Taipei
- **Full-state comparison**: `node tests/tools/statecmp.js [base-ref] [--ignore <regex>] [--only <fields>] [--show]` checks out the base in a git worktree and compares every scenario's UI state field by field; use it to prove the scope of intentional output changes (the golden only stores hashes)
- **Dependencies**: Bootstrap 5.3.2 (CDN), Noto Sans TC / JetBrains Mono (Google Fonts CDN)
- **Deployment**: GitHub Pages (`main` branch root)

---

## Changelog

| Version | Date | Summary |
|------|------|---------|
| v1.4.11 | 2026-10-30 | Service worker offline error handling (network error instead of undefined for uncached non-document requests, no unhandled rejection when a background update fails, non-GET requests not intercepted); methadone shown as unsupported in the drug menu and disclaimer |
| v1.4.10 | 2026-10-30 | Oral codeine maximum 400 → 360 mg/day (US label, Hikma, revised 12/2025); non-cancer ≥ 90 MME now labelled as the CDC 2016 threshold; no patch-strength recommendation when the fentanyl patch target exceeds 500 mcg/h (more than five 100 mcg/h patches) |
| v1.4.9 | 2026-10-30 | OME source note now counts distinct drugs/routes instead of list entries (two SR + IR entries of one drug used to read "2 drugs"); added GitHub Actions tests and `tests/tools/statecmp.js` |
| v1.4.8 | 2026-10-30 | Breakthrough note now matches the drugs listed and cites MASCC 10–15%; buprenorphine patch ×2.5 now cites its derivation (NCCN 2026); NCCN citations updated to v2.2026 (algorithm and Table 2 unchanged) |
| v1.4.7 | 2026-10-30 | Hydromorphone IV/SC ×25 → ×20 (NCCN 2026 Table 2); oral ×5 now cites the MASCC-ASCO 2025 consensus; same-opioid route changes (morphine / hydromorphone / tramadol / codeine) skip the cross-tolerance reduction (NCCN PAIN-G) |
| v1.4.6 | 2026-10-30 | Cancer scenario: OME > 1000 mg/day is calculated with an ultra-high-dose warning (also in the copied summary); only > 10000 is rejected as a typo guard. Non-cancer keeps rejecting > 1000. Patch combinations above 5 patches are shown as 100×n + r |
| v1.4.5 | 2026-10-29 | Non-cancer scenario adds CDC 2022 risk MME: 50/90 warnings use CDC 2022 factors; drugs not in the CDC table use the tool factors and are flagged; conversions unchanged. Conversion-factor sources separated from CDC |
| v1.4.4 | 2026-10-29 | Patch recommendation: a single strength when the target matches it (±0.05 mcg/h); targets > 100 mcg/h use 100×n + r combinations with their composition shown; the "highest common strength" cap is removed |
| v1.4.3 | 2026-10-29 | Fentanyl IV now uses the NCCN steady-state ratio ×2.88 (was ×7.2); fentanyl IV-only sources convert to patch 1:1 with infusion taper guidance (NCCN PAIN-G 13); js/calc.js extraction and node --test suite (PR #1) |
| v1.4.2 | 2026-05-22 | Added tramadol IV/IM (×0.14, derived; flagged as unsupported by major guidelines) |
| v1.4.1 | 2026-05-22 | PWA support: manifest.json, service worker, OME Calc icon (#FD7E14) |
| v1.4.0 | 2026-05-22 | Scenario switch (cancer NCCN 2026 / non-cancer CDC 2022); renal flags; added buprenorphine patch (Norspan®); added fentanyl continuous IV infusion |
| v1.3.0 | 2026-05-22 | Multi-drug cumulative list; breakthrough dose; copy-summary button; three cross-tolerance options (0/25/50%) |
| v1.2.1 | 2026-05-22 | Fixed codeine IM factor (×0.15→×0.23); fixed Janssen PI label (÷3→÷3–4); added note on hydromorphone source discrepancy; added tramadol support |
| v1.2.0 | — | Fentanyl patch dropdown (replacing free input) to prevent errors; fixed resultPanel initial-display bug |
| v1.1.x | — | Added cross-drug tolerance toggle; high-dose warnings; patch strength suggestion logic |
| v1.0.0 | — | Initial release |

---

## References

1. Broglio K, Portenoy RK. Approximate opioid dose conversions and oral total daily MMEs. **UpToDate** Graphic 111216, Version 16.0. © 2026 UpToDate, Inc.
2. NCCN Clinical Practice Guidelines in Oncology: **Adult Cancer Pain**. Version 1.2026. National Comprehensive Cancer Network, January 23, 2026.
3. Dowell D, et al. CDC Clinical Practice Guideline for Prescribing Opioids. **MMWR** 2022;71(3):1–95.
4. Reddy A, et al. The opioid rotation ratio of strong opioids to transdermal fentanyl in cancer patients. **Cancer** 2016;122(1):149–156.
5. Merative US L.P. Opioid Dose Conversion and Equianalgesic Doses. **Micromedex** Drug Consult. Last Modified: July 1, 2025.

---

## License

Developed by pharmacist **Che-chia Liang (梁哲嘉)** (Taiwan) for clinical pharmacy education and practice support.
