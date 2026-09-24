// capacity.js — derive storage / bandwidth / cost numbers and predict
// bottlenecks from a typed design (constraints + components).
//
// All math is deliberately rough order-of-magnitude. The goal is "what
// breaks next?" and "is this thousands or millions per month?" — not a
// procurement spreadsheet. Every number here is a sanity check.

import { lintDrill } from "./drillLinter.js";
import { PALETTE_BY_ID } from "../data/drillCases.js";

export const DEFAULT_ASSUMPTIONS = {
  avgPayloadKB: 5, // average request/response body
  retentionDays: 365, // how long writes are kept
  replicationFactor: 3, // copies kept (3 = high durability default)
  readAmplification: 1, // multiplier for cache misses, joins, fanout
  writeAmplification: 2, // logs, indexes, audit trail
  cacheHitRate: 0.7, // assumption for DB IOPS estimate
};

const SECONDS_PER_DAY = 86400;
const SECONDS_PER_MONTH = 86400 * 30;

function asNum(value) {
  if (value == null) return NaN;
  const n = parseFloat(String(value).replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : NaN;
}

function safeNum(value, fallback = 0) {
  const n = asNum(value);
  return Number.isFinite(n) ? n : fallback;
}

export function computeCapacity(
  constraints = {},
  components = [],
  assumptionOverrides = {},
) {
  const a = { ...DEFAULT_ASSUMPTIONS, ...assumptionOverrides };
  const qpsRead = safeNum(constraints.qpsRead);
  const qpsWrite = safeNum(constraints.qpsWrite);
  const replication =
    constraints.durability === "high" ? a.replicationFactor : 1;

  // Storage
  const writesPerDay = qpsWrite * SECONDS_PER_DAY;
  const writeBytesPerDay =
    writesPerDay * a.avgPayloadKB * 1024 * a.writeAmplification;
  const storagePerDayGB = writeBytesPerDay / 1024 ** 3;
  const storagePerYearGB = storagePerDayGB * a.retentionDays;
  const storageWithReplGB = storagePerYearGB * replication;

  // Bandwidth (peak Mbps; rough — assume 2x peak factor)
  const peakFactor = 2;
  const bytesInPerSec = qpsWrite * a.avgPayloadKB * 1024 * peakFactor;
  const bytesOutPerSec =
    qpsRead * a.avgPayloadKB * 1024 * peakFactor * a.readAmplification;
  const bandwidthInMbps = (bytesInPerSec * 8) / 1024 ** 2;
  const bandwidthOutMbps = (bytesOutPerSec * 8) / 1024 ** 2;
  const bandwidthGBOutPerMonth =
    (bytesOutPerSec * SECONDS_PER_MONTH) / 1024 ** 3;

  // DB IOPS estimate (writes always hit DB; reads only on cache miss)
  const cacheMissRate = 1 - a.cacheHitRate;
  const dbIops = qpsWrite * a.writeAmplification + qpsRead * cacheMissRate;

  // Cost ranges (rough monthly USD)
  // Storage: $0.10/GB/month (object) → $1/GB/month (DB primary disk)
  const storageCostLow = storageWithReplGB * 0.1;
  const storageCostHigh = storageWithReplGB * 1.0;
  // Bandwidth egress: ~$0.09/GB on AWS, less if CDN'd
  const bandwidthCost = bandwidthGBOutPerMonth * 0.09;
  // Compute: ballpark ~$200/mo per 1K combined QPS (mixed instance sizes)
  const computeBoxes = Math.max(2, Math.ceil((qpsRead + qpsWrite) / 1000));
  const computeCost = computeBoxes * 200;

  const monthlyCostLow =
    storageCostLow + bandwidthCost * 0.3 + computeCost * 0.7;
  const monthlyCostHigh =
    storageCostHigh + bandwidthCost * 1.5 + computeCost * 1.5;

  return {
    inputs: {
      qpsRead,
      qpsWrite,
      payloadKB: a.avgPayloadKB,
      retentionDays: a.retentionDays,
      replicationFactor: replication,
      readAmplification: a.readAmplification,
      writeAmplification: a.writeAmplification,
      cacheHitRate: a.cacheHitRate,
    },
    storage: {
      perDayGB: storagePerDayGB,
      perYearGB: storagePerYearGB,
      withReplicationGB: storageWithReplGB,
    },
    bandwidth: {
      inMbps: bandwidthInMbps,
      outMbps: bandwidthOutMbps,
      gbOutPerMonth: bandwidthGBOutPerMonth,
    },
    db: {
      iopsPeak: dbIops,
    },
    cost: {
      monthlyLow: monthlyCostLow,
      monthlyHigh: monthlyCostHigh,
      breakdown: {
        storageLow: storageCostLow,
        storageHigh: storageCostHigh,
        bandwidth: bandwidthCost,
        compute: computeCost,
      },
    },
  };
}

const MULTIPLIERS = [2, 10, 100, 1000];

export function simulateBottlenecks(constraints = {}, components = []) {
  const baseFindingIds = new Set(
    lintDrill({ constraints, components }).map((f) => f.ruleId || f.id),
  );

  return MULTIPLIERS.map((multiplier) => {
    const scaled = {
      ...constraints,
      qpsRead: String(Math.round(safeNum(constraints.qpsRead) * multiplier)),
      qpsWrite: String(Math.round(safeNum(constraints.qpsWrite) * multiplier)),
    };

    const lintNew = lintDrill({ constraints: scaled, components }).filter(
      (f) => !baseFindingIds.has(f.ruleId || f.id),
    );

    const heuristic = capacityHeuristics(scaled, components, multiplier);

    const breaks = [
      ...lintNew.map((f) => ({
        kind: "lint",
        ruleId: f.ruleId || f.id,
        title: f.title,
        detail: f.detail,
        suggestedFix: f.suggestedFix,
        severity: f.severity,
        citations: f.citations || [],
        outageRefs: f.outageRefs || [],
      })),
      ...heuristic,
    ];

    return {
      multiplier,
      scaledQpsRead: safeNum(scaled.qpsRead),
      scaledQpsWrite: safeNum(scaled.qpsWrite),
      breaks,
    };
  });
}

function capacityHeuristics(scaledConstraints, components, multiplier) {
  const qr = safeNum(scaledConstraints.qpsRead);
  const qw = safeNum(scaledConstraints.qpsWrite);
  const text = components
    .map((c) => (c.justification || "").toLowerCase())
    .join(" \n ");
  const has = (id) => components.some((c) => c.paletteId === id);

  const breaks = [];

  // Sharding becomes mandatory at extreme write QPS
  if (qw > 50000 && !has("sql-shard")) {
    breaks.push({
      kind: "capacity",
      title: "Sharding mandatory at this write rate",
      detail: `${qw.toLocaleString()} writes/sec is beyond any single primary. A sharded SQL or write-optimized store (Cassandra/Scylla) is the only path forward.`,
      suggestedFix:
        "Pick a partition key that distributes load even in worst-case (avoid hot partitions like Discord 2024).",
      severity: "high",
      citations: [
        "03_design_patterns/sharding.md",
        "06_trade_offs/sql_vs_nosql.md",
      ],
      outageRefs: ["09_real_outages/discord_message_outage_2024.md"],
    });
  }

  // CDN bandwidth at scale
  if (qr > 50000 && !has("cdn")) {
    breaks.push({
      kind: "capacity",
      title: "Origin bandwidth cost explodes without a CDN",
      detail: `At ${qr.toLocaleString()} read QPS, every byte that goes through origin instead of the edge costs ~10× more. CDN bandwidth becomes the dominant cloud-bill line item.`,
      suggestedFix:
        "Add a CDN. Even modest cache hit rates (60–80%) cut origin egress dramatically.",
      severity: "high",
      citations: ["02_building_blocks/cdn.md"],
    });
  }

  // Multi-region only matters at extreme scale or strict availability
  if (
    multiplier >= 100 &&
    (qr > 100000 || qw > 50000) &&
    !/region|geo|multi[ -]?region/.test(text)
  ) {
    breaks.push({
      kind: "capacity",
      title: "Single-region deployment at planet scale",
      detail: `At ${multiplier}× current load (${qr.toLocaleString()} read QPS, ${qw.toLocaleString()} write QPS), single-region operations create cross-region latency for global users and one-region disaster risk.`,
      suggestedFix:
        "Plan for multi-region active-active. Identify which data is global (user profiles) vs regional (recent transactions).",
      severity: "high",
      citations: ["09_real_outages/aws_us_east_1_outage_2021.md"],
      outageRefs: [
        "09_real_outages/aws_us_east_1_outage_2021.md",
        "09_real_outages/amazon_s3_outage_2017.md",
      ],
    });
  }

  // Connection pool exhaustion warning at high concurrency
  if (qr + qw > 25000 && !has("cache")) {
    breaks.push({
      kind: "capacity",
      title: "DB connection pool exhaustion likely",
      detail: `Combined ${(qr + qw).toLocaleString()} QPS with no cache means every request touches the DB. Pool exhaustion cascades fast — Slack 2024 took down the whole platform from this.`,
      suggestedFix:
        "Cache hot reads. Set bounded query timeouts at the app layer so connections release fast.",
      severity: "medium",
      citations: ["02_building_blocks/caching.md"],
      outageRefs: ["09_real_outages/slack_database_incident_2024.md"],
    });
  }

  return breaks;
}

// Phased canvas: at v1 / 10× / 100× / 1000× — what does the stack look like?
export function phasedComponents(constraints = {}, components = []) {
  const has = (id) => components.some((c) => c.paletteId === id);
  const text = components
    .map((c) => (c.justification || "").toLowerCase())
    .join(" \n ");
  const mentionsAsync =
    /(notification|email|sms|push|analytics|webhook|export|report|audit|fanout|side effect)/.test(
      text,
    );

  const v1Stack = components.map((c) => ({
    id: c.paletteId,
    name: c.name || PALETTE_BY_ID[c.paletteId]?.name || c.paletteId,
  }));

  const phases = [
    {
      phase: "v1",
      label: "Today",
      traffic: "as designed",
      stack: v1Stack,
      additions: [],
      rationale:
        v1Stack.length > 0
          ? "Your current design — the smallest thing that ships."
          : "Empty design. Pick a workspace with components first.",
    },
  ];

  // 10×
  const at10x = [];
  if (!has("load-balancer"))
    at10x.push({
      id: "load-balancer",
      name: "Load Balancer",
      why: "Horizontal scaling needs a router and a way to fail over.",
    });
  if (!has("cache") && !has("cdn"))
    at10x.push({
      id: "cache",
      name: "Cache",
      why: "Reduce DB pressure as reads grow; serve hot keys in memory.",
    });
  if (!has("observability"))
    at10x.push({
      id: "observability",
      name: "Observability stack",
      why: "You can't debug a system this size blind.",
    });
  if (!has("rate-limiter") && !has("api-gateway"))
    at10x.push({
      id: "rate-limiter",
      name: "Rate Limiter",
      why: "One bad client can no longer be tolerated.",
    });
  if (
    mentionsAsync &&
    !has("message-queue") &&
    !has("pub-sub")
  )
    at10x.push({
      id: "message-queue",
      name: "Message Queue",
      why: "Move side effects (notifications, analytics, webhooks) off the user path.",
    });

  const stack10x = uniqueStack(v1Stack, at10x);
  phases.push({
    phase: "10x",
    label: "Scale-up",
    traffic: "10× current",
    stack: stack10x,
    additions: at10x,
    rationale:
      "Scale up: route traffic, cache hot reads, see what's happening, push side effects async.",
  });

  // 100×
  const at100x = [];
  if (!has("cdn"))
    at100x.push({
      id: "cdn",
      name: "CDN",
      why: "Edge caching becomes a cost-of-doing-business at this scale.",
    });
  if (has("sql-database") && !has("sql-shard"))
    at100x.push({
      id: "sql-shard",
      name: "Sharded SQL",
      why: "Single primary can't keep up with writes; partition by tenant or hash.",
    });
  if (has("sql-database") && !has("sql-replica"))
    at100x.push({
      id: "sql-replica",
      name: "SQL Read Replicas",
      why: "Push reads to replicas to free the primary for writes.",
    });
  if (!has("message-queue") && !has("pub-sub"))
    at100x.push({
      id: "message-queue",
      name: "Message Queue",
      why: "Absorb traffic bursts and decouple producers from consumers.",
    });

  const stack100x = uniqueStack(stack10x, at100x);
  phases.push({
    phase: "100x",
    label: "Scale-out",
    traffic: "100× current",
    stack: stack100x,
    additions: at100x,
    rationale:
      "Scale out: shard the data, push reads to replicas/CDN, queue everything that can wait.",
  });

  // 1000×
  const at1000x = [
    {
      id: "multi-region",
      name: "Multi-region active-active",
      why: "Planet-scale latency and disaster isolation. Pick what's global vs regional.",
    },
    {
      id: "cell-architecture",
      name: "Cell-based architecture",
      why: "Failure domains smaller than the whole platform — limits blast radius.",
    },
  ];
  if (!has("search-index"))
    at1000x.push({
      id: "search-index",
      name: "Specialized stores per access pattern",
      why: "Search/analytics/timeseries each get their own optimized store.",
    });
  if (!has("pub-sub"))
    at1000x.push({
      id: "pub-sub",
      name: "Event stream backbone",
      why: "Kafka-class log connects services without RPC fan-out.",
    });

  const stack1000x = uniqueStack(stack100x, at1000x);
  phases.push({
    phase: "1000x",
    label: "Planet-scale",
    traffic: "1000× current",
    stack: stack1000x,
    additions: at1000x,
    rationale:
      "Planet-scale: multi-region, cell isolation, dedicated stores per pattern, dedicated infra teams.",
  });

  return phases;
}

function uniqueStack(prev, additions) {
  const seen = new Set(prev.map((c) => c.id));
  const out = [...prev];
  for (const add of additions) {
    if (!seen.has(add.id)) {
      seen.add(add.id);
      out.push({ id: add.id, name: add.name });
    }
  }
  return out;
}

// Formatting helpers used by the UI.
export function formatGB(gb) {
  if (!Number.isFinite(gb) || gb === 0) return "—";
  if (gb < 1) return `${(gb * 1024).toFixed(1)} MB`;
  if (gb < 1024) return `${gb.toFixed(1)} GB`;
  if (gb < 1024 * 1024) return `${(gb / 1024).toFixed(2)} TB`;
  return `${(gb / (1024 * 1024)).toFixed(2)} PB`;
}

export function formatMbps(mbps) {
  if (!Number.isFinite(mbps) || mbps === 0) return "—";
  if (mbps < 1) return `${(mbps * 1024).toFixed(1)} Kbps`;
  if (mbps < 1024) return `${mbps.toFixed(1)} Mbps`;
  return `${(mbps / 1024).toFixed(2)} Gbps`;
}

export function formatUSD(value) {
  if (!Number.isFinite(value)) return "—";
  if (value < 100) return `$${value.toFixed(0)}`;
  if (value < 10000)
    return `$${Math.round(value).toLocaleString("en-US")}`;
  if (value < 1_000_000) return `$${(value / 1000).toFixed(1)}K`;
  return `$${(value / 1_000_000).toFixed(2)}M`;
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) return "—";
  if (value < 1000) return value.toFixed(0);
  return Math.round(value).toLocaleString("en-US");
}
