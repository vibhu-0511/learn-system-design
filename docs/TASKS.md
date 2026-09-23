# learn-system-design: phases and tasks (handoff)

This is the execution plan for building `learn-system-design`. The **what and why** is in [PLAN.md](PLAN.md), the approved design. This file covers **how**: ordered tasks, the context each one needs, when it counts as done, and what to review.

It contains no code on purpose. Each task names the files, contracts and checks involved; you write the implementation.

---

## 0. Read this first

### 0.1 Sources you will work from

| Source | Where | Use it for |
|---|---|---|
| Approved design | `docs/PLAN.md` (§ numbers below refer to it) | Contracts, file tree, routes, theme tokens, store keys |
| Old app (to port) | `https://github.com/vibhu-0511/hld-architect-copilot` | Vault, indexer, practice views, data, libs, tests, styles |
| Reference course | `https://github.com/shareAI-lab/learn-claude-code` | How a chapter README reads (look at `s01_agent_loop/README.md` and `s08_context_compact/README.md`), the content extractor idea (`web/scripts/extract-content.ts`), contract tests (`tests/test_chapter_readmes.py`) |
| Approved visual | Preview v2 in the planning conversation; tokens copied into PLAN.md §3.5 | Theme values: sky `#8FB3D4`, glass panels, black pill buttons, Geist |

### 0.2 Ground rules

- **Stay minimal.** Write the smallest code that meets each task. Add **no new npm dependencies**: the plan uses only the old app's deps, and routing is hand-rolled. Build nothing speculative.
- **One commit per phase at minimum** (per track in P4). Messages should say what shipped and end with the attribution line your harness requires.
- **Git identity.** The project lives under `C:\Users\vibha\Downloads\data\personal\`, so the `includeIf` in `~/.gitconfig` sets the vibhu-0511 identity. Before **every** push, run `gh auth switch --user vibhu-0511`. The active gh account keeps flipping back to vibhanshu-dutt on this machine, and that account can't push here.
- **Environment.** Windows 11. PowerShell is the primary shell, Git Bash is also available. Node 20+ is required, matching CI and the old Dockerfile.
- **Stop points (✋).** After P2, stop and ask the user to review before mass authoring. Also ask before any action that touches the **old** repo (P5.5).
- **Verify before claiming done.** Every task has a "Done when". Run the checks and report actual results, including failures.
- **Never edit the vault notes.** They're the user's source material. Chapters *distill* them; the vault is copied unchanged.

### 0.3 Status board (update as you go)

| Phase | Status | Commit |
|---|---|---|
| P1 Scaffold | in progress (P1.1–P1.7, P1.9 done; P1.8 CI/Pages pending) | |
| P2 Pilot (f04, b04, p10) ✋ | todo | |
| P3 Port gym + Library | todo | |
| P4-F Fundamentals (8) | todo | |
| P4-E Evolutions (4) | todo | |
| P4-B Building blocks (12) | todo | |
| P4-P Patterns (19) | todo | |
| P4-T Trade-offs (7) | todo | |
| P4-M Method (6) | todo | |
| P4-C Case studies (11) | todo | |
| P5 Finish + deploy | todo | |

### 0.4 Deviations and discoveries (read before P2)

These differ from what PLAN.md or the tasks below say. Where they conflict, **this list wins**.

1. **`course.json` is split** (fixes a bundle-budget problem). The index `web/src/data/generated/course.json` holds tracks, chapter meta, prev/next, `loc`, `paramKeys`, `frameCount` and `images`. Each chapter's `readme` and `simSource` live in `web/src/data/generated/chapters/<id>.json`, to be lazy-loaded per lesson (via `import.meta.glob`, like the vault chunks). PLAN §4.4 described one file with everything; 67 READMEs inline would break the 250 KB initial-JS budget. `courseData.js` currently exposes only the index; P2.5 adds the body loader.
2. **Shared contract module.** `scripts/courseContract.mjs` holds the chapter contract (README section order, concern axes, beats, track counts, `validateMeta`). Both `extractCourse.mjs` and `tests/course.test.js` import it. Change rules there, once.
3. **Optional `track.json`** in each track folder (`{ "title", "motto" }`) supplies the display title (for example "Trade-offs") and motto. Without it the title is derived from the folder name. Create one when you create a track folder in P4. Track 1 has it already.
4. **Completeness test is gated.** The "all 67 chapters exist" test runs only when `COURSE_COMPLETE=1`. P5.4 must turn it on in CI. Until then the tests only check that counts do not exceed the plan.
5. **Practice-reference checks are skipped until P3** (the test name says so). The real ids, taken from the old app's data files, are:
   - Outage replays (`OUTAGE_REPLAYS[].id`, 25): `aws_s3_2017, facebook_bgp_2021, cloudflare_regex_2019, crowdstrike_2024, github_db_2018, gitlab_2017, knight_capital_2012, tsb_2018, fastly_2021, roblox_2021, slack_db_2024, southwest_2022, discord_db_2024, aws_us_east_2021, google_cloud_2022, cloudflare_2025, dyn_dns_2016, leftpad_2016, youtube_2018, salesforce_dns_2021, atlassian_2022, reddit_2023, datadog_2023, unitedhealth_2024, openai_dns_2024`.
   - Bug scenarios (`BUG_SCENARIOS[].id`, 6): `checkout-double-charge, photo-gallery-overload, notification-firehose, search-via-sql, iot-ingest-overload, premature-microservices`.
   - Drill cases (`DRILL_CASES[].id`, 12): `url-shortener, notification-service, chat, food-delivery, search-autocomplete, payment-system, ticketmaster, google-docs, video-streaming, web-crawler, logging-pipeline, google-maps`.
   - Terms (`ALL_TERMS[].term`): exact display strings such as `Latency`, `Client-Server Model`.
   - The short names in the P4 tables ("Fastly 2021", "Maps", "Autocomplete") map onto these ids. Always use the ids in `meta.json`.
6. **The old repo has no LICENSE file** (its README says MIT). P1 created an MIT `LICENSE` with holder `vibhu-0511`.
7. **Vault has 265 notes**, not 255 as the old README says. The indexer reports 265 notes in 19 chunks.
8. **Repo is private for now** (the user's choice at P1.1). GitHub Pages is unavailable on a free account for private repos, so the "Pages URL is live" checks in P1.8 and P5.6 wait until the repo is made public. `deploy-pages.yml` is kept but its behaviour is noted in P1.8's result.
9. **Home page has a working chapter search box** (title, claim, motto, concerns) because a dead input is worse than none. TopBar search over vault notes is still P5.2.
10. **Preview tooling caveat.** The browser tool's `preview_start` with a config *name* read `personal/.claude/launch.json` (a different project's Forge dev server) instead of this project's. Start the site with `npm run dev` yourself, then open `http://localhost:5173` with `preview_start` using a `url`. Stop any wrong server it started.
11. **Sims must guard the CLI entry** without importing Node modules: see the placeholder `f04/sim.mjs` for the pattern that works in Node (including Windows paths) and in the browser. A contract test rejects `node:` imports and `require(`.
12. **Git identity**: inside this folder the identity resolves to `vibhu-0511` with email `vibhanshu.0511@gmail.com` (from `personal/.gitconfig`).

