import { matching } from "../engine";
import { clear, depth, h } from "../ui/dom";
import { drill, shuffleOptions, stepper, tabRow, tip } from "../ui/widgets";

const { blockingPairs, deferredAcceptance, permutations, receiverProposing, topTradingCycles } = matching;

const STUDENTS = ["Ana", "Ben", "Cai", "Dev"];
const SCHOOLS = ["North", "East", "South", "West"];
// Most preferred first.
const SP = [[2, 3, 1, 0], [2, 1, 0, 3], [3, 0, 1, 2], [3, 2, 1, 0]];
const CP = [[0, 2, 1, 3], [3, 1, 0, 2], [2, 1, 3, 0], [1, 3, 0, 2]];

export function renderCh12(root: HTMLElement) {
  root.append(
    h("p", { class: "lede" },
      "Some markets can't use prices. You can't buy a place at a popular state school, a hospital can't auction residencies, and selling kidneys is illegal almost everywhere. ",
      "Yet someone still has to decide who goes where. Matching theory shows how to do it so that nobody has a reason to break the deal."),

    h("h2", null, "Make a stable match"),
    h("p", null,
      "Four students, four schools, one place each. Everyone has a ranking. A match is ", h("em", null, "unstable"), " if some student and school would both rather be with each other than with who they've got: they'd simply ignore the official match. ",
      "Assign each student a school and check."),
    prefsTable(),
    builder(),

    h("h2", null, "Deferred acceptance"),
    h("p", null,
      "David Gale and Lloyd Shapley found an algorithm in 1962 that always produces a stable match. Each round, every unmatched student applies to their favourite school that hasn't rejected them yet. ",
      "Each school keeps its best applicant so far on a waiting list (deferring acceptance) and rejects the rest. Repeat until nobody is rejected. Step through it, then let the schools do the proposing instead."),
    daStepper(),
    h("p", null,
      "Both matches are stable, but they're different: when students propose, every student gets the best school they could get in any stable match; when schools propose, the schools do. ",
      "Who proposes is a political choice about whose side the algorithm takes."),

    h("h2", null, "Can lying help?"),
    h("p", null, "With students proposing, try misreporting one student's ranking. Can anyone get a better school than by telling the truth?"),
    liar(),
    h("p", null,
      "No proposer can ever gain by lying in student-proposing deferred acceptance (Dubins and Freedman, 1981; Roth, 1982). That's why cities adopted it: families can list schools in their true order without gaming the system. ",
      "Boston's old mechanism rewarded listing a 'safe' school first, and the city switched in 2005 after economists showed how families were being hurt."),

    h("h2", null, "Kidney exchange"),
    h("p", null,
      "A patient may have a willing donor whose kidney doesn't match. Two such pairs can swap: each donor gives to the other pair's patient. ",
      "Here five patient-donor pairs rank the donors. ", h("em", null, "Top trading cycles"), " has each patient point at their favourite remaining donor; every closed loop of pointing performs its swaps and leaves; repeat."),
    ttc(),

    depth("formal",
      h("p", null,
        "A matching ", h("span", { class: "math" }, "μ"), " is ", h("em", null, "stable"), " if no pair ", h("span", { class: "math" }, "(s, c)"), " both strictly prefer each other to their partners in ", h("span", { class: "math" }, "μ"), ". ",
        "Gale–Shapley: deferred acceptance terminates in at most ", h("span", { class: "math" }, "n²"), " proposals with a stable matching, and the proposer-proposing version gives every proposer their best partner among all stable matchings and every receiver their worst."),
      h("p", null,
        "Proposer-proposing DA is strategy-proof for proposers, but no stable mechanism is strategy-proof for both sides (Roth, 1982). Top trading cycles is strategy-proof, Pareto-efficient and in the core of the housing market (Shapley and Scarf, 1974).")),

    h("h2", null, "Run one round by hand"),
    stepper([
      ["Applications", "Ana and Ben both apply to South; Cai and Dev both apply to West."],
      ["Schools choose", "South prefers Ben to Ana, so it holds Ben and rejects Ana. West prefers Dev to Cai: holds Dev, rejects Cai."],
      ["Next round", "Ana tries her second choice, West, which prefers Dev, and Cai tries North, which takes him."],
      ["Settle", "Ana then tries East, which takes her. Nobody is rejected, so the tentative holds become final: Ana–East, Ben–South, Cai–North, Dev–West."],
    ]),

    h("h2", null, "Matching in the wild"),
    h("ul", { class: "compare" },
      h("li", null, h("strong", null, "Doctors. "), "The US National Resident Matching Program places tens of thousands of new doctors each year with a deferred-acceptance algorithm redesigned by Alvin Roth in the 1990s."),
      h("li", null, h("strong", null, "Schools. "), "New York City (2003) and Boston (2005) moved to deferred acceptance for school places."),
      h("li", null, h("strong", null, "Kidneys. "), "Kidney exchange networks run cycles and long donor chains, helping thousands of patients. Roth and Shapley shared the 2012 Nobel prize for this body of work.")),

    depth("quant",
      h("p", null, "Spot instability fast: look for a pair who both prefer each other."),
      drill(stableDrill)),

    tip("a blocking pair = both prefer each other to what they've got. Proposers get their best stable partner, receivers their worst, and proposers can't gain by lying."),
  );
}

