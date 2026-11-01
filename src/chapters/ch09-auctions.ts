import { auctions } from "../engine";
import { clear, depth, h } from "../ui/dom";
import { bars, drill, lineChart, num, randInt, shuffleOptions, sliderPanel, stepper, tip } from "../ui/widgets";

const { breakEvenShade, expectedRevenue, firstPriceBid, secondPriceProfit, simulate, winnersCurse } = auctions;

export function renderCh09(root: HTMLElement) {
  root.append(
    h("p", { class: "lede" },
      "An auction is a game with hidden information built in: everyone knows what the item is worth to them and nobody knows what it's worth to anyone else. ",
      "The rules decide how much you should hide, and, surprisingly often, they don't change how much the seller earns."),

    h("h2", null, "Bid against three rivals"),
    h("p", null,
      "A sealed-bid, first-price auction: everyone writes down one bid, the highest bid wins and pays what it bid. ",
      "Each round you learn what the item is worth to you, between 0 and 100. Three rivals have their own private values. Bid too high and you win but make nothing; too low and you lose deals you'd have liked."),
    firstPriceGame(),
    h("p", null,
      "Your rivals bid three quarters of their value. That's the equilibrium with four bidders: with ", h("span", { class: "math" }, "n"), " bidders and values spread evenly, everyone bids ",
      h("span", { class: "math" }, "(n − 1)/n"), " of their value. Bidding your true value guarantees zero profit; shading trades a lower chance of winning for a bigger margin when you do."),

    h("h2", null, "Second price: just tell the truth"),
    h("p", null,
      "Change one rule: the winner pays the ", h("em", null, "second"), "-highest bid. William Vickrey showed in 1961 that you should then bid exactly your value, whatever anyone else does. ",
      "The item is worth 70 to you. Choose a bid, and compare your profit with honest bidding for every possible highest rival bid."),
    vickrey(),
    h("p", null,
      "Your bid only decides ", h("em", null, "whether"), " you win, never what you pay. Overbidding adds wins only when the rival bid is above your value, and you pay more than the item is worth. ",
      "Underbidding loses wins you'd have profited from. Truth-telling is a dominant strategy. An English (ascending) auction works the same way: stay in until the price reaches your value."),

    h("h2", null, "Which format earns more?"),
    h("p", null,
      "First-price bidders shade; second-price bidders don't but pay someone else's bid. These effects exactly cancel. Simulate thousands of auctions and compare."),
    equivalence(),
    h("p", null,
      "This is the ", h("em", null, "revenue equivalence theorem"), ": with independent private values and risk-neutral bidders, every standard format gives the seller the same expected revenue. ",
      "The interesting question becomes when it fails: risk-averse bidders bid higher in first-price auctions, and common values bring in the winner's curse."),

    h("h2", null, "The winner's curse"),
    h("p", null,
      "Now the item is worth the same to everyone, like an oil field or a jar of coins, but each bidder only has a noisy estimate. ",
      "The winner is whoever had the most optimistic estimate, so winning is bad news about the estimate. Bid your estimate and you lose money on average."),
    curse(),

    depth("formal",
      h("p", null,
        "In the first-price auction with values i.i.d. uniform on [0, 1], suppose rivals bid ", h("span", { class: "math" }, "βv"), ". Bidding ", h("span", { class: "math" }, "b"), " wins with probability ",
        h("span", { class: "math" }, "(b/β)ⁿ⁻¹"), ", so expected profit is ", h("span", { class: "math" }, "(v − b)(b/β)ⁿ⁻¹"), ". The first-order condition gives ", h("span", { class: "math" }, "b = (n − 1)v/n"), ", so ", h("span", { class: "math" }, "β = (n − 1)/n"), " is an equilibrium."),
      h("p", null,
        "Expected revenue in both formats equals the expected second-highest value, ", h("span", { class: "math" }, "(n − 1)/(n + 1)"), ". Myerson (1981) showed that revenue depends only on who wins as a function of values and on what the lowest type gets, which is why all efficient formats tie.")),

    h("h2", null, "Derive the shading with two bidders"),
    stepper([
      ["Guess a strategy", "Suppose your rival bids half their value. Their bid is uniform on [0, ½]."],
      ["Your chance of winning", "Bid b (at most ½) and you win if the rival's bid is below b: probability 2b."],
      ["Expected profit", "(v − b) × 2b. Differentiate: 2v − 4b = 0, so b = v/2."],
      ["It's consistent", "Your best reply to 'bid half' is to bid half, so both bidding v/2 is an equilibrium. With n bidders, the same steps give (n − 1)v/n."],
    ]),

    h("h2", null, "Auctions in the wild"),
    h("ul", { class: "compare" },
      h("li", null, h("strong", null, "Spectrum. "), "Governments sell mobile-phone frequencies by auction. The UK's 2000 auction of 3G licences raised about £22.5 billion; designers like Paul Milgrom and Robert Wilson won the 2020 Nobel prize partly for this work."),
      h("li", null, h("strong", null, "Search ads. "), "Every search triggers an auction for ad slots, historically a 'generalised second-price' design: you pay roughly the bid of the advertiser below you."),
      h("li", null, h("strong", null, "eBay. "), "Proxy bidding raises your bid automatically up to your maximum, which makes it close to a second-price auction: enter your true maximum and let it run.")),

    depth("quant",
      h("p", null, "Equilibrium bids and expected revenues, uniform values."),
      drill(() => {
        const n = randInt(2, 8), v = randInt(2, 10) * 10;
        if (Math.random() < 0.5) {
          const b = firstPriceBid(v, n);
          const { options, answer } = shuffleOptions(num(b, 2), [num(v, 2), num(v / n, 2), num(((n - 2) / (n - 1)) * v, 2), num((n / (n + 1)) * v, 2)]);
          return { prompt: `First-price, ${n} bidders, values uniform. Your value is ${v}. Equilibrium bid?`, options, answer, explain: `Bid (n − 1)/n × value = ${n - 1}/${n} × ${v} = ${num(b, 2)}.` };
        }
        const r = expectedRevenue(n);
        const f = (a: number, b: number) => `${a}/${b}`;
        const { options, answer } = shuffleOptions(f(n - 1, n + 1), [f(n - 1, n), f(1, n + 1), f(n, n + 1), f(n - 2, n)]);
        return { prompt: `${n} bidders, values uniform on [0, 1]. Expected revenue of a second-price auction?`, options, answer, explain: `Expected second-highest of ${n} uniforms: (n − 1)/(n + 1) = ${num(r, 3)}. Same for first-price.` };
      })),

    tip("first-price: bid (n − 1)/n of value. Second-price: bid your value. Revenue either way: (n − 1)/(n + 1). Common value: winning means you were the most optimistic, so shade."),
  );
}

