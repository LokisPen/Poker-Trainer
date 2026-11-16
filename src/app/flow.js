import { render } from './router.js';
import { sfx, sfxLast } from './sound.js';
import { APP, LIFE, SPEED, UI } from './state.js';
import { store } from './storage.js';
import { tutPump } from './tutor.js';
import { analysis, sessNet } from './views/table.js';
import { clone, pick } from '../core/cards.js';
import { botDecide } from '../game/bots.js';
import { gradeOf } from '../game/coach.js';
import { act, legal, startHand } from '../game/engine.js';
import { cashAfterHand, tourAfterHand } from '../game/session.js';
import { G, STYLE_MIX, activeSeats, makeCash, makeTour, newBot, setG } from '../game/state.js';

/* ================= game flow ================= */
export function startGame(c) {
  clearTimeout(APP.timer);
  UI.seen = new Set();
  UI.betSeen = new Set();
  UI.coach = null;
  UI.msgs = [];
  UI.needRebuy = false;
  UI.cache = {};
  UI.sheet = null;
  if (c.kind === 'cash') makeCash(c);
  else makeTour(c);
  G.tally = { Solid: 0, Close: 0, Leak: 0 };
  G.leaks = [];
  UI.screen = 'game';
  startHand();
  sfx('card');
  pump();
}
export function pump() {
  clearTimeout(APP.timer);
  if (UI.screen !== 'game' || !G) return;
  if (G.tut) {
    tutPump();
    return;
  }
  const H = G.hand;
  if (!H) {
    render();
    return;
  }
  if (H.done) {
    onHandDone();
    render();
    return;
  }
  if (H.toAct === 0) {
    render();
    return;
  }
  render();
  const p = G.seats[0];
  const out = !H.order.includes(0) || p.folded || p.allin;
  APP.timer = setTimeout(
    () => {
      if (UI.screen !== 'game' || G.hand !== H || H.done) return;
      act(H.toAct, botDecide(H.toAct));
      sfxLast();
      pump();
    },
    out ? Math.min(SPEED[LIFE.opt.speed], 380) : SPEED[LIFE.opt.speed],
  );
}
function onHandDone() {
  const H = G.hand;
  if (H.tallied) return;
  H.tallied = true;
  for (const g of H.grades) {
    G.tally[g.g]++;
    const a = (LIFE.acc[g.kind] = LIFE.acc[g.kind] || { n: 0, Solid: 0, Close: 0, Leak: 0 });
    a.n++;
    a[g.g]++;
    if (g.g === 'Leak') {
      G.leaks.unshift({ no: G.handNo, kind: g.kind, text: g.text, best: g.best, act: g.act });
      if (G.leaks.length > 12) G.leaks.pop();
    }
  }
  if (G.mode === 'cash') {
    G.session.peak = Math.max(G.session.peak, sessNet());
    G.session.low = Math.min(G.session.low, sessNet());
  }
  store.set('pt3:life', LIFE);
  saveGame();
  if (LIFE.opt.auto && (!H.order.includes(0) || G.seats[0].folded) && !UI.sheet) {
    APP.timer = setTimeout(() => {
      if (UI.screen === 'game' && G.hand === H && !UI.sheet) nextHand();
    }, 1500);
  }
}
export function saveGame() {
  if (G && G.tut) return;
  if (!G || G.over) {
    store.del('pt3:save');
    APP.save = null;
    return;
  }
  const u = G.undo;
  G.undo = null;
  APP.save = { G: clone(G) };
  G.undo = u;
  while (JSON.stringify(APP.save).length > 230000 && APP.save.G.records.length > 10) APP.save.G.records.length -= 10; // one saved document holds at most 256 KB
  store.set('pt3:save', APP.save);
}
export function nextHand() {
  clearTimeout(APP.timer);
  UI.coach = null;
  UI.cache = {};
  if (G.mode === 'tour') {
    UI.msgs = tourAfterHand();
    if (G.over) {
      finishTour();
      return;
    }
  } else {
    UI.msgs = cashAfterHand();
    if (G.seats[0].stack <= 0) {
      UI.needRebuy = true;
      G.hand = null;
      render();
      return;
    }
    if (activeSeats().length < 2) {
      const used = new Set(G.seats.filter(Boolean).map((p) => p.name));
      for (let i = 1; i < 9; i++)
        if (!G.seats[i]) {
          G.seats[i] = newBot(pick(STYLE_MIX.cash[G.cfg.diff]), 300, used);
          break;
        }
    }
  }
  G.undo = null;
  startHand();
  if (UI.seen.size > 500) {
    UI.seen = new Set();
    UI.betSeen = new Set();
  }
  sfx('card');
  pump();
}
export function heroAct(t) {
  const H = G.hand;
  if (!H || H.done || H.toAct !== 0) return;
  const L = legal(0);
  let a;
  if (t === 'raise') {
    if (!L.canRaise) return;
    a = { t: 'raise', to: UI.raiseTo };
  } else if (t === 'call') a = { t: L.check ? 'check' : 'call' };
  else {
    if (L.check) return;
    a = { t: 'fold' };
  }
  const prev = G.undo;
  G.undo = null;
  const snap = JSON.stringify(G);
  G.undo = prev;
  const an = analysis();
  const choice = a.t === 'raise' ? (L.check && H.curBet === 0 ? 'bet' : 'raise') : a.t;
  const g = gradeOf(choice, an);
  H.grades.push({
    g,
    kind: an.kind,
    act: choice,
    best: an.best,
    street: H.street,
    ev: H.events.length,
    text: an.lines.join(' '),
  });
  G.undo = snap;
  UI.coach = { mode: 'grade', g, an, choice };
  act(0, a);
  sfxLast();
  pump();
}
export function doUndo() {
  if (!G.undo) return;
  clearTimeout(APP.timer);
  setG(JSON.parse(G.undo));
  G.undo = null;
  UI.coach = null;
  UI.cache = {};
  UI.rkey = '';
  UI.sheet = null;
  UI.screen = 'game';
  pump();
}
export function skipHand() {
  clearTimeout(APP.timer);
  const H = G.hand;
  let guard = 0;
  while (!H.done && H.toAct !== 0 && guard++ < 300) act(H.toAct, botDecide(H.toAct));
  sfxLast();
  pump();
}
function finishTour() {
  const c = G.cfg;
  LIFE.tours.unshift({
    kind: c.kind,
    players: c.players,
    seats: c.seats,
    buyin: c.buyin,
    place: G.heroPlace,
    prize: G.heroPrize,
    d: Date.now(),
    tally: G.tally,
  });
  if (LIFE.tours.length > 200) LIFE.tours.pop();
  store.set('pt3:life', LIFE);
  store.del('pt3:save');
  APP.save = null;
  UI.sheet = null;
  UI.screen = 'result';
  if (G.heroPrize) sfx('win');
  render();
  window.scrollTo(0, 0);
}
export function leaveCash() {
  clearTimeout(APP.timer);
  const S = G.session;
  const net = sessNet();
  if (G.hand && (G.hand.done || G.seats[0].folded)) S.hands++;
  LIFE.cash.unshift({ hands: S.hands, net, invested: S.invested, rake: S.rake, d: Date.now(), tally: G.tally });
  if (LIFE.cash.length > 200) LIFE.cash.pop();
  store.set('pt3:life', LIFE);
  store.del('pt3:save');
  APP.save = null;
  G.over = true;
  UI.needRebuy = false;
  UI.sheet = null;
  UI.screen = 'cashout';
  render();
  window.scrollTo(0, 0);
}
