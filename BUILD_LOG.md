# Equilibrium build log

Live: https://equilibrium-lab.vercel.app (Vercel project `equilibrium`; every push to main deploys via vercel.json: `node build.mjs` -> dist/)

## Status
| Item | State |
| --- | --- |
| Engine: Fraction, NormalFormGame, best responses, dominance, IEDS, pure Nash, 2x2 mixed, Pareto, deviations, generators | Done |
| Engine: mixed.ts, tree.ts (backward induction, normal form, race, pirates), commitment.ts, repeated.ts, evolution.ts, signalling.ts, auctions.ts, bargaining.ts, mechanism.ts, matching.ts | Done (68 tests) |
| Shell: hash router, depth toggle, TOC, photo chapter headers, prev/next pager, reveal on scroll, single-file build | Done |
| Design: whole site in the landing's language (dark everywhere, Fraunces 200 + Geist, hairlines) | Done |
| Ch 1-12 | Done |
| Sandbox page (free-play game editor) | Todo |
| Case studies (real-world deep dives) | Todo |

## Conventions
- Engine (`src/engine`) is pure TS, no DOM. Every new solver gets tests in `tests/`.
- Payoffs are `Fraction`s; build games with `makeGame({...})`. Canonical games live in `library.ts`.
- Chapter = `src/chapters/chNN-name.ts` exporting `renderChNN(root)`; register in `src/chapters/index.ts` (set `render`).
- Matrix options: `arrows` (deviation arrows), `marked` (reader guesses), `editable`, `showNash`, `showBestResponses`, `alive`, `onCell`, `onStrategy`.
- UI helpers: `h()` / `depth("formal"|"quant", ...)` in `ui/dom.ts`; `payoffMatrix(game, opts)` in `ui/matrix.ts`.
- Colours: Row = cobalt (`--row`), Column = marigold (`--col`), equilibrium = green (`--eq`). Schelling notation: Row payoff bottom-left, Column top-right.
- Chapter shape: lede, play-first interactive, idea, formal box, stepper/editor, real-world link, quant drill, one "shorthand to remember" tip.
- Never append `null` with `el.append` (prints "null"); use `""` or `h()`.
- Sliders: keep the `<input type=range>` mounted and redraw only the readout (see `sliderBox` in ch03); re-rendering the input mid-drag breaks dragging.
- Trees: `gameTree(tree, { solution, folded })` in `ui/tree.ts`; `treeFolder(list)` (exported from ch04) is the fold-back stepper. Node badges use initials, or the last character when initials collide. Build trees with `node(player, { Action: child }, id)` / `leaf(...payoffs)`; give decision nodes stable ids. Backward induction breaks ties to the first listed move.
- Zero-sum gotcha: in a 2x2 your mix depends only on the OTHER player's payoffs, but in zero-sum games theirs mirror yours, so editing a payoff must change both entries (cloneWithPayoff twice).

- Landing photos: real Unsplash photographs only (credited in the footer), stored as WebP in `public/img` and copied to `dist/img` by build.mjs. Never use AI-generated images of rule-bound objects (chess, cards, Go, equations): they come out wrong.
- Type: Fraunces 200 (display) + Geist 300 (text) everywhere. The whole site is dark in both colour schemes (decided 2026-11-01, replacing the light chapter theme). Tokens live on :root in styles.css; landing.css re-tunes them inside .lp.
- Chapter header photo = the part's landing photo (static, dynamics, information, design) via PART_PHOTO in app.ts.
- Ch 5+ use shared widgets in `ui/widgets.ts`: `sliderPanel`, `stepper`, `tabRow`, `lineChart` (use `legend: true` when lines end together), `bars`, `drill` + `shuffleOptions`, `tip`. Prefer these over one-off versions.
- Never pass an array to the DOM's native `el.append` (prints "[object ...]"); spread it, or use `h()`, which flattens arrays.
- Engine modules from Ch 5 on are exported as namespaces (`commitment`, `repeated`, `evolution`, `signalling`, `auctions`, `bargaining`, `mechanism`, `matching`).

- Git: commits are authored as Gerald Chen <geraldchen56@gmail.com>, with no co-author or session lines. Set `git config user.name/user.email` in the repo before committing.

## Commands
- `npm install` then `npx vitest run` (tests) and `node build.mjs` (writes dist/equilibrium.html + dist/index.html).
- If the npm registry is unreachable in a cloud session: symlink `/opt/npm-tools/node_modules/esbuild` (+ `@esbuild/linux-x64`) into node_modules for the build; tests can run through esbuild with a small vitest-compatible shim.

## Log
- 2026-10-26: Phase 0 + Ch 1 shipped. dist/equilibrium.html ~33 KB.
- 2026-10-26: Ch 2 Nash equilibrium shipped (switch tester, hunt-the-equilibria, editable classic-games gallery, Bertrand price war, count-the-equilibria drill). Mobile: big matrices scroll sideways. ~47 KB.
- 2026-10-27: Repo on GitHub, Vercel project linked, Web Analytics script added, card added to projects page.
- 2026-10-27: Forge-style landing page: chess-king hero, pinned statement with scroll-lit words, live Prisoner's Dilemma, three depth cards that set the depth switch, four sticky full-bleed part panels, closing CTA, overlay chapter menu, scroll progress line. Old home hero removed.
- 2026-11-01: Ch 3 Mixed strategies shipped: penalty shootout vs an adaptive keeper (reads streaks, alternation, frequency), payoff-vs-probability SVG plot (4 games, both views), indifference stepper, zero-sum surprise slider (better natural kick -> aim natural less, 37/62 -> 37/66), poker bluff/call maths, 2x2 mixed-equilibrium drill.
- 2026-11-01: Ch 4 Sequential games shipped: Race to 21 vs perfect play, fold-back tree stepper (market entry, capacity race, centipede), tree-vs-matrix empty threat, credibility slider, pirate game table (2-9 pirates), race-to-N drill. Fixed 14px topbar overflow on phones. ~103 KB.
- 2026-11-01: Site-wide redesign: course pages now match the landing (dark, Fraunces + Geist, hairline instruments, photo headers, pager, reveal). ~108 KB.
- 2026-11-01: Ch 5 Commitment (Stackelberg leader game, steering-wheel tree, capacity cost slider) and Ch 6 Repeated games (mystery opponent, shadow-of-the-future chart, Axelrod tournament with noise).
- 2026-11-01: Ch 7 Evolution (hawk-dove prediction + replicator explorer, spatial PD grid) and Ch 8 Signalling (used-car market, lemons chart, Spence separating range).
- 2026-11-01: Ch 9 Auctions (first-price game, Vickrey dominance, revenue equivalence sim, winner's curse) and Ch 10 Bargaining (ultimatum vs human-like responders, shrinking pie, Rubinstein patience, Nash bargaining).
- 2026-11-01: Ch 11 Mechanism design (park: proportional vs Clarke pivot, Myerson reserve) and Ch 12 Matching (stability builder, DA stepper both sides, lie explorer, TTC kidney exchange). Course complete: 12 chapters, 68 tests, ~192 KB. Next: Sandbox, then case studies.
