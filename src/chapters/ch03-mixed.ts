import {
  F, Fraction, NormalFormGame, Player, bestResponseToMix, bluffMaths, cloneWithPayoff, expectedVsMixNum,
  indifferencePoint, library, makeGame, mixed2x2, pureNash, randomIntGame,
} from "../engine";
import { clear, depth, h, s } from "../ui/dom";
import { matrixKey, payoffMatrix } from "../ui/matrix";

const { penaltyKick, matchingPennies, battleOfSexes, chicken } = library;

const pct = (x: number, dp = 0) => `${(x * 100).toFixed(dp)}%`;
const frac = (x: Fraction) => `${x.toString()} ≈ ${pct(x.valueOf())}`;

export function renderCh03(root: HTMLElement) {
  const eq = mixed2x2(penaltyKick)!;
  root.append(
    h("p", { class: "lede" },
      "Matching Pennies ended Chapter 2 with every cell unstable: whatever you do, your opponent wants you to have done the opposite. ",
      "Real games like this are everywhere: penalty kicks, tennis serves, poker bluffs, tax audits. ",
      "The answer isn't a clever choice. It's a carefully weighted coin."),

    h("h2", null, "Take the penalty"),
    h("p", null,
      "You're the kicker. You score more often aiming at your natural side, but the keeper knows that too and watches every kick you take. ",
      "Take 20 penalties and try to beat the keeper. The score that matters is your average scoring chance, which ignores lucky bounces."),
    matrixKey(penaltyKick),
    payoffMatrix(penaltyKick, { caption: "Scoring chance in %. The keeper's payoff is the save chance, 100 minus the kicker's." }),
    shootout(),

    h("h2", null, "The trick: make them indifferent"),
    h("p", null,
      "If you lean too far either way, the keeper dives that way every time. The keeper can only be kept honest if both dives look equally good to them. ",
      "So you choose your mix to make the ", h("em", null, "keeper"), " indifferent, and the keeper chooses theirs to make ", h("em", null, "you"), " indifferent. ",
      "That's the ", h("em", null, "indifference principle"), ", and it's the whole method."),
    h("p", null,
      "The plot shows it. Slide the keeper's dive probability. Each line is your scoring chance from one aim. ",
      "Where the lines cross, both aims score equally, so you have no reason to prefer either: that crossing is the keeper's equilibrium mix."),
    mixPlot(),

    h("h2", null, "Solve it by hand"),
    stepper([
      ["Name the mixes", `Kicker aims Natural with probability p. Keeper dives Natural with probability q.`],
      ["Make the keeper indifferent (finds p)", `Keeper concedes 70p + 92(1 − p) diving Natural and 95p + 55(1 − p) diving Other. Set them equal: 92 − 22p = 55 + 40p, so p = 37/62 ≈ 60%.`],
      ["Make the kicker indifferent (finds q)", `Kicker scores 70q + 95(1 − q) aiming Natural and 92q + 55(1 − q) aiming Other. Set them equal: 95 − 25q = 55 + 37q, so q = 20/31 ≈ 65%.`],
      ["Read off the value", `Plug q into either line: 95 − 25 × 20/31 = 2445/31 ≈ ${eq.rowValue.valueOf().toFixed(1)}%. Studies of professional penalties find scoring rates close to 80%, and kickers' choices are hard to tell apart from random.`],
    ]),

    h("h2", null, "The surprise"),
    h("p", null,
      "Suppose you practise and your natural-side kick becomes almost unstoppable when the keeper guesses wrong. Should you aim natural more often? ",
      "Drag the slider and watch your own mix."),
    surprise(),
    h("p", null,
      "You aim natural ", h("em", null, "less"), " often. Your mix exists to keep the keeper indifferent, so it is set by the keeper's payoffs. ",
      "Guessing wrong on your natural side now costs the keeper more, so diving natural has become more tempting for them. ",
      "To make them indifferent again you need fewer natural kicks. The keeper dives natural more, you find the other corner open more often, and your overall scoring rises."),
    h("p", null, "Players who get better at one thing and simply do it more get exploited. The improvement pays off through the opponent's fear of it."),
    depth("formal",
      h("p", null,
        "A ", h("em", null, "mixed strategy"), " is a probability distribution over pure strategies. Players are assumed to maximise expected payoff. ",
        "A profile of mixed strategies is a Nash equilibrium if each player's mix is a best response to the other's."),
      h("p", null,
        "Key fact: a mix is a best response only if every pure strategy it uses earns the same expected payoff, and nothing unused earns more. ",
        "That gives one equation per player in a 2×2. Writing Column's payoffs as ", h("span", { class: "math" }, "a, b, c, d"), " for (top, left), (top, right), (bottom, left), (bottom, right), Row's top probability is"),
      h("p", { class: "display" }, h("span", { class: "math" }, "p* = (d − c) / (a − b − c + d)")),
      h("p", null,
        "with the same formula on Row's payoffs giving Column's ", h("span", { class: "math" }, "q*"), ". So in general your mix depends only on the other player's payoffs. ",
        "In a zero-sum game like the penalty, their payoffs mirror yours, which is why improving your own shot still moved your mix. Nash's 1950 theorem guarantees that every finite game has at least one equilibrium once mixing is allowed. ",
        "Games with two pure equilibria, like Battle of the Sexes, usually have a third mixed one too: switch tabs in the plot above to see it.")),

    h("h2", null, "Bluffing"),
    h("p", null,
      "Poker is mixing with money on the table. On the last card, you bet with your strong hands and sometimes with junk. ",
      "If you never bluff, opponents fold whenever you bet; if you always bluff, they always call. ",
      "The right bluffing share makes a caller indifferent, and the right calling rate makes a bluff break even."),
    bluffer(),

    depth("quant",
      h("p", null,
        "Interviewers love mixed equilibria because the 2×2 formula is quick once you know it. ",
        "Find Row's probability of the top strategy. Remember to use Column's payoffs."),
      mixDrill()),

    h("aside", { class: "tip" },
      h("strong", null, "Shorthand to remember: "),
      "your mix is built from their payoffs. Make them indifferent; p* = (d − c) / (a − b − c + d) on the other player's numbers."),
  );
}

