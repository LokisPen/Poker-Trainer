import { G, blinds } from '../game/state.js';

export const newLife = () => ({
  v: 3,
  opt: { four: false, odds: false, speed: 'normal', auto: false, bb: false, sound: false, felt: 'green' },
  tours: [],
  cash: [],
  drills: {},
  acc: {},
  tut: { done: {} },
});
/* LIFE is everything that persists between visits; APP is what only this run of the app holds */
export const LIFE = newLife();
export const APP = { save: null, timer: null };
export const UI = {
  screen: 'home',
  setup: null,
  sheet: null,
  dr: null,
  drFrom: null,
  les: null,
  coach: null,
  msgs: [],
  seen: new Set(),
  betSeen: new Set(),
  raiseTo: 0,
  rkey: '',
  lit: false,
  rng: { tab: 'open', pos: 'BTN', E: 10, b: 3, sE: 10, sb: 3, sel: [], hand: 'AKo', eq: null },
  rep: null,
  resetArm: false,
  cache: {},
};
export const SPEED = { slow: 1000, normal: 620, fast: 300 };
export const $ = (id) => document.getElementById(id);
export const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
export const money = (n) => '$' + Math.round(n).toLocaleString();
export const signed = (n) => (n >= 0 ? '+' : '−') + money(Math.abs(n));
export const chips = (n) =>
  G && G.mode === 'cash' ? '$' + Math.round(n).toLocaleString() : Math.round(n).toLocaleString();
export const pctS = (x) => Math.round(x * 100) + '%';
export const cap = (s) => s.charAt(0).toUpperCase() + s.slice(1);
/* amounts on the felt: chips, or big blinds when that display is on */
export function tchips(n) {
  if (!LIFE.opt.bb || !G) return chips(n);
  const bb = G.hand ? G.hand.bbAmt : blinds().bb,
    v = n / bb;
  return (v >= 100 ? Math.round(v) : v.toFixed(1).replace(/\.0$/, '')) + ' bb';
}
