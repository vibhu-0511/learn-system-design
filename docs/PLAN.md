# Plan: `learn-system-design`, a course-first rebuild of hld-architect-copilot

## Context

`vibhu-0511/hld-architect-copilot` has three strong assets:
- a 265-note vault (the ✅ notes run 700–2,500 lines, all with one structure: Intuition → Failure-first → Working knowledge → Deep dive → Production → Real-world → Interview → Why-chain → Links);
- solid practice tools (drill wizard, 25 outage replays, bug finder, capacity/traffic/failure sims, FSRS);
- a 13-tab UI.

What's missing is a path through it. The goal is a **new repo** built the way `shareAI-lab/learn-claude-code` is built:
- the spine is taken from the vault's master index (`vault/system_design/System Design.md`) and covers many systems;
- every gym feature is ported and cross-linked;
- the visual theme follows the Pickaxe login screenshot the user shared.

**Stage gate:** the user approved the interactive preview (v2, darkened theme), and the detailed build design is in §4. Execution starts once this plan is approved and pauses again after the 3-chapter pilot (P2).

User decisions:
- many-topic spine from the vault index;
- chapter code in **zero-dep JavaScript**;
- gym features **folded into chapters and ported in full**;
- **Vite + React**;
- **cloud / sky theme**.

Assumptions:
- repo `vibhu-0511/learn-system-design`, public, at `C:\Users\vibha\Downloads\data\personal\learn-system-design`, using the vibhu-0511 git identity;
- English only;
- hosted on GitHub Pages.

---

## 1. How learn-claude-code is built (second pass, the principles we copy)

**Goal they state:** a 0-to-1 course. "Grasp the key designs and build it yourself", not "copy the source code". The README opens with a thesis ("Agency comes from the model; Agent = Model + Harness"), backed by history, before any code.

**Core principles and how each maps to this project:**

| # | Their principle (evidence) | Our version |
|---|---|---|
| 1 | **A thesis frames everything.** Every lesson reads as evidence for one argument. | Thesis: *"Architecture is judgment under constraints. Components are just how the judgment shows up."* The root README and home hero open with it. |
| 2 | **One invariant that never changes.** The s01 `while True` loop is untouched through s17: "Hook around the loop, never rewrite the loop". | The **architect's loop**: *constraints → component → failure → trade-off*. Every chapter walks these 4 beats, in the README and in the sim's frames. A test enforces it. |
| 3 | **Adding a capability is one registration** (s02: add a tool = one `TOOLS` entry + one `TOOL_HANDLERS` line). | Adding a chapter = one folder (`README.md` + `sim.mjs` + `meta.json`). Order, nav, badges and search are all derived. No registry to edit. |
| 4 | **One mechanism per chapter, with a motto.** The claim is repeated in the README, header and meta. | Same. Each chapter's subtitle is a claim ("A cache is a bet on repetition"). |
| 5 | **Runnable beats readable.** Each `code.py` runs alone; the docstring carries the pattern. | Each `sim.mjs` runs alone with `node`, and the **same file** runs live in the browser. This is our upgrade on their scripted JSON simulator. |
| 6 | **Plain files are the source of truth; the web is derived.** Delete `web/` and the course still works on GitHub. | Same: `course/` reads fine on GitHub, and `web/` only renders it. |
| 7 | **Compute facts, never type them.** The extractor derives LOC, tools, classes and diffs. | The extractor derives LOC, `PARAMS`, frame count, prev/next, track stats and the concern index. |
| 8 | **Teaching data is data, rendered by generic components** (scenarios, annotations, flows). | Co-located `meta.json` per chapter. Generic `FramePlayer`, `ParamPanel` and `DecisionList` render it. |
| 9 | **Problem before solution; cliffhanger endings; explicit boundaries.** | The README skeleton makes these required sections. |
| 10 | **Decisions record the rejected alternative.** | `meta.decisions[].alternatives` is required. |
| 11 | **Progressive disclosure.** Short main path, `<details>` / Deep dive for depth. | README = main path, the vault note = depth, reachable one click away in the Library. |
| 12 | **Capstone integration.** s15 reconnects every mechanism into one loop. | The evolution (e01–e04) and case-study (c01–c11) chapters integrate earlier blocks. Their `meta.uses[]` lists prerequisite chapter ids. |
| 13 | **Guardrails on content, not just code** (README structure tests, scenario ≡ runtime). | Contract tests, plus a **README excerpt ≡ sim.mjs** check. That check fixes their weak spot: their hand-drawn visualizations drifted from the content. |
| 14 | **Deliberate minimalism, defended in CONTRIBUTING.** | Same rule: sims are teaching models, not benchmarks. |
| 15 | **Course versioning.** The legacy track is kept, with a mapping table. | The old app stays live. The new README maps each old tab to its new home. |

