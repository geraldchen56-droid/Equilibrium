import { NormalFormGame, makeGame } from "./game";

/** Seeded PRNG (mulberry32) so tests and shared links can reproduce a game. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Random m x n game with integer payoffs 0..max. */
export function randomIntGame(m: number, n: number, max = 9, rand: () => number = Math.random): NormalFormGame {
  const r = () => Math.floor(rand() * (max + 1));
  const L = "ABCDEFGH";
  const W = "XYZUVW";
  return makeGame({
    id: "random", title: "Random game",
    rows: Array.from({ length: m }, (_, i) => L[i]),
    cols: Array.from({ length: n }, (_, j) => W[j]),
    payoffs: Array.from({ length: m }, () => Array.from({ length: n }, () => [r(), r()] as [number, number])),
  });
}

/**
 * Bertrand price competition with a fixed market of `customers`.
 * The cheaper firm wins every customer; equal prices split them.
 * Profit = (price - cost) x customers won.
 */
export function bertrand(prices: number[], cost: number, customers: number, players: [string, string] = ["Firm A", "Firm B"]): NormalFormGame {
  const profit = (mine: number, theirs: number) =>
    mine < theirs ? (mine - cost) * customers : mine === theirs ? ((mine - cost) * customers) / 2 : 0;
  const label = (p: number) => `$${p}`;
  return makeGame({
    id: "bertrand", title: "Price war", players,
    rows: prices.map(label), cols: prices.map(label),
    payoffs: prices.map((a) => prices.map((b) => [profit(a, b), profit(b, a)] as [number, number])),
  });
}
