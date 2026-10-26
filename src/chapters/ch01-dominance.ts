import {
  NormalFormGame, cloneWithPayoff, findDominated, library, makeGame,
  paretoOptimal, pureNash, allAlive, Alive,
} from "../engine";
import { clear, depth, h } from "../ui/dom";
import { matrixKey, payoffMatrix } from "../ui/matrix";

const { prisonersDilemma, eliminationPuzzle, advertisingWar } = library;

export function renderCh01(root: HTMLElement) {
  root.append(
    h("p", { class: "lede" },
      "Two suspects are arrested and held in separate rooms. The police offer each the same deal. ",
      "Each would be better off if both kept quiet, and yet both will almost certainly talk. ",
      "This chapter shows why, using the first and simplest idea in game theory: dominance."),

    h("h2", null, "Make your choice"),
    h("p", null,
      "You and your partner can each stay silent or confess. If you both stay silent, you each get a year on a minor charge. ",
      "If you both confess, five years each. If one confesses and the other stays silent, the confessor walks free and the silent one gets ten."),
    playRound(),

    h("h2", null, "Whatever they do, confess"),
    h("p", null,
      "Look at it one column at a time. If your partner stays silent, confessing gets you 0 years instead of 1. ",
      "If your partner confesses, confessing gets you 5 years instead of 10. Either way, confessing is better."),
    h("p", null,
      "When one strategy beats another against everything the other player might do, game theorists say it ",
      h("em", null, "strictly dominates"), " it. A rational player never plays a dominated strategy, so you don't need to guess what your partner will do at all."),
    matrixKey(prisonersDilemma),
    payoffMatrix(prisonersDilemma, { showBestResponses: true, caption: "Underlined payoffs are each player's best reply to the other's choice. Payoffs are minus years in prison." }),
    h("p", null,
      "Your partner faces exactly the same table, so they confess too. Both of you get five years, even though staying silent together would have cost only one. ",
      "Each player's individually sensible choice adds up to a collectively bad outcome. That gap is the dilemma."),

    depth("formal",
      h("p", null,
        "Write ", h("i", null, "u"), h("sub", null, "i"), "(", h("i", null, "s"), h("sub", null, "i"), ", ", h("i", null, "s"), h("sub", null, "−i"), ") for player ", h("i", null, "i"),
        "'s payoff when they play ", h("i", null, "s"), h("sub", null, "i"), " and everyone else plays ", h("i", null, "s"), h("sub", null, "−i"), "."),
      h("p", null,
        "Strategy ", h("i", null, "a"), " strictly dominates ", h("i", null, "b"), " for player ", h("i", null, "i"), " if ",
        h("span", { class: "math" }, "u", h("sub", null, "i"), "(a, s", h("sub", null, "−i"), ") > u", h("sub", null, "i"), "(b, s", h("sub", null, "−i"), ") for every s", h("sub", null, "−i"), "."),
        " If one strategy strictly dominates every other, it is a ", h("em", null, "dominant strategy"), ", and a profile where every player uses one is a dominant-strategy equilibrium."),
      h("p", null,
        "The outcome (Confess, Confess) is not ", h("em", null, "Pareto optimal"),
        ": switching both players to (Silent, Silent) makes both strictly better off. The Prisoner's Dilemma is the standard example of an equilibrium that is not Pareto optimal.")),

    h("h2", null, "Strike them out"),
    h("p", null,
      "Most games don't have a dominant strategy. You can often still solve them by repeatedly crossing out dominated strategies: ",
      "once a strategy is gone, the other player can stop worrying about it, which may make one of ",
      h("em", null, "their"), " strategies dominated in turn."),
    h("p", null, "Click a strategy you think is dominated. Use ", h("strong", null, "Show next step"), " if you get stuck."),
    eliminationStepper(eliminationPuzzle),

    depth("formal",
      h("p", null,
        "This procedure is ", h("em", null, "iterated elimination of strictly dominated strategies"),
        " (IEDS). It assumes more than rationality: Column must know Row is rational, Row must know that Column knows, and so on. ",
        "Each extra round of elimination needs one more level of this ", h("em", null, "common knowledge of rationality"), "."),
      h("p", null,
        "For strict dominance, the order in which you remove strategies does not change what survives. ",
        "With weak dominance (better somewhere, never worse) it can, so the engine on this site uses strict dominance unless a chapter says otherwise.")),

    h("h2", null, "Break the dilemma"),
    h("p", null,
      "The dilemma comes from the numbers, not the story. Edit any payoff below and the solver re-checks the game. ",
      "Can you change one number so that self-interest leads both players to stay silent?"),
    dilemmaEditor(),

    h("h2", null, "Where it shows up"),
    h("p", null,
      "Swap prisoners for firms and you get an advertising war. Each firm earns more by advertising whatever its rival does, ",
      "so both spend heavily and end up with lower profits than if neither had advertised."),
    payoffMatrix(advertisingWar, { showBestResponses: true, showNash: true, caption: "Profits in $bn. The ringed cell is the equilibrium." }),
    h("p", null,
      "The same structure appears in arms races, overfishing, price wars and cartels. ",
      "OPEC members agree to cut output, then each has an incentive to pump more than its quota. ",
      "Chapter 6 shows how repetition, the fact that firms and countries meet again next year, can rescue cooperation."),

    depth("quant", h("p", null,
      "Interviewers like dominance because it is fast to check. Train the scan below until a 3×3 takes you under five seconds."),
      dominanceDrill()),

    h("aside", { class: "tip" },
      h("strong", null, "Shorthand to remember: "),
      "a dominant row wins every column. Scan column by column; one loss anywhere means it is not dominant."),
  );
}

