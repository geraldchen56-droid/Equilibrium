import { CHAPTERS, PARTS, chapter } from "./chapters";
import { clear, h, store } from "./ui/dom";
import { renderLanding } from "./landing";

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
  nav.append(h("a", { href: "#/", class: `toc-home${active === null ? " active" : ""}` }, "Home"));
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

let cleanup: (() => void) | null = null;

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
  cleanup?.(); cleanup = null;
  clear(main);
  buildToc(n);
  document.body.classList.toggle("landing", n === null);
  if (n === null) cleanup = renderLanding(main, setDepth); else chapterPage(n);
  document.body.classList.remove("toc-open");
  window.scrollTo(0, 0);
  document.title = n === null ? "Equilibrium: game theory, solved live" : `${chapter(n)?.title ?? "Not found"} · Equilibrium`;
}

document.getElementById("toc-toggle")!.addEventListener("click", () => document.body.classList.toggle("toc-open"));
buildDepthBar();
window.addEventListener("hashchange", route);
route();
