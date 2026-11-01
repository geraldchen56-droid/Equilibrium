import { evolution } from "../engine";
import { clear, depth, h } from "../ui/dom";
import { drill, lineChart, pct, randInt, shuffleOptions, sliderPanel, stepper, tip } from "../ui/widgets";

const { ess, hawkDove, interiorRest, randomGrid, replicatorPath, share, spatialStep } = evolution;

export function renderCh07(root: HTMLElement) {
  root.append(
    h("p", { class: "lede" },
      "Every chapter so far assumed players who think. Birds, bacteria and trading algorithms don't. ",
      "Yet if strategies that do well simply become more common, populations end up at equilibria anyway, with nobody doing any reasoning at all."),

    h("h2", null, "Hawks and doves"),
    h("p", null,
      "Animals of one species meet over food worth 4. A ", h("em", null, "hawk"), " always fights; a ", h("em", null, "dove"), " displays and backs off. ",
      "Two hawks fight, and the loser is injured at a cost of 6. Two doves share. A hawk meeting a dove takes everything. ",
      "Each generation, strategies that earned more leave more offspring. Where does the population end up?"),
    predict(),

    h("h2", null, "Run the population"),
    h("p", null, "Change the prize and the cost of a fight, and where the population starts. The line shows the share of hawks over the generations."),
    hawkDovePanel(),
    h("p", null,
      "When fighting costs more than the prize, the hawk share settles at prize ÷ cost wherever it starts. ",
      "Too many hawks and they keep injuring each other, so doves do better; too few and hawks feast on doves. ",
      "When the prize is worth more than any injury, hawks take over completely."),

    depth("formal",
      h("p", null,
        "A strategy ", h("span", { class: "math" }, "s*"), " is an ", h("em", null, "evolutionarily stable strategy"), " (Maynard Smith and Price, 1973) if a population playing it can't be invaded by a small group of mutants playing anything else: for every ", h("span", { class: "math" }, "s ≠ s*"), ","),
      h("p", { class: "display" }, h("span", { class: "math" }, "u(s*, s*) > u(s, s*),  or  u(s*, s*) = u(s, s*) and u(s*, s) > u(s, s)")),
      h("p", null,
        "Every ESS is a Nash equilibrium of the game played against yourself, but not every Nash equilibrium is an ESS. The ", h("em", null, "replicator equation"), " ",
        h("span", { class: "math" }, "ẋ = x(1 − x)(f_H − f_D)"), " grows a strategy in proportion to how much better than average it does; in two-strategy games its stable rest points are exactly the ESSs.")),

    h("h2", null, "Why V/C?"),
    stepper([
      ["Fitness of a hawk", "If a share x of the population are hawks, a hawk meets another hawk with probability x and earns (V − C)/2, or meets a dove and earns V: f_H = x(V − C)/2 + (1 − x)V."],
      ["Fitness of a dove", "A dove earns 0 against a hawk and V/2 against a dove: f_D = (1 − x)V/2."],
      ["Set them equal", "x(V − C)/2 + (1 − x)V = (1 − x)V/2. Simplify: (1 − x)V/2 = x(C − V)/2, so V − xV = xC − xV, giving x = V/C."],
      ["Check stability", "Above V/C, doves do better and hawks shrink; below, hawks do better and grow. The mix is self-correcting, so it is an ESS."],
    ]),

    h("h2", null, "Cooperation in clusters"),
    h("p", null,
      "The Prisoner's Dilemma says defectors beat cooperators in a well-mixed crowd. But real organisms mostly meet their neighbours. ",
      "In this grid each cell plays its eight neighbours and then copies whichever neighbour scored best. Cooperators are ivory, defectors are marigold. Raise the temptation to defect and watch."),
    spatial(),
    h("p", null,
      "With moderate temptation, cooperators survive in clumps: inside a clump they earn well from each other, and the defectors on the border can't take over. ",
      "Martin Nowak and Robert May showed in 1992 that geography alone can keep cooperation alive, with no memory, reputation or reasoning."),

    h("h2", null, "Where it shows up"),
    h("ul", { class: "compare" },
      h("li", null, h("strong", null, "Why roughly half of babies are boys. "), "R. A. Fisher's argument: if one sex becomes rarer, parents who produce that sex have more grandchildren, so the ratio is pushed back to 1:1. It's an ESS."),
      h("li", null, h("strong", null, "Ritual contests. "), "Many animals settle disputes with displays rather than fights, just as the hawk-dove mix predicts when injuries are costly."),
      h("li", null, h("strong", null, "Markets. "), "Trading strategies that make money attract capital and copycats until the edge disappears: replicator dynamics with money as fitness.")),

    depth("quant",
      h("p", null, "Hawk-dove questions reduce to one ratio."),
      drill(() => {
        const C = randInt(3, 12), V = randInt(1, C - 1);
        const f = (n: number, d: number) => { const g = gcd(n, d); return d / g === 1 ? `${n / g}` : `${n / g}/${d / g}`; };
        const { options, answer } = shuffleOptions(f(V, C), [f(C - V, C), f(V, 2 * C), f(V, V + C), "1/2"]);
        return {
          prompt: `Prize V = ${V}, cost of injury C = ${C}. Share of hawks in the ESS?`,
          options, answer,
          explain: `Since V < C, the ESS mixes: hawks = V/C = ${f(V, C)}. If V ≥ C, hawks would take over completely.`,
        };
      })),

    tip("hawks = V/C when a fight costs more than the prize. ESS test: beat a mutant against yourself, or tie and beat it against itself."),
  );
}

