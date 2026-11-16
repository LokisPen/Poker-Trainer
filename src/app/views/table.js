import { LIFE, SPEED, UI, cap, chips, esc, money, pctS, signed, tchips } from '../state.js';
import { tutDockHTML } from './learn.js';
import { fmtLabel } from './lobby.js';
import { cardHTML, chipsHTML, hueOf } from '../visuals.js';
import { best5, clamp, drawInfo, eval7, handClass, handName } from '../../core/cards.js';
import { bbTxt, coachSpot, pctTxt, posPhrase } from '../../game/coach.js';
import { legal, potTotal } from '../../game/engine.js';
import { aliveCount } from '../../game/session.js';
import { G, blinds, handsPerLevel, posLabel, unit } from '../../game/state.js';
import { GUIDED } from '../../tutorial/hands.js';

/* ================= the table ================= */
const TB = { cx: 50, cy: 48.5, rx: 41, ry: 39.5, K: 1.18 }; // seat ellipse in % of the table box; K = box height / width
function seatTh(i, n) {
  return Math.PI / 2 + (i * 2 * Math.PI) / n;
}
function seatXY(i, n) {
  if (i === 0) return { x: 50, y: 87.2 };
  const th = seatTh(i, n);
  return { x: TB.cx + TB.rx * Math.cos(th), y: TB.cy + TB.ry * Math.sin(th) };
}
/* where each seat's bet sits, in % of the table box: worked out per table size so a full table of bets clears
   the seats, the board, the pot and each other */
