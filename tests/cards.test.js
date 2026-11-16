import test from 'node:test';
import assert from 'node:assert/strict';
import { best5, cardOf, catOf, CI, CUM, eval7, handClass, handName, ORDER } from '../src/core/cards.js';

const cards = (s) => s.split(' ').map(cardOf);
const score = (s) => eval7(cards(s));

test('cardOf reads the usual shorthand', () => {
  assert.equal(cardOf('2s'), 0);
  assert.equal(cardOf('Ac'), 51);
  assert.equal(new Set('23456789TJQKA'.split('').flatMap((r) => 'shdc'.split('').map((s) => cardOf(r + s)))).size, 52);
});

test('every kind of hand is recognised', () => {
  const hands = [
    'As Jd 8c 5h 2s 3d 9c', // high card
    'Tc Td Ah 7s 3d 2c 5h', // one pair
    'Ah Ad 8s 8c Kd 2c 5h', // two pair
    'Qs Qh Qd 9c 4s 2d 7h', // three of a kind
    '9c 8d 7s 6h 5c Ah Kd', // straight
    'Ad Jd 8d 6d 2d Ks Kh', // flush
    'Kh Kd Ks 7c 7d 2s 3h', // full house
    'Jc Jd Jh Js 4d 2s 3h', // four of a kind
    '9h 8h 7h 6h 5h As Ad', // straight flush
  ];
  hands.forEach((h, cat) => assert.equal(catOf(score(h)), cat, h));
});

test('a higher kind beats a lower kind, and kickers break ties', () => {
  assert.ok(score('Ad Jd 8d 6d 2d Ks Kh') > score('9c 8d 7s 6h 5c Ah Kd'), 'flush beats straight');
  assert.ok(score('Qs Qh Qd 9c 4s 2d 7h') > score('Ah Ad 8s 8c Kd 2c 5h'), 'trips beat two pair');
  assert.ok(score('Ks Kd Ah 7c 4s 2d 3h') > score('Kh Kc Qd 7s 4d 2c 3s'), 'ace kicker beats queen kicker');
  assert.equal(score('As Kh Qd Jc Ts 3c 2d'), score('As Kh Qd Jc Ts 7h 7d'), 'the board plays for both');
});

test('the ace is high or low in a straight but never in the middle', () => {
  assert.equal(catOf(score('As Kd Qh Jc Ts 2d 3c')), 4);
  assert.equal(catOf(score('5s 4d 3h 2c As 9d Kc')), 4);
  assert.ok(score('6s 5d 4h 3c 2s 9d Kc') > score('5s 4d 3h 2c As 9d Kc'), 'a six-high straight beats the wheel');
  assert.equal(catOf(score('Qs Kd Ah 2c 3s 9d 7c')), 0);
});

test('best5 returns the five cards that make the hand', () => {
  const seven = cards('Ah 9c Ks Kd 7h 7c 2s');
  const five = best5(seven);
  assert.equal(five.length, 5);
  assert.equal(eval7(five), eval7(seven));
  assert.ok(five.includes(cardOf('Ah')), 'the ace kicker plays');
  assert.ok(!five.includes(cardOf('9c')));
});

test('hands are named in words', () => {
  assert.equal(handName(score('Ah Jh Kd Jc 4h 7s Ac')), 'Two pair, Aces and Jacks');
  assert.equal(handName(score('As Ks Qs Js Ts 2d 3c')), 'Royal flush');
});

test('the starting-hand order covers all 169 hands and all 1,326 combinations', () => {
  assert.equal(ORDER.length, 169);
  assert.equal(new Set(ORDER).size, 169);
  assert.ok(Math.abs(CUM[168] - 1) < 1e-9);
  assert.equal(ORDER[0], 'AA');
  assert.equal(handClass(cards('Kd As')), 'AKo');
  assert.equal(handClass(cards('7h 7c')), '77');
  assert.ok(CUM[CI.AKs] < CUM[CI['72o']]);
});
