// 零相依 DOM 測試 harness：在 node:vm 中執行 index.html 的 <script>，
// 以最小化的假 DOM 取代瀏覽器，讓 UI 流程（addDrug / calculate / copyResult）可在 node --test 下驗證。
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.join(__dirname, '..', '..');

class FakeElement {
  constructor(id, tag) {
    this.id = id || '';
    this.tagName = (tag || 'div').toUpperCase();
    this.value = '';
    this.style = {};
    this.textContent = '';
    this.placeholder = '';
    this.step = '';
    this.className = '';
    this.dataset = {};
    this.children = [];
    this._innerHTML = '';
    this.classList = { add() {}, remove() {} };
  }
  get innerHTML() { return this._innerHTML; }
  set innerHTML(v) { this._innerHTML = String(v); this.children = []; }
  appendChild(c) { this.children.push(c); return c; }
  addEventListener(type, fn) { (this._listeners ||= {})[type] = fn; }
  scrollIntoView() {}
}

// 由 HTML 取得各 <select> 的初始值（selected 或第一個 option）
function initialSelectValues(html) {
  const out = {};
  const re = /<select id="([^"]+)"[^>]*>([\s\S]*?)<\/select>/g;
  let m;
  while ((m = re.exec(html))) {
    const opts = [...m[2].matchAll(/<option value="([^"]*)"([^>]*)>/g)];
    const sel = opts.find(o => /\bselected\b/.test(o[2])) || opts[0];
    out[m[1]] = sel ? sel[1] : '';
  }
  return out;
}

function staticSelectOptions(html, id) {
  const m = new RegExp(`<select id="${id}"[^>]*>([\\s\\S]*?)<\\/select>`).exec(html);
  return m ? [...m[1].matchAll(/<option value="([^"]*)"[^>]*>([^<]*)<\/option>/g)].map(o => ({ value: o[1], text: o[2] })) : [];
}

function loadApp(opts = {}) {
  const htmlFile = opts.htmlFile || path.join(ROOT, 'index.html');
  const html = fs.readFileSync(htmlFile, 'utf8');
  const els = {};
  const selectInit = initialSelectValues(html);
  const document = {
    getElementById(id) {
      if (!els[id]) {
        els[id] = new FakeElement(id);
        if (id in selectInit) els[id].value = selectInit[id];
      }
      return els[id];
    },
    querySelectorAll() { return []; },
    querySelector(sel) { return document.getElementById('__q__' + sel); },
    createElement(tag) { return new FakeElement('', tag); },
  };
  const clipboard = { last: null, writeText(t) { this.last = t; return Promise.resolve(); } };
  // toLocaleString 依執行環境的時區與 ICU 而異，固定字串讓 golden 跨機器可重現
  const FixedDate = class extends Date {
    constructor(...a) { super(...(a.length ? a : [Date.UTC(2026, 0, 1, 4, 0, 0)])); }
    toLocaleString() { return '2026/1/1 12:00:00'; }
  };
  const sandbox = {
    document,
    navigator: { clipboard },
    window: { addEventListener() {} },
    Date: FixedDate,
    console,
    setTimeout() {},
  };
  sandbox.self = sandbox;
  const ctx = vm.createContext(sandbox);

  const tagRe = /<script(?:\s+src="([^"]+)")?[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = tagRe.exec(html))) {
    const src = m[1];
    if (src) {
      if (/^https?:/.test(src)) continue; // CDN（bootstrap）不載入
      const file = path.join(path.dirname(htmlFile), src);
      vm.runInContext(fs.readFileSync(file, 'utf8'), ctx, { filename: file });
    } else {
      vm.runInContext(m[2], ctx, { filename: htmlFile });
    }
  }

  const run = code => vm.runInContext(code, ctx);
  const el = id => document.getElementById(id);
  return {
    ctx, run, el, html, clipboard,
    select(key) { el('selDrug').value = key; run('onDrugChange()'); },
    add({ key, dose, freq }) {
      if (key !== undefined && el('selDrug').value !== key) this.select(key);
      if (freq !== undefined) el('inpFreq').value = String(freq);
      const drug = run(`DRUGS[${JSON.stringify(key)}]`);
      if (drug && drug.isPatch) el('selPatchDose').value = String(dose);
      else el('inpDose').value = String(dose);
      run('addDrug()');
    },
    drugList() { return JSON.parse(run('JSON.stringify(drugList)')); },
    state() {
      const vis = id => el(id).style.display !== 'none';
      const st = {
        error: vis('errMsg') ? el('errMsg').textContent : null,
        resultVisible: vis('resultPanel'),
        list: this.drugList().map(i => `${i.key}|${i.doseLabel}|${i.ome}`),
        listTotal: el('drugListTotal').textContent,
        listHtml: el('drugListItems').children.map(c => c.innerHTML.replace(/\s+/g, ' ').trim()),
        ome: el('omeValue').textContent,
        omeNote: el('omeNote').textContent,
        crossTolNote: vis('crossTolNote') ? el('crossTolNote').textContent : null,
        grid: el('resultGrid').children.map(c => c.innerHTML.replace(/\s+/g, ' ').trim()),
        patchRec: vis('patchRec') ? el('patchRecText').innerHTML : null,
        highDose: vis('highDoseWarn') ? el('highDoseWarn').innerHTML : null,
        caution: vis('highDoseWarnMedium'),
        bt: el('btContent').innerHTML,
      };
      // 僅在顯示時加入（非癌症 CDC 2022 欄位）：癌症情境的狀態 JSON 與加入前逐位相同
      if (vis('cdcMme') && el('cdcMme').innerHTML) st.cdcMme = el('cdcMme').innerHTML;
      if (vis('highDoseWarnMedium') && el('highDoseWarnMedium').innerHTML) st.cautionText = el('highDoseWarnMedium').innerHTML;
      return st;
    },
    copy() { run('copyResult()'); return clipboard.last; },
  };
}

module.exports = { loadApp, staticSelectOptions, FakeElement, ROOT };