const BETPOS = {
  9: [
    [50, 70.5],
    [31, 67.8],
    [28, 61],
    [36, 32.2],
    [38, 24.6],
    [62, 24.6],
    [64, 32.2],
    [72, 61],
    [69, 67.8],
  ],
  6: [
    [50, 70.5],
    [33, 64.4],
    [36, 32.2],
    [50, 23.7],
    [64, 32.2],
    [67, 64.4],
  ],
  2: [
    [50, 70.5],
    [50, 23.7],
  ],
};
function betXY(i, n) {
  const t = BETPOS[n];
  if (t && t[i]) return { x: t[i][0], y: t[i][1] };
  if (i === 0) return { x: 50, y: 70.5 };
  const th = seatTh(i, n),
    c = Math.cos(th),
    s = Math.sin(th);
  if (Math.abs(s) < 0.3) return { x: 50 + 25.5 * Math.sign(c), y: 53.6 + 8 * s };
  return { x: 50 + (s < -0.8 ? 34 : 24.5) * c, y: 47.5 + (s < 0 ? 25 : 19) * s };
}
function lastActs() {
  const H = G.hand,
    o = {};
  if (!H) return o;
  for (const e of H.events) {
    if (e.t === 'board') {
      for (const k in o) if (o[k] !== 'Fold' && o[k] !== 'All-in') delete o[k];
      continue;
    }
    if (e.s == null) continue;
    const w = { fold: 'Fold', check: 'Check', call: 'Call', raise: 'Raise', bet: 'Bet' }[e.t];
    if (!w) continue;
    o[e.s] = e.allin ? 'All-in' : w;
  }
  return o;
}
export function sessNet() {
  return G.seats[0].stack - G.session.invested;
}
function clockHTML() {
  const B = blinds();
  if (G.mode === 'tour') {
    const left = handsPerLevel() - G.handsAtLevel;
    const alive = aliveCount();
    return `<button class="clock" data-act="sheet" data-t="info"><span><small>Level</small><b>${G.level + 1}</b></span><span><small>Blinds</small><b>${kfmt(B.sb)}/${kfmt(B.bb)}</b></span><span><small>Next level</small><b>${left}<i>hand${left === 1 ? '' : 's'}</i></b></span><span><small>Players</small><b>${alive}/${G.cfg.players}</b></span></button>`;
  }
  const net = sessNet();
  return `<button class="clock" data-act="sheet" data-t="info"><span><small>Game</small><b>$1/$3</b></span><span><small>Session</small><b class="${net >= 0 ? 'pos' : 'neg'}">${signed(net)}</b></span><span><small>Hand</small><b>${G.handNo}</b></span><span><small>Your stack</small><b>${Math.round(G.seats[0].stack / 3)} bb</b></span></button>`;
}
function kfmt(n) {
  return n >= 1000 ? n / 1000 + 'k' : String(n);
}
function winInfo() {
  const H = G.hand;
  if (!H || !H.done || !H.result) return null;
  const r = H.result;
  const ws = Object.keys(r.win)
    .map(Number)
    .sort((a, b) => r.win[b] - r.win[a]);
  if (!ws.length) return null;
  const sh = r.shows.find((s) => s.s === ws[0]);
  return { ws, sh, hl: sh && H.board.length === 5 ? new Set(best5([...sh.hole, ...H.board])) : null };
}
function bannerHTML(W) {
  const H = G.hand,
    r = H.result,
    ws = W.ws;
  const amts = ws.map((i) => r.win[i]);
  const split = ws.length > 1 && amts.every((a) => Math.abs(a - amts[0]) <= 1);
  if (split)
    return `${ws.map((i) => (i === 0 ? 'You' : esc(G.seats[i].name))).join(' and ')} split the pot${W.sh ? '<small>' + esc(handName(W.sh.v)) + '</small>' : ''}`;
  return `${ws[0] === 0 ? 'You win' : esc(G.seats[ws[0]].name) + ' wins'} ${tchips(amts[0])}${W.sh ? '<small>' + esc(handName(W.sh.v)) + '</small>' : ''}${
    ws.length > 1
      ? '<small>Side pot to ' +
        ws
          .slice(1)
          .map((i) => (i === 0 ? 'you' : esc(G.seats[i].name)))
          .join(', ') +
        '</small>'
      : ''
  }`;
}
export function gameHTML() {
  const H = G.hand,
    n = G.seats.length,
    la = lastActs(),
    W = winInfo();
  const showMap = {};
  if (H && H.result) for (const s of H.result.shows) showMap[s.s] = s;
  const dur = SPEED[LIFE.opt.speed] || 620;
  let seats = '',
    bets = '',
    fx = '';
  for (let i = 0; i < n; i++) {
    const p = G.seats[i],
      { x, y } = seatXY(i, n);
    if (!p || ((!H || !H.order.includes(i)) && p.stack <= 0)) {
      seats += `<div class="seat empty" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%"><div class="av">${G.mode === 'cash' ? 'open' : ''}</div></div>`;
      continue;
    }
    const inH = !!(H && H.order.includes(i)),
      turn = !!(H && !H.done && H.toAct === i),
      shown = !p.hero && inH && !p.folded && showMap[i];
    const fxv = `--fx:${(50 - x).toFixed(1)}cqw;--fy:${((44 - y) * TB.K).toFixed(1)}cqw;`,
      ord_ = inH ? H.order.indexOf(i) : 0;
    const hlc = (c) =>
      W && W.hl && H.result.sd ? (W.hl.has(c) && showMap[W.ws[0]] && i === W.ws[0] ? 'hl' : 'dim') : '';
    let cards = '';
    if (inH && !p.folded) {
      if (p.hero)
        cards = p.hole
          .map((c, k) =>
            cardHTML(
              c,
              W && W.hl && H.result.sd ? (W.ws[0] === 0 && W.hl.has(c) ? 'hl' : 'dim') : '',
              'h' + G.handNo + '-' + c,
              ord_ * 0.05 + k * 0.14,
              fxv,
            ),
          )
          .join('');
      else if (shown)
        cards = p.hole.map((c) => cardHTML(c, hlc(c), 'sd' + G.handNo + '-' + c, 0, '', 'turnin')).join('');
      else
        cards = [0, 1]
          .map((k) => cardHTML(-1, '', 'bk' + G.handNo + '-' + i + '-' + k, ord_ * 0.05 + k * 0.14, fxv))
          .join('');
    } else if (inH && p.hero && p.folded) cards = p.hole.map((c) => cardHTML(c, 'dim')).join('');
    else if (inH && p.folded) {
      const mk = 'mk' + G.handNo + '-' + i;
      if (!UI.seen.has(mk)) {
        UI.seen.add(mk);
        fx += `<div class="muck" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%;--tx:${((50 - x) * 0.8).toFixed(1)}cqw;--ty:${((44 - y) * TB.K * 0.8).toFixed(1)}cqw"><div class="cd back"></div><div class="cd back"></div></div>`;
      }
    }
    let say = '';
    const won = H && H.done && H.result && H.result.win[i];
    if (won) say = `<span class="say win">+${tchips(H.result.win[i])}</span>`;
    else if (p.allin && inH && !p.folded) say = `<span class="say allin">All-in</span>`;
    else if (la[i] && inH) say = `<span class="say${la[i] === 'Fold' ? ' fold' : ''}">${la[i]}</span>`;
    const sp = inH ? posLabel(i) : '';
    const dbtn =
      H && i === G.button
        ? `<span class="dbtn ${x < 50 || p.hero ? 'r' : 'l'}" aria-label="Dealer button">D</span>`
        : '';
    const cls =
      'seat' +
      (p.hero ? ' hero' : '') +
      (turn ? ' turn' : '') +
      (inH && p.folded ? ' folded' : '') +
      (shown ? ' show' : '') +
      (won ? ' win' : '');
    const plq = `<div class="plq"><span class="nm">${esc(p.name)}</span><span class="sk">${tchips(p.stack)}</span>${sp ? `<span class="spos">${sp}</span>` : ''}</div>`;
    if (p.hero)
      seats += `<div class="${cls}" style="left:${x}%;top:${y}%"><div class="hole">${cards}</div>${plq}${say}${dbtn}</div>`;
    else
      seats += `<div class="${cls}" style="left:${x.toFixed(1)}%;top:${y.toFixed(1)}%" data-act="sheet" data-t="pop" data-i="${i}" role="button" tabindex="0" aria-label="${esc(p.name)}${sp ? ', ' + sp : ''}, ${chips(p.stack)}. Open their stats">
      <div class="av" style="--h:${hueOf(p.name)}">${esc(p.name[0])}${turn ? `<svg class="ring" viewBox="0 0 36 36" style="--dur:${dur}ms" aria-hidden="true"><circle cx="18" cy="18" r="16.4" pathLength="100"/></svg>` : ''}</div><div class="hole">${cards}</div>${plq}${say}${dbtn}</div>`;
    if (inH && p.bet > 0 && !H.done) {
      const b = betXY(i, n);
      const k = 'b' + G.handNo + '-' + i + '-' + H.street + '-' + p.bet;
      const pop = !UI.betSeen.has(k);
      UI.betSeen.add(k);
      bets += `<div class="bet${pop ? ' pop' : ''}${b.x > 55 ? ' flip' : ''}" style="left:${b.x.toFixed(1)}%;top:${b.y.toFixed(1)}%;--fx:${((x - b.x) * 0.5).toFixed(1)}cqw;--fy:${((y - b.y) * TB.K * 0.5).toFixed(1)}cqw">${chipsHTML(p.bet, undefined, false, 1)}<b>${tchips(p.bet)}</b></div>`;
    }
  }
  let board = '';
  if (H)
    for (let k = 0; k < 5; k++) {
      const c = H.board[k];
      board +=
        c != null
          ? cardHTML(
              c,
              W && W.hl && H.result.sd ? (W.hl.has(c) ? 'hl' : 'dim') : '',
              'b' + G.handNo + '-' + c,
              k < 3 ? k * 0.09 : 0,
              '',
              'turnin',
            )
          : '<div class="cd slot"></div>';
    }
  const potNow = H && !H.done ? potTotal() - H.order.reduce((a, i) => a + G.seats[i].bet, 0) : 0;
  let mid = '';
  if (H && !H.done && potNow > 0)
    mid = `<div class="potline">${chipsHTML(potNow, undefined, false, 2)}<b>Pot ${tchips(potNow)}</b></div>`;
  else if (H && H.done && W) {
    mid = `<div class="banner">${bannerHTML(W)}</div>`;
    const fk = 'fly' + G.handNo;
    if (!UI.seen.has(fk)) {
      UI.seen.add(fk);
      const s = seatXY(W.ws[0], n);
      fx += `<div class="fly" style="--tx:${(s.x - 50).toFixed(1)}cqw;--ty:${((s.y - 55.6) * TB.K).toFixed(1)}cqw">${chipsHTML(H.result.win[W.ws[0]], undefined, false, 2)}</div>`;
    }
  }
  const tick = G.tut
    ? 'Poker school, ' + esc(GUIDED[G.tut.id].title.toLowerCase())
    : UI.msgs.length
      ? esc(UI.msgs[UI.msgs.length - 1])
      : G.mode === 'tour'
        ? esc(cap(fmtLabel(G.cfg))) + ', hand ' + G.handNo
        : 'Hand ' + G.handNo;
  return `<div class="screen"><div class="ghead"><button class="ic" data-act="menu" aria-label="${G.tut ? 'Back to Poker school' : 'Back to the lobby'}">‹</button>${clockHTML()}<button class="ic" data-act="sheet" data-t="menu" aria-label="Table menu">≡</button></div>
  <div class="ticker" aria-live="polite">${tick}</div>
  <div class="tablearea"><div class="tbl"><div class="rail"><div class="felt"><div class="feltline"></div><div class="feltmark">Card Room</div></div></div>
    ${seats}${bets}<div class="board">${board}</div>${mid}${fx}</div></div>
  ${dockHTML()}</div>`;
}
export function heroLive() {
  const H = G.hand;
  return !!(H && !H.done && H.order.includes(0) && !G.seats[0].folded);
}
function decisionKey() {
  const H = G.hand;
  return G.handNo + ':' + H.events.length;
}
function presets() {
  const H = G.hand,
    L = legal(0),
    p = G.seats[0],
    bb = H.bbAmt,
    pot = L.pot,
    out = [];
  const tc = L.toCall;
  const add = (lbl, to) => {
    to = clamp(Math.round(to / unit()) * unit(), L.minTo, L.maxTo);
    out.push([lbl, to]);
  };
  if (H.street === 0) {
    if (H.raises === 0) {
      if (G.mode === 'cash') {
        add('$10', 10);
        add('$12', 12 + 3 * H.limpers);
        add('$15', 15 + 3 * H.limpers);
      } else {
        add('2.2x', bb * 2.2 + bb * H.limpers);
        add('2.5x', bb * 2.5 + bb * H.limpers);
        add('3x', bb * 3 + bb * H.limpers);
      }
    } else {
      add('2.5x', H.curBet * 2.5);
      add('3x', H.curBet * 3);
      add('4x', H.curBet * 4);
    }
  } else {
    const base = p.bet + tc;
    for (const [l, f] of [
      ['⅓', 1 / 3],
      ['½', 0.5],
      ['¾', 0.75],
      ['Pot', 1],
    ])
      add(l, H.curBet === 0 ? pot * f : base + (pot + tc) * f);
  }
  out.push(['All-in', L.maxTo]);
  return out.filter((x, i, a) => a.findIndex((y) => y[1] === x[1]) === i);
}
function defaultRaise() {
  const H = G.hand,
    L = legal(0),
    bb = H.bbAmt;
  let to;
  if (H.street === 0)
    to = H.raises === 0 ? (G.mode === 'cash' ? 12 + 3 * H.limpers : bb * (2.2 + H.limpers)) : H.curBet * 3;
  else to = H.curBet === 0 ? L.pot * 0.6 : H.curBet * 2.8;
  return clamp(Math.round(to / unit()) * unit(), L.minTo, L.maxTo);
}
export function raiseLabel(to) {
  const L = legal(0),
    H = G.hand;
  if (to >= L.maxTo) return 'All-in<small>' + chips(L.maxTo) + '</small>';
  return (H.curBet === 0 ? 'Bet' : 'Raise to') + '<small>' + chips(to) + '</small>';
}
function spotLine() {
  const H = G.hand,
    p = G.seats[0];
  if (H.street === 0) return `<b>${cap(posPhrase(posLabel(0)))}</b>, ${bbTxt(p.stack + p.bet, H.bbAmt)}`;
  const d = drawInfo(p.hole, H.board);
  return `<b>${esc(handName(eval7([...p.hole, ...H.board])))}</b>${d.fd && d.sd ? ', flush and straight draws' : d.fd ? ', flush draw' : d.sd ? ', straight draw' : ''}`;
}
function bestWord(best, an) {
  if (best === 'fold') return 'Fold';
  if (best === 'passive') return an.check ? 'Check' : 'Call';
  return an.kind === 'push' || an.sizeHint === 'All-in' ? 'Shove all-in' : an.check ? 'Bet' : 'Raise';
}
function verdictHTML(wide) {
  const c = UI.coach;
  if (!c || c.mode !== 'grade') return '';
  const t = c.g === 'Solid' ? 'That is the play.' : 'Best was to ' + bestWord(c.an.best, c.an).toLowerCase() + '.';
  if (!wide)
    return `<button class="badge mini ${c.g}" data-act="sheet" data-t="coach" aria-label="Your last decision: ${c.g}. ${t} Open the coach's reasoning">${c.g}</button>`;
  return `<button class="verdict wide" data-act="sheet" data-t="coach" aria-label="${c.g}. ${t} Open the coach's reasoning"><span class="badge ${c.g}">${c.g}</span><span class="vt">${t}</span><span class="more">Why</span></button>`;
}
function dockHTML() {
  if (G.tut) return tutDockHTML();
  const H = G.hand,
    p = G.seats[0];
  if (G.mode === 'cash' && UI.needRebuy)
    return `<div class="dock"><div class="waitmsg"><span>You're out of chips. Rebuy for <b>${money(G.cfg.buyin)}</b> or cash out.</span></div>
    <button class="primary" data-act="rebuy">Rebuy ${money(G.cfg.buyin)}</button><div class="subacts"><button data-act="leave">Leave table</button></div></div>`;
  if (!H) return '<div class="dock"></div>';
  const undo = G.undo ? `<button class="tool" data-act="undo">Undo</button>` : '';
  if (H.done) {
    const heroIn = H.order.includes(0),
      net = heroIn ? p.net : 0;
    const res = heroIn
      ? `<div class="handres"><b class="${net > 0 ? 'pos' : net < 0 ? 'neg' : ''}">${net > 0 ? '+' + chips(net) : net < 0 ? '−' + chips(-net) : 'Even'}</b> this hand.${handSummary()}</div>`
      : `<div class="handres muted">You sat this one out.</div>`;
    const sub = [];
    if (G.mode === 'cash' && p.stack > 0 && p.stack < 500) sub.push(`<button data-act="topup">Top up to $500</button>`);
    if (G.mode === 'cash') sub.push(`<button data-act="leave">Cash out</button>`);
    return `<div class="dock"><div class="strip">${verdictHTML(true) || '<span class="spot-now"></span>'}${undo}</div>${res}${sub.length ? `<div class="subacts">${sub.join('')}</div>` : ''}<button class="primary" data-act="next">Deal the next hand</button></div>`;
  }
  if (H.toAct !== 0) {
    const out = !H.order.includes(0) || p.folded;
    return `<div class="dock"><div class="strip">${verdictHTML(true) || `<span class="spot-now">${out ? '' : spotLine()}</span>`}${undo}</div><div class="waitmsg"><span>${out ? 'You are out of this hand.' : p.allin ? 'You are all-in. Cards speak.' : '<b>' + esc(G.seats[H.toAct].name) + '</b> is thinking'}</span></div>${out || p.allin ? `<button class="ghost" style="margin:0" data-act="skip">Skip to the end of the hand</button>` : ''}</div>`;
  }
  const L = legal(0),
    k = decisionKey();
  if (UI.rkey !== k) {
    UI.rkey = k;
    UI.raiseTo = defaultRaise();
    UI.coach = UI.coach && UI.coach.mode === 'grade' ? UI.coach : null;
  }
  let odds = '';
  if (LIFE.opt.odds) {
    const a = analysis();
    odds = `<div class="odds">${a.eq != null ? 'Equity <b>' + pctS(a.eq) + '</b>' : handClass(p.hole) + ' is in the <b>' + pctTxt(a.pct) + '</b> of hands'}${a.need != null ? ', you need <b>' + pctS(a.need) + '</b> to call' : ''}</div>`;
  }
  const callLbl = L.check
    ? 'Check'
    : L.toCall >= p.stack
      ? 'All-in<small>' + chips(L.toCall) + '</small>'
      : 'Call<small>' + chips(L.toCall) + '</small>';
  const sizer =
    L.canRaise && L.maxTo > L.minTo
      ? `<div class="presets">${presets()
          .map(([l, v]) => `<button data-act="size" data-v="${v}">${l}</button>`)
          .join(
            '',
          )}</div><div class="sizer"><input id="slider" type="range" min="${L.minTo}" max="${L.maxTo}" step="${unit()}" value="${UI.raiseTo}" aria-label="Raise amount"></div>`
      : '';
  return `<div class="dock">${odds}<div class="strip">${verdictHTML(false)}<span class="spot-now">${spotLine()}</span><button class="tool" data-act="ask">Coach</button><button class="tool" data-act="undo" ${G.undo ? '' : 'disabled'}>Undo</button></div>
    ${sizer}<div class="acts">
    <button class="bfold" data-act="hero" data-t="fold" ${L.check ? 'disabled' : ''}>Fold</button>
    <button class="bcall" data-act="hero" data-t="call">${callLbl}</button>
    <button class="braise" id="rz" data-act="hero" data-t="raise" ${L.canRaise ? '' : 'disabled'}>${L.canRaise ? raiseLabel(UI.raiseTo) : 'Raise'}</button></div></div>`;
}
function handSummary() {
  const H = G.hand,
    p = G.seats[0];
  if (p.folded || H.board.length < 5 || !H.result.sd) return '';
  return ' You had ' + handName(eval7([...p.hole, ...H.board])).toLowerCase() + '.';
}
export function analysis() {
  const k = decisionKey();
  if (!UI.cache[k]) UI.cache = { [k]: coachSpot() };
  return UI.cache[k];
}
export function coachBody(c) {
  const an = c.an,
    best = an.best,
    bw = bestWord(best, an);
  let bar = '';
  if (an.eq != null && an.need != null) {
    const need = clamp(an.icmNeed != null ? an.icmNeed : an.need, 0, 1);
    bar = `<div class="eqbar" aria-hidden="true"><i style="width:${(an.eq * 100).toFixed(0)}%"></i><u style="left:${(need * 100).toFixed(0)}%"></u></div><div class="eqkey"><span>Your equity <b>${pctS(an.eq)}</b></span><span>Needed to call <b>${pctS(need)}</b></span></div>`;
  }
  const chose = { fold: 'fold', check: 'check', call: 'call', raise: 'raise', bet: 'bet' }[c.choice];
  const head =
    c.mode === 'ask'
      ? `<div class="head"><span class="badge Ask">Coach</span><span>${bw}${an.sizeHint && best === 'aggr' ? ' (' + esc(an.sizeHint) + ')' : ''}</span></div>`
      : `<div class="head"><span class="badge ${c.g}">${c.g}</span><span>You chose to ${chose}. ${c.g === 'Solid' ? 'That is the play.' : 'Best here: ' + bw.toLowerCase() + '.'}</span></div>`;
  return `<div class="coach ${c.mode === 'ask' ? 'Ask' : c.g}">${head}${an.lines.map((l) => `<p>${esc(l)}</p>`).join('')}${bar}</div>`;
}
