// Characterization 情境：涵蓋全部藥物 × 劑量（含極端值）× 交叉耐受 × 情境，以及多藥/移除/複製流程。
'use strict';
const crypto = require('node:crypto');

const ORAL_LIKE = [
  'morphine_oral', 'morphine_iv_sc', 'hydromorphone_oral', 'hydromorphone_iv_sc',
  'oxycodone_oral', 'tramadol_oral', 'tramadol_iv', 'codeine_oral', 'codeine_im',
];
const DOSES = [0.01, 0.04, 0.5, 1, 2.5, 7.5, 10, 15.55, 30, 33.3333, 100, 333.333, 1000, 0, -5, '', 'abc', '1e400', 10000];
const FENT_PATCH = [12, 25, 37, 37.5, 50, 62, 62.5, 75, 87, 87.5, 100, 125, 150];
const BUP_PATCH = [5, 10, 20];
const IV_RATES = [0.1, 1, 12.5, 25, 100, 138.9, 139, 0, -1, ''];

function scenarios() {
  const out = [];
  const push = (name, steps, settings = {}) => out.push({ name, steps, settings });

  for (const key of ORAL_LIKE) {
    for (const dose of DOSES) push(`${key} ${dose}×1`, [{ key, dose, freq: 1 }]);
    push(`${key} 5×4`, [{ key, dose: 5, freq: 4 }]);
    push(`${key} 2.5×6`, [{ key, dose: 2.5, freq: 6 }]);
  }
  for (const dose of FENT_PATCH) push(`fentanyl_patch ${dose}`, [{ key: 'fentanyl_patch', dose }]);
  push('fentanyl_patch blank', [{ key: 'fentanyl_patch', dose: '' }]);
  for (const dose of BUP_PATCH) push(`buprenorphine_td ${dose}`, [{ key: 'buprenorphine_td', dose }]);
  for (const dose of IV_RATES) push(`fentanyl_iv ${dose}`, [{ key: 'fentanyl_iv', dose }]);

  // 交叉耐受 × 情境
  for (const crossTol of ['0', '25', '50']) {
    for (const context of ['cancer', 'noncancer']) {
      for (const [key, dose] of [['morphine_oral', 30], ['morphine_oral', 60], ['oxycodone_oral', 40], ['fentanyl_patch', 50], ['hydromorphone_iv_sc', 4], ['morphine_oral', 250]]) {
        push(`${key} ${dose} tol${crossTol} ${context}`, [{ key, dose, freq: 1 }], { crossTol, context });
      }
    }
  }

  // 多藥
  push('multi morphine+oxy', [{ key: 'morphine_oral', dose: 30, freq: 2 }, { key: 'oxycodone_oral', dose: 10, freq: 4 }]);
  push('multi patch+morphine', [{ key: 'fentanyl_patch', dose: 25 }, { key: 'morphine_oral', dose: 10, freq: 6 }]);
  push('multi same drug twice', [{ key: 'morphine_oral', dose: 30, freq: 2 }, { key: 'morphine_oral', dose: 10, freq: 1 }]);
  push('multi same patch twice', [{ key: 'fentanyl_patch', dose: 50 }, { key: 'fentanyl_patch', dose: 25 }]);
  push('multi total >1000', [{ key: 'morphine_oral', dose: 900, freq: 1 }, { key: 'morphine_oral', dose: 200, freq: 1 }]);
  push('multi then remove', [{ key: 'morphine_oral', dose: 30, freq: 1 }, { key: 'oxycodone_oral', dose: 20, freq: 1 }, { remove: 0 }]);
  push('remove last', [{ key: 'morphine_oral', dose: 30, freq: 1 }, { remove: 0 }]);
  push('switch drug keeps dose', [{ type: { key: 'morphine_oral', dose: 25 } }, { select: 'fentanyl_iv' }, { addOnly: true }]);
  push('switch oral to oral keeps dose', [{ type: { key: 'morphine_oral', dose: 10 } }, { select: 'oxycodone_oral' }, { addOnly: true }]);
  push('no drug selected', [{ addOnly: true }]);
  return out;
}

function runScenario(loadApp, sc) {
  const app = loadApp();
  if (sc.settings.crossTol) app.el('crossTolSelect').value = sc.settings.crossTol;
  if (sc.settings.context) app.el('clinicContext').value = sc.settings.context;
  for (const st of sc.steps) {
    if (st.remove !== undefined) app.run(`removeDrug(${st.remove})`);
    else if (st.type) { app.select(st.type.key); app.el('inpDose').value = String(st.type.dose); }
    else if (st.select) app.select(st.select);
    else if (st.addOnly) app.run('addDrug()');
    else app.add(st);
  }
  const state = app.state();
  state.copy = app.drugList().length ? app.copy() : null;
  return state;
}

// golden 以可讀摘要 + 全狀態 sha256 保存：hash 保證逐位相同，摘要便於 diff 時定位
function digest(state) {
  const doses = state.grid.map(h => (/<div class="drug-dose">([^<]*)<\/div>/.exec(h) || [])[1]);
  return {
    error: state.error,
    resultVisible: state.resultVisible,
    list: state.list,
    ome: state.ome,
    doses: doses.join(' '),
    patchRec: state.patchRec,
    sha256: crypto.createHash('sha256').update(JSON.stringify(state)).digest('hex'),
  };
}

module.exports = { scenarios, runScenario, digest };
