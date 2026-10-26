import { Fraction } from "./fraction";

/** Player index: 0 = Row player, 1 = Column player. */
export type Player = 0 | 1;

/** A two-player game in normal (matrix) form. payoffs[r][c] = [row payoff, column payoff]. */
export interface NormalFormGame {
  id: string;
  title: string;
  players: [string, string];
  strategies: [string[], string[]];
  payoffs: [Fraction, Fraction][][];
}

/** Profile = (row strategy index, column strategy index). */
export type Profile = [number, number];

/** Which strategies are still "alive" for each player (used by elimination). */
export type Alive = [number[], number[]];

export function makeGame(spec: {
  id: string;
  title: string;
  players?: [string, string];
  rows: string[];
  cols: string[];
  payoffs: [number, number][][];
}): NormalFormGame {
  const { rows, cols, payoffs } = spec;
  if (payoffs.length !== rows.length || payoffs.some((r) => r.length !== cols.length)) {
    throw new Error(`makeGame(${spec.id}): payoff matrix is not ${rows.length}x${cols.length}`);
  }
  return {
    id: spec.id,
    title: spec.title,
    players: spec.players ?? ["Row", "Column"],
    strategies: [rows, cols],
    payoffs: payoffs.map((row) => row.map(([a, b]) => [Fraction.of(a), Fraction.of(b)] as [Fraction, Fraction])),
  };
}

export const allAlive = (g: NormalFormGame): Alive => [
  g.strategies[0].map((_, i) => i),
  g.strategies[1].map((_, i) => i),
];

/** Payoff to `player` when they play `own` and the opponent plays `opp`. */
export function payoff(g: NormalFormGame, player: Player, own: number, opp: number): Fraction {
  return player === 0 ? g.payoffs[own][opp][0] : g.payoffs[opp][own][1];
}

export const other = (p: Player): Player => (p === 0 ? 1 : 0);

export function cloneWithPayoff(g: NormalFormGame, r: number, c: number, who: Player, v: number): NormalFormGame {
  const payoffs = g.payoffs.map((row) => row.map((cell) => [cell[0], cell[1]] as [Fraction, Fraction]));
  payoffs[r][c][who] = Fraction.of(v);
  return { ...g, payoffs };
}
