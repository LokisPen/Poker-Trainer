import { LIFE, UI, chips, esc, pctS } from '../state.js';
import { tutProgress } from '../tutor.js';
import { gridHTML, setPct } from './grid.js';
import { raiseLabel } from './table.js';
import { cardHTML, cardTxt } from '../visuals.js';
import { cardOf, startPct } from '../../core/cards.js';
import { posPhrase } from '../../game/coach.js';
import { legal } from '../../game/engine.js';
import { G, OPEN } from '../../game/state.js';
import { ITEMS, itemAfter } from '../../tutorial/course.js';
import { GLOSSARY } from '../../tutorial/glossary.js';
import { GUIDED } from '../../tutorial/hands.js';
import { COURSE, LESSONS, RANKS, STARTERS, STUDENT } from '../../tutorial/lessons.js';

/* ================= poker school: screens ================= */
/* lesson text: {As} is drawn as a card, {student} is the student's name. The text is ours, so its markup is trusted. */
const rich = (s) => s.replace(/\{student\}/g, STUDENT).replace(/\{([2-9TJQKA][shdc])\}/g, (m, c) => cardTxt(cardOf(c)));
const rxHTML = (t) => `<aside class="rx"><b>Clinical correlation</b><p>${rich(t)}</p></aside>`;
const cardsRow = (list) => list.map((c) => cardHTML(cardOf(c))).join('');

/* the card on the lobby: shown to a newcomer, and to anyone part-way through the course */
export function schoolCard() {
  const P = tutProgress(),
    played = LIFE.tours.length + LIFE.cash.length;
  if (!P.next || (!P.done && played)) return '';
  return `<button class="resume school" data-act="goto" data-s="learn"><span class="rs"><b>${P.done ? 'Poker school' : 'New to poker, ' + esc(STUDENT) + '?'}</b><span>${P.done ? P.done + ' of ' + P.total + ' done. Next: ' + esc(P.next.title) : 'Start with Poker school: the rules, the hands and three guided practice hands.'}</span></span><span class="go">${P.done ? 'Continue' : 'Start here'}</span></button>`;
}

export function learnHTML() {
  const P = tutProgress();
  const row = (it) => {
    const done = LIFE.tut.done[it.key];
    return `<button class="grow-row${done ? ' done' : ''}" data-act="item" data-key="${it.key}"><b>${esc(it.title)}</b><span class="d">${esc(it.sub)}</span>${it.kind === 'hand' ? `<span class="go">${done ? 'Replay' : 'Play'}</span>` : '<span class="go plain">›</span>'}</button>`;
  };
  const parts = COURSE.map(
    ([name], pi) =>
      `<div class="listhead">Part ${pi + 1}: ${esc(name)}</div><div class="boardlist">${ITEMS.filter(
        (it) => it.part === pi,
      )
        .map(row)
        .join('')}</div>`,
  ).join('');
  const lead = P.next
    ? `<button class="primary" data-act="item" data-key="${P.next.key}">${P.done ? 'Continue' : 'Start'}: ${esc(P.next.title)}</button>`
    : `<div class="note"><b>Course complete</b><p>You have seen one and done two. Everything stays open here if you want to look something up.</p></div>`;
  return `<div class="screen learn"><div class="top"><button class="link" data-act="goto" data-s="home">‹ Lobby</button><span class="muted">${P.done} of ${P.total} done</span></div>
  <h2>Poker school</h2>
  <p class="lede">${esc(STUDENT)}, this takes you from never having played to sitting in your first tournament: ten short lessons and three guided hands at a real table. About half an hour, best done in order.</p>
  <div class="bar" role="progressbar" aria-valuemin="0" aria-valuemax="${P.total}" aria-valuenow="${P.done}" aria-label="Course progress"><i style="width:${(P.done / P.total) * 100}%;background:var(--good)"></i></div>
  ${lead}${parts}
  <div class="listhead">Reference</div>
  <div class="boardlist"><button class="grow-row" data-act="goto" data-s="glossary"><b>Glossary</b><span class="d">Every piece of jargon the coach uses, in plain words.</span><span class="go plain">›</span></button></div></div>`;
}

