import { repeated } from "../engine";
import { clear, depth, h } from "../ui/dom";
import { bars, drill, lineChart, num, pct, randInt, shuffleOptions, sliderPanel, stepper, tip } from "../ui/widgets";

const { AXELROD, STRATEGIES, grimThreshold, playMatch, stagePayoff, strategy, tournament, valueCooperate, valueDeviate } = repeated;
type Move = repeated.Move;

export function renderCh06(root: HTMLElement) {
  root.append(
    h("p", { class: "lede" },
      "In a one-shot Prisoner's Dilemma, confessing is dominant and both players lose. But rivals, colleagues and countries meet again and again. ",
      "Once tomorrow matters, today's betrayal has a price, and cooperation can be the selfish choice."),

    h("h2", null, "Play a mystery opponent"),
    h("p", null,
      "Each round you either cooperate or defect. Both cooperating pays 3 each; defecting on a cooperator pays 5 against 0; both defecting pays 1 each. ",
      "After every round there's a 90% chance of another. Your opponent follows a fixed rule. Play, then guess which rule it was."),
    mystery(),

    h("h2", null, "The shadow of the future"),
    h("p", null,
      "Suppose your rival plays ", h("em", null, "Grim Trigger"), ": cooperate until you defect once, then defect forever. Defecting today pays 5 instead of 3, but every future round drops from 3 to 1. ",
      "Whether that's worth it depends on how likely the game is to continue. Slide the continuation probability."),
    shadow(),
    h("p", null,
      `With these payoffs, cooperation holds whenever the game continues with probability at least ${grimThreshold(AXELROD)}. `,
      "A firm that expects to be in the market for years won't start a price war for one good quarter. That's also the answer to Chapter 2's Bertrand paradox: petrol stations that meet every day can keep prices up without ever talking."),

    h("h2", null, "Axelrod's tournament"),
    h("p", null,
      "In 1980 the political scientist Robert Axelrod invited game theorists to submit strategies for a repeated Prisoner's Dilemma tournament. ",
      "The winner was the shortest program entered: Tit for Tat, which cooperates first and then copies you. Run your own tournament. Add mistakes with the noise slider and watch who suffers."),
    arena(),
    h("p", null,
      "Axelrod drew four lessons from the winners: be ", h("em", null, "nice"), " (never defect first), ", h("em", null, "retaliating"), " (punish defection at once), ",
      h("em", null, "forgiving"), " (go back to cooperating) and ", h("em", null, "clear"), " (easy for others to read). With noise, a single mistake sends two Tit for Tat players into an endless echo of revenge, ",
      "which is why generous and win-stay strategies do better when hands tremble."),

    depth("formal",
      h("p", null,
        "In the infinitely repeated game with discount factor ", h("span", { class: "math" }, "δ"), ", a player's payoff is ", h("span", { class: "math" }, "Σ δᵗ uₜ"), ". ",
        "Grim Trigger is a subgame-perfect equilibrium when cooperating forever beats a one-time deviation followed by punishment:"),
      h("p", { class: "display" }, h("span", { class: "math" }, "R/(1 − δ) ≥ T + δP/(1 − δ)  ⇔  δ ≥ (T − R)/(T − P)")),
      h("p", null,
        "The ", h("em", null, "folk theorem"), " says much more: for δ close to 1, any payoffs that beat each player's punishment payoff can be sustained in equilibrium. ",
        "Repetition explains how cooperation is possible, not which outcome happens. If the game has a known last round, backward induction (Chapter 4) unravels cooperation from the end, just like the centipede.")),

    h("h2", null, "Derive the threshold"),
    stepper([
      ["Cooperate forever", "Every round pays R = 3. With continuation probability δ, the total is 3 + 3δ + 3δ² + … = 3/(1 − δ)."],
      ["Deviate once", "You get T = 5 today, then mutual defection at P = 1 forever after: 5 + δ/(1 − δ)."],
      ["Compare", "3/(1 − δ) ≥ 5 + δ/(1 − δ). Multiply by (1 − δ): 3 ≥ 5(1 − δ) + δ = 5 − 4δ, so δ ≥ 1/2."],
      ["Read it", "The gain from cheating (T − R = 2) must be outweighed by the lost future (T − P = 4) weighted by δ. The more tempting the cheat or the milder the punishment, the more patient players must be."],
    ]),

    h("h2", null, "Where it shows up"),
    h("ul", { class: "compare" },
      h("li", null, h("strong", null, "Cartels. "), "OPEC members have an incentive to pump above quota each month; quotas hold when members expect to be punished and to keep dealing with each other."),
      h("li", null, h("strong", null, "Live and let live. "), "Historians of the First World War describe opposing trenches settling into unspoken truces, shelling at predictable times and avoiding real damage, because the same units faced each other for months."),
      h("li", null, h("strong", null, "Reputation online. "), "Seller ratings turn one-off sales into a repeated game with the whole market.")),

    depth("quant",
      h("p", null, "Find the minimum continuation probability for Grim Trigger to sustain cooperation."),
      drill(() => {
        const P = randInt(0, 2), R = P + randInt(1, 4), T = R + randInt(1, 4);
        const d = (T - R) / (T - P);
        const f = (x: number) => frac(x);
        const { options, answer } = shuffleOptions(f(d), [f((R - P) / (T - P)), f((T - R) / T), f((T - P) / (T + R)), f(R / T)]);
        return {
          prompt: `T = ${T}, R = ${R}, P = ${P}. Minimum δ?`,
          options, answer,
          explain: `δ* = (T − R)/(T − P) = ${T - R}/${T - P}${f(d) !== `${T - R}/${T - P}` ? ` = ${f(d)}` : ""}. Temptation gain over the total cost of punishment.`,
        };
      })),

    tip("δ* = (T − R)/(T − P): what cheating gains today over what punishment costs per round. Known last round? Cooperation unravels."),
  );
}