// ---------- Interactive: penalty shootout against an adaptive keeper ----------

function shootout(): HTMLElement {
  const g = penaltyKick;
  const box = h("div", { class: "interactive" });
  const N = 20;
  const pStar = mixed2x2(g)!.p.valueOf();
  let kicks: { aim: number; dive: number; chance: number; goal: boolean }[] = [];

  const keeperDive = (): { dive: number; read: string } => {
    const recent = kicks.slice(-8);
    if (recent.length < 3) return { dive: Math.random() < mixed2x2(g)!.q.valueOf() ? 0 : 1, read: "The keeper is still learning your habits." };
    const nat = recent.filter((k) => k.aim === 0).length / recent.length;
    const last = recent.slice(-3).map((k) => k.aim);
    const streak = last.every((a) => a === last[0]);
    const alternating = recent.length >= 4 && recent.slice(-4).every((k, i, a) => i === 0 || k.aim !== a[i - 1].aim);
    if (alternating) {
      const next = 1 - recent[recent.length - 1].aim;
      return { dive: next, read: "The keeper has spotted that you alternate." };
    }
    if (streak && recent.length >= 4) return { dive: last[0], read: `You've gone ${g.strategies[0][last[0]].toLowerCase()} three times running. The keeper expects it again.` };
    const br = bestResponseToMix(g, 1, F(Math.round(nat * 100), 100));
    const dive = br.length === 2 ? (Math.random() < 0.5 ? 0 : 1) : br[0];
    const lean = Math.abs(nat - pStar) < 0.1 ? "Your mix is close to balanced, so the keeper is guessing."
      : `You've aimed natural ${Math.round(nat * recent.length)} of your last ${recent.length}. The keeper leans ${nat > pStar ? "natural" : "the other way"}.`;
    return { dive, read: lean };
  };

  let lastRead = "";
  const kick = (aim: number) => {
    const { dive, read } = keeperDive();
    const chance = g.payoffs[aim][dive][0].valueOf() / 100;
    kicks.push({ aim, dive, chance, goal: Math.random() < chance });
    lastRead = read;
    render();
  };

  const render = () => {
    clear(box);
    const done = kicks.length >= N;
    const avg = kicks.length ? kicks.reduce((a, k) => a + k.chance, 0) / kicks.length : 0;
    const goals = kicks.filter((k) => k.goal).length;
    const last = kicks[kicks.length - 1];
    box.append(
      h("div", { class: "scoreboard" },
        h("span", null, h("strong", null, `${kicks.length}/${N}`), " kicks"),
        h("span", null, h("strong", null, `${goals}`), " goals"),
        h("span", null, "average chance ", h("strong", null, kicks.length ? pct(avg) : "–")),
        h("span", { class: "muted" }, "equilibrium ≈ 79%")),
      h("div", { class: "pips", "aria-hidden": "true" }, kicks.map((k) => h("span", { class: `pip ${k.goal ? "goal" : "miss"}`, title: `${g.strategies[0][k.aim]} vs dive ${g.strategies[1][k.dive]}` }, k.aim === 0 ? "N" : "O"))),
      last ? h("p", { class: `feedback ${last.goal ? "good" : "bad"}` },
        `You aimed ${g.strategies[0][last.aim].toLowerCase()}, the keeper dived ${g.strategies[1][last.dive].toLowerCase()}: a ${pct(last.chance)} chance, and ${last.goal ? "it went in." : "it was saved."} `,
        h("span", { class: "muted" }, lastRead)) : h("p", { class: "prompt" }, "Pick a side."),
      done
        ? h("p", { class: "feedback done" },
          avg >= 0.77 ? `Average ${pct(avg)}: right around the equilibrium. You were close to unpredictable.`
            : `Average ${pct(avg)}, below the ~79% you can guarantee. The keeper found a pattern. Humans are bad at being random: we alternate too much and avoid long runs.`)
        : "",
      h("div", { class: "controls" },
        done ? "" : h("button", { class: "btn btn-p0", type: "button", onclick: () => kick(0) }, "Aim natural"),
        done ? "" : h("button", { class: "btn btn-p0", type: "button", onclick: () => kick(1) }, "Aim other side"),
        done ? "" : h("button", { class: "btn btn-quiet", type: "button", onclick: () => { while (kicks.length < N) kick(Math.random() < pStar ? 0 : 1); } }, "Let a 60/40 coin kick for me"),
        h("button", { class: "btn btn-quiet", type: "button", onclick: () => { kicks = []; lastRead = ""; render(); } }, "Start again")),
    );
  };
  render();
  return box;
}

