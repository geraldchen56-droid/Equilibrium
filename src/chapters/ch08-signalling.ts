import { signalling } from "../engine";
import { clear, depth, h } from "../ui/dom";
import { drill, lineChart, num, randInt, shuffleOptions, sliderPanel, stepper, tip } from "../ui/widgets";

const { lemons, spenceCheck, spenceRange } = signalling;

export function renderCh08(root: HTMLElement) {
  root.append(
    h("p", { class: "lede" },
      "Until now everyone knew the payoffs. Real deals happen between people who know different things: the seller knows the car, the applicant knows her ability, the manager knows the firm's prospects. ",
      "Hidden information can destroy a market, and the cure is often a costly signal that seems wasteful on its own."),

    h("h2", null, "Buy a used car"),
    h("p", null,
      "Twenty cars are for sale, worth 5 to 100 to their owners. Each would be worth 50% more to you, so every sale could make both sides better off. ",
      "But you can't tell a good car from a lemon. You name one price; every owner whose car is worth less than that offers it, and you get one of the offered cars at random."),
    carMarket(),

    h("h2", null, "The market for lemons"),
    h("p", null,
      "Raising your price doesn't buy you a better car on average; it mostly brings in more cars that are only just worth that price. ",
      "George Akerlof's 1970 paper showed that if quality is spread evenly, the average car on offer is worth half the price to its owner, so a buyer who values cars at ", h("span", { class: "math" }, "k"), " times their owner's value expects ",
      h("span", { class: "math" }, "k·p/2"), ". Unless buyers value cars at least twice as much as sellers, every price loses money and the market for good cars disappears."),
    akerlof(),

    h("h2", null, "Proving you're good"),
    h("p", null,
      "Now flip it. An able worker wants to be recognised, but every applicant claims to be able. Michael Spence's answer: do something that is cheaper for able people than for everyone else. ",
      "Suppose employers pay a premium to anyone they believe is able, and a year of education is less costly (in effort, stress and time) for able students. ",
      "Pick how much education employers should treat as the signal and see whether it separates the two types."),
    spence(),
    h("p", null,
      "In this model education teaches nothing, yet it's worth acquiring because of what it reveals. A signal works only if it hurts liars more than it hurts the honest. ",
      "Cheap talk (\"I'm very hard-working\") costs everyone the same, which is why nobody believes it."),

    depth("formal",
      h("p", null,
        "Signalling games are solved with ", h("em", null, "perfect Bayesian equilibrium"), ": strategies for each type of sender, beliefs for the receiver, beliefs updated by Bayes' rule where possible, and every action a best response to beliefs. ",
        "In a ", h("em", null, "separating"), " equilibrium types choose different signals and are fully revealed; in a ", h("em", null, "pooling"), " equilibrium they choose the same signal and the receiver learns nothing."),
      h("p", null,
        "Separation needs ", h("em", null, "single crossing"), ": the marginal cost of the signal is lower for the high type. With premium ", h("span", { class: "math" }, "W"), " and unit costs ", h("span", { class: "math" }, "c_H < c_L"), ", any ",
        h("span", { class: "math" }, "e* ∈ [W/c_L, W/c_H]"), " separates. The Cho-Kreps ", h("em", null, "intuitive criterion"), " rules out all but the cheapest, ", h("span", { class: "math" }, "e* = W/c_L"), ".")),

    h("h2", null, "Solve a separating equilibrium"),
    stepper([
      ["Set it up", "Employers pay 40 more to anyone with at least e years of extra education. A year costs an able worker 5 and anyone else 10."],
      ["The others mustn't copy", "Mimicking would earn 40 and cost 10e. They stay away if 40 ≤ 10e, so e ≥ 4."],
      ["The able must want it", "Getting the signal earns 40 and costs 5e. Worth it if 40 ≥ 5e, so e ≤ 8."],
      ["Pick the cheapest", "Any standard from 4 to 8 years separates. Above 4, the extra years are pure waste for the able, so the sensible (intuitive) equilibrium is e = 4: just enough to deter mimics."],
    ]),

    h("h2", null, "Signals everywhere"),
    h("ul", { class: "compare" },
      h("li", null, h("strong", null, "Dividends. "), "Paying cash out is costly for a firm that will need it later, so a steady dividend signals confidence that profits will keep coming. Markets often react sharply to dividend cuts for exactly this reason."),
      h("li", null, h("strong", null, "Warranties. "), "A long warranty is cheap to offer on a reliable product and ruinous on a bad one."),
      h("li", null, h("strong", null, "Peacocks. "), "Biologists' handicap principle: a huge tail is a burden only a healthy bird can afford, which is why peahens pay attention to it."),
      h("li", null, h("strong", null, "Insurance and lending. "), "The flip side of lemons: the people keenest to buy insurance are often the riskiest, so insurers screen with deductibles and medical checks.")),

    depth("quant",
      h("p", null, "Find the cheapest education standard that separates the two types."),
      drill(() => {
        const cH = randInt(1, 5), cL = cH + randInt(1, 6), W = cL * randInt(2, 6);
        const lo = W / cL, hi = W / cH;
        const { options, answer } = shuffleOptions(num(lo), [num(hi), num((lo + hi) / 2), num(W / (cL - cH)), num(W / (cL + cH))]);
        return {
          prompt: `Premium ${W}; a year costs ${cH} for able workers and ${cL} for others. Least-cost separating standard?`,
          options, answer,
          explain: `Others must not copy: ${W} ≤ ${cL}e ⇒ e ≥ ${num(lo)}. Able must want it: ${W} ≥ ${cH}e ⇒ e ≤ ${num(hi)}. Cheapest: W/c_L = ${num(lo)}.`,
        };
      })),

    tip("a signal must hurt the liar more than the honest. Separating range W/c_L to W/c_H; the sensible one is the cheapest, W/c_L. Lemons: trade dies unless buyers value quality at least 2× sellers (uniform quality)."),
  );
}

