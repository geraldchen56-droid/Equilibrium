import { Fraction } from "./fraction";
import { NormalFormGame, Player, payoff } from "./game";

/**
 * Expected payoff to `player` from pure strategy `own` when the opponent plays
 * their strategy 0 with probability `x` and strategy 1 with probability 1 - x (2-strategy opponent).
 */
export function expectedVsMix(g: NormalFormGame, player: Player, own: number, x: Fraction): Fraction {
  const one = new Fraction(1);
  return x.mul(payoff(g, player, own, 0)).add(one.sub(x).mul(payoff(g, player, own, 1)));
}

/** Same as expectedVsMix but with plain numbers, for plotting. */
export function expectedVsMixNum(g: NormalFormGame, player: Player, own: number, x: number): number {
  return x * payoff(g, player, own, 0).valueOf() + (1 - x) * payoff(g, player, own, 1).valueOf();
}

/**
 * The opponent probability (of their strategy 0) at which `player` is indifferent
 * between their two strategies, or null if the payoff lines are parallel.
 * Note it uses only `player`'s own payoffs: this threshold fixes the OPPONENT's equilibrium mix.
 */
export function indifferencePoint(g: NormalFormGame, player: Player): Fraction | null {
  const a = payoff(g, player, 0, 0), b = payoff(g, player, 0, 1);
  const c = payoff(g, player, 1, 0), d = payoff(g, player, 1, 1);
  // x*a + (1-x)*b = x*c + (1-x)*d  =>  x = (d - b) / (a - b - c + d)
  const den = a.sub(b).sub(c).add(d);
  if (den.isZero()) return null;
  return d.sub(b).div(den);
}

/** Best responses (0, 1 or both) of a 2-strategy player against an opponent mix x. */
export function bestResponseToMix(g: NormalFormGame, player: Player, x: Fraction): number[] {
  const u0 = expectedVsMix(g, player, 0, x), u1 = expectedVsMix(g, player, 1, x);
  return u0.gt(u1) ? [0] : u1.gt(u0) ? [1] : [0, 1];
}

/**
 * Poker river spot: bet `bet` into a pot of `pot`.
 * bluffShare: share of the bettor's bets that are bluffs so the caller is indifferent
 *   (caller risks bet to win pot + bet, so bluffs = bet / (pot + 2*bet)).
 * callShare: how often the caller must call so a pure bluff breaks even
 *   ((1 - c) * pot = c * bet, so c = pot / (pot + bet)).
 */
export function bluffMaths(pot: number, bet: number): { bluffShare: Fraction; callShare: Fraction } {
  const P = new Fraction(pot), B = new Fraction(bet);
  return {
    bluffShare: B.div(P.add(B.mul(2))),
    callShare: P.div(P.add(B)),
  };
}