function frac(x: number): string {
  for (let d = 1; d <= 24; d++) { const n = Math.round(x * d); if (Math.abs(n / d - x) < 1e-9) return d === 1 ? `${n}` : `${n}/${d}`; }
  return num(x);
}

// ---------- Interactive: mystery opponent ----------

const SUSPECTS = ["tft", "grim", "alld", "allc", "pavlov", "gtft"];

function mystery(): HTMLElement {
  const box = h("div", { class: "interactive" });
  let opp = strategy(SUSPECTS[0]);
  let mine: Move[] = [], theirs: Move[] = [];
  let over = false, guessed: string | null = null;
  let you = 0, them = 0;

  const reset = () => {
    opp = strategy(SUSPECTS[Math.floor(Math.random() * SUSPECTS.length)]);
    mine = []; theirs = []; over = false; guessed = null; you = 0; them = 0;
    render();
  };
  const play = (m: Move) => {
    const o = opp.move(theirs, mine, Math.random);
    mine.push(m); theirs.push(o);
    you += stagePayoff(AXELROD, m, o); them += stagePayoff(AXELROD, o, m);
    if ((mine.length >= 6 && Math.random() > 0.9) || mine.length >= 20) over = true;
    render();
  };

  const row = (ms: Move[], cls: string) => h("div", { class: "pips" }, ms.map((m) => h("span", { class: `pip ${m === "C" ? "goal" : "miss"}`, title: m === "C" ? "Cooperate" : "Defect" }, m)), ms.length ? "" : h("span", { class: `muted ${cls}` }, "–"));

  const render = () => {
    clear(box);
    box.append(
      h("div", { class: "scoreboard" },
        h("span", null, "Round ", h("strong", null, String(mine.length))),
        h("span", null, "You ", h("strong", null, String(you))),
        h("span", null, "Them ", h("strong", null, String(them)))),
      h("p", { class: "legend" }, "You"), row(mine, "p0"),
      h("p", { class: "legend" }, "Opponent"), row(theirs, "p1"),
      !over
        ? h("div", { class: "controls" },
          h("button", { class: "btn btn-p0", type: "button", onclick: () => play("C") }, "Cooperate"),
          h("button", { class: "btn btn-p0", type: "button", onclick: () => play("D") }, "Defect"))
        : guessed === null
          ? h("div", null,
            h("p", { class: "prompt" }, `The game ended after ${mine.length} rounds. Which rule was your opponent following?`),
            h("div", { class: "choices" }, SUSPECTS.map((id) => h("button", { class: "btn btn-quiet", type: "button", onclick: () => { guessed = id; render(); } }, strategy(id).name))))
          : h("div", null,
            h("p", { class: `feedback ${guessed === opp.id ? "good" : "bad"}` },
              guessed === opp.id ? `Right: ${opp.name}. ` : `It was ${opp.name}. `, opp.blurb,
              ` You averaged ${num(you / mine.length, 1)} a round; mutual cooperation pays 3.`),
            h("div", { class: "controls" }, h("button", { class: "btn btn-p0", type: "button", onclick: reset }, "New opponent"))),
    );
  };
  reset();
  return box;
}