// ---------- Play first: used-car market ----------

function carMarket(): HTMLElement {
  const CARS = Array.from({ length: 20 }, (_, i) => (i + 1) * 5);
  const box = h("div", { class: "interactive" });
  let priceV = 60;
  let log: { price: number; q: number; profit: number }[] = [];
  const label = h("span"), out = h("div");
  const slider = h("input", { type: "range", min: 5, max: 100, step: 5, value: priceV, "aria-label": "Your price", oninput: () => { priceV = Number(slider.value); paint(); } }) as HTMLInputElement;
  const buy = () => {
    const offered = CARS.filter((q) => q <= priceV);
    const q = offered[Math.floor(Math.random() * offered.length)];
    log.unshift({ price: priceV, q, profit: 1.5 * q - priceV });
    log = log.slice(0, 8);
    paint();
  };
  const paint = () => {
    label.textContent = `Your price: ${priceV}`;
    const offered = CARS.filter((q) => q <= priceV);
    const avg = offered.reduce((a, b) => a + b, 0) / offered.length;
    const exp = 1.5 * avg - priceV;
    const total = log.reduce((a, l) => a + l.profit, 0);
    clear(out);
    out.append(
      h("div", null, CARS.map((q) => h("span", { class: `pill ${q <= priceV ? "eq" : ""}`, title: `Worth ${q} to its owner, ${1.5 * q} to you` }, String(q)))),
      h("p", { class: "legend" }, `${offered.length} of 20 owners offer their car. Average car on offer: worth ${num(avg, 1)} to its owner, ${num(1.5 * avg, 1)} to you. Expected profit per purchase: `,
        h("strong", { class: exp >= 0 ? "chip-p0" : "" }, num(exp, 1)), "."),
      h("div", { class: "controls" }, h("button", { class: "btn btn-p0", type: "button", onclick: buy }, "Buy at this price")),
      log.length ? h("p", { class: `feedback ${total >= 0 ? "good" : "bad"}` },
        `Last purchase: car worth ${log[0].q} (${1.5 * log[0].q} to you) for ${log[0].price}, profit ${num(log[0].profit, 1)}. Running total over ${log.length} cars: ${num(total, 1)}.`,
        log.length >= 4 && total < 0 ? " Every time you raise the price to attract good cars, the lemons come along too." : "") : "");
  };
  box.append(h("label", { class: "range" }, label, slider), out);
  paint();
  return box;
}

