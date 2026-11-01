import { GameTree, TreeNode, backwardInduction, commitment, library } from "../engine";
import { depth, h } from "../ui/dom";
import { gameTree } from "../ui/tree";
import { bars, drill, lineChart, num, randInt, shuffleOptions, sliderPanel, stepper, tip } from "../ui/widgets";
import { treeFolder } from "./ch04-sequential";

const { wheelTree, capacityTree } = library;
const { bestReplyQty, cournot, stackelberg, leaderProfit, monopoly, profit, price } = commitment;
const M = { a: 120, c: 0 };

export function renderCh05(root: HTMLElement) {
  const cn = cournot(M), st = stackelberg(M), mo = monopoly(M);
  root.append(
    h("p", { class: "lede" },
      "Chapter 4 ended with an empty threat: the incumbent promised a price war it would never fight. ",
      "This chapter is about making promises and threats that people believe. The surprising tool is giving up your own options."),

    h("h2", null, "Be the leader"),
    h("p", null,
      "Two firms sell the same product. The more they produce in total, the lower the price: price = 120 − total output, and production is free. ",
      "You move first and commit to an output the rival can see. The rival then picks its own best output. How much should you make?"),
    leaderGame(),
    h("p", null,
      `The best commitment is ${st.q1}. The rival replies with ${st.q2}, and you earn ${st.profit1} against its ${st.profit2}. `,
      `If you had moved at the same time, each firm would make ${cn.q1} and earn ${cn.profit1}. Moving first and producing a lot, visibly, forces the rival to shrink.`),
    bars([
      { label: "Leader (you)", value: st.profit1, cls: "p0", win: true },
      { label: "Simultaneous", value: cn.profit1, cls: "" },
      { label: "Follower", value: st.profit2, cls: "p1" },
    ], mo.profit),
    h("p", { class: "legend" }, `Profits per firm. A single monopolist would earn ${mo.profit}.`),

    h("h2", null, "Throw away the steering wheel"),
    h("p", null,
      "Back to Chicken from Chapter 2. Driver 1 has an extra option before the cars start: rip out the steering wheel and throw it out of the window where Driver 2 can see. ",
      "Now Driver 1 physically can't swerve. Fold the tree back and see who blinks."),
    treeFolder([{ tree: wheelTree, note: "Without the wheel, Driver 1 can't swerve, so Driver 2's only sensible reply is to swerve. Keeping the wheel lets Driver 2 commit first and win instead. Losing an option won the game." }]),
    h("p", null,
      "Thomas Schelling called this ", h("em", null, "the power to bind oneself"), ". A commitment works because it changes your own future incentives, and so it changes what your opponent expects. ",
      "It only works if it is visible and can't be undone: a wheel hidden in the glovebox does nothing."),

    h("h2", null, "Spending money to look tough"),
    h("p", null,
      "Commitment doesn't need anything dramatic. In Chapter 4's entry game, the incumbent's threat to fight was empty because a price war hurt it. ",
      "Suppose it can first build spare capacity. With capacity already built, flooding the market is cheap, so fighting pays. Slide the cost of building and see when it's worth it."),
    capacityPanel(),

    depth("formal",
      h("p", null,
        "A ", h("em", null, "commitment"), " is a first move that removes or changes your own later options. It has value only in a sequential game where it is observed before the opponent moves: ",
        "the opponent's best response is then computed against the committed action, which lets the first mover pick its favourite point on the opponent's best-response curve."),
      h("p", null,
        "In the quantity game with demand ", h("span", { class: "math" }, "P = a − Q"), " and cost ", h("span", { class: "math" }, "c"), ", the follower's best response is ",
        h("span", { class: "math" }, "q₂ = (a − c − q₁)/2"), ". Substituting into the leader's profit gives ",
        h("span", { class: "math" }, "π₁ = q₁(a − c − q₁)/2"), ", maximised at ", h("span", { class: "math" }, "q₁ = (a − c)/2"), ". Simultaneous (Cournot) play gives each firm ", h("span", { class: "math" }, "(a − c)/3"), "."),
      h("p", null, "A first-mover advantage isn't universal. In Matching Pennies, moving first visibly is a disaster. Commitment helps when you want to influence the other player's choice, not hide yours.")),

    h("h2", null, "Derive the leader's output"),
    stepper([
      ["The follower reacts", "Given your output q₁, the follower maximises (120 − q₁ − q₂)q₂. Setting the derivative to zero: q₂ = (120 − q₁)/2."],
      ["Plug in", "Your profit is q₁(120 − q₁ − q₂) = q₁(120 − q₁)/2. You've folded the follower's reaction into your own payoff, exactly as in backward induction."],
      ["Maximise", "Derivative: (120 − 2q₁)/2 = 0, so q₁ = 60. Then q₂ = 30, price = 30, profits 1800 and 900."],
      ["Compare", `Simultaneous play: each makes 40, price 40, profit 1600. Total output rises from 80 to 90, so consumers gain too: the price falls from 40 to 30.`],
    ]),

    h("h2", null, "Commitment in the wild"),
    h("ul", { class: "compare" },
      h("li", null, h("strong", null, "Price-matching promises. "), "A shop that guarantees to match any rival's price commits to retaliate instantly, which removes the rival's reason to undercut. It can keep prices high, not low."),
      h("li", null, h("strong", null, "Independent central banks. "), "Politicians tempted to inflate before an election hand control to a bank that can't be leaned on. Giving up the option makes low-inflation promises believable."),
      h("li", null, h("strong", null, "Burning boats. "), "Generals from Xiang Yu to Cortés are said to have destroyed their own ships or supplies so retreat was impossible, making a fight to the end credible to both their own troops and the enemy."),
      h("li", null, h("strong", null, "Public pledges. "), "Announcing a target publicly raises the cost of backing down, which is why negotiators sometimes go public early.")),

    depth("quant",
      h("p", null, "Linear-demand duopoly questions come up a lot. Demand P = a − Q, marginal cost c. Find the leader's output."),
      drill(() => {
        const c = randInt(0, 6) * 2, a = c + randInt(3, 12) * 12;
        const g = a - c;
        const correct = num(g / 2);
        const { options, answer } = shuffleOptions(correct, [num(g / 3), num(g / 4), num((2 * g) / 3), num(g)]);
        return {
          prompt: `P = ${a} − Q, marginal cost ${c}. Leader's output?`,
          options, answer,
          explain: `Leader (a − c)/2 = ${g}/2 = ${num(g / 2)}. Follower (a − c)/4 = ${num(g / 4)}. Simultaneous play would give each (a − c)/3 = ${num(g / 3)}.`,
        };
      })),

    tip("a commitment counts only if it's visible and irreversible. Leader (a − c)/2, follower (a − c)/4, simultaneous (a − c)/3 each."),
  );
}

