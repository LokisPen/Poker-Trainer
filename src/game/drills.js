import {
  CI,
  CUM,
  RNG,
  boardDry,
  boardWet,
  callPct,
  catOf,
  clamp,
  drawInfo,
  eqVs,
  equity,
  eval7,
  handClass,
  handPct,
  newDeck,
  pick,
  pushPct,
  rnd,
} from '../core/cards.js';
import { icmAll } from '../core/icm.js';
import { NAMES, OPEN } from './state.js';

/* ================= drills (standalone math, same model as the coach) ================= */
export const DPOS9 = ['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB']; // behind = 8..1
const PSC = {};
export function eqPushRange(E, behind) {
  const key = E + '/' + behind;
  if (PSC[key]) return PSC[key];
  let pS = pushPct(E, behind, true);
  for (let it = 0; it < 5; it++) {
    let thr = 0;
    for (let k = 0; k < 169; k++) if (pushEVbb(k, E, behind, pS).ev > 0) thr = CUM[k];
    pS = clamp((pS + thr) / 2, 0.02, 1);
  }
  return (PSC[key] = pS);
}
function pushEVbb(ci, E, behind, pSfix) {
  // folded to hero; blinds 0.5/1 + 1bb BB ante (dead 2.5). returns EV of shove minus fold, in bb
  const dead = 2.5;
  const pS = pSfix || eqPushRange(E, behind);
  const callerStacks = null;
  let ev = 0,
    pf = 1;
  for (let k = 0; k < behind; k++) {
    const Ej = callerStacks ? callerStacks[k] : E;
    const isBB = k === behind - 1,
      isSB = behind >= 2 && k === behind - 2;
    const bj = isBB ? 1 : isSB ? 0.5 : 0;
    const m = Math.min(E, Ej);
    const need = Math.max(0.01, (m - bj) / (dead + E + (m - bj)));
    const c = callPct(pS, need);
    const eq = eqVs(ci, c);
    ev += pf * c * (eq * (dead + m - bj) - (1 - eq) * m);
    pf *= 1 - c;
  }
  // hero in SB: own 0.5 already in dead, folding loses it either way
  ev += pf * dead;
  return { ev, foldP: pf };
}
function pushRangePct(E, behind) {
  let thr = 0;
  for (let k = 0; k < 169; k++) if (pushEVbb(k, E, behind).ev > 0) thr = CUM[k];
  return thr;
}
export function pushRangeSet(E, behind) {
  const s = new Set();
  for (let k = 0; k < 169; k++) if (pushEVbb(k, E, behind).ev > 0) s.add(k);
  return s;
}
function randHand() {
  const d = newDeck();
  return [d[0], d[1]];
}
export function genDrill(type) {
  if (type === 'name') {
    // beginner: seven cards, name the hand. Rare hands are dealt far more often than chance, so every kind comes up
    const want = pick([0, 1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6, 7, 8]);
    let h, board, v;
    for (let t = 0; t < 60000; t++) {
      const d = newDeck();
      h = [d[0], d[1]];
      board = d.slice(2, 7);
      v = eval7([...h, ...board]);
      if (catOf(v) === want) break;
    }
    const cat = catOf(v),
      near = [cat - 1, cat + 1, cat - 2, cat + 2, cat + 3, cat - 3].filter((c) => c >= 0 && c <= 8).slice(0, 3);
    return { type, h, board, v, opts: [cat, ...near].sort((a, b) => a - b), answer: String(cat), close: false };
  }
  if (type === 'wins') {
    // beginner: two hands and a full board. Kicker fights and split pots are dealt more often than chance
    const want = pick(['split', 'same', 'same', 'same', 'any', 'any', 'any']);
    let h, opp, board, a, b;
    for (let t = 0; t < 5000; t++) {
      const d = newDeck();
      h = [d[0], d[1]];
      opp = [d[2], d[3]];
      board = d.slice(4, 9);
      a = eval7([...h, ...board]);
      b = eval7([...opp, ...board]);
      if (want === 'any' || (want === 'split' && a === b) || (want === 'same' && a !== b && catOf(a) === catOf(b)))
        break;
    }
    return {
      type,
      h,
      opp,
      board,
      a,
      b,
      name: pick(NAMES),
      answer: a > b ? 'you' : a < b ? 'them' : 'split',
      close: false,
    };
  }
  if (type === 'push') {
    const behind = 1 + rnd(8),
      E = 4 + rnd(12),
      h = randHand(),
      ci = CI[handClass(h)];
    const r = pushEVbb(ci, E, behind);
    const thr = pushRangePct(E, behind);
    return {
      type,
      h,
      behind,
      E,
      ev: r.ev,
      thr,
      answer: r.ev > 0 ? 'shove' : 'fold',
      close: Math.abs(r.ev) < 0.2,
      pos: DPOS9[8 - behind],
    };
  }
  if (type === 'call') {
    const sb = pick([
      { p: 'SB', b: 1 },
      { p: 'BTN', b: 2 },
      { p: 'CO', b: 3 },
      { p: 'HJ', b: 4 },
      { p: 'LJ', b: 5 },
    ]);
    const Ev = 4 + rnd(14),
      Eh = Ev + rnd(10) - 3;
    const hS = Math.max(3, Eh);
    const read = pick([
      { t: 'a solid regular', f: 1 },
      { t: 'a tight player', f: 0.6 },
      { t: 'an aggressive player', f: 1.6 },
    ]);
    const range = clamp(pushPct(Ev, sb.b, true) * read.f, 0.03, 1);
    let h;
    do h = randHand();
    while (handPct(h) > 0.55 && RNG() < 0.6);
    const ci = CI[handClass(h)];
    const eq = eqVs(ci, range);
    const m = Math.min(Ev, hS);
    const pot = 2.5 + (sb.p === 'SB' ? 0 : 0.5) + m;
    const call = m - 1;
    const need = call / (pot + call);
    return {
      type,
      h,
      pos: sb.p,
      Ev,
      Eh: hS,
      read: read.t,
      range,
      eq,
      need,
      answer: eq >= need ? 'call' : 'fold',
      close: Math.abs(eq - need) < 0.025,
    };
  }
  if (type === 'icm') {
    const pays = [500, 300, 200];
    for (let t = 0; t < 50; t++) {
      const st = [0, 0, 0, 0].map(() => 4 + rnd(30));
      const names = [pick(NAMES), pick(NAMES), pick(NAMES)];
      const v = rnd(3); // villain index 0..2, hero is 3
      const h = randHand(),
        ci = CI[handClass(h)];
      const range = clamp(pushPct(st[v], 2, true) * pick([0.8, 1, 1.4]), 0.04, 1);
      const eq = eqVs(ci, range);
      const m = Math.min(st[v], st[3]);
      const dead = 1.5;
      const S = st.slice();
      const W = S.slice();
      W[3] += m + dead - 1;
      W[v] -= m; // hero posted BB(1), villain shoves
      W[3] = st[3] + m + (dead - 1) + 0;
      W[v] = st[v] - m;
      const Lz = S.slice();
      Lz[3] = st[3] - m;
      Lz[v] = st[v] + m + (dead - 1);
      const F = S.slice();
      F[3] = st[3] - 1;
      F[v] = st[v] + dead;
      const iw = icmAll(W, pays)[3],
        il = icmAll(Lz, pays)[3],
        ifo = icmAll(F, pays)[3];
      const icmNeed = (ifo - il) / Math.max(1e-6, iw - il);
      const chipNeed = (m - 1) / (2 * m + dead - 1);
      const evC = eq * iw + (1 - eq) * il;
      if (Math.abs(eq - icmNeed) > 0.18 && RNG() < 0.6) continue;
      return {
        type,
        h,
        st,
        names,
        v,
        eq,
        range,
        icmNeed: clamp(icmNeed, 0, 1),
        chipNeed,
        evC,
        evF: ifo,
        answer: evC > ifo ? 'call' : 'fold',
        close: Math.abs(evC - ifo) < 4,
        pays,
      };
    }
  }
  if (type === 'cbet') {
    const pos = pick(['UTG', 'HJ', 'CO', 'BTN', 'BTN']);
    const op = OPEN[pos];
    let h;
    do h = randHand();
    while (handPct(h) > op);
    const d = newDeck().filter((c) => c !== h[0] && c !== h[1]);
    const board = [d[0], d[1], d[2]];
    const bbR = { lo: 0.025, hi: clamp(op * 1.8, 0.2, 0.6) };
    const eq = equity(h, board, [bbR], 900);
    const wet = boardWet(board),
      dry = boardDry(board);
    const hi = Math.max(...board.map((c) => c >> 2));
    const di = drawInfo(h, board);
    const draw = di.fd || di.sd;
    let ans,
      close = [];
    if (eq >= 0.7) {
      ans = wet ? 'big' : 'small';
      close = [wet ? 'small' : 'big'];
      if (!wet && eq > 0.85) close.push('check');
    } else if (eq >= 0.5) {
      ans = 'small';
      close = wet ? ['big', 'check'] : ['check'];
    } else if (draw) {
      ans = wet ? 'big' : 'small';
      close = [wet ? 'small' : 'big'];
    } else if (eq >= 0.3) {
      ans = 'check';
      close = dry && hi >= 10 ? ['small'] : [];
    } else {
      ans = dry && hi >= 10 ? 'small' : 'check';
      close = new Set(board.map((c) => c >> 2)).size < 3 ? ['small', 'check'] : [];
    }
    return { type, h, board, pos, eq, wet, dry, draw, hiR: hi, answer: ans, closeSet: close, bbR };
  }
  if (type === 'open') {
    const pos = pick(['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB']),
      op = OPEN[pos];
    let h;
    for (let t = 0; t < 60; t++) {
      h = randHand();
      if (handPct(h) < op * 2.2 + 0.06) break;
    }
    const p = handPct(h);
    return { type, h, pos, op, pct: p, answer: p <= op ? 'raise' : 'fold', close: p > op * 0.85 && p <= op * 1.2 };
  }
  if (type === 'outs') {
    for (let t = 0; t < 6000; t++) {
      const two = RNG() < 0.55,
        d = newDeck(),
        h = [d[0], d[1]],
        board = d.slice(2, two ? 5 : 6);
      if (catOf(eval7([...h, ...board])) >= 2) continue;
      const known = new Set([...h, ...board]);
      let fo = 0,
        so = 0;
      for (let c = 0; c < 52; c++) {
        if (known.has(c)) continue;
        const v = catOf(eval7([...h, ...board, c]));
        if (v < 4 || catOf(eval7([...board, c])) >= 4) continue;
        if (v === 4) so++;
        else fo++;
      }
      const outs = fo + so;
      if (![4, 8, 9, 12, 15].includes(outs) || (fo && fo !== 9) || ![0, 3, 4, 6, 8].includes(so)) continue;
      if (outs === 4 && RNG() < 0.75) continue;
      const label =
        (fo ? 'a flush draw' : '') +
        (so ? (fo ? ' plus ' : '') + (so >= 6 ? 'an open-ended straight draw' : 'a gutshot straight draw') : '');
      const pot = pick([40, 60, 90, 120, 150]),
        f = two ? pick([0.5, 0.75, 1, 1.5]) : pick([0.2, 0.25, 0.33, 0.5, 0.75]);
      const bet = Math.max(5, Math.round((pot * f) / 5) * 5),
        need = bet / (pot + 2 * bet);
      const eq = two ? 1 - ((47 - outs) * (46 - outs)) / (47 * 46) : outs / 46;
      if (Math.abs(eq - need) > 0.2 && RNG() < 0.7) continue;
      return {
        type,
        h,
        board,
        two,
        outs,
        label,
        pot,
        bet,
        need,
        eq,
        rule: (outs * (two ? 4 : 2)) / 100,
        answer: eq >= need ? 'call' : 'fold',
        close: Math.abs(eq - need) < 0.02,
      };
    }
  }
  if (type === 'river') {
    const prof = pick([
      { t: 'a live recreational player who rarely bluffs', b: 0.14, big: 0.7 },
      { t: 'a solid regular', b: null, big: 1 },
      { t: 'an aggressive regular', b: 0.38, big: 1 },
      { t: 'a maniac', b: 0.5, big: 1.1 },
    ]);
    const size = pick([0.33, 0.5, 0.75, 1, 1.5]);
    let h, board;
    for (let t = 0; t < 200; t++) {
      const d = newDeck();
      h = [d[0], d[1]];
      board = d.slice(2, 7);
      const v = eval7([...h, ...board]);
      if (catOf(v) === 1 && catOf(eval7(board)) === 0) break;
    }
    const pot = pick([40, 60, 90, 120, 200]);
    const bet = Math.round(pot * size);
    const need = bet / (pot + 2 * bet);
    let share = prof.b === null ? need * (0.9 + RNG() * 0.2) : prof.b * (size >= 1 ? prof.big : 1);
    share = clamp(share, 0.03, 0.7);
    return {
      type,
      h,
      board,
      prof: prof.t,
      size,
      pot,
      bet,
      need,
      share,
      answer: share >= need ? 'call' : 'fold',
      close: Math.abs(share - need) < 0.03,
    };
  }
}
export function drillAnswer(d, choice) {
  const s = d;
  let ok,
    cl = false;
  if (s.type === 'cbet') {
    ok = choice === s.answer;
    cl = !ok && s.closeSet.includes(choice);
  } else {
    ok = choice === s.answer;
    cl = !ok && s.close;
  }
  return ok ? 'Solid' : cl ? 'Close' : 'Leak';
}
