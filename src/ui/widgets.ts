// Shared building blocks for chapter interactives (Ch 5 onwards).
import { clear, h, s } from "./dom";

export const pct = (x: number, dp = 0) => `${(x * 100).toFixed(dp)}%`;
export const num = (x: number, dp = 2) => (Math.round(x * 10 ** dp) / 10 ** dp).toString();

// ---------- Panels with persistent sliders ----------

export interface SliderDef { key: string; label: (v: number) => string; min: number; max: number; step?: number; value: number; aria?: string }

/**
 * An interactive panel with one or more sliders that stay mounted (so dragging works),
 * and an output area that `paint` redraws on every change.
 */
export function sliderPanel(defs: SliderDef[], paint: (v: Record<string, number>, out: HTMLElement) => void, extra?: (redraw: () => void) => Node): HTMLElement {
  const box = h("div", { class: "interactive" });
  const vals: Record<string, number> = {};
  const labels: Record<string, HTMLElement> = {};
  const out = h("div");
  const redraw = () => { defs.forEach((d) => { labels[d.key].textContent = d.label(vals[d.key]); }); clear(out); paint({ ...vals }, out); };
  const controls = h("div", { class: defs.length > 1 ? "two-col" : "" }, defs.map((d) => {
    vals[d.key] = d.value;
    labels[d.key] = h("span");
    const input = h("input", { type: "range", min: d.min, max: d.max, step: d.step ?? 1, value: d.value, "aria-label": d.aria ?? d.key,
      oninput: () => { vals[d.key] = Number(input.value); redraw(); } }) as HTMLInputElement;
    return h("label", { class: "range" }, labels[d.key], input);
  }));
  box.append(controls);
  if (extra) box.append(extra(redraw));
  box.append(out);
  redraw();
  return box;
}

// ---------- Worked-example stepper ----------

export function stepper(steps: [string, string | Node][]): HTMLElement {
  const box = h("div", { class: "interactive" });
  let shown = 1;
  const render = () => {
    clear(box);
    box.append(
      h("ol", { class: "worked" }, steps.slice(0, shown).map(([t, body]) => h("li", null, h("strong", null, t), h("p", null, body)))),
      h("div", { class: "controls" },
        shown < steps.length ? h("button", { class: "btn btn-p0", type: "button", onclick: () => { shown++; render(); } }, "Next step") : "",
        shown < steps.length ? h("button", { class: "btn btn-quiet", type: "button", onclick: () => { shown = steps.length; render(); } }, "Show all") : "",
        shown > 1 ? h("button", { class: "btn btn-quiet", type: "button", onclick: () => { shown = 1; render(); } }, "Start over") : ""));
  };
  render();
  return box;
}

// ---------- Tabs ----------

export function tabRow(names: string[], active: number, pick: (i: number) => void, aria = "Choose"): HTMLElement {
  return h("div", { class: "tabs", role: "group", "aria-label": aria },
    names.map((n, i) => h("button", { type: "button", "aria-pressed": String(i === active), onclick: () => pick(i) }, n)));
}

// ---------- Line chart ----------

export interface Series { name?: string; colour: string; points: [number, number][]; dashed?: boolean; width?: number }
export interface ChartOpts {
  series: Series[];
  x: [number, number]; y: [number, number];
  xLabel?: string; yLabel?: string;
  xFmt?: (v: number) => string; yFmt?: (v: number) => string;
  dots?: { x: number; y: number; colour?: string; label?: string }[];
  vline?: number; hline?: number;
  aria: string;
  width?: number; height?: number;
  /** Put series names in a legend row instead of at line ends (use when lines end together). */
  legend?: boolean;
}

