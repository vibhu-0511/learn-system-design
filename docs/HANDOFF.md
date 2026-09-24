# HANDOFF: resume here (written 2026-09-24)

Read this first, then `docs/TASKS.md` (status board, §0.4 deviations, §0.5/§0.6 outcomes, P4 tables). `docs/PLAN.md` is the design.
Working directory: `C:\Users\vibha\Downloads\data\personal\learn-system-design`. Repo: private `vibhu-0511/learn-system-design`.

## Lesson from the last session
About 70k tokens went on reading vault notes for b08–b12 and ended with no files written. Do not repeat that.
Use the facts in "b08–b12 source facts" below and write the sim first. Peek at a vault note only for one specific number you still need.

## State
- Pushed: P1 scaffold, P2 pilot (f04, b04, p10), P3 gym and Library port, Track 1 (f01–f08), Track 2 (e01–e04 plus `track.json`).
- **Uncommitted, tested:** Track 3 chapters b01, b02, b03, b05, b06, b07 and `course/3_building_blocks/track.json`. `npm run extract` gives 20 chapters. `npm test` gives 363 passed | 1 skipped.
- **Not started:** b08 api_gateway, b09 rate_limiter, b10 search, b11 service_discovery, b12 monitoring. Folder pattern: `course/3_building_blocks/b08_api_gateway/` and so on. Check the exact slugs in the TASKS.md P4-B table.
- Then: p01–p19 (p10 is done), t01–t07 (`5_trade_offs`), m01–m06 (`6_method`), c01–c11 (`7_case_studies`; the sources for c03 and c04 are only about 4 KB, so supplement them from other notes), and P5.
- Update the TASKS.md status board row "P4-B Building blocks (12)" when Track 3 is complete.

## Commands
```
npm run extract      # course -> course.json + chapters/<id>.json; fails on an unknown practice id
npm test             # vitest contract tests (one 1-skipped is the COURSE_COMPLETE=1 gate)
node course/<track>/<id>_<slug>/sim.mjs --key=value   # runs a sim in the CLI
gh auth switch --user vibhu-0511   # BEFORE every push (personal folder uses vibhu-0511)
```
Commit per track. Commit messages end with `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`. The LF→CRLF warning is harmless.
Next commit: "P4-B: Building blocks track (b01–b12)".

## Per-chapter workflow (about 5 tool calls; do not over-research)
1. Write `sim.mjs`, run it, and use the real output numbers.
2. Write `README.md` and `meta.json` from that output.
3. After every 2–3 chapters run `npm run extract && npm test`.
Template: read `course/3_building_blocks/b07_blob_storage/{sim.mjs,README.md,meta.json}` (short, and a good model).

### sim.mjs contract
- Top comment: assumptions, plus "Runs in Node (node sim.mjs --x=1) and in the browser".
- `export const PARAMS = { key: { label, unit, min, max, step, default } }` (defaults within min and max).
- `export function run(params) → { frames:[{ beat, title, note, metrics }], summary }`.
- Frames appear in this order: `constraints` → `component` → `failure` → `tradeoff` (4 frames, or more frames with the beats still in that order).
- Every frame has the SAME metric keys, all finite at the defaults and at every slider min and max. Notes are built from the computed values.
- Deterministic, with no `node:` imports and no Math.random (use a seeded RNG if you need one).
- Metric key suffixes `Pct`, `Ms`, `Rps` and `Sec` drive the units shown in the UI.
- Ends with the CLI guard, copied verbatim from b07:
```js
const entry = typeof process !== "undefined" ? process.argv?.[1] : undefined;
if (entry && decodeURIComponent(import.meta.url).endsWith(entry.replace(/\\/g, "/"))) { /* parse --k=v, print frames */ }
```

### README.md contract
- Line 1: `# id: Title — claim`. Line 3: breadcrumb with `**id**`, e.g. `Building blocks · b07 → **b08** → b09`.
- Then the motto block quote (`> *"motto"*`) and a `> **Concern**: a · b` line.
- 11 `##` sections in this order: The Problem, The Idea, How It Works, When It Breaks, The Trade-off, In The Wild, Try It, Say It In The Interview, Boundary, What's Next, Source notes.
- Excerpts are fenced blocks whose FIRST line is `// sim.mjs`. The following lines must appear contiguously in the sim.
- Try It quotes real CLI output. Source notes link as `../../../vault/system_design/02_building_blocks/<file>.md`.
- Any assumption not in the vault note must be flagged in an italic note (as b07 does).
- b12 is the last building block: its What's Next points to the Patterns track (p01 indexing).