// ---------- Akerlof: buyer profit vs price ----------

function akerlof(): HTMLElement {
  return sliderPanel(
    [{ key: "k", label: (v) => `Buyers value cars at ${(v / 100).toFixed(2)}× what owners do`, min: 100, max: 300, step: 10, value: 150, aria: "Buyer premium" }],
    ({ k }, out) => {
      const kk = k / 100;
      const pts: [number, number][] = [];
      for (let p = 0; p <= 1.0001; p += 0.05) pts.push([p, lemons(p, kk).buyerProfit]);
      const lo = Math.min(-0.5, ...pts.map((x) => x[1])), hi = Math.max(0.5, ...pts.map((x) => x[1]));
      out.append(
        lineChart({ series: [{ colour: kk >= 2 ? "var(--eq)" : "var(--bad)", points: pts, name: "Buyer's expected profit" }], x: [0, 1], y: [lo, hi], hline: 0, xLabel: "Price (as a share of the best car's value)", aria: "Buyer profit against price" }),
        h("p", { class: `feedback ${kk >= 2 ? "good" : "bad"}` },
          kk > 2 ? "Buyers gain at every price, so the whole market trades." : kk === 2 ? "Exactly break-even at every price: the knife edge." : `Every positive price loses ${num(1 - kk / 2, 2)} per unit of price. No trade, even though every car is worth more to a buyer than to its owner.`));
    });
}

// ---------- Spence ----------

function spence(): HTMLElement {
  return sliderPanel(
    [
      { key: "W", label: (v) => `Pay premium for 'able': ${v}`, min: 10, max: 80, step: 5, value: 40, aria: "Pay premium" },
      { key: "e", label: (v) => `Education standard: ${v / 2} years`, min: 0, max: 20, value: 8, aria: "Education standard in half-years" },
      { key: "cH", label: (v) => `Cost per year, able: ${v}`, min: 1, max: 15, value: 5, aria: "Cost per year for able workers" },
      { key: "cL", label: (v) => `Cost per year, others: ${v}`, min: 1, max: 20, value: 10, aria: "Cost per year for other workers" },
    ],
    ({ W, e, cH, cL }, out) => {
      const yrs = e / 2;
      const r = spenceRange(W, cH, cL);
      const c = spenceCheck(yrs, W, cH, cL);
      const maxE = 10;
      const band = h("div", { class: "band", role: "img", "aria-label": `Separating range ${num(r.lo, 1)} to ${num(r.hi, 1)} years` },
        r.exists && r.lo <= maxE ? h("span", { class: "band-ok", style: `left:${(Math.min(r.lo, maxE) / maxE) * 100}%;width:${((Math.min(r.hi, maxE) - Math.min(r.lo, maxE)) / maxE) * 100}%` }) : "",
        h("span", { class: "band-mark", style: `left:${(yrs / maxE) * 100}%` }));
      out.append(
        band,
        h("p", { class: "legend" }, r.exists ? `Separating standards: ${num(r.lo, 1)} to ${num(r.hi, 1)} years (green).` : "Education costs the others no more than the able, so no standard can tell them apart."),
        h("ul", { class: "compare" },
          h("li", { class: c.highPays ? "chip-p0" : "" }, `Able worker: premium ${W} − cost ${num(cH * yrs, 1)} = ${num(c.highNet, 1)}. ${c.highPays ? "Worth getting." : "Not worth it, so they skip it."}`),
          h("li", { class: c.lowStaysOut ? "chip-p1" : "" }, `Others, if they copied: ${W} − ${num(cL * yrs, 1)} = ${num(c.lowNetIfMimic, 1)}. ${c.lowStaysOut ? "Not worth faking." : "Worth faking, so the signal means nothing."}`)),
        h("p", { class: `feedback ${c.separating ? "good" : "bad"}` },
          c.separating ? (Math.abs(yrs - r.lo) < 0.26 ? "Separating, and about as cheap as possible." : "Separating, but able workers are paying for more education than they need to.")
            : !c.lowStaysOut ? "Too easy: the others can afford it too." : "Too hard: even the able won't bother."));
    });
}