// ---------- Play first: first-price auction vs three rivals ----------

function firstPriceGame(): HTMLElement {
  const N = 4;
  const box = h("div", { class: "interactive" });
  let value = 0, bid = 0, rivals: number[] = [];
  let shown = false;
  let rounds: { profit: number; eqProfit: number }[] = [];
  const out = h("div");
  const label = h("span");
  const slider = h("input", { type: "range", min: 0, max: 100, value: 0, "aria-label": "Your bid", oninput: () => { bid = Number(slider.value); label.textContent = `Your bid: ${bid}`; } }) as HTMLInputElement;

  const deal = () => {
    value = randInt(10, 100);
    rivals = Array.from({ length: N - 1 }, () => Math.round(firstPriceBid(randInt(0, 100), N)));
    bid = Math.round(value * 0.9); slider.value = String(bid); label.textContent = `Your bid: ${bid}`;
    shown = false; paint();
  };
  const submit = () => {
    const top = Math.max(...rivals);
    const win = bid > top;
    const eqBid = firstPriceBid(value, N);
    rounds.push({ profit: win ? value - bid : 0, eqProfit: eqBid > top ? value - eqBid : 0 });
    shown = true; paint();
  };
  const paint = () => {
    clear(out);
    const total = rounds.reduce((a, r) => a + r.profit, 0), eq = rounds.reduce((a, r) => a + r.eqProfit, 0);
    out.append(
      h("div", { class: "scoreboard" },
        h("span", null, "Value to you ", h("strong", { class: "big" }, String(value))),
        h("span", null, "Round ", h("strong", null, String(rounds.length + (shown ? 0 : 1)))),
        h("span", null, "Your profit ", h("strong", null, num(total, 0)))),
      !shown
        ? h("div", { class: "controls" }, h("button", { class: "btn btn-p0", type: "button", onclick: submit }, "Submit sealed bid"))
        : h("div", null,
          bars([{ label: "You", value: bid, cls: "p0", win: bid > Math.max(...rivals) }, ...rivals.map((r, i) => ({ label: `Rival ${i + 1}`, value: r, cls: "p1", win: r === Math.max(...rivals) && r >= bid }))], 100),
          h("p", { class: `feedback ${bid > Math.max(...rivals) ? (value - bid > 0 ? "good" : "bad") : ""}` },
            bid > Math.max(...rivals) ? `You win and pay ${bid}: profit ${value - bid}.` : `Rival bid ${Math.max(...rivals)} wins. You make nothing this round.`,
            ` Bidding ¾ of your value (${num(firstPriceBid(value, N), 0)}) would have ${firstPriceBid(value, N) > Math.max(...rivals) ? `won, for ${num(value - firstPriceBid(value, N), 0)}` : "lost too"}.`),
          h("p", { class: "legend" }, `After ${rounds.length} round${rounds.length === 1 ? "" : "s"}: you ${num(total, 0)}, equilibrium bidding ${num(eq, 0)}.`),
          h("div", { class: "controls" }, h("button", { class: "btn btn-p0", type: "button", onclick: deal }, "Next item"))));
  };
  box.append(h("label", { class: "range" }, label, slider), out);
  deal();
  return box;
}