**Where they creak, and what we avoid:**
- hand-authored heroes drifted (s08 still shows 3-stage compaction) → hand-built heroes only where a sim can't express the idea;
- lesson ids are repeated across 5 registries → folders are the only registry;
- regex parsing of source → ours imports the ESM sims directly.

---

## 2. Course spine: 7 tracks, 67 chapters (the vault's ✅ core, in the index's own order)

| Track | Ids | Chapters (source = vault note of the same name) |
|---|---|---|
| 1 Fundamentals | f01–f08 | client-server, networking, API design, latency & throughput, scalability, CAP, ACID vs BASE, consistency models |
| 2 Evolutions | e01–e04 | scaling a web app (the map chapter), scaling a DB, scaling chat, monolith → microservices |
| 3 Building blocks | b01–b12 | LB, SQL, NoSQL, caching, queues, CDN, blob, API gateway, rate limiter, search, service discovery, monitoring |
| 4 Patterns | p01–p19 | data (indexing, replication, sharding, consistent hashing, WAL, bloom), coordination (leader election, lock, gossip), resilience (retry+jitter, idempotency, circuit breaker, bulkhead, back pressure, cells), flow (pub/sub, CQRS, event sourcing, saga) |
| 5 Trade-offs | t01–t07 | the 7 `06_trade_offs` notes |
| 6 Method | m01–m06 | HLD thinking, 4-step framework + requirements, estimation + capacity planning, interaction patterns, ADRs, review checklist + red flags |
| 7 Case studies | c01–c11 | the 11 ✅ case studies |

`concerns` tags use the 5-axis vocabulary from `drillScore.js`: scalability, availability, latency, cost, consistency. They cut across tracks, the same way learn-claude-code's "layers" do.

The remaining vault folders (LLD, Java, company guides, projects, intermediate topics, real-world architecture, bridge) stay in the **Library** and are candidates for later tracks.

---

## 3. Architecture design

### 3.1 System overview

```mermaid
flowchart LR
  subgraph SRC[Source of truth · repo]
    C[course/&lt;track&gt;/&lt;id&gt;_*/<br/>README.md · sim.mjs · meta.json · images/]
    V[vault/system_design/**.md]
    PD[web/src/practice/data/*.js<br/>outages · bugs · drills · terms]
  end
  subgraph BUILD[Build · predev / prebuild]
    X[scripts/extractCourse.mjs]
    I[scripts/buildVaultIndex.mjs]
  end
  subgraph GEN[Generated · gitignored]
    CJ[course.json]
    VI[vaultIndex + per-folder chunks]
  end
  subgraph APP[Vite SPA · GitHub Pages]
    R[hash router]
    L[Lesson page]
    P[Practice gym]
    LIB[Library]
    ST[(localStorage<br/>progress · workspaces · FSRS)]
  end
  C --> X --> CJ --> R
  V --> I --> VI --> LIB
  C -. import.meta.glob lazy .-> L
  PD --> P
  CJ --> L
  L <--> P
  L --> LIB
  P <--> ST
  L <--> ST
  T[tests · vitest] -. contract .-> C
  T -. refs resolve .-> PD
  T -. sources exist .-> V
```

### 3.2 Modules and boundaries

| Module | Responsibility | Depends on | Must not |
|---|---|---|---|
| `course/**` | lessons + runnable sims | nothing (zero deps) | import from `web/` |
| `scripts/extractCourse.mjs` | folders → `course.json` (meta + README + sim source + derived stats) | `course/`, node stdlib | hand-maintain any order list |
| `scripts/buildVaultIndex.mjs` | vault → index + chunks (ported) | `vault/` | — |
| `web/src/course/` | lesson page, `FramePlayer`, `ParamPanel`, `DecisionList`, track map, timeline | `course.json`, lazy `sim.mjs` | contain chapter-specific logic, except ≤6 flagship heroes |
| `web/src/practice/` | ported gym (13 tools) + their data | `lib/*` sims/linter | know about chapters (chapters link *into* practice by id) |
| `web/src/library/` | NoteReader, LibraryView, markdown (+mermaid, hljs) | vault chunks | — |
| `web/src/lib/store.js` | one localStorage adapter + pub/sub (from `workspaces.js`) | — | — |

