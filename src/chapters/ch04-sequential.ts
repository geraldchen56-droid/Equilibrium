import {
  GameTree, Leaf, backwardInduction, library, pirateGame, pureNash, raceBestStep, raceSafeTotals, toNormalForm, withLeafPayoff,
} from "../engine";
import { clear, depth, h } from "../ui/dom";
import { payoffMatrix } from "../ui/matrix";
import { gameTree } from "../ui/tree";

const { entryTree, leaderTree, centipedeTree } = library;

export function renderCh04(root: HTMLElement) {
  const nf = toNormalForm(entryTree).game;
  root.append(
    h("p", { class: "lede" },
      "So far both players moved at once. In most of life someone moves first: a firm enters a market, a buyer makes an offer, a country sets a tariff. ",
      "When you can see what came before, the trick is to start at the end."),

    h("h2", null, "Race to 21"),
    h("p", null,
      "Take turns adding 1, 2 or 3 to a running total. Whoever says 21 wins. The computer plays perfectly whenever it can. ",
      "Play a few rounds and try to work out its secret."),
    race(),
    h("p", null,
      "To say 21, you want to say 17: from there your opponent must land on 18, 19 or 20, and you finish. To say 17, say 13; to say 13, say 9. ",
      "Working back by fours, the winning totals are 1, 5, 9, 13, 17, 21. Go first and say 1, and you can't lose. ",
      "You didn't solve this by thinking forward through every possible game. You solved it from the end."),

    h("h2", null, "Look forward, reason backward"),
    h("p", null,
      "A ", h("em", null, "game tree"), " draws a sequential game: each circle is a decision, each branch a move, each leaf a final payoff. ",
      h("em", null, "Backward induction"), " solves it. Take a decision whose branches all end in leaves, pick what that player prefers, replace the decision by the payoff it leads to, and repeat until you reach the top."),
    treeFolder(),

    h("h2", null, "Empty threats"),
    h("p", null,
      "In the market-entry tree, the incumbent would love to scare the entrant off by promising a price war. Write the same game as a matrix and Chapter 2's method finds two equilibria."),
    payoffMatrix(nf, { arrows: true, showNash: true, caption: "The incumbent's strategy is what it would do if the entrant came in." }),
    h("p", null,
      "In (Out, Fight), the entrant stays out because it believes the incumbent will fight. That belief is never tested, so fighting costs the incumbent nothing on paper. ",
      "But if the entrant did come in, fighting would pay the incumbent −1 instead of 2. The threat is ", h("em", null, "not credible"), ". ",
      "Backward induction throws this equilibrium out, because it insists every player is rational at every node, including ones that are never reached."),
    h("p", null, "So what would make a threat credible? Change what fighting is worth to the incumbent."),
    credibility(),

    depth("formal",
      h("p", null,
        "A ", h("em", null, "strategy"), " in a sequential game is a complete plan: an action at every decision node the player owns, even nodes the plan itself never reaches. ",
        "That's why the incumbent above has a strategy even when the entrant stays out, and why a follower with ", h("span", { class: "math" }, "k"), " decision nodes of ", h("span", { class: "math" }, "m"), " moves each has ",
        h("span", { class: "math" }, "m", h("sup", null, "k")), " strategies. The capacity-race follower has 2² = 4."),
      h("p", null,
        "A ", h("em", null, "subgame"), " is the game from any decision node down. A profile is a ", h("em", null, "subgame-perfect equilibrium"), " (Selten, 1965) if it is a Nash equilibrium in every subgame. ",
        "In finite games of perfect information, backward induction finds one (Zermelo's and Kuhn's theorems); with no ties, it is unique. Every subgame-perfect equilibrium is a Nash equilibrium, but not the other way round: (Out, Fight) is Nash, not subgame perfect.")),

    h("h2", null, "The trouble with the centipede"),
    h("p", null,
      "Open the centipede tab in the tree above and fold it back. Each pass doubles the pie, and passing to the end gives both players more than taking at the start. ",
      "Yet backward induction says Ava takes immediately: Ben would take at the last node, so Ava takes at the one before, and so on all the way back. ",
      "In lab experiments most people pass at least once and do better than the theory. Rationality at every step needs everyone to be sure everyone else is rational, all the way down. Chapter 6 shows how repetition and reputation let cooperation survive."),

    depth("quant",
      h("p", null,
        "Two interview classics, both pure backward induction. First, the pirates: five pirates of strict seniority split 100 gold coins. ",
        "The most senior proposes a split; if at least half vote yes (proposer included) it passes, otherwise the proposer walks the plank and the next proposes. ",
        "Pirates want to live, then want gold, and vote no when they don't care either way. What does the senior pirate propose?"),
      pirates(),
      h("p", null, "Second, speed: in a race to N adding 1 to k, what should you say first?"),
      raceDrill()),

    h("aside", { class: "tip" },
      h("strong", null, "Shorthand to remember: "),
      "start at the last move and work up. Race to N adding 1–k: say the numbers that leave N mod (k + 1)."),
  );
}

