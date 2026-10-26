# Equilibrium build log

Plan doc: https://claude.ai/artifact/5ugdymJFr35JWSh67yHcZk

## Status
| Item | State |
| --- | --- |
| Engine: Fraction, NormalFormGame, best responses, strict/weak dominance, IEDS, pure Nash, 2x2 mixed, Pareto | Done |
| Engine: deviations/isNash, seeded rng + randomIntGame, bertrand() builder; library: equilibriumHunt, drivingSide, stagHunt, chicken | Done (20 tests total) |
| Shell: hash router, depth toggle (intuition/formal/quant), TOC, home hero, single-file build | Done |
| Ch 1 Dominance & PD | Done |
| Ch 2 Nash equilibrium | Done |
| Ch 3 Mixed strategies | NEXT (engine `mixed2x2` exists; needs payoff-vs-probability SVG plot + penalty-kick game) |
| Sandbox page | Todo (Phase 1) |
| Ch 4-12, case studies | Later phases |

## Conventions
- Engine (`src/engine`) is pure TS, no DOM. Every new solver gets tests in `tests/`.
- Payoffs are `Fraction`s; build games with `makeGame({...})`. Canonical games live in `library.ts`.
- Chapter = `src/chapters/chNN-name.ts` exporting `renderChNN(root)`; register in `src/chapters/index.ts` (set `render`).
- Matrix options: `arrows` (deviation arrows), `marked` (reader guesses), `editable`, `showNash`, `showBestResponses`, `alive`, `onCell`, `onStrategy`.
- UI helpers: `h()` / `depth("formal"|"quant", ...)` in `ui/dom.ts`; `payoffMatrix(game, opts)` in `ui/matrix.ts`.
- Colours: Row = cobalt (`--row`), Column = marigold (`--col`), equilibrium = green (`--eq`). Schelling notation: Row payoff bottom-left, Column top-right.
- Chapter shape: lede, play-first interactive, idea, formal box, stepper/editor, real-world link, quant drill, one "shorthand to remember" tip.
- Never append `null` with `el.append` (prints "null"); use `""` or `h()`.

## Commands
- `npm install` then `npx vitest run` (tests) and `node build.mjs` (writes dist/equilibrium.html + dist/index.html).

## Log
- 2026-10-26: Phase 0 + Ch 1 shipped. dist/equilibrium.html ~33 KB.
- 2026-10-26: Ch 2 Nash equilibrium shipped (switch tester, hunt-the-equilibria, editable classic-games gallery, Bertrand price war, count-the-equilibria drill). Mobile: big matrices scroll sideways. ~47 KB.