---

## P1: Scaffold

**Goal:** a working, deployable empty shell in the approved theme, with the vault indexed, the extractor and contract tests in place, and CI green.

### P1.1 Create the repo
- **Context:** the folder `learn-system-design/` already exists and holds `docs/`. The plan says the GitHub repo is `vibhu-0511/learn-system-design`, public.
- **Do:**
  1. Initialize git in the existing folder.
  2. Switch gh to vibhu-0511 and create the public repo.
  3. Set the remote with the username embedded in the URL (see PLAN §4.1).
  4. Default branch is `main`.
- **Done when:** `git remote -v` shows the vibhu-0511 URL, and `git config user.name` inside the folder shows vibhu-0511's identity.
- **Watch out:** confirm with the user once before creating the public repo if they haven't already said go for this step. Creating a repo is outward-facing.

### P1.2 Bring over the old assets
- **Context:** PLAN §4.2 marks every PORT item.
- **Do:**
  1. Clone the old repo into a temporary folder **outside** the project; read-only, never commit there.
  2. Copy `vault/system_design/**` unchanged, plus `scripts/buildVaultIndex.mjs`, `vault.config.mjs`, `Dockerfile`, `nginx.conf`, `LICENSE` and `.github/workflows/deploy-pages.yml`.
  3. In `vault.config.mjs`, remove the hard-coded author path from the candidate list.
- **Done when:** the vault has the same file count as the old repo (≈265 `.md` files, 18 folders plus 4 root notes).
- **Watch out:** only the P1 files come over now. Don't copy the practice views, data or libs yet; they move in P3, into the new folder layout.

### P1.3 Package, Vite and Vitest config
- **Context:** PLAN §4.2 (config rows) and §4.7 (scripts).
- **Do:**
  - Create `package.json` with the old app's runtime deps and move `@vitejs/plugin-react` to devDependencies. Add the scripts from §4.7, where `predev`/`prebuild` run the vault indexer and then the course extractor.
  - Vite config:
    - `root` is `web`, `publicDir` is `web/public`, and output goes to `dist/` at the repo root;
    - `base` comes from `VITE_BASE_PATH`;
    - the dev server must be allowed to read files one level above `web/`, because the site imports `course/**/sim.mjs` from outside its root.
  - Vitest includes `tests/**` and `web/src/**/__tests__/**`.
  - `.gitignore` covers `node_modules`, `dist`, `web/src/data/generated`, `web/public/course-assets`.
- **Done when:** `npm install` succeeds and `npm run build` gets past config loading. It can fail later for lack of pages.

### P1.4 Point the indexer at the new output folder
- **Context:** the old indexer writes to `src/data/vaultIndex.generated.json` and `src/data/vault/*.generated.json`.
- **Do:** change both output locations to `web/src/data/generated/`, keeping the same file names. Leave the parsing logic untouched.
- **Done when:** `npm run index:vault` reports ≈255 notes and writes about 19 folder chunks under `web/src/data/generated/vault/`.
- **Review:** the file totals match the old app's P0 log (255 notes, 22 folders parsed).

