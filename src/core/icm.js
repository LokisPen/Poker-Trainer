/* ================= ICM ================= */
export function icmAll(stacks, pay) {
  const n = stacks.length,
    res = new Array(n).fill(0),
    P = pay.slice(0, n);
  const live = stacks.map((s, i) => (s > 0 ? i : -1)).filter((i) => i >= 0);
  if (live.length > 12) {
    const t = stacks.reduce((a, b) => a + b, 0);
    const pool = P.reduce((a, b) => a + b, 0);
    return stacks.map((s) => (s / t) * pool);
  }
  function rec(rem, k, prob) {
    if (k >= P.length || prob < 1e-7 || !rem.length) return;
    let t = 0;
    for (const i of rem) t += stacks[i];
    for (const i of rem) {
      const p = (prob * stacks[i]) / t;
      res[i] += p * P[k];
      rec(
        rem.filter((x) => x !== i),
        k + 1,
        p,
      );
    }
  }
  rec(live, 0, 1);
  // busted players (0 chips) get the lowest remaining places
  return res;
}
