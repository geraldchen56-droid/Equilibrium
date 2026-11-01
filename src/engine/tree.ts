// Extensive-form (game tree) games with perfect information.
import { NormalFormGame, makeGame } from "./game";

export interface Leaf { kind: "leaf"; id: string; payoffs: number[] }
export interface Move { action: string; child: TreeNode }
export interface Decision { kind: "decision"; id: string; player: number; moves: Move[] }
export type TreeNode = Leaf | Decision;

export interface GameTree {
  id: string;
  title: string;
  players: string[];
  root: TreeNode;
}

// ---------- Builders ----------

let auto = 0;
export const leaf = (...payoffs: number[]): Leaf => ({ kind: "leaf", id: `l${auto++}`, payoffs });
export const node = (player: number, moves: Record<string, TreeNode>, id = `d${auto++}`): Decision => ({
  kind: "decision", id, player,
  moves: Object.entries(moves).map(([action, child]) => ({ action, child })),
});

/** All decision nodes in pre-order. */
export function decisions(t: TreeNode): Decision[] {
  if (t.kind === "leaf") return [];
  return [t, ...t.moves.flatMap((m) => decisions(m.child))];
}

export function depthOf(t: TreeNode): number {
  return t.kind === "leaf" ? 0 : 1 + Math.max(...t.moves.map((m) => depthOf(m.child)));
}

/** Copy of the tree with one leaf's payoff for one player changed. */
export function withLeafPayoff(t: TreeNode, leafId: string, player: number, v: number): TreeNode {
  if (t.kind === "leaf") return t.id === leafId ? { ...t, payoffs: t.payoffs.map((p, i) => (i === player ? v : p)) } : t;
  return { ...t, moves: t.moves.map((m) => ({ ...m, child: withLeafPayoff(m.child, leafId, player, v) })) };
}

// ---------- Backward induction ----------

export interface FoldStep {
  node: Decision;
  /** Index of the move the mover picks. */
  choice: number;
  /** Payoffs the node is worth once folded. */
  value: number[];
  /** What each move was worth to the mover, for display. */
  options: number[];
}

export interface Solution {
  /** Steps in folding order: every node appears after all decision nodes below it. */
  steps: FoldStep[];
  value: number[];
  choice: Record<string, number>;
  /** Node ids along the equilibrium path, root first, ending at a leaf. */
  path: string[];
}

/**
 * Backward induction (Zermelo): solve each last decision, replace it by its value, repeat.
 * The result is the subgame-perfect equilibrium. Ties go to the first listed move.
 */
export function backwardInduction(t: GameTree | TreeNode): Solution {
  const root = "root" in t ? t.root : t;
  const steps: FoldStep[] = [];
  const choice: Record<string, number> = {};
  const solve = (n: TreeNode): number[] => {
    if (n.kind === "leaf") return n.payoffs;
    const vals = n.moves.map((m) => solve(m.child));
    const options = vals.map((v) => v[n.player]);
    let best = 0;
    options.forEach((u, i) => { if (u > options[best]) best = i; });
    choice[n.id] = best;
    steps.push({ node: n, choice: best, value: vals[best], options });
    return vals[best];
  };
  const value = solve(root);
  const path: string[] = [];
  let cur: TreeNode = root;
  for (;;) {
    path.push(cur.id);
    if (cur.kind === "leaf") break;
    cur = cur.moves[choice[cur.id]].child;
  }
  // Fold the deepest nodes first so the animation climbs level by level.
  const level = new Map<string, number>();
  const mark = (n: TreeNode, d: number) => { level.set(n.id, d); if (n.kind === "decision") n.moves.forEach((m) => mark(m.child, d + 1)); };
  mark(root, 0);
  steps.sort((a, b) => level.get(b.node.id)! - level.get(a.node.id)!);
  return { steps, value, choice, path };
}

// ---------- Tree -> matrix ----------

/**
 * Normal form of a two-player tree. A strategy is a complete plan: one action at
 * EVERY node the player owns, including nodes that the plan itself never reaches.
 */