const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);

// ---------- Play first: predict the outcome ----------

function predict(): HTMLElement {
  const box = h("div", { class: "interactive" });
  const A = hawkDove(4, 6);
  const OPTS = [0.1, 1 / 3, 2 / 3, 1];
  let pick: number | null = null;
  const render = () => {
    clear(box);
    box.append(h("p", { class: "prompt" }, "Starting from 10% hawks, what share of hawks will the population settle at?"),
      h("div", { class: "choices" }, OPTS.map((o) => h("button", { class: "btn btn-quiet", type: "button", "aria-pressed": String(pick === o), onclick: () => { pick = o; render(); } }, pct(o)))));
    if (pick === null) return;
    const path = replicatorPath(A, 0.1, 300);
    const target = interiorRest(A)!;
    box.append(
      lineChart({ series: [{ colour: "var(--col)", points: path.map((x, i) => [i, x]), name: "Hawks" }], x: [0, 300], y: [0, 1], hline: target, yFmt: (v) => pct(v), xFmt: (v) => String(Math.round(v)), xLabel: "Generation", aria: "Hawk share over time" }),
      h("p", { class: `feedback ${Math.abs(pick - target) < 0.01 ? "good" : "bad"}` },
        Math.abs(pick - target) < 0.01 ? "Right: two thirds hawks. " : `It settles at two thirds (${pct(target)}). `,
        "That's the prize divided by the cost of a fight, 4 ÷ 6. No animal calculated anything: hawks simply did better whenever they were rarer than that."));
  };
  render();
  return box;
}

// ---------- Hawk-dove population explorer ----------

