import test from 'node:test';
import assert from 'node:assert/strict';
import { icmAll } from '../src/core/icm.js';
import { botDecide } from '../src/game/bots.js';
import { coachSpot } from '../src/game/coach.js';
import { genDrill } from '../src/game/drills.js';
import { act, startHand } from '../src/game/engine.js';
import { cashAfterHand, tourAfterHand } from '../src/game/session.js';
import { activeSeats, G, makeCash, makeTour } from '../src/game/state.js';
import { seed } from './helpers.js';

const chipsInPlay = () => G.seats.reduce((a, p) => a + (p ? p.stack : 0), 0) + G.pool.reduce((a, p) => a + p.stack, 0);

/* play one hand with a bot in every seat, asking the coach whenever it is the student's turn */
function playHand() {
  startHand();
  const H = G.hand;
  for (let guard = 0; !H.done; guard++) {
    assert.ok(guard < 400, 'a hand has to end');
    if (H.toAct === 0) {
      const a = coachSpot();
      assert.ok(['fold', 'passive', 'aggr'].includes(a.best), `coach said ${a.best}`);
      assert.ok(a.lines.length > 0, 'the coach explains itself');
    }
    act(H.toAct, botDecide(H.toAct));
  }
  return H;
}

test('ICM hands out exactly the prize pool and favours the bigger stack', () => {
  const pays = [500, 300, 200];
  const eq = icmAll([5000, 3000, 1500, 500], pays);
  assert.ok(Math.abs(eq.reduce((a, b) => a + b, 0) - 1000) < 1e-6);
  assert.ok(eq[0] > eq[1] && eq[1] > eq[2] && eq[2] > eq[3]);
  assert.ok(eq[0] < 500, 'the chip leader cannot be worth more than first prize');
  const even = icmAll([1000, 1000, 1000], pays);
  even.forEach((v) => assert.ok(Math.abs(v - 1000 / 3) < 1e-6));
});

test('tournaments of every format run to a finish without losing a chip', () => {
  seed(20240611);
  const formats = [
    { kind: 'mtt', players: 18, seats: 9 },
    { kind: 'mtt', players: 27, seats: 9 },
    { kind: 'sng', players: 9, seats: 9 },
    { kind: 'sng', players: 6, seats: 6 },
    { kind: 'sng', players: 2, seats: 2 },
    { kind: 'sat', players: 9, seats: 9, seatsWon: 2 },
    { kind: 'sat', players: 18, seats: 9, seatsWon: 4 },
  ];
  for (const [n, f] of formats.entries()) {
    const cfg = {
      ...f,
      buyin: 20,
      turbo: n % 2 === 0,
      depth: n % 2 ? 100 : 50,
      diff: ['easy', 'normal', 'hard'][n % 3],
    };
    makeTour(cfg);
    const total = cfg.players * cfg.depth * 50;
    for (let hands = 0; !G.over; hands++) {
      assert.ok(hands < 5000, `${cfg.kind} ${cfg.players} has to end`);
      playHand();
      assert.equal(chipsInPlay(), total, `${cfg.kind} ${cfg.players}, hand ${G.handNo}`);
      tourAfterHand();
    }
    assert.ok(G.heroPlace >= 1 && G.heroPlace <= cfg.players);
    assert.ok(G.heroPrize >= 0);
  }
});

test('a cash session accounts for every dollar, rake included', () => {
  seed(77);
  makeCash({ kind: 'cash', buyin: 300, diff: 'normal', rake: true });
  for (let n = 0; n < 150; n++) {
    if (G.seats[0].stack <= 0) G.seats[0].stack = 300;
    if (activeSeats().length < 2) break;
    const before = chipsInPlay();
    const H = playHand();
    assert.equal(chipsInPlay() + H.result.rake, before, `hand ${G.handNo}`);
    cashAfterHand();
  }
  assert.ok(G.session.hands > 100);
});

test('every drill deals a spot with an answer', () => {
  seed(5);
  for (const type of ['name', 'wins', 'open', 'push', 'call', 'icm', 'outs', 'cbet', 'river']) {
    for (let k = 0; k < 100; k++) {
      const d = genDrill(type);
      assert.ok(d && typeof d.answer === 'string', type);
      if (type === 'name') assert.ok(d.opts.map(String).includes(d.answer) && new Set(d.opts).size === d.opts.length);
      if (type === 'wins') assert.equal(d.answer, d.a > d.b ? 'you' : d.a < d.b ? 'them' : 'split');
    }
  }
});