// ---------- Interactive: play one round ----------

function playRound(): HTMLElement {
  const g = prisonersDilemma;
  const box = h("div", { class: "interactive" });
  const years = (v: number) => (v === 0 ? "go free" : `get ${-v} year${v === -1 ? "" : "s"}`);

  const show = (mine: number | null) => {
    clear(box);
    if (mine === null) {
      box.append(
        h("p", { class: "prompt" }, "Your partner is deciding in the next room. What do you do?"),
        h("div", { class: "choices" },
          g.strategies[0].map((label, i) => h("button", { class: "btn btn-p0", type: "button", onclick: () => show(i) }, label))));
      return;
    }
    // The partner confesses 70% of the time: most people do.
    const theirs = Math.random() < 0.7 ? 1 : 0;
    const [u] = g.payoffs[mine][theirs];
    const alt = 1 - mine;
    const lines = [0, 1].map((p) => {
      const a = g.payoffs[mine][p][0].valueOf();
      const b = g.payoffs[alt][p][0].valueOf();
      return h("li", null,
        `If your partner chose ${g.strategies[1][p].toLowerCase()}: you'd ${years(a)} by choosing ${g.strategies[0][mine].toLowerCase()}, `,
        `or ${years(b)} by choosing ${g.strategies[0][alt].toLowerCase()}.`);
    });
    box.append(
      h("p", { class: "result" },
        `You chose ${g.strategies[0][mine].toLowerCase()}. Your partner chose ${g.strategies[1][theirs].toLowerCase()}. You ${years(u.valueOf())}.`),
      payoffMatrix(g, { highlight: [[mine, theirs]] }),
      h("ul", { class: "compare" }, lines),
      h("p", null, mine === 1
        ? "Notice that confessing was the better choice in both cases, so you didn't need to know what your partner would do."
        : "Look at both lines: in each case, confessing would have been better for you. That holds whatever your partner does."),
      h("button", { class: "btn btn-quiet", type: "button", onclick: () => show(null) }, "Play again"));
  };
  show(null);
  return box;
}

// ---------- Interactive: iterated elimination stepper ----------

function eliminationStepper(g: NormalFormGame): HTMLElement {
  const box = h("div", { class: "interactive" });
  let alive: Alive = allAlive(g);
  let message: HTMLElement | null = null;
  const name = (p: 0 | 1, i: number) => g.strategies[p][i];

  const remove = (p: 0 | 1, i: number) => { alive = [alive[0].slice(), alive[1].slice()]; alive[p] = alive[p].filter((s) => s !== i); };

  const render = () => {
    clear(box);
    const remaining = [...findDominated(g, 0, alive), ...findDominated(g, 1, alive)];
    const solved = remaining.length === 0;
    const single = alive[0].length === 1 && alive[1].length === 1;
    box.append(
      payoffMatrix(g, {
        alive,
        showNash: solved,
        onStrategy: solved ? undefined : (p, i) => {
          const dom = findDominated(g, p, alive).find((d) => d.dominated === i);
          if (dom) {
            remove(p, i);
            message = h("p", { class: "feedback good" }, `Correct. For ${g.players[p]}, ${name(p, dom.by)} beats ${name(p, i)} against every remaining choice, so ${name(p, i)} goes.`);
          } else {
            message = h("p", { class: "feedback bad" }, `${name(p, i)} isn't dominated yet. Compare it column by column with each other ${g.players[p]} strategy: some remaining choice still makes it at least as good.`);
          }
          render();
        },
      }),
      solved
        ? h("p", { class: "feedback done" }, single
            ? `Solved. Only (${name(0, alive[0][0])}, ${name(1, alive[1][0])}) survives, and it is the game's unique Nash equilibrium.`
            : "Nothing else is dominated. Elimination can't finish this game on its own; Chapter 2 takes over from here.")
        : message ?? "",
      h("div", { class: "controls" },
        solved ? null : h("button", {
          class: "btn btn-quiet", type: "button",
          onclick: () => {
            const d = remaining[0];
            remove(d.player, d.dominated);
            message = h("p", { class: "feedback" }, `For ${g.players[d.player]}, ${name(d.player, d.by)} beats ${name(d.player, d.dominated)} against every remaining choice, so ${name(d.player, d.dominated)} goes.`);
            render();
          },
        }, "Show next step"),
        h("button", { class: "btn btn-quiet", type: "button", onclick: () => { alive = allAlive(g); message = null; render(); } }, "Reset")),
    );
  };
  render();
  return box;
}

