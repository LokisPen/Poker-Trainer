import { RNG, pick, rnd, shuffle } from '../core/cards.js';
import { icmAll } from '../core/icm.js';
import { G, STYLES, STYLE_MIX, blinds, handsPerLevel, newBot } from './state.js';

/* ================= after-hand bookkeeping ================= */
export function heroValueFn() {
  // returns V(finalStacksBySeat)->number for hero, plus label
  if (G.mode !== 'tour') return null;
  const alive = allAlive();
  if (alive.length > 10 || alive.length < 2) return null;
  const paidLeft = G.pays.slice(0, alive.length);
  return {
    label: G.cfg.kind === 'sat' ? 'seat equity' : 'prize equity',
    fn: (seatStacks) => {
      const st = alive.map((a) => (a.seat >= 0 && seatStacks[a.seat] !== undefined ? seatStacks[a.seat] : a.p.stack));
      const v = icmAll(st, paidLeft);
      const hi = alive.findIndex((a) => a.p.hero);
      return hi >= 0 ? v[hi] : 0;
    },
  };
}
function allAlive() {
  const out = [];
  G.seats.forEach((p, i) => {
    if (p && p.stack > 0) out.push({ p, seat: i });
  });
  G.pool.forEach((p) => {
    if (p.stack > 0) out.push({ p, seat: -1 });
  });
  return out;
}
export function aliveCount() {
  return G.seats.filter((p) => p && p.stack > 0).length + G.pool.filter((p) => p.stack > 0).length;
}
export function tourAfterHand() {
  const msgs = [];
  // busts at hero table
  const busted = [];
  G.seats.forEach((p, i) => {
    if (p && p.stack <= 0) busted.push({ p, i, start: p.startStack });
  });
  busted.sort((a, b) => b.start - a.start);
  let rem = aliveCount() + busted.length;
  for (const b of busted) {
    const place = rem--;
    b.p.place = place;
    G.finished.push({ name: b.p.name, place, hero: b.p.hero });
    if (b.p.hero) {
      G.heroPlace = place;
    } else msgs.push(b.p.name + ' is out in ' + ord(place) + '.');
    if (!b.p.hero) G.seats[b.i] = null;
  }
  if (G.heroPlace) {
    endTour();
    return msgs;
  }
  // off-table action
  simPool(msgs);
  // level
  G.handsAtLevel++;
  if (G.handsAtLevel >= handsPerLevel()) {
    G.level++;
    G.handsAtLevel = 0;
    const b = blinds();
    msgs.push('Blinds up: ' + b.sb + '/' + b.bb + (b.ante ? ' with a ' + b.ante + ' ante' : '') + '.');
  }
  balance(msgs);
  const alive = aliveCount();
  if (G.cfg.kind === 'sat' && alive <= G.cfg.seatsWon) {
    G.heroPlace = 1;
    msgs.push('Seats awarded.');
    endTour();
    return msgs;
  }
  if (alive <= 1) {
    G.heroPlace = 1;
    endTour();
  }
  return msgs;
}
export function ord(n) {
  const s = ['th', 'st', 'nd', 'rd'],
    v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}
