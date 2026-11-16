import { CI, RNG, clamp, drawInfo, eqVs, equity, handClass, handPct, pushPct, strengthCond } from '../core/cards.js';
import { behindCount, legal, liveSeats, potTotal } from './engine.js';
import { G, NOISE, STYLES, openPct, posName, unit } from './state.js';

/* ================= bots ================= */
export function botDecide(i) {
  const H = G.hand,
    p = G.seats[i],
    st = STYLES[p.style] || STYLES.reg,
    L = legal(i);
  const noise = NOISE[G.cfg.diff || 'normal'];
  if (RNG() < noise * 0.5) {
    // random-ish mistake
    if (L.check) return { t: 'check' };
    if (RNG() < 0.5) return { t: 'call' };
    return { t: 'fold' };
  }
  return H.street === 0 ? botPre(i, p, st, L) : botPost(i, p, st, L);
}
function sizeTo(p, L, amt) {
  return { t: 'raise', to: clamp(Math.round(amt / unit()) * unit(), L.minTo, L.maxTo) };
}
function botPre(i, p, st, L) {
  const H = G.hand,
    bb = H.bbAmt,
    pct = handPct(p.hole),
    pn = posName(i);
  const live = liveSeats();
  const oppMax = Math.max(...live.filter((j) => j !== i).map((j) => G.seats[j].stack + G.seats[j].bet));
  const effBB = Math.min(p.stack + p.bet, oppMax) / bb;
  const tour = G.mode === 'tour';
  if (H.raises === 0) {
    if (tour && effBB <= 13) {
      if (pct <= pushPct(effBB, behindCount(i), H.ante > 0) * Math.sqrt(st.loose)) return { t: 'raise', to: L.maxTo };
      return L.check ? { t: 'check' } : { t: 'fold' };
    }
    const op = clamp(openPct(pn) * st.loose * (H.limpers ? 0.8 : 1), 0.03, 0.95);
    if (pct <= op) {
      if (RNG() < st.limp && pn !== 'BB') return L.check ? { t: 'check' } : { t: 'call' };
      const sz =
        G.mode === 'cash'
          ? bb * (3 + H.limpers + (st.agg > 0.7 ? 1 : 0)) + (RNG() < 0.3 ? bb : 0)
          : bb * (effBB > 40 ? 2.5 : 2.2) + H.limpers * bb;
      if (effBB <= 18 && tour && pct <= pushPct(effBB, behindCount(i), H.ante > 0)) return { t: 'raise', to: L.maxTo };
      return sizeTo(p, L, sz);
    }
    if (L.check) {
      if (pct <= 0.3 * st.loose && RNG() < st.agg * 0.5) return sizeTo(p, L, bb * (G.mode === 'cash' ? 5 : 3));
      return { t: 'check' };
    }
    if (pn === 'SB' && st.limp > 0.5 && pct < 0.6) return { t: 'call' };
    if (G.mode === 'cash' && st.limp > 0.5 && H.limpers && pct <= 0.45 * st.loose) return { t: 'call' };
    return { t: 'fold' };
  }
  // facing raise(s)
  const ag = G.seats[H.lastAgg] || G.seats[H.preAgg];
  const rr = ag ? ag.est.hi : 0.2;
  const toCall = L.toCall,
    pot = potTotal();
  const need = toCall / (pot + toCall);
  const shoveFacing = (ag && ag.allin) || toCall >= p.stack * 0.45;
  if (shoveFacing) {
    const eq = eqVs(CI[handClass(p.hole)], Math.max(rr, 0.03));
    if (eq >= need - st.callAdj * 0.6 + 0.01)
      return L.toCall >= p.stack
        ? { t: 'call' }
        : L.canRaise && pct < 0.03
          ? { t: 'raise', to: L.maxTo }
          : { t: 'call' };
    return { t: 'fold' };
  }
  if (H.raises >= 2) {
    if (pct <= 0.025) return L.canRaise ? { t: 'raise', to: effBB < 35 ? L.maxTo : H.curBet * 2.3 } : { t: 'call' };
    if (pct <= 0.06 * st.loose && need < 0.4) return { t: 'call' };
    return { t: 'fold' };
  }
  const tb = clamp((rr * 0.22 * st.agg) / 0.65, 0.015, 0.12);
  if (pct <= tb || (RNG() < st.bluff * 0.15 && pct < 0.5)) {
    if (tour && effBB <= 22) return { t: 'raise', to: L.maxTo };
    return L.canRaise ? sizeTo(p, L, H.curBet * (i === H.bbSeat || i === H.sbSeat ? 3.6 : 3)) : { t: 'call' };
  }
  const defend = (i === H.bbSeat ? 1.7 : 1) * (pn === 'BTN' || pn === 'CO' ? 1.2 : 1);
  const cr = clamp(rr * 0.9 * st.loose * defend, 0.04, 0.7);
  if (pct <= cr && (toCall <= effBB * bb * 0.2 || pct <= cr * 0.6)) return { t: 'call' };
  return { t: 'fold' };
}
function botPost(i, p, st, L) {
  const H = G.hand,
    pot = L.pot,
    live = liveSeats().filter((j) => j !== i);
  const ranges = live.map((j) => {
    const r = G.seats[j].est || { lo: 0, hi: 1 };
    return {
      lo: r.lo,
      hi: r.hi,
      cond: j === H.streetAgg ? strengthCond(H.streetAggKind === 'raise' ? 'raise' : 'bet', 0.25) : null,
    };
  });
  let eq = equity(p.hole, H.board, ranges, 140);
  const d = drawInfo(p.hole, H.board);
  const drawy = d.fd || d.sd;
  if (L.toCall === 0) {
    const vth = 0.6 + 0.06 * (live.length - 1);
    if (eq >= vth && RNG() < 0.35 + st.agg * 0.65) return sizeTo(p, L, pot * (RNG() < 0.5 ? 0.55 : 0.75));
    const cbet = H.preAgg === i && H.street === 1 && live.length <= 2;
    if ((cbet && RNG() < st.agg * 0.8) || (drawy && RNG() < st.agg * 0.5) || RNG() < st.bluff * 0.5)
      return sizeTo(p, L, pot * (cbet ? 0.4 : 0.6));
    return { t: 'check' };
  }
  const need = L.toCall / (pot + L.toCall);
  if (eq >= 0.78 && L.canRaise && RNG() < st.agg) return sizeTo(p, L, H.curBet * 2.8 + pot * 0.3);
  if (drawy && L.canRaise && H.street < 3 && RNG() < st.bluff * 0.5) return sizeTo(p, L, H.curBet * 3);
  const eqAdj = eq + st.callAdj + (drawy && H.street < 3 ? 0.05 : 0);
  if (eqAdj >= need) return { t: 'call' };
  return { t: 'fold' };
}
