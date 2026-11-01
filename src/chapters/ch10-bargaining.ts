import { bargaining } from "../engine";
import { clear, depth, h } from "../ui/dom";
import { bars, drill, lineChart, num, pct, shuffleOptions, sliderPanel, stepper, tip } from "../ui/widgets";

const { acceptProb, nashSplit, rubinstein, shrinkingPie, ultimatumExpected } = bargaining;

export function renderCh10(root: HTMLElement) {
  root.append(
    h("p", { class: "lede" },
      "Most prices in life aren't posted; they're negotiated. Wages, house prices, mergers, peace treaties. ",
      "Game theory can't tell you what's fair, but it can tell you where the power comes from: who can walk away, who can wait, and who gets the last word."),

    h("h2", null, "The ultimatum game"),
    h("p", null,
      "You have $10 to split with a stranger. You propose a split; they can accept it or reject it, and if they reject, neither of you gets anything. ",
      "A perfectly selfish responder accepts any positive offer, so theory says offer one cent. Ten strangers are waiting. Make your offers."),
    ultimatum(),
    h("p", null,
      "In lab experiments since Werner Güth's in 1982, most proposers offer 40 to 50%, and offers under about 20% are rejected around half the time. ",
      "Responders pay to punish unfairness. Against people like that, the profit-maximising offer isn't one cent; it's around a third."),
    expectedCurve(),

    h("h2", null, "A pie that melts"),
    h("p", null,
      "Real bargaining goes back and forth. Picture an ice cream that loses value every round you argue. One player proposes; if the other refuses, they counter-offer next round, over a smaller pie. ",
      "In the final round the proposer can demand everything. Work backward from there."),
    melting(),
    h("p", null,
      "Each proposer offers the other exactly what they'd get by waiting, one round of melting later. As the number of rounds grows, the first proposer's share settles at ",
      h("span", { class: "math" }, "1/(1 + δ)"), ". Ariel Rubinstein proved in 1982 that this is the unique subgame-perfect outcome of bargaining that could go on forever."),

    h("h2", null, "Patience is power"),
    h("p", null, "Give the two players different patience: one may have bills to pay, the other deep pockets. The patient side can afford to wait, so the impatient side concedes."),
    patience(),

    h("h2", null, "Your walk-away option"),
    h("p", null,
      "John Nash's other famous idea, the Nash bargaining solution, says each side first gets what they'd have if talks failed, then they split the extra value equally. ",
      "Negotiators call your fallback your BATNA: best alternative to a negotiated agreement. Improve it and your share goes up, even if you never use it."),
    outside(),

    depth("formal",
      h("p", null,
        "In Rubinstein's model, players alternate offers over a pie of size 1 with discount factors ", h("span", { class: "math" }, "δ₁, δ₂"), ". In the unique subgame-perfect equilibrium, agreement is immediate and the first proposer gets"),
      h("p", { class: "display" }, h("span", { class: "math" }, "x* = (1 − δ₂)/(1 − δ₁δ₂)")),
      h("p", null,
        "The proof uses stationarity: the responder must be offered exactly ", h("span", { class: "math" }, "δ₂"), " times what they'd get as proposer next round. ",
        "The Nash bargaining solution maximises ", h("span", { class: "math" }, "(u₁ − d₁)(u₂ − d₂)"), " and is the unique solution satisfying four axioms (efficiency, symmetry, scale invariance and independence of irrelevant alternatives). ",
        "As the time between offers shrinks to zero, Rubinstein's outcome converges to a Nash bargaining solution.")),

    h("h2", null, "Solve three rounds by hand"),
    stepper([
      ["Round 3", "The pie is worth 25% of its original size (it halves each round). Player 1 proposes and the game ends afterwards, so player 1 takes everything: 1 gets 0.25, 2 gets 0."],
      ["Round 2", "The pie is worth 50%. Player 2 proposes. Player 1 accepts anything at least as good as waiting, which is 0.25. So 2 offers 0.25 and keeps 0.25."],
      ["Round 1", "Full pie. Player 1 proposes. Player 2 accepts anything at least as good as waiting: 0.25. So 1 offers 0.25 and keeps 0.75."],
      ["Read it", "Agreement is instant, and nothing melts. The threat of delay shapes the split even though delay never happens. With more rounds the share tends to 1/(1 + ½) = ⅔."],
    ]),

    h("h2", null, "Bargaining in the wild"),
    h("ul", { class: "compare" },
      h("li", null, h("strong", null, "Strikes and lockouts. "), "Both sides lose money every day; the side that can last longer, through strike funds or inventories, gets the better deal."),
      h("li", null, h("strong", null, "Job offers. "), "A competing offer raises your walk-away payoff, which is why it moves salary negotiations more than any argument."),
      h("li", null, h("strong", null, "Deadlines. "), "A firm deadline gives the last offer to whoever controls it, the ultimatum game's power.")),

    depth("quant",
      h("p", null, "Rubinstein with equal patience: the first proposer's share."),
      drill(() => {
        const pairs: [number, number][] = [[1, 2], [2, 3], [3, 4], [4, 5], [9, 10], [1, 3], [3, 5]];
        const [a, b] = pairs[Math.floor(Math.random() * pairs.length)];
        const f = (n: number, d: number) => `${n}/${d}`;
        const { options, answer } = shuffleOptions(f(b, a + b), [f(a, a + b), f(1, 2), f(b - a, b), f(a, b)]);
        return {
          prompt: `Infinite alternating offers, both players discount by δ = ${a}/${b} per round. First proposer's share?`,
          options, answer,
          explain: `1/(1 + δ) = 1/(1 + ${a}/${b}) = ${b}/${a + b}. The responder gets δ/(1 + δ) = ${a}/${a + b}.`,
        };
      })),

    tip("work back from the last offer. Each side is offered exactly what waiting is worth. Equal patience: proposer gets 1/(1 + δ). Better walk-away option, bigger share."),
  );
}

