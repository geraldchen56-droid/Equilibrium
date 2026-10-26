import { describe, expect, it } from "vitest";
import { F, Fraction, bestResponses, iteratedElimination, mixed2x2, paretoOptimal, pureNash, library, makeGame } from "../src/engine";

const { prisonersDilemma: pd, eliminationPuzzle, advertisingWar, matchingPennies, battleOfSexes } = library;

describe("Fraction", () => {
  it("reduces and normalises sign", () => {
    expect(F(4, -6).toString()).toBe("-2/3");
    expect(F(1, 3).add(F(1, 6)).toString()).toBe("1/2");
    expect(new Fraction(0.25).toString()).toBe("1/4");
  });
  it("compares exactly", () => {
    expect(F(1, 3).lt(F(1, 2))).toBe(true);
    expect(F(2, 4).eq(F(1, 2))).toBe(true);
  });
});

describe("Prisoner's Dilemma", () => {
  it("Confess is a best response to everything", () => {
    expect(bestResponses(pd, 0, 0)).toEqual([1]);
    expect(bestResponses(pd, 0, 1)).toEqual([1]);
  });
  it("IEDS leaves (Confess, Confess)", () => {
    const { survivors, steps } = iteratedElimination(pd);
    expect(survivors).toEqual([[1], [1]]);
    expect(steps).toHaveLength(2);
  });
  it("unique Nash equilibrium is (Confess, Confess), which is not Pareto optimal", () => {
    expect(pureNash(pd)).toEqual([[1, 1]]);
    expect(paretoOptimal(pd)).not.toContainEqual([1, 1]);
    expect(paretoOptimal(pd)).toContainEqual([0, 0]);
  });
});

describe("Iterated elimination", () => {
  it("solves the 3x3 puzzle to (Top, Left) in four removals", () => {
    const { survivors, steps } = iteratedElimination(eliminationPuzzle);
    expect(survivors).toEqual([[0], [0]]);
    expect(steps.map((s) => [s.player, s.dominated])).toEqual([[1, 1], [0, 1], [0, 2], [1, 2]]);
  });
  it("advertising war is a PD in disguise", () => {
    expect(iteratedElimination(advertisingWar).survivors).toEqual([[0], [0]]);
  });
  it("does nothing when no strategy is dominated", () => {
    expect(iteratedElimination(battleOfSexes).steps).toHaveLength(0);
  });
  it("weak dominance removes weakly worse strategies", () => {
    const g = makeGame({ id: "w", title: "w", rows: ["A", "B"], cols: ["X", "Y"], payoffs: [[[1, 0], [1, 0]], [[1, 0], [0, 0]]] });
    expect(iteratedElimination(g, "strict").steps).toHaveLength(0);
    expect(iteratedElimination(g, "weak").survivors[0]).toEqual([0]);
  });
});

describe("Nash equilibrium", () => {
  it("Battle of the Sexes has two pure equilibria", () => {
    expect(pureNash(battleOfSexes)).toEqual([[0, 0], [1, 1]]);
  });
  it("Matching Pennies has none in pure strategies but 1/2-1/2 mixed", () => {
    expect(pureNash(matchingPennies)).toEqual([]);
    const m = mixed2x2(matchingPennies)!;
    expect(m.p.toString()).toBe("1/2");
    expect(m.q.toString()).toBe("1/2");
    expect(m.rowValue.toString()).toBe("0");
  });
  it("Battle of the Sexes mixed equilibrium is p=3/5, q=2/5", () => {
    const m = mixed2x2(battleOfSexes)!;
    expect(m.p.toString()).toBe("3/5");
    expect(m.q.toString()).toBe("2/5");
    expect(m.rowValue.toString()).toBe("6/5");
  });
  it("PD has no fully mixed equilibrium", () => {
    expect(mixed2x2(pd)).toBeNull();
  });
});
