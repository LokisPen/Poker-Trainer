import { UI } from './state.js';
import { R13 } from '../core/cards.js';
import { G } from '../game/state.js';

/* ================= visuals ================= */
const SU = ['♠', '♥', '♦', '♣'],
  SC = ['s', 'h', 'd', 'c'];
export function cardHTML(c, cls, key, dl, style, anim) {
  if (c == null || c < 0) {
    let a = '';
    if (key && !UI.seen.has(key)) {
      UI.seen.add(key);
      a = ' deal';
    }
    return `<div class="cd back ${cls || ''}${a}" style="--dl:${dl || 0}s;${style || ''}"></div>`;
  }
  let a = '';
  if (key && !UI.seen.has(key)) {
    UI.seen.add(key);
    a = ' ' + (anim || 'deal');
  }
  const r = c >> 2,
    s = c & 3;
  return `<div class="cd ${s === 1 || s === 2 ? 'r' : ''} ${SC[s]} ${cls || ''}${a}" style="--dl:${dl || 0}s;${style || ''}"><span class="rk">${R13[r] === 'T' ? '10' : R13[r]}</span><span class="su">${SU[s]}</span><span class="big">${SU[s]}</span></div>`;
}
export const cardTxt = (c) =>
  `<span class="ct ${SC[c & 3]}">${R13[c >> 2] === 'T' ? '10' : R13[c >> 2]}<span class="st">${SU[c & 3]}</span></span>`;
const DEN_T = [
  [25000, '#3a6ea5', '#244a72'],
  [5000, '#d9622b', '#9a4119'],
  [1000, '#e3b23c', '#a67e22'],
  [500, '#6a3d9a', '#462866'],
  [100, '#2b2420', '#0d0a08'],
  [25, '#2e8b57', '#1d5c39'],
];
const DEN_C = [
  [500, '#6a3d9a', '#462866'],
  [100, '#2b2420', '#0d0a08'],
  [25, '#2e8b57', '#1d5c39'],
  [5, '#b3261e', '#7a1913'],
  [1, '#f1ece0', '#b9b19f'],
];
export function chipsHTML(amt, cash, px, maxCols) {
  const D = (cash ?? (G && G.mode === 'cash')) ? DEN_C : DEN_T;
  let a = amt;
  const cols = [];
  for (const [v, c, e] of D) {
    const n = Math.floor(a / v);
    if (n > 0) {
      cols.push({ n: Math.min(n, 7), c, e });
      a -= n * v;
    }
    if (cols.length >= (maxCols || 3)) break;
  }
  if (!cols.length) {
    const d = D[D.length - 1];
    cols.push({ n: 1, c: d[1], e: d[2] });
  }
  return `<div class="chipstack${px ? ' px' : ''}">${cols.map((col) => `<div class="chipcol" style="height:${(3.3 + col.n * 0.75).toFixed(1)}em">${Array.from({ length: col.n }, (_, k) => `<i class="chip" style="--c:${col.c};--e:${col.e};bottom:${(k * 0.75).toFixed(1)}em"></i>`).join('')}</div>`).join('')}</div>`;
}
const HUES = [6, 24, 44, 152, 174, 204, 262, 318];
export function hueOf(name) {
  let h = 0;
  for (const ch of name) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return HUES[h % HUES.length];
}