// ---------- Interactive: value of cooperating vs deviating ----------

function shadow(): HTMLElement {
  const pd = AXELROD;
  const co: [number, number][] = [], de: [number, number][] = [];
  for (let d = 0; d <= 0.9001; d += 0.02) { co.push([d, valueCooperate(pd, d)]); de.push([d, valueDeviate(pd, d)]); }
  return sliderPanel(
    [{ key: "d", label: (v) => `Chance the game continues each round: ${pct(v / 100)}`, min: 0, max: 90, value: 30, aria: "Continuation probability" }],
    ({ d }, out) => {
      const x = d / 100;
      const vc = valueCooperate(pd, x), vd = valueDeviate(pd, x);
      out.append(
        lineChart({
          series: [
            { colour: "var(--eq)", points: co, name: "Keep cooperating" },
            { colour: "var(--bad)", points: de, name: "Defect once", dashed: true },
          ],
          x: [0, 0.9], y: [0, 30], vline: x, xFmt: (v) => pct(v), xLabel: "Continuation probability δ",
          dots: [{ x: grimThreshold(pd), y: valueCooperate(pd, grimThreshold(pd)), label: "δ* = 1/2" }],
          aria: "Lifetime value of cooperating versus defecting against Grim Trigger",
        }),
        h("p", { class: `feedback ${vc >= vd ? "good" : "bad"}` },
          `Cooperating is worth ${num(vc, 1)}, defecting once ${num(vd, 1)}. `,
          vc > vd ? "The future is valuable enough: cooperation holds." : vc === vd ? "Exactly indifferent." : "The future is too uncertain: grab the 5 now."));
    });
}

// ---------- Interactive: round-robin tournament ----------

function arena(): HTMLElement {
  const picked = new Set(["tft", "alld", "allc", "grim", "pavlov", "gtft"]);
  const toggles = (redraw: () => void) => h("div", { class: "choices" }, STRATEGIES.map((st) => {
    const b = h("button", { class: "btn btn-quiet", type: "button", "aria-pressed": String(picked.has(st.id)), title: st.blurb,
      onclick: () => { if (picked.has(st.id)) { if (picked.size > 2) picked.delete(st.id); } else picked.add(st.id); b.setAttribute("aria-pressed", String(picked.has(st.id))); b.classList.toggle("on", picked.has(st.id)); redraw(); } }, st.name);
    b.classList.toggle("on", picked.has(st.id));
    return b;
  }));
  return sliderPanel(
    [
      { key: "noise", label: (v) => `Mistakes: ${v}% of moves flipped`, min: 0, max: 20, value: 0, aria: "Noise" },
      { key: "rounds", label: (v) => `Rounds per match: ${v}`, min: 10, max: 200, step: 10, value: 100, aria: "Rounds per match" },
    ],
    ({ noise, rounds }, out) => {
      const res = tournament([...picked], rounds, noise / 100);
      out.append(
        bars(res.map((r, i) => ({ label: strategy(r.id).name, value: r.avg, text: num(r.avg, 2), cls: i === 0 ? "eq" : r.id === "alld" ? "p1" : "p0", win: i === 0 })), 3.2),
        h("p", { class: "legend" }, `Average points per round across a round robin (each strategy also meets a copy of itself), averaged over 5 runs. Mutual cooperation is worth 3. Winner: ${strategy(res[0].id).name}.`));
    },
    (redraw) => h("div", null, h("p", { class: "legend" }, "Pick the entrants (tap to toggle):"), toggles(redraw)));
}
