import { cardOf } from '../core/cards.js';
import { startHand } from '../game/engine.js';
import { G, makeTour } from '../game/state.js';

/* ================= guided practice hands ================= */
/* Three scripted hands played at the real table: see one, do one, do one with complications.
   Each hand stacks the deck, fixes the button and then walks a list of steps:
     {say}        the coach talks and the hand waits for Continue
     {bot,who}    the player whose turn it is makes exactly this move (the tests check that it really is `who`)
     {hero,say}   the student has to make exactly this move
   The engine deals the cards and moves the action exactly as in a real game, so what the student sees here
   is what they will see later. In the text, {As} is drawn as a card and seats are numbered clockwise from the
   student at 0. */
const TUT_CAST = [
  ['Dutch', 'rock'],
  ['Rosa', 'station'],
  ['Teddy', 'lag'],
  ['Ines', 'reg'],
  ['Bo', 'tag'],
];
const fold = { t: 'fold' },
  check = { t: 'check' },
  call = { t: 'call' },
  to = (n) => ({ t: 'raise', to: n });

export const GUIDED = {
  see: {
    title: 'See one',
    sub: 'You fold, then watch a whole hand play out to a showdown.',
    button: 3,
    holes: { 0: ['7c', '2d'], 2: ['Ah', 'Jh'], 5: ['Ks', 'Ts'] },
    board: ['Kd', 'Jc', '4h', '7s', 'Ac'],
    expect: { net: 0, winner: 2, pot: 1175 },
    steps: [
      {
        say: 'Welcome to the table, {student}. Everyone has been dealt two cards face down. Yours are at the bottom: {7c} {2d}. Only you can see them.',
      },
      {
        say: 'The white <b>D</b> disc is the dealer button, and this hand it sits with Teddy. The next two players had to pay before seeing a card: Ines the <b>small blind</b> (25) and Bo the <b>big blind</b> (50). That money is what everyone is fighting over.',
      },
      {
        hero: fold,
        say: "The first decision goes to the player after the big blind, and that is you. Seven-deuce is the worst starting hand in hold'em: low, far apart, two different suits. <b>Fold.</b> It costs you nothing.",
      },
      { bot: fold, who: 'Dutch' },
      { bot: to(125), who: 'Rosa' },
      { bot: fold, who: 'Teddy' },
      { bot: fold, who: 'Ines' },
      { bot: call, who: 'Bo' },
      {
        say: 'Dutch folded, <b>Rosa raised</b> to 125, and only Bo <b>called</b> (matched her bet). With the bets matched, the round ended and three shared cards were turned up: the <b>flop</b>. Rosa and Bo can both use them.',
      },
      { bot: check, who: 'Bo' },
      { bot: to(150), who: 'Rosa' },
      { bot: call, who: 'Bo' },
      {
        say: 'Bo <b>checked</b> (passed without betting), Rosa <b>bet</b> 150, and Bo called. That closed the second round, so a fourth shared card arrived: the <b>turn</b>.',
      },
      { bot: check, who: 'Bo' },
      { bot: check, who: 'Rosa' },
      {
        say: 'Both checked this time, so that card was free. Here is the fifth and last shared card, the <b>river</b>. One more round of betting, then the cards go face up.',
      },
      { bot: check, who: 'Bo' },
      { bot: to(300), who: 'Rosa' },
      { bot: call, who: 'Bo' },
      {
        say: "<b>Showdown.</b> Each player makes the best five cards out of their own two plus the five in the middle. Rosa's {Ah} {Jh} pairs both the ace and the jack: <b>two pair</b>. Bo's {Ks} {Ts} makes one pair of kings. Two pair wins the 1,175 pot, and the winning five cards are lit up.",
      },
      {
        say: 'Bo was ahead until the very last card. That happens all the time, and it is why nobody wins every hand they should. As for you: you lost nothing, which made your fold the best play at the table.',
        rx: 'First, do no harm. Most of the hands you are dealt need no treatment at all.',
      },
    ],
  },
  do: {
    title: 'Do one',
    sub: 'You are dealt a big hand on the button. Raise it, bet it, win it.',
    button: 0,
    holes: { 0: ['As', 'Ks'], 2: ['Ah', 'Tc'] },
    board: ['Ad', '8c', '3h', '9d', '4s'],
    expect: { net: 1250, winner: 0, pot: 2475 },
    steps: [
      {
        say: 'New hand, and the button has moved one seat. It is yours now: the <b>D</b> next to your cards. On the button you act <b>last</b> on the flop, turn and river, so you always see what everyone else does before you decide.',
        rx: 'Acting last is getting the labs back before you write the order.',
      },
      { bot: fold, who: 'Teddy' },
      { bot: fold, who: 'Ines' },
      { bot: fold, who: 'Bo' },
      {
        hero: to(125),
        say: "You hold {As} {Ks}: ace-king of the same suit, one of the five best starting hands. Everyone so far has folded. Strong hands want a bigger pot, so don't just call the 50. <b>Raise</b> to 125.",
      },
      { bot: fold, who: 'Dutch' },
      { bot: call, who: 'Rosa' },
      {
        say: 'Dutch folded his small blind and Rosa called from the big blind, so it is you against her. The flop gives you a pair of aces, and your king is the best side card you could have next to it.',
      },
      { bot: check, who: 'Rosa' },
      {
        hero: to(150),
        say: 'Rosa checked. You could check too and see the next card for free, but you very likely have the best hand, so make worse hands pay to keep going. <b>Bet</b> 150, about half the pot.',
      },
      { bot: call, who: 'Rosa' },
      { bot: check, who: 'Rosa' },
      {
        hero: to(350),
        say: 'The turn is the {9d}, which changes nothing, and Rosa has checked again. Same plan: <b>bet</b> 350.',
      },
      { bot: call, who: 'Rosa' },
      { bot: check, who: 'Rosa' },
      {
        hero: to(600),
        say: "Last card: {4s}, a small one that almost certainly didn't help her. One more bet for value: 600.",
      },
      { bot: call, who: 'Rosa' },
      {
        say: 'Rosa shows {Ah} {Tc}. You both have a pair of aces, so the next-highest card decides, and your king beats her ten. That tiebreak card is called the <b>kicker</b>. It is the reason ace-king is so much stronger than ace-ten.',
      },
      {
        say: 'You just took down a pot of 2,475 chips by <b>value betting</b>: you had the best hand, bet on every round, and a worse hand paid you three times. Rosa is what players call a calling station. Against her you never need to bluff. You only need to wait for a hand.',
      },
    ],
  },
  odds: {
    title: 'Do one, with complications',
    sub: 'A flush draw, a cheap bet and an expensive one. Call or fold?',
    button: 4,
    holes: { 0: ['9h', '8h'], 3: ['Ac', 'Kd'] },
    board: ['Kh', '5h', '2c', 'Js', '3d'],
    expect: { net: -225, winner: 3, pot: 475 },
    steps: [
      {
        say: 'This time you are the <b>big blind</b>: 50 of your chips went into the pot before you saw a card. Everybody pays it once per lap of the table.',
      },
      { bot: fold, who: 'Dutch' },
      { bot: fold, who: 'Rosa' },
      { bot: to(150), who: 'Teddy' },
      { bot: fold, who: 'Ines' },
      { bot: fold, who: 'Bo' },
      {
        hero: call,
        say: 'Teddy raised to 150 and everyone else folded. You already have 50 in, so calling costs 100 more. {9h} {8h} is no powerhouse, but two suited cards that sit next to each other can make flushes and straights, and you are getting a discount. <b>Call.</b>',
      },
      {
        say: 'No pair for you, but look at the suits: two hearts in your hand and two on the board. One more heart makes a flush. This is a <b>flush draw</b>. There are thirteen hearts and you can see four, so nine are left: nine <b>outs</b>.',
      },
      {
        hero: check,
        say: 'After the flop, the first player left of the button who is still in acts first, and that is you. With a draw and no made hand, just <b>check</b> and see what Teddy does.',
      },
      { bot: to(75), who: 'Teddy' },
      {
        hero: call,
        say: 'Teddy bets 75, making the pot 400. Your chance: 9 outs × 2 ≈ 18% to hit on the next card. Your price: 75 to win 400, so you need 75 ÷ 475 ≈ 16%. Chance beats price. <b>Call.</b>',
      },
      { hero: check, say: 'The turn is the {Js}. Not a heart, no help. Check again.' },
      { bot: to(400), who: 'Teddy' },
      {
        hero: fold,
        say: 'Now Teddy bets 400, making the pot 875. Same draw, new price: you need 400 ÷ 1,275 ≈ 31%, and with one card to come your chance is still about 18%. Chance loses to price. <b>Fold.</b>',
      },
      {
        say: 'You lost 225 chips on that hand and made every decision correctly. You will never know what Teddy had, and it does not matter: you paid when the price was right and stopped when it was not.',
        rx: 'This is the M&M conference rule: a good decision can still have a bad outcome. Review the decision, not the result. The coach in this app grades you the same way.',
      },
    ],
  },
};

/* seat a fresh six-player table for one guided hand and deal it. No DOM here, so the tests can play it too. */
export function setupGuided(id) {
  const g = GUIDED[id];
  makeTour({ kind: 'sng', players: 6, seats: 6, buyin: 20, turbo: false, depth: 100, diff: 'normal' });
  TUT_CAST.forEach(([name, style], k) => {
    const p = G.seats[k + 1];
    p.name = name;
    p.style = style;
  });
  G.cast = TUT_CAST.map(([name, style]) => ({ name, style }));
  G.tally = { Solid: 0, Close: 0, Leak: 0 };
  G.leaks = [];
  G.button = (g.button + 5) % 6; // startHand moves the button one seat before it deals
  G.rig = {
    holes: Object.fromEntries(Object.entries(g.holes).map(([s, h]) => [s, h.map(cardOf)])),
    board: g.board.map(cardOf),
  };
  G.tut = { id, i: 0 };
  startHand();
  return G;
}
