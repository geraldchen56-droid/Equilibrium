// Landing page: full-bleed photographic scroll, styled after a luxury-atelier site.
// Every photo is a real photograph from Unsplash (credited in the footer).
import { library, pureNash, bestResponses } from "./engine";
import { CHAPTERS, PARTS } from "./chapters";
import { clear, h } from "./ui/dom";
import { matrixKey, payoffMatrix } from "./ui/matrix";

type Depth = "intuition" | "formal" | "quant";

const IMG = (name: string) => ({
  src: `img/${name}.webp`,
  srcset: `img/${name}-sm.webp 1280w, img/${name}.webp 2560w`,
  sizes: "100vw",
});

function photo(name: string, alt: string, opts: { eager?: boolean; cls?: string } = {}) {
  return h("img", {
    ...IMG(name), alt, class: `lp-photo ${opts.cls ?? ""}`, decoding: "async",
    loading: opts.eager ? "eager" : "lazy", fetchpriority: opts.eager ? "high" : null,
  });
}

const PART_PHOTOS: { img: string; alt: string; line: string }[] = [
  { img: "static", alt: "Olive-wood chess pieces lined up on their starting squares", line: "Everyone moves at once and nobody sees the other's choice. Dominance, Nash equilibrium and the case for being unpredictable." },
  { img: "dynamics", alt: "A long row of dominoes standing in a line on a dark reflective surface", line: "Moves happen in order and the future casts a shadow. Backward induction, threats you can believe, and cooperation that lasts." },
  { img: "information", alt: "A player lifting one card while others lie face down on the table", line: "Someone knows something you don't. Signals, bluffs, and the auctions and bargains built on hidden information." },
  { img: "design", alt: "A wooden gavel held upright against a dark background", line: "Turn the problem around: write the rules so that people acting in their own interest produce the outcome you want." },
];

const DEPTHS: { id: Depth; title: string; img: string; alt: string; body: string }[] = [
  { id: "intuition", title: "Intuition", img: "poker", alt: "Ace and king of clubs beside stacks of poker chips on green felt",
    body: "Plain language and no notation. You learn to see the game inside a poker hand, a price war or a group project, then test your reading against the engine." },
  { id: "formal", title: "Formal", img: "formal", alt: "Chalkboard working from a demand curve to total and marginal revenue",
    body: "Adds the definitions and notation you would meet in a university course: strategy profiles, best-response functions and proofs you can follow line by line." },
  { id: "quant", title: "Quant", img: "quant", alt: "Candlestick price chart and order book on a trading screen",
    body: "Adds timed drills in the style of trading interviews. Spot the equilibrium, price the mixed strategy, and do it before the clock runs out." },
];

const CREDITS: [string, string][] = [
  ["hpzworkz", "white-chess-king-piece-WTZZomyqaoA"],
  ["stumpie10", "red-and-white-dice-lot-pQyTChJwEDI"],
  ["mparzuchowski", "playing-cards-and-poker-chips-U8n_O7rEq7o"],
  ["rocinante_11", "black-chalk-board-with-chalk-writing-qfrtUw4NBPQ"],
  ["masloff", "cryptocurrency-candlestick-chart-on-screen-eNStVITP_10"],
  ["natashareddy", "brown-and-black-chessboard-closeup-photo-72yKcbvCxkw"],
  ["pastorthomasbwilson", "white-iphone-4s-on-brown-wooden-table-KvvAkN-ZKEM"],
  ["andriklangfield", "person-holding-playing-cards-on-white-table-S0_Ep9meLFY"],
  ["tingeyinjurylawfirm", "wooden-judge-gavel-on-dark-background-nSpj-Z12lX0"],
  ["trapnation", "aerial-view-of-city-buildings-during-nighttime-CR0E20Of7yU"],
];

const STATEMENT =
  "Game theory is the maths of decisions that depend on other people's decisions. It explains why cartels collapse, why auctions are built the way they are, and why firms pay dividends they don't need to.";

/** Splits text into word spans so scroll can light them one by one. */
const words = (text: string) => text.split(" ").map((w) => h("span", { class: "w" }, w + " "));