// ---------- Play first: ultimatum offers to ten strangers ----------

function ultimatum(): HTMLElement {
  const box = h("div", { class: "interactive" });
  let offer = 2;
  let log: { offer: number; ok: boolean }[] = [];
  const label = h("span"), out = h("div");
  const slider = h("input", { type: "range", min: 0, max: 10, step: 0.5, value: offer, "aria-label": "Your offer in dollars", oninput: () => { offer = Number(slider.value); label.textContent = lab(); } }) as HTMLInputElement;
  const lab = () => `Offer the stranger $${offer.toFixed(2)}, keep $${(10 - offer).toFixed(2)}`;
  label.textContent = lab();
  const propose = () => {
    if (log.length >= 10) return;
    log.push({ offer, ok: Math.random() < acceptProb(offer / 10) });
    paint();
  };
  const paint = () => {
    clear(out);
    const kept = log.reduce((a, l) => a + (l.ok ? 10 - l.offer : 0), 0);
    out.append(
      h("div", { class: "scoreboard" },
        h("span", null, "Stranger ", h("strong", null, `${log.length}/10`)),
        h("span", null, "You've kept ", h("strong", null, `$${kept.toFixed(2)}`))),
      h("div", { class: "pips" }, log.map((l) => h("span", { class: `pip ${l.ok ? "goal" : "miss"}`, title: `Offered $${l.offer}: ${l.ok ? "accepted" : "rejected"}` }, Number.isInteger(l.offer) ? String(l.offer) : `${Math.floor(l.offer) || ""}½`))),
      log.length < 10
        ? h("div", { class: "controls" }, h("button", { class: "btn btn-p0", type: "button", onclick: propose }, "Make the offer"))
        : h("div", null,
          h("p", { class: "feedback done" }, `You kept $${kept.toFixed(2)} from $100 on the table. ${log.filter((l) => !l.ok).length} offer(s) were rejected. A one-cent offer would have kept about $${(10 * 10 * ultimatumExpected(0.001)).toFixed(2)} against these responders.`),
          h("div", { class: "controls" }, h("button", { class: "btn btn-quiet", type: "button", onclick: () => { log = []; paint(); } }, "Ten new strangers"))),
      log.length ? h("p", { class: "legend" }, `Last offer of $${log[log.length - 1].offer.toFixed(2)} was ${log[log.length - 1].ok ? "accepted" : "rejected"}.`) : "");
  };
  box.append(h("label", { class: "range" }, label, slider), out);
  paint();
  return box;
}

function expectedCurve(): HTMLElement {
  const pts: [number, number][] = [], acc: [number, number][] = [];
  let best = 0;
  for (let x = 0; x <= 1.0001; x += 0.01) { pts.push([x, ultimatumExpected(x)]); acc.push([x, acceptProb(x)]); if (ultimatumExpected(x) > ultimatumExpected(best)) best = x; }
  const box = h("div", { class: "interactive" });
  box.append(
    lineChart({ series: [{ colour: "var(--muted)", points: acc, name: "Chance of acceptance", dashed: true }, { colour: "var(--row)", points: pts, name: "Your expected share" }],
      x: [0, 1], y: [0, 1], xFmt: (v) => pct(v), yFmt: (v) => pct(v), vline: best, dots: [{ x: best, y: ultimatumExpected(best), label: `best ≈ ${pct(best)}` }],
      xLabel: "Share offered to the responder", aria: "Expected share against offer size" }),
    h("p", { class: "legend" }, `Against responders who reject stingy offers, the best offer is about ${pct(best)} of the pie, for an expected ${pct(ultimatumExpected(best))}. Offering 1% expects about ${pct(ultimatumExpected(0.01))}.`));
  return box;
}