// ---------- Interactive: edit the Prisoner's Dilemma ----------

function dilemmaEditor(): HTMLElement {
  let g = prisonersDilemma;
  const box = h("div", { class: "interactive" });

  const verdict = (): HTMLElement => {
    const nash = pureNash(g);
    const pareto = paretoOptimal(g);
    const name = ([r, c]: [number, number]) => `(${g.strategies[0][r]}, ${g.strategies[1][c]})`;
    if (nash.length === 0) return h("p", { class: "feedback" }, "No pure-strategy equilibrium at all. Chapter 3 shows what players do then: randomise.");
    if (nash.length > 1) return h("p", { class: "feedback" }, `Now there are ${nash.length} equilibria: ${nash.map(name).join(" and ")}. That is a coordination problem, the subject of Chapter 2.`);
    const [eq] = nash;
    const efficient = pareto.some(([r, c]) => r === eq[0] && c === eq[1]);
    return efficient
      ? h("p", { class: "feedback good" }, `Dilemma broken. The equilibrium is ${name(eq)}, and no other outcome makes both players better off.`)
      : h("p", { class: "feedback bad" }, `Still a dilemma. The equilibrium is ${name(eq)}, but another outcome would make both players better off.`);
  };

  const render = () => {
    clear(box);
    box.append(
      payoffMatrix(g, {
        editable: true, showBestResponses: true, showNash: true,
        onEdit: (r, c, who, v) => { g = cloneWithPayoff(g, r, c, who, v); render(); },
        caption: "Click a number to edit it. Underlines and the ring update as you type.",
      }),
      verdict(),
      h("div", { class: "controls" },
        h("button", { class: "btn btn-quiet", type: "button", onclick: () => { g = prisonersDilemma; render(); } }, "Reset payoffs")));
  };
  render();
  return box;
}

// ---------- Quant drill: spot the dominant strategy ----------

function randomGame(): NormalFormGame {
  const rnd = () => Math.floor(Math.random() * 10);
  const payoffs: [number, number][][] = [0, 1, 2].map(() => [0, 1, 2].map(() => [rnd(), rnd()] as [number, number]));
  if (Math.random() < 0.55) {
    // Plant a dominant row.
    const d = Math.floor(Math.random() * 3);
    for (let c = 0; c < 3; c++) {
      const best = Math.max(...[0, 1, 2].filter((r) => r !== d).map((r) => payoffs[r][c][0]));
      payoffs[d][c][0] = Math.min(best + 1 + Math.floor(Math.random() * 2), 11);
    }
  }
  return makeGame({ id: "drill", title: "Drill", rows: ["A", "B", "C"], cols: ["X", "Y", "Z"], payoffs });
}

function dominantRow(g: NormalFormGame): number | null {
  const alive = allAlive(g);
  const dominated = new Set(findDominated(g, 0, alive).map((d) => d.dominated));
  if (dominated.size !== 2) return null;
  return [0, 1, 2].find((r) => !dominated.has(r)) ?? null;
}

function dominanceDrill(): HTMLElement {
  const box = h("div", { class: "interactive drill" });
  let streak = 0;
  let best = 0;
  let times: number[] = [];

  const next = (feedback?: HTMLElement) => {
    const g = randomGame();
    const answer = dominantRow(g);
    const start = performance.now();
    clear(box);
    const pick = (choice: number | null) => {
      const ms = performance.now() - start;
      const right = choice === answer;
      if (right) { streak++; best = Math.max(best, streak); times = [...times, ms].slice(-10); } else streak = 0;
      const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length / 1000 : 0;
      next(h("p", { class: `feedback ${right ? "good" : "bad"}` },
        right ? `Correct in ${(ms / 1000).toFixed(1)}s.` : `Not quite: ${answer === null ? "no row was dominant" : `${g.strategies[0][answer]} was dominant`}.`,
        ` Streak ${streak}, best ${best}${avg ? `, average ${avg.toFixed(1)}s` : ""}.`));
    };
    box.append(
      h("p", { class: "prompt" }, "Does Row have a strictly dominant strategy?"),
      payoffMatrix(g),
      h("div", { class: "choices" },
        g.strategies[0].map((label, i) => h("button", { class: "btn btn-p0", type: "button", onclick: () => pick(i) }, label)),
        h("button", { class: "btn btn-quiet", type: "button", onclick: () => pick(null) }, "None")),
      feedback ?? "");
  };
  next();
  return box;
}