// ---------- Second-price dominance ----------

function vickrey(): HTMLElement {
  const V = 70;
  return sliderPanel(
    [{ key: "b", label: (v) => `Your bid: ${v} (value 70)`, min: 0, max: 100, value: 85, aria: "Your bid" }],
    ({ b }, out) => {
      const xs = Array.from({ length: 101 }, (_, i) => i);
      const truth = xs.map((r) => [r, secondPriceProfit(V, V, r)] as [number, number]);
      const mine = xs.map((r) => [r, secondPriceProfit(V, b, r)] as [number, number]);
      const lossZone = b > V ? `If the top rival bids between 70 and ${b}, you win and lose up to ${b - V}.` : b < V ? `If the top rival bids between ${b} and 70, you lose a deal worth up to ${V - b}.` : "Identical to truth-telling everywhere.";
      out.append(
        lineChart({ series: [{ colour: "var(--eq)", points: truth, name: "Bid 70 (truth)", width: 4 }, { colour: "var(--row)", points: mine, name: `Bid ${b}`, dashed: true }], x: [0, 100], y: [-30, 70], hline: 0, legend: true, xLabel: "Highest rival bid", aria: "Profit against the highest rival bid" }),
        h("p", { class: `feedback ${b === V ? "good" : "bad"}` }, lossZone, " Everywhere else the two lines coincide: your bid never changes the price you pay."));
    });
}

// ---------- Revenue equivalence ----------

function equivalence(): HTMLElement {
  return sliderPanel(
    [{ key: "n", label: (v) => `Number of bidders: ${v}`, min: 2, max: 10, value: 3, aria: "Number of bidders" }],
    ({ n }, out) => {
      const T = 4000;
      const fp = simulate("first", n, T), sp = simulate("second", n, T);
      const th = expectedRevenue(n);
      out.append(
        bars([
          { label: "First-price", value: fp.revenue * 100, text: num(fp.revenue * 100, 1), cls: "p0" },
          { label: "Second-price", value: sp.revenue * 100, text: num(sp.revenue * 100, 1), cls: "p1" },
          { label: "Theory", value: th * 100, text: num(th * 100, 1), cls: "eq" },
        ], 100),
        h("p", { class: "legend" }, `Average price over ${T} simulated auctions each, values uniform from 0 to 100. Theory: 100 × (n − 1)/(n + 1). More bidders push revenue toward the top value.`));
    });
}

// ---------- Winner's curse ----------

function curse(): HTMLElement {
  return sliderPanel(
    [
      { key: "n", label: (v) => `Bidders: ${v}`, min: 2, max: 12, value: 6, aria: "Number of bidders" },
      { key: "e", label: (v) => `Estimates off by up to: ±${v}`, min: 2, max: 30, value: 20, aria: "Estimate noise" },
      { key: "s", label: (v) => `You shade your estimate by: ${v}`, min: 0, max: 30, value: 0, aria: "Shade" },
    ],
    ({ n, e, s }, out) => {
      const p = winnersCurse(n, e, s, 6000);
      const be = breakEvenShade(n, e);
      out.append(h("p", { class: `feedback ${p >= 0 ? "good" : "bad"}` },
        `Average profit for whoever wins: ${num(p, 1)}. `,
        p < 0 ? `The winner has the highest estimate, which overshoots by about ${num(be, 1)} on average. Shade by at least that much just to break even.`
          : `Shading by ${s} beats the expected overshoot of ${num(be, 1)}, so winners now make money (though they win less often in a real contest).`),
        h("p", { class: "legend" }, "Everyone uses the same rule here. More bidders or noisier estimates make the curse worse, so you should shade more in a crowded auction, the opposite of private-value intuition."));
    });
}
