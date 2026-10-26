import {
  NormalFormGame, Profile, bertrand, cloneWithPayoff, deviations,
  library, pureNash, randomIntGame,
} from "../engine";
import { clear, depth, h } from "../ui/dom";
import { matrixKey, payoffMatrix } from "../ui/matrix";

const { stagHunt, equilibriumHunt, drivingSide, battleOfSexes, chicken, matchingPennies } = library;

const same = (a: Profile, b: Profile) => a[0] === b[0] && a[1] === b[1];
const cellName = (g: NormalFormGame, [r, c]: Profile) => `(${g.strategies[0][r]}, ${g.strategies[1][c]})`;

export function renderCh02(root: HTMLElement) {
  root.append(
    h("p", { class: "lede" },
      "Dominance solved the Prisoner's Dilemma because confessing was best whatever the other player did. ",
      "Most games aren't that kind: what's best for you depends on what the other player does. ",
      "John Nash's idea handles all of them. Look for an outcome where nobody regrets their choice once they see what everyone else chose."),

    h("h2", null, "Would anyone switch?"),
    h("p", null,
      "Two hunters can each chase a stag or a hare. The stag is the bigger prize, but it takes both of them to catch it. ",
      "A hare can be caught alone. Pick an outcome and test it: given what the other hunter did, would either of them rather have done something else?"),
    matrixKey(stagHunt),
    switchTester(stagHunt),

    h("h2", null, "Nash's idea"),
    h("p", null,
      "An outcome where neither player wants to switch on their own is a ", h("em", null, "Nash equilibrium"), ". ",
      "Each player is making a best response to the other's choice, so the outcome holds once players reach it. Nobody has a reason to move first."),
    h("p", null,
      "The arrows below show every switch at once. In each cell, the cobalt arrow points to the row Row would rather be in, and the marigold arrow points to the column Column would rather be in. ",
      "An equilibrium is a cell with no arrows leaving it."),
    payoffMatrix(stagHunt, { arrows: true, showNash: true, caption: "Two cells have no arrows: (Stag, Stag) and (Hare, Hare). Both are equilibria." }),
    h("p", null,
      "Notice that an equilibrium doesn't have to be good. (Hare, Hare) is worse for both hunters than (Stag, Stag), yet once you're there, neither can do better by changing alone."),

    depth("formal",
      h("p", null,
        "A profile ", h("span", { class: "math" }, "s* = (s", h("sub", null, "1"), "*, s", h("sub", null, "2"), "*)"), " is a Nash equilibrium if, for every player ", h("i", null, "i"), " and every strategy ", h("i", null, "s"), h("sub", null, "i"), ","),
      h("p", { class: "display" },
        h("span", { class: "math" }, "u", h("sub", null, "i"), "(s", h("sub", null, "i"), "*, s", h("sub", null, "−i"), "*) ≥ u", h("sub", null, "i"), "(s", h("sub", null, "i"), ", s", h("sub", null, "−i"), "*)")),
      h("p", null,
        "Equivalently, each ", h("span", { class: "math" }, "s", h("sub", null, "i"), "*"), " is in ", h("span", { class: "math" }, "BR", h("sub", null, "i"), "(s", h("sub", null, "−i"), "*)"),
        ": every player is best-responding to the others. Three links back to Chapter 1: a dominant-strategy equilibrium is always a Nash equilibrium; ",
        "no Nash equilibrium uses a strictly dominated strategy, so elimination never removes one; and if elimination leaves a single profile, that profile is the unique equilibrium."),
      h("p", null,
        "Nash proved in 1950 that every finite game has at least one equilibrium, provided players may randomise. Matching Pennies, below, shows why randomising is needed; Chapter 3 covers it.")),

    h("h2", null, "Hunt the equilibria"),
    h("p", null,
      "Nothing in this game is dominated, so Chapter 1's elimination can't even start. Nash equilibrium still finds the answer. ",
      "Click every cell you think is an equilibrium, then check. The fastest method is the underline trick:"),
    h("ol", { class: "steps" },
      h("li", null, "For each column, underline Row's highest payoff (cobalt). That's Row's best response to that column."),
      h("li", null, "For each row, underline Column's highest payoff (marigold)."),
      h("li", null, "Any cell with both payoffs underlined is a Nash equilibrium.")),
    hunt(equilibriumHunt),

    h("h2", null, "Too many equilibria"),
    h("p", null,
      "Nash equilibrium tells you which outcomes are stable, but many games have more than one. Then the theory says what ", h("em", null, "can"), " happen, not what ", h("em", null, "will"), ". ",
      "Switch between the classic games below. Every payoff is editable, and the arrows update as you type."),
    gallery(),
    h("p", null,
      "When the maths can't pick an equilibrium, people use whatever stands out. Thomas Schelling asked people where they would meet a stranger in New York with no way to communicate. ",
      "A large share chose Grand Central Station at noon. Such ", h("em", null, "focal points"), " come from culture, history and habit rather than from payoffs, which is why driving on the left is enforced by law rather than left to chance."),

    h("h2", null, "Price wars"),
    h("p", null,
      "Two petrol stations face each other across a road. Each litre costs them $1, and they can charge $1 to $5. ",
      "Twelve drivers pass each hour and all go to the cheaper station; if prices match, they split evenly. ",
      "The engine builds the 5×5 game from those rules and solves it."),
    priceWar(),

    depth("quant",
      h("p", null, "Counting equilibria is a standard warm-up question. Use the underline trick and aim for under eight seconds on a 3×3."),
      countDrill()),

    h("aside", { class: "tip" },
      h("strong", null, "Shorthand to remember: "),
      "underline Row's best in each column, Column's best in each row. Double underline = Nash."),
  );
}

