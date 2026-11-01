// Chapter 10: bargaining.

/**
 * Alternating offers over a pie that shrinks by factor d each round, T rounds, last proposer takes all.
 * Backward induction: s_T = 1, s_t = 1 - d * s_{t+1}. Returns the proposer's share in each round (round 1 first).
 */
export function shrinkingPie(T: number, d: number): number[] {
  const s = new Array(T).fill(0);
  s[T - 1] = 1;
  for (let t = T - 2; t >= 0; t--) s[t] = 1 - d * s[t + 1];
  return s;
}

/** Rubinstein (1982), infinite horizon: first proposer's share with discount factors d1 (proposer), d2 (responder). */
export const rubinstein = (d1: number, d2: number) => (1 - d2) / (1 - d1 * d2);

/** Nash bargaining solution for a pie S with disagreement payoffs d1, d2: split the surplus equally. */
export function nashSplit(S: number, d1: number, d2: number): [number, number] | null {
  const surplus = S - d1 - d2;
  if (surplus < 0) return null;
  return [d1 + surplus / 2, d2 + surplus / 2];
}

/**
 * A stylised human responder in the ultimatum game: the chance of accepting an offer of share x.
 * Fitted loosely to lab data: offers near 20% are rejected about half the time, 40%+ almost never.
 */
export const acceptProb = (x: number) => 1 / (1 + Math.exp(-(x - 0.2) * 25));

/** Proposer's expected share when offering x to that responder. */
export const ultimatumExpected = (x: number) => (1 - x) * acceptProb(x);
