import { describe, expect, it } from "vitest";
import { evolution, signalling } from "../src/engine";

describe("evolution", () => {
  const { hawkDove, interiorRest, ess, replicatorPath, spatialStep, share } = evolution;
  it("hawk-dove with V=4, C=6: rest point and ESS at V/C = 2/3", () => {
    const A = hawkDove(4, 6);
    expect(interiorRest(A)!).toBeCloseTo(2 / 3, 9);
    expect(ess(A)).toHaveLength(1);
    expect(ess(A)[0]).toBeCloseTo(2 / 3, 9);
  });
  it("replicator dynamics converge to V/C from either side", () => {
    const A = hawkDove(4, 6);
    for (const x0 of [0.05, 0.95]) { const p = replicatorPath(A, x0, 2000); expect(p[p.length - 1]).toBeCloseTo(2 / 3, 3); }
  });
  it("when V > C, all-hawk is the only ESS", () => expect(ess(hawkDove(6, 4))).toEqual([1]));
  it("Prisoner's Dilemma as a population game: defect is the only ESS", () => expect(ess([[3, 0], [5, 1]])).toEqual([0]));
  it("stag hunt has two pure ESSs and an unstable middle", () => expect(ess([[4, 0], [3, 3]])).toEqual([1, 0]));
  it("spatial PD: a lone defector among cooperators spreads when b is high, and all-C stays put", () => {
    const n = 9, g = new Uint8Array(n * n).fill(1); g[40] = 0;
    expect(share(spatialStep(g, n, 1.9))).toBeLessThan(share(g));
    expect(share(spatialStep(new Uint8Array(n * n).fill(1), n, 1.9))).toBe(1);
  });
});

describe("signalling", () => {
  const { lemons, lemonsTradeSurvives, spenceRange, spenceCheck, leastCostSignal } = signalling;
  it("lemons: average offered quality is p/2; buyers with k < 2 lose at every price", () => {
    expect(lemons(0.6, 1.5).avgQuality).toBeCloseTo(0.3, 9);
    expect(lemons(0.6, 1.5).buyerProfit).toBeCloseTo(-0.15, 9);
    expect(lemonsTradeSurvives(1.5)).toBe(false);
    expect(lemonsTradeSurvives(2.5)).toBe(true);
  });
  it("Spence: premium 40, costs 5 and 10 -> separating range [4, 8], cheapest 4", () => {
    expect(spenceRange(40, 5, 10)).toMatchObject({ lo: 4, hi: 8, exists: true });
    expect(spenceCheck(4, 40, 5, 10).separating).toBe(true);
    expect(spenceCheck(3, 40, 5, 10).separating).toBe(false);
    expect(spenceCheck(9, 40, 5, 10).separating).toBe(false);
    expect(leastCostSignal(40, 10)).toBe(4);
  });
});