// ---------- Interactive: Race to 21 against perfect play ----------

function race(): HTMLElement {
  const TARGET = 21, K = 3;
  const box = h("div", { class: "interactive" });
  let total = 0;
  let log: { who: "you" | "cpu"; add: number; total: number }[] = [];
  let started = false;
  let record = { you: 0, cpu: 0 };

  const cpuMove = () => {
    const best = raceBestStep(total, TARGET, K);
    const add = best ?? Math.min(TARGET - total, 1 + Math.floor(Math.random() * K));
    total += add;
    log.push({ who: "cpu", add, total });
    if (total === TARGET) record.cpu++;
  };

  const start = (youFirst: boolean) => {
    total = 0; log = []; started = true;
    if (!youFirst) cpuMove();
    render();
  };

  const play = (add: number) => {
    total += add;
    log.push({ who: "you", add, total });
    if (total === TARGET) record.you++; else cpuMove();
    render();
  };

  const render = () => {
    clear(box);
    const over = total === TARGET;
    const winner = over ? log[log.length - 1].who : null;
    const safe = raceSafeTotals(TARGET, K);
    box.append(
      h("div", { class: "scoreboard" },
        h("span", null, "Total ", h("strong", { class: "big" }, String(total))),
        h("span", null, "You ", h("strong", null, String(record.you))),
        h("span", null, "Computer ", h("strong", null, String(record.cpu)))),
      log.length ? h("p", { class: "race-log" }, log.map((m) => h("span", { class: `said ${m.who}` }, `${m.who === "you" ? "You" : "CPU"} +${m.add} → ${m.total}`))) : "",
      !started ? h("p", { class: "prompt" }, "Who goes first?")
        : over ? h("p", { class: `feedback ${winner === "you" ? "good" : "bad"}` },
          winner === "you" ? "You said 21. You win!" : `The computer said 21. ${record.cpu >= 2 ? "Look at the totals it says: " + safe.join(", ") + "." : "Try again."}`)
          : h("p", { class: "prompt" }, "Your move: add 1, 2 or 3."),
      h("div", { class: "controls" },
        started && !over
          ? [1, 2, 3].filter((k) => total + k <= TARGET).map((k) => h("button", { class: "btn btn-p0", type: "button", onclick: () => play(k) }, `+${k}`))
          : [h("button", { class: "btn btn-p0", type: "button", onclick: () => start(true) }, "I'll go first"),
            h("button", { class: "btn btn-quiet", type: "button", onclick: () => start(false) }, "Computer first")]),
    );
  };
  render();
  return box;
}

// ---------- Interactive: fold a tree back step by step ----------

const CH4_TREES: { tree: GameTree; note: string }[] = [
  { tree: entryTree, note: "If the entrant comes in, the incumbent prefers sharing (2) to a price war (−1). Knowing that, the entrant compares 0 for staying out with 1 for entering, and enters." },
  { tree: leaderTree, note: "Played simultaneously, this game has two equilibria, one favouring each firm. Moving first lets the leader pick: build big, and the follower's best reply is to stay small. That's a first-mover advantage." },
  { tree: centipedeTree, note: "Every player takes at the first chance they get, so the game ends at once with (2, 0), even though passing to the end would give both of them more." },
];

