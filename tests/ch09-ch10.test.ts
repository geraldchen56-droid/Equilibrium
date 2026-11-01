import { describe, expect, it } from "vitest";
import { auctions, bargaining, rng } from "../src/engine";

describe("auctions", () => {
  const { firstPriceBid, expectedRevenue, simulate, secondPriceProfit, revenueWithReserve, winnersCurse, breakEvenShade } = auctions;
  it("first-price shading and revenue formula", () => {
    expect(firstPriceBid(80, 4)).toBe(60);
    expect(expectedRevenue(3)).toBe(0.5);
  });
  it("revenue equivalence holds in simulation (n = 4, theory 0.6)", () => {
    const r = rng(11);
    const fp = simulate("first", 4, 40000, r).revenue, sp = simulate("second", 4, 40000, r).revenue;
    expect(Math.abs(fp - 0.6)).toBeLessThan(0.01);
    expect(Math.abs(sp - 0.6)).toBeLessThan(0.01);
  });
  it("truthful bidding weakly dominates in second-price", () => {
    for (const bid of [0, 30, 69, 71, 100]) for (let rv = 0; rv <= 100; rv += 1)
      expect(secondPriceProfit(70, 70, rv)).toBeGreaterThan(secondPriceProfit(70, bid, rv) - 1e-9);
  });
  it("reserve price: 1/3 with none, 5/12 at r = 1/2 for two bidders", () => {
    expect(revenueWithReserve(2, 0)).toBeCloseTo(1 / 3, 9);
    expect(revenueWithReserve(2, 0.5)).toBeCloseTo(5 / 12, 9);
  });
  it("winner's curse: naive bidding loses about e(n-1)/(n+1); shading by that breaks even", () => {
    const r = rng(3);
    expect(winnersCurse(6, 20, 0, 40000, r)).toBeCloseTo(-breakEvenShade(6, 20), 0);
    expect(Math.abs(winnersCurse(6, 20, breakEvenShade(6, 20), 40000, r))).toBeLessThan(0.5);
  });
});

describe("bargaining", () => {
  const { shrinkingPie, rubinstein, nashSplit, ultimatumExpected } = bargaining;
  it("three rounds halving: 0.75, 0.5, 1", () => expect(shrinkingPie(3, 0.5)).toEqual([0.75, 0.5, 1]));
  it("many rounds converge to Rubinstein 1/(1 + δ)", () => {
    expect(shrinkingPie(120, 0.8)[0]).toBeCloseTo(1 / 1.8, 6);
    expect(rubinstein(0.8, 0.8)).toBeCloseTo(1 / 1.8, 12);
    expect(rubinstein(0.9, 0.6)).toBeCloseTo(0.4 / 0.46, 12);
  });
  it("Nash bargaining splits the surplus over fallbacks", () => {
    expect(nashSplit(120, 20, 40)).toEqual([50, 70]);
    expect(nashSplit(50, 30, 30)).toBeNull();
  });
  it("against human-like responders, a stingy offer does badly", () => {
    expect(ultimatumExpected(0.3)).toBeGreaterThan(ultimatumExpected(0.01) * 50);
  });
});