// ---------- Interactive: expected payoff vs opponent's probability ----------

interface PlotGame { game: NormalFormGame; note: string }

const PLOT_GAMES: PlotGame[] = [
  { game: penaltyKick, note: "The lines cross once, so each side has a single equilibrium mix." },
  { game: matchingPennies, note: "Perfectly symmetric: the only unexploitable mix is a fair coin." },
  { game: battleOfSexes, note: "Two pure equilibria at the edges and a mixed one where the lines cross. The mixed one is worse for both: they often end up apart." },
  { game: chicken, note: "Each driver goes straight only rarely in the mixed equilibrium, yet crashes still happen." },
];

function mixPlot(): HTMLElement {
  const box = h("div", { class: "interactive" });
  let idx = 0;
  let viewer: Player = 0;
  let x = 0.5;

  const W = 360, H = 220, L = 42, R = 14, T = 14, B = 34;
  const px = (t: number) => L + t * (W - L - R);

  const tabs = h("div");
  const plotHost = h("div");
  const label = h("span");
  const slider = h("input", { type: "range", min: 0, max: 100, value: 50,
    oninput: () => { x = Number(slider.value) / 100; draw(); } }) as HTMLInputElement;
  const info = h("div");
  box.append(tabs, plotHost, h("label", { class: "range" }, label, slider), info);

  const setX = (v: number) => { x = v; slider.value = String(Math.round(v * 100)); draw(); };

  const drawTabs = () => {
    clear(tabs);
    const g = PLOT_GAMES[idx].game;
    tabs.append(
      h("div", { class: "tabs", role: "group", "aria-label": "Choose a game" },
        PLOT_GAMES.map((p, i) => h("button", { type: "button", "aria-pressed": String(i === idx), onclick: () => { idx = i; drawTabs(); setX(0.5); } }, p.game.title))),
      h("div", { class: "tabs", role: "group", "aria-label": "Whose payoffs" },
        ([0, 1] as Player[]).map((p) => h("button", { type: "button", "aria-pressed": String(p === viewer), onclick: () => { viewer = p; drawTabs(); setX(0.5); } }, `${g.players[p]}'s view`))));
  };

  const draw = () => {
    const { game: g, note } = PLOT_GAMES[idx];
    const opp: Player = viewer === 0 ? 1 : 0;
    const vals = [0, 1].flatMap((k) => [0, 1].map((t) => expectedVsMixNum(g, viewer, k, t)));
    let lo = Math.min(...vals), hi = Math.max(...vals);
    const pad = (hi - lo) * 0.1 || 1; lo -= pad; hi += pad;
    const py = (v: number) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    const colour = viewer === 0 ? "var(--row)" : "var(--col)";
    const star = indifferencePoint(g, viewer);
    const inside = !!star && star.gt(0) && star.lt(1);
    const u = [0, 1].map((k) => expectedVsMixNum(g, viewer, k, x));
    const br = u[0] > u[1] + 1e-9 ? [0] : u[1] > u[0] + 1e-9 ? [1] : [0, 1];

    const svg = s("svg", { viewBox: `0 0 ${W} ${H}`, class: "plot", role: "img", "aria-label": `${g.players[viewer]}'s expected payoff from each strategy as ${g.players[opp]}'s probability changes` });
    for (let i = 0; i <= 4; i++) {
      const t = i / 4;
      svg.append(s("line", { x1: px(t), x2: px(t), y1: T, y2: H - B, class: "grid" }));
      svg.append(s("text", { x: px(t), y: H - B + 16, class: "tick", "text-anchor": "middle" }, `${i * 25}%`));
    }
    [lo + pad, (lo + hi) / 2, hi - pad].forEach((v) => {
      svg.append(s("line", { x1: L, x2: W - R, y1: py(v), y2: py(v), class: "grid" }));
      svg.append(s("text", { x: L - 6, y: py(v) + 4, class: "tick", "text-anchor": "end" }, (Math.round(v * 10) / 10).toString()));
    });
    [0, 1].forEach((k) => {
      const on = br.includes(k);
      svg.append(s("line", {
        x1: px(0), y1: py(expectedVsMixNum(g, viewer, k, 0)), x2: px(1), y2: py(expectedVsMixNum(g, viewer, k, 1)),
        stroke: colour, "stroke-width": on ? 4 : 2, "stroke-dasharray": k === 1 ? "7 5" : "none", opacity: on ? 1 : 0.5,
      }));
      svg.append(s("text", { x: px(1) - 4, y: py(expectedVsMixNum(g, viewer, k, 1)) - 8, class: "lineLabel", fill: colour, "text-anchor": "end" }, g.strategies[viewer][k]));
    });
    if (inside) {
      const sx = star!.valueOf();
      svg.append(s("circle", { cx: px(sx), cy: py(expectedVsMixNum(g, viewer, 0, sx)), r: 6, class: "eqdot" }));
    }
    svg.append(s("line", { x1: px(x), x2: px(x), y1: T, y2: H - B, class: "cursor" }));
    svg.append(s("text", { x: (L + W - R) / 2, y: H - 4, class: "axis", "text-anchor": "middle" }, `${g.players[opp]} plays ${g.strategies[opp][0]} with this probability`));
    clear(plotHost);
    plotHost.append(svg);

    label.textContent = `${g.players[opp]}: ${g.strategies[opp][0]} ${Math.round(x * 100)}%`;
    slider.setAttribute("aria-label", `${g.players[opp]}'s probability of ${g.strategies[opp][0]}`);

    const brText = br.length === 2
      ? `${g.players[viewer]} is indifferent: any mix is a best response. This is ${g.players[opp]}'s equilibrium probability.`
      : `${g.players[viewer]}'s best response: always ${g.strategies[viewer][br[0]]} (${u[br[0]].toFixed(1)} vs ${u[1 - br[0]].toFixed(1)}).`;
    clear(info);
    info.append(
      h("p", { class: `feedback ${br.length === 2 ? "good" : ""}` }, brText),
      h("p", { class: "legend" },
        inside ? `Lines cross at ${frac(star!)}. ` : "The lines don't cross inside the range, so there's no fully mixed equilibrium. ",
        note, " ",
        inside ? h("button", { class: "btn btn-quiet btn-small", type: "button", onclick: () => setX(star!.valueOf()) }, "Jump to the crossing") : ""));
  };

  drawTabs();
  draw();
  return box;
}

