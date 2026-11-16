import {
  CI,
  CUM,
  boardDry,
  boardWet,
  callPct,
  clamp,
  drawInfo,
  eqVs,
  equity,
  eval7,
  handClass,
  handName,
  handPct,
  pushPct,
  strengthCond,
} from '../core/cards.js';
import { behindCount, legal, liveSeats, preOrder, readFactor } from './engine.js';
import { heroValueFn } from './session.js';
import { G, openPct, posLabel, posName } from './state.js';

/* ================= coach ================= */
const CAT = { fold: 'fold', check: 'passive', call: 'passive', raise: 'aggr', bet: 'aggr' };
export function pctTxt(p) {
  return p >= 0.995
    ? 'any two cards'
    : 'top ' + (p * 100 < 10 ? (p * 100).toFixed(1).replace('.0', '') : Math.round(p * 100)) + '%';
}
function fmtC(n) {
  return G && G.mode === 'cash' ? '$' + Math.round(n).toLocaleString() : Math.round(n).toLocaleString();
}
export function bbTxt(n, bb) {
  return (n / bb).toFixed(n / bb < 10 ? 1 : 0).replace('.0', '') + ' bb';
}
function seatStacks() {
  const o = {};
  G.seats.forEach((p, i) => {
    if (p) o[i] = p.stack;
  });
  return o;
}
function seatInv() {
  const o = {};
  G.seats.forEach((p, i) => {
    if (p) o[i] = p.inv || 0;
  });
  return o;
}
// value of a final stack map for hero
function makeV() {
  const hv = heroValueFn();
  if (hv) return { icm: true, label: hv.label, f: (st) => hv.fn(st) };
  return { icm: false, label: 'chips', f: (st) => st[0] };
}
function shoveEVs(ci, callers, V) {
  // callers: [{s,c}] in order; hero seat 0 shoves all-in
  const S = seatStacks(),
    I = seatInv();
  const pot = Object.values(I).reduce((a, b) => a + b, 0);
  const H = G.hand;
  // fold: pot to biggest investor (bb)
  const fo = Object.assign({}, S);
  let big = H.bbSeat;
  if (big === 0) {
    let m = -1;
    for (const k in I)
      if (+k !== 0 && I[k] > m) {
        m = I[k];
        big = +k;
      }
  }
  fo[big] = (fo[big] || 0) + pot;
  const foldV = V.f(fo);
  let ev = 0,
    pf = 1;
  const th = S[0] + I[0];
  for (const c of callers) {
    const tv = S[c.s] + I[c.s],
      m = Math.min(th, tv),
      dead = pot - I[0] - I[c.s];
    const eq = eqVs(ci, c.c);
    const w = Object.assign({}, S);
    w[0] = th + m + dead;
    w[c.s] = tv - m;
    const l = Object.assign({}, S);
    l[0] = th - m;
    l[c.s] = tv + m + dead;
    ev += pf * c.c * (eq * V.f(w) + (1 - eq) * V.f(l));
    pf *= 1 - c.c;
  }
  const af = Object.assign({}, S);
  af[0] = th + pot - I[0];
  ev += pf * V.f(af);
  return { shove: ev, fold: foldV, foldP: pf };
}
function heroCallers(pShove) {
  const bo = preOrder(),
    k = bo.indexOf(0),
    S = seatStacks(),
    I = seatInv();
  const pot = Object.values(I).reduce((a, b) => a + b, 0);
  const th = S[0] + I[0];
  const out = [];
  for (let s = k + 1; s < bo.length; s++) {
    const j = bo[s],
      q = G.seats[j];
    if (q.folded) continue;
    const tv = S[j] + I[j];
    const callAmt = Math.min(th, tv) - I[j];
    const potAfter = pot + (th - I[0]) + callAmt;
    const need = callAmt / potAfter;
    let c = callPct(pShove, need);
    c = clamp(c * Math.sqrt(readFactor(q)), 0.005, 1);
    out.push({ s: j, c });
  }
  return out;
}
export function coachSpot() {
  const H = G.hand,
    p = G.seats[0],
    L = legal(0);
  const a = H.street === 0 ? coachPre(p, L) : coachPost(p, L);
  a.toCall = L.toCall;
  a.check = L.check;
  return a;
}
function coachPre(p, L) {
  const H = G.hand,
    bb = H.bbAmt,
    pct = handPct(p.hole),
    cls = handClass(p.hole),
    ci = CI[cls],
    pn = posName(0);
  const live = liveSeats();
  const others = live.filter((j) => j !== 0);
  const oppMax = Math.max(...others.map((j) => G.seats[j].stack + G.seats[j].bet));
  const effBB = Math.min(p.stack + p.bet, oppMax) / bb;
  const tour = G.mode === 'tour';
  const lines = [];
  const res = { street: 0, cls, pct, pos: pn, lines, close: [] };
  const head =
    cls +
    ' is in the ' +
    pctTxt(pct) +
    ' of starting hands. You are ' +
    posPhrase(posLabel(0)) +
    ' with ' +
    effBB.toFixed(effBB < 20 ? 1 : 0).replace('.0', '') +
    ' big blinds effective.';
  lines.push(head);
  const V = tour ? makeV() : { icm: false, f: (st) => st[0] };
  const unopened = H.raises === 0;
  // ---- A: short-stack push/fold
  if (unopened && tour && effBB <= 15) {
    res.kind = 'push';
    const pS = pushPct(effBB, behindCount(0), H.ante > 0);
    const callers = heroCallers(pS);
    const e = shoveEVs(ci, callers, V);
    // range threshold scan
    let thr = 0;
    for (let k = 0; k < 169; k++) {
      const ee = shoveEVs(k, callers, V);
      if (ee.shove > ee.fold) thr = CUM[k];
    }
    const unitV = V.icm ? G.prizePool * 0.004 : bb * 0.3;
    const d = e.shove - e.fold;
    res.best = d > 0 ? 'aggr' : L.check ? 'passive' : 'fold';
    if (Math.abs(d) < unitV) res.close = ['aggr', L.check ? 'passive' : 'fold'];
    lines.push(
      'Short-stacked and folded to you, your options are shove or ' +
        (L.check ? 'check' : 'fold') +
        '. Everyone folds about ' +
        Math.round(e.foldP * 100) +
        '% of the time, and a profitable shove here is roughly the ' +
        pctTxt(thr) +
        '.',
    );
    if (V.icm)
      lines.push(
        'Measured in ' +
          V.label +
          ', shoving is worth ' +
          (d >= 0 ? '+' : '') +
          '$' +
          d.toFixed(2) +
          ' compared to folding.',
      );
    else
      lines.push(
        'Shoving is worth ' +
          (d >= 0 ? '+' : '') +
          (d / bb).toFixed(2) +
          ' bb compared to ' +
          (L.check ? 'checking' : 'folding') +
          '.',
      );
    res.ev = d;
    res.sizeHint = 'All-in';
    return res;
  }
  const ag = G.seats[H.lastAgg];
  // ---- B: facing a shove or a raise that commits us
  if (H.raises >= 1 && ag && (ag.allin || L.toCall >= p.stack * 0.5)) {
    res.kind = 'callshove';
    const pot = L.pot,
      need = L.toCall / (pot + L.toCall);
    const callersIn = others.filter((j) => j !== H.lastAgg && G.seats[j].inv > bb && !G.seats[j].folded);
    const rr = Math.max(0.02, ag.est.hi);
    let eq;
    if (callersIn.length) eq = equity(p.hole, [], [ag.est, ...callersIn.map((j) => G.seats[j].est)], 700);
    else eq = eqVs(ci, rr);
    res.eq = eq;
    res.need = need;
    lines.push(
      ag.name +
        (ag.allin ? ' is all-in' : ' raised big') +
        '. Based on position, stack size and what you have seen from them, their range is about the ' +
        pctTxt(rr) +
        '. Against that you have about ' +
        Math.round(eq * 100) +
        '% equity.',
    );
    if (V.icm && !callersIn.length) {
      const S = seatStacks(),
        I = seatInv();
      const v = H.lastAgg;
      const th = S[0] + I[0],
        tv = S[v] + I[v],
        m = Math.min(th, tv),
        dead = pot - I[0] - I[v];
      const w = Object.assign({}, S);
      w[0] = th + m + dead;
      w[v] = tv - m;
      const l = Object.assign({}, S);
      l[0] = th - m;
      l[v] = tv + m + dead;
      const fo = Object.assign({}, S);
      fo[v] = S[v] + pot;
      const Vw = V.f(w),
        Vl = V.f(l),
        Vf = V.f(fo);
      const evC = eq * Vw + (1 - eq) * Vl;
      const icmNeed = (Vf - Vl) / Math.max(1e-6, Vw - Vl);
      res.best = evC > Vf ? 'passive' : 'fold';
      res.icmNeed = icmNeed;
      if (Math.abs(evC - Vf) < G.prizePool * 0.004) res.close = ['passive', 'fold'];
      lines.push(
        'In chips you need ' +
          Math.round(need * 100) +
          '% to call. With payouts on the line (' +
          V.label +
          '), you actually need about ' +
          Math.round(clamp(icmNeed, 0, 1) * 100) +
          '%. That gap is the ICM risk premium.',
      );
      lines.push((evC > Vf ? 'Calling' : 'Folding') + ' is worth $' + Math.abs(evC - Vf).toFixed(2) + ' more.');
    } else {
      res.best = eq >= need ? 'passive' : 'fold';
      if (Math.abs(eq - need) < 0.03) res.close = ['passive', 'fold'];
      lines.push(
        'You need ' +
          Math.round(need * 100) +
          '% to call (' +
          fmtC(L.toCall) +
          ' to win ' +
          fmtC(pot + L.toCall) +
          '). ' +
          (eq >= need ? 'You have enough, so call.' : 'Not enough, so fold.'),
      );
    }
    if (L.canRaise && res.best === 'passive' && pct <= 0.02) {
      res.best = 'aggr';
      res.close = ['passive'];
    }
    return res;
  }
  // ---- C: facing a raise, deep
  if (H.raises >= 1) {
    res.kind = 'defend';
    const rr = ag ? Math.max(0.02, ag.est.hi) : 0.2;
    const pot = L.pot,
      need = L.toCall / (pot + L.toCall);
    const inBB = H.bbSeat === 0,
      ip = pn === 'BTN' || (pn === 'CO' && ag && posName(H.lastAgg) !== 'BTN');
    let tb, cr;
    if (H.raises >= 2) {
      tb = 0.025;
      cr = need < 0.35 ? 0.07 : 0.04;
    } else {
      tb = clamp(rr * 0.2, 0.02, 0.07);
      cr = clamp(rr * (inBB ? 1.5 : ip ? 1.05 : 0.75) * (need < 0.25 ? 1.2 : 1), 0.04, 0.6);
    }
    if (tour && effBB <= 25 && H.raises === 1) {
      tb = Math.max(tb, clamp(rr * 0.35, 0.03, 0.2));
      cr = Math.min(cr, tb * 1.6);
    }
    res.best = pct <= tb ? 'aggr' : pct <= cr ? 'passive' : 'fold';
    const near = (t) => pct > t * 0.75 && pct <= t * 1.3;
    if (near(tb)) res.close = ['aggr', 'passive'];
    else if (near(cr)) res.close = ['passive', 'fold'];
    lines.push(
      (ag ? ag.name : 'Someone') +
        (H.raises >= 2 ? ' made it a re-raise' : ' raised') +
        '. Their range looks like the ' +
        pctTxt(rr) +
        '. Against it, a good ' +
        (tour && effBB <= 25 ? 're-shove' : '3-bet') +
        ' range is about the ' +
        pctTxt(tb) +
        ' and you can call with roughly the ' +
        pctTxt(cr) +
        (inBB ? ' (the big blind gets a discount, so it defends wider)' : '') +
        '.',
    );
    lines.push('You are getting ' + Math.round(need * 100) + '% pot odds.');
    res.sizeHint = tour && effBB <= 25 ? 'All-in' : '3-bet to about ' + fmtC(H.curBet * (ip ? 3 : 3.6));
    return res;
  }
  // ---- D: unopened or limped, deep
  res.kind = 'open';
  if (H.limpers > 0) {
    const iso = clamp(openPct(pn) * 0.75, 0.04, 0.3);
    if (L.check) {
      res.best = pct <= 0.1 ? 'aggr' : 'passive';
      if (pct > 0.07 && pct <= 0.14) res.close = ['aggr', 'passive'];
      lines.push(
        H.limpers +
          ' limper' +
          (H.limpers > 1 ? 's' : '') +
          ' and you are in the big blind. Raise your strongest hands (top 10%) for value, otherwise take the free flop.',
      );
    } else {
      const ov = G.mode === 'cash' ? clamp(openPct(pn) * 1.4, 0.1, 0.5) : 0;
      res.best = pct <= iso ? 'aggr' : pct <= ov && (cls.length === 2 || cls[2] === 's') ? 'passive' : 'fold';
      if (pct > iso * 0.75 && pct <= iso * 1.3) res.close = ['aggr', G.mode === 'cash' ? 'passive' : 'fold'];
      lines.push(
        H.limpers +
          ' limper' +
          (H.limpers > 1 ? 's' : '') +
          ' in front. Isolation-raise about the ' +
          pctTxt(iso) +
          (ov
            ? '; over-limping small pairs and suited hands up to the ' + pctTxt(ov) + ' is fine in a live game'
            : '') +
          '.',
      );
    }
    res.sizeHint = 'Raise to about ' + fmtC(bb * (G.mode === 'cash' ? 4 + H.limpers : 3 + H.limpers));
    return res;
  }
  if (L.check) {
    res.best = 'passive';
    if (pct <= 0.3) res.close = ['aggr'];
    lines.push(
      'Everyone folded or limped to you in the big blind. Checking is fine; raising strong hands is also good.',
    );
    return res;
  }
  const op = clamp(openPct(pn) * (G.mode === 'cash' && (pn === 'BTN' || pn === 'CO') ? 1.1 : 1), 0.05, 0.85);
  res.best = pct <= op ? 'aggr' : 'fold';
  if (pct > op * 0.8 && pct <= op * 1.25) res.close = ['aggr', 'fold'];
  lines.push(
    'Nobody has entered the pot. A solid opening range ' +
      posPhrase(posLabel(0)).replace(/^(in|on) /, 'from ') +
      ' is about the ' +
      pctTxt(op) +
      '. ' +
      (pct <= op ? 'Raise.' : 'Fold.') +
      ' Limping in first is a leak: raising lets you win the blinds right away.',
  );
  res.sizeHint =
    G.mode === 'cash'
      ? 'Raise to about $' + (pn === 'SB' ? 15 : 12)
      : 'Raise to about ' + fmtC(bb * (effBB > 40 ? 2.5 : 2.2));
  return res;
}
function coachPost(p, L) {
  const H = G.hand,
    pot = L.pot,
    lines = [];
  const res = { street: H.street, lines, close: [] };
  const opp = liveSeats().filter((j) => j !== 0);
  const ranges = opp.map((j) => {
    const r = G.seats[j].est || { lo: 0, hi: 1 };
    return {
      lo: r.lo,
      hi: r.hi,
      cond: j === H.streetAgg ? strengthCond(H.streetAggKind === 'raise' ? 'raise' : 'bet', 0.22) : null,
    };
  });
  const eq = equity(p.hole, H.board, ranges, 600);
  res.eq = eq;
  const v = eval7([...p.hole, ...H.board]);
  const d = drawInfo(p.hole, H.board);
  const made = handName(v);
  const draw =
    d.fd && d.sd ? 'a flush draw and a straight draw' : d.fd ? 'a flush draw' : d.sd ? 'a straight draw' : '';
  const board5 = H.board.length === 5 && eval7(H.board) === v;
  lines.push(
    (board5
      ? 'You are playing the board (' + made.toLowerCase() + ')'
      : 'You have ' + made.toLowerCase() + (draw ? ' plus ' + draw : '')) +
      '. Against ' +
      (opp.length > 1 ? 'the ' + opp.length + ' players left' : "your opponent's likely range") +
      ' that is ' +
      (eq < 0.01 ? 'less than 1%' : 'about ' + Math.round(eq * 100) + '%') +
      ' equity.',
  );
  if (L.toCall > 0) {
    res.kind = 'postcall';
    const need = L.toCall / (pot + L.toCall);
    res.need = need;
    const eqE = eq + (H.street < 3 && (d.fd || d.sd) ? 0.04 : 0);
    const raiseT = Math.max(0.7, need + 0.25);
    if (eq >= raiseT && L.canRaise) {
      res.best = 'aggr';
      res.close = ['passive'];
    } else if (eqE >= need) {
      res.best = 'passive';
      if (eqE - need < 0.05) res.close = ['fold'];
    } else {
      res.best = 'fold';
      if (need - eqE < 0.05) res.close = ['passive'];
    }
    lines.push(
      'Calling costs ' +
        fmtC(L.toCall) +
        ' to win ' +
        fmtC(pot + L.toCall) +
        ', so you need ' +
        Math.round(need * 100) +
        '%' +
        (eqE > eq ? ' (draws get a little extra credit for the money you can win later)' : '') +
        '.' +
        (res.best === 'aggr'
          ? ' You are well ahead, so raise for value.'
          : res.best === 'passive'
            ? ' You have the price, so call.'
            : ' You do not have the price, so fold.'),
    );
    res.sizeHint = res.best === 'aggr' ? 'Raise to about ' + fmtC(H.curBet * 3) : '';
  } else {
    res.kind = 'postbet';
    const vth = 0.58 + 0.05 * (opp.length - 1);
    const wasAgg = H.preAgg === 0;
    const hu = opp.length === 1;
    if (eq >= vth) {
      res.best = 'aggr';
      if (eq > 0.85) res.close = ['passive'];
      lines.push('You are ahead of most of their range. Bet for value so worse hands pay you.');
    } else if (eq < 0.32 && wasAgg && H.street === 1 && hu) {
      const dry = boardDry(H.board);
      res.best = dry ? 'aggr' : 'passive';
      res.close = ['aggr', 'passive'];
      lines.push(
        dry
          ? 'You raised preflop and this board is dry. A small continuation bet works often here, even without a hand.'
          : "You raised preflop but this board connects with the caller's range. Giving up with nothing is fine.",
      );
    } else if (d.fd || d.sd) {
      res.best = H.street < 3 ? 'aggr' : 'passive';
      res.close = ['aggr', 'passive'];
      lines.push(
        H.street < 3
          ? 'Your draw makes a good semi-bluff: you can win now or improve.'
          : 'Your draw missed. Checking is usually right unless you can make better hands fold.',
      );
    } else {
      res.best = 'passive';
      if (eq > vth - 0.12) res.close = ['aggr'];
      lines.push('You are in the middle. Checking keeps the pot small and lets you reach showdown.');
    }
    res.sizeHint = res.best === 'aggr' ? 'Bet about ' + fmtC(pot * (eq > 0.8 || boardWet(H.board) ? 0.7 : 0.4)) : '';
  }
  return res;
}
export function gradeOf(choice, a) {
  const c = CAT[choice];
  if (c === a.best) return 'Solid';
  if (a.close.includes(c)) return 'Close';
  return 'Leak';
}

export function posPhrase(pn) {
  return (
    {
      BTN: 'on the button',
      SB: 'in the small blind',
      BB: 'in the big blind',
      CO: 'in the cutoff',
      HJ: 'in the hijack',
      LJ: 'in the lojack',
      MP: 'in middle position',
      UTG: 'under the gun',
      'UTG+1': 'one seat off the gun',
    }[pn] || 'in ' + pn
  );
}
