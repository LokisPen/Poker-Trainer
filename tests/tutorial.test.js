import test from 'node:test';
import assert from 'node:assert/strict';
import { cardOf, CI, CUM, eval7 } from '../src/core/cards.js';
import { pushRangeSet } from '../src/game/drills.js';
import { act, legal } from '../src/game/engine.js';
import { G, OPEN } from '../src/game/state.js';
import { ITEMS, itemAfter, itemByKey } from '../src/tutorial/course.js';
import { GLOSSARY } from '../src/tutorial/glossary.js';
import { GUIDED, setupGuided } from '../src/tutorial/hands.js';
import { COURSE, LESSONS, RANKS, STARTERS, STUDENT } from '../src/tutorial/lessons.js';

const pct = (hand) => CUM[CI[hand]];
const quiz = (lesson, id) =>
  LESSONS.find((l) => l.id === lesson).body.find((b) => b[0] === 'quiz' && b[1].id === id)[1];
const BLOCKS = [
  'p',
  'h',
  'ul',
  'ol',
  'dl',
  'key',
  'rx',
  'cards',
  'streets',
  'ex',
  'ranks',
  'openchart',
  'starters',
  'grades',
  'quiz',
  'go',
];

test('the course is for Martin and runs lessons and guided hands in order', () => {
  assert.equal(STUDENT, 'Martin');
  assert.equal(ITEMS.length, COURSE.flatMap(([, keys]) => keys).length);
  assert.equal(new Set(ITEMS.map((it) => it.key)).size, ITEMS.length);
  assert.deepEqual(
    ITEMS.filter((it) => it.kind === 'lesson').map((it) => it.id),
    LESSONS.map((l) => l.id),
    'every lesson is in the course',
  );
  assert.deepEqual(
    ITEMS.filter((it) => it.kind === 'hand').map((it) => it.id),
    Object.keys(GUIDED),
    'every guided hand is in the course',
  );
  assert.equal(itemByKey('hand:see').title, 'See one');
  assert.equal(itemAfter(ITEMS.at(-1).key), null);
  assert.equal(itemAfter('lesson:actions').key, 'hand:see', 'the rules come before the first guided hand');
  assert.ok(
    ITEMS.findIndex((it) => it.key === 'lesson:odds') < ITEMS.findIndex((it) => it.key === 'hand:odds'),
    'pot odds are taught before they are used',
  );
});

test('every lesson is well formed', () => {
  for (const L of LESSONS) {
    assert.ok(L.title && L.sub && L.body.length, L.id);
    for (const b of L.body) {
      assert.ok(BLOCKS.includes(b[0]), `${L.id}: unknown block ${b[0]}`);
      for (const m of JSON.stringify(b).matchAll(/\{(\w+)\}/g)) {
        assert.ok(m[1] === 'student' || /^[2-9TJQKA][shdc]$/.test(m[1]), `${L.id}: bad token {${m[1]}}`);
      }
      if (b[0] === 'quiz') {
        const q = b[1];
        assert.ok(q.q && q.why && q.opts.length >= 2 && q.a >= 0 && q.a < q.opts.length, `${L.id}: ${q.q}`);
      }
    }
  }
});

test('the hand-ranking ladder really is in order, best first', () => {
  assert.equal(RANKS.length, 10);
  const scores = RANKS.map(([, , cs]) => eval7(cs.map(cardOf)));
  for (let k = 1; k < scores.length; k++) assert.ok(scores[k - 1] > scores[k], RANKS[k][0]);
});

test('what the lessons say about starting hands agrees with the coach', () => {
  for (const s of STARTERS)
    for (const h of s.hands) assert.ok(pct(h) <= OPEN[s.seat], `${h} is an open from ${s.seat}`);
  assert.ok(pct('K9o') > OPEN.UTG * 1.3, 'K9o under the gun is a clear fold');
  assert.equal(quiz('start', 'k9o').opts[quiz('start', 'k9o').a], 'Fold');
  assert.ok(pct('A4o') < OPEN.BTN * 0.8, 'A4o on the button is a clear raise');
  assert.equal(quiz('start', 'a4o').opts[quiz('start', 'a4o').a], 'Raise');
});

test('what the lessons say about shoving agrees with the push chart', () => {
  const ten = pushRangeSet(10, 2);
  const shoves = Object.keys(CI).filter((h) => h.length === 2 || h[0] === 'A' || (h[0] === 'K' && h[2] === 's'));
  for (const h of shoves) assert.ok(ten.has(CI[h]), `${h} is a 10 bb button shove`);
  assert.ok(pushRangeSet(8, 2).has(CI.A7o));
  assert.equal(quiz('tourney', 'a7o').opts[quiz('tourney', 'a7o').a], 'All-in');
});

test('the glossary is alphabetical and has no duplicates', () => {
  const terms = GLOSSARY.map(([t]) => t.toLowerCase());
  assert.deepEqual(
    terms,
    [...terms].sort((a, b) => a.localeCompare(b, 'en', { numeric: true })),
  );
  assert.equal(new Set(terms).size, terms.length);
});

for (const [id, g] of Object.entries(GUIDED)) {
  test(`guided hand "${g.title}" plays out exactly as scripted`, () => {
    setupGuided(id);
    const H = G.hand;
    assert.equal(G.button, g.button);
    assert.equal(g.steps.at(-1).hero || g.steps.at(-1).bot, undefined, 'the script ends with the coach talking');
    for (const [n, st] of g.steps.entries()) {
      if (st.rx) assert.ok(st.say, 'an aside always follows something the coach said');
      const move = st.bot || st.hero;
      if (!move) continue;
      assert.ok(!H.done, `step ${n}: the hand is still going`);
      if (st.bot) assert.equal(G.seats[H.toAct].name, st.who, `step ${n}: whose turn it is`);
      else assert.equal(H.toAct, 0, `step ${n}: it is the student's turn`);
      const L = legal(H.toAct);
      if (move.t === 'check') assert.ok(L.check, `step ${n}: a check is allowed`);
      if (move.t === 'call') assert.ok(L.toCall > 0, `step ${n}: there is a bet to call`);
      if (move.t === 'raise')
        assert.ok(L.canRaise && move.to >= L.minTo && move.to <= L.maxTo, `step ${n}: the size is legal`);
      const events = H.events.length;
      act(H.toAct, move);
      const made = H.events[events];
      assert.equal(made.t === 'bet' ? 'raise' : made.t, move.t, `step ${n}: the engine made the scripted move`);
    }
    assert.ok(H.done, 'the script finishes the hand');
    assert.equal(G.seats[0].net, g.expect.net, 'what the student won or lost');
    assert.deepEqual(Object.keys(H.result.win).map(Number), [g.expect.winner]);
    assert.equal(H.result.win[g.expect.winner], g.expect.pot);
  });
}
