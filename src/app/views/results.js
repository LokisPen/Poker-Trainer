import { esc, money, signed } from '../state.js';
import { KINDN } from './lobby.js';
import { sessNet } from './table.js';
import { ord } from '../../game/session.js';
import { G, STYLES } from '../../game/state.js';

function revealList() {
  const seen = new Set();
  const ps = (G.cast || []).filter((p) => !seen.has(p.name) && seen.add(p.name));
  return `<ul class="rows">${ps.map((p) => `<li><span class="grow"><b>${esc(p.name)}</b></span><span class="muted">${STYLES[p.style].label}</span></li>`).join('')}</ul>`;
}
function talliesHTML(t) {
  const n = t.Solid + t.Close + t.Leak;
  if (!n) return '<p class="muted">No graded decisions.</p>';
  return `<div class="bar" aria-hidden="true"><i style="width:${(t.Solid / n) * 100}%;background:var(--good)"></i><i style="width:${(t.Close / n) * 100}%;background:var(--close)"></i><i style="width:${(t.Leak / n) * 100}%;background:var(--bad)"></i></div>
  <p class="muted" style="font-size:14.5px">${n} decisions: ${t.Solid} solid, ${t.Close} close, ${t.Leak} leaks.</p>`;
}
function leaksHTML() {
  if (!G.leaks.length) return '<p class="muted">No leaks flagged. Nice.</p>';
  return `<ul class="rows">${G.leaks
    .map((l) => {
      const ri = G.records.findIndex((r) => r.no === l.no);
      return `<li><button data-act="${ri >= 0 ? 'replay' : 'noop'}" data-i="${ri}"><span class="grow"><b>Hand ${l.no}</b>: ${KINDN[l.kind] || ''}<br><span class="muted" style="font-size:14px">You chose to ${l.act}; the coach preferred ${{ fold: 'folding', passive: 'checking or calling', aggr: 'betting or raising' }[l.best]}.</span></span><span>›</span></button></li>`;
    })
    .join('')}</ul>`;
}
export function resultHTML() {
  const c = G.cfg,
    pl = G.heroPlace,
    prize = G.heroPrize;
  const roi = prize - c.buyin;
  const head =
    c.kind === 'sat'
      ? prize
        ? 'You won a seat'
        : 'Out in ' + ord(pl) + '. No seat this time'
      : pl === 1
        ? 'You won the whole thing'
        : 'You finished ' + ord(pl) + ' of ' + c.players;
  return `<div class="screen"><h1 class="sign" style="font-size:clamp(34px,10.5vw,52px);margin-top:26px">${head}</h1><p class="lede">${prize ? 'Prize ' + money(prize) + ' on a ' + money(c.buyin) + ' buy-in (' + signed(roi) + ').' : 'Buy-in lost: ' + money(c.buyin) + '.'} ${G.handNo} hands played.</p>
  <h3>Your decisions</h3>${talliesHTML(G.tally)}
  <h3>Biggest leaks</h3>${leaksHTML()}
  <h3>Who you played</h3>${revealList()}
  <button class="primary" data-act="again">Play another</button><button class="ghost" data-act="goto" data-s="history">Review hands</button><button class="ghost" data-act="goto" data-s="home">Lobby</button></div>`;
}
export function cashoutHTML() {
  const S = G.session,
    net = sessNet();
  const bb100 = S.hands ? (net / 3 / S.hands) * 100 : 0;
  return `<div class="screen"><h1 class="sign" style="font-size:clamp(34px,10.5vw,52px);margin-top:26px">${net >= 0 ? 'Up ' + money(net) : 'Down ' + money(-net)}</h1>
  <div class="stats"><div><b>${S.hands}</b><span>Hands</span></div><div><b>${bb100 >= 0 ? '+' : ''}${bb100.toFixed(1)}</b><span>bb per 100</span></div><div><b>${money(S.rake)}</b><span>Rake paid</span></div></div>
  <p class="lede">You bought in for ${money(S.invested)} total. Live $1/$3 swings are big: even a strong player can lose 100 big blinds in a session, so judge yourself on the leaks below and not the result.</p>
  <h3>Your decisions</h3>${talliesHTML(G.tally)}<h3>Biggest leaks</h3>${leaksHTML()}<h3>Who was at the table</h3>${revealList()}
  <button class="primary" data-act="again">Sit in a new session</button><button class="ghost" data-act="goto" data-s="history">Review hands</button><button class="ghost" data-act="goto" data-s="home">Lobby</button></div>`;
}
