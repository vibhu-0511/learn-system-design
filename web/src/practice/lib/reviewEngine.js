const detectors = [
  {
    id: "missing-observability",
    area: "Observability",
    severity: "High",
    terms: ["monitor", "metric", "log", "trace", "alert", "dashboard", "correlation"],
    issue: "Observability is not described.",
    whyItMatters:
      "Without metrics, logs, traces, and clear alerts, you cannot prove whether a design change improved the system or catch regressions early.",
    suggestedFix:
      "Define RED metrics for services, USE metrics for resources, structured logs with correlation IDs, and alerts for latency, errors, saturation, queue lag, and dependency failures.",
    relatedConcepts: ["Observability"],
  },
  {
    id: "missing-failure-modes",
    area: "Reliability",
    severity: "High",
    terms: ["fail", "failure", "fallback", "timeout", "retry", "circuit", "degraded"],
    issue: "Failure behavior is unclear.",
    whyItMatters:
      "A design that works only on the happy path can collapse when a database, API, queue, or third-party dependency slows down.",
    suggestedFix:
      "List each dependency with timeout, retry policy, fallback behavior, circuit breaker need, and user-visible degraded mode.",
    relatedConcepts: ["Circuit Breaker", "Back Pressure"],
  },
  {
    id: "sync-side-effects",
    area: "Latency",
    severity: "Medium",
    terms: ["email", "notification", "analytics", "webhook", "report", "export"],
    issue: "Non-critical side effects may be on the user-facing path.",
    whyItMatters:
      "Synchronous side effects increase latency and couple user actions to services that do not need to block the response.",
    suggestedFix:
      "Move non-critical work behind events or queues, keep the core transaction small, and track DLQ plus consumer lag.",
    relatedConcepts: ["Message Queue", "Event-Driven Architecture"],
  },
  {
    id: "missing-idempotency",
    area: "Correctness",
    severity: "High",
    terms: ["payment", "order", "booking", "transaction", "webhook", "retry"],
    issue: "Retry-sensitive workflow likely needs idempotency.",
    whyItMatters:
      "Retries, duplicate webhooks, mobile resubmits, and queue redelivery can create duplicate payments, orders, or bookings.",
    suggestedFix:
      "Add idempotency keys to write APIs and consumers. Store request result by key and make retries return the original outcome.",
    relatedConcepts: ["Idempotency", "Saga Pattern"],
  },
  {
    id: "cache-without-invalidation",
    area: "Data consistency",
    severity: "Medium",
    terms: ["cache", "redis", "cdn", "memcached"],
    issue: "Caching is mentioned; invalidation and freshness rules need to be explicit.",
    whyItMatters:
      "Caches improve speed but can quietly serve stale or incorrect data if TTL, ownership, and invalidation are unclear.",
    suggestedFix:
      "Document what is cached, TTL, invalidation trigger, stale-read tolerance, and fallback behavior on cache miss or cache outage.",
    relatedConcepts: ["Cache", "Consistency"],
  },
  {
    id: "queue-without-backpressure",
    area: "Async processing",
    severity: "Medium",
    terms: ["queue", "kafka", "rabbitmq", "sqs", "pubsub", "event"],
    issue: "Async messaging is mentioned; back pressure and poison-message handling need detail.",
    whyItMatters:
      "Queues hide overload until lag explodes. Poison messages can block consumers or create infinite retries.",
    suggestedFix:
      "Define bounded producer behavior, consumer concurrency, max retries, DLQ, replay process, ordering key, and lag alerts.",
    relatedConcepts: ["Message Queue", "Back Pressure", "Event-Driven Architecture"],
  },
  {
    id: "microservices-risk",
    area: "Simplicity",
    severity: "Medium",
    terms: ["microservice", "microservices", "service mesh", "distributed"],
    issue: "Distributed architecture may be adding operational cost.",
    whyItMatters:
      "Microservices help ownership and scale, but they add network failures, tracing, deployment complexity, and data consistency problems.",
    suggestedFix:
      "Confirm each service boundary has independent ownership, scaling, and data ownership. Otherwise prefer modular monolith boundaries first.",
    relatedConcepts: ["Monolith", "Microservices", "Observability"],
  },
];

