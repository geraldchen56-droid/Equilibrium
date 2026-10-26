import { Fraction } from "./fraction";
import { Alive, NormalFormGame, Player, Profile, allAlive, other, payoff } from "./game";

// ---------- Best responses ----------

/** Indices of `player`'s best responses to the opponent's strategy `opp`, among `alive` strategies. */
export function bestResponses(g: NormalFormGame, player: Player, opp: number, alive = allAlive(g)): number[] {
  const mine = alive[player];
  let best: Fraction | null = null;
  let out: number[] = [];
  for (const s of mine) {
    const u = payoff(g, player, s, opp);
    if (best === null || u.gt(best)) { best = u; out = [s]; }
    else if (u.eq(best)) out.push(s);
  }
  return out;
}

// ---------- Dominance ----------

export type DominanceKind = "strict" | "weak";

export interface Domination {
  player: Player;
  dominated: number;
  by: number;
  kind: DominanceKind;
}

/** Does strategy a dominate strategy b for `player`, given the opponent's alive strategies? */
export function dominates(g: NormalFormGame, player: Player, a: number, b: number, alive: Alive, kind: DominanceKind): boolean {
  if (a === b) return false;
  let strictlyBetterSomewhere = false;
  for (const opp of alive[other(player)]) {
    const ua = payoff(g, player, a, opp);
    const ub = payoff(g, player, b, opp);
    if (kind === "strict" && !ua.gt(ub)) return false;
    if (kind === "weak") {
      if (ua.lt(ub)) return false;
      if (ua.gt(ub)) strictlyBetterSomewhere = true;
    }
  }
  return kind === "strict" ? alive[other(player)].length > 0 : strictlyBetterSomewhere;
}

/** Every dominated strategy for `player` right now, each with one strategy that dominates it. */
export function findDominated(g: NormalFormGame, player: Player, alive: Alive, kind: DominanceKind = "strict"): Domination[] {
  const out: Domination[] = [];
  for (const b of alive[player]) {
    const by = alive[player].find((a) => dominates(g, player, a, b, alive, kind));
    if (by !== undefined) out.push({ player, dominated: b, by, kind });
  }
  return out;
}

export interface EliminationStep extends Domination {
  aliveBefore: Alive;
  aliveAfter: Alive;
}

/**
 * Iterated elimination of dominated strategies (IEDS).
 * Removes ONE strategy per step (Row checked first, then Column) so the UI can animate each step.
 * For strict dominance the final result does not depend on the order.
 */
export function iteratedElimination(g: NormalFormGame, kind: DominanceKind = "strict"): { steps: EliminationStep[]; survivors: Alive } {
  let alive = allAlive(g);
  const steps: EliminationStep[] = [];
  for (let guard = 0; guard < 1000; guard++) {
    const found = [...findDominated(g, 0, alive, kind), ...findDominated(g, 1, alive, kind)][0];
    if (!found) break;
    const next: Alive = [alive[0].slice(), alive[1].slice()];
    next[found.player] = next[found.player].filter((s) => s !== found.dominated);
    steps.push({ ...found, aliveBefore: alive, aliveAfter: next });
    alive = next;
  }
  return { steps, survivors: alive };
}

// ---------- Pure-strategy Nash equilibrium ----------

/** All pure-strategy Nash equilibria: profiles where each strategy is a best response to the other. */
export function pureNash(g: NormalFormGame, alive = allAlive(g)): Profile[] {
  const out: Profile[] = [];
  for (const r of alive[0]) {
    for (const c of alive[1]) {
      if (bestResponses(g, 0, c, alive).includes(r) && bestResponses(g, 1, r, alive).includes(c)) out.push([r, c]);
    }
  }
  return out;
}

// ---------- Mixed strategies (2x2) ----------

export interface Mixed2x2 {
  /** Probability Row plays strategy 0. */
  p: Fraction;
  /** Probability Column plays strategy 0. */
  q: Fraction;
  rowValue: Fraction;
  colValue: Fraction;
}

/**
 * Fully mixed equilibrium of a 2x2 game via the indifference principle:
 * Row picks p so Column is indifferent; Column picks q so Row is indifferent.
 * Returns null if no strictly-mixed equilibrium exists.
 */
export function mixed2x2(g: NormalFormGame): Mixed2x2 | null {
  if (g.strategies[0].length !== 2 || g.strategies[1].length !== 2) return null;
  const A = (r: number, c: number) => g.payoffs[r][c][0];
  const B = (r: number, c: number) => g.payoffs[r][c][1];

  // Column indifferent: p*B00 + (1-p)*B10 = p*B01 + (1-p)*B11
  const denP = B(0, 0).sub(B(1, 0)).sub(B(0, 1)).add(B(1, 1));
  // Row indifferent: q*A00 + (1-q)*A01 = q*A10 + (1-q)*A11
  const denQ = A(0, 0).sub(A(0, 1)).sub(A(1, 0)).add(A(1, 1));
  if (denP.isZero() || denQ.isZero()) return null;

  const p = B(1, 1).sub(B(1, 0)).div(denP);
  const q = A(1, 1).sub(A(0, 1)).div(denQ);
  const inOpen = (x: Fraction) => x.gt(0) && x.lt(1);
  if (!inOpen(p) || !inOpen(q)) return null;

  const one = new Fraction(1);
  const rowValue = q.mul(A(0, 0)).add(one.sub(q).mul(A(0, 1)));
  const colValue = p.mul(B(0, 0)).add(one.sub(p).mul(B(1, 0)));
  return { p, q, rowValue, colValue };
}

// ---------- Welfare helpers (used to show "the tragedy" in the Prisoner's Dilemma) ----------

/** Profiles that are Pareto-optimal: no other profile makes someone better off without hurting the other. */
export function paretoOptimal(g: NormalFormGame): Profile[] {
  const cells: Profile[] = [];
  g.payoffs.forEach((row, r) => row.forEach((_, c) => cells.push([r, c])));
  return cells.filter(([r, c]) => {
    const [a, b] = g.payoffs[r][c];
    return !cells.some(([r2, c2]) => {
      const [a2, b2] = g.payoffs[r2][c2];
      return a2.gte(a) && b2.gte(b) && (a2.gt(a) || b2.gt(b));
    });
  });
}

// ---------- Unilateral deviations (the "no regrets" test) ----------

export interface Deviation {
  /** A strictly better Row strategy against this column, or null if Row is happy. */
  row: number | null;
  /** A strictly better Column strategy against this row, or null if Column is happy. */
  col: number | null;
}

/**
 * Would either player switch away from (r, c) on their own?
 * Returns the best strictly-improving switch for each player (first one if tied).
 * A profile with no deviations is a Nash equilibrium.
 */
export function deviations(g: NormalFormGame, r: number, c: number, alive = allAlive(g)): Deviation {
  const rowBest = bestResponses(g, 0, c, alive)[0];
  const colBest = bestResponses(g, 1, r, alive)[0];
  return {
    row: g.payoffs[rowBest][c][0].gt(g.payoffs[r][c][0]) ? rowBest : null,
    col: g.payoffs[r][colBest][1].gt(g.payoffs[r][c][1]) ? colBest : null,
  };
}

export const isNash = (g: NormalFormGame, [r, c]: Profile, alive = allAlive(g)) => {
  const d = deviations(g, r, c, alive);
  return d.row === null && d.col === null;
};