### P1.5 Course extractor
- **Context:** PLAN §4.4 has the `course.json` shape and the six extractor steps. The reference idea is learn-claude-code's `extract-content.ts`, but ours imports the sims instead of regex-parsing them.
- **Do:**
  1. Walk `course/<n>_<track>/<id>_<slug>/`.
  2. Read `meta.json`, `README.md` and `sim.mjs` for each chapter, and dynamically import the sim to read `PARAMS` and the frame count of `run(defaults)`.
  3. Rewrite README links: sibling chapter folders → `#/<id>`, `images/…` → `course-assets/<id>/…`, vault note links → `#/library/<path>`.
  4. Copy images and derive prev/next.
  5. Write `web/src/data/generated/course.json`.
- **Done when:** with one placeholder chapter, the extractor writes valid JSON and exits 0. With a broken `meta.json` or a duplicate id it exits non-zero with a clear message naming the folder.
- **Watch out:**
  - Windows paths. Normalize separators before building ids and links, and import sims by file URL, not raw path.
  - The global order is tracks 1→7, then chapter id within each track. Folder sort handles this if track folders are prefixed `1_`…`7_`.
  - Image URLs must work under the Pages base path. The renderer (P2) prefixes the base URL, so the extractor emits base-relative paths with no leading slash.

### P1.6 Contract tests + one placeholder chapter
- **Context:** PLAN §4.6 lists every check. The chapter contract is PLAN §3.3.
- **Do:**
  - Write `tests/course.test.js` covering every §4.6 check. Checks that depend on practice data (outage, bug, drill and term ids) should **skip with a clear reason** until P3 brings the data over; don't let them silently pass.
  - Add one placeholder chapter so the tests have something to run on. Use the real f04 folder name, and replace its content in P2.
- **Done when:** `npm test` passes. A deliberately broken README heading order makes it fail, with a message naming the chapter and the missing heading. Revert that test edit afterwards.
- **Review:** the "README excerpt ≡ sim.mjs" check is the most important one; it's the anti-drift guard that learn-claude-code lacked. Test it with a mismatched excerpt.

### P1.7 Web shell in the cloud theme
- **Context:** PLAN §3.4 (routing, state), §3.5 (tokens), §4.2 (`web/src` files), §4.3 (routes), §4.5 (store keys).
- **Do:**
  - **`web/index.html`:** Geist and Geist Mono from Google Fonts.
  - **`main.jsx`:** port it, renaming the boot-error title.
  - **`router.js`:** parse the hash into `{name, params, query}`, provide a hook that re-renders on `hashchange`, and a navigate helper.
  - **`store.js`:** the old app's `useLocalStorage` becomes `useLocal`, plus the progress API over `lsd-progress`. Wrap every storage call in try/catch.
  - **`theme.css`:**
    - both palettes: light by default, dusk under `[data-theme="dusk"]`;
    - one fixed cloud backdrop layer (blurred radial gradients), static when `prefers-reduced-motion`;
    - the `.glass` / `.pbtn` / `.chip` / `.tab` primitives.
  - **`TopBar`:** logo mark plus Home, Tracks, Practice, Library, a search box (a stub is fine now) and the dusk toggle, stored in `lsd-theme`.
  - **`App.jsx`:** a route switch with an error boundary per route.
  - **HomePage:** the approved layout. The headline sits on the sky; the intro, search, primary button and link sit in one glass card, with track chips below.
- **Done when:** `npm run dev` shows the themed home page in the browser preview, with no console errors. Dusk mode works. At 375 px wide there's no horizontal scroll.
- **Review:** body text only ever sits on glass, never directly on the clouds. That rule came straight from the user's feedback: preview v1 was too white to read.

### P1.8 CI and Pages
- **Do:**
  - Add `.github/workflows/test.yml`: install, test, build, on pushes to `main` and on PRs. Keep the ported `deploy-pages.yml`.
  - Push, then enable Pages with "GitHub Actions" as the source. Use the `gh` API if permitted; otherwise ask the user to flip it in repo Settings.
- **Done when:** both workflows are green and `https://vibhu-0511.github.io/learn-system-design/` serves the themed home page.
- **Watch out:** the build step needs `VITE_BASE_PATH=/learn-system-design/`, which the ported workflow already derives from the repo name.

### P1.9 Local preview config
- **Do:** add `.claude/launch.json` with the dev-server entry from PLAN §4.2, so future sessions can open the browser preview by name.
- **Done when:** the browser preview starts the site by that name.

**P1 exit review:**
- clean clone → `npm ci` → `npm test` → `npm run build` all pass;
- the Pages URL is live;
- nothing copied from the old repo besides the P1.2 files;
- commit made and pushed.

---

## P2: Pilot (3 chapters, full lesson page) ✋

**Goal:** prove the whole chapter pipeline and the lesson page on three chapters from three tracks before authoring 64 more.

### P2.1 Chapter authoring recipe (applies to every chapter in P2 and P4)

Treat this recipe as the definition of a chapter. Follow it every time.

