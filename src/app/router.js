import { pump } from './flow.js';
import { $, APP, LIFE, UI } from './state.js';
import { drillHTML, drillsHTML } from './views/drills.js';
import { historyHTML, replayHTML } from './views/history.js';
import { glossaryHTML, learnHTML, lessonHTML } from './views/learn.js';
import { homeHTML } from './views/lobby.js';
import { rangesHTML } from './views/ranges.js';
import { cashoutHTML, resultHTML } from './views/results.js';
import { setupHTML } from './views/setup.js';
import { sheetHTML } from './views/sheets.js';
import { settingsHTML, statsHTML } from './views/stats.js';
import { gameHTML } from './views/table.js';

/* ================= router ================= */
const FKEYS = ['act', 't', 'k', 'v', 'i', 's', 'key', 'd', 'ci', 'x'];
export function focusSel(el, app) {
  if (!el || el === app || !app.contains(el)) return null;
  if (el.id) return '#' + CSS.escape(el.id);
  let sel = '';
  for (const k of FKEYS) {
    const v = el.dataset && el.dataset[k];
    if (v != null) sel += '[data-' + k + '="' + v.replace(/["\\]/g, '\\$&') + '"]';
  }
  return sel || null;
}
export function refocus(sel) {
  if (!sel) return;
  try {
    const n = $('app').querySelector(sel);
    if (n) n.focus({ preventScroll: true });
  } catch (e) {}
}
export function render() {
  const app = $('app'),
    s = UI.screen,
    fresh = !!UI.sheetNew;
  let h = '';
  if (s === 'home') h = homeHTML();
  else if (s === 'setup') h = setupHTML();
  else if (s === 'game') h = gameHTML();
  else if (s === 'result') h = resultHTML();
  else if (s === 'cashout') h = cashoutHTML();
  else if (s === 'history') h = historyHTML();
  else if (s === 'replay') h = replayHTML();
  else if (s === 'drills') h = drillsHTML();
  else if (s === 'drill') h = drillHTML();
  else if (s === 'ranges') h = rangesHTML();
  else if (s === 'stats') h = statsHTML();
  else if (s === 'settings') h = settingsHTML();
  else if (s === 'learn') h = learnHTML();
  else if (s === 'lesson') h = lessonHTML();
  else if (s === 'glossary') h = glossaryHTML();
  if (UI.sheet && s === 'game') h += sheetHTML();
  const fsel = focusSel(document.activeElement, app),
    old = app.querySelector('.sheet'),
    st = old ? old.scrollTop : 0;
  app.className = 'app' + (s === 'game' ? ' play' : '') + (LIFE.opt.four ? ' four' : '');
  app.dataset.felt = LIFE.opt.felt || 'green';
  app.innerHTML = h;
  UI.sheetNew = false;
  const sh = app.querySelector('.sheet');
  if (sh && fresh) {
    const c = sh.querySelector('[data-x]');
    if (c) c.focus({ preventScroll: true });
  } else {
    if (sh && st) sh.scrollTop = st;
    refocus(fsel);
  }
}
export function go(s) {
  clearTimeout(APP.timer);
  UI.screen = s;
  UI.sheet = null;
  UI.resetArm = false;
  if (s === 'game') pump();
  else render();
  window.scrollTo(0, 0);
}