export function lineChart(o: ChartOpts): SVGElement {
  const W = o.width ?? 560, H = o.height ?? 260, L = 48, R = 16, T = 16, B = 40;
  const X = (v: number) => L + ((v - o.x[0]) / (o.x[1] - o.x[0])) * (W - L - R);
  const Y = (v: number) => T + (1 - (v - o.y[0]) / (o.y[1] - o.y[0])) * (H - T - B);
  const xf = o.xFmt ?? ((v) => num(v)), yf = o.yFmt ?? ((v) => num(v));
  const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "plot", role: "img", "aria-label": o.aria });
  for (let i = 0; i <= 4; i++) {
    const xv = o.x[0] + (i / 4) * (o.x[1] - o.x[0]);
    const yv = o.y[0] + (i / 4) * (o.y[1] - o.y[0]);
    svg.append(s("line", { x1: X(xv), x2: X(xv), y1: T, y2: H - B, class: "grid" }));
    svg.append(s("text", { x: X(xv), y: H - B + 16, class: "tick", "text-anchor": "middle" }, xf(xv)));
    svg.append(s("line", { x1: L, x2: W - R, y1: Y(yv), y2: Y(yv), class: "grid" }));
    svg.append(s("text", { x: L - 6, y: Y(yv) + 4, class: "tick", "text-anchor": "end" }, yf(yv)));
  }
  if (o.hline !== undefined) svg.append(s("line", { x1: L, x2: W - R, y1: Y(o.hline), y2: Y(o.hline), class: "cursor" }));
  if (o.vline !== undefined) svg.append(s("line", { x1: X(o.vline), x2: X(o.vline), y1: T, y2: H - B, class: "cursor" }));
  const clampY = (v: number) => Math.max(o.y[0], Math.min(o.y[1], v));
  o.series.forEach((se) => {
    if (!se.points.length) return;
    const d = se.points.map(([x, y], i) => `${i ? "L" : "M"}${X(x).toFixed(1)},${Y(clampY(y)).toFixed(1)}`).join("");
    svg.append(s("path", { d, fill: "none", stroke: se.colour, "stroke-width": se.width ?? 2.5, "stroke-dasharray": se.dashed ? "6 5" : "none", "stroke-linejoin": "round" }));
    if (se.name && !o.legend) {
      const [lx, ly] = se.points[se.points.length - 1];
      svg.append(s("text", { x: X(lx) - 4, y: Y(clampY(ly)) - 8, class: "lineLabel", fill: se.colour, "text-anchor": "end" }, se.name));
    }
  });
  if (o.legend) {
    let lx = L + 8;
    o.series.filter((se) => se.name).forEach((se) => {
      svg.append(s("line", { x1: lx, x2: lx + 18, y1: T + 10, y2: T + 10, stroke: se.colour, "stroke-width": 3, "stroke-dasharray": se.dashed ? "5 4" : "none" }));
      const t = s("text", { x: lx + 24, y: T + 14, class: "lineLabel", fill: se.colour }, se.name!);
      svg.append(t);
      lx += 34 + se.name!.length * 7.2;
    });
  }
  (o.dots ?? []).forEach((dt) => {
    svg.append(s("circle", { cx: X(dt.x), cy: Y(clampY(dt.y)), r: 5.5, fill: dt.colour ?? "var(--eq)", stroke: "#000", "stroke-width": 2 }));
    if (dt.label) svg.append(s("text", { x: X(dt.x) + 9, y: Y(clampY(dt.y)) - 8, class: "lineLabel", fill: dt.colour ?? "var(--eq)" }, dt.label));
  });
  if (o.xLabel) svg.append(s("text", { x: (L + W - R) / 2, y: H - 4, class: "axis", "text-anchor": "middle" }, o.xLabel));
  if (o.yLabel) svg.append(s("text", { x: 12, y: T + (H - T - B) / 2, class: "axis", "text-anchor": "middle", transform: `rotate(-90 12 ${T + (H - T - B) / 2})` }, o.yLabel));
  return svg;
}

// ---------- Horizontal bars ----------

export interface BarRow { label: string; value: number; text?: string; cls?: string; win?: boolean }

export function bars(rows: BarRow[], max = Math.max(...rows.map((r) => r.value), 1e-9)): HTMLElement {
  return h("div", { class: "bars" }, rows.map((r) =>
    h("div", { class: `bar${r.win ? " win" : ""}` },
      h("span", null, r.label),
      h("span", { class: "track" }, h("span", { class: `fill ${r.cls ?? ""}`, style: `width:${Math.max(0, Math.min(1, r.value / max)) * 100}%` })),
      h("span", { class: "num" }, r.text ?? num(r.value)))));
}

// ---------- Timed multiple-choice drill ----------

export interface DrillQ { prompt: Node | string; body?: Node; options: string[]; answer: number; explain: Node | string }

export function drill(make: () => DrillQ): HTMLElement {
  const box = h("div", { class: "interactive drill" });
  let streak = 0, best = 0;
  const times: number[] = [];
  const ask = () => {
    const q = make();
    const t0 = performance.now();
    clear(box);
    box.append(
      h("p", { class: "prompt" }, q.prompt),
      q.body ?? "",
      h("div", { class: "choices" }, q.options.map((o, i) => h("button", { class: "btn btn-p0", type: "button", onclick: () => answer(i) }, o))));
    const answer = (i: number) => {
      const secs = (performance.now() - t0) / 1000;
      const ok = i === q.answer;
      if (ok) { streak++; best = Math.max(best, streak); times.push(secs); if (times.length > 10) times.shift(); } else streak = 0;
      const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
      clear(box);
      box.append(
        h("p", { class: `feedback ${ok ? "good" : "bad"}` },
          ok ? `Correct in ${secs.toFixed(1)}s. ` : `The answer is ${q.options[q.answer]}. `,
          `Streak ${streak}, best ${best}${avg ? `, average ${avg.toFixed(1)}s` : ""}.`),
        q.body ?? "",
        h("p", { class: "legend" }, q.explain),
        h("div", { class: "controls" }, h("button", { class: "btn btn-p0", type: "button", onclick: ask }, "Next")));
      (box.querySelector(".controls .btn") as HTMLButtonElement | null)?.focus({ preventScroll: true });
    };
  };
  ask();
  return box;
}

/** Shuffle a correct answer in among distractors; returns options and the answer index. */
export function shuffleOptions(correct: string, distractors: string[]): { options: string[]; answer: number } {
  const opts = [correct];
  for (const d of distractors) if (!opts.includes(d) && opts.length < 4) opts.push(d);
  for (let i = opts.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [opts[i], opts[j]] = [opts[j], opts[i]]; }
  return { options: opts, answer: opts.indexOf(correct) };
}

export const tip = (text: string | Node) => h("aside", { class: "tip" }, h("strong", null, "Shorthand to remember"), text);
export const randInt = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