function hawkDovePanel(): HTMLElement {
  return sliderPanel(
    [
      { key: "V", label: (v) => `Prize V: ${v}`, min: 1, max: 10, value: 4, aria: "Prize" },
      { key: "C", label: (v) => `Cost of injury C: ${v}`, min: 1, max: 10, value: 6, aria: "Cost of injury" },
      { key: "x0", label: (v) => `Hawks at the start: ${v}%`, min: 1, max: 99, value: 90, aria: "Starting hawk share" },
    ],
    ({ V, C, x0 }, out) => {
      const A = hawkDove(V, C);
      const path = replicatorPath(A, x0 / 100, 400);
      const stable = ess(A);
      const end = path[path.length - 1];
      out.append(
        lineChart({ series: [{ colour: "var(--col)", points: path.map((x, i) => [i, x]), name: "Hawks" }], x: [0, 400], y: [0, 1], yFmt: (v) => pct(v), xFmt: (v) => String(Math.round(v)), xLabel: "Generation", aria: "Hawk share over time",
          hline: stable.length === 1 && stable[0] > 0 && stable[0] < 1 ? stable[0] : undefined }),
        h("p", { class: "feedback good" },
          V < C ? `Settles at ${pct(end)} hawks. Theory: V/C = ${V}/${C} = ${pct(V / C, 1)}.`
            : `Hawks take over (${pct(end)}). With V ≥ C a fight is worth having, so Hawk is the only ESS.`));
    });
}

// ---------- Spatial Prisoner's Dilemma ----------

function spatial(): HTMLElement {
  const N = 41;
  let b = 1.65;
  let grid = startGrid();
  let gen = 0;
  let timer: number | null = null;
  const history: [number, number][] = [];

  function startGrid() {
    // Mostly cooperators with one defector in the middle, plus random noise: produces the famous patterns.
    const g = randomGrid(N, 0.9);
    g[Math.floor(N * N / 2)] = 0;
    return g;
  }

  const box = h("div", { class: "interactive" });
  const cells = h("div", { class: "grid-cells", style: `grid-template-columns: repeat(${N}, 1fr)`, role: "img", "aria-label": "Grid of cooperators and defectors" });
  const spans = Array.from({ length: N * N }, () => h("span"));
  cells.append(...spans);
  const stat = h("p", { class: "legend" });
  const chartHost = h("div");
  const label = h("span");
  const slider = h("input", { type: "range", min: 100, max: 200, step: 5, value: Math.round(b * 100), "aria-label": "Temptation to defect", oninput: () => { b = Number(slider.value) / 100; label.textContent = lab(); } }) as HTMLInputElement;
  const lab = () => `Temptation b (defector's payoff against a cooperator): ${b.toFixed(2)}`;
  label.textContent = lab();
  const playBtn = h("button", { class: "btn btn-p0", type: "button", onclick: () => (timer === null ? play() : pause()) }, "Play");

  const paint = () => {
    for (let i = 0; i < N * N; i++) spans[i].style.background = grid[i] ? "var(--ink)" : "var(--col)";
    const sh = share(grid);
    stat.textContent = `Generation ${gen} · cooperators ${pct(sh)}`;
    clear(chartHost);
    if (history.length > 1) chartHost.append(lineChart({ series: [{ colour: "var(--ink)", points: history, name: "Cooperators" }], x: [0, Math.max(50, gen)], y: [0, 1], yFmt: (v) => pct(v), xFmt: (v) => String(Math.round(v)), height: 180, aria: "Cooperator share over time" }));
  };
  const step = () => {
    grid = spatialStep(grid, N, b); gen++; history.push([gen, share(grid)]);
    paint();
    if (!box.isConnected) pause();
  };
  const play = () => { playBtn.textContent = "Pause"; timer = window.setInterval(step, 160); };
  const pause = () => { if (timer !== null) clearInterval(timer); timer = null; playBtn.textContent = "Play"; };
  const reset = () => { pause(); grid = startGrid(); gen = 0; history.length = 0; history.push([0, share(grid)]); paint(); };

  box.append(
    h("label", { class: "range" }, label, slider),
    cells, stat,
    h("div", { class: "controls" }, playBtn,
      h("button", { class: "btn btn-quiet", type: "button", onclick: () => { pause(); step(); } }, "Step"),
      h("button", { class: "btn btn-quiet", type: "button", onclick: reset }, "Reset")),
    chartHost,
    h("p", { class: "legend" }, "Try b around 1.6 to 1.8 for shifting fronts, below 1.4 for cooperators to win, and above 1.9 for defectors to sweep."));
  history.push([0, share(grid)]);
  paint();
  return box;
}