1. **Read the source note fully.** The vault ✅ notes follow a fixed structure: *Intuition → Failure-First Scenario → Working Knowledge → Deep Dive → Production Considerations → Real-World Examples → Interview Preparation → Quick Reference → The "Why" Chain → Links*.
2. **Map the note onto the README sections (PLAN §3.3):**
   - The Problem ← *Failure-First Scenario*, rewritten in the second person with concrete numbers.
   - The Idea ← *Intuition*, plus one diagram. Prefer mermaid; an SVG in `images/` also works.
   - How It Works ← *Working Knowledge*, as numbered steps. Each step pairs with a real excerpt from `sim.mjs` whose fenced block starts with the `// sim.mjs` marker.
   - When It Breaks ← *pitfalls* / failure modes, plus linter rules from the old `drillLinter.js` where they apply.
   - The Trade-off ← decision tables / *when not to use*.
   - In The Wild ← 1–2 items from *Real-World Examples*, plus the linked outage replay.
   - Try It ← the exact `node …/sim.mjs` command with flags, and the output the learner should see.
   - Say It In The Interview ← *Three things to always mention*, or the top of *Interview Preparation*.
   - Boundary ← one sentence on what this chapter deliberately doesn't cover and which chapter does.
   - What's Next ← the limitation that motivates the next chapter, phrased as a question.
   - Source notes ← the vault paths used.
3. **Header lines:**
   - line 1 is `# <id>: <Title> — <claim>`, where the claim is a sentence, not a label;
   - line 3 is the breadcrumb within the track;
   - then the motto blockquote and concern tags.
4. **Size:** 6–12 KB. Cut Java code, vendor configs and long monitoring sections; those stay in the vault, one click away in the Library.
5. **sim.mjs** (zero dependencies, runs in both Node and the browser):
   - `PARAMS` is a slider schema: min, max, step, default, label, and unit where it helps.
   - `run(params)` returns frames covering the four beats **in order**: constraints → component → failure → trade-off. Each frame has a title, a one-sentence note and numeric metrics.
   - Deterministic: use a small seeded PRNG, never unseeded randomness.
   - The CLI guard prints the frames as a readable table. It must work on Windows and must not break the browser import: no top-level Node-only imports, and the "am I the main module" check must not throw when `process` is undefined.
   - Model the idea, not reality. Use round numbers and state assumptions in comments.
6. **meta.json:**
   - Fill every field in PLAN §3.3.
   - `decisions` needs at least one entry, each with a real rejected alternative.
   - `concerns` come from the five axes only.
   - `uses` lists earlier chapter ids this one builds on.
   - Practice refs (`outageRefs`, `bugScenarioIds`, `drillCaseIds`, `terms`) must be **real ids from the ported data files**. Check them, don't guess (see P3.1).
7. **Self-review before moving on:**
   - `npm test` passes;
   - `node <sim>` output matches the README "Try It" block;
   - the lesson page renders all 5 tabs;
   - read the README top to bottom as a learner: does the Problem make you want the Idea?

**Definition of done for one chapter:** it follows the recipe, passes the contract tests, its sim output matches the README, all 5 tabs render in the browser preview, and the lesson is readable in both themes.

### P2.2 Write f04 Latency & throughput
- **Source:** `01_fundamentals/latency_and_throughput.md`.
- **Sim idea:** a queue with arrival rate vs. service rate. Show p50/p99 latency and throughput as load rises, and latency blowing up as utilization nears 1. The trade-off beat is batching: throughput goes up, per-request latency goes up too.
- **Boundary:** with t02 (latency vs throughput *as a design decision*). f04 defines and measures; t02 chooses.

### P2.3 Write b04 Caching
- **Source:** `02_building_blocks/caching.md`.
- **Sim idea:** the approved preview's model. Read QPS, hit rate and DB capacity give DB load, average latency and status. The beats are: no cache → cache-aside at 80% → cold-cache stampede → TTL raising hit rate at the cost of staleness. Use the preview's numbers so the lesson matches what the user approved.
- **Practice refs to confirm:** the `photo-gallery-overload` bug scenario, the URL-shortener drill case, the Fastly outage replay, and cache-related terms.
- **Custom hero:** yes. Clients → cache → DB boxes with a DB load bar, as in the preview.

### P2.4 Write p10 Retry with backoff + jitter
- **Source:** `03_design_patterns/retry_with_backoff.md` (722 lines; the note already includes the thundering-herd charts).
- **Sim idea:** N clients retrying after a burst of failures. Compare fixed retry, exponential backoff and exponential backoff with full jitter by server load per second and time to recover. The trade-off beat is the retry budget.
- **Custom hero:** a retry-timeline strip (deferred to P4 if time is short; the default renderer is acceptable for the pilot).

### P2.5 Lesson page and generic components
- **Context:** PLAN §3.4 (the lesson page), §4.2 (component files and props), §4.3 (routes).
- **Do:**
  - **courseData:** getChapter, getTrack, neighbors, search.
  - **loadSim:** a lazy glob import of the sims, keyed by id.
  - **FramePlayer:** beat pills, prev/next and a default stage renderer that shows frame metrics as labelled values with status colors. It takes an optional custom hero.
  - **ParamPanel:** sliders generated from `PARAMS`.
  - **Tabs:**
    - **Learn** renders the README through the ported markdown renderer (port `markdown.js` now, not in P3; mermaid and highlight.js must lazy-load);
    - **Simulate** is ParamPanel + live `run()` + metric tiles, with values remembered in `lsd-sim-<id>`;
    - **Code** is the highlighted sim source;
    - **Practice** shows cards linking to `#/practice/<tool>/<id>` (these land on a "coming in P3" state until then);
    - **Deep dive** shows decisions with alternatives, plus source-note chips linking to `#/library/…`.
  - **Page chrome:** the header from meta (id pill, title, claim, concern chips, LOC, keyInsight), prev/next nav, and marking the chapter visited in progress.
