import { setRNG } from '../src/core/cards.js';

/* a repeatable random stream, so a failing run can be replayed */
export function seed(n) {
  let s = n >>> 0;
  setRNG(() => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  });
}
