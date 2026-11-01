// Chapter 9: auctions with independent private values uniform on [0, 1] (scaled in the UI).

/** Symmetric equilibrium bid in a first-price sealed-bid auction: shade to (n - 1)/n of value. */
export const firstPriceBid = (v: number, n: number) => ((n - 1) / n) * v;

/** Expected revenue of first-price, second-price, English and Dutch auctions alike: (n - 1)/(n + 1). */
export const expectedRevenue = (n: number) => (n - 1) / (n + 1);

export type Format = "first" | "second";

/** Simulate `trials` auctions with equilibrium bidding; returns average revenue and winner surplus. */
export function simulate(format: Format, n: number, trials: number, rand: () => number = Math.random) {
  let rev = 0, surplus = 0;
  for (let t = 0; t < trials; t++) {
    const vals = Array.from({ length: n }, () => rand()).sort((a, b) => b - a);
    const price = format === "first" ? firstPriceBid(vals[0], n) : vals[1];
    rev += price; surplus += vals[0] - price;
  }
  return { revenue: rev / trials, surplus: surplus / trials };
}

/** Your profit in a second-price auction given your value, your bid and the highest rival bid. */
export function secondPriceProfit(value: number, bid: number, rivalHigh: number): number {
  return bid > rivalHigh ? value - rivalHigh : 0;
}

/**
 * Expected revenue of a second-price auction with reserve r, n bidders, values U[0,1]:
 * R(r) = 2n/(n+1) - 1 - 2n r^(n+1)/(n+1) + r^n. Maximised at r = 1/2 for any n.
 */
export const revenueWithReserve = (n: number, r: number) => (2 * n) / (n + 1) - 1 - (2 * n * r ** (n + 1)) / (n + 1) + r ** n;

/**
 * Winner's curse: an item worth V to everyone; each of n bidders sees V plus noise uniform in [-e, e]
 * and bids (signal - shade) in a first-price auction. Returns the winner's average profit.
 */
export function winnersCurse(n: number, e: number, shade: number, trials: number, rand: () => number = Math.random) {
  let profit = 0;
  for (let t = 0; t < trials; t++) {
    const V = 50 + rand() * 50;
    let best = -Infinity;
    for (let i = 0; i < n; i++) best = Math.max(best, V + (rand() * 2 - 1) * e - shade);
    profit += V - best;
  }
  return profit / trials;
}

/** Expected highest of n noises uniform on [-e, e]: e (n - 1)/(n + 1). Shading by this breaks even. */
export const breakEvenShade = (n: number, e: number) => (e * (n - 1)) / (n + 1);
