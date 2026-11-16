import { LIFE, UI, cap, chips, esc, money, signed } from '../state.js';
import { gridHTML } from './grid.js';
import { fmtLabel } from './lobby.js';
import { analysis, coachBody, heroLive, sessNet } from './table.js';
import { CUM, startPct } from '../../core/cards.js';
import { bbTxt, pctTxt } from '../../game/coach.js';
import { aliveCount, ord } from '../../game/session.js';
import { G, LEVELS, blinds, handsPerLevel } from '../../game/state.js';

/* ================= sheets over the table ================= */
function sheetWrap(title, body) {
  const n = UI.sheetNew ? ' enter' : '';
  return `<div class="veil${n}" data-act="closesheet"><div class="sheet${n}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="top"><h2>${esc(title)}</h2><button class="link" data-act="closesheet" data-x="1">Close</button></div>${body}</div></div>`;
}
export function sheetHTML() {
  const S = UI.sheet;
  if (S.t === 'pop') return popHTML(S.i);
  if (S.t === 'coach') {
    const c = UI.coach;
    if (!c) return '';
    return sheetWrap('Why ' + c.g.toLowerCase() + '?', coachBody(c));
  }
  if (S.t === 'ask') {
    const H = G.hand;
    if (!H || H.done || H.toAct !== 0) return '';
    return sheetWrap('The coach says', coachBody({ mode: 'ask', an: analysis() }));
  }
  if (S.t === 'info') return infoHTML();
  if (S.t === 'menu') {
    const o = LIFE.opt;
    const tog = (k, label) =>
      `<div class="setrow"><span>${label}</span><div class="seg"><button class="${o[k] ? '' : 'on'}" data-act="setopt" data-k="${k}" data-v="false">Off</button><button class="${o[k] ? 'on' : ''}" data-act="setopt" data-k="${k}" data-v="true">On</button></div></div>`;
    return sheetWrap(
      'Table menu',
      `<button class="ghost" data-act="goto" data-s="history">Hand history</button>
      ${tog('bb', 'Show stacks in big blinds')}${tog('odds', 'Show equity while deciding')}${tog('four', 'Four-color deck')}${tog('sound', 'Sounds')}${tog('auto', 'Auto-deal when you fold')}
      <div class="setrow"><span>Felt</span><div class="seg">${[
        ['green', 'Green'],
        ['blue', 'Blue'],
        ['wine', 'Burgundy'],
      ]
        .map(
          ([v, t]) =>
            `<button class="${(o.felt || 'green') === v ? 'on' : ''}" data-act="setopt" data-k="felt" data-v='"${v}"'>${t}</button>`,
        )
        .join('')}</div></div>
      <div class="setrow"><span>Opponent speed</span><div class="seg">${[
        ['slow', 'Slow'],
        ['normal', 'Normal'],
        ['fast', 'Fast'],
      ]
        .map(
          ([v, t]) =>
            `<button class="${o.speed === v ? 'on' : ''}" data-act="setopt" data-k="speed" data-v='"${v}"'>${t}</button>`,
        )
        .join('')}</div></div>
      ${G.mode !== 'cash' ? '' : heroLive() ? '<p class="muted">You can cash out once this hand is over.</p>' : '<button class="ghost" data-act="leave">Cash out and leave the table</button>'}<button class="ghost" data-act="menu">${G.tut ? 'Back to Poker school' : 'Back to the lobby (your seat is saved)'}</button>`,
    );
  }
  return '';
}
function infoHTML() {
  if (G.mode === 'cash') {
    const S = G.session,
      net = sessNet();
    return sheetWrap(
      '$1/$3 No-Limit',
      `<div class="stats"><div><b class="${net >= 0 ? 'pos' : 'neg'}">${signed(net)}</b><span>Session</span></div><div><b>${S.hands}</b><span>Hands</span></div><div><b>${money(S.rake)}</b><span>Rake paid</span></div></div>
    <p class="muted">You have bought in for ${money(S.invested)} in total. Blinds are $1/$3, the table takes $100 to $500, and ${G.cfg.rake ? 'the house rakes 10% up to $5 from pots that see a flop' : 'there is no rake'}.</p>
    <p class="muted">Tap any player at the table to see how they have been playing.</p>`,
    );
  }
  const alive = aliveCount(),
    B = blinds(),
    c = G.cfg,
    total = c.players * G.startStack,
    avg = total / alive,
    me = G.seats[0].stack;
  const paid = G.pays.length,
    left = handsPerLevel() - G.handsAtLevel;
  const nx = LEVELS[Math.min(G.level + 1, LEVELS.length - 1)];
  const pays =
    c.kind === 'sat'
      ? `<p>The top ${c.seatsWon} each win a ${money(G.pays[0])} seat. ${alive > c.seatsWon ? alive - c.seatsWon + ' more must bust.' : ''}</p>`
      : `<ul class="rows">${G.pays.map((p, i) => `<li><span class="grow">${ord(i + 1)}</span><b class="num">${money(p)}</b></li>`).join('')}</ul><p class="muted">${alive > paid ? alive - paid + ' more out until the money.' : 'Everyone left is in the money.'}</p>`;
  const sched = [1, 2, 3]
    .map((k) => {
      const L = LEVELS[Math.min(G.level + k, LEVELS.length - 1)];
      return `<li><span class="grow">Level ${G.level + 1 + k}</span><span class="num">${L[0].toLocaleString()}/${L[1].toLocaleString()}${G.level + k >= 2 ? ', ante ' + L[1].toLocaleString() : ''}</span></li>`;
    })
    .join('');
  return sheetWrap(
    cap(fmtLabel(c)),
    `<div class="stats"><div><b>${alive}/${c.players}</b><span>Players left</span></div><div><b>${Math.round(avg / B.bb)} bb</b><span>Average stack</span></div><div><b>${Math.round(me / B.bb)} bb</b><span>Your stack</span></div></div>
    <p class="muted">Level ${G.level + 1}: blinds ${B.sb.toLocaleString()}/${B.bb.toLocaleString()}${B.ante ? ' with a ' + B.ante.toLocaleString() + ' big-blind ante' : ''}. Up to ${nx[0].toLocaleString()}/${nx[1].toLocaleString()} in ${left} hand${left === 1 ? '' : 's'}.</p>
    <h3>Payouts</h3>${pays}<h3>Coming levels</h3><ul class="rows">${sched}</ul>`,
  );
}
function popHTML(i) {
  const p = G.seats[i];
  if (!p) return '';
  const s = p.st,
    H = G.hand;
  const vp = s.h ? s.v / s.h : 0,
    pf = s.h ? s.p / s.h : 0,
    af = s.agC ? s.agB / s.agC : s.agB;
  let read;
  if (s.h < 8) read = 'Not enough hands yet for a solid read. Watch a few more orbits.';
  else {
    const parts = [];
    parts.push(
      vp > 0.45 ? 'plays a lot of hands' : vp < 0.17 ? 'plays very few hands' : 'plays a normal number of hands',
    );
    parts.push(
      pf < vp * 0.35
        ? 'mostly calls instead of raising'
        : pf > vp * 0.7
          ? 'raises most hands they play'
          : 'mixes raises and calls',
    );
    parts.push(
      af > 2.5
        ? 'and is aggressive after the flop'
        : af < 0.8
          ? 'and is passive after the flop (bets usually mean strength)'
          : 'and is balanced after the flop',
    );
    read = p.name + ' ' + parts.join(', ') + '.';
  }
  let rng = '';
  if (H && !H.done && H.order.includes(i) && !p.folded && p.est) {
    const r = p.est;
    rng = `<h3>Likely range right now</h3><p class="muted">From their position, their action this hand and your read: ${r.hi >= 0.995 && r.lo < 0.01 ? 'they could have any two cards' : r.lo > 0.01 ? 'roughly the ' + pctTxt(r.hi) + ', minus the very best hands (they would have re-raised those)' : 'roughly the ' + pctTxt(r.hi) + ' of hands'}.</p>${gridHTML(
      (ci) => {
        const a = startPct(ci),
          b = CUM[ci];
        return a < r.hi && b > r.lo ? 'in' : '';
      },
    )}`;
  }
  return sheetWrap(
    p.name,
    `<p class="muted">Stack ${chips(p.stack)}${H ? ' (' + bbTxt(p.stack, H.bbAmt) + ')' : ''}</p>
  <div class="stats"><div><b>${s.h}</b><span>Hands</span></div><div><b>${Math.round(vp * 100)}%</b><span>Plays (VPIP)</span></div><div><b>${Math.round(pf * 100)}%</b><span>Raises preflop</span></div></div>
  <div class="stats"><div><b>${af.toFixed(1)}</b><span>Aggression</span></div><div><b>${s.sd}</b><span>Showdowns</span></div><div><b>${s.h ? Math.round((s.sd / s.h) * 100) : 0}%</b><span>Went to showdown</span></div></div>
  <p>${esc(read)}</p>${rng}`,
  );
}