### meta.json
Keys: id, title, subtitle, motto, coreAddition, keyInsight, concerns[], uses[], sourceNotes[], outageRefs[], bugScenarioIds[], drillCaseIds[], terms[], decisions[{title, description, alternatives}].
- Concerns come from: scalability, availability, latency, cost, consistency.
- `uses` must be earlier chapter ids.
- `sourceNotes` are paths relative to `vault/system_design/` (e.g. `02_building_blocks/api_gateway.md`) and must exist.
- Practice ids must exist (see below).

## Valid practice ids
- Outages: aws_s3_2017, facebook_bgp_2021, cloudflare_regex_2019, crowdstrike_2024, github_db_2018, gitlab_2017, knight_capital_2012, tsb_2018, fastly_2021, roblox_2021, slack_db_2024, southwest_2022, discord_db_2024, aws_us_east_2021, google_cloud_2022, cloudflare_2025, dyn_dns_2016, leftpad_2016, youtube_2018, salesforce_dns_2021, atlassian_2022, reddit_2023, datadog_2023, unitedhealth_2024, openai_dns_2024.
- Bug scenarios: checkout-double-charge, photo-gallery-overload, notification-firehose, search-via-sql, iot-ingest-overload, premature-microservices.
- Drill cases: url-shortener, notification-service, chat, food-delivery, search-autocomplete, payment-system, ticketmaster, google-docs, video-streaming, web-crawler, logging-pipeline, google-maps.
- Terms (seen): Latency, Throughput, Consistency, Client-Server Model, Cache, Idempotency, Circuit Breaker, Back Pressure. Check the export in `web/src/practice/data` before using others.

## b08–b12 source facts (already read; do not re-read)
Vault folder: `vault/system_design/02_building_blocks/`.

**b08 api_gateway** (`api_gateway.md`; suggested uses: b01, f03)
- Scenario: 15 microservices; a mobile screen makes 8 API calls, each to a different service URL; auth is repeated per call and response formats differ; one service moves and the app breaks.
- Topics: a single entry point, routing, auth, rate limiting, API composition, BFF (backend for frontend), circuit breaker; Kong and Spring Cloud Gateway.
- Sim idea: N calls per screen × RTT versus one composed call (latency), auth checks (per-service versus once), gateway as SPOF and extra hop (failure), the composition-versus-added-latency trade-off.
- Practice: none required.

**b09 rate_limiter** (`rate_limiter.md`; suggested uses: b08, b04)
- Scenario: a buggy client sends 10,000 req/s to /search. Rejection returns HTTP 429.
- Fixed window (limit 10/s): 10 requests at 0.9 s plus 10 at 1.0 s gives 20 in 0.1 s, the boundary burst.
- Sliding window: weighted count, e.g. (5 × 50%) + 8 = 10.5, which rejects the new request. Smooth and memory-efficient.
- Token bucket (capacity 10, refill 2/s): allows a burst of up to the capacity, then holds the average rate. State is 2 values (token count and last refill time). Used by AWS API Gateway, Stripe and Google Cloud.
- Leaky bucket (queue 10, leak 2/s): smooths output and allows no bursts.
- Also covers Redis-based and distributed limiters (a race when a check and an increment are not atomic).
- Practice: drill `search-autocomplete` is optional; there is no dedicated rate-limiter drill id (check DRILL_CASES before linking).

**b10 search** (`search_systems.md`; suggested uses: b02, b03)
- Scenario: `LIKE '%wireless headphone%'` on 10M products takes 8 s (a full scan cannot use an index).
- Inverted index: term → docs, so a lookup is per term and the query intersects posting lists. Example: brown → [Doc1, Doc2], fox → [Doc1], intersection → Doc1.
- TF-IDF: `score = TF × IDF`; "the" in 99% of docs gives a low IDF, a rare term gives a high one.
- BM25: `IDF × (TF × (k1+1)) / (TF + k1 × (1 − b + b × docLen/avgDocLen))`, k1 = 1.2, b = 0.75. It adds TF saturation and length normalisation; the default in Elasticsearch, Lucene and Solr.
- Also: Elasticsearch sharding and analyzers (tokenizing and stemming).
- Practice: bug `search-via-sql` and drill `search-autocomplete`.