// ---------- Shrinking pie ----------

function melting(): HTMLElement {
  return sliderPanel(
    [
      { key: "T", label: (v) => `Rounds: ${v}`, min: 1, max: 10, value: 3, aria: "Number of rounds" },
      { key: "d", label: (v) => `Pie kept each round δ: ${(v / 100).toFixed(2)}`, min: 10, max: 95, step: 5, value: 50, aria: "Discount factor" },
    ],
    ({ T, d }, out) => {
      const dd = d / 100;
      const s = shrinkingPie(T, dd);
      const rows = s.map((share, t) => {
        const size = dd ** t;
        const proposer = t % 2 === 0 ? 1 : 2;
        return h("tr", null, h("td", null, String(t + 1)), h("td", { class: proposer === 1 ? "chip-p0" : "chip-p1" }, `Player ${proposer}`), h("td", null, pct(size)), h("td", null, `${pct(share * size, 1)} / ${pct((1 - share) * size, 1)}`));
      });
      out.append(
        h("div", { class: "table-scroll" }, h("table", { class: "stats" },
          h("tr", null, h("th", null, "Round"), h("th", null, "Proposes"), h("th", null, "Pie left"), h("th", null, "Proposer / other, if reached")), rows)),
        h("p", { class: "feedback good" },
          `Player 1 proposes ${pct(s[0], 1)} / ${pct(1 - s[0], 1)} in round 1 and player 2 accepts at once. `,
          `Infinite-horizon limit 1/(1 + δ) = ${pct(1 / (1 + dd), 1)}.`,
          T % 2 === 0 && T < 30 ? " With an even number of rounds player 2 makes the final take-it-or-leave-it offer, which is why player 1 can end up with less; the last-word edge fades as rounds are added." : ""));
    });
}

// ---------- Unequal patience ----------

function patience(): HTMLElement {
  return sliderPanel(
    [
      { key: "a", label: (v) => `Player 1 patience δ₁: ${(v / 100).toFixed(2)}`, min: 0, max: 99, value: 90, aria: "Player 1 discount factor" },
      { key: "b", label: (v) => `Player 2 patience δ₂: ${(v / 100).toFixed(2)}`, min: 0, max: 99, value: 60, aria: "Player 2 discount factor" },
    ],
    ({ a, b }, out) => {
      const x = rubinstein(a / 100, b / 100);
      out.append(
        bars([{ label: "Player 1 (proposes)", value: x, text: pct(x, 1), cls: "p0", win: x >= 0.5 }, { label: "Player 2", value: 1 - x, text: pct(1 - x, 1), cls: "p1", win: x < 0.5 }], 1),
        h("p", { class: "legend" }, `x* = (1 − δ₂)/(1 − δ₁δ₂) = ${num(x, 3)}. ${a === b ? "Equal patience: the only edge is moving first, and it vanishes as δ → 1." : a > b ? "Player 1 is more patient and takes more." : "Player 2's patience outweighs the first-mover edge."}`));
    });
}

// ---------- Outside options ----------

function outside(): HTMLElement {
  return sliderPanel(
    [
      { key: "d1", label: (v) => `Your walk-away payoff: $${v}k`, min: 0, max: 100, step: 5, value: 20, aria: "Your outside option" },
      { key: "d2", label: (v) => `Their walk-away payoff: $${v}k`, min: 0, max: 100, step: 5, value: 40, aria: "Their outside option" },
    ],
    ({ d1, d2 }, out) => {
      const S = 120;
      const r = nashSplit(S, d1, d2);
      out.append(
        r ? bars([{ label: "You", value: r[0], text: `$${num(r[0], 1)}k`, cls: "p0" }, { label: "Them", value: r[1], text: `$${num(r[1], 1)}k`, cls: "p1" }], S) : "",
        h("p", { class: `feedback ${r ? "good" : "bad"}` },
          r ? `A deal creates $${S}k. After each side's fallback ($${d1}k + $${d2}k), $${S - d1 - d2}k of surplus is split evenly.`
            : `The fallbacks add up to more than the $${S}k a deal creates. There's no deal worth doing: walk away.`));
    });
}