- **Done when:** `#/f04`, `#/b04` and `#/p10` work end to end, the `?tab=` query survives a reload, and the Continue button on Home reopens the last visited chapter.
- **Watch out:**
  - course-asset image URLs must include the Vite base URL, or they break on Pages.
  - Keep sims on the main thread; they're tiny. Debounce slider updates slightly.

### P2.6 Verify and hand back ✋
- **Checks** (PLAN §6), in the browser preview:
  - all 5 tabs on each pilot chapter;
  - the slider changes metrics;
  - both themes;
  - 375 px width;
  - no console errors.
- **Report to the user:** the live Pages link for `#/b04`, a screenshot, and anything you had to decide that the plan didn't cover.
- **Stop.** Wait for approval, or changes to the recipe, before P3/P4. Recipe changes are cheap now and expensive after 64 chapters.

---

## P3: Port the practice gym and Library

**Goal:** every tool from the old app works inside the new shell, reachable from the Practice hub and from chapter Practice tabs.

### P3.1 Move data, libs and their tests
- **Context:** PLAN §4.2 (practice/data, practice/lib, library/).
- **Do:**
  1. Copy the old `src/data/*.js` (except `vaultIndex.js`) to `web/src/practice/data/`, and the old `src/lib/*.js` (except `markdown.js` and `vaultLoader.js`, which P2 already moved to `library/`) to `web/src/practice/lib/`, together with `__tests__/`.
  2. Fix the import paths.
  3. Record the **exported id lists** (outage replays, bug scenarios, drill cases, terms) in a short comment at the top of the contract test.
  4. Un-skip the practice-ref checks from P1.6.
- **Done when:** the 8 ported unit test files pass, and the contract test now validates the refs in f04/b04/p10.
- **Watch out:** the outage replay ids may not equal the vault file names; the contract test must use the ids from the data file. Also correct any pilot meta refs that were guessed.

### P3.2 Extract the inline views from the old App.jsx
- **Context:** the old `App.jsx` holds five views inline: NotesView, VocabView (with TermCard and Flashcards), ReviewView and ProposalView, plus the sample brief.
- **Do:** move each into its own file under `practice/views/`, keeping the behavior and storage keys identical.
- **Done when:** each renders standalone with the same features as the old app.

### P3.3 Move the remaining views + PracticeRoute adapter
- **Context:** the old views take callbacks (`onOpenNote`, `onJumpToTab`, `onSelectCase` / `onSelectOutage` / `onSelectScenario`, `onOpenWorkspace`) and "active id" props that used to come from `hld-active-*` keys.
- **Do:**
  1. Copy every `*View.jsx` and its helpers into `practice/views/`.
  2. Build PracticeRoute, which maps a tool id to its view and turns each callback into navigation:
     - opening a note → Library route;
     - jumping to a tab → a practice tool route;
     - selecting a case, outage or scenario → the same tool with that item id;
     - opening a workspace → the matching tool and item.
  3. Active ids come from the route, not storage.
  4. Build PracticeHub: the tool grid from the preview.
- **Done when:** all 14 tools in the PLAN §4.3 routes table open. Deep links like `#/practice/outage/<id>` open straight to that item. Browser back/forward works across tool changes.
- **Watch out:**
  - Don't change workspace, notes or FSRS data shapes or key names. The old site on the same origin still reads and writes them.
  - LevelPicker no longer gates the app. Show it inside Today only when `hld-level` is unset.
  - Excalidraw (the sketch panel) must stay lazy-loaded; it's the heaviest dependency.

### P3.4 Library
- **Do:** port LibraryView, NoteReader, SourceNoteLink and VaultMap. Point the vault loader glob at the generated folder, and route note opening through `#/library/<path>`.
- **Done when:** any vault note opens by URL, mermaid and code highlighting render, backlinks work, and chapter source-note chips land on the right note.

### P3.5 Restyle the ported views with the theme
- **Context:** the old `styles.css` (≈79 KB) has its own light/dark tokens.
- **Do:**
  - Port `styles.css`, and add **one alias block at its top** mapping the old variable names onto the new theme tokens.
  - Remove any old full-page background so the cloud backdrop shows through.
  - Make panels use the glass treatment.
  - Fix only the obvious breakages; don't restyle views one by one.
- **Done when:** every practice tool is readable in light and dusk: text on glass, and nothing white-on-white or black-on-black.
- **Review:** screenshot each tool in both themes, and check the drill wizard, outage reveal and capacity lab especially. They're the densest screens.

### P3.6 Security and privacy check on ported features
- The AI review panel takes a user-supplied API key. Confirm where it's stored and that it's never logged, put in a URL, or sent anywhere except the chosen provider endpoint. Keep the old behavior and don't widen it.
- Confirm nothing in the new shell sends localStorage contents anywhere.

**P3 exit review:**
- `npm test` is green, including the ported suites;
- b04's Practice tab opens its real outage, bug scenario and drill;
- old-site data (workspaces, notes) shows up on the new site on Pages, since they share an origin;
- commit and push.

---