function quizHTML(q, i) {
  const sel = UI.les.q[i],
    done = sel != null;
  return `<div class="quiz"><p class="qq">${rich(q.q)}</p><div class="opts">${q.opts.map((o, k) => `<button class="${done ? (k === q.a ? 'right' : k === sel ? 'wrong' : '') : ''}" data-act="quiz" data-i="${i}" data-v="${k}" ${done ? 'disabled' : ''}>${rich(o)}</button>`).join('')}</div>
  ${done ? `<p class="why"><b class="${sel === q.a ? 'pos' : 'neg'}">${sel === q.a ? 'Right.' : 'Not quite.'}</b> ${rich(q.why)}</p>` : ''}</div>`;
}
function blockHTML(b, i) {
  const [t, a, c] = b;
  if (t === 'p') return `<p>${rich(a)}</p>`;
  if (t === 'h') return `<h3>${esc(a)}</h3>`;
  if (t === 'ul' || t === 'ol') return `<${t} class="pts">${a.map((x) => `<li>${rich(x)}</li>`).join('')}</${t}>`;
  if (t === 'dl') return `<dl class="defs">${a.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${rich(v)}</dd>`).join('')}</dl>`;
  if (t === 'key') return `<div class="note keypt"><b>Key point</b><p>${rich(a)}</p></div>`;
  if (t === 'rx') return rxHTML(a);
  if (t === 'cards')
    return `<div class="spot demo"><div class="bd">${cardsRow(a)}</div>${c ? `<p>${rich(c)}</p>` : ''}</div>`;
  if (t === 'streets')
    return `<div class="spot demo"><div class="groups"><div><div class="bd">${cardsRow(['Kd', 'Jc', '4h'])}</div><small>Flop</small></div><div><div class="bd">${cardsRow(['7s'])}</div><small>Turn</small></div><div><div class="bd">${cardsRow(['Ac'])}</div><small>River</small></div></div></div>`;
  if (t === 'ex')
    return `<div class="spot demo"><div class="groups small"><div><div class="bd">${cardsRow(a.hole)}</div><small>Your cards</small></div><div><div class="bd">${cardsRow(a.board)}</div><small>The board</small></div></div>${a.caption ? `<p>${rich(a.caption)}</p>` : ''}</div>`;
  if (t === 'ranks')
    return `<ol class="ladder">${RANKS.map(([n, d, cs], k) => `<li><span class="no">${k + 1}</span><span class="what"><b>${n}</b><small>${d}</small></span><span class="mini">${cardsRow(cs)}</span></li>`).join('')}</ol>`;
  if (t === 'openchart') {
    const pos = UI.rng.pos,
      test = (ci) => (startPct(ci) < OPEN[pos] ? 'in' : '');
    return `<div class="seg">${['UTG', 'UTG+1', 'MP', 'LJ', 'HJ', 'CO', 'BTN', 'SB'].map((x) => `<button class="${pos === x ? 'on' : ''}" data-act="rset" data-k="pos" data-v="${x}">${x}</button>`).join('')}</div>
    ${gridHTML(test)}<p class="muted">Green: raise if nobody has raised before you. Grey: fold. That is ${pctS(setPct(test) / 1326)} of all hands ${posPhrase(pos).replace(/^(in|on) /, 'from ')}. Along the diagonal are the pairs; above it the suited hands, below it the offsuit ones.</p>`;
  }
  if (t === 'starters')
    return `<dl class="defs">${STARTERS.map((s) => `<dt>${esc(s.label)}</dt><dd>${esc(s.text)}</dd>`).join('')}</dl>`;
  if (t === 'grades')
    return `<dl class="defs grades"><dt><span class="badge Solid">Solid</span></dt><dd>The best play, or as good as.</dd><dt><span class="badge Close">Close</span></dt><dd>Reasonable. Another play was slightly better.</dd><dt><span class="badge Leak">Leak</span></dt><dd>A mistake that costs chips over time.</dd></dl>`;
  if (t === 'quiz') return quizHTML(a, i);
  if (t === 'go') return `<button class="ghost" data-act="drill" data-t="${c}" data-from="lesson">${esc(a)}</button>`;
  return '';
}
const nextLabel = (nx) =>
  nx ? (nx.kind === 'hand' ? 'Next: play a guided hand' : 'Next: ' + esc(nx.title)) : 'Back to Poker school';
export function lessonHTML() {
  const L = LESSONS.find((l) => l.id === UI.les.id),
    n = LESSONS.indexOf(L) + 1,
    nx = itemAfter('lesson:' + L.id);
  const cta = L.cta
    ? `<button class="primary" data-act="${L.cta[1]}">${esc(L.cta[0])}</button>`
    : `<button class="primary" data-act="lesdone">${nextLabel(nx)}</button>`;
  return `<div class="screen lesson"><div class="top"><button class="link" data-act="goto" data-s="learn">‹ Poker school</button><span class="muted">Lesson ${n} of ${LESSONS.length}</span></div>
  <h2>${esc(L.title)}</h2>${L.body.map(blockHTML).join('')}${cta}</div>`;
}
export function glossaryHTML() {
  return `<div class="screen lesson"><div class="top"><button class="link" data-act="goto" data-s="learn">‹ Poker school</button></div><h2>Glossary</h2>
  <p class="lede">Poker has its own language. These are the words this app and its coach use.</p>
  <dl class="defs gloss">${GLOSSARY.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl></div>`;
}

/* the action bar during a guided hand: what the coach says, and only the move the script asks for */
export function tutDockHTML() {
  const H = G.hand,
    g = GUIDED[G.tut.id],
    n = g.steps.length,
    i = Math.min(G.tut.i, n - 1),
    st = g.steps[i];
  const bar = `<div class="tutbar"><span>${esc(g.title)}</span><i><u style="width:${Math.round(((i + 1) / n) * 100)}%"></u></i></div>`;
  const say = st.say
    ? `<div class="tutsay"><p>${rich(st.say)}</p>${st.rx ? `<p class="rxline"><b>Clinical correlation</b> ${rich(st.rx)}</p>` : ''}</div>`
    : '';
  if (st.bot) {
    const p = G.seats[H.toAct];
    return `<div class="dock tut">${bar}<div class="waitmsg"><span>${p ? '<b>' + esc(p.name) + '</b> is thinking' : ''}</span></div></div>`;
  }
  if (st.hero) {
    const want = st.hero.t,
      L = legal(0);
    const btn = (cls, on, label) =>
      `<button class="${cls}${on ? ' cue' : ''}" ${on ? 'data-act="tuthero"' : 'disabled'}>${label}</button>`;
    return `<div class="dock tut">${bar}${say}<div class="acts">${btn('bfold', want === 'fold', 'Fold')}
    ${btn('bcall', want === 'call' || want === 'check', L.check ? 'Check' : 'Call<small>' + chips(L.toCall) + '</small>')}
    ${btn('braise', want === 'raise', want === 'raise' ? raiseLabel(st.hero.to) : L.check ? 'Bet' : 'Raise')}</div></div>`;
  }
  if (i === n - 1) {
    const nx = itemAfter('hand:' + G.tut.id);
    return `<div class="dock tut">${bar}${say}<button class="primary" data-act="tutdone">${nextLabel(nx)}</button>
    <div class="subacts"><button data-act="guided" data-id="${G.tut.id}">Play it again</button><button data-act="goto" data-s="learn">Poker school</button></div></div>`;
  }
  return `<div class="dock tut">${bar}${say}<button class="primary" data-act="tutnext">Continue</button></div>`;
}