**b11 service_discovery** (`service_discovery.md`; suggested uses: b01, f06)
- Scenario: hard-coded IPs across 20 microservices break at 3 AM.
- Client-side versus server-side discovery; health checks; stale entries; graceful shutdown (deregister, then drain).
- AP versus CP registry:
  - Netflix chose AP (Eureka): stale data beats no data. A stale entry costs one failed request plus a retry, but a registry that is down blinds every service.
  - Kafka chose CP (ZooKeeper): two partition leaders means split brain, so brief unavailability is better than inconsistency.
  - Guide: HTTP microservices → AP; database partition leader → CP; DNS → AP (TTL caching); config management (Consul, etcd) → CP; sidecar service mesh → AP.
- Practice: outage `roblox_2021` (a Consul incident).

**b12 monitoring** (`monitoring_and_logging.md`; suggested uses: f04, b08)
- Scenario: a 3 AM debugging session takes 4 hours.
- Three pillars: metrics, logs, traces. Methods: RED (rate, errors, duration) for services and USE (utilization, saturation, errors) for resources. Also alerting.
- SLI (measured), SLO (target), SLA (contract with penalties). Example: SLI = request latency, SLO = P99 < 200 ms, SLA = "99.9% under 200 ms or a credit".
- Error budget = 100% − SLO. 99.9% over a 30-day month is 43,200 min × 0.001 = 43.2 min of downtime. After 30 min used, 13.2 min remain, so slow releases.
- Real-world: Google SRE error budgets, Netflix, Uber M3, Slack.
- Practice: outage `datadog_2023` (the monitoring vendor itself went down).

## Tests: what `tests/course.test.js` enforces
- Per chapter: three files exist; README line 1, breadcrumb and 11 sections in order; `// sim.mjs` excerpts appear verbatim in the sim; `validateMeta`; sourceNotes exist; `uses` come earlier; practice refs resolve.
- Sim checks: PARAMS shape, determinism, beats in order, the same metric keys in every frame, finite metrics at defaults and at every slider end, no `node:` imports.
- Global: track counts. The "all 67 chapters exist" check is gated behind `COURSE_COMPLETE=1`; turn it on in CI only at the end (P5).

## Traps
- `preview_start` with a config name starts the user's Forge app on port 5173, not this site. Run `npm run dev` yourself, open with `preview_start` using a `url`, and stop it afterwards.
- Regenerate `package-lock.json` with `npm install --package-lock-only` if dependencies change (a Windows-written lockfile once broke `npm ci` in CI).
- Pages deploy is manual-only while the repo is private. Do not enable Pages or make the repo public without asking.
- Do not spawn subagents unless the user says so.
- `renderMarkdown` is for our own files only; use `renderMarkdownUntrusted` for anything else.
- The helper `/tmp/lsd/peek.mjs` (usage: `node peek.mjs <vault-relative-note> [maxHeadings]`) may be gone. Read the notes with the Read tool and a small `limit` instead.

## P5 (after all chapters)
TracksPage and TimelinePage (currently "Coming soon"), search over vault notes, root README (thesis, learning path, old-tab-to-new-location table) and CONTRIBUTING, a performance and accessibility pass (initial JS is about 76 KB gzip; keep it under 250 KB), `COURSE_COMPLETE=1` in CI, and ask before touching the old repo (P5.5).
Optional custom heroes: e01, b05, p03, p13 (b04 exists).
Final report must list: the unverified items from TASKS §0.6 (the drill wizard's later steps, the Excalidraw sketch, the AI review call, the capacity lab with a saved workspace, kata and interview modes, old-site data carry-over, chapter images, the Docker image), the vault errors for the user to fix (the Amdahl table in `scalability.md`; the possibly truncated "Two users sign up with the same…" wording near the b02 source), and that the Pages URL check is blocked while the repo is private.

## Standing user instructions
Work autonomously (the user is often away). Verify with real runs and report real results. Keep `docs/TASKS.md` updated. Ask before anything outward-facing (making the repo public, enabling Pages, touching the old repo).
