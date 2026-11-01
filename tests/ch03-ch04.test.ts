import { describe, expect, it } from "vitest";
import {
  F, backwardInduction, bestResponseToMix, bluffMaths, cloneWithPayoff, expectedVsMix, indifferencePoint,
  library, mixed2x2, pirateGame, pureNash, raceBestStep, raceSafeTotals, toNormalForm, withLeafPayoff,
} from "../src/engine";

const { penaltyKick, matchingPennies, battleOfSexes, entryTree, centipedeTree, leaderTree } = library;

describe("mixed strategies", () => {
  it("penalty kick: hand-solved mix is p = 37/62, q = 20/31, scoring 2445/31 %", () => {
    // Keeper indifferent: 70p + 92(1-p) = 95p + 55(1-p) -> p = 37/62.
    // Kicker indifferent: 70q + 95(1-q) = 92q + 55(1-q) -> q = 20/31.
    const m = mixed2x2(penaltyKick)!;
    expect(m.p.toString()).toBe("37/62");
    expect(m.q.toString()).toBe("20/31");
    expect(m.rowValue.toString()).toBe("2445/31");
    expect(pureNash(penaltyKick)).toEqual([]);
  });
  it("indifference points: a player's threshold sets the OTHER player's mix", () => {
    expect(indifferencePoint(penaltyKick, 0)!.toString()).toBe("20/31"); // keeper's q
    expect(indifferencePoint(penaltyKick, 1)!.toString()).toBe("37/62"); // kicker's p
  });
  it("expected payoffs are equal at the indifference point", () => {
    const q = F(20, 31);
    expect(expectedVsMix(penaltyKick, 0, 0, q).eq(expectedVsMix(penaltyKick, 0, 1, q))).toBe(true);
    expect(bestResponseToMix(penaltyKick, 0, q)).toEqual([0, 1]);
    expect(bestResponseToMix(penaltyKick, 0, F(1, 2))).toEqual([0]); // keeper rarely goes natural: kick natural
  });
  it("in a general game, changing only your own payoff leaves your own mix alone", () => {
    const better = cloneWithPayoff(penaltyKick, 0, 1, 0, 99); // Row's payoff only
    expect(mixed2x2(better)!.p.toString()).toBe("37/62");
    expect(mixed2x2(better)!.q.gt(mixed2x2(penaltyKick)!.q)).toBe(true);
  });
  it("zero-sum surprise: a better natural-side kick means aiming natural LESS (37/62 -> 37/66)", () => {
    // Keeper: 70p + 92(1-p) = 99p + 55(1-p) -> 37 = 66p.
    const better = cloneWithPayoff(cloneWithPayoff(penaltyKick, 0, 1, 0, 99), 0, 1, 1, 1);
    const m = mixed2x2(better)!;
    expect(m.p.toString()).toBe("37/66");
    expect(m.rowValue.gt(mixed2x2(penaltyKick)!.rowValue)).toBe(true);
  });
  it("classics: pennies 1/2-1/2, battle of the sexes p = 3/5, q = 2/5", () => {
    expect(mixed2x2(matchingPennies)).toMatchObject({ p: F(1, 2), q: F(1, 2) });
    const b = mixed2x2(battleOfSexes)!;
    expect([b.p.toString(), b.q.toString()]).toEqual(["3/5", "2/5"]);
  });
  it("poker: pot-sized bet means 1/3 bluffs and calling half the time", () => {
    const m = bluffMaths(100, 100);
    expect([m.bluffShare.toString(), m.callShare.toString()]).toEqual(["1/3", "1/2"]);
  });
});

describe("game trees", () => {
  it("entry game: incumbent shares, entrant enters", () => {
    const s = backwardInduction(entryTree);
    expect(s.value).toEqual([1, 2]);
    expect(s.path).toEqual(["ent", "inc", expect.any(String)]);
    expect(s.steps.map((x) => x.node.id)).toEqual(["inc", "ent"]);
  });
  it("entry game in matrix form has a second Nash equilibrium built on an empty threat", () => {
    const { game } = toNormalForm(entryTree);
    expect(game.strategies).toEqual([["Out", "In"], ["Fight", "Share"]]);
    expect(pureNash(game)).toEqual([[0, 0], [1, 1]]);
  });
  it("making a fight profitable flips the answer", () => {
    const fightLeaf = (entryTree.root as any).moves[1].child.moves[0].child.id;
    const s = backwardInduction({ ...entryTree, root: withLeafPayoff(entryTree.root, fightLeaf, 1, 3) });
    expect(s.value).toEqual([0, 4]);
  });
  it("centipede unravels to Take at the first move; deepest node folds first", () => {
    const s = backwardInduction(centipedeTree);
    expect(s.value).toEqual([2, 0]);
    expect(s.steps.map((x) => x.node.id)).toEqual(["c4", "c3", "c2", "c1"]);
  });
  it("capacity race: leader goes Big and gets 3", () => {
    expect(backwardInduction(leaderTree).value).toEqual([3, 1]);
    const { game } = toNormalForm(leaderTree);
    expect(game.strategies[1]).toEqual(["Big / Big", "Big / Small", "Small / Big", "Small / Small"]);
  });
});

describe("puzzles", () => {
  it("race to 21 adding 1-3: say 1, 5, 9, 13, 17, 21", () => {
    expect(raceSafeTotals(21, 3)).toEqual([1, 5, 9, 13, 17, 21]);
    expect(raceBestStep(0, 21, 3)).toBe(1);
    expect(raceBestStep(5, 21, 3)).toBeNull();
    expect(raceSafeTotals(20, 2)).toEqual([2, 5, 8, 11, 14, 17, 20]);
  });
  it("pirates: five pirates split 98, 0, 1, 0, 1", () => {
    const r = pirateGame(5);
    expect(r[4].split).toEqual([98, 0, 1, 0, 1]);
    expect(r[4].bought).toEqual([3, 5]);
    expect(r.map((x) => x.split[0])).toEqual([100, 100, 99, 99, 98]);
  });
});