const mustHaveSections = [
  {
    id: "traffic",
    label: "Traffic and scale",
    terms: ["qps", "rps", "users", "traffic", "throughput", "latency", "p95", "p99"],
    prompt: "Add expected users, QPS/RPS, read/write ratio, p95/p99 latency target, and growth assumption.",
  },
  {
    id: "data",
    label: "Data model and stores",
    terms: ["database", "postgres", "mysql", "mongodb", "dynamodb", "redis", "table", "schema", "store"],
    prompt: "Add core entities, source of truth, data stores, ownership, and which data must be strongly consistent.",
  },
  {
    id: "flow",
    label: "Request/data flow",
    terms: ["api", "request", "flow", "client", "server", "worker", "consumer", "producer"],
    prompt: "Add the main read path, write path, background path, and external dependencies.",
  },
];

export function analyzeBrief(rawBrief) {
  const text = rawBrief.trim();
  const normalized = text.toLowerCase();

  if (!text) {
    return {
      score: 0,
      findings: [],
      missing: mustHaveSections,
      summary: "Paste a system brief to get review findings.",
    };
  }

  const findings = detectors
    .filter((detector) => detector.terms.some((term) => normalized.includes(term)))
    .map(({ terms, ...finding }) => finding);

  const missing = mustHaveSections.filter(
    (section) => !section.terms.some((term) => normalized.includes(term)),
  );

  const missingFindings = missing.map((section) => ({
    id: `missing-${section.id}`,
    area: "Completeness",
    severity: "High",
    issue: `${section.label} is missing or too vague.`,
    whyItMatters:
      "Architecture review quality depends on knowing constraints. Without this, recommendations become generic.",
    suggestedFix: section.prompt,
    relatedConcepts: ["Latency", "Throughput", "Consistency"],
  }));

  const allFindings = [...missingFindings, ...findings];
  const score = Math.max(20, 100 - allFindings.length * 10 - missing.length * 5);

  return {
    score,
    findings: allFindings,
    missing,
    summary:
      allFindings.length === 0
        ? "The brief covers the v1 checklist well. Now stress-test failure modes and trade-offs."
        : `Found ${allFindings.length} review points. Start with high-severity correctness, reliability, and observability gaps.`,
  };
}

export function buildProposal(systemName, findings) {
  const topFindings = findings.slice(0, 3);
  if (topFindings.length === 0) {
    return {
      title: `ADR: Improve ${systemName || "the system"} with measured architecture review`,
      text:
        "No major gaps were detected from the current brief. The next step is to validate the design with real traffic, failure, and latency data before proposing architectural changes.",
    };
  }

  const primary = topFindings[0];
  const recommendations = topFindings
    .map((finding, index) => `${index + 1}. ${finding.suggestedFix}`)
    .join("\n");

  return {
    title: `ADR: Reduce ${primary.area.toLowerCase()} risk in ${systemName || "current system"}`,
    text: `Context
The current architecture brief shows a likely ${primary.area.toLowerCase()} risk: ${primary.issue}

Why it matters
${primary.whyItMatters}

Options considered
1. Do nothing now: fastest, but keeps the current risk.
2. Apply a narrow fix: lower risk with limited blast radius.
3. Redesign the subsystem: higher potential upside, but higher delivery and migration risk.

Recommendation
Start with a narrow fix:
${recommendations}

Trade-offs
This adds some implementation and operational work, but it makes the system easier to reason about, debug, and scale safely.

Rollout
Ship behind a small scope, add dashboards first, test failure behavior, then expand gradually.

Success metrics
Track p95/p99 latency, error rate, saturation, retry rate, queue lag where relevant, and user-visible failure rate.`,
  };
}
