import { UI, pctS } from '../state.js';
import { gridHTML, setPct } from './grid.js';
import { CI, COMBOS, ORDER, comboN, eqVs, eval7, rnd, startPct } from '../../core/cards.js';
import { pctTxt } from '../../game/coach.js';
import { DPOS9, eqPushRange, pushRangeSet } from '../../game/drills.js';
import { OPEN } from '../../game/state.js';

/* ================= ranges ================= */
export function rangesHTML() {
  const R = UI.rng;
  const tabs = [
    ['open', 'Opening'],
    ['push', 'Push/fold'],
    ['call', 'Call a shove'],
    ['build', 'Build'],
  ];
  let body = '';
  if (R.tab === 'open') {
    const p = OPEN[R.pos];
    const test = (ci) => (startPct(ci) < p ? 'in' : '');
    body = `<div class="seg">${['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB'].map((x) => `<button class="${R.pos === x ? 'on' : ''}" data-act="rset" data-k="pos" data-v="${x}">${x}</button>`).join('')}</div>
    ${gridHTML(test)}<p><b>${pctS(setPct(test) / 1326)}</b> of hands from the ${R.pos} at a 9-handed table when nobody has entered the pot. Raise these and fold the rest.</p><p class="muted">In a live $1/$3 game you can open a bit wider from the button and cutoff, because the players behind you call too much and fold too little.</p>`;
  } else if (R.tab === 'push') {
    const set = pushRangeSet(R.E, R.b);
    const test = (ci) => (set.has(ci) ? 'in' : '');
    body = `<div class="field"><label for="rngE">Stack: ${R.E} big blinds</label><input id="rngE" type="range" min="3" max="20" step="1" value="${R.E}" data-rk="E"></div>
    <div class="seg">${DPOS9.map((x, k) => `<button class="${R.b === 8 - k ? 'on' : ''}" data-act="rset" data-k="b" data-v="${8 - k}">${x}</button>`).join('')}</div>
    ${gridHTML(test)}<p>Shove <b>${pctS(setPct(test) / 1326)}</b> of hands from the ${DPOS9[8 - R.b]} with ${R.E} bb when it folds to you (1 bb ante).</p><p class="muted">A simplified equilibrium model: opponents call with hands that beat your shoving range. Near the money, tighten up.</p>`;
  } else if (R.tab === 'call') {
    const pS = eqPushRange(R.sE, R.sb);
    const need = (R.sE - 1) / (2.5 + 2 * R.sE - 1);
    const test = (ci) => (eqVs(ci, pS) >= need ? 'in' : '');
    body = `<div class="field"><label for="rngS">Their stack: ${R.sE} big blinds</label><input id="rngS" type="range" min="3" max="25" step="1" value="${R.sE}" data-rk="sE"></div>
    <div class="seg">${DPOS9.slice(3)
      .map(
        (x, k) =>
          `<button class="${R.sb === 5 - k ? 'on' : ''}" data-act="rset" data-k="sb" data-v="${5 - k}">${x} shoves</button>`,
      )
      .join('')}</div>
    ${gridHTML(test)}<p>From the big blind, call with <b>${pctS(setPct(test) / 1326)}</b> of hands. They shove about the ${pctTxt(pS)}; you need ${pctS(need)} equity to call.</p>`;
  } else {
    const sel = new Set(R.sel);
    const test = (ci) => (sel.has(ci) ? 'in' : '');
    const f = setPct(test);
    if (R.eq == null && sel.size) {
      R.eq = equityVsClasses(R.hand, R.sel);
    }
    body = `<p class="muted">Tap hands to add or remove them, or start from a preset.</p>
    <div class="presets" style="flex-wrap:wrap">${[0.05, 0.1, 0.2, 0.35, 0.5].map((x) => `<button data-act="rpre" data-v="${x}">Top ${x * 100}%</button>`).join('')}<button data-act="rpre" data-v="0">Clear</button></div>
    ${gridHTML(test, true, R.hand)}<p><b>${pctS(f / 1326)}</b> of hands, ${f} combinations.</p>
    <div class="field"><label for="rngH">Equity of my hand against this range</label><select id="rngH" data-rk="hand">${ORDER.slice()
      .sort()
      .map((n) => `<option ${n === R.hand ? 'selected' : ''}>${n}</option>`)
      .join('')}</select>
    <p>${sel.size ? `<b>${R.hand}</b> has about <b>${pctS(R.eq)}</b> equity all-in preflop against this range.` : 'Pick some hands to see equity.'}</p></div>`;
  }
  return `<div class="screen"><div class="top"><button class="link" data-act="goto" data-s="home">‹ Lobby</button></div><h2>Range charts</h2>
  <div class="seg" style="margin:10px 0 14px">${tabs.map(([k, t]) => `<button class="${R.tab === k ? 'on' : ''}" data-act="rset" data-k="tab" data-v="${k}">${t}</button>`).join('')}</div>${body}
  <div class="legend"><span><i style="background:var(--felt)"></i>Play</span><span><i style="background:var(--ink2)"></i>Fold</span>${R.tab === 'build' ? '<span><i style="outline:2px solid var(--neon)"></i>Your hand</span>' : ''}</div></div>`;
}
function equityVsClasses(hn, sel) {
  const combos = [];
  let off = 0;
  const offs = [];
  ORDER.forEach((n, i) => {
    offs[i] = off;
    off += comboN(n);
  });
  for (const ci of sel) {
    for (let k = 0; k < comboN(ORDER[ci]); k++) combos.push(COMBOS[offs[CI[ORDER[ci]]] + k]);
  }
  const mine = COMBOS.slice(offs[CI[hn]], offs[CI[hn]] + comboN(hn));
  let w = 0,
    t = 0;
  for (let it = 0; it < 2500; it++) {
    const h = mine[it % mine.length];
    const v = combos[rnd(combos.length)];
    if (v[0] === h[0] || v[0] === h[1] || v[1] === h[0] || v[1] === h[1]) continue;
    const used = new Set([...h, ...v]);
    const bd = [];
    while (bd.length < 5) {
      const c = rnd(52);
      if (!used.has(c)) {
        used.add(c);
        bd.push(c);
      }
    }
    const x = eval7([...h, ...bd]),
      y = eval7([...v, ...bd]);
    w += x > y ? 1 : x === y ? 0.5 : 0;
    t++;
  }
  return t ? w / t : 0;
}
