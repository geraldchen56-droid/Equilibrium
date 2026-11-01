// Chapter 7: evolutionary game theory for symmetric two-strategy games.
// A[i][j] = payoff to an individual playing i against one playing j.
export type Sym2 = [[number, number], [number, number]];

export const hawkDove = (V: number, C: number): Sym2 => [[(V - C) / 2, V], [0, V / 2]];

/** Fitness of each strategy when a share x of the population plays strategy 0. */
export function fitness(A: Sym2, x: number): [number, number] {
  return [x * A[0][0] + (1 - x) * A[0][1], x * A[1][0] + (1 - x) * A[1][1]];
}

/** One Euler step of the replicator equation  x' = x(1 - x)(f0 - f1). */
export function replicatorStep(A: Sym2, x: number, dt = 0.05): number {
  const [f0, f1] = fitness(A, x);
  return Math.min(1, Math.max(0, x + dt * x * (1 - x) * (f0 - f1)));
}

export function replicatorPath(A: Sym2, x0: number, steps = 400, dt = 0.05): number[] {
  const out = [x0];
  let x = x0;
  for (let i = 0; i < steps; i++) { x = replicatorStep(A, x, dt); out.push(x); }
  return out;
}

/** Interior rest point where both strategies do equally well, or null. */
export function interiorRest(A: Sym2): number | null {
  const den = A[0][0] - A[0][1] - A[1][0] + A[1][1];
  if (den === 0) return null;
  const x = (A[1][1] - A[0][1]) / den;
  return x > 0 && x < 1 ? x : null;
}

/**
 * Evolutionarily stable strategies, as shares of strategy 0 (1 = all strategy 0, 0 = all strategy 1).
 * Pure i is an ESS if u(i,i) > u(j,i), or u(i,i) = u(j,i) and u(i,j) > u(j,j).
 * The interior mix is an ESS when each strategy is better when rare (anti-coordination).
 */
export function ess(A: Sym2): number[] {
  const out: number[] = [];
  const pure = (i: 0 | 1) => {
    const j = 1 - i;
    return A[i][i] > A[j][i] || (A[i][i] === A[j][i] && A[i][j] > A[j][j]);
  };
  if (pure(0)) out.push(1);
  const x = interiorRest(A);
  if (x !== null && A[0][0] < A[1][0] && A[1][1] < A[0][1]) out.push(x);
  if (pure(1)) out.push(0);
  return out;
}

// ---------- Spatial Prisoner's Dilemma (Nowak and May, 1992) ----------

/** Grid of 1 = cooperate, 0 = defect, n x n on a torus. */
export type Grid = Uint8Array;

const neighbours = (n: number, i: number): number[] => {
  const r = Math.floor(i / n), c = i % n, out: number[] = [];
  for (let dr = -1; dr <= 1; dr++) for (let dc = -1; dc <= 1; dc++) out.push(((r + dr + n) % n) * n + ((c + dc + n) % n));
  return out; // includes self, as in Nowak-May
};

/** Scores: each cell plays its 9-cell neighbourhood. C vs C = 1, D vs C = b, everything else 0. */
export function spatialScores(g: Grid, n: number, b: number): Float64Array {
  const s = new Float64Array(n * n);
  for (let i = 0; i < n * n; i++) {
    let t = 0;
    for (const j of neighbours(n, i)) if (g[j] === 1) t += g[i] === 1 ? 1 : b;
    s[i] = t;
  }
  return s;
}

/** Everyone copies the highest-scoring cell in their neighbourhood (ties keep their own strategy). */
export function spatialStep(g: Grid, n: number, b: number): Grid {
  const s = spatialScores(g, n, b);
  const next = new Uint8Array(n * n);
  for (let i = 0; i < n * n; i++) {
    let best = i;
    for (const j of neighbours(n, i)) if (s[j] > s[best]) best = j;
    next[i] = g[best];
  }
  return next;
}

export function randomGrid(n: number, coopShare: number, rand: () => number = Math.random): Grid {
  const g = new Uint8Array(n * n);
  for (let i = 0; i < n * n; i++) g[i] = rand() < coopShare ? 1 : 0;
  return g;
}

export const share = (g: Grid) => g.reduce((a, v) => a + v, 0) / g.length;
