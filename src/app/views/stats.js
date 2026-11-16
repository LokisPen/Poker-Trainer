import { LIFE, UI, signed } from '../state.js';
import { ACCT } from '../storage.js';
import { DRILLS } from './drills.js';
import { KINDN } from './lobby.js';
import { cardHTML } from '../visuals.js';

/* ================= your numbers + settings ================= */
function bankChart() {
  const ev = [
    ...LIFE.tours.map((t) => ({ d: t.d, v: t.prize - t.buyin })),
    ...LIFE.cash.map((c) => ({ d: c.d, v: c.net })),
  ].sort((a, b) => a.d - b.d);
  if (ev.length < 2) return '<p class="muted">Finish two games and your bankroll line starts here.</p>';
  let run = 0;
  const pts = [0, ...ev.map((e) => (run += e.v))];
  const mn = Math.min(...pts),
    mx = Math.max(...pts);
  const W = 340,
    Hh = 140,
    l = 10,
    r = 52,
    t = 14,
    b = 14;
  const sx = (i) => l + (i * (W - l - r)) / (pts.length - 1),
    sy = (v) => (mx === mn ? Hh / 2 : t + ((mx - v) * (Hh - t - b)) / (mx - mn));
  const line = pts.map((v, i) => (i ? 'L' : 'M') + sx(i).toFixed(1) + ' ' + sy(v).toFixed(1)).join(' ');
  const z = sy(0),
    end = pts[pts.length - 1],
    col = end >= 0 ? 'var(--good)' : 'var(--bad)';
  return `<svg class="chart" viewBox="0 0 ${W} ${Hh}" role="img" aria-label="Bankroll over ${ev.length} games, now ${signed(end)}">
  <line x1="${l}" x2="${W - r}" y1="${z.toFixed(1)}" y2="${z.toFixed(1)}" stroke="var(--line)" stroke-dasharray="3 4"/>
  <path d="${line} L${sx(pts.length - 1).toFixed(1)} ${z.toFixed(1)} L${l} ${z.toFixed(1)} Z" fill="${col}" opacity=".14"/>
  <path d="${line}" fill="none" stroke="${col}" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>
  <circle cx="${sx(pts.length - 1).toFixed(1)}" cy="${sy(end).toFixed(1)}" r="4" fill="${col}"/>
  <text x="${W - r + 8}" y="${(sy(end) + 4).toFixed(1)}" style="fill:var(--bone);font-weight:700">${signed(end)}</text>
  ${Math.abs(sy(0) - sy(end)) > 14 ? `<text x="${W - r + 8}" y="${(z + 4).toFixed(1)}">$0</text>` : ''}
  </svg><p class="muted" style="font-size:13.5px">Running result across your last ${ev.length} tournaments and cash sessions, oldest on the left.</p>`;
}
function talliesBar(a) {
  return `<div class="bar" style="margin-top:6px"><i style="width:${(a.Solid / a.n) * 100}%;background:var(--good)"></i><i style="width:${(a.Close / a.n) * 100}%;background:var(--close)"></i><i style="width:${(a.Leak / a.n) * 100}%;background:var(--bad)"></i></div>`;
}
export function statsHTML() {
  const T = LIFE.tours,
    C = LIFE.cash;
  const buy = T.reduce((a, t) => a + t.buyin, 0),
    won = T.reduce((a, t) => a + t.prize, 0);
  const itm = T.filter((t) => t.prize > 0).length;
  const cn = C.reduce((a, c) => a + c.net, 0),
    ch = C.reduce((a, c) => a + c.hands, 0);
  const fmts = ['mtt', 'sng', 'sat']
    .map((k) => {
      const l = T.filter((t) => t.kind === k);
      if (!l.length) return '';
      const b = l.reduce((a, t) => a + t.buyin, 0),
        w = l.reduce((a, t) => a + t.prize, 0);
      return `<li><span class="grow">${{ mtt: 'Tournaments', sng: 'Sit & Gos', sat: 'Satellites' }[k]} (${l.length})</span><span class="num ${w - b >= 0 ? 'pos' : 'neg'}">${signed(w - b)}</span></li>`;
    })
    .join('');
  const acc = Object.keys(KINDN)
    .map((k) => {
      const a = LIFE.acc[k];
      if (!a || !a.n) return '';
      return `<li style="display:block"><div style="display:flex;justify-content:space-between"><span>${KINDN[k]}</span><span class="muted">${Math.round(((a.Solid + a.Close) / a.n) * 100)}% sound over ${a.n}</span></div>${talliesBar(a)}</li>`;
    })
    .join('');
  const dr = DRILLS.map(([k, t]) => {
    const d = LIFE.drills[k];
    return d && d.n
      ? `<li><span class="grow">${t}</span><span class="muted">${Math.round((d.c / d.n) * 100)}% over ${d.n}</span></li>`
      : '';
  }).join('');
  return `<div class="screen"><div class="top"><button class="link" data-act="goto" data-s="home">‹ Lobby</button></div><h2>Your numbers</h2>
  <h3>Bankroll</h3>${bankChart()}
  <h3>Tournaments</h3>${T.length ? `<div class="stats"><div><b>${T.length}</b><span>Played</span></div><div><b>${Math.round((itm / T.length) * 100)}%</b><span>Cashed</span></div><div><b class="${won - buy >= 0 ? 'pos' : 'neg'}">${buy ? Math.round(((won - buy) / buy) * 100) : 0}%</b><span>ROI</span></div></div><ul class="rows">${fmts}</ul>` : '<p class="muted">Finish a tournament, sit &amp; go or satellite and it shows up here.</p>'}
  <h3>$1/$3 cash</h3>${C.length ? `<div class="stats"><div><b>${C.length}</b><span>Sessions</span></div><div><b class="${cn >= 0 ? 'pos' : 'neg'}">${signed(cn)}</b><span>Net</span></div><div><b>${ch ? ((cn / 3 / ch) * 100).toFixed(1) : '0'}</b><span>bb per 100</span></div></div>` : '<p class="muted">Cash out of a session to log it here.</p>'}
  <h3>Coach accuracy by spot</h3>${acc ? `<ul class="rows">${acc}</ul>` : '<p class="muted">Play some hands to see where you leak.</p>'}
  <h3>Drills</h3>${dr ? `<ul class="rows">${dr}</ul>` : '<p class="muted">No drills yet.</p>'}
  <p class="hint">${ACCT ? 'Saved to your account, so your numbers and your game in progress follow you to your other devices.' : 'Saved in this browser only.'}</p>
  <button class="ghost" data-act="reset">${UI.resetArm ? 'Tap again to erase everything' : 'Reset all stats'}</button></div>`;
}
export function settingsHTML() {
  const o = LIFE.opt;
  const row = (k, label, opts, hint) =>
    `<div class="field"><label>${label}</label><div class="seg">${opts.map(([v, t]) => `<button class="${o[k] === v ? 'on' : ''}" data-act="setopt" data-k="${k}" data-v='${JSON.stringify(v)}'>${t}</button>`).join('')}</div>${hint ? `<div class="hint">${hint}</div>` : ''}</div>`;
  return `<div class="screen"><div class="top"><button class="link" data-act="goto" data-s="home">‹ Lobby</button></div><h2>Settings</h2>
  <div class="spot" style="margin-top:10px"><div class="hand" style="margin:4px 0">${cardHTML(51)}${cardHTML(38)}${cardHTML(25)}${cardHTML(12)}${cardHTML(-1)}</div></div>
  ${row('felt', 'Felt', [
    ['green', 'Green'],
    ['blue', 'Blue'],
    ['wine', 'Burgundy'],
  ])}
  ${row(
    'four',
    'Deck',
    [
      [false, 'Two-color'],
      [true, 'Four-color'],
    ],
    'Four-color makes diamonds blue and clubs green, so flushes are easier to spot.',
  )}
  ${row(
    'bb',
    'Stacks and bets on the table',
    [
      [false, 'In chips'],
      [true, 'In big blinds'],
    ],
    'Big blinds make stack depth obvious, which is what tournament decisions run on.',
  )}
  ${row(
    'odds',
    'Show equity while deciding',
    [
      [false, 'Off'],
      [true, 'On'],
    ],
    'Leave it off to test yourself; turn it on while learning.',
  )}
  ${row('speed', 'Opponent speed', [
    ['slow', 'Slow'],
    ['normal', 'Normal'],
    ['fast', 'Fast'],
  ])}
  ${row('auto', 'Auto-deal when you are not in the hand', [
    [false, 'Off'],
    [true, 'On'],
  ])}
  ${row(
    'sound',
    'Sounds',
    [
      [false, 'Off'],
      [true, 'On'],
    ],
    "Chips, cards and a ping on your turn. Your phone's silent switch still mutes them.",
  )}</div>`;
}