// ---------- Worked example stepper ----------

function stepper(steps: [string, string][]): HTMLElement {
  const box = h("div", { class: "interactive" });
  let shown = 1;
  const render = () => {
    clear(box);
    box.append(
      h("ol", { class: "worked" }, steps.slice(0, shown).map(([t, body]) => h("li", null, h("strong", null, t), h("p", null, body)))),
      h("div", { class: "controls" },
        shown < steps.length ? h("button", { class: "btn btn-p0", type: "button", onclick: () => { shown++; render(); } }, "Next step") : "",
        shown > 1 ? h("button", { class: "btn btn-quiet", type: "button", onclick: () => { shown = 1; render(); } }, "Start over") : ""));
  };
  render();
  return box;
}

/** A slider that stays mounted while `paint` redraws the readout below it. */
function sliderBox(opts: { min: number; max: number; step?: number; value: number; aria: string; label: (v: number) => string; paint: (v: number, out: HTMLElement) => void }): HTMLElement {
  const box = h("div", { class: "interactive" });
  const label = h("span");
  const out = h("div");
  const input = h("input", { type: "range", min: opts.min, max: opts.max, step: opts.step ?? 1, value: opts.value, "aria-label": opts.aria,
    oninput: () => update() }) as HTMLInputElement;
  const update = () => { const v = Number(input.value); label.textContent = opts.label(v); clear(out); opts.paint(v, out); };
  box.append(h("label", { class: "range" }, label, input), out);
  update();
  return box;
}

