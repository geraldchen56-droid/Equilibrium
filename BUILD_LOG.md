# Equilibrium build log

Live: https://equilibrium-lab.vercel.app (Vercel project `equilibrium`; every push to main deploys via vercel.json: `node build.mjs` -> dist/)

## Status
| Item | State |
| --- | --- |
| Engine: Fraction, NormalFormGame, best responses, strict/weak dominance, IEDS, pure Nash, 2x2 mixed, Pareto | Done |
| Engine: deviations/isNash, seeded rng + randomIntGame, bertrand() builder; library: equilibriumHunt, drivingSide, stagHunt, chicken | Done |
| Engine: mixed.ts (expectedVsMix, indifferencePoint, bestResponseToMix, bluffMaths); tree.ts (GameTree, backwardInduction, toNormalForm, withLeafPayoff, raceSafeTotals, pirateGame); library: penaltyKick, entryTree, leaderTree, centipedeTree | Done (35 tests total) |
| Shell: hash router, depth toggle (intuition/formal/quant), TOC, single-file build | Done |
| Landing page `#/` (src/landing.ts + landing.css): full-bleed photo scroll in the style of forgeautomotive.co.uk | Done |
| Ch 1 Dominance & PD | Done |
| Ch 2 Nash equilibrium | Done |
| Ch 3 Mixed strategies | Done |
| Ch 4 Sequential games | Done |
| Ch 5 Commitment and credibility | NEXT (reuse `ui/tree.ts`; entry game with capacity pre-commitment, Chicken with a thrown-away steering wheel, burning bridges, Stackelberg) |
| Sandbox page | Todo (Phase 1) |
| Ch 6-12, case studies | Later phases |

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
- Trees: `gameTree(tree, { solution, folded })` in `ui/tree.ts`. Build trees with `node(player, { Action: child }, id)` / `leaf(...payoffs)`; give decision nodes stable ids. Backward induction breaks ties to the first listed move.
- Zero-sum gotcha: in a 2x2 your mix depends only on the OTHER player's payoffs, but in zero-sum games theirs mirror yours, so editing a payoff must change both entries (cloneWithPayoff twice).

- Landing photos: real Unsplash photographs only (credited in the footer), stored as WebP in `public/img` and copied to `dist/img` by build.mjs. Never use AI-generated images of rule-bound objects (chess, cards, Go, equations): they come out wrong.
- Landing type: Fraunces 200 (display) + Geist 300 (text). Landing is dark in both colour schemes; chapters keep the original theme.

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