export function treeFolder(trees: { tree: GameTree; note: string }[] = CH4_TREES): HTMLElement {
  const TREES = trees;
  const box = h("div", { class: "interactive" });
  let idx = 0;
  let k = 0;
  const render = () => {
    clear(box);
    const { tree, note } = TREES[idx];
    const sol = backwardInduction(tree);
    const done = k >= sol.steps.length;
    const st = sol.steps[k - 1];
    const say = st
      ? (() => {
        const n = st.node;
        const who = tree.players[n.player];
        const opts = n.moves.map((m, i) => `${m.action} gives ${st.options[i]}`).join(", ");
        return `${who}: ${opts}. ${who} picks ${n.moves[st.choice].action}, so this node is worth (${st.value.join(", ")}).`;
      })()
      : "Each circle is a decision; its letter says whose. Start with a decision whose branches all end in payoffs.";
    box.append(
      TREES.length < 2 ? "" : h("div", { class: "tabs", role: "group", "aria-label": "Choose a tree" },
        TREES.map((t, i) => h("button", { type: "button", "aria-pressed": String(i === idx), onclick: () => { idx = i; k = 0; render(); } }, t.tree.title))),
      gameTree(tree, { solution: sol, folded: k }),
      h("p", { class: `feedback ${done ? "done" : st ? "good" : ""}` }, say, done ? h("span", null, " ", h("br"), h("strong", null, `Equilibrium path: `), pathText(tree, sol.path), `. ${note}`) : ""),
      h("div", { class: "controls" },
        !done ? h("button", { class: "btn btn-p0", type: "button", onclick: () => { k++; render(); } }, k ? "Fold the next node" : "Fold the first node") : "",
        !done ? h("button", { class: "btn btn-quiet", type: "button", onclick: () => { k = sol.steps.length; render(); } }, "Show the answer") : "",
        k ? h("button", { class: "btn btn-quiet", type: "button", onclick: () => { k = 0; render(); } }, "Reset") : ""),
    );
  };
  render();
  return box;
}

function pathText(t: GameTree, path: string[]): string {
  const out: string[] = [];
  let cur = t.root;
  for (const id of path.slice(1)) {
    if (cur.kind === "leaf") break;
    const m = cur.moves.find((mv) => mv.child.id === id)!;
    out.push(`${t.players[cur.player]} ${m.action}`);
    cur = m.child;
  }
  return out.join(" → ");
}

// ---------- Interactive: when is the threat credible? ----------

function credibility(): HTMLElement {
  const box = h("div", { class: "interactive" });
  const fightLeaf = (() => {
    const inc = (entryTree.root as any).moves[1].child;
    return inc.moves[0].child as Leaf;
  })();
  const label = h("span");
  const out = h("div");
  const input = h("input", { type: "range", min: -3, max: 6, value: fightLeaf.payoffs[1], "aria-label": "Incumbent's payoff from a price war", oninput: () => paint() }) as HTMLInputElement;
  const paint = () => {
    const v = Number(input.value);
    label.textContent = `Incumbent's payoff from a price war: ${v}`;
    const tree: GameTree = { ...entryTree, root: withLeafPayoff(entryTree.root, fightLeaf.id, 1, v) };
    const sol = backwardInduction(tree);
    const share = 2;
    const credible = v > share;
    const tie = v === share;
    const nash = pureNash(toNormalForm(tree).game);
    clear(out);
    out.append(
      gameTree(tree, { solution: sol }),
      h("p", { class: `feedback ${credible ? "good" : tie ? "" : "bad"}` },
        credible ? `Now fighting (${v}) beats sharing (${share}). The threat is credible, so the entrant stays out.`
          : tie ? `Fighting and sharing tie at ${share}. The incumbent is happy either way; the tree breaks the tie by the first listed move, so the threat is only just credible.`
            : `Fighting (${v}) is worse than sharing (${share}), so the threat is empty and the entrant comes in.`,
        ` Matrix form has ${nash.length} Nash equilibri${nash.length === 1 ? "um" : "a"}; backward induction keeps one.`),
      h("p", { class: "legend" }, "Real incumbents make fighting pay in advance: spare capacity that is cheap to switch on, a reputation to protect in other markets, or contracts that punish them for sharing. That's commitment, the subject of Chapter 5."));
  };
  box.append(h("label", { class: "range" }, label, input), out);
  paint();
  return box;
}

