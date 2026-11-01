import { GameTree, Solution, TreeNode } from "../engine";
import { h, s } from "./dom";

export interface TreeOptions {
  /** Backward-induction solution to display. */
  solution?: Solution;
  /** How many fold steps to show (default: all steps of `solution`). */
  folded?: number;
  caption?: string;
}

const PLAYER_CLASS = ["p0", "p1"];

/**
 * Draws a perfect-information game tree, top to bottom.
 * Folded nodes show the chosen branch in green, the rejected ones faded, and the value carried up.
 */
export function gameTree(t: GameTree, o: TreeOptions = {}): HTMLElement {
  const sol = o.solution;
  const shown = sol ? sol.steps.slice(0, o.folded ?? sol.steps.length) : [];
  const foldedChoice = new Map(shown.map((st) => [st.node.id, st]));
  const current = shown[shown.length - 1]?.node.id;
  const onPath = new Set(sol && shown.length === sol.steps.length ? sol.path : []);
  // Node badges: initials, or the last character ("1", "2") when initials collide.
  const initials = t.players.map((p) => p[0]);
  const tag = (i: number) => (new Set(initials).size === initials.length ? initials[i] : t.players[i].slice(-1));

  // Layout: leaves spaced evenly in order; parents centred over children.
  const pos = new Map<string, { x: number; y: number }>();
  let leafIdx = 0;
  let maxDepth = 0;
  const place = (n: TreeNode, d: number): number => {
    maxDepth = Math.max(maxDepth, d);
    const x = n.kind === "leaf" ? leafIdx++ : (() => { const xs = n.moves.map((m) => place(m.child, d + 1)); return (Math.min(...xs) + Math.max(...xs)) / 2; })();
    pos.set(n.id, { x, y: d });
    return x;
  };
  place(t.root, 0);
  const COLW = 118, ROWH = 96, PADX = 64, PADY = 34;
  const W = PADX * 2 + (leafIdx - 1) * COLW;
  const H = PADY * 2 + maxDepth * ROWH + 30;
  const X = (id: string) => PADX + pos.get(id)!.x * COLW;
  const Y = (id: string) => PADY + pos.get(id)!.y * ROWH;

  // Never shrink below ~75% (text stays legible on phones; wide trees scroll), never blow up past ~120%.
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "tree", role: "img", "aria-label": `Game tree: ${t.title}`,
    style: `min-width:${Math.round(W * 0.75)}px;max-width:${Math.round(W * 1.2)}px` });
  const edges = s("g");
  const nodes = s("g");
  svg.append(edges, nodes);

  const draw = (n: TreeNode) => {
    if (n.kind === "leaf") {
      const x = X(n.id), y = Y(n.id);
      const txt = s("text", { x, y: y + 6, "text-anchor": "middle", class: `leaf${onPath.has(n.id) ? " on" : ""}` });
      txt.append(s("tspan", {}, "("));
      n.payoffs.forEach((v, i) => {
        if (i) txt.append(s("tspan", {}, ", "));
        txt.append(s("tspan", { class: `v-${PLAYER_CLASS[i]}` }, String(v)));
      });
      txt.append(s("tspan", {}, ")"));
      nodes.append(txt);
      return;
    }
    const fold = foldedChoice.get(n.id);
    n.moves.forEach((m, i) => {
      const cls = ["edge", fold && (fold.choice === i ? "chosen" : "cut"), onPath.has(n.id) && onPath.has(m.child.id) && "on"].filter(Boolean).join(" ");
      const x1 = X(n.id), y1 = Y(n.id), x2 = X(m.child.id), y2 = Y(m.child.id) - (m.child.kind === "leaf" ? 14 : 0);
      edges.append(s("line", { x1, y1, x2, y2, class: cls }));
      const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
      const left = x2 < x1, straight = x2 === x1;
      edges.append(s("text", { x: mx + (straight ? 8 : left ? -8 : 8), y: my, "text-anchor": straight ? "start" : left ? "end" : "start", class: `action${fold && fold.choice !== i ? " cut" : ""}` }, m.action));
      draw(m.child);
    });
    const x = X(n.id), y = Y(n.id);
    nodes.append(s("circle", { cx: x, cy: y, r: 15, class: `node node-${PLAYER_CLASS[n.player]}${n.id === current && !onPath.size ? " current" : ""}` }));
    nodes.append(s("text", { x, y: y + 5, "text-anchor": "middle", class: "node-label" }, tag(n.player)));
    if (fold) {
      const v = s("text", { x: x + 22, y: y - 14, class: "carried" });
      v.append(s("tspan", {}, "("));
      fold.value.forEach((val, i) => { if (i) v.append(s("tspan", {}, ", ")); v.append(s("tspan", { class: `v-${PLAYER_CLASS[i]}` }, String(val))); });
      v.append(s("tspan", {}, ")"));
      nodes.append(v);
    }
  };
  draw(t.root);

  return h("figure", { class: "tree-wrap" },
    h("div", { class: "tree-scroll" }, svg),
    h("p", { class: "key" }, t.players.map((p, i) => [i ? ", " : "", h("span", { class: `chip chip-p${i}` }, `${tag(i)} = ${p}`)]), ". Payoffs are listed (", t.players.join(", "), ")."),
    o.caption ? h("figcaption", null, o.caption) : null);
}