const nm = (side: "s" | "c", i: number) => (side === "s" ? STUDENTS[i] : SCHOOLS[i]);

function prefsTable(): HTMLElement {
  return h("div", { class: "two-col" },
    h("div", { class: "table-scroll" }, h("table", { class: "stats" },
      h("tr", null, h("th", null, "Student"), h("th", null, "Ranks schools")),
      STUDENTS.map((s, i) => h("tr", null, h("td", { class: "chip-p0" }, s), h("td", null, SP[i].map((c) => SCHOOLS[c]).join(" › ")))))),
    h("div", { class: "table-scroll" }, h("table", { class: "stats" },
      h("tr", null, h("th", null, "School"), h("th", null, "Ranks students")),
      SCHOOLS.map((c, i) => h("tr", null, h("td", { class: "chip-p1" }, c), h("td", null, CP[i].map((s) => STUDENTS[s]).join(" › ")))))));
}

// ---------- Play first: build a matching ----------

function builder(): HTMLElement {
  const box = h("div", { class: "interactive" });
  const match = [1, 0, 3, 2];
  const out = h("div");
  const selects = STUDENTS.map((s, i) => {
    const sel = h("select", { "aria-label": `School for ${s}`, onchange: () => { match[i] = Number(sel.value); check(false); } },
      SCHOOLS.map((c, j) => h("option", { value: j, selected: j === match[i] }, c))) as HTMLSelectElement;
    return h("label", { class: "field" }, h("span", { class: "chip-p0" }, s), sel);
  });
  const check = (show: boolean) => {
    clear(out);
    const dup = new Set(match).size < match.length;
    if (dup) { out.append(h("p", { class: "feedback bad" }, "Two students share a school. Each school has one place.")); return; }
    if (!show) return;
    const bp = blockingPairs(match, SP, CP);
    out.append(h("p", { class: `feedback ${bp.length ? "bad" : "good"}` },
      bp.length
        ? `Unstable. ${bp.slice(0, 3).map(([s, c]) => `${STUDENTS[s]} and ${SCHOOLS[c]} would both rather be together`).join("; ")}${bp.length > 3 ? `; and ${bp.length - 3} more` : ""}.`
        : "Stable: no student and school would both rather switch. This market has three stable matches; the next section finds the two extremes."));
  };
  box.append(h("div", { class: "two-col" }, selects),
    h("div", { class: "controls" }, h("button", { class: "btn btn-p0", type: "button", onclick: () => check(true) }, "Check stability")), out);
  return box;
}

// ---------- Deferred acceptance stepper ----------