// ---------- Interactive: Stackelberg leader ----------

function leaderGame(): HTMLElement {
  const cn = cournot(M);
  const curve: [number, number][] = [];
  for (let q = 0; q <= 120; q += 2) curve.push([q, leaderProfit(M, q)]);
  return sliderPanel(
    [{ key: "q", label: (v) => `Your output: ${v}`, min: 0, max: 120, step: 5, value: 20, aria: "Your output" }],
    ({ q }, out) => {
      const f = bestReplyQty(M, q);
      const p = price(M, q, f);
      const mine = profit(M, q, f), theirs = profit(M, f, q);
      out.append(
        lineChart({
          series: [{ colour: "var(--row)", points: curve, name: "Your profit" }],
          x: [0, 120], y: [0, 2000], vline: q, hline: cn.profit1,
          dots: [{ x: q, y: mine, colour: "var(--row)" }],
          xLabel: "Your output (rival replies optimally)", aria: "Your profit as a function of your committed output",
        }),
        h("ul", { class: "compare" },
          h("li", null, `Rival's best reply: produce `, h("strong", null, num(f, 1)), `. Price ${num(p, 1)}.`),
          h("li", null, h("span", { class: "chip-p0" }, `Your profit ${num(mine, 0)}`), " · ", h("span", { class: "chip-p1" }, `Rival's ${num(theirs, 0)}`)),
        ),
        h("p", { class: `feedback ${q === 60 ? "done" : mine > cn.profit1 ? "good" : ""}` },
          q === 60 ? "That's the peak: commit to 60 and earn 1800."
            : mine > cn.profit1 ? `You're beating the ${cn.profit1} you'd earn moving at the same time (dashed line). Can you do better?`
              : `Below the dashed line: you'd earn ${cn.profit1} just by moving at the same time.`));
    });
}

// ---------- Interactive: capacity as commitment ----------

function shiftBuild(t: GameTree, cost: number): GameTree {
  // capacityTree bakes in a cost of 1 (Out 3, Fight 2, Share 1); re-price it at `cost`.
  const walk = (n: TreeNode, under: boolean): TreeNode => {
    if (n.kind === "leaf") return under ? { ...n, payoffs: [n.payoffs[0] + 1 - cost, n.payoffs[1]] } : n;
    return { ...n, moves: n.moves.map((m) => ({ ...m, child: walk(m.child, under || m.action === "Build") })) };
  };
  return { ...t, root: walk(t.root, false) };
}

function capacityPanel(): HTMLElement {
  return sliderPanel(
    [{ key: "k", label: (v) => `Cost of building spare capacity: ${v}`, min: 0, max: 4, step: 0.5, value: 1, aria: "Cost of building capacity" }],
    ({ k }, out) => {
      const tree = shiftBuild(capacityTree, k);
      const sol = backwardInduction(tree);
      const builds = sol.choice["cap"] === 0;
      out.append(
        gameTree(tree, { solution: sol }),
        h("p", { class: `feedback ${builds ? "good" : "bad"}` },
          builds
            ? `Worth it. After building, fighting (${num(3 - k, 1)}) beats sharing (${num(2 - k, 1)}), so the entrant stays out and the incumbent keeps ${num(4 - k, 1)}${k === 2 ? ", exactly what waiting gets: a tie, broken by the first listed move" : ""}.`
            : `Too expensive. Keeping the market alone would leave ${num(4 - k, 1)}, less than the 2 from waiting and sharing. Waiting wins, and the entrant comes in.`),
        h("p", { class: "legend" }, "The capacity is never used: the entrant stays out, so there's no fight. Its whole value is the change it makes to the incumbent's own incentives."));
    });
}
