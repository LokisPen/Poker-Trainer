import { render } from '../router.js';
import { sfx } from '../sound.js';
import { LIFE, UI, cap, esc, pctS } from '../state.js';
import { store } from '../storage.js';
import { cardHTML } from '../visuals.js';
import { RN, RN1, best5, catOf, eval7, handClass, handName, handPct } from '../../core/cards.js';
import { pctTxt, posPhrase } from '../../game/coach.js';
import { drillAnswer, genDrill } from '../../game/drills.js';

/* ================= drills ================= */
export const DRILLS = [
  ['name', 'What do you have?', 'Beginner. Seven cards on the table: name your best five-card hand.'],
  ['wins', 'Who wins?', 'Beginner. Two hands and a full board: who takes the pot?'],
  ['open', 'Open or fold', 'Folded to you, deep stacks. Is this hand an open from this seat?'],
  ['push', 'Push or fold', 'Folded to you with a short stack. Shove or fold?'],
  ['call', 'Call the shove', 'Someone shoves into your big blind.'],
  ['icm', 'Bubble decisions', 'Four left, three paid. Is calling worth it in dollars?'],
  ['outs', 'Outs and odds', 'You have a draw and they bet. Does the price work?'],
  ['cbet', 'C-bet the flop', 'You raised, the big blind called. Bet small, bet big, or check?'],
  ['river', 'River bluff-catch', 'They bet the river. Call or fold with one pair?'],
];
export function drillsHTML() {
  const acc = (k) => {
    const d = LIFE.drills[k];
    return d && d.n
      ? `${Math.round((100 * d.c) / d.n)}% right over ${d.n}${d.best ? ', best streak ' + d.best : ''}`
      : 'Not tried yet';
  };
  return `<div class="screen"><div class="top"><button class="link" data-act="goto" data-s="home">‹ Lobby</button></div><h2>Drills</h2>
  <p class="lede">Quick, repeatable spots with an instant answer and the math behind it.</p>
  <div class="boardlist">${DRILLS.map(([k, t, d]) => `<button class="grow-row drillrow" data-act="drill" data-t="${k}"><b>${t}</b><span class="d">${d}</span><span class="acc">${acc(k)}</span><span class="go plain" style="grid-row:1/4">›</span></button>`).join('')}</div></div>`;
}
export function newDrill(t) {
  let sp = null;
  for (let k = 0; k < 6 && !sp; k++) sp = genDrill(t);
  UI.dr = { type: t, spot: sp, ans: null, streak: UI.dr && UI.dr.type === t ? UI.dr.streak : 0 };
  UI.screen = 'drill';
  render();
}
export function answerDrill(v) {
  const d = UI.dr;
  if (d.ans) return;
  d.ans = v;
  d.g = drillAnswer(d.spot, v);
  const L = (LIFE.drills[d.type] = LIFE.drills[d.type] || { n: 0, c: 0, best: 0 });
  L.n++;
  if (d.g !== 'Leak') {
    L.c++;
    d.streak++;
    L.best = Math.max(L.best || 0, d.streak);
  } else d.streak = 0;
  store.set('pt3:life', LIFE);
  sfx(d.g === 'Leak' ? 'check' : 'chip');
  render();
}
function ans(list) {
  return list
    .map(
      ([v, t]) =>
        `<button class="${v === 'fold' || v === 'check' ? 'bfold' : v === 'call' || v === 'small' ? 'bcall' : 'braise'}" data-act="dans" data-v="${v}">${t}</button>`,
    )
    .join('');
}
const CATN = [
  'High card',
  'One pair',
  'Two pair',
  'Three of a kind',
  'Straight',
  'Flush',
  'Full house',
  'Four of a kind',
  'Straight flush',
];
/* a hand in words that fit a sentence: "a pair of kings", "an ace-high flush" */
function aHand(v) {
  const c = catOf(v),
    k = Math.floor(v / 13 ** 4) % 13,
    k2 = Math.floor(v / 13 ** 3) % 13,
    lo = (r) => RN[r].toLowerCase(),
    high = (r) => (r === 12 || r === 6 ? 'an ' : 'a ') + RN1[r].toLowerCase() + '-high';
  return [
    RN1[k].toLowerCase() + ' high and no pair',
    'a pair of ' + lo(k),
    'two pair, ' + lo(k) + ' and ' + lo(k2),
    'three ' + lo(k),
    high(k) + ' straight',
    high(k) + ' flush',
    'a full house, ' + lo(k) + ' full of ' + lo(k2),
    'four ' + lo(k),
    k === 12 ? 'a royal flush' : 'a straight flush',
  ][c];
}
const drillBack = () =>
  `<button class="link" data-act="goto" data-s="${UI.drFrom || 'drills'}">‹ ${UI.drFrom === 'lesson' ? 'Lesson' : 'Drills'}</button>`;
