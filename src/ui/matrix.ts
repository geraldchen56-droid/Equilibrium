import { Alive, NormalFormGame, Profile, allAlive, bestResponses, pureNash } from "../engine";
import { h } from "./dom";

export interface MatrixOptions {
  alive?: Alive;
  /** Underline best-response payoffs. */
  showBestResponses?: boolean;
  /** Ring the Nash equilibrium cells. */
  showNash?: boolean;
  /** Extra highlighted cells (e.g. the outcome just played). */
  highlight?: Profile[];
  /** Dim a strategy that is about to be removed. */
  flag?: { player: 0 | 1; index: number } | null;
  onCell?: (r: number, c: number) => void;
  onStrategy?: (player: 0 | 1, index: number) => void;
  /** Let readers type new payoffs. */
  editable?: boolean;
  onEdit?: (r: number, c: number, who: 0 | 1, value: number) => void;
  caption?: string;
}

/**
 * Schelling-style payoff matrix: each cell is split on the diagonal,
 * Row's payoff bottom-left (cobalt), Column's payoff top-right (marigold).
 */
export function payoffMatrix(g: NormalFormGame, o: MatrixOptions = {}): HTMLElement {
  const alive = o.alive ?? allAlive(g);
  const nash = o.showNash ? pureNash(g, alive) : [];
  const isNash = (r: number, c: number) => nash.some(([a, b]) => a === r && b === c);
  const isHi = (r: number, c: number) => (o.highlight ?? []).some(([a, b]) => a === r && b === c);
  const rowBR = (c: number) => (o.showBestResponses ? bestResponses(g, 0, c, alive) : []);
  const colBR = (r: number) => (o.showBestResponses ? bestResponses(g, 1, r, alive) : []);

  const stratLabel = (player: 0 | 1, i: number) => {
    const dead = !alive[player].includes(i);
    const flagged = o.flag?.player === player && o.flag.index === i;
    const cls = `strat strat-p${player}${dead ? " dead" : ""}${flagged ? " flagged" : ""}`;
    const label = g.strategies[player][i];
    return o.onStrategy && !dead
      ? h("button", { class: cls, type: "button", onclick: () => o.onStrategy!(player, i), "aria-label": `${g.players[player]}: ${label}` }, label)
      : h("span", { class: cls }, label);
  };

  const num = (r: number, c: number, who: 0 | 1, best: boolean) => {
    const v = g.payoffs[r][c][who].toString();
    const cls = `pay pay-p${who}${best ? " best" : ""}`;
    if (!o.editable) return h("span", { class: cls }, v);
    const input = h("input", {
      class: cls, value: v, inputmode: "decimal", "aria-label": `${g.players[who]} payoff at ${g.strategies[0][r]} / ${g.strategies[1][c]}`,
      size: Math.max(2, v.length),
      onchange: (e: Event) => {
        const t = e.target as HTMLInputElement;
        const n = Number(t.value);
        if (Number.isFinite(n)) o.onEdit?.(r, c, who, n); else t.value = v;
      },
      onclick: (e: Event) => e.stopPropagation(),
    });
    return input;
  };

  const head = h("tr", null,
    h("th", { class: "corner" },
      h("span", { class: "who who-p1" }, g.players[1]),
      h("span", { class: "who who-p0" }, g.players[0])),
    g.strategies[1].map((_, c) => h("th", { scope: "col" }, stratLabel(1, c))));

  const rows = g.strategies[0].map((_, r) =>
    h("tr", null,
      h("th", { scope: "row" }, stratLabel(0, r)),
      g.strategies[1].map((_, c) => {
        const dead = !alive[0].includes(r) || !alive[1].includes(c);
        const cls = ["cell", dead && "dead", isNash(r, c) && !dead && "nash", isHi(r, c) && "hi", o.onCell && !dead && "clickable"].filter(Boolean).join(" ");
        return h("td", { class: cls, onclick: o.onCell && !dead ? () => o.onCell!(r, c) : null },
          h("div", { class: "split" },
            num(r, c, 1, colBR(r).includes(c)),
            num(r, c, 0, rowBR(c).includes(r))));
      })));

  return h("figure", { class: "matrix-wrap" },
    h("table", { class: "matrix" }, h("thead", null, head), h("tbody", null, rows)),
    o.caption ? h("figcaption", null, o.caption) : null);
}

/** Key explaining the notation; shown once per chapter. */
export const matrixKey = (g: NormalFormGame) =>
  h("p", { class: "key" },
    h("span", { class: "chip chip-p0" }, g.players[0]), " payoff bottom-left, ",
    h("span", { class: "chip chip-p1" }, g.players[1]), " payoff top-right.");
