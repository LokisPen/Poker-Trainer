import { clamp, eval7, handName, newDeck, pushPct, shuffle } from '../core/cards.js';
import { G, activeSeats, blinds, nextOcc, openPct, posLabel, posName, unit } from './state.js';

/* ================= hand engine ================= */
export function startHand() {
  const H = {};
  G.hand = H;
  G.handNo++;
  G.undo = null;
  const { sb, bb, ante } = blinds();
  Object.assign(H, { sbAmt: sb, bbAmt: bb, ante });
  G.button = nextOcc(G.button);
  const act = activeSeats();
  // order from button clockwise
  const order = [];
  let s = G.button;
  for (let k = 0; k < act.length; k++) {
    order.push(s);
    s = nextOcc(s);
  }
  H.order = order;
  H.deck = G.rig ? riggedDeck(G.rig, order) : newDeck();
  H.board = [];
  H.street = 0;
  H.events = [];
  H.done = false;
  H.raises = 0;
  H.lastAgg = -1;
  H.preAgg = -1;
  H.streetAgg = -1;
  H.streetAggKind = '';
  H.result = null;
  H.grades = [];
  H.limpers = 0;
  for (const i of order) {
    const p = G.seats[i];
    Object.assign(p, {
      hole: [H.deck.pop(), H.deck.pop()],
      folded: false,
      allin: false,
      bet: 0,
      inv: 0,
      acted: false,
      vp: false,
      pfrd: false,
      est: { lo: 0, hi: 1 },
      startStack: p.stack,
    });
    p.st.h++;
  }
  const hu = order.length === 2;
  H.sbSeat = hu ? order[0] : order[1];
  H.bbSeat = hu ? order[1] : order[2];
  post(H.sbSeat, sb, 'posts SB');
  post(H.bbSeat, bb, 'posts BB');
  if (ante) {
    const p = G.seats[H.bbSeat];
    const a = Math.min(ante, p.stack);
    p.stack -= a;
    p.inv += a;
    if (p.stack === 0) p.allin = true;
    if (a) H.events.push({ s: H.bbSeat, t: 'ante', a, st: 0 });
  }
  H.curBet = bb;
  H.minRaise = bb;
  H.toAct = nextActor(H.bbSeat);
  if (H.toAct < 0) endStreet();
}
/* a stacked deck for the guided practice hands. rig = {holes:{seat:[card,card]}, board:[five cards]};
   anyone not named gets random cards. Built so the normal dealing code below deals it. */