/* the two beginner drills: reading a board. Once answered, the five cards that count are lit up */
function readDrillHTML(d, T) {
  const s = d.spot,
    done = !!d.ans,
    mine = new Set(best5([...s.h, ...s.board]));
  let lit = null,
    body,
    opts,
    exp,
    said;
  if (s.type === 'wins' && done) lit = s.answer === 'them' ? new Set(best5([...s.opp, ...s.board])) : mine;
  if (s.type === 'name' && done) lit = mine;
  const row = (cs) => cs.map((c) => cardHTML(c, lit ? (lit.has(c) ? 'hl' : 'dim') : '')).join('');
  if (s.type === 'name') {
    const used = s.h.filter((c) => mine.has(c)).length;
    body = `<small class="lbl">Your cards</small><div class="hand">${row(s.h)}</div><small class="lbl">The board</small><div class="bd">${row(s.board)}</div><p>What is your best five-card hand?</p>`;
    opts = s.opts.map((c) => [String(c), CATN[c]]);
    said = CATN[+d.ans];
    exp = `You have ${aHand(s.v)}. The five cards that make it are lit up.${used ? '' : ' None of them are yours: you are playing the board, and so is everyone else.'}`;
  } else {
    const same = catOf(s.a) === catOf(s.b),
      nm = esc(s.name);
    body = `<div class="duel"><div><small class="lbl">You</small><div class="hand">${row(s.h)}</div></div><div><small class="lbl">${nm}</small><div class="hand">${row(s.opp)}</div></div></div><small class="lbl">The board</small><div class="bd">${row(s.board)}</div><p>Who wins the pot?</p>`;
    opts = [
      ['you', 'You'],
      ['split', 'Split pot'],
      ['them', s.name],
    ];
    said = { you: 'you', split: 'a split pot', them: s.name }[d.ans];
    exp =
      `You have ${aHand(s.a)}. ${s.name} has ${aHand(s.b)}. ` +
      (s.answer === 'split'
        ? 'Those are the same five cards in rank, so the pot is split.'
        : same
          ? 'That is the same kind of hand, so the higher cards decide, and ' +
            (s.answer === 'you' ? 'yours are better.' : s.name + ' has them.')
          : s.answer === 'you'
            ? 'Yours wins.'
            : s.name + ' wins.') +
      ' The winning five are lit up.';
  }
  const res = done
    ? `<div class="coach ${d.g}"><div class="head"><span class="badge ${d.g}">${d.g === 'Solid' ? 'Right' : 'Not quite'}</span><span>You said ${esc(said.toLowerCase())}.</span></div><p>${esc(exp)}</p></div><button class="primary" data-act="drill" data-t="${d.type}">Next one</button>`
    : '';
  return `<div class="screen"><div class="top">${drillBack()}<span class="streak">Streak ${d.streak}</span></div><h2>${T}</h2>
  <div class="spot">${body}</div>
  ${done ? '' : `<div class="answers${opts.length > 3 ? ' grid2' : ''}">${opts.map(([v, t]) => `<button class="bopt" data-act="dans" data-v="${v}">${esc(t)}</button>`).join('')}</div>`}${res}</div>`;
}
export function drillHTML() {
  const d = UI.dr,
    s = d.spot;
  const T = DRILLS.find((x) => x[0] === d.type)[1];
  if (s.type === 'name' || s.type === 'wins') return readDrillHTML(d, T);
  let desc = '',
    btns = '',
    exp = '';
  const hc = handClass(s.h),
    hp = pctTxt(handPct(s.h));
  if (s.type === 'open') {
    const behind = { UTG: 8, 'UTG+1': 7, MP: 6, LJ: 5, HJ: 4, CO: 3, BTN: 2, SB: 1 }[s.pos];
    desc = `<p>Nine-handed, 100 big blinds deep. ${s.pos === 'UTG' ? 'You are first to act, <b>under the gun</b>.' : `It folds to you <b>${posPhrase(s.pos)}</b>.`} ${behind} player${behind > 1 ? 's' : ''} still to act behind you.</p>`;
    btns = ans([
      ['fold', 'Fold'],
      ['raise', 'Raise'],
    ]);
    exp = `${hc} is in the ${hp} of starting hands. A solid opening range ${posPhrase(s.pos).replace(/^(in|on) /, 'from ')} is about the ${pctTxt(s.op)}, because ${behind} player${behind > 1 ? 's' : ''} can still wake up with a better hand. ${s.answer === 'raise' ? 'Raise.' : 'Fold.'}${s.close ? ' This one sits right at the edge, so either answer is fine.' : ''}`;
  } else if (s.type === 'push') {
    desc = `<p>${s.behind === 8 ? 'You are first to act, <b>under the gun</b>, with 8 players behind you.' : `Folded to you ${posPhrase(s.pos)}, ${s.behind} player${s.behind > 1 ? 's' : ''} left to act.`} You have <b>${s.E} big blinds</b>. Blinds 0.5/1 with a 1 bb ante.</p>`;
    btns = ans([
      ['fold', 'Fold'],
      ['shove', 'Shove'],
    ]);
    exp = `${hc} is in the ${hp} of hands. In this model, opponents call with hands that beat your shoving range, and the profitable shoving range here is about the ${pctTxt(s.thr)}. Shoving ${s.ev >= 0 ? 'gains' : 'loses'} about ${Math.abs(s.ev).toFixed(2)} bb compared with folding.${s.close ? ' This one is close enough that either answer is fine.' : ''}`;
  } else if (s.type === 'call') {
    desc = `<p>${cap(s.read)} shoves <b>${s.Ev} big blinds</b> from the <b>${s.pos}</b>. Everyone else folds.</p><p>You are in the big blind with <b>${s.Eh} big blinds</b>. 1 bb ante in the pot.</p>`;
    btns = ans([
      ['fold', 'Fold'],
      ['call', 'Call'],
    ]);
    exp = `Their shoving range is about the ${pctTxt(s.range)}. Your ${hc} has ${pctS(s.eq)} equity against it. You need ${pctS(s.need)} to call. ${s.answer === 'call' ? 'Call.' : 'Fold.'}${s.close ? ' Very close, so either answer counts.' : ''}`;
  } else if (s.type === 'icm') {
    const nm = (i) => (i === 3 ? 'You' : esc(s.names[i]));
    desc = `<p>Four left, three paid: $500, $300, $200. Blinds 0.5/1.</p><p>Stacks (in big blinds): ${s.st.map((x, i) => `${nm(i)} <b>${x}</b>`).join(', ')}.</p><p><b>${nm(s.v)}</b> shoves from the button. You are in the big blind.</p>`;
    btns = ans([
      ['fold', 'Fold'],
      ['call', 'Call'],
    ]);
    exp = `Against their range (${pctTxt(s.range)}) you have ${pctS(s.eq)} equity. In chips you would need ${pctS(s.chipNeed)}. Because busting on the bubble costs real money, ICM says you need about ${pctS(s.icmNeed)}. Calling is worth $${s.evC.toFixed(0)} in prize equity, folding $${s.evF.toFixed(0)}. ${s.answer === 'call' ? 'Call.' : 'Fold.'}${s.close ? ' The difference is small.' : ''}`;
  } else if (s.type === 'outs') {
    desc = `<div class="bd">${s.board.map((c) => cardHTML(c)).join('')}</div><p>You have <b>${s.label}</b> on the ${s.two ? 'flop' : 'turn'}, and you need to hit it to win.</p><p>The pot is <b>$${s.pot}</b>. Your opponent ${s.two ? 'moves all-in for' : 'bets'} <b>$${s.bet}</b>${s.two ? ', so calling lets you see both the turn and the river' : '. Assume no more money goes in on the river'}.</p>`;
    btns = ans([
      ['fold', 'Fold'],
      ['call', 'Call'],
    ]);
    exp = `You have ${s.outs} outs. ${s.two ? 'With two cards to come, multiply by 4' : 'With one card to come, multiply by 2'}: about ${pctS(s.rule)}${pctS(s.rule) === pctS(s.eq) ? '' : ' (exactly ' + pctS(s.eq) + ')'}. Calling $${s.bet} to win $${s.pot + s.bet} means you need ${pctS(s.need)} ($${s.bet} ÷ $${s.pot + 2 * s.bet}). ${s.answer === 'call' ? 'The price is right, so call.' : 'The price is too high, so fold.'}${s.close ? ' It is nearly break-even, so either answer counts.' : ''}`;
  } else if (s.type === 'cbet') {
    const v = eval7([...s.h, ...s.board]);
    const tex = s.wet ? 'wet and connected' : s.dry ? 'dry' : 'medium';
    desc = `<p>You opened from the <b>${s.pos}</b> and the big blind called. Heads-up to the flop.</p><div class="bd">${s.board.map((c) => cardHTML(c)).join('')}</div>`;
    btns = ans([
      ['check', 'Check'],
      ['small', 'Bet ⅓'],
      ['big', 'Bet ¾'],
    ]);
    const why =
      s.eq >= 0.7
        ? s.wet
          ? 'You are well ahead on a board where many turn cards are scary. Bet big to charge draws.'
          : 'You are well ahead on a dry board. A small bet keeps worse hands in.'
        : s.eq >= 0.5
          ? 'You are ahead but not crushing. A small bet gets value and protection at a low price.'
          : s.draw
            ? 'You have a draw. Betting as a semi-bluff wins the pot now or sets up a bigger pot when you hit.'
            : s.eq >= 0.3
              ? 'You have some showdown value. Checking keeps the pot small and avoids getting raised off your equity.'
              : s.dry && s.hiR >= 10
                ? 'You have nothing, but this high, dry board favors the preflop raiser. A cheap stab works often.'
                : "You have nothing, and this board hits the big blind's calling range. Give up and check.";
    exp = `The board is ${tex}. You have ${handName(v).toLowerCase()}, about ${pctS(s.eq)} equity against the big blind's calling range. ${why} Best: ${{ check: 'check', small: 'bet ⅓ pot', big: 'bet ¾ pot' }[s.answer]}.`;
  } else if (s.type === 'river') {
    const v = eval7([...s.h, ...s.board]);
    desc = `<div class="bd">${s.board.map((c) => cardHTML(c)).join('')}</div><p>You have <b>${handName(v).toLowerCase()}</b>: you beat their bluffs and lose to their value bets.</p><p>The pot is <b>$${s.pot}</b>. ${cap(s.prof)} bets <b>$${s.bet}</b> (${Math.round(s.size * 100)}% of the pot).</p>`;
    btns = ans([
      ['fold', 'Fold'],
      ['call', 'Call'],
    ]);
    exp = `To call profitably you need to be right ${pctS(s.need)} of the time ($${s.bet} ÷ ($${s.pot} + 2 × $${s.bet})). Against ${s.prof}, about ${pctS(s.share)} of these bets are bluffs. ${s.answer === 'call' ? 'That is enough, so call.' : 'That is not enough, so fold.'}${/recreational/.test(s.prof) ? ' Live recreational players bluff the river far less than theory says, especially with big bets.' : ''}`;
  }
  const res = d.ans
    ? `<div class="coach ${d.g}"><div class="head"><span class="badge ${d.g}">${d.g}</span><span>You chose to ${{ small: 'bet ⅓', big: 'bet ¾' }[d.ans] || d.ans}.</span></div><p>${esc(exp)}</p></div><button class="primary" data-act="drill" data-t="${d.type}">Next spot</button>`
    : '';
  return `<div class="screen"><div class="top">${drillBack()}<span class="streak">Streak ${d.streak}</span></div><h2>${T}</h2>
  <div class="spot"><div class="hand">${s.h.map((c) => cardHTML(c)).join('')}</div>${desc}</div>
  ${d.ans ? '' : `<div class="answers">${btns}</div>`}${res}</div>`;
}
