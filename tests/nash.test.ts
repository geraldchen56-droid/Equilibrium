import { describe, expect, it } from "vitest";
import { bertrand, deviations, isNash, iteratedElimination, library, pureNash, randomIntGame, rng } from "../src/engine";

const { equilibriumHunt, drivingSide, stagHunt, chicken, prisonersDilemma, matchingPennies } = library;

describe("deviations", () => {
  it("in the PD, Row leaves (Silent, Silent) for Confess", () => {
    expect(deviations(prisonersDilemma, 0, 0)).toEqual({ row: 1, col: 1 });
    expect(deviations(prisonersDilemma, 1, 1)).toEqual({ row: null, col: null });
  });
  it("no profile of Matching Pennies is stable", () => {
    for (const r of [0, 1]) for (const c of [0, 1]) expect(isNash(matchingPennies, [r, c])).toBe(false);
  });
  it("agrees with pureNash on 200 random 3x3 games", () => {
    const rand = rng(42);
    for (let k = 0; k < 200; k++) {
      const g = randomIntGame(3, 3, 9, rand);
      const viaDev: [number, number][] = [];
      for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) if (isNash(g, [r, c])) viaDev.push([r, c]);
      expect(viaDev).toEqual(pureNash(g));
    }
  });
});

describe("chapter 2 games", () => {
  it("the hunt game has two equilibria and nothing dominated", () => {
    expect(pureNash(equilibriumHunt)).toEqual([[0, 0], [2, 2]]);
    expect(iteratedElimination(equilibriumHunt).steps).toHaveLength(0);
  });
  it("coordination, stag hunt and chicken each have two pure equilibria", () => {
    expect(pureNash(drivingSide)).toEqual([[0, 0], [1, 1]]);
    expect(pureNash(stagHunt)).toEqual([[0, 0], [1, 1]]);
    expect(pureNash(chicken)).toEqual([[0, 1], [1, 0]]);
  });
  it("Bertrand equilibria sit at the cheap end", () => {
    const g = bertrand([1, 2, 3, 4, 5], 1, 12);
    expect(pureNash(g)).toEqual([[0, 0], [1, 1], [2, 2]]);
    expect(g.payoffs[1][3].map(String)).toEqual(["12", "0"]);
  });
  it("seeded generator is reproducible", () => {
    const a = randomIntGame(2, 2, 9, rng(7));
    const b = randomIntGame(2, 2, 9, rng(7));
    expect(a.payoffs.flat(2).map(String)).toEqual(b.payoffs.flat(2).map(String));
  });
});
