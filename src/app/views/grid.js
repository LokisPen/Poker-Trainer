import { CI, ORDER, R13, comboN } from '../../core/cards.js';

/* ================= range grid ================= */
function cellName(i, j) {
  const ra = 12 - i,
    rb = 12 - j;
  if (i === j) return R13[ra] + R13[ra];
  if (j > i) return R13[ra] + R13[rb] + 's';
  return R13[rb] + R13[ra] + 'o';
}
export function gridHTML(test, clickable, mark) {
  let h = '<div class="grid">';
  for (let i = 0; i < 13; i++)
    for (let j = 0; j < 13; j++) {
      const n = cellName(i, j),
        ci = CI[n];
      const t = test(ci) || '';
      h += `<div class="${t} ${i === j ? 'p' : j > i ? 's' : 'o'}${mark === n ? ' me' : ''}"${clickable ? ` data-act="cell" data-ci="${ci}" role="button"` : ''}>${n}</div>`;
    }
  return h + '</div>';
}
export function setPct(test) {
  let f = 0;
  for (let k = 0; k < 169; k++) if (test(k) === 'in') f += comboN(ORDER[k]);
  return f;
}