function daStepper(): HTMLElement {
  const box = h("div", { class: "interactive" });
  let side = 0;
  let k = 0;
  const render = () => {
    clear(box);
    const studentsPropose = side === 0;
    const res = studentsPropose ? deferredAcceptance(SP, CP) : deferredAcceptance(CP, SP);
    const P = studentsPropose ? "s" : "c", R = studentsPropose ? "c" : "s";
    const done = k >= res.rounds.length;
    const round = res.rounds[Math.min(k, res.rounds.length) - 1];
    const finalMatch = studentsPropose ? res.match : receiverProposing(SP, CP).match;
    box.append(
      tabRow(["Students propose", "Schools propose"], side, (i) => { side = i; k = 0; render(); }, "Who proposes"),
      round
        ? h("div", null,
          h("p", { class: "prompt" }, `Round ${k} of ${res.rounds.length}`),
          h("ul", { class: "compare" },
            round.proposals.map(([p, r]) => {
              const rej = round.rejected.some(([a, b]) => a === p && b === r);
              return h("li", { class: rej ? "" : "chip-p0" }, `${nm(P as "s" | "c", p)} → ${nm(R as "s" | "c", r)}: ${rej ? "rejected" : "held"}`);
            }),
            round.rejected.filter(([p]) => !round.proposals.some(([q]) => q === p)).map(([p, r]) => h("li", null, `${nm(R as "s" | "c", r)} drops ${nm(P as "s" | "c", p)} for someone better`))),
          h("p", { class: "legend" }, "Held: ", round.held.map((p, r) => p === null ? "" : `${nm(R as "s" | "c", r)}–${nm(P as "s" | "c", p)}`).filter(Boolean).join(", ") || "none"))
        : h("p", { class: "prompt" }, `${studentsPropose ? "Students" : "Schools"} make the first applications.`),
      done ? h("p", { class: "feedback done" }, "Final, stable match: ",
        finalMatch.map((c, s) => `${STUDENTS[s]}–${SCHOOLS[c]}`).join(", "), ". ",
        studentsPropose ? "Each student gets their best achievable school." : "Each school gets its best achievable student; every student does worse than when students propose.") : "",
      h("div", { class: "controls" },
        !done ? h("button", { class: "btn btn-p0", type: "button", onclick: () => { k++; render(); } }, k ? "Next round" : "Run round 1") : "",
        !done ? h("button", { class: "btn btn-quiet", type: "button", onclick: () => { k = res.rounds.length; render(); } }, "Skip to the end") : "",
        k ? h("button", { class: "btn btn-quiet", type: "button", onclick: () => { k = 0; render(); } }, "Reset") : ""));
  };
  render();
  return box;
}

// ---------- Can a student gain by lying? ----------

function liar(): HTMLElement {
  const box = h("div", { class: "interactive" });
  const PERMS = permutations(4);
  let who = 0;
  let lie = PERMS.findIndex((p) => p.join() === SP[0].join());
  const out = h("div");
  const whoSel = h("select", { "aria-label": "Student", onchange: () => { who = Number(whoSel.value); lie = PERMS.findIndex((p) => p.join() === SP[who].join()); fillLie(); paint(); } },
    STUDENTS.map((s, i) => h("option", { value: i }, s))) as HTMLSelectElement;
  const lieSel = h("select", { "aria-label": "Reported ranking", onchange: () => { lie = Number(lieSel.value); paint(); } }) as HTMLSelectElement;
  const fillLie = () => { clear(lieSel); PERMS.forEach((p, i) => lieSel.append(h("option", { value: i, selected: i === lie }, p.map((c) => SCHOOLS[c]).join(" › ") + (p.join() === SP[who].join() ? "  (truth)" : "")))); };
  const paint = () => {
    clear(out);
    const truthMatch = deferredAcceptance(SP, CP).match[who];
    const reported = SP.map((p, i) => (i === who ? PERMS[lie] : p));
    const got = deferredAcceptance(reported, CP).match[who];
    const rankTrue = (c: number) => SP[who].indexOf(c) + 1;
    const better = rankTrue(got) < rankTrue(truthMatch);
    out.append(h("p", { class: `feedback ${better ? "bad" : "good"}` },
      `Truthful: ${STUDENTS[who]} gets ${SCHOOLS[truthMatch]} (true choice #${rankTrue(truthMatch)}). With this report: ${SCHOOLS[got]} (true choice #${rankTrue(got)}). `,
      got === truthMatch ? "No change." : better ? "Better! (This should never happen.)" : "Worse. The lie backfired."));
  };
  fillLie();
  box.append(h("div", { class: "two-col" }, h("label", { class: "field" }, "Student", whoSel), h("label", { class: "field" }, "Reported ranking", lieSel)), out);
  paint();
  return box;
}

