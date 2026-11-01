// Chapter 6: the repeated Prisoner's Dilemma.
export type Move = "C" | "D";

/** Stage payoffs: Temptation > Reward > Punishment > Sucker. */
export interface PD { T: number; R: number; P: number; S: number }
export const AXELROD: PD = { T: 5, R: 3, P: 1, S: 0 };

export function stagePayoff(pd: PD, me: Move, them: Move): number {
  if (me === "C") return them === "C" ? pd.R : pd.S;
  return them === "C" ? pd.T : pd.P;
}

export interface Strategy {
  id: string;
  name: string;
  blurb: string;
  /** Next move given both histories (mine, theirs) and a random source. */
  move: (mine: Move[], theirs: Move[], rand: () => number) => Move;
}

export const STRATEGIES: Strategy[] = [
  { id: "tft", name: "Tit for Tat", blurb: "Cooperates first, then copies your last move.", move: (_m, t) => (t.length ? t[t.length - 1] : "C") },
  { id: "allc", name: "Always Cooperate", blurb: "Cooperates no matter what.", move: () => "C" },
  { id: "alld", name: "Always Defect", blurb: "Defects no matter what.", move: () => "D" },
  { id: "grim", name: "Grim Trigger", blurb: "Cooperates until you defect once, then defects forever.", move: (_m, t) => (t.includes("D") ? "D" : "C") },
  { id: "pavlov", name: "Win-Stay, Lose-Shift", blurb: "Repeats its move after a good outcome (R or T), switches after a bad one.", move: (m, t) => {
    if (!m.length) return "C";
    const last = m[m.length - 1], other = t[t.length - 1];
    return last === other ? "C" : "D"; // CC→C, DD→C (shift), CD→D (shift), DC→D (stay)
  } },
  { id: "gtft", name: "Generous Tit for Tat", blurb: "Like Tit for Tat, but forgives a defection a third of the time.", move: (_m, t, r) =>
    !t.length || t[t.length - 1] === "C" ? "C" : r() < 1 / 3 ? "C" : "D" },
  { id: "tf2t", name: "Tit for Two Tats", blurb: "Only retaliates after two defections in a row.", move: (_m, t) =>
    t.length >= 2 && t[t.length - 1] === "D" && t[t.length - 2] === "D" ? "D" : "C" },
  { id: "rand", name: "Random", blurb: "Flips a coin every round.", move: (_m, _t, r) => (r() < 0.5 ? "C" : "D") },
];
export const strategy = (id: string) => STRATEGIES.find((s) => s.id === id)!;

export interface MatchResult { a: Move[]; b: Move[]; scoreA: number; scoreB: number }

/**
 * Play `rounds` rounds. With probability `noise`, each intended move is flipped
 * (a trembling hand), which is what separates forgiving strategies from unforgiving ones.
 */
export function playMatch(A: Strategy, B: Strategy, rounds: number, pd: PD = AXELROD, noise = 0, rand: () => number = Math.random): MatchResult {
  const a: Move[] = [], b: Move[] = [];
  let scoreA = 0, scoreB = 0;
  const flip = (m: Move): Move => (noise > 0 && rand() < noise ? (m === "C" ? "D" : "C") : m);
  for (let i = 0; i < rounds; i++) {
    const ma = flip(A.move(a, b, rand)), mb = flip(B.move(b, a, rand));
    a.push(ma); b.push(mb);
    scoreA += stagePayoff(pd, ma, mb); scoreB += stagePayoff(pd, mb, ma);
  }
  return { a, b, scoreA, scoreB };
}

/** Round-robin (including each strategy against a copy of itself), average score per round. */
export function tournament(ids: string[], rounds: number, noise: number, pd: PD = AXELROD, rand: () => number = Math.random, repeats = 5) {
  const totals = new Map(ids.map((id) => [id, 0]));
  const games = new Map(ids.map((id) => [id, 0]));
  for (let rep = 0; rep < repeats; rep++) {
    for (let i = 0; i < ids.length; i++) for (let j = i; j < ids.length; j++) {
      const r = playMatch(strategy(ids[i]), strategy(ids[j]), rounds, pd, noise, rand);
      totals.set(ids[i], totals.get(ids[i])! + r.scoreA); games.set(ids[i], games.get(ids[i])! + rounds);
      if (i !== j) { totals.set(ids[j], totals.get(ids[j])! + r.scoreB); games.set(ids[j], games.get(ids[j])! + rounds); }
    }
  }
  return ids.map((id) => ({ id, avg: totals.get(id)! / games.get(id)! })).sort((x, y) => y.avg - x.avg);
}

/**
 * Grim trigger sustains cooperation when the discount factor (chance the game continues)
 * satisfies R/(1-d) >= T + d P/(1-d), i.e. d >= (T - R)/(T - P).
 */
export const grimThreshold = (pd: PD) => (pd.T - pd.R) / (pd.T - pd.P);
export const valueCooperate = (pd: PD, d: number) => pd.R / (1 - d);
export const valueDeviate = (pd: PD, d: number) => pd.T + (d * pd.P) / (1 - d);