The linking rule is one-directional. A chapter's `meta.json` references practice ids (`outageRefs`, `bugScenarioIds`, `drillCaseIds`, `terms`). Practice renders standalone, so porting the gym needs no chapter knowledge.

### 3.3 Chapter contract (the invariant made concrete)

- **README.md skeleton.** `# id: Title — claim` · breadcrumb · `> *motto*` + concern chips · then these required sections: **The Problem**, **The Idea**, **How It Works**, **When It Breaks**, **The Trade-off**, **In The Wild**, **Try It**, **Say It In The Interview**, **Boundary**, **What's Next**, **Source notes**. The four middle beats mirror the architect's loop. Target size is 6–12 KB, distilled from the vault note.
- **sim.mjs:**
  - exports `PARAMS` (slider schema) and `run(params)`, which returns `{ frames:[{ beat:"constraints"|"component"|"failure"|"tradeoff", title, note, metrics, series? }], summary }`;
  - is deterministic (seeded RNG);
  - has a CLI main guard that prints frames as a table.
  - Existing libs are ported in as chapter sims: `trafficSim.js` → e01/b01, `failureSim.js` → p12/p13, `capacity.js` and `napkinCheck.js` → m03, linter rules → the "When It Breaks" examples.
- **meta.json:** `id, title, subtitle, motto, coreAddition, keyInsight, concerns[], uses[], sourceNotes[], outageRefs[], bugScenarioIds[], drillCaseIds[], terms[], decisions[{title, description, alternatives}]`.

### 3.4 Runtime

- **Routing.** A hand-rolled `useHashRoute()`, so GitHub Pages works with no 404 hacks:
  - `#/` home
  - `#/<id>` lesson (with `?tab=` for the active tab)
  - `#/tracks`, `#/timeline`
  - `#/practice/<tool>/<id?>`
  - `#/library/<path>`
- **Lesson page.**
  - Header: id, title, claim, concern chips, LOC, keyInsight.
  - Hero: `FramePlayer`, which steps through the 4 beats of `run(defaults)`.
  - Tabs:
    - **Learn**: the README.
    - **Simulate**: `ParamPanel` sliders → `run()`, debounced, on the main thread; sims are O(frames).
    - **Code**: the sim source.
    - **Practice**: embedded outage replay, bug hunt, drill and terms cards.
    - **Deep dive**: decisions with alternatives, plus source notes opening in NoteReader.
  - Prev/next navigation.
- **State.** Everything stays in localStorage. The new site keeps the old `hld-*` key names, and both sites are served from the same origin (`vibhu-0511.github.io`), so existing workspaces, notes and FSRS data **carry over with no migration code**. New keys are listed in §4.5.
- **Loading budget.** Initial JS should stay under 250 KB gzip. Sims, vault chunks, mermaid, highlight.js and Excalidraw all load lazily per route.

### 3.5 Theme: "Cloud" (from the Pickaxe screenshot, theme only, no branding)

| Token | Value | Notes |
|---|---|---|
| `--sky` | `#8FB3D4` | base of the background, **darkened after preview feedback** (v1 at `#BCD6EC` was too white and text washed out) |
| `--blush` | `#C9A3B6` | second cloud tone, more saturated |
| `--cloud` | `#FFFFFF` at 30–40% | blurred puffs: layered radial gradients + `filter: blur()` on one fixed backdrop layer; kept faint so they never sit behind body text at full white |
| `--ink` | `#0B0E13` | headings, primary button |
| `--ink-2` | `#1C2129` | body text; must be ≥ 7:1 on `--glass` over `--sky` |
| `--muted` | `#3F4652` | fine print; must be ≥ 4.5:1 |
| `--glass` | `rgba(255,255,255,.55)` + 1px `rgba(0,0,0,.14)` | inputs, cards, tab bar; body text always sits on glass, never on bare clouds |
| Primary button | `#161616` fill, white 600 text, radius 10px, full-width in forms | one per view |
| Input | glass fill, radius 14–18px, 40px tall | |
| Links | ink, 600, underlined | |
| Type | **Geist** (Google Fonts), 800 for display with tight tracking, 400/500 body; **Geist Mono** for code | |
| Layout | content floats on the sky; centered measure; the app window has 20px rounded corners | |
| Dark ("dusk") | sky `#141B27`, blush `#3A2838`, clouds white at 7%, glass white at 9%, ink `#F4F5F7`, ink-2 `#DDE1E6`, muted `#AEB5C0`, primary button inverts to white | |
| Status | light: ok `#1E6B3F`, hot `#8A5A00`, overloaded `#A61B1B` · dusk: `#7FD6A4` / `#F6C35B` / `#F28B82` | separate from the theme ink |