// ---------- Kidney exchange (TTC) ----------

const KP = [[1, 2, 3, 4, 0], [0, 2, 3, 4, 1], [0, 4, 3, 1, 2], [2, 0, 1, 4, 3], [3, 0, 1, 2, 4]];

function ttc(): HTMLElement {
  const box = h("div", { class: "interactive" });
  const res = topTradingCycles(KP);
  let k = 0;
  const pair = (i: number) => `Pair ${i + 1}`;
  const render = () => {
    clear(box);
    box.append(
      h("div", { class: "table-scroll" }, h("table", { class: "stats" },
        h("tr", null, h("th", null, "Patient"), h("th", null, "Ranks donors (own donor last)")),
        KP.map((p, i) => h("tr", null, h("td", null, pair(i)), h("td", null, p.map((d) => `D${d + 1}`).join(" › ")))))),
      ...res.steps.slice(0, k).map((st, si) => h("p", { class: "feedback good" },
        `Round ${si + 1}: `, st.cycles.map((c) => c.length === 1 ? `${pair(c[0])} keeps its own donor` : c.map((i) => `P${i + 1} → D${(KP[i].find((x) => c.includes(x)) ?? i) + 1}`).join(", ") + (c.length === 2 ? " (a two-way swap)" : ` (a ${c.length}-way cycle)`)).join("; "), ".")),
      k >= res.steps.length ? h("p", { class: "legend" }, `Everyone gets a donor at least as good as their own: `, res.alloc.map((d, i) => `P${i + 1} ← D${d + 1}`).join(", "), ". Pairs 3, 4 and 5 needed a three-way cycle: none of them could swap with just one other pair.") : "",
      h("div", { class: "controls" },
        k < res.steps.length ? h("button", { class: "btn btn-p0", type: "button", onclick: () => { k++; render(); } }, k ? "Next round" : "Find cycles") : h("button", { class: "btn btn-quiet", type: "button", onclick: () => { k = 0; render(); } }, "Reset")));
  };
  render();
  return box;
}

// ---------- Quant drill: is it stable? ----------

function stableDrill() {
  const shuffle = () => { const p = [0, 1, 2]; for (let i = 2; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [p[i], p[j]] = [p[j], p[i]]; } return p; };
  const S = [shuffle(), shuffle(), shuffle()], C = [shuffle(), shuffle(), shuffle()];
  const m = Math.random() < 0.5 ? deferredAcceptance(S, C).match : shuffle();
  const bp = blockingPairs(m, S, C);
  const X = ["A", "B", "C"], Y = ["x", "y", "z"];
  const { options, answer } = shuffleOptions(bp.length ? "Unstable" : "Stable", ["Stable", "Unstable"]);
  return {
    prompt: `Matched: ${m.map((c, s) => `${X[s]}–${Y[c]}`).join(", ")}. Stable?`,
    body: h("p", { class: "legend" }, X.map((x, i) => `${x}: ${S[i].map((c) => Y[c]).join(">")}`).join("   "), h("br"), Y.map((y, i) => `${y}: ${C[i].map((s) => X[s]).join(">")}`).join("   ")),
    options, answer,
    explain: bp.length ? `Blocking pair: ${X[bp[0][0]]} and ${Y[bp[0][1]]} both prefer each other.` : "No pair prefers each other to their partners.",
  };
}
