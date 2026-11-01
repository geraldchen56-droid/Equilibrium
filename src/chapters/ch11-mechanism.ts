import { auctions, mechanism } from "../engine";
import { clear, depth, h } from "../ui/dom";
import { drill, lineChart, num, randInt, shuffleOptions, sliderPanel, stepper, tabRow, tip } from "../ui/widgets";

const { clarkeRule, proportionalRule, utility } = mechanism;
const { revenueWithReserve } = auctions;

const COST = 400;
const money = (x: number) => `${x < -1e-9 ? "−" : ""}$${num(Math.abs(x), 1)}`;

export function renderCh11(root: HTMLElement) {
  root.append(
    h("p", { class: "lede" },
      "Every chapter so far took the rules as given and asked how people play. Mechanism design turns the question around: ",
      "what rules should we write so that people pursuing their own interest produce the outcome we want? It's game theory as engineering."),

    h("h2", null, "Build the park?"),
    h("p", null,
      `You and three neighbours are deciding on a shared park that costs $${COST}. It should be built if it's worth at least that to the four of you together. `,
      "Only each person knows what it's worth to them, so the rule has to ask. Try reporting different values under two rules and see whether honesty pays."),
    park(),

    h("h2", null, "Why the second rule works"),
    h("p", null,
      "Under the Clarke rule (Edward Clarke, 1971) everyone owes an equal share if the park is built. Your report only matters when it ", h("em", null, "flips"), " the decision, ",
      "and then you pay a tax equal to the harm the flip does to everyone else. So you face the true cost of your choice, and the best report is your real value. It's the same trick as Vickrey's second-price auction: what you say decides ", h("em", null, "what happens"), ", not what you pay."),
    stepper([
      ["Net values", `Each person's share is $${COST / 4}. Reported values 130, 60, 150, 80 give net values +30, −40, +50, −20. The total is +20, so the park is built.`],
      ["Who is pivotal?", "Without you (+30), the others total −10: they'd vote no. Your report flips the decision, so you're pivotal."],
      ["Your tax", "The flip costs the others 10 in total, so you pay a $10 tax on top of your $100 share. Your gain: 130 − 100 − 10 = 20."],
      ["Lying doesn't help", "Report less than 110 and the park isn't built: you lose 20. Report more and nothing changes. Honesty is (weakly) dominant for everyone at once."],
    ]),
    h("p", null,
      "The catch: the taxes are money nobody gets back, so the budget doesn't balance. Myerson and Satterthwaite (1983) proved there's no escape in general: ",
      "no mechanism is at once efficient, truthful, voluntary and budget-balanced. Designers choose which property to give up."),

    h("h2", null, "The seller's side: reserve prices"),
    h("p", null,
      "A seller can design too. Roger Myerson's 1981 result says the revenue-maximising auction is a second-price auction plus a reserve price: a minimum bid. ",
      "With values spread evenly between 0 and 100, the best reserve is 50, however many bidders there are. Explore it."),
    reserve(),

    depth("formal",
      h("p", null,
        "A ", h("em", null, "mechanism"), " maps reported types to outcomes and payments. It's ", h("em", null, "incentive compatible"), " if truth-telling is an equilibrium, and ", h("em", null, "dominant-strategy"), " IC if truth is best whatever others report. ",
        "The ", h("em", null, "revelation principle"), ": any outcome achievable in some equilibrium of some mechanism can be achieved by a direct mechanism where truth-telling is an equilibrium. So designers can search only over truthful mechanisms."),
      h("p", null,
        "VCG mechanisms choose the efficient outcome and charge each agent the externality it imposes: ", h("span", { class: "math" }, "tᵢ = Σⱼ≠ᵢ vⱼ(x₋ᵢ*) − Σⱼ≠ᵢ vⱼ(x*)"), ". ",
        "With quasi-linear utility, VCG is dominant-strategy IC. Gibbard–Satterthwaite shows that without money, every non-dictatorial voting rule over three or more options can be manipulated.")),

    h("h2", null, "Designed markets"),
    h("ul", { class: "compare" },
      h("li", null, h("strong", null, "Spectrum auctions. "), "Designed by economists to make truthful bidding close to optimal while selling thousands of licences that complement each other."),
      h("li", null, h("strong", null, "Ad auctions. "), "Some platforms have used VCG pricing for ads, charging each advertiser the value its slot takes from others."),
      h("li", null, h("strong", null, "School places and kidneys. "), "Chapter 12: matching mechanisms designed so that families and doctors can safely report what they really want.")),

    depth("quant",
      h("p", null, "Myerson's optimal reserve with uniform values."),
      drill(() => {
        const b = randInt(2, 20) * 10, n = randInt(1, 8);
        const { options, answer } = shuffleOptions(num(b / 2), [num(b / (n + 1)), num((b * n) / (n + 1)), num(b / n), num(b / 3), num(b)]);
        return {
          prompt: `${n} bidder${n > 1 ? "s" : ""}, values uniform on [0, ${b}]. Revenue-maximising reserve price?`,
          options, answer,
          explain: `Set virtual value v − (1 − F)/f = 2v − ${b} to zero: reserve = ${b}/2 = ${num(b / 2)}, independent of the number of bidders.`,
        };
      })),

    tip("make each person pay the harm their choice does to others, and truth becomes optimal (Vickrey, Clarke, VCG). Uniform values: optimal reserve = half the top value, whatever n."),
  );
}