These are the values from the approved preview v2.

The background is one fixed, blurred cloud layer (no per-card blur), and it respects `prefers-reduced-motion` (no drifting clouds).

### 3.6 Quality gates

`tests/course.test.js` (vitest) checks every chapter for:
- required files and README sections in order;
- README `// sim.mjs` excerpts appearing verbatim in the sim;
- a valid meta shape;
- `sourceNotes` existing in the vault;
- practice refs resolving;
- `run(defaults)` being deterministic, covering all 4 beats, and producing no NaN.

The ported unit tests (8 files) stay. CI runs `npm ci && npm test && npm run build`; Pages deploys `main`.

---

## 4. Build design (preview v2 approved)

### 4.1 Bootstrap

- The local folder is `C:\Users\vibha\Downloads\data\personal\learn-system-design`. The `includeIf` in `~/.gitconfig` gives it the vibhu-0511 identity automatically.
- Run `gh auth switch --user vibhu-0511`, then `gh repo create vibhu-0511/learn-system-design --public`. The remote is `https://vibhu-0511@github.com/vibhu-0511/learn-system-design.git`.
- Take a read-only clone of the old repo into the scratchpad and copy files from it. No history is carried over; the new repo starts fresh.

### 4.2 File tree (NEW = written fresh, PORT = copied then adjusted)

```
learn-system-design/
  package.json            NEW   scripts below; deps = old deps (no additions); @vitejs/plugin-react → devDeps
  vite.config.js          NEW   root:"web", publicDir:"web/public", build.outDir:"../dist", base from VITE_BASE_PATH,
                                server.fs.allow:[".."] so web/ can import ../course/**/sim.mjs
  vitest.config.js        NEW   include: tests/**, web/src/**/__tests__/**
  vault.config.mjs        PORT  drop the hard-coded author path
  README.md  CONTRIBUTING.md  LICENSE  .gitignore(NEW: dist, web/src/data/generated, web/public/course-assets)
  course/1_fundamentals/f01_client_server/{README.md,sim.mjs,meta.json,images/}  … 67 folders
  vault/system_design/**  PORT  unchanged
  scripts/buildVaultIndex.mjs  PORT  output → web/src/data/generated/{vaultIndex.generated.json, vault/*.generated.json}
  scripts/extractCourse.mjs    NEW
  tests/course.test.js         NEW   contract tests
  .github/workflows/test.yml   NEW   npm ci → npm test → npm run build (on PRs + main)
  .github/workflows/deploy-pages.yml  PORT  unchanged
  .claude/launch.json          NEW   {name:"site", runtimeExecutable:"npm", runtimeArgs:["run","dev"], port:5173}
  Dockerfile nginx.conf        PORT  COPY paths updated
  web/index.html               NEW   Geist + Geist Mono <link>, #root
  web/src/
    main.jsx                   PORT  boot error text renamed
    App.jsx                    NEW   <CloudBackdrop/><TopBar/> + route switch + ErrorBoundary per route (~100 lines)
    router.js                  NEW   parseHash(), useHashRoute(), href(route), navigate(route)
    store.js                   NEW   useLocal(key, init) (the old App's useLocalStorage moves here) + progress API
    theme.css                  NEW   §3.5 tokens (light + dusk), .glass/.pbtn/.chip/.tab primitives, the backdrop
    styles.css                 PORT  plus one alias block at the top mapping old token names → theme tokens,
                                     so ported views restyle without per-component edits
    ui/TopBar.jsx              NEW   logo · Home · Tracks · Practice · Library · search · dusk toggle
    ui/ErrorBoundary.jsx       PORT  (TabErrorBoundary)
    course/courseData.js       NEW   course.json → getChapter(id), getTrack(n), neighbors(id), search(q)
    course/loadSim.js          NEW   import.meta.glob("../../../course/**/sim.mjs") → loadSim(id)
    course/HomePage.jsx        NEW   hero glass card, track chips → chapter chips, continue button
    course/LessonPage.jsx      NEW   header + <FramePlayer/> + tabs + prev/next
    course/FramePlayer.jsx     NEW   props {frames, hero?}: 4 beat pills, ←/→, default stage renderer
    course/ParamPanel.jsx      NEW   props {params, values, onChange}: sliders from the PARAMS schema
    course/tabs/{Learn,Simulate,Code,Practice,DeepDive}Tab.jsx  NEW
    course/heroes/index.js     NEW   lazy map {b04, b05, p03, p10, p13, e01} → custom stage renderers
    course/TracksPage.jsx TimelinePage.jsx  NEW
    practice/PracticeHub.jsx   NEW   tool grid (the preview's Practice screen)
    practice/PracticeRoute.jsx NEW   tool id → ported view, adapting old callbacks:
                                     onOpenNote(p)→navigate(library,p) · onJumpToTab(t)→navigate(practice,t) ·
                                     onSelectX(id)→navigate(practice,tool,id)
    practice/views/*.jsx       PORT  all *View.jsx, DrillWizard, DrillApproachScaffold, SketchPanel, AiReviewPanel,
                                     LevelPicker, StarterPathToday, LessonView, plus the views that were inline in the
                                     old App.jsx (NotesView, VocabView + TermCard + Flashcards, ReviewView, ProposalView),
                                     extracted into their own files verbatim
    practice/data/*.js         PORT  all of src/data except vaultIndex.js (→ library/)
    practice/lib/*.js          PORT  all of src/lib except markdown.js, vaultLoader.js (→ library/); __tests__ move with them
    library/{LibraryView,NoteReader,SourceNoteLink,VaultMap}.jsx  PORT  onOpenNote → navigate
    library/{markdown,vaultLoader,vaultIndex}.js  PORT  glob path → ../data/generated/vault/*.generated.json
    data/generated/            (gitignored build output)
```

