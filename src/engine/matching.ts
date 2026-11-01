// Chapter 12: two-sided matching and exchange.
// Preferences are lists of indices, most preferred first. One-to-one, equal-sized sides.

export interface DARound { proposals: [number, number][]; held: (number | null)[]; rejected: [number, number][] }
export interface DAResult {
  /** match[p] = receiver index for proposer p (or -1). */
  match: number[];
  rounds: DARound[];
}

/** Gale-Shapley deferred acceptance with simultaneous proposals each round. */
export function deferredAcceptance(pPrefs: number[][], rPrefs: number[][]): DAResult {
  const nP = pPrefs.length, nR = rPrefs.length;
  const next = new Array(nP).fill(0);          // next index in each proposer's list
  const held: (number | null)[] = new Array(nR).fill(null);
  const rank = rPrefs.map((list) => { const r = new Array(nP).fill(Infinity); list.forEach((p, i) => (r[p] = i)); return r; });
  const rounds: DARound[] = [];
  const free = () => Array.from({ length: nP }, (_, p) => p).filter((p) => !held.includes(p) && next[p] < pPrefs[p].length);
  for (let guard = 0; guard < nP * nR + 2; guard++) {
    const f = free();
    if (!f.length) break;
    const proposals: [number, number][] = f.map((p) => [p, pPrefs[p][next[p]++]]);
    const rejected: [number, number][] = [];
    for (let r = 0; r < nR; r++) {
      const suitors = proposals.filter(([, x]) => x === r).map(([p]) => p);
      if (held[r] !== null) suitors.push(held[r]!);
      if (!suitors.length) continue;
      const best = suitors.filter((p) => rank[r][p] < Infinity).sort((a, b) => rank[r][a] - rank[r][b])[0] ?? null;
      suitors.forEach((p) => { if (p !== best) rejected.push([p, r]); });
      held[r] = best;
    }
    rounds.push({ proposals, held: held.slice(), rejected });
  }
  const match = new Array(nP).fill(-1);
  held.forEach((p, r) => { if (p !== null) match[p] = r; });
  return { match, rounds };
}

/** Pairs (p, r) who both prefer each other to their current partners. */
export function blockingPairs(match: number[], pPrefs: number[][], rPrefs: number[][]): [number, number][] {
  const partnerOf = new Array(rPrefs.length).fill(-1);
  match.forEach((r, p) => { if (r >= 0) partnerOf[r] = p; });
  const prefers = (list: number[], a: number, b: number) => {
    const ia = list.indexOf(a), ib = b < 0 ? Infinity : list.indexOf(b);
    return ia >= 0 && (ib < 0 || ia < ib);
  };
  const out: [number, number][] = [];
  for (let p = 0; p < pPrefs.length; p++) for (const r of pPrefs[p]) {
    if (r === match[p]) continue;
    if (prefers(pPrefs[p], r, match[p]) && prefers(rPrefs[r], p, partnerOf[r])) out.push([p, r]);
  }
  return out;
}

/** Swap the roles: receivers propose. Returns match from the original proposers' point of view. */
export function receiverProposing(pPrefs: number[][], rPrefs: number[][]): DAResult {
  const res = deferredAcceptance(rPrefs, pPrefs);
  const match = new Array(pPrefs.length).fill(-1);
  res.match.forEach((p, r) => { if (p >= 0) match[p] = r; });
  return { match, rounds: res.rounds };
}

export interface TTCStep { cycles: number[][]; assigned: [number, number][] }

/**
 * Top trading cycles (Shapley and Scarf, 1974): agent i owns item i. Everyone points to the owner of their
 * favourite remaining item; cycles trade and leave; repeat. Returns alloc[i] = item received.
 */
export function topTradingCycles(prefs: number[][]): { alloc: number[]; steps: TTCStep[] } {
  const n = prefs.length;
  const alloc = new Array(n).fill(-1);
  const left = new Set(Array.from({ length: n }, (_, i) => i));
  const steps: TTCStep[] = [];
  while (left.size) {
    const points = new Map<number, number>();
    for (const i of left) points.set(i, prefs[i].find((x) => left.has(x)) ?? i);
    const cycles: number[][] = [];
    const seen = new Set<number>();
    for (const start of left) {
      if (seen.has(start)) continue;
      const path: number[] = [];
      let cur = start;
      while (!seen.has(cur) && !path.includes(cur)) { path.push(cur); cur = points.get(cur)!; }
      const k = path.indexOf(cur);
      if (k >= 0) cycles.push(path.slice(k));
      path.forEach((x) => seen.add(x));
    }
    const assigned: [number, number][] = [];
    for (const cyc of cycles) for (const i of cyc) { alloc[i] = points.get(i)!; assigned.push([i, alloc[i]]); }
    for (const cyc of cycles) for (const i of cyc) left.delete(i);
    steps.push({ cycles, assigned });
  }
  return { alloc, steps };
}

/** All permutations of [0..n-1], for "what if I lied" explorers. */
export function permutations(n: number): number[][] {
  if (n === 0) return [[]];
  const out: number[][] = [];
  for (const p of permutations(n - 1)) for (let i = 0; i <= p.length; i++) out.push([...p.slice(0, i), n - 1, ...p.slice(i)]);
  return out;
}