function riggedDeck(rig, order) {
  const used = new Set([...Object.values(rig.holes).flat(), ...rig.board]);
  const rest = shuffle([...Array(52).keys()].filter((c) => !used.has(c)));
  const seq = [];
  for (const i of order) {
    const h = rig.holes[i] || [rest.pop(), rest.pop()];
    seq.push(h[0], h[1]);
  }
  const b = rig.board;
  seq.push(rest.pop(), b[0], b[1], b[2], rest.pop(), b[3], rest.pop(), b[4]);
  return [...rest, ...seq.reverse()];
}
function post(i, amt, label) {
  const p = G.seats[i];
  const a = Math.min(amt, p.stack);
  p.stack -= a;
  p.bet += a;
  p.inv += a;
  if (p.stack === 0) p.allin = true;
  G.hand.events.push({ s: i, t: label === 'posts SB' ? 'sb' : 'bb', a, st: 0 });
}
const inHand = (i) => {
  const p = G.seats[i];
  return p && p.hole && !p.folded && G.hand.order.includes(i);
};
export const liveSeats = () => G.hand.order.filter((i) => !G.seats[i].folded);
function needsAction(i) {
  const p = G.seats[i],
    H = G.hand;
  return inHand(i) && !p.allin && (!p.acted || p.bet < H.curBet);
}
function nextActor(from) {
  const H = G.hand,
    o = H.order,
    n = o.length;
  let k = o.indexOf(from);
  // only one player with chips who already matched -> none
  for (let s = 1; s <= n; s++) {
    const i = o[(k + s) % n];
    if (needsAction(i)) {
      const others = liveSeats().filter((j) => j !== i && !G.seats[j].allin);
      if (!others.length && G.seats[i].bet >= H.curBet) continue;
      return i;
    }
  }
  return -1;
}
export function potTotal() {
  return G.hand.order.reduce((a, i) => a + G.seats[i].inv, 0);
}
export function legal(i) {
  const p = G.seats[i],
    H = G.hand;
  const toCall = Math.min(H.curBet - p.bet, p.stack);
  const others = liveSeats().filter((j) => j !== i && !G.seats[j].allin);
  const maxTo = p.bet + p.stack;
  let minTo = Math.min(H.curBet + H.minRaise, maxTo);
  const canRaise = !p.acted && others.length > 0 && maxTo > H.curBet;
  return { toCall, check: toCall === 0, minTo, maxTo, canRaise, pot: potTotal() };
}
export function act(i, a) {
  const H = G.hand,
    p = G.seats[i],
    L = legal(i);
  let ev = { s: i, st: H.street };
  if (a.t === 'raise' && !L.canRaise) a = { t: L.toCall ? 'call' : 'check' };
  if (a.t === 'check' && L.toCall > 0) a = { t: 'call' };
  if (a.t === 'fold' && L.toCall === 0) a = { t: 'check' };
  if (a.t === 'fold') {
    p.folded = true;
    ev.t = 'fold';
  } else if (a.t === 'check') {
    ev.t = 'check';
  } else if (a.t === 'call') {
    const c = L.toCall;
    p.stack -= c;
    p.bet += c;
    p.inv += c;
    if (p.stack === 0) p.allin = true;
    ev.t = 'call';
    ev.a = c;
    if (H.street > 0) p.st.agC++;
  } else {
    let to = Math.round(a.to / unit()) * unit();
    to = clamp(to, L.minTo, L.maxTo);
    if (L.maxTo - to < unit()) to = L.maxTo;
    const add = to - p.bet;
    p.stack -= add;
    p.inv += add;
    p.bet = to;
    if (p.stack === 0) p.allin = true;
    const full = to - H.curBet >= H.minRaise;
    ev.t = H.curBet === 0 ? 'bet' : 'raise';
    ev.a = to;
    if (full) {
      H.minRaise = to - H.curBet;
      for (const j of H.order) if (j !== i) G.seats[j].acted = false;
    }
    H.curBet = Math.max(H.curBet, to);
    H.lastAgg = i;
    H.streetAgg = i;
    H.streetAggKind = ev.t;
    if (H.street === 0) {
      H.raises++;
      H.preAgg = i;
    }
    if (H.street > 0) p.st.agB++;
  }
  if (p.allin && a.t !== 'fold' && a.t !== 'check') ev.allin = true;
  p.acted = true;
  if (H.street === 0 && !p.vp && (ev.t === 'call' || ev.t === 'raise' || ev.t === 'bet')) {
    p.vp = true;
    p.st.v++;
  }
  if (H.street === 0 && (ev.t === 'raise' || ev.t === 'bet') && !p.pfrd) {
    p.pfrd = true;
    p.st.p++;
  }
  if (H.street === 0 && H.raises === 0 && ev.t === 'call' && i !== H.bbSeat) H.limpers++;
  if (H.street === 0) updateEst(i, ev);
  H.events.push(ev);
  if (liveSeats().length === 1) {
    finishHand();
    return;
  }
  const nx = nextActor(i);
  if (nx < 0) endStreet();
  else H.toAct = nx;
}
export function readFactor(p) {
  if (p.st.h < 12) return 1;
  return clamp(p.st.v / p.st.h / 0.24, 0.55, 2.4);
}
function updateEst(i, ev) {
  const H = G.hand,
    p = G.seats[i],
    rf = readFactor(p);
  const bbs = (p.stack + p.inv) / H.bbAmt;
  if (ev.t === 'raise') {
    if (H.raises === 1) {
      const pn = posName(i);
      if (ev.allin && bbs <= 20) p.est = { lo: 0, hi: clamp(pushPct(bbs, behindCount(i), H.ante > 0) * rf, 0.02, 1) };
      else p.est = { lo: 0, hi: clamp(openPct(pn) * rf, 0.03, 0.95) };
    } else if (H.raises === 2) p.est = { lo: 0, hi: clamp(0.06 * rf, 0.025, 0.4) };
    else p.est = { lo: 0, hi: clamp(0.03 * rf, 0.02, 0.2) };
  } else if (ev.t === 'call') {
    if (H.raises === 0) p.est = { lo: 0.04, hi: clamp(0.55 * rf, 0.2, 1) };
    else if (H.raises === 1) {
      const agg = G.seats[H.preAgg];
      const r = agg ? agg.est.hi : 0.2;
      const bbDef = i === H.bbSeat ? 1.6 : 1;
      p.est = { lo: clamp(0.025 / rf, 0.005, 0.03), hi: clamp(r * 1.25 * rf * bbDef, 0.06, 0.85) };
    } else p.est = { lo: 0.01, hi: clamp(0.09 * rf, 0.04, 0.35) };
  }
}
export function behindCount(i) {
  let c;
  const bo = preOrder();
  const kk = bo.indexOf(i);
  c = 0;
  for (let s = kk + 1; s < bo.length; s++) {
    const p = G.seats[bo[s]];
    if (!p.folded) c++;
  }
  return Math.max(c, 1);
}
export function preOrder() {
  const H = G.hand,
    o = H.order;
  if (o.length === 2) return [o[0], o[1]];
  return [...o.slice(3), o[0], o[1], o[2]];
}
function endStreet() {
  const H = G.hand;
  for (const i of H.order) {
    const p = G.seats[i];
    p.bet = 0;
    p.acted = false;
  }
  H.curBet = 0;
  H.minRaise = H.bbAmt;
  H.streetAgg = -1;
  H.streetAggKind = '';
  const live = liveSeats(),
    withChips = live.filter((i) => !G.seats[i].allin);
  if (H.street === 3) {
    showdown();
    return;
  }
  if (withChips.length <= 1) {
    while (H.board.length < 5) dealStreet();
    H.street = 3;
    H.runout = true;
    showdown();
    return;
  }
  dealStreet();
  H.toAct = nextActorPost();
  if (H.toAct < 0) endStreet();
}
function dealStreet() {
  const H = G.hand;
  H.deck.pop();
  if (H.board.length === 0) H.board.push(H.deck.pop(), H.deck.pop(), H.deck.pop());
  else H.board.push(H.deck.pop());
  H.street = H.board.length === 3 ? 1 : H.board.length === 4 ? 2 : 3;
  H.events.push({ t: 'board', st: H.street, cards: H.board.slice() });
}
function nextActorPost() {
  const H = G.hand,
    o = H.order;
  for (let s = 1; s <= o.length; s++) {
    const i = o[s % o.length];
    if (needsAction(i)) return i;
  }
  return -1;
}
function returnUncalled() {
  const H = G.hand;
  const inv = H.order.map((i) => G.seats[i].inv);
  const sorted = [...inv].sort((a, b) => b - a);
  const k = inv.indexOf(sorted[0]);
  if (sorted[0] > sorted[1]) {
    const ex = sorted[0] - sorted[1];
    const p = G.seats[H.order[k]];
    p.inv -= ex;
    p.stack += ex;
    if (p.stack > 0) p.allin = false;
    H.refund = { s: H.order[k], a: ex };
  }
}
function showdown() {
  finishHand(true);
}
function finishHand(sd) {
  const H = G.hand;
  H.done = true;
  H.toAct = -1;
  returnUncalled();
  const live = liveSeats();
  let pot = potTotal();
  let rake = 0;
  if (G.mode === 'cash' && G.cfg.rake && H.board.length >= 3) {
    rake = Math.min(5, Math.floor(pot * 0.1));
    G.session.rake += rake;
  }
  const win = {};
  const shows = [];
  if (live.length === 1) {
    win[live[0]] = pot - rake;
  } else {
    const sc = {};
    for (const i of live) {
      sc[i] = eval7([...G.seats[i].hole, ...H.board]);
      shows.push({ s: i, hole: G.seats[i].hole, v: sc[i] });
      G.seats[i].st.sd++;
    }
    const lv = [...new Set(live.map((i) => G.seats[i].inv))].sort((a, b) => a - b);
    let prev = 0;
    const pots = [];
    for (const L of lv) {
      let amt = 0;
      for (const i of H.order) {
        const v = G.seats[i].inv;
        amt += Math.max(0, Math.min(v, L) - prev);
      }
      pots.push({ amt, el: live.filter((i) => G.seats[i].inv >= L) });
      prev = L;
    }
    let left = 0;
    for (const i of H.order) {
      const v = G.seats[i].inv;
      if (v > prev) left += v - prev;
    }
    if (left) pots[pots.length - 1].amt += left;
    pots[0].amt -= rake;
    for (const pt of pots) {
      if (pt.amt <= 0) continue;
      const best = Math.max(...pt.el.map((i) => sc[i]));
      const ws = pt.el.filter((i) => sc[i] === best);
      const sh = Math.floor(pt.amt / ws.length / 1) * 1;
      let rem = pt.amt - sh * ws.length;
      const o = H.order;
      const ordered = [...ws].sort(
        (a, b) => ((o.indexOf(a) + o.length - 1) % o.length) - ((o.indexOf(b) + o.length - 1) % o.length),
      );
      for (const w of ordered) {
        win[w] = (win[w] || 0) + sh + (rem > 0 ? 1 : 0);
        if (rem > 0) rem--;
      }
    }
    H.pots = pots.map((p) => ({ amt: p.amt, n: p.el.length }));
  }
  for (const k in win) G.seats[k].stack += win[k];
  H.result = { win, shows, rake, sd: live.length > 1 };
  for (const i of H.order) {
    const p = G.seats[i];
    p.net = p.stack - p.startStack;
  }
  recordHand();
}
function recordHand() {
  const H = G.hand;
  const hero = G.seats[0];
  const names = {};
  for (const i of H.order) names[i] = G.seats[i].name;
  const rec = {
    no: G.handNo,
    blinds: H.sbAmt + '/' + H.bbAmt + (H.ante ? ' ante ' + H.ante : ''),
    hole: hero && hero.hole && H.order.includes(0) ? hero.hole.slice() : null,
    board: H.board.slice(),
    events: H.events.map((e) => Object.assign({}, e)),
    names,
    pos: Object.fromEntries(H.order.map((i) => [i, posLabel(i)])),
    starts: Object.fromEntries(H.order.map((i) => [i, G.seats[i].startStack])),
    win: Object.assign({}, H.result.win),
    shows: H.result.shows.map((s) => ({ s: s.s, hole: s.hole.slice(), desc: handName(s.v) })),
    net: hero && H.order.includes(0) ? hero.net : 0,
    grades: H.grades.slice(),
    mode: G.mode,
    heroFolded: hero ? hero.folded : true,
  };
  G.records.unshift(rec);
  if (G.records.length > 80) G.records.pop();
}