## P4: Author the tracks

**Goal:** the remaining 64 chapters, one track per commit, each following the P2.1 recipe. Tests must be green after every track.

**Per-track routine:**
1. Create the track folder (`<n>_<slug>`).
2. Write the chapters in id order, following the recipe.
3. Run the contract tests.
4. Open every chapter of the track in the browser preview: all 5 tabs, both themes.
5. Commit and push.
6. Update the status board.

The tables below give each chapter's source note, a sim idea (a suggestion, not a spec) and practice refs to **verify against the data files** before using them.

### P4-F: Fundamentals (`1_fundamentals/`)

| Id | Folder slug | Source note (`01_fundamentals/`) | Sim idea | Notes / refs to verify |
|---|---|---|---|---|
| f01 | client_server | client_server_architecture.md | Requests per client vs. one server's capacity; the stateless vs. stateful server trade-off | The course opener: set the tone and introduce the four beats explicitly |
| f02 | networking | networking_basics.md | The latency budget of one request (DNS, TCP, TLS, server, transfer); what changes with keep-alive or with a CDN | Outages: the Facebook BGP, Dyn DNS, OpenAI DNS and Salesforce DNS replays |
| f03 | api_design | api_design.md | A calculator comparing the payload size and round trips of REST, GraphQL and gRPC for one screen | The idempotent-method discussion links forward to p11 |
| f04 | latency_throughput | done in P2 | | |
| f05 | scalability | scalability.md | Vertical vs. horizontal: cost and capacity curves, and where the vertical ceiling is hit | Link forward to e01 |
| f06 | cap | cap_theorem.md | Partition simulator: CP vs. AP replicas during a partition, showing rejected writes vs. stale reads | Outage: the GitHub 2018 DB incident |
| f07 | acid_base | acid_vs_base.md | Concurrent transfers with and without transactions: the money-conservation check fails without them | Bug: checkout-double-charge (verify) |
| f08 | consistency | consistency_models.md | A replica-lag timeline: which reads are stale under strong, read-your-writes and eventual consistency | Boundary with t01 |

### P4-E: Evolutions (`2_evolutions/`)

