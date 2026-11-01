import { describe, expect, it } from "vitest";
import { backwardInduction, commitment, library, repeated, rng } from "../src/engine";

const M = { a: 120, c: 0 };

describe("commitment", () => {
  it("Cournot 40/40 earning 1600; Stackelberg 60/30 earning 1800/900", () => {
    expect(commitment.cournot(M)).toMatchObject({ q1: 40, q2: 40, profit1: 1600 });
    expect(commitment.stackelberg(M)).toMatchObject({ q1: 60, q2: 30, price: 30, profit1: 1800, profit2: 900 });
  });
  it("leader profit peaks at 60 on a grid", () => {
    let best = 0;
    for (let q = 0; q <= 120; q += 5) if (commitment.leaderProfit(M, q) > commitment.leaderProfit(M, best)) best = q;
    expect(best).toBe(60);
  });
  it("throwing away the wheel wins Chicken; keeping it lets the other driver commit", () => {
    const s = backwardInduction(library.wheelTree);
    expect(s.value).toEqual([2, -1]);
    expect(s.choice["wh"]).toBe(0);
  });
  it("building capacity deters entry when it costs 1", () => {
    const s = backwardInduction(library.capacityTree);
    expect(s.value).toEqual([3, 0]);
    expect(s.choice["cap-b-i"]).toBe(0); // would fight after building
    expect(s.choice["cap-w-i"]).toBe(1); // would share without it
  });
});

describe("repeated games", () => {
  const { strategy, playMatch, tournament, grimThreshold, AXELROD } = repeated;
  it("grim threshold for 5/3/1/0 is 1/2", () => expect(grimThreshold(AXELROD)).toBe(0.5));
  it("Tit for Tat vs Always Defect: one sucker round, then mutual defection", () => {
    const r = playMatch(strategy("tft"), strategy("alld"), 10);
    expect(r.a.join("")).toBe("CDDDDDDDDD");
    expect([r.scoreA, r.scoreB]).toEqual([9, 14]);
  });
  it("Win-Stay Lose-Shift recovers from a defection against itself", () => {
    const p = strategy("pavlov");
    expect(p.move(["D"], ["D"], Math.random)).toBe("C");
    expect(p.move(["D"], ["C"], Math.random)).toBe("D");
    expect(p.move(["C"], ["D"], Math.random)).toBe("D");
  });
  it("without noise, nice retaliators beat Always Defect in a mixed field", () => {
    const res = tournament(["tft", "grim", "allc", "alld", "pavlov"], 100, 0, AXELROD, rng(7), 3);
    expect(res[res.length - 1].id === "alld" || res[res.length - 1].id === "allc").toBe(true);
    expect(["tft", "grim", "pavlov"]).toContain(res[0].id);
  });
});