Dropped: the level-picker gate (the course is now the onboarding; LevelPicker only appears inside Practice › Today on its first visit), `vercel.json`, `netlify.toml`, `docker-compose.yml`, `BUILD_PLAN.md`, and the `hld-active-*` tab keys (the URL replaces them).

### 4.3 Routes

| Hash | Component | Data |
|---|---|---|
| `#/` | HomePage | courseData, progress |
| `#/tracks` · `#/timeline` | TracksPage · TimelinePage | courseData |
| `#/<id>` (`?tab=learn\|simulate\|code\|practice\|deep`) | LessonPage | getChapter(id), loadSim(id) |
| `#/practice` | PracticeHub | — |
| `#/practice/<tool>/<itemId?>`; tool ∈ today, skills, drill, napkin, bugs, outage, failure, capacity, workspaces, review-queue, review, proposal, notes, vocab | PracticeRoute → ported view | ported data |
| `#/library/<notePath?>` | LibraryView | vault index + chunks |

### 4.4 Generated `course.json` (split in P1; see TASKS.md §0.4)

Light index, `web/src/data/generated/course.json`:
```
{ generatedAt,
  tracks: [{ n, slug, title, motto, ids[] }],
  chapters: { [id]: { ...meta, track, dir, prev, next, loc, paramKeys[], frameCount, images[] } },
  concerns: { [concern]: ids[] } }
```
Heavy per-chapter body, `web/src/data/generated/chapters/<id>.json`, lazy-loaded per lesson:
```
{ readme /* links rewritten */, simSource }
```
The split keeps the initial bundle under budget: 67 inline READMEs would not fit.

The extractor runs these steps:
1. glob `course/*/[a-z][0-9][0-9]_*`;
2. read meta, README and sim;
3. `import()` each sim to read `PARAMS` and `run(defaults).frames.length`;
4. rewrite links (`../b05_*/` → `#/b05`, `images/x` → `course-assets/<id>/x`, `vault/<path>.md` → `#/library/<path>`);
5. copy images into `web/public/course-assets/<id>/`;
6. derive prev/next from the sorted global order F → E → B → P → T → M → C.