// ---------- Interactive: test one outcome ----------

function switchTester(g: NormalFormGame): HTMLElement {
  const box = h("div", { class: "interactive" });
  let picked: Profile | null = null;

  const render = () => {
    clear(box);
    box.append(
      h("p", { class: "prompt" }, picked ? "Try another cell." : "Click any cell to test it."),
      payoffMatrix(g, { onCell: (r, c) => { picked = [r, c]; render(); }, highlight: picked ? [picked] : [] }),
    );
    if (!picked) return;
    const [r, c] = picked;
    const d = deviations(g, r, c);
    const line = (p: 0 | 1) => {
      const to = p === 0 ? d.row : d.col;
      const now = g.payoffs[r][c][p];
      if (to === null) return h("li", { class: "stay" }, `${g.players[p]} stays: switching can't beat ${now}.`);
      const better = p === 0 ? g.payoffs[to][c][0] : g.payoffs[r][to][1];
      return h("li", { class: "move" }, `${g.players[p]} switches to ${g.strategies[p][to]}: ${better} beats ${now}.`);
    };
    const stable = d.row === null && d.col === null;
    box.append(
      h("ul", { class: "compare" }, line(0), line(1)),
      h("p", { class: `feedback ${stable ? "good" : "bad"}` }, stable
        ? `${cellName(g, picked)} is stable. Neither hunter regrets their choice.`
        : `${cellName(g, picked)} isn't stable: someone would switch. Keep looking.`));
  };
  render();
  return box;
}

// ---------- Interactive: mark all equilibria ----------