export function renderLanding(main: HTMLElement, setDepth: (d: Depth) => void): () => void {
  const firstReady = CHAPTERS.find((c) => c.render)!;
  const startHref = `#/${firstReady.num}`;

  // ---------- Overlay menu ----------
  const menu = h("div", { class: "lp-menu", id: "lp-menu", role: "dialog", "aria-modal": "true", "aria-label": "Chapters", hidden: true },
    h("ol", { class: "lp-menu-list" }, CHAPTERS.map((c) =>
      h("li", { class: c.render ? "" : "is-soon" },
        h("span", { class: "n" }, String(c.num)),
        c.render ? h("a", { href: `#/${c.num}` }, c.title) : h("span", null, c.title),
        c.render ? "" : h("span", { class: "soon" }, "Coming soon")))));
  const menuBtn = h("button", { class: "lp-nav-btn", type: "button", "aria-expanded": "false", "aria-controls": "lp-menu" }, "Chapters");
  const setMenu = (open: boolean) => {
    menu.hidden = !open;
    menuBtn.setAttribute("aria-expanded", String(open));
    menuBtn.textContent = open ? "Close" : "Chapters";
    document.body.classList.toggle("lp-menu-open", open);
    if (open) (menu.querySelector("a") as HTMLElement | null)?.focus();
  };
  menuBtn.addEventListener("click", () => setMenu(Boolean(menu.hidden)));
  const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !menu.hidden) { setMenu(false); menuBtn.focus(); } };
  document.addEventListener("keydown", onKey);

  const nav = h("header", { class: "lp-nav" },
    menuBtn,
    h("a", { class: "lp-brand", href: "#/", "aria-label": "Equilibrium, back to top", onclick: (e: Event) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); } }, "Equilibrium"),
    h("a", { class: "lp-nav-btn lp-nav-start", href: startHref }, "Start"));

  // ---------- 1. Hero ----------
  const hero = h("section", { class: "lp-panel lp-hero", "aria-labelledby": "lp-h1" },
    photo("hero", "A single white chess king lit by one spotlight on a black table", { eager: true }),
    h("div", { class: "lp-hero-text" },
      h("h1", { id: "lp-h1" }, h("span", null, "Every move"), " ", h("span", null, "depends on theirs")),
      h("p", null, "An interactive course in game theory. Every game on this site is solved live by an engine you can poke at.")));

  // ---------- 2. Statement ----------
  const statementText = h("p", { class: "lp-statement-text" }, words(STATEMENT));
  const statement = h("section", { class: "lp-panel lp-statement", "aria-label": "What game theory is" },
    photo("dice", "Five red dice tumbling through the air above a black surface", { cls: "pos-right" }),
    h("div", { class: "lp-statement-inner" }, statementText));

  // ---------- 3. Play first ----------
  const g = library.prisonersDilemma;
  const status = h("p", { class: "lp-status", "aria-live": "polite" }, "Click the cell where you think you both end up.");
  const slot = h("div", null);
  let picked: [number, number] | null = null;
  const renderGame = () => {
    clear(slot);
    slot.append(payoffMatrix(g, {
      showBestResponses: picked !== null, showNash: picked !== null, highlight: picked ? [picked] : [],
      onCell: (r, c) => {
        picked = [r, c];
        const isNash = pureNash(g).some(([a, b]) => a === r && b === c);
        const rowOk = bestResponses(g, 0, c).includes(r);
        const colOk = bestResponses(g, 1, r).includes(c);
        status.textContent = isNash
          ? "Right. Neither of you can do better by switching alone, even though both would prefer the top-left cell."
          : `Not stable. ${!rowOk ? `${g.players[0]} would switch to ${g.strategies[0][1 - r].toLowerCase()}` : ""}${!rowOk && !colOk ? ", and " : ""}${!colOk ? `${g.players[1]} would switch to ${g.strategies[1][1 - c].toLowerCase()}` : ""}. The ringed cell is where it settles.`;
        renderGame();
      },
    }));
  };
  renderGame();
  const play = h("section", { class: "lp-play", "aria-labelledby": "lp-play-h" },
    h("div", { class: "lp-play-copy" },
      h("h2", { id: "lp-play-h" }, "Try it before the theory"),
      h("p", null, "You and your partner are questioned in separate rooms. Each of you can stay silent or confess. The numbers are years in prison written as negatives, so closer to zero is better."),
      h("a", { class: "lp-btn", href: startHref }, `Read chapter ${firstReady.num}: ${firstReady.title}`)),
    h("div", { class: "lp-play-game" }, matrixKey(g), slot, status));

  // ---------- 4. Three depths ----------
  const depths = h("section", { class: "lp-depths", "aria-labelledby": "lp-depths-h" },
    h("div", { class: "lp-depths-head" },
      h("h2", { id: "lp-depths-h" }, "Choose how deep you go"),
      h("p", null, "The same chapters, read at three depths. Each one adds to the last, and you can switch at any point from the bar at the top of a chapter.")),
    h("ol", { class: "lp-depth-list" }, DEPTHS.map((d, i) =>
      h("li", { class: "lp-depth" },
        h("div", { class: "lp-depth-img" }, photo(d.img, d.alt)),
        h("div", { class: "lp-depth-text" },
          h("p", { class: "lp-count" }, h("span", null, String(i + 1)), ` of ${DEPTHS.length}`),
          h("h3", null, d.title),
          h("p", null, d.body),
          h("a", { class: "lp-btn", href: startHref, onclick: () => setDepth(d.id) }, `Start at ${d.title.toLowerCase()} depth`))))));

  // ---------- 5. Course: one full-bleed photo per part ----------
  const course = h("section", { class: "lp-course", "aria-labelledby": "lp-course-h" },
    h("h2", { id: "lp-course-h", class: "lp-course-h" }, "Twelve chapters in four parts"),
    PARTS.map((part, pi) => {
      const p = PART_PHOTOS[pi];
      const chs = CHAPTERS.filter((c) => c.part === part);
      return h("article", { class: "lp-panel lp-part", "aria-labelledby": `lp-part-${pi}` },
        photo(p.img, p.alt),
        h("div", { class: "lp-part-text" },
          h("p", { class: "lp-part-num" }, `Part ${["I", "II", "III", "IV"][pi]}`),
          h("h3", { id: `lp-part-${pi}` }, part),
          h("p", { class: "lp-part-line" }, p.line),
          h("ol", { class: "lp-part-list", start: chs[0].num }, chs.map((c) =>
            h("li", { class: c.render ? "" : "is-soon", dataset: { n: String(c.num) } },
              c.render ? h("a", { href: `#/${c.num}` }, c.title) : h("span", null, c.title),
              c.render ? "" : h("span", { class: "soon" }, "Coming soon"))))));
    }));

  // ---------- 6. Closing ----------
  const close = h("section", { class: "lp-panel lp-close", "aria-labelledby": "lp-close-h" },
    photo("city", "Lower Manhattan's financial district lit up at night, seen from above"),
    h("div", { class: "lp-close-text" },
      h("h2", { id: "lp-close-h" }, "Find the equilibrium"),
      h("a", { class: "lp-btn lp-btn-solid", href: startHref }, `Start chapter ${firstReady.num}`)));

  const footer = h("footer", { class: "lp-footer" },
    h("nav", { "aria-label": "Footer" },
      h("a", { href: startHref }, "Start the course"),
      h("button", { type: "button", onclick: () => setMenu(true) }, "All chapters"),
      h("button", { type: "button", onclick: () => window.scrollTo({ top: 0, behavior: "smooth" }) }, "Back to top")),
    h("p", { class: "lp-credits" }, "Photographs from Unsplash by ",
      CREDITS.map(([user, slug], i) => [
        h("a", { href: `https://unsplash.com/photos/${slug}`, target: "_blank", rel: "noopener" }, `@${user}`),
        i < CREDITS.length - 2 ? ", " : i === CREDITS.length - 2 ? " and " : ".",
      ])));

  const stack = h("div", { class: "lp-stack" }, hero, statement, h("div", { class: "lp-hold", "aria-hidden": "true" }));
  const progress = h("div", { class: "lp-progress", "aria-hidden": "true" }, h("span", null));

  main.append(h("div", { class: "lp" }, nav, menu, stack, play, depths, course, close, footer, progress));

  // ---------- Scroll: progress line + statement word reveal ----------
  const bar = progress.firstElementChild as HTMLElement;
  const ws = [...statementText.querySelectorAll<HTMLElement>(".w")];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce) ws.forEach((w) => w.classList.add("on"));
  let ticking = false;
  const update = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight;
    bar.style.transform = `scaleX(${max > 0 ? Math.min(1, scrollY / max) : 0})`;
    if (!reduce) {
      // The statement pins for one screen; its words light up across that hold.
      const top = -stack.getBoundingClientRect().top;
      const t = Math.min(1, Math.max(0, (top - innerHeight * 0.45) / (innerHeight * 1.2)));
      const n = Math.round(t * ws.length);
      ws.forEach((w, i) => w.classList.toggle("on", i < n));
    }
  };
  const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", onScroll);
  update();
  requestAnimationFrame(() => hero.classList.add("is-in"));

  return () => {
    removeEventListener("scroll", onScroll);
    removeEventListener("resize", onScroll);
    document.removeEventListener("keydown", onKey);
    document.body.classList.remove("lp-menu-open");
  };
}