// ---------- Play first: the park ----------

function park(): HTMLElement {
  const box = h("div", { class: "interactive" });
  let rule = 1;
  let truth = 130;
  let others = [60, 150, 80];
  let report = 130;
  const RULES = ["Pay in proportion to your report", "Clarke pivot rule"];
  const out = h("div");
  const label = h("span");
  const slider = h("input", { type: "range", min: 0, max: 300, step: 5, value: report, "aria-label": "Your reported value", oninput: () => { report = Number(slider.value); paint(); } }) as HTMLInputElement;
  const tabsHost = h("div");
  const drawTabs = () => { clear(tabsHost); tabsHost.append(tabRow(RULES, rule, (i) => { rule = i; drawTabs(); paint(); }, "Choose a rule")); };

  const run = (r: number) => (rule === 0 ? proportionalRule : clarkeRule)([r, ...others], COST);
  const paint = () => {
    label.textContent = `You report: $${report} (true value $${truth})`;
    const o = run(report);
    const u = utility(o, 0, truth);
    const curve: [number, number][] = [];
    let bestU = -Infinity, bestR = 0;
    for (let r = 0; r <= 300; r += 5) { const ur = utility(run(r), 0, truth); curve.push([r, ur]); if (ur > bestU + 1e-9) { bestU = ur; bestR = r; } }
    const truthU = utility(run(truth), 0, truth);
    clear(out);
    out.append(
      h("p", { class: "legend" }, `Neighbours report their true values: $${others.join(", $")}. Total true value with yours: $${truth + others.reduce((a, b) => a + b, 0)} vs cost $${COST}.`),
      h("ul", { class: "compare" },
        h("li", null, o.built ? "The park is built." : "The park is not built."),
        h("li", null, `You pay $${num(o.pay[0], 1)}${o.tax[0] ? ` (including a $${num(o.tax[0], 1)} pivot tax)` : ""}. Your gain: `, h("strong", null, money(u)), ".")),
      lineChart({ series: [{ colour: rule === 0 ? "var(--col)" : "var(--eq)", points: curve, name: "Your gain" }], x: [0, 300], y: [Math.min(-60, ...curve.map((c) => c[1])), Math.max(60, ...curve.map((c) => c[1]))], vline: report, hline: 0,
        dots: [{ x: truth, y: truthU, label: "truth", colour: "var(--ink)" }], xLabel: "Your report", aria: "Your gain against your report" }),
      h("p", { class: `feedback ${bestU > truthU + 1e-9 ? "bad" : "good"}` },
        bestU > truthU + 1e-9
          ? `Lying pays: reporting about $${bestR} earns ${money(bestU)} against ${money(truthU)} for the truth. Under this rule everyone shades down, and worthwhile parks don't get built.`
          : `No report beats the truth (gain ${money(truthU)}). Honesty is a dominant strategy here.`),
      h("div", { class: "controls" },
        h("button", { class: "btn btn-quiet", type: "button", onclick: () => { truth = randInt(4, 30) * 10; others = [randInt(2, 25) * 10, randInt(2, 25) * 10, randInt(2, 25) * 10]; report = truth; slider.value = String(report); paint(); } }, "New neighbours")));
  };
  box.append(tabsHost, h("label", { class: "range" }, label, slider), out);
  drawTabs();
  paint();
  return box;
}

// ---------- Reserve price ----------

function reserve(): HTMLElement {
  return sliderPanel(
    [
      { key: "n", label: (v) => `Bidders: ${v}`, min: 1, max: 8, value: 2, aria: "Number of bidders" },
      { key: "r", label: (v) => `Reserve price: ${v}`, min: 0, max: 100, value: 0, aria: "Reserve price" },
    ],
    ({ n, r }, out) => {
      const pts: [number, number][] = [];
      for (let x = 0; x <= 100; x += 2) pts.push([x, 100 * revenueWithReserve(n, x / 100)]);
      const now = 100 * revenueWithReserve(n, r / 100), best = 100 * revenueWithReserve(n, 0.5), none = 100 * revenueWithReserve(n, 0);
      out.append(
        lineChart({ series: [{ colour: "var(--row)", points: pts, name: "Expected revenue" }], x: [0, 100], y: [0, 100], vline: r, dots: [{ x: 50, y: best, label: "r = 50" }], xLabel: "Reserve price", aria: "Expected revenue against reserve price" }),
        h("p", { class: `feedback ${r === 50 ? "good" : ""}` },
          `Expected revenue ${num(now, 1)} (no reserve: ${num(none, 1)}, best: ${num(best, 1)} at 50). `,
          n === 1 ? "With one bidder the reserve is just a posted price." : "Sometimes the item goes unsold, but the reserve squeezes more from high bidders; the trade-off peaks at 50 for any number of bidders."));
    });
}
