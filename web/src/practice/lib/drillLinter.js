// Architecture linter v2. Operates on the typed design model (constraints +
// components with justifications). Each rule is a small predicate that
// returns one finding when it fires. Every rule cites at least one vault
// note; many also reference outage notes that show the same failure shape in
// the wild. UI renders citations as SourceNoteLinks; missing notes auto-disable.
//
// Adding a rule: append to RULES below. Keep predicate functions small and
// boring; that's the point — linting should be auditable, not clever.

const REQUIRED_CONSTRAINTS = [
  "qpsRead",
  "qpsWrite",
  "latencyP95",
  "consistency",
  "cost",
  "team",
];

const CONSTRAINT_LABELS = {
  qpsRead: "read QPS",
  qpsWrite: "write QPS",
  latencyP95: "p95 latency target",
  consistency: "consistency tier",
  durability: "durability tier",
  cost: "cost ceiling",
  team: "team size",
  growth: "growth assumption",
};

const SEVERITY_RANK = { high: 0, medium: 1, low: 2 };

function nonEmpty(value) {
  if (value == null) return false;
  return String(value).trim().length > 0;
}

function asInt(value) {
  if (value == null) return NaN;
  const n = parseInt(String(value).replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : NaN;
}

function joinedJustifications(components) {
  return components.map((c) => (c.justification || "").toLowerCase()).join(" \n ");
}

function hasComponent(components, paletteId) {
  return components.some((c) => c.paletteId === paletteId);
}

function getComponent(components, paletteId) {
  return components.find((c) => c.paletteId === paletteId) || null;
}

// Each RULE has:
//   id           — stable identifier (used by Bug Finder for matching)
//   severity     — high | medium | low
//   title        — one-line headline
//   detailFrom   — function(state) → string explaining the specific instance
//   suggestedFix — fix text
//   citations    — array of vault paths (always at least one)
//   outageRefs   — optional array of outage vault paths echoing this failure
//   when         — predicate(state) → boolean. If true, rule fires.
//
// Note: rules that emit one finding per matching component (like R2) are
// implemented as `runMany` and produce an array. Everything else is `when`.

const RULES = [
  {
    id: "missing-constraints",
    severity: "high",
    title: "Constraints incomplete",
    when: (state) =>
      REQUIRED_CONSTRAINTS.some((k) => !nonEmpty(state.constraints?.[k])),
    detailFrom: (state) => {
      const missing = REQUIRED_CONSTRAINTS.filter(
        (k) => !nonEmpty(state.constraints?.[k]),
      );
      return `Missing: ${missing
        .map((k) => CONSTRAINT_LABELS[k] || k)
        .join(", ")}. Without these, every later decision is a guess.`;
    },
    suggestedFix:
      "Fill all required constraint fields. Even guessed numbers beat blanks — they make the trade-off visible.",
    citations: [
      "10_hld/hld_thinking_system.md",
      "07_interview_framework/the_four_step_framework.md",
    ],
  },

  {
    // R2 emits one finding per under-justified component
    id: "unjustified-component",
    severity: "high",
    title: "Component has no real justification",
    citations: ["10_hld/hld_review_checklist.md"],
    runMany: (state) => {
      const findings = [];
      for (const c of state.components || []) {
        const just = (c.justification || "").trim();
        if (just.length < 12) {
          findings.push({
            id: `unjustified-${c.id}`,
            ruleId: "unjustified-component",
            severity: "high",
            title: `${c.name} has no real justification`,
            detail:
              'Every component must answer "what bottleneck or risk does this remove?" — yours is empty or one or two words.',
            suggestedFix:
              "Write one sentence linking this component to a specific constraint or failure mode.",
            citations: ["10_hld/hld_review_checklist.md"],
          });
        }
      }
      return findings;
    },
  },

  {
    id: "cache-no-invalidation",
    severity: "medium",
    title: "Cache without invalidation strategy",
    when: (state) => {
      const cache = getComponent(state.components, "cache");
      if (!cache) return false;
      const text = (cache.justification || "").toLowerCase();
      return !/(invalidat|ttl|stale|expir|fresh|write-through|write through|write-back)/.test(
        text,
      );
    },
    detailFrom: () =>
      "Cache justification doesn't mention TTL, invalidation, write-through, or staleness. Caches silently serve wrong data without it.",
    suggestedFix:
      "Mention TTL, invalidation trigger, or staleness tolerance in the justification.",
    citations: [
      "02_building_blocks/caching.md",
      "06_trade_offs/consistency_vs_availability.md",
    ],
  },

  {
    id: "queue-no-controls",
    severity: "medium",
    title: "Queue without operational controls",
    when: (state) => {
      const q =
        getComponent(state.components, "message-queue") ||
        getComponent(state.components, "pub-sub");
      if (!q) return false;
      const text = (q.justification || "").toLowerCase();
      return !/(dlq|consumer|retry|backpressure|back pressure|lag|idempoten|poison|replay)/.test(
        text,
      );
    },
    detailFrom: () =>
      "Queue justification doesn't mention DLQ, retries, lag, or consumer behavior. Queues hide overload until they don't.",
    suggestedFix:
      "Mention max retries, DLQ destination, lag alert, or idempotent consumer.",
    citations: [
      "03_design_patterns/back_pressure.md",
      "02_building_blocks/message_queues.md",
    ],
  },

  {
    id: "sql-write-bottleneck",
    severity: "medium",
    title: "Write QPS will overwhelm a single SQL primary",
    when: (state) => {
      const writeQps = asInt(state.constraints?.qpsWrite);
      if (!Number.isFinite(writeQps) || writeQps <= 5000) return false;
      const hasSql = hasComponent(state.components, "sql-database");
      const hasShard =
        hasComponent(state.components, "sql-shard") ||
        hasComponent(state.components, "kv-store");
      return hasSql && !hasShard;
    },
    detailFrom: (state) => {
      const writeQps = asInt(state.constraints?.qpsWrite);
      return `Write QPS estimated at ${writeQps.toLocaleString()}. A single SQL primary becomes a bottleneck above ~5K writes/s on commodity hardware.`;
    },
    suggestedFix:
      "Consider sharding, a write-optimized store, or partitioning by access pattern.",
    citations: [
      "03_design_patterns/sharding.md",
      "06_trade_offs/sql_vs_nosql.md",
    ],
    outageRefs: ["09_real_outages/discord_message_outage_2024.md"],
  },

  {
    id: "strong-with-cache",
    severity: "medium",
    title: "Strong consistency + cache",
    when: (state) =>
      state.constraints?.consistency === "strong" &&
      hasComponent(state.components, "cache"),
    detailFrom: () =>
      "You picked strong consistency but added a cache. Caches naturally drift unless invalidation is airtight.",
    suggestedFix:
      "Either accept eventual consistency for cached data, or document a strict invalidation/write-through path.",
    citations: [
      "06_trade_offs/consistency_vs_availability.md",
      "02_building_blocks/caching.md",
    ],
  },

  {
    id: "microservices-small-team",
    severity: "low",
    title: "Too many services for the team",
    when: (state) => {
      const teamSize = asInt(state.constraints?.team);
      const apiServers = (state.components || []).filter(
        (c) => c.paletteId === "api-server",
      ).length;
      return Number.isFinite(teamSize) && teamSize < 8 && apiServers > 2;
    },
    detailFrom: (state) => {
      const teamSize = asInt(state.constraints?.team);
      const apiServers = (state.components || []).filter(
        (c) => c.paletteId === "api-server",
      ).length;
      return `${apiServers} API services with a team of ${teamSize}. Multiple services add deploy, observability, and on-call overhead that small teams pay disproportionately.`;
    },
    suggestedFix:
      "Start with a modular monolith. Split when team and traffic measurably justify it.",
    citations: [
      "04_system_evolutions/from_monolith_to_microservices.md",
      "06_trade_offs/simplicity_vs_scalability.md",
    ],
  },

  {
    id: "sync-side-effects",
    severity: "medium",
    title: "Likely-async work on the synchronous path",
    when: (state) => {
      const text = joinedJustifications(state.components);
      const mentionsAsync =
        /(notification|email|sms|push|analytics|webhook|export|report|audit|fanout|side effect)/.test(
          text,
        );
      const hasAsync =
        hasComponent(state.components, "message-queue") ||
        hasComponent(state.components, "pub-sub");
      return mentionsAsync && !hasAsync;
    },
    detailFrom: () =>
      "Your justifications mention notifications, analytics, webhooks, or other side effects, but you have no queue or pub/sub.",
    suggestedFix:
      "Move non-critical side effects behind a queue. Keep the user-facing path small.",
    citations: [
      "02_building_blocks/message_queues.md",
      "03_design_patterns/pub_sub.md",
    ],
  },

  // ---- v2 rules ----------------------------------------------------------

  {
    id: "no-load-balancer-at-scale",
    severity: "high",
    title: "High traffic without a load balancer",
    when: (state) => {
      const readQps = asInt(state.constraints?.qpsRead);
      if (!Number.isFinite(readQps) || readQps <= 5000) return false;
      return !hasComponent(state.components, "load-balancer");
    },
    detailFrom: (state) => {
      const readQps = asInt(state.constraints?.qpsRead);
      return `Read QPS at ${readQps.toLocaleString()}. With no load balancer, traffic can't spread across servers and you have no failure-routing layer.`;
    },
    suggestedFix:
      "Add a load balancer in front of API servers. Even one is enough to start; it's how you get N>1 without breaking clients.",
    citations: ["02_building_blocks/load_balancers.md"],
    outageRefs: ["09_real_outages/slack_database_incident_2024.md"],
  },

  {
    id: "no-cdn-for-static",
    severity: "medium",
    title: "Static or media content with no CDN",
    when: (state) => {
      const text = joinedJustifications(state.components);
      const mentionsStatic =
        /(static|asset|image|video|audio|file upload|thumbnail|avatar|profile pic)/.test(
          text,
        );
      return mentionsStatic && !hasComponent(state.components, "cdn");
    },
    detailFrom: () =>
      "Your justifications hint at static or media content (images, files, assets) but there's no CDN. Origin will eat the bandwidth and latency tax.",
    suggestedFix:
      "Put a CDN in front of static and user-uploaded content. Origin only handles cache misses.",
    citations: ["02_building_blocks/cdn.md"],
    outageRefs: ["09_real_outages/fastly_cdn_outage_2021.md"],
  },

  {
    id: "no-observability",
    severity: "medium",
    title: "No observability stack",
    when: (state) => !hasComponent(state.components, "observability"),
    detailFrom: () =>
      "No metrics/logs/traces component. You can't see what's slow, what's failing, or why a customer is angry.",
    suggestedFix:
      "Add an observability stack — even a thin one (request log + p95 metric + error count). It's how you debug under pressure.",
    citations: ["02_building_blocks/monitoring_and_logging.md"],
    outageRefs: [
      "09_real_outages/roblox_73h_outage_2021.md",
      "09_real_outages/facebook_bgp_outage_2021.md",
    ],
  },

  {
    id: "no-rate-limit-on-public-api",
    severity: "medium",
    title: "Public API with no rate limiting",
    when: (state) => {
      const readQps = asInt(state.constraints?.qpsRead);
      const writeQps = asInt(state.constraints?.qpsWrite);
      const totalQps =
        (Number.isFinite(readQps) ? readQps : 0) +
        (Number.isFinite(writeQps) ? writeQps : 0);
      if (totalQps < 1000) return false;
      const text = joinedJustifications(state.components);
      const isPublic =
        /(public|client|mobile|browser|user-facing|external|3rd party|third party)/.test(
          text,
        );
      if (!isPublic) return false;
      return (
        !hasComponent(state.components, "rate-limiter") &&
        !hasComponent(state.components, "api-gateway")
      );
    },
    detailFrom: () =>
      "Justifications imply public clients and combined QPS >1K, but there's no rate limiter or API gateway in front. One bad client can drown the service.",
    suggestedFix:
      "Add a rate limiter (or an API gateway that includes one). Per-key, per-IP, and global ceilings.",
    citations: ["02_building_blocks/rate_limiter.md"],
    outageRefs: ["09_real_outages/cloudflare_regex_outage_2019.md"],
  },

  {
    id: "high-durability-no-replication",
    severity: "high",
    title: "High durability claim, no replication path",
    when: (state) => {
      if (state.constraints?.durability !== "high") return false;
      if (!hasComponent(state.components, "sql-database")) return false;
      const hasReplica =
        hasComponent(state.components, "sql-replica") ||
        hasComponent(state.components, "sql-shard");
      const text = joinedJustifications(state.components);
      const mentionsReplication =
        /(replica|replication|backup|snapshot|wal|standby|failover|hot standby)/.test(
          text,
        );
      return !hasReplica && !mentionsReplication;
    },
    detailFrom: () =>
      "You claimed high durability but the design has a single SQL primary with no replica or backup language anywhere. One disk failure equals total data loss.",
    suggestedFix:
      "Add an explicit replication or backup story: replica, snapshot schedule, or WAL shipping. Verify backups by restoring them on a schedule.",
    citations: ["03_design_patterns/replication.md"],
    outageRefs: [
      "09_real_outages/gitlab_data_deletion_2017.md",
      "09_real_outages/github_database_incident_2018.md",
    ],
  },

  {
    id: "search-via-sql",
    severity: "medium",
    title: "Search/typeahead bolted onto SQL",
    when: (state) => {
      const text = joinedJustifications(state.components);
      const mentionsSearch =
        /(search|typeahead|autocomplete|full[- ]?text|ranked|query suggestion|like %)/.test(
          text,
        );
      if (!mentionsSearch) return false;
      return (
        hasComponent(state.components, "sql-database") &&
        !hasComponent(state.components, "search-index")
      );
    },
    detailFrom: () =>
      "Justifications mention search or typeahead, but there's no search index — only SQL. SQL LIKE queries don't scale and don't rank.",
    suggestedFix:
      "Add a search index (Elasticsearch, OpenSearch, Meili). Treat it as a derived view of your source-of-truth, not the source itself.",
    citations: ["02_building_blocks/search_systems.md"],
  },

  {
    id: "api-gateway-without-auth",
    severity: "low",
    title: "API gateway with no auth language",
    when: (state) => {
      const gw = getComponent(state.components, "api-gateway");
      if (!gw) return false;
      const text = (gw.justification || "").toLowerCase();
      return !/(auth|jwt|oauth|api key|api-key|token|session|saml|oidc)/.test(
        text,
      );
    },
    detailFrom: () =>
      "API gateway is in your design but the justification doesn't mention auth. The whole point of an edge gateway is to be where auth lives.",
    suggestedFix:
      "Document the auth strategy at the gateway: JWT/OAuth verification, API key check, mutual TLS for service-to-service.",
    citations: [
      "02_building_blocks/api_gateway.md",
      "15_intermediate_topics/authentication_deep_dive.md",
    ],
  },

  {
    id: "payment-without-idempotency",
    severity: "high",
    title: "Money-handling path with no idempotency language",
    when: (state) => {
      const text = joinedJustifications(state.components);
      const isMoney =
        /(payment|charge|order|checkout|invoice|refund|wallet|transfer)/.test(
          text,
        );
      if (!isMoney) return false;
      return !/(idempoten|dedup|exactly[- ]once|deduplication|idempotency key)/.test(
        text,
      );
    },
    detailFrom: () =>
      "Your design touches payments, orders, or checkout — and nothing in the justifications mentions idempotency or deduplication. Network retries will produce double-charges or duplicate orders.",
    suggestedFix:
      "Idempotency keys on every money-moving endpoint. Document where the dedup table lives and how long keys stick around.",
    citations: [
      "03_design_patterns/idempotency.md",
      "03_design_patterns/saga_pattern.md",
    ],
    outageRefs: ["09_real_outages/knight_capital_2012.md"],
  },

  {
    id: "low-latency-no-cache",
    severity: "high",
    title: "Tight latency target with no cache or CDN",
    when: (state) => {
      const latency = asInt(state.constraints?.latencyP95);
      const readQps = asInt(state.constraints?.qpsRead);
      if (!Number.isFinite(latency) || latency > 100) return false;
      if (!Number.isFinite(readQps) || readQps < 1000) return false;
      return (
        !hasComponent(state.components, "cache") &&
        !hasComponent(state.components, "cdn")
      );
    },
    detailFrom: (state) => {
      const latency = asInt(state.constraints?.latencyP95);
      const readQps = asInt(state.constraints?.qpsRead);
      return `p95 target ${latency}ms at ${readQps.toLocaleString()} read QPS. No cache, no CDN. The DB will be the bottleneck — DB round-trip alone often eats the budget.`;
    },
    suggestedFix:
      "Add a cache (in-memory or Redis) for hot reads, and/or a CDN for anything cacheable at the edge.",
    citations: [
      "02_building_blocks/caching.md",
      "07_interview_framework/estimation_cheat_sheet.md",
    ],
  },

  {
    id: "blob-without-cdn",
    severity: "medium",
    title: "Blob storage exposed without a CDN",
    when: (state) => {
      const blob = getComponent(state.components, "blob-storage");
      if (!blob) return false;
      if (hasComponent(state.components, "cdn")) return false;
      const text = (blob.justification || "").toLowerCase();
      return /(public|user|customer|served|download|stream|media|image|video|audio)/.test(
        text,
      );
    },
    detailFrom: () =>
      "Blob storage holds user-facing content but there's no CDN. Origin egress is expensive and slow at scale, and cold-loaded media will tank latency.",
    suggestedFix:
      "Front blob storage with a CDN. Most providers (S3+CloudFront, GCS+Cloud CDN) integrate in a config flip.",
    citations: ["02_building_blocks/cdn.md", "02_building_blocks/blob_storage.md"],
    outageRefs: ["09_real_outages/amazon_s3_outage_2017.md"],
  },

  {
    id: "no-backup-language-at-high-durability",
    severity: "low",
    title: "No backup or recovery language at high durability",
    when: (state) => {
      if (state.constraints?.durability !== "high") return false;
      const text = joinedJustifications(state.components);
      return !/(backup|snapshot|restore|recover|wal|point[- ]in[- ]time|pitr)/.test(
        text,
      );
    },
    detailFrom: () =>
      "High durability means you survive disk and region failures. Nothing in the design mentions backup, snapshot, or restore — meaning recovery hasn't been thought about.",
    suggestedFix:
      "Document backup cadence, retention, and (most importantly) verification. An untested backup is not a backup.",
    citations: [
      "03_design_patterns/replication.md",
      "10_hld/hld_review_checklist.md",
    ],
    outageRefs: ["09_real_outages/gitlab_data_deletion_2017.md"],
  },
];

export function lintDrill(state) {
  if (!state) return [];
  const safeState = {
    constraints: state.constraints || {},
    components: state.components || [],
  };
  const findings = [];
  for (const rule of RULES) {
    if (rule.runMany) {
      const list = rule.runMany(safeState) || [];
      findings.push(...list);
      continue;
    }
    if (!rule.when || !rule.when(safeState)) continue;
    findings.push({
      id: rule.id,
      ruleId: rule.id,
      severity: rule.severity,
      title: rule.title,
      detail: rule.detailFrom ? rule.detailFrom(safeState) : "",
      suggestedFix: rule.suggestedFix,
      citations: rule.citations || [],
      outageRefs: rule.outageRefs || [],
    });
  }
  findings.sort(
    (a, b) => SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity],
  );
  return findings;
}

// Diff against expected components for the case. Used in the review screen.
export function diffComponents(chosenIds, expectedIds) {
  const chosen = new Set(chosenIds);
  const expected = new Set(expectedIds);
  const covered = expectedIds.filter((id) => chosen.has(id));
  const missed = expectedIds.filter((id) => !chosen.has(id));
  const extra = chosenIds.filter((id) => !expected.has(id));
  return { covered, missed, extra };
}

export const LINT_RULES_INDEX = RULES.map((r) => ({
  id: r.id,
  severity: r.severity,
  title: r.title || null,
  citations: r.citations || [],
  outageRefs: r.outageRefs || [],
}));