| Id | Slug | Source note (`04_system_evolutions/`) | Sim idea | Notes |
|---|---|---|---|---|
| e01 | scaling_web_app | scaling_a_web_app.md (1,993 lines, the vault's flagship) | Port the Kahn-order QPS flow from the old `trafficSim.js` with benchmark capacities from `benchmarks.js`. Stages: 1 server → DB split → LB → cache → replicas → async → shard | The "map" chapter: link forward to every B chapter it introduces. **Custom hero:** a topology that grows per stage |
| e02 | scaling_database | scaling_a_database.md (2,957 lines) | Single DB → replicas → partitioning: DB load and replica lag per stage | Heavy source note; cut hard |
| e03 | scaling_chat | scaling_a_chat_system.md | Polling vs. long-poll vs. WebSocket: connections and requests per second | |
| e04 | monolith_microservices | from_monolith_to_microservices.md | Team size vs. coordination cost: when splitting helps and when it hurts | Bug: premature-microservices (verify); outage: the TSB migration replay |

### P4-B: Building blocks (`3_building_blocks/`)

| Id | Slug | Source note (`02_building_blocks/`) | Sim idea | Refs to verify |
|---|---|---|---|---|
| b01 | load_balancers | load_balancers.md | Round-robin vs. least-connections with one slow server; health-check removal | |
| b02 | sql | databases_sql.md | Write QPS vs. single-primary capacity; the effect of an index on read latency | Outages: GitLab deletion (backups), Slack 2024 DB |
| b03 | nosql | databases_nosql.md | Partition-key choice vs. hot partitions | Outage: Discord 2024 (hot partitions) |
| b04 | caching | done in P2 | | |
| b05 | queues | message_queues.md | Producer spike vs. consumer rate: backlog, lag and DLQ growth with poison messages | Bug: notification-firehose. **Custom hero:** backlog tank |
| b06 | cdn | cdn.md | Origin load and p95 vs. CDN hit rate and edge count | Outage: Fastly 2021; bug: photo-gallery-overload |
| b07 | blob_storage | blob_storage.md | Storage and egress cost by storage class; presigned upload offloading the app server | |
| b08 | api_gateway | api_gateway.md | A per-request overhead budget: auth, rate limit and routing added at one choke point | |
| b09 | rate_limiter | rate_limiter.md | Token bucket vs. fixed window under bursty traffic: allowed vs. rejected per second | Boundary with c02 (the design of a *distributed* rate limiter) |
| b10 | search | search_systems.md | SQL LIKE scan vs. inverted index as the corpus grows | Bug: search-via-sql |
| b11 | service_discovery | service_discovery.md | Stale registry entries vs. TTL and heartbeat interval | Outage: Roblox 73h |
| b12 | monitoring | monitoring_and_logging.md | Alert thresholds: CPU-based vs. SLO burn-rate alerts; false pages vs. missed incidents | Outage: Datadog 2023 |

### P4-P: Patterns (`4_patterns/`)

| Id | Slug | Source note (`03_design_patterns/`) | Sim idea | Refs to verify |
|---|---|---|---|---|
| p01 | indexing | database_indexing.md | Rows scanned with and without an index; write cost per extra index | |
| p02 | replication | replication.md | Sync vs. async replication: write latency vs. data lost on failover | Outage: GitHub 2018 |
| p03 | sharding | sharding.md | Hash vs. range sharding with a skewed key: per-shard load and the hottest shard | Outage: Discord 2024. **Custom hero:** shard bars |
| p04 | consistent_hashing | consistent_hashing.md | Keys moved when a node is added: modulo vs. ring vs. ring with virtual nodes | |
| p05 | wal | write_ahead_log.md | A crash at a random point: recovered vs. lost writes, with and without a WAL and with fsync policies | |
| p06 | bloom_filters | bloom_filters.md | False-positive rate vs. bits per key and hash count (seeded) | |
| p07 | leader_election | leader_election.md | Leader failure: election time and split-brain risk without fencing | |
| p08 | distributed_locking | distributed_locking.md | Lock lease expiry during a GC pause: the double-writer window, and the fencing-token fix | |
| p09 | gossip | gossip_protocol.md | Rounds to reach all nodes vs. fanout | |
| p10 | retry_backoff | done in P2 | | |
| p11 | idempotency | idempotency.md | Retries after a lost response: duplicate charges with and without an idempotency key | Bug: checkout-double-charge; outage: Knight Capital |
| p12 | circuit_breaker | circuit_breaker.md | A dependency slows down: thread exhaustion with and without a breaker (port the old `failureSim.js` idea) | Outage: AWS us-east-1 2021 |
| p13 | bulkhead | bulkhead_pattern.md | A shared pool vs. per-dependency pools when one dependency hangs | **Custom hero:** pool compartments |
| p14 | back_pressure | back_pressure.md | An unbounded queue vs. bounded + shed load: memory and latency over time | Bug: iot-ingest-overload |
| p15 | cells | cell_based_architecture.md | Blast radius: share of users hit by one bad deploy, one cell vs. N cells | Outages: S3 2017, AWS us-east-1 2021 |
| p16 | pub_sub | pub_sub.md | Fan-out cost: point-to-point calls vs. one publish to N subscribers | |
| p17 | cqrs | cqrs.md | Read/write mix vs. a single model: the read-model lag trade-off | |
| p18 | event_sourcing | event_sourcing.md | Replay time vs. snapshot interval | |
| p19 | saga | saga_pattern.md | Failure at step k: the compensations that run; orchestration vs. choreography message counts | |

### P4-T: Trade-offs (`5_trade_offs/`)

All sources are in `06_trade_offs/`. For every trade-off chapter, the sim is a **decision calculator**: the sliders are the requirement forces, and the output is which side wins and by how much. The failure beat shows what happens when the wrong side is picked.

| Id | Slug | Source note | Notes |
|---|---|---|---|
| t01 | consistency_availability | consistency_vs_availability.md | Boundary with f06 (the theorem) and f08 (the models) |
| t02 | latency_throughput | latency_vs_throughput.md | Boundary with f04 |
| t03 | sql_nosql | sql_vs_nosql.md | Link b02 and b03 |
| t04 | simplicity_scalability | simplicity_vs_scalability.md | Link e04 |
| t05 | read_write | read_vs_write_optimization.md | Link p17 |
| t06 | cost_performance | cost_vs_performance.md | Reuse the cost-band logic from the old `capacity.js` |
| t07 | push_pull | push_vs_pull.md | Link e03 |

### P4-M: Method (`6_method/`)

| Id | Slug | Source note(s) | Sim idea | Notes |
|---|---|---|---|---|
| m01 | hld_thinking | `10_hld/hld_thinking_system.md` | A constraints-first checker: which components the stated constraints justify | Frame it as the architect's loop made explicit |
| m02 | four_step_framework | `07_interview_framework/the_four_step_framework.md` + `requirements_gathering.md` | A time budget across the 4 steps of a 45-min interview | Link the Practice interview mode (drill wizard) |
| m03 | estimation_capacity | `07_interview_framework/estimation_cheat_sheet.md` + `10_hld/capacity_planning.md` | Port the old `capacity.js` and `napkinCheck.js` logic | Practice: the napkin quiz |
| m04 | interaction_patterns | `10_hld/component_interaction_patterns.md` | A sync chain vs. async: end-to-end latency and availability as a product of hops | Bug: the old `learning.js` "synchronous chain of death" example is good material |
| m05 | adrs | `10_hld/architecture_decision_records.md` | An ADR completeness checker (sections present, alternatives listed) | Practice: the Proposal tool |
| m06 | review_checklist | `10_hld/hld_review_checklist.md` + `07_interview_framework/common_red_flags.md` | Run the old `drillLinter.js` rules over a small sample design | Practice: Review System, Bug Finder |

Verify every m-track path exists; the contract test will fail otherwise.

### P4-C: Case studies (`7_case_studies/`)

Case studies are capstones. Each one uses the architect's loop at full scale, lists its prerequisite chapters in `uses`, and links its drill case.

| Id | Slug | Source note (`05_case_studies/`) | Drill case to verify | Notes |
|---|---|---|---|---|
| c01 | url_shortener | design_url_shortener.md | URL Shortener | Beginner-friendly first capstone |
| c02 | rate_limiter | design_rate_limiter.md | — | Boundary with b09 |
| c03 | notification_system | design_notification_system.md | Notification | **The source note is only ~4 KB** even though the vault index marks it ✅. Supplement from `10_hld/examples/hld_notification_platform.md` |
| c04 | search_autocomplete | design_search_autocomplete.md | Autocomplete | **Also ~4 KB.** Supplement from `02_building_blocks/search_systems.md` |
| c05 | instagram_stories | design_instagram_stories.md | — | |
| c06 | spotify | design_spotify.md | — | |
| c07 | google_docs | design_google_docs.md | Google Docs | |
| c08 | zoom | design_zoom.md | — | |
| c09 | video_streaming | design_video_streaming.md | Video Streaming | |
| c10 | ride_sharing | design_ride_sharing.md | — | |
| c11 | google_maps | design_google_maps.md | Maps | |

The **sim idea for case studies** is an end-to-end capacity + bottleneck run over that system's topology. Reuse the patterns from e01's traffic-flow sim and the old `capacity.js`. The four beats are: requirements → v1 design → what breaks at 10× → the chosen trade-off.

**P4 exit review:**
- 67 chapters; contract tests green;
- every chapter reachable from Home and Tracks;
- no chapter README over ~12 KB;
- every sim's CLI runs on Windows;
- a random sample of 10 chapters checked in the browser in both themes.

---

## P5: Finish

### P5.1 Tracks and Timeline pages
- **Do:**
  - **Tracks:** 7 tracks with their chapters, concern filters and a progress count per track.
  - **Timeline:** the whole course in order as one path, marking done and next chapters.
  - Both read `course.json` and `lsd-progress` only.
- **Done when:** filtering by concern works, and progress marks match what was visited.

### P5.2 Search
- **Do:** a TopBar search over chapter titles, claims, mottos and concerns, plus note titles from the vault index. Results link to chapters or Library notes. No search library: plain filtering is enough at this size.

### P5.3 Root README and CONTRIBUTING
- **README:**
  - the thesis (PLAN §1 row 1);
  - the architect's loop;
  - the 7 tracks with their mottos;
  - a mermaid learning-path diagram;
  - the quick start (install, dev, run one sim);
  - a "what happened to the old app" table mapping each old tab to its new location;
  - the live link.
- **CONTRIBUTING:**
  - one idea per chapter;
  - follow the recipe (link to TASKS P2.1, or move the recipe into CONTRIBUTING);
  - sims are teaching models, not benchmarks;
  - README excerpts must match `sim.mjs`;
  - never edit vault notes from chapter PRs;
  - disclose AI assistance.

### P5.4 Performance and quality pass
- Initial JS stays under 250 KB gzip. Check the build output. Mermaid, highlight.js, Excalidraw, vault chunks and sims must all be in lazy chunks.
- Accessibility basics:
  - visible keyboard focus;
  - the sliders have labels;
  - the tab controls are keyboard-operable;
  - text contrast meets PLAN §3.5 (≥ 7:1 body, ≥ 4.5:1 muted) in both themes.
- No console errors on Home, one chapter per track, every practice tool, and the Library.
- Check for broken links: every `#/<id>` and `#/library/<path>` produced by the extractor must resolve. Extend the contract test if that's cheap.

### P5.5 Point the old repo at the new one (ask first ✋)
- Proposed change: add a banner line to the old repo's README linking the new site. The old app stays live.
- **Ask the user before touching the old repo.** Open a PR, or commit directly only if the user says so.

### P5.6 Final deploy and report
- Push, confirm both workflows are green, and confirm the Pages URL serves Home, `#/b04`, `#/practice/outage/<id>` and `#/library/<a note path>`.
- Report to the user:
  - the live link;
  - chapter count;
  - test count;
  - bundle size;
  - any deviations from PLAN.md, with reasons;
  - known gaps. The obvious candidate is the Library-only vault folders (LLD, Java, company guides, projects, intermediate, real-world architecture), which could become future tracks.

---

## Risk register (read before starting)

| Risk | Where it bites | Mitigation |
|---|---|---|
| Sims break in the browser because of Node-only code | P2 onwards | Recipe step 5. Test each sim in both Node and the Simulate tab |
| Windows path and file-URL issues in the extractor and sim CLI guards | P1.5, every sim | Normalize separators; import via file URLs; test on this machine |
| Images and assets 404 on Pages under `/learn-system-design/` | P2.5 | Always prefix the Vite base URL; check on the deployed site, not only in dev |
| Guessed practice ids in `meta.json` | P2, P4 | P3.1 un-skips the ref checks; never guess ids |
| Shared localStorage with the old site corrupts data | P3 | Keep old key names **and data shapes** exactly; add new keys only under `lsd-` |
| Distilled READMEs drift from the sims | every chapter | The excerpt ≡ sim contract test; regenerate "Try It" output after sim edits |
| Scope creep in chapter sims | P4 | Four beats, round numbers, a few params. If it needs a paragraph to explain, simplify it |
| The vault index overstates some notes (c03, c04 are ~4 KB) | P4-C | Supplement from the listed notes; mention the gap in the final report |
| The ported styles fight the theme | P3.5 | One alias block, then screenshot-review both themes; don't restyle view by view |
| Pushing as the wrong GitHub account | every push | Switch gh to vibhu-0511 before every push |