function hunt(g: NormalFormGame): HTMLElement {
  const box = h("div", { class: "interactive" });
  const answer = pureNash(g);
  let marked: Profile[] = [];
  let hint: "none" | "underline" | "arrows" = "none";
  let checked = false;

  const toggle = (p: Profile) => {
    checked = false;
    marked = marked.some((m) => same(m, p)) ? marked.filter((m) => !same(m, p)) : [...marked, p];
    render();
  };

  const verdict = () => {
    const hits = marked.filter((m) => answer.some((a) => same(a, m)));
    const wrong = marked.filter((m) => !answer.some((a) => same(a, m)));
    const missed = answer.filter((a) => !marked.some((m) => same(a, m)));
    if (!wrong.length && !missed.length) {
      return h("p", { class: "feedback done" }, `All ${answer.length} found: ${answer.map((a) => cellName(g, a)).join(" and ")}. Elimination couldn't remove a single strategy here; Nash equilibrium still pins down two outcomes.`);
    }
    const parts: string[] = [];
    if (hits.length) parts.push(`${hits.length} correct`);
    if (wrong.length) {
      const [r, c] = wrong[0];
      const d = deviations(g, r, c);
      const who = d.row !== null ? `${g.players[0]} would switch to ${g.strategies[0][d.row]}` : `${g.players[1]} would switch to ${g.strategies[1][d.col!]}`;
      parts.push(`${cellName(g, wrong[0])} isn't an equilibrium: ${who}`);
    }
    if (missed.length) parts.push(`${missed.length} equilibri${missed.length === 1 ? "um" : "a"} still unmarked`);
    return h("p", { class: "feedback bad" }, parts.join(". ") + ".");
  };

  const render = () => {
    clear(box);
    box.append(
      payoffMatrix(g, {
        onCell: (r, c) => toggle([r, c]),
        marked,
        showBestResponses: hint === "underline",
        arrows: hint === "arrows",
        showNash: checked && marked.length > 0 && answer.every((a) => marked.some((m) => same(a, m))) && marked.length === answer.length,
      }),
      h("p", { class: "legend" }, marked.length ? `Marked: ${marked.map((m) => cellName(g, m)).join(", ")}` : "No cells marked yet."),
      checked ? verdict() : "",
      h("div", { class: "controls" },
        h("button", { class: "btn btn-p0", type: "button", onclick: () => { checked = true; render(); } }, "Check"),
        h("button", { class: "btn btn-quiet", type: "button", "aria-pressed": String(hint === "underline"), onclick: () => { hint = hint === "underline" ? "none" : "underline"; render(); } }, hint === "underline" ? "Hide underlines" : "Show underlines"),
        h("button", { class: "btn btn-quiet", type: "button", "aria-pressed": String(hint === "arrows"), onclick: () => { hint = hint === "arrows" ? "none" : "arrows"; render(); } }, hint === "arrows" ? "Hide arrows" : "Show arrows"),
        h("button", { class: "btn btn-quiet", type: "button", onclick: () => { marked = []; checked = false; hint = "none"; render(); } }, "Reset")),
    );
  };
  render();
  return box;
}

// ---------- Interactive: gallery of classic games ----------

interface Exhibit { game: NormalFormGame; note: string }

const EXHIBITS: Exhibit[] = [
  { game: drivingSide, note: "Two equilibria, equally good. Nothing in the payoffs picks one, so a convention or a law has to." },
  { game: stagHunt, note: "Hunting stag together is better for both, but hare is safe: it pays 3 whatever the other does. Which equilibrium happens depends on trust. Bank runs work the same way: if others keep their money in, so should you; if others withdraw, you should too." },
  { game: battleOfSexes, note: "Both want to spend the evening together but disagree on where. Each equilibrium favours a different player, so there's a fight over which one to reach." },
  { game: chicken, note: "The equilibria are the outcomes where exactly one driver swerves. Each wants to be the one who doesn't. Chapter 5 shows how visibly committing, such as throwing the steering wheel out of the window, wins this game." },
  { game: matchingPennies, note: "Every cell has an arrow leaving it, so there is no equilibrium in pure strategies. Row wants to match, Column wants to mismatch. Chapter 3 finds the equilibrium by randomising." },
];

