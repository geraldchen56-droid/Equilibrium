# Equilibrium build log

Live: https://equilibrium-lab.vercel.app 

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


- Type: Fraunces 200 (display) + Geist 300 (text) everywhere. The whole site is dark in both colour schemes (decided 2026-11-01, replacing the light chapter theme). Tokens live on :root in styles.css; landing.css re-tunes them inside .lp.
- Chapter header photo = the part's landing photo (static, dynamics, information, design) via PART_PHOTO in app.ts.
- Ch 5+ use shared widgets in `ui/widgets.ts`: `sliderPanel`, `stepper`, `tabRow`, `lineChart` (use `legend: true` when lines end together), `bars`, `drill` + `shuffleOptions`, `tip`. Prefer these over one-off versions.
- Never pass an array to the DOM's native `el.append` (prints "[object ...]"); spread it, or use `h()`, which flattens arrays.
- Engine modules from Ch 5 on are exported as namespaces (`commitment`, `repeated`, `evolution`, `signalling`, `auctions`, `bargaining`, `mechanism`, `matching`).


## Commands
- `npm install` then `npx vitest run` (tests) and `node build.mjs` (writes dist/equilibrium.html + dist/index.html).
- If the npm registry is unreachable in a cloud session: symlink `/opt/npm-tools/node_modules/esbuild` (+ `@esbuild/linux-x64`) into node_modules for the build; tests can run through esbuild with a small vitest-compatible shim.

