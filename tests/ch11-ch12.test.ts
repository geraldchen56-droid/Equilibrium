import { describe, expect, it } from "vitest";
import { matching, mechanism, rng } from "../src/engine";

describe("mechanism design", () => {
  const { clarkeRule, proportionalRule, utility } = mechanism;
  const others = [60, 150, 80];
  const u = (rule: typeof clarkeRule, r: number, v = 130) => utility(rule([r, ...others], 400), 0, v);
  it("Clarke worked example: built, pivot tax 10, gain 20", () => {
    const o = clarkeRule([130, ...others], 400);
    expect(o.built).toBe(true);
    expect(o.tax[0]).toBe(10);
    expect(u(clarkeRule, 130)).toBe(20);
  });
  it("Clarke: no report beats the truth, for random values", () => {
    const rand = rng(9);
    for (let t = 0; t < 200; t++) {
      const v = Math.round(rand() * 300), os = [0, 0, 0].map(() => Math.round(rand() * 250));
      const truth = utility(clarkeRule([v, ...os], 400), 0, v);
      for (let r = 0; r <= 400; r += 5) expect(utility(clarkeRule([r, ...os], 400), 0, v)).toBeLessThan(truth + 1e-9);
    }
  });
  it("proportional rule rewards shading", () => expect(u(proportionalRule, 110)).toBeGreaterThan(u(proportionalRule, 130)));
});

describe("matching", () => {
  const { deferredAcceptance, receiverProposing, blockingPairs, topTradingCycles, permutations } = matching;
  const SP = [[2, 3, 1, 0], [2, 1, 0, 3], [3, 0, 1, 2], [3, 2, 1, 0]];
  const CP = [[0, 2, 1, 3], [3, 1, 0, 2], [2, 1, 3, 0], [1, 3, 0, 2]];
  it("student- and school-proposing DA give the two extreme stable matchings", () => {
    const a = deferredAcceptance(SP, CP), b = receiverProposing(SP, CP);
    expect(a.match).toEqual([1, 2, 0, 3]);
    expect(b.match).toEqual([0, 3, 2, 1]);
    expect(blockingPairs(a.match, SP, CP)).toEqual([]);
    expect(blockingPairs(b.match, SP, CP)).toEqual([]);
    expect(a.rounds).toHaveLength(3);
  });
  it("DA is always stable on random 5x5 markets", () => {
    const rand = rng(21);
    const perm = () => { const p = [0, 1, 2, 3, 4]; for (let i = 4; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return p; };
    for (let t = 0; t < 300; t++) {
      const S = Array.from({ length: 5 }, perm), C = Array.from({ length: 5 }, perm);
      expect(blockingPairs(deferredAcceptance(S, C).match, S, C)).toEqual([]);
    }
  });
  it("no student gains by misreporting in the example (strategy-proofness)", () => {
    const truth = deferredAcceptance(SP, CP).match;
    for (let s = 0; s < 4; s++) for (const lie of permutations(4)) {
      const got = deferredAcceptance(SP.map((p, i) => (i === s ? lie : p)), CP).match[s];
      expect(SP[s].indexOf(got)).toBeGreaterThan(SP[s].indexOf(truth[s]) - 1);
    }
  });
  it("a misplaced match shows a blocking pair", () => expect(blockingPairs([1, 0, 3, 2], SP, CP)).toHaveLength(4));
  it("TTC kidney example: a two-way swap then a three-way cycle", () => {
    const KP = [[1, 2, 3, 4, 0], [0, 2, 3, 4, 1], [0, 4, 3, 1, 2], [2, 0, 1, 4, 3], [3, 0, 1, 2, 4]];
    const r = topTradingCycles(KP);
    expect(r.alloc).toEqual([1, 0, 4, 2, 3]);
    expect(r.steps.map((s) => s.cycles.map((c) => c.length))).toEqual([[2], [3]]);
  });
  it("24 permutations of 4", () => expect(permutations(4)).toHaveLength(24));
});
