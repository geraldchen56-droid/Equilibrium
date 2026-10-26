import { library, pureNash, bestResponses } from "./engine";
import { CHAPTERS, PARTS, chapter } from "./chapters";
import { clear, h, store } from "./ui/dom";
import { matrixKey, payoffMatrix } from "./ui/matrix";

type Depth = "intuition" | "formal" | "quant";
const DEPTHS: { id: Depth; label: string; hint: string }[] = [
  { id: "intuition", label: "Intuition", hint: "Plain language, no notation" },
  { id: "formal", label: "Formal", hint: "Adds definitions and notation" },
  { id: "quant", label: "Quant", hint: "Adds timed drills for interviews" },
];

const main = document.getElementById("main")!;
const nav = document.getElementById("toc")!;
const depthBar = document.getElementById("depth")!;

// ---------- Depth toggle ----------

function setDepth(d: Depth) {
  document.documentElement.dataset.depth = d;
  store.set("eq-depth", d);
  depthBar.querySelectorAll("button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.depth === d)));
}

function buildDepthBar() {
  depthBar.append(
    h("span", { class: "depth-label", id: "depth-label" }, "Depth"),
    ...DEPTHS.map((d) => h("button", { type: "button", dataset: { depth: d.id }, title: d.hint, onclick: () => setDepth(d.id) }, d.label)));
  setDepth((store.get("eq-depth") as Depth) || "intuition");
}

// ---------- Table of contents ----------

function buildToc(active: number | null) {
  clear(nav);
  nav.append(h("a", { href: "#/", class: `toc-home${active === null ? " active" : ""}` }, "Introduction"));
  PARTS.forEach((part, pi) => {
    nav.append(h("p", { class: "toc-part" }, `Part ${["I", "II", "III", "IV"][pi]}. ${part}`));
    nav.append(h("ol", { class: "toc-list", start: CHAPTERS.find((c) => c.part === part)!.num },
      CHAPTERS.filter((c) => c.part === part).map((c) =>
        h("li", null, c.render
          ? h("a", { href: `#/${c.num}`, class: active === c.num ? "active" : "", "aria-current": active === c.num ? "page" : null }, c.title)
          : h("span", { class: "soon", title: "Coming soon" }, c.title)))));
  });
}

// ---------- Pages ----------

function home() {
  const g = library.prisonersDilemma;
  const status = h("p", { class: "hero-status", "aria-live": "polite" }, "Click the cell where you think both players end up.");
  const matrixSlot = h("div", null);
  let picked: [number, number] | null = null;

  const renderHero = () => {
    clear(matrixSlot);
    matrixSlot.append(payoffMatrix(g, {
      showBestResponses: picked !== null,
      showNash: picked !== null,
      highlight: picked ? [picked] : [],
      onCell: (r, c) => {
        picked = [r, c];
        const isNash = pureNash(g).some(([a, b]) => a === r && b === c);
        const rowOk = bestResponses(g, 0, c).includes(r);
        const colOk = bestResponses(g, 1, r).includes(c);
        status.textContent = isNash
          ? "Right. Neither player can do better by switching alone, even though both would prefer the top-left cell."
          : `Not stable. ${!rowOk ? `${g.players[0]} would switch to ${g.strategies[0][1 - r].toLowerCase()}` : ""}${!rowOk && !colOk ? ", and " : ""}${!colOk ? `${g.players[1]} would switch to ${g.strategies[1][1 - c].toLowerCase()}` : ""}. The ringed cell is where it settles.`;
        renderHero();
      },
    }));
  };
  renderHero();

  const ready = CHAPTERS.filter((c) => c.render);
  main.append(
    h("header", { class: "hero" },
      h("h1", null, "Equilibrium"),
      h("p", { class: "hero-sub" }, "An interactive course in game theory. Every game on this site is solved live by an engine you can poke at."),
      h("div", { class: "hero-game" },
        matrixKey(g),
        matrixSlot,
        status)),
    h("section", { class: "intro" },
      h("p", null,
        "Game theory is the maths of decisions that depend on other people's decisions. ",
        "It explains why cartels collapse, why auctions are designed the way they are, and why firms pay dividends they don't need to."),
      h("p", null,
        "Use the depth switch at the top to choose how much maths you want. ",
        h("strong", null, "Intuition"), " keeps it to plain language, ",
        h("strong", null, "Formal"), " adds the definitions you'd see in a university course, and ",
        h("strong", null, "Quant"), " adds timed drills in the style of trading interviews."),
      h("a", { class: "btn btn-p0 start", href: `#/${ready[0].num}` }, `Start with Chapter ${ready[0].num}`)),
    h("section", { class: "chapter-list" },
      h("h2", null, "Chapters"),
      h("ol", null, CHAPTERS.map((c) =>
        h("li", { class: c.render ? "" : "is-soon" },
          c.render ? h("a", { href: `#/${c.num}` }, c.title) : h("span", null, c.title),
          h("span", { class: "blurb" }, c.render ? c.blurb : `${c.blurb} Coming soon.`))))),
  );
}

function chapterPage(n: number) {
  const c = chapter(n);
  if (!c || !c.render) return notFound();
  const body = h("article", { class: "chapter" },
    h("p", { class: "chapter-num" }, `Chapter ${c.num}`),
    h("h1", null, c.title));
  c.render(body);
  const nextC = CHAPTERS.find((x) => x.num === n + 1);
  body.append(h("nav", { class: "pager" },
    nextC?.render
      ? h("a", { href: `#/${nextC.num}`, class: "btn btn-p0" }, `Next: ${nextC.title}`)
      : nextC ? h("p", { class: "soon-note" }, `Next up: Chapter ${nextC.num}, ${nextC.title}. Coming soon.`) : null));
  main.append(body);
}

function notFound() {
  main.append(h("article", { class: "chapter" },
    h("h1", null, "That page doesn't exist yet"),
    h("p", null, h("a", { href: "#/" }, "Go back to the introduction"), " to see which chapters are ready.")));
}

// ---------- Router ----------

function route() {
  const m = location.hash.match(/^#\/(\d+)/);
  const n = m ? Number(m[1]) : null;
  clear(main);
  buildToc(n);
  if (n === null) home(); else chapterPage(n);
  document.body.classList.remove("toc-open");
  window.scrollTo(0, 0);
  document.title = n === null ? "Equilibrium: game theory, solved live" : `${chapter(n)?.title ?? "Not found"} · Equilibrium`;
}

document.getElementById("toc-toggle")!.addEventListener("click", () => document.body.classList.toggle("toc-open"));
buildDepthBar();
window.addEventListener("hashchange", route);
route();
