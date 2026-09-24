# Contributing

Adding a chapter means adding one folder: `course/<track>/<id>_<slug>/` with `README.md`, `sim.mjs` and `meta.json`. Order, navigation and search are derived, so there is no registry to edit.

## Rules

- **One idea per chapter.** One mechanism, one motto, one claim in the title line.
- **Follow the recipe.** Steps and section mapping are in [docs/TASKS.md](docs/TASKS.md) (P2.1). The file contracts (README sections, `sim.mjs` exports, `meta.json` keys, valid practice ids) are in [docs/HANDOFF.md](docs/HANDOFF.md).
- **Walk the loop.** Four beats, in order: constraints, component, failure, trade-off. The README sections and the sim frames both follow it.
- **Sims are teaching models, not benchmarks.** Use round numbers, state assumptions in the top comment, keep it deterministic and dependency-free.
- **README excerpts must match `sim.mjs`.** A fenced block starting with `// sim.mjs` must appear contiguously in the sim, and the Try It output must be what the CLI prints. A test enforces the excerpts.
- **Never edit vault notes from a chapter PR.** The vault is the source of truth. Report errors in an issue and fix them separately.
- **Disclose AI assistance.** Say in the PR description if AI helped write the chapter, and confirm you ran the sim and read the result.

## Before you open a PR

```bash
npm run extract
npm test
node course/<track>/<id>_<slug>/sim.mjs
```

Then open `#/<id>` in `npm run dev` and check all five tabs in light and dusk themes.