// ---------- Quant: the pirate game ----------

function pirates(): HTMLElement {
  const box = h("div", { class: "interactive" });
  let n = 5;
  let reveal = 1;
  const label = h("span");
  const out = h("div");
  const input = h("input", { type: "range", min: 2, max: 9, value: n, "aria-label": "Number of pirates", oninput: () => { n = Number(input.value); reveal = 1; paint(); } }) as HTMLInputElement;
  const paint = () => {
    label.textContent = `${n} pirates`;
    const rounds = pirateGame(n);
    clear(out);
    const rows = rounds.slice(0, reveal);
    out.append(
      h("p", { class: "legend" }, "Start with the last pirate alone, then add one pirate at a time. Each new proposer buys the cheapest votes: one coin more than a pirate would get next round."),
      h("div", { class: "table-scroll" },
        h("table", { class: "stats pirates" },
          h("tr", null, h("th", null, "Alive"), ...Array.from({ length: n }, (_, i) => h("th", null, `P${i + 1}`))),
          rows.map((r) => h("tr", null,
            h("td", null, `${r.pirates.length} (needs ${r.needed})`),
            ...Array.from({ length: n }, (_, i) => {
              const j = r.pirates.indexOf(i + 1);
              if (j < 0) return h("td", { class: "muted" }, "–");
              const cls = j === 0 ? "chip-p0" : r.bought.includes(i + 1) ? "chip-p1" : "";
              return h("td", { class: cls }, String(r.split[j]));
            }))))),
      reveal < rounds.length
        ? h("div", { class: "controls" },
          h("button", { class: "btn btn-p0", type: "button", onclick: () => { reveal++; paint(); } }, `Add pirate ${n - reveal}`),
          h("button", { class: "btn btn-quiet", type: "button", onclick: () => { reveal = rounds.length; paint(); } }, "Show all"))
        : h("p", { class: "feedback done" },
          `P1 proposes ${rounds[rounds.length - 1].split.join(", ")}. `,
          `The ${rounds[rounds.length - 1].bought.length} pirate${rounds[rounds.length - 1].bought.length === 1 ? "" : "s"} getting a coin would get nothing if P1 went overboard, so one coin buys each vote. Proposer in cobalt, bought votes in marigold.`),
    );
  };
  box.append(h("label", { class: "range" }, label, input), out);
  paint();
  return box;
}

// ---------- Quant drill: first move in a race to N ----------

function raceDrill(): HTMLElement {
  const box = h("div", { class: "interactive drill" });
  let streak = 0, best = 0;
  const ask = () => {
    const k = 2 + Math.floor(Math.random() * 4);
    let N = 15 + Math.floor(Math.random() * 30);
    if (N % (k + 1) === 0) N++;
    const right = N % (k + 1);
    const list = Array.from({ length: k }, (_, i) => i + 1);
    const t0 = performance.now();
    clear(box);
    box.append(
      h("p", { class: "prompt" }, `Race to ${N}, adding 1 to ${k} each turn. You go first. What do you say?`),
      h("div", { class: "choices" }, list.map((v) => h("button", { class: "btn btn-p0", type: "button", onclick: () => answer(v) }, String(v)))));
    const answer = (v: number) => {
      const secs = (performance.now() - t0) / 1000;
      const ok = v === right;
      if (ok) { streak++; best = Math.max(best, streak); } else streak = 0;
      clear(box);
      box.append(
        h("p", { class: `feedback ${ok ? "good" : "bad"}` },
          ok ? `Correct in ${secs.toFixed(1)}s. ` : `Say ${right}. `,
          `${N} = ${Math.floor(N / (k + 1))} × ${k + 1} + ${right}, so the winning totals are ${raceSafeTotals(N, k).slice(0, 4).join(", ")}, … , ${N}. Streak ${streak}, best ${best}.`),
        h("div", { class: "controls" }, h("button", { class: "btn btn-p0", type: "button", onclick: ask }, "Next")));
      (box.querySelector(".controls .btn") as HTMLButtonElement | null)?.focus({ preventScroll: true });
    };
  };
  ask();
  return box;
}
