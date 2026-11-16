import { UI, esc } from '../state.js';
import { cardHTML, cardTxt } from '../visuals.js';
import { posPhrase } from '../../game/coach.js';
import { G } from '../../game/state.js';

/* ================= history + replay ================= */
export function historyHTML() {
  const back =
    G && !G.over && (G.hand || UI.needRebuy)
      ? 'game'
      : G && G.over
        ? G.mode === 'cash'
          ? 'cashout'
          : 'result'
        : 'home';
  const recs = G ? G.records : [];
  return `<div class="screen"><div class="top"><button class="link" data-act="goto" data-s="${back}">‹ Back</button></div><h2>Hand history</h2>
  <p class="lede">Your last ${recs.length} hands this ${G && G.mode === 'cash' ? 'session' : 'game'}. Tap one to replay it step by step.</p>
  ${recs.length ? `<ul class="rows">${recs.map((r, i) => `<li><button data-act="replay" data-i="${i}"><span class="mini">${r.hole ? r.hole.map((c) => cardHTML(c)).join('') : '<span class="muted">sat out</span>'}</span><span class="grow"><b>Hand ${r.no}</b><br><span class="muted" style="font-size:13.5px">${r.blinds}${r.grades.length ? ' ' : ''}${r.grades.map((g) => `<i class="dot ${g.g}"></i>`).join('')}</span></span><span class="num ${r.net > 0 ? 'pos' : r.net < 0 ? 'neg' : 'muted'}">${r.net > 0 ? '+' : r.net < 0 ? '−' : ''}${r.mode === 'cash' ? '$' : ''}${Math.abs(r.net).toLocaleString()}</span></button></li>`).join('')}</ul>` : '<p>Play a few hands and they will show up here.</p>'}</div>`;
}
function evText(e, r) {
  const nm = r.names[e.s] || '';
  const cash = r.mode === 'cash';
  const f = (n) => (cash ? '$' : '') + n.toLocaleString();
  if (e.t === 'board')
    return `<b>${['', 'Flop', 'Turn', 'River'][e.st]}</b> <span class="num">${e.cards
      .slice(e.st === 1 ? 0 : -1)
      .map(cardTxt)
      .join(' ')}</span>`;
  const po = e.s === 0 ? 'post' : 'posts';
  if (e.t === 'sb') return `${esc(nm)} ${po} the small blind ${f(e.a)}`;
  if (e.t === 'bb') return `${esc(nm)} ${po} the big blind ${f(e.a)}`;
  if (e.t === 'ante') return `${esc(nm)} ${po} the ante ${f(e.a)}`;
  const you = e.s === 0;
  const w = (
    you
      ? {
          fold: 'fold',
          check: 'check',
          call: 'call ' + f(e.a || 0),
          bet: 'bet ' + f(e.a || 0),
          raise: 'raise to ' + f(e.a || 0),
        }
      : {
          fold: 'folds',
          check: 'checks',
          call: 'calls ' + f(e.a || 0),
          bet: 'bets ' + f(e.a || 0),
          raise: 'raises to ' + f(e.a || 0),
        }
  )[e.t];
  return `${esc(nm)} ${w}${e.allin ? ' (all-in)' : ''}`;
}
export function replayHTML() {
  const r = G.records[UI.rep.i];
  if (!r) return historyHTML();
  const f = UI.rep.f;
  const evs = r.events.slice(0, f);
  const board = [];
  for (const e of evs)
    if (e.t === 'board') {
      board.length = 0;
      board.push(...e.cards);
    }
  const done = f >= r.events.length;
  const gradeAt = {};
  r.grades.forEach((g) => (gradeAt[g.ev] = g));
  const lines = evs
    .map((e, k) => {
      const g = gradeAt[k];
      return `<li><span class="grow">${evText(e, r)} ${e.s != null && r.pos[e.s] ? `<span class="muted" style="font-size:13px">${r.pos[e.s]}</span>` : ''}</span>${g ? `<span class="badge ${g.g}">${g.g}</span>` : ''}</li>`;
    })
    .join('');
  const gNow = gradeAt[f - 1];
  return `<div class="screen"><div class="top"><button class="link" data-act="goto" data-s="history">‹ Hands</button><span class="muted">Hand ${r.no}, blinds ${r.blinds}</span></div>
  <div class="spot"><div class="hand">${r.hole ? r.hole.map((c) => cardHTML(c)).join('') : ''}</div><div class="bd">${[0, 1, 2, 3, 4].map((k) => (board[k] != null ? cardHTML(board[k]) : '<div class="slotx"></div>')).join('')}</div>
  <p style="text-align:center;margin:6px 0 0">You were ${r.pos[0] ? posPhrase(r.pos[0]) : 'not in this hand'}. Step ${f} of ${r.events.length}.</p></div>
  <div class="answers"><button class="ghost" data-act="rep" data-d="-1" ${f <= 0 ? 'disabled' : ''}>‹ Back</button><button class="primary" data-act="rep" data-d="1" ${done ? 'disabled' : ''}>Next ›</button><button class="ghost" data-act="rep" data-d="99" ${done ? 'disabled' : ''}>End</button></div>
  ${gNow ? `<div class="coach ${gNow.g}"><div class="head"><span class="badge ${gNow.g}">${gNow.g}</span></div><p>${esc(gNow.text)}</p></div>` : ''}
  <ul class="rows">${lines}</ul>
  ${
    done
      ? `<div class="result">${Object.keys(r.win)
          .map(
            (s) =>
              (+s === 0 ? 'You win ' : esc(r.names[s]) + ' wins ') +
              (r.mode === 'cash' ? '$' : '') +
              r.win[s].toLocaleString(),
          )
          .join(
            '. ',
          )}.${r.shows.length ? ' Shown: ' + r.shows.map((s) => esc(r.names[s.s]) + ' ' + s.hole.map(cardTxt).join(' ') + ' (' + s.desc.toLowerCase() + ')').join(', ') + '.' : ''}</div>`
      : ''
  }</div>`;
}
