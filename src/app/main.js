import { doUndo, heroAct, leaveCash, nextHand, pump, saveGame, skipHand, startGame } from './flow.js';
import { focusSel, go, refocus, render } from './router.js';
import { sfx, sfxInit } from './sound.js';
import { $, APP, LIFE, UI, money, newLife } from './state.js';
import { PEND, bootDone, store } from './storage.js';
import { markDone, openItem, startGuided, tutHero, tutNext } from './tutor.js';
import { answerDrill, newDrill } from './views/drills.js';
import { SETUPS } from './views/setup.js';
import { raiseLabel } from './views/table.js';
import { clamp, clone, startPct } from '../core/cards.js';
import { startHand } from '../game/engine.js';
import { G, setG, setPID } from '../game/state.js';
import { itemAfter, itemByKey } from '../tutorial/course.js';

/* ================= events ================= */
const ACT = {
  goto: (d) => go(d.s),
  setup: (d) => {
    UI.setup = { k: d.k, c: Object.assign({}, SETUPS[d.k].def) };
    UI.screen = 'setup';
    render();
    window.scrollTo(0, 0);
  },
  opt: (d) => {
    UI.setup.c[d.key] = JSON.parse(d.v);
    render();
  },
  start: () => {
    const c = Object.assign({}, UI.setup.c);
    if (c.kind === 'sng') c.players = c.seats;
    if (c.kind === 'sat') c.seatsWon = c.players === 18 ? 4 : 2;
    startGame(c);
    window.scrollTo(0, 0);
  },
  again: () => {
    const c = Object.assign({}, G.cfg);
    if (G.mode === 'cash') c.kind = 'cash';
    startGame(c);
    window.scrollTo(0, 0);
  },
  resume: () => {
    setG(clone(APP.save.G));
    setPID(1 + Math.max(0, ...G.seats.filter(Boolean).map((p) => p.id), ...G.pool.map((p) => p.id)));
    UI.screen = 'game';
    UI.coach = null;
    UI.sheet = null;
    UI.msgs = [];
    UI.seen = new Set();
    UI.betSeen = new Set();
    UI.cache = {};
    UI.needRebuy = false;
    if (!G.tally) G.tally = { Solid: 0, Close: 0, Leak: 0 };
    if (!G.leaks) G.leaks = [];
    if (G.mode === 'cash' && G.seats[0].stack <= 0 && (!G.hand || G.hand.done)) {
      UI.needRebuy = true;
      G.hand = null;
      render();
      return;
    }
    if (!G.hand || G.hand.done) nextHand();
    else pump();
  },
  menu: () => {
    clearTimeout(APP.timer);
    if (G && G.tut) {
      openItem(null);
      return;
    }
    if (G && !G.over) saveGame();
    UI.screen = 'home';
    UI.sheet = null;
    render();
    window.scrollTo(0, 0);
  },
  hero: (d) => heroAct(d.t),
  size: (d) => {
    UI.raiseTo = +d.v;
    const s = $('slider');
    if (s) s.value = UI.raiseTo;
    const b = $('rz');
    if (b) b.innerHTML = raiseLabel(UI.raiseTo);
  },
  ask: () => {
    UI.opener = focusSel(document.activeElement, appEl);
    UI.sheet = { t: 'ask' };
    UI.sheetNew = true;
    render();
  },
  sheet: (d) => {
    if (d.t === 'coach' && !UI.coach) return;
    UI.opener = focusSel(document.activeElement, appEl);
    UI.sheet = { t: d.t, i: d.i != null ? +d.i : null };
    UI.sheetNew = true;
    render();
  },
  closesheet: (d, e) => {
    if (e && e.target.closest('.sheet') && !d.x) return;
    const op = UI.opener;
    UI.opener = null;
    UI.sheet = null;
    render();
    refocus(op);
    const H = G && G.hand;
    if (UI.screen === 'game' && H && H.done && LIFE.opt.auto && (!H.order.includes(0) || G.seats[0].folded)) {
      clearTimeout(APP.timer);
      APP.timer = setTimeout(() => {
        if (UI.screen === 'game' && G.hand === H && !UI.sheet) nextHand();
      }, 1200);
    }
  },
  undo: () => doUndo(),
  next: () => nextHand(),
  skip: () => skipHand(),
  topup: () => {
    const p = G.seats[0];
    const add = 500 - p.stack;
    if (add > 0) {
      p.stack += add;
      G.session.invested += add;
      UI.msgs = ['You top up to $500.'];
      saveGame();
    }
    render();
  },
  rebuy: () => {
    const p = G.seats[0];
    p.stack = G.cfg.buyin;
    G.session.invested += G.cfg.buyin;
    UI.needRebuy = false;
    UI.msgs = ['You rebuy for ' + money(G.cfg.buyin) + '.'];
    G.undo = null;
    startHand();
    pump();
  },
  leave: () => leaveCash(),
  replay: (d) => {
    if (+d.i < 0) return;
    UI.rep = { i: +d.i, f: 0 };
    UI.screen = 'replay';
    render();
    window.scrollTo(0, 0);
  },
  rep: (d) => {
    const r = G.records[UI.rep.i];
    UI.rep.f = clamp(UI.rep.f + +d.d, 0, r.events.length);
    render();
  },
  drill: (d) => {
    if (UI.screen !== 'drill') UI.drFrom = d.from || null;
    newDrill(d.t);
    window.scrollTo(0, 0);
  },
  dans: (d) => answerDrill(d.v),
  rset: (d) => {
    const R = UI.rng;
    R[d.k] = isNaN(+d.v) ? d.v : +d.v;
    render();
  },
  rpre: (d) => {
    const p = +d.v;
    UI.rng.sel = [];
    for (let k = 0; k < 169; k++) if (startPct(k) < p) UI.rng.sel.push(k);
    UI.rng.eq = null;
    render();
  },
  cell: (d) => {
    const ci = +d.ci,
      R = UI.rng;
    const i = R.sel.indexOf(ci);
    if (i >= 0) R.sel.splice(i, 1);
    else R.sel.push(ci);
    R.eq = null;
    render();
  },
  setopt: (d) => {
    LIFE.opt[d.k] = JSON.parse(d.v);
    store.set('pt3:life', LIFE);
    if (d.k === 'sound') {
      sfxInit();
      setTimeout(() => sfx('chip'), 60);
    }
    render();
  },
  reset: () => {
    if (!UI.resetArm) {
      UI.resetArm = true;
      render();
      return;
    }
    UI.resetArm = false;
    Object.assign(LIFE, newLife(), { opt: LIFE.opt, tut: LIFE.tut });
    store.set('pt3:life', LIFE);
    render();
  },
  item: (d) => openItem(itemByKey(d.key)),
  quiz: (d) => {
    const q = UI.les.q;
    if (q[d.i] != null) return;
    q[d.i] = +d.v;
    render();
  },
  lesdone: () => {
    const key = 'lesson:' + UI.les.id;
    markDone(key);
    openItem(itemAfter(key));
  },
  guided: (d) => startGuided(d.id),
  tutnext: () => tutNext(),
  tuthero: () => tutHero(),
  tutdone: () => openItem(itemAfter('hand:' + G.tut.id)),
  firstgame: () => {
    markDone('lesson:play');
    LIFE.opt.odds = true;
    store.set('pt3:life', LIFE);
    startGame({ kind: 'sng', players: 6, seats: 6, buyin: 10, turbo: false, depth: 100, diff: 'easy' });
    window.scrollTo(0, 0);
  },
  noop: () => {},
};
const appEl = $('app');
appEl.addEventListener('click', (e) => {
  sfxInit();
  const b = e.target.closest('[data-act]');
  if (!b || b.disabled) return;
  const f = ACT[b.dataset.act];
  if (f) f(b.dataset, e);
});
appEl.addEventListener('keydown', (e) => {
  if ((e.key === 'Enter' || e.key === ' ') && e.target.matches && e.target.matches('[role=button][data-act]')) {
    e.preventDefault();
    const f = ACT[e.target.dataset.act];
    if (f) f(e.target.dataset, e);
  }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && UI.sheet && UI.screen === 'game') {
    e.preventDefault();
    ACT.closesheet({ x: 1 });
  }
});
appEl.addEventListener('input', (e) => {
  if (e.target.id === 'slider') {
    UI.raiseTo = +e.target.value;
    const b = $('rz');
    if (b) b.innerHTML = raiseLabel(UI.raiseTo);
    return;
  }
  const k = e.target.dataset && e.target.dataset.rk;
  if (k && e.target.type === 'range') {
    UI.rng[k] = +e.target.value;
    const lbl = e.target.previousElementSibling;
    if (lbl) lbl.textContent = (k === 'E' ? 'Stack: ' : 'Their stack: ') + e.target.value + ' big blinds';
  }
});
appEl.addEventListener('change', (e) => {
  const k = e.target.dataset && e.target.dataset.rk;
  if (!k) return;
  if (k === 'hand') {
    UI.rng.hand = e.target.value;
    UI.rng.eq = null;
  } else UI.rng[k] = +e.target.value;
  render();
});

/* offline play: sw.js keeps a copy of the app. Only where service workers exist and the page is served securely.
   Inside a sandboxed frame even asking for the service worker can throw, and the app must still start. */
try {
  if ('serviceWorker' in navigator && (location.protocol === 'https:' || location.hostname === 'localhost'))
    navigator.serviceWorker.register('./sw.js').catch(() => {});
} catch (e) {}

(async () => {
  render();
  const l = await store.get('pt3:life');
  if (l) {
    delete PEND['pt3:life'];
    Object.assign(LIFE, newLife(), l, {
      opt: Object.assign(newLife().opt, l.opt || {}),
      tut: Object.assign(newLife().tut, l.tut || {}),
    });
  }
  const s = await store.get('pt3:save');
  if (s && s.G && !s.G.over) APP.save = s;
  bootDone();
  if (UI.screen === 'home') render();
})();