// ---------- Interactive: comparative statics ----------

function surprise(): HTMLElement {
  const base = mixed2x2(penaltyKick)!;
  return sliderBox({
    min: 80, max: 100, value: 95, aria: "Natural-side scoring chance when the keeper dives the wrong way",
    label: (v) => `Natural-side kick when the keeper guesses wrong: ${v}%`,
    paint: (acc, out) => {
      const g = cloneWithPayoff(cloneWithPayoff(penaltyKick, 0, 1, 0, acc), 0, 1, 1, 100 - acc);
      const m = mixed2x2(g)!;
      out.append(h("table", { class: "stats" },
        h("tr", null, h("th", null, ""), h("th", null, "Now"), h("th", null, "At 95%")),
        h("tr", null, h("td", { class: "chip-p0" }, "You aim natural"), h("td", null, h("strong", null, pct(m.p.valueOf(), 1))), h("td", null, pct(base.p.valueOf(), 1))),
        h("tr", null, h("td", { class: "chip-p1" }, "Keeper dives natural"), h("td", null, pct(m.q.valueOf(), 1)), h("td", null, pct(base.q.valueOf(), 1))),
        h("tr", null, h("td", null, "You score"), h("td", null, pct(m.rowValue.valueOf() / 100, 1)), h("td", null, pct(base.rowValue.valueOf() / 100, 1)))));
    },
  });
}