export function toNormalForm(t: GameTree): { game: NormalFormGame; plans: [Record<string, number>[], Record<string, number>[]] } {
  const own = [0, 1].map((p) => decisions(t.root).filter((d) => d.player === p));
  const plansFor = (nodes: Decision[]): Record<string, number>[] =>
    nodes.reduce<Record<string, number>[]>((acc, d) => acc.flatMap((plan) => d.moves.map((_, i) => ({ ...plan, [d.id]: i }))), [{}]);
  const plans = [plansFor(own[0]), plansFor(own[1])] as [Record<string, number>[], Record<string, number>[]];
  const label = (p: number, plan: Record<string, number>) =>
    own[p].map((d) => d.moves[plan[d.id]].action).join(" / ") || "(no move)";
  const play = (a: Record<string, number>, b: Record<string, number>): number[] => {
    let cur = t.root;
    while (cur.kind === "decision") cur = cur.moves[(cur.player === 0 ? a : b)[cur.id]].child;
    return cur.payoffs;
  };
  const game = makeGame({
    id: `${t.id}-nf`, title: t.title, players: [t.players[0], t.players[1]],
    rows: plans[0].map((pl) => label(0, pl)),
    cols: plans[1].map((pl) => label(1, pl)),
    payoffs: plans[0].map((a) => plans[1].map((b) => { const v = play(a, b); return [v[0], v[1]] as [number, number]; })),
  });
  return { game, plans };
}

// ---------- Two classic puzzles ----------

/**
 * "Race to N": players alternately add 1..maxStep to a running total; whoever says `target` wins.
 * Returns the totals you want to SAY (safe totals). From any other total, the right move
 * reaches the next safe total. Found by backward induction from the target.
 */
export function raceSafeTotals(target: number, maxStep: number): number[] {
  const safe: boolean[] = [];
  for (let t = target; t >= 0; t--) {
    // t is safe if the opponent, moving from t, cannot reach a safe total... i.e. every reply is unsafe.
    if (t === target) { safe[t] = true; continue; }
    let oppCanReachSafe = false;
    for (let k = 1; k <= maxStep && t + k <= target; k++) if (safe[t + k]) oppCanReachSafe = true;
    safe[t] = !oppCanReachSafe;
  }
  return safe.map((s, t) => (s ? t : -1)).filter((t) => t > 0);
}

/** Best step from `total`, or null if every step loses against perfect play. */
export function raceBestStep(total: number, target: number, maxStep: number): number | null {
  const safe = new Set(raceSafeTotals(target, maxStep));
  for (let k = 1; k <= maxStep && total + k <= target; k++) if (safe.has(total + k)) return k;
  return null;
}

export interface PirateRound {
  /** Pirates alive this round, most senior first (1 = most senior overall). */
  pirates: number[];
  /** Coins each alive pirate receives under the proposal, same order. */
  split: number[];
  /** Votes needed to pass, including the proposer's own. */
  needed: number;
  /** Pirates (overall numbers) bought with a coin more than they'd get next round. */
  bought: number[];
}

/**
 * The pirate game. The most senior pirate proposes a split of `coins`; everyone votes.
 * At least half the votes (proposer included) passes it; otherwise the proposer is thrown
 * overboard and the next most senior proposes. Pirates want to live, then want gold, and
 * vote no when indifferent. Solved backward from one pirate. Valid while coins suffice.
 */
export function pirateGame(n: number, coins = 100): PirateRound[] {
  const rounds: PirateRound[] = [];
  let prev: number[] = []; // split in the round with one fewer pirate (pirates 2..n of this round)
  for (let k = 1; k <= n; k++) {
    const pirates = Array.from({ length: k }, (_, i) => n - k + 1 + i);
    const needed = Math.ceil(k / 2);
    // Price of each other pirate's vote: one coin more than they'd get next round.
    const others = prev.map((g, i) => ({ i: i + 1, cost: g + 1 }));
    const buy = others.slice().sort((a, b) => a.cost - b.cost || a.i - b.i).slice(0, needed - 1);
    const split = new Array(k).fill(0);
    let spent = 0;
    for (const b of buy) { split[b.i] = b.cost; spent += b.cost; }
    split[0] = coins - spent;
    rounds.push({ pirates, split, needed, bought: buy.map((b) => pirates[b.i]) });
    prev = split;
  }
  return rounds;
}