function simPool(msgs) {
  const P = G.pool.filter((p) => p.stack > 0);
  if (!P.length) return;
  const { bb } = blinds();
  shuffle(P);
  const per = G.cfg.seats;
  for (let g = 0; g < P.length; g += per) {
    const grp = P.slice(g, g + per).filter((p) => p.stack > 0);
    if (grp.length < 2) continue;
    const a = pick(grp);
    let b;
    do b = pick(grp);
    while (b === a);
    const r = RNG();
    const cap = Math.min(a.stack, b.stack);
    let amt = r < 0.55 ? Math.min(cap, bb * 2.5) : r < 0.85 ? Math.min(cap, bb * (6 + rnd(10))) : cap;
    const sa = STYLES[a.style].agg,
      sbb = STYLES[b.style].agg;
    const winA = RNG() < 0.5 + (sa - sbb) * 0.05;
    const w = winA ? a : b,
      l = winA ? b : a;
    amt = Math.min(amt, l.stack);
    w.stack += amt;
    l.stack -= amt;
  }
  const out = G.pool.filter((p) => p.stack <= 0);
  let rem = aliveCount() + out.length;
  out.sort((x, y) => y.stack - x.stack);
  for (const p of out) {
    const place = rem--;
    p.place = place;
    G.finished.push({ name: p.name, place, hero: false });
  }
  if (out.length)
    msgs.push(
      out.length === 1
        ? out[0].name + ' busts at another table (' + ord(out[0].place) + ').'
        : out.length + ' players bust at other tables.',
    );
  G.pool = G.pool.filter((p) => p.stack > 0);
}
function balance(msgs) {
  const alive = aliveCount(),
    seatsN = G.cfg.seats;
  const tables = Math.ceil(alive / seatsN);
  const target = tables <= 1 ? alive : Math.ceil(alive / tables);
  let here = G.seats.filter((p) => p && p.stack > 0).length;
  if (tables <= 1 && G.pool.length) {
    // final table
    while (G.pool.length) {
      const p = G.pool.pop();
      const e = G.seats.findIndex((s) => !s);
      if (e < 0) break;
      G.seats[e] = p;
      G.cast.push({ name: p.name, style: p.style });
    }
    msgs.push('Final table! Everyone left is now at your table.');
    return;
  }
  while (here < target && G.pool.length) {
    const e = emptySeatNearBB();
    if (e < 0) break;
    const p = G.pool.splice(rnd(G.pool.length), 1)[0];
    G.seats[e] = p;
    here++;
    G.cast.push({ name: p.name, style: p.style });
    msgs.push(p.name + ' is moved to your table.');
  }
  while (here > target + 1) {
    const cand = G.seats.map((p, i) => (p && !p.hero && p.stack > 0 && i !== G.button ? i : -1)).filter((i) => i >= 0);
    if (!cand.length) break;
    const i = pick(cand);
    G.pool.push(G.seats[i]);
    msgs.push(G.seats[i].name + ' is moved to another table.');
    G.seats[i] = null;
    here--;
  }
}
function emptySeatNearBB() {
  const n = G.seats.length;
  for (let k = 1; k <= n; k++) {
    const j = (G.button + k) % n;
    if (!G.seats[j]) return j;
  }
  return -1;
}
function endTour() {
  G.over = true;
  const pl = G.heroPlace;
  G.heroPrize = pl && pl <= G.pays.length ? G.pays[pl - 1] : 0;
}
export function cashAfterHand() {
  const msgs = [];
  const S = G.session;
  S.hands++;
  const hero = G.seats[0];
  S.peak = Math.max(S.peak, hero.stack - S.invested + G.cfg.buyin);
  G.seats.forEach((p, i) => {
    if (!p || p.hero) return;
    if (p.stack <= 0) {
      msgs.push(p.name + ' is felted and leaves.');
      G.seats[i] = null;
    } else if (p.stack >= 900 && RNG() < 0.08) {
      msgs.push(p.name + ' racks up $' + p.stack + ' and leaves.');
      G.seats[i] = null;
    } else if (RNG() < 0.01) {
      msgs.push(p.name + ' leaves the table.');
      G.seats[i] = null;
    }
  });
  const used = new Set(G.seats.filter(Boolean).map((p) => p.name));
  G.seats.forEach((p, i) => {
    if (!p && i !== 0 && RNG() < 0.6) {
      const mix = STYLE_MIX.cash[G.cfg.diff];
      const nb = newBot(pick(mix), pick([200, 300, 300, 300, 400, 500]), used);
      G.seats[i] = nb;
      G.cast.push({ name: nb.name, style: nb.style });
      msgs.push(nb.name + ' sits down with $' + nb.stack + '.');
    }
  });
  return msgs;
}