function gallery(): HTMLElement {
  const box = h("div", { class: "interactive" });
  let idx = 0;
  let games = EXHIBITS.map((e) => e.game);

  const describe = (g: NormalFormGame) => {
    const eq = pureNash(g);
    return eq.length === 0
      ? "No pure-strategy equilibrium."
      : `${eq.length} pure equilibri${eq.length === 1 ? "um" : "a"}: ${eq.map((e) => cellName(g, e)).join(", ")}.`;
  };

  const render = () => {
    clear(box);
    const g = games[idx];
    const edited = g !== EXHIBITS[idx].game;
    box.append(
      h("div", { class: "tabs", role: "group", "aria-label": "Choose a game" },
        EXHIBITS.map((e, i) => h("button", { type: "button", "aria-pressed": String(i === idx), onclick: () => { idx = i; render(); } }, e.game.title))),
      payoffMatrix(g, {
        arrows: true, showNash: true, editable: true,
        onEdit: (r, c, who, v) => { games = games.slice(); games[idx] = cloneWithPayoff(g, r, c, who, v); render(); },
      }),
      h("p", { class: "feedback" }, h("strong", null, describe(g)), " ", edited ? "You've edited this game; reset to see the original story." : EXHIBITS[idx].note),
      edited ? h("div", { class: "controls" }, h("button", { class: "btn btn-quiet", type: "button", onclick: () => { games = games.slice(); games[idx] = EXHIBITS[idx].game; render(); } }, "Reset payoffs")) : "",
    );
  };
  render();
  return box;
}

// ---------- Interactive: Bertrand price war ----------

function priceWar(): HTMLElement {
  const g = bertrand([1, 2, 3, 4, 5], 1, 12, ["Station A", "Station B"]);
  const box = h("div", { class: "interactive" });
  let arrows = false;
  const render = () => {
    clear(box);
    const eq = pureNash(g);
    box.append(
      payoffMatrix(g, { showNash: true, arrows, caption: "Profit per hour in dollars. Ringed cells are equilibria." }),
      h("p", { class: "feedback" },
        `Equilibria: ${eq.map((e) => cellName(g, e)).join(", ")}. None of them is above $3. `,
        "At any higher price, the rival gains by undercutting by a dollar and taking every customer."),
      h("div", { class: "controls" },
        h("button", { class: "btn btn-quiet", type: "button", onclick: () => { arrows = !arrows; render(); } }, arrows ? "Hide arrows" : "Show arrows")));
  };
  render();
  const wrap = h("div", null, box,
    h("p", null,
      "With finer price steps, the equilibria squeeze down until price equals cost. Two firms are enough to wipe out profit entirely. Economists call this the ",
      h("em", null, "Bertrand paradox"), ", because real duopolies usually do earn profits."),
    h("p", null,
      "The paradox goes away once you add the frictions real markets have: limited capacity, loyal customers, products that aren't identical, and the fact that the two stations meet again tomorrow. ",
      "That last one is the subject of Chapter 6."));
  return wrap;
}

// ---------- Quant drill: count the equilibria ----------

function countDrill(): HTMLElement {
  const box = h("div", { class: "interactive drill" });
  let streak = 0;
  let best = 0;
  const times: number[] = [];
  const OPTIONS = ["0", "1", "2", "3+"];

  const ask = () => {
    const g = randomIntGame(3, 3, 9);
    const n = pureNash(g).length;
    const truth = Math.min(n, 3);
    const start = performance.now();
    clear(box);
    box.append(
      h("p", { class: "prompt" }, "How many pure-strategy Nash equilibria?"),
      payoffMatrix(g),
      h("div", { class: "choices" },
        OPTIONS.map((label, i) => h("button", { class: "btn btn-p0", type: "button", onclick: () => answer(i) }, label))));

    const answer = (pick: number) => {
      const secs = (performance.now() - start) / 1000;
      const right = pick === truth;
      if (right) { streak++; best = Math.max(best, streak); times.push(secs); if (times.length > 10) times.shift(); } else streak = 0;
      const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
      clear(box);
      box.append(
        h("p", { class: `feedback ${right ? "good" : "bad"}` },
          right ? `Correct in ${secs.toFixed(1)}s. ` : `It was ${n}. `,
          `Streak ${streak}, best ${best}${avg ? `, average ${avg.toFixed(1)}s` : ""}.`),
        payoffMatrix(g, { showBestResponses: true, showNash: true, caption: "Double-underlined cells are the equilibria." }),
        h("div", { class: "controls" }, h("button", { class: "btn btn-p0", type: "button", onclick: ask, autofocus: true }, "Next game")));
      (box.querySelector(".controls .btn") as HTMLButtonElement | null)?.focus({ preventScroll: true });
    };
  };
  ask();
  return box;
}
