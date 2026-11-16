import { APP, LIFE, UI, esc, money, signed } from '../state.js';
import { schoolCard } from './learn.js';

/* ================= lobby ================= */
export const KINDN = {
  push: 'Push or fold',
  callshove: 'Calling all-ins',
  defend: 'Facing a raise',
  open: 'Opening',
  postcall: 'Facing bets after the flop',
  postbet: 'Betting after the flop',
};
const FIX = {
  push: ['drill', 'push', 'Practice push or fold'],
  callshove: ['drill', 'call', 'Practice calling shoves'],
  defend: ['goto', 'ranges', 'Study the range charts'],
  open: ['drill', 'open', 'Practice open or fold'],
  postcall: ['drill', 'outs', 'Practice outs and odds'],
  postbet: ['drill', 'cbet', 'Practice c-bets'],
};
function coachNote() {
  const graded = Object.values(LIFE.acc).reduce((s, a) => s + (a.n || 0), 0);
  const ks = Object.keys(KINDN)
    .map((k) => ({ k, a: LIFE.acc[k] }))
    .filter((x) => x.a && x.a.n >= 8);
  if (!ks.length)
    return {
      text: graded
        ? 'A few more graded hands and the coach can tell you where you leak most.'
        : 'Sit in any game. The coach grades every decision you make and keeps track of where you leak.',
      fix: null,
    };
  ks.sort((x, y) => y.a.Leak / y.a.n - x.a.Leak / x.a.n);
  const w = ks[0],
    rate = Math.round((w.a.Leak / w.a.n) * 100);
  if (rate < 8)
    return {
      text: 'No big leaks in ' + graded + ' graded decisions. Move up to tougher tables or bigger fields.',
      fix: null,
    };
  return {
    text:
      'Your leakiest spot is ' +
      KINDN[w.k].toLowerCase() +
      ': ' +
      rate +
      '% of your ' +
      w.a.n +
      ' decisions there were leaks.',
    fix: FIX[w.k],
  };
}
function lifeLine() {
  const T = LIFE.tours,
    C = LIFE.cash;
  if (!T.length && !C.length) return '';
  const net = T.reduce((a, t) => a + t.prize - t.buyin, 0) + C.reduce((a, c) => a + c.net, 0);
  let n = 0,
    ok = 0;
  for (const a of Object.values(LIFE.acc)) {
    n += a.n || 0;
    ok += (a.Solid || 0) + (a.Close || 0);
  }
  return `<button class="mine" data-act="goto" data-s="stats"><span><small>Bankroll</small><b class="${net >= 0 ? 'pos' : 'neg'}">${signed(net)}</b></span><span><small>Games played</small><b>${T.length + C.length}</b></span><span><small>Sound decisions</small><b>${n ? Math.round((ok / n) * 100) + '%' : '–'}</b></span></button>`;
}
export function homeHTML() {
  const sv = APP.save && APP.save.G;
  const now = performance.now();
  if (UI.litAt == null) UI.litAt = now;
  const el = now - UI.litAt;
  const lit = el < 1500 ? ` lit" style="animation-delay:-${Math.round(el)}ms` : '';
  const resume = sv
    ? `<button class="resume" data-act="resume"><span class="rs"><b>${sv.mode === 'cash' ? 'Your $1/$3 seat is held' : 'Your ' + esc(fmtLabel(sv.cfg)) + ' is waiting'}</b><span>${sv.mode === 'cash' ? 'Stack ' + money(sv.seats[0].stack) + ', ' + sv.session.hands + ' hands in' : 'Hand ' + sv.handNo + ', ' + sv.seats[0].stack.toLocaleString() + ' chips'}</span></span><span class="go">Sit back down</span></button>`
    : '';
  const row = (act, attr, name, d, go, plain) =>
    `<button class="grow-row" data-act="${act}" ${attr}><b>${name}</b><span class="d">${d}</span><span class="go${plain ? ' plain' : ''}">${go}</span></button>`;
  const note = coachNote();
  return `<div class="screen">
  <h1 class="sign${lit}">Card Room</h1>
  <p class="tagline">No-limit hold'em against players who each have a style, with a coach on every decision.</p>
  ${resume}${schoolCard()}${lifeLine()}
  <div class="listhead">Games running</div>
  <div class="boardlist">
    ${row('setup', 'data-k="cash"', '$1/$3 No-Limit', 'Live cash game. Limpers, rake and rebuys.', 'Open seat')}
    ${row('setup', 'data-k="mtt"', 'Tournament', '9, 18 or 27 players. Tables break, payouts at the end.', 'Register')}
    ${row('setup', 'data-k="sng"', 'Sit &amp; Go', 'Heads-up, 6-max or 9-handed. Starts right away.', 'Register')}
    ${row('setup', 'data-k="sat"', 'Satellite', 'Top finishers win a seat. Survive, not accumulate.', 'Register')}
  </div>
  <div class="note"><b>Coach's note</b><p>${esc(note.text)}</p>${note.fix ? `<button data-act="${note.fix[0]}" data-${note.fix[0] === 'drill' ? 't' : 's'}="${note.fix[1]}">${note.fix[2]}</button>` : ''}</div>
  <div class="listhead">Practice</div>
  <div class="boardlist">
    ${row('goto', 'data-s="learn"', 'Poker school', 'New to the game? The rules, the hands and three guided hands.', '›', 1)}
    ${row('goto', 'data-s="drills"', 'Drills', 'Nine kinds of spots, one tap each, with the math.', '›', 1)}
    ${row('goto', 'data-s="ranges"', 'Range charts', 'Opens, shoves, calls and a range builder.', '›', 1)}
    ${row('goto', 'data-s="stats"', 'Your numbers', 'Results, bankroll and accuracy by spot.', '›', 1)}
    ${row('goto', 'data-s="settings"', 'Settings', 'Felt, deck, sounds, speed.', '›', 1)}
  </div></div>`;
}
export function fmtLabel(c) {
  return c.kind === 'cash'
    ? '$1/$3 cash game'
    : c.kind === 'sat'
      ? c.players + '-player satellite'
      : c.kind === 'sng'
        ? (c.seats === 2 ? 'heads-up' : c.seats === 6 ? '6-max' : '9-handed') + ' sit & go'
        : c.players + '-player tournament';
}
