// Chapter 5: quantity competition with and without a first mover.
// Linear demand P = a - Q, constant marginal cost c, two firms.

export interface Market { a: number; c: number }

/** Follower's best response to the leader's quantity: maximise (a - c - qL - q) q. */
export const bestReplyQty = (m: Market, other: number) => Math.max(0, (m.a - m.c - other) / 2);

export const price = (m: Market, q1: number, q2: number) => Math.max(0, m.a - q1 - q2);
export const profit = (m: Market, mine: number, other: number) => (price(m, mine, other) - m.c) * mine;

/** Cournot (simultaneous): both produce (a - c)/3. */
export function cournot(m: Market) {
  const q = (m.a - m.c) / 3;
  return { q1: q, q2: q, price: price(m, q, q), profit1: profit(m, q, q), profit2: profit(m, q, q) };
}

/** Stackelberg (leader commits first): leader (a - c)/2, follower (a - c)/4. */
export function stackelberg(m: Market) {
  const q1 = (m.a - m.c) / 2;
  const q2 = bestReplyQty(m, q1);
  return { q1, q2, price: price(m, q1, q2), profit1: profit(m, q1, q2), profit2: profit(m, q2, q1) };
}

/** Leader's profit if it commits to qL and the follower best-responds. */
export const leaderProfit = (m: Market, qL: number) => profit(m, qL, bestReplyQty(m, qL));

/** Monopoly benchmark. */
export const monopoly = (m: Market) => { const q = (m.a - m.c) / 2; return { q, price: m.a - q, profit: (m.a - q - m.c) * q }; };