// ---------- Interactive: bluffing maths ----------

function bluffer(): HTMLElement {
  const pot = 100;
  return sliderBox({
    min: 25, max: 300, step: 25, value: 100, aria: "Bet size",
    label: (bet) => `Bet into a $${pot} pot: $${bet} (${pct(bet / pot)} of the pot)`,
    paint: (bet, out) => {
      const m = bluffMaths(pot, bet);
      out.append(
        h("ul", { class: "compare" },
          h("li", null, h("strong", null, `Bluff ${pct(m.bluffShare.valueOf())} of your bets`), ` (${m.bluffShare}). The caller risks $${bet} to win $${pot + bet}, so they break even when ${m.bluffShare} of bets are bluffs.`),
          h("li", null, h("strong", null, `Call ${pct(m.callShare.valueOf())} of the time`), ` (${m.callShare}). A bluff risks $${bet} to win $${pot}, so it breaks even when called ${m.callShare} of the time.`)),
        h("p", { class: "legend" }, "Bigger bets let you bluff more and force the caller to fold more. Tennis serves follow the same logic: studies of top players find that serves to each side win points at nearly equal rates, as the theory predicts."));
    },
  });
}

// ---------- Quant drill: 2x2 mixed equilibrium ----------

function randomMixedGame(): NormalFormGame {
  for (;;) {
    const g = randomIntGame(2, 2, 9);
    const m = mixed2x2(g);
    if (m && pureNash(g).length === 0 && m.p.d <= 12) return makeGame({
      id: "drill", title: "Drill", rows: ["Top", "Bottom"], cols: ["Left", "Right"],
      payoffs: g.payoffs.map((row) => row.map(([a, b]) => [a.valueOf(), b.valueOf()] as [number, number])),
    });
  }
}

function mixDrill(): HTMLElement {
  const box = h("div", { class: "interactive drill" });
  let streak = 0, best = 0;

  const ask = () => {
    const g = randomMixedGame();
    const m = mixed2x2(g)!;
    const one = new Fraction(1);
    const pool = [m.p, m.q, one.sub(m.p), one.sub(m.q)];
    const opts: Fraction[] = [];
    for (const f of pool) if (!opts.some((o) => o.eq(f))) opts.push(f);
    for (let k = 2; opts.length < 4; k++) { const f = F(k, k + 3); if (!opts.some((o) => o.eq(f))) opts.push(f); }
    opts.sort(() => Math.random() - 0.5);
    const start = performance.now();
    clear(box);
    box.append(
      h("p", { class: "prompt" }, "In the mixed equilibrium, how often does Row play Top?"),
      payoffMatrix(g),
      h("div", { class: "choices" }, opts.map((f) => h("button", { class: "btn btn-p0", type: "button", onclick: () => answer(f) }, f.toString()))));

    const answer = (f: Fraction) => {
      const secs = (performance.now() - start) / 1000;
      const right = f.eq(m.p);
      if (right) { streak++; best = Math.max(best, streak); } else streak = 0;
      const B = (r: number, c: number) => g.payoffs[r][c][1].toString();
      clear(box);
      box.append(
        h("p", { class: `feedback ${right ? "good" : "bad"}` },
          right ? `Correct in ${secs.toFixed(1)}s. ` : `It's ${m.p}. ${f.eq(m.q) ? "You found Column's mix: that one comes from Row's payoffs. " : ""}`,
          `Streak ${streak}, best ${best}.`),
        payoffMatrix(g),
        h("p", { class: "legend" },
          `Column's payoffs a, b, c, d = ${B(0, 0)}, ${B(0, 1)}, ${B(1, 0)}, ${B(1, 1)}. p = (d − c)/(a − b − c + d) = ${m.p}. Column's own mix is q = ${m.q}.`),
        h("div", { class: "controls" }, h("button", { class: "btn btn-p0", type: "button", onclick: ask }, "Next game")));
      (box.querySelector(".controls .btn") as HTMLButtonElement | null)?.focus({ preventScroll: true });
    };
  };
  ask();
  return box;
}