It **fails the build** on a duplicate id or an invalid `meta.json`.

### 4.5 localStorage keys

| Key | Owner | Status |
|---|---|---|
| `lsd-progress` `{done:[ids], last:id, visitedAt:{id:iso}}` | store.js | NEW |
| `lsd-theme` `"light"\|"dusk"` (default from `prefers-color-scheme`) | store.js | NEW (replaces `hld-theme`) |
| `lsd-sim-<id>` last slider values | SimulateTab | NEW |
| `hld-workspaces`, `hld-personal-notes`, `hld-streak`, `hld-level`, `hld-starter-progress`, FSRS review-queue key(s), `hld-napkin-*`, sketch keys | ported modules | KEPT, same names, so the old site's data shows up automatically |
| `hld-active-tab`, `hld-active-*`, `hld-napkin-open`, `hld-review-open` | — | no longer read (the route replaces them) |

### 4.6 Contract tests (`tests/course.test.js`)

For each chapter folder:
- **files:** README.md, sim.mjs and meta.json exist;
- **README:**
  - line 1 matches `^# <id>: .+ — .+`;
  - line 3 is the breadcrumb;
  - the `##` headings appear in the §3.3 order;
  - every fenced block tagged `// sim.mjs` appears verbatim in sim.mjs;
- **meta:**
  - required keys and types are present; `id` matches the folder;
  - `concerns` ⊆ the 5 axes;
  - `sourceNotes` exist in the vault;
  - `outageRefs` / `bugScenarioIds` / `drillCaseIds` resolve against the ids in `practice/data` (`OUTAGE_REPLAYS`, `BUG_SCENARIOS`, `DRILL_CASES`), and `terms` resolve against `ALL_TERMS[].term`. Exact export names get checked in P1;
  - `uses` ids exist and come earlier in the order;
- **sim:**
  - exports `PARAMS` + `run`;
  - defaults sit within min/max;
  - `run(defaults)` deep-equals a second call;
  - the frames' beats cover all 4 in order, with no NaN or undefined metrics;
- **global:** no duplicate ids, and the track counts match §2.

### 4.7 package.json scripts

`index:vault`, `extract`, `predev`/`prebuild` = `npm run index:vault && npm run extract`, `dev` = `vite`, `build` = `vite build`, `preview` = `vite preview`, `test` = `vitest run`.

## 5. Phases (a commit per phase; ✋ = stop for the user)

- **P1 Scaffold.** Repo, deps, Vite and vitest config, the ported indexer, the extractor, `router.js`, `store.js`, `theme.css`, TopBar, and an empty HomePage showing the cloud theme. CI and Pages are set up, and one placeholder chapter keeps the tests meaningful. *Exit:* `npm test` and `npm run build` pass, and the Pages URL shows the themed home page.
- **P2 Pilot ✋.** Write f04, b04 and p10 end to end (README distilled from the vault, sim.mjs, meta.json), plus the LessonPage with all 5 tabs, FramePlayer, ParamPanel and the b04 custom hero. *Exit:* contract tests pass, the preview checks in §6 pass, and the user reviews the live pages.
- **P3 Port the gym and Library.** Move files per §4.2, then PracticeRoute and the styles alias block. *Exit:* the 8 ported unit tests pass; every practice tool opens, and outage/bug/drill links from b04 land on the right item.
- **P4 Author the tracks** F → E → B → P → T → M → C, one commit per track (the 64 remaining chapters). Heroes e01, b05, p03 and p13 land with their tracks. *Exit:* contract tests pass after each track.
- **P5 Finish.** TracksPage + TimelinePage, the root README (thesis, track mottos, mermaid learning path, quick start, and a table mapping old tabs to new locations), CONTRIBUTING, deploy, and a link from the old repo's README to the new one (the old app stays live).

## 6. Verification

- `npm test` passes.
- `node course/3_building_blocks/b04_caching/sim.mjs` prints the 4 beats.
- `npm run build` passes.
- In the browser pane via `preview_start`, check:
  - `#/b04`: all 5 tabs work, and moving the Simulate slider changes the metrics;
  - Practice opens the linked outage;
  - a Library note renders mermaid;
  - the layout holds at 375 px and in dusk mode;
  - there are no console errors.
- After push: CI is green and the Pages URL serves `#/b04`.
