// Bug Finder scenarios — pre-built flawed designs for the user to critique.
//
// Each scenario is a typed design (constraints + justified components) plus a
// list of candidate bugs. The user checks bugs they think are real; the
// reveal step compares with ground truth AND runs the architecture linter
// against the design (every real bug should correspond to a fired rule, but
// the linter may also catch things the user missed).
//
// Decoys are deliberately plausible — paraphrasing common system-design
// folklore that isn't actually wrong for THIS design. The point is to train
// recognition of real failure shapes vs. surface-level pattern matching.

export const BUG_SCENARIOS = [
  {
    id: "checkout-double-charge",
    title: "Checkout that double-charges",
    blurb:
      "Standard e-commerce checkout. Customer support keeps getting tickets about duplicate orders during sales.",
    difficulty: "starter",
    narrative:
      "An e-commerce platform doing ~500 orders/sec at peak. Mobile clients with flaky networks frequently retry POST /checkout. The team is small and is shipping fast.",
    design: {
      constraints: {
        qpsRead: "5000",
        qpsWrite: "500",
        latencyP95: "1500",
        consistency: "strong",
        durability: "high",
        cost: "medium",
        team: "6",
        growth: "5x",
      },
      components: [
        {
          id: "c1",
          paletteId: "load-balancer",
          name: "Load Balancer",
          justification:
            "Distributes traffic across the API servers. Standard L7 routing.",
        },
        {
          id: "c2",
          paletteId: "api-server",
          name: "API Server",
          justification:
            "Stateless service. POST /checkout creates an order, calls payment provider, sends a confirmation email, updates analytics, returns the response to the user.",
        },
        {
          id: "c3",
          paletteId: "sql-database",
          name: "SQL Database",
          justification:
            "Single Postgres primary stores orders, payments, customers. Strong consistency for money flows.",
        },
        {
          id: "c4",
          paletteId: "cache",
          name: "Cache",
          justification:
            "Redis caches product catalog. Cache stays fresh because we update it on every product change.",
        },
      ],
    },
    candidateBugs: [
      {
        id: "no-idempotency",
        label: "POST /checkout has no idempotency key",
        isReal: true,
        severity: "high",
        ruleMatch: "payment-without-idempotency",
        explanation:
          "Mobile retry under flaky network → same checkout submitted twice → two charges, two orders. Classic Knight-Capital-class bug at smaller scale.",
        citations: [
          "03_design_patterns/idempotency.md",
          "09_real_outages/knight_capital_2012.md",
        ],
      },
      {
        id: "sync-side-effects",
        label: "Email + analytics live on the synchronous request path",
        isReal: true,
        severity: "medium",
        ruleMatch: "sync-side-effects",
        explanation:
          "If the email provider or analytics endpoint slows, /checkout slows. Side effects belong behind a queue.",
        citations: ["02_building_blocks/message_queues.md"],
      },
      {
        id: "cache-invalidation",
        label: "Cache invalidation strategy isn't real",
        isReal: true,
        severity: "medium",
        ruleMatch: "strong-with-cache",
        explanation:
          'The justification says "we update it on every product change" without mentioning failure cases (write succeeds, cache update fails). Cache + strong consistency requires either write-through or explicit drift handling.',
        citations: [
          "06_trade_offs/consistency_vs_availability.md",
          "02_building_blocks/caching.md",
        ],
      },
      {
        id: "no-rate-limit",
        label: "No rate limiting on a public, money-handling endpoint",
        isReal: true,
        severity: "medium",
        ruleMatch: "no-rate-limit-on-public-api",
        explanation:
          "Public mobile clients hitting /checkout with no rate limit means one bad client (or attacker) can starve everyone.",
        citations: ["02_building_blocks/rate_limiter.md"],
      },
      {
        id: "no-observability",
        label: "No observability for the payment path",
        isReal: true,
        severity: "medium",
        ruleMatch: "no-observability",
        explanation:
          "When the duplicate-order tickets come in, the team has no metrics or traces to find the cause. Money flows must be observable per-step.",
        citations: ["02_building_blocks/monitoring_and_logging.md"],
      },
      {
        id: "decoy-microservices",
        label: "Should split into microservices for orders, payments, email",
        isReal: false,
        explanation:
          "Decoy. Team of 6, modest QPS — a modular monolith is right. Splitting now adds deploy/coordination cost without buying anything.",
      },
      {
        id: "decoy-nosql",
        label: "Should use NoSQL — Postgres won't scale",
        isReal: false,
        explanation:
          "Decoy. 500 writes/s is well within a single Postgres primary. Money flows want ACID; NoSQL would make idempotency and ledger correctness harder, not easier.",
      },
      {
        id: "decoy-cdn",
        label: "Needs a CDN in front of the checkout API",
        isReal: false,
        explanation:
          "Decoy. CDN is for cacheable static content; you don't cache dynamic POST /checkout responses.",
      },
      {
        id: "decoy-eventual",
        label: "Strong consistency is overkill for orders",
        isReal: false,
        explanation:
          "Decoy. Money + inventory wants strong consistency; eventual would create real correctness bugs (overselling, lost charges).",
      },
    ],
  },

  {
    id: "photo-gallery-overload",
    title: "Photo gallery serving from SQL",
    blurb:
      "A user-facing photo app where every page load gets slower as the platform grows.",
    difficulty: "starter",
    narrative:
      "A photo-sharing app with 100K daily users. Photos and metadata both live in Postgres. As the photo count grows, the home feed gets visibly slower; ops complains about disk IOPS.",
    design: {
      constraints: {
        qpsRead: "12000",
        qpsWrite: "300",
        latencyP95: "300",
        consistency: "eventual",
        durability: "high",
        cost: "low",
        team: "4",
        growth: "10x",
      },
      components: [
        {
          id: "c1",
          paletteId: "api-server",
          name: "API Server",
          justification:
            "Serves the feed: returns photo metadata + binary blob from Postgres. Also handles uploads from mobile clients.",
        },
        {
          id: "c2",
          paletteId: "sql-database",
          name: "SQL Database",
          justification:
            "Postgres primary stores users, photos (as bytea), and metadata. Photos are served directly from this table on read.",
        },
      ],
    },
    candidateBugs: [
      {
        id: "blob-in-sql",
        label: "Photo binaries shouldn't live in SQL — use blob storage",
        isReal: true,
        severity: "high",
        ruleMatch: null, // not directly lintable — surface knowledge
        explanation:
          "Storing photos as bytea blows up table size, kills cache hit rates, and pushes bandwidth through the DB. Move binaries to object storage; SQL holds the URL.",
        citations: ["02_building_blocks/blob_storage.md"],
      },
      {
        id: "no-cdn",
        label: "No CDN for user-facing media",
        isReal: true,
        severity: "medium",
        ruleMatch: "no-cdn-for-static",
        explanation:
          "Photos are static after upload. Origin (or even blob storage direct) eats avoidable bandwidth and latency. CDN is the standard fix.",
        citations: ["02_building_blocks/cdn.md"],
      },
      {
        id: "no-cache",
        label: "Tight latency target with no cache layer",
        isReal: true,
        severity: "high",
        ruleMatch: "low-latency-no-cache",
        explanation:
          "12K read QPS at 300ms p95 with no cache means every read does a DB round-trip. Hot feed entries (popular users, trending photos) should be cached.",
        citations: ["02_building_blocks/caching.md"],
      },
      {
        id: "no-load-balancer",
        label: "No load balancer at 12K read QPS",
        isReal: true,
        severity: "high",
        ruleMatch: "no-load-balancer-at-scale",
        explanation:
          "One API server can't carry 12K QPS, and there's no path to scale horizontally without a balancer.",
        citations: ["02_building_blocks/load_balancers.md"],
      },
      {
        id: "no-observability",
        label: "No observability stack",
        isReal: true,
        severity: "medium",
        ruleMatch: "no-observability",
        explanation:
          "\"Ops complains about disk IOPS\" — without metrics and traces, the team is debugging from anecdote. Make the slow query and IO visible.",
        citations: ["02_building_blocks/monitoring_and_logging.md"],
      },
      {
        id: "decoy-shard",
        label: "Need to shard the database now",
        isReal: false,
        explanation:
          "Decoy. 300 writes/s doesn't justify sharding; pulling blobs out of SQL plus a cache will solve the visible problem first.",
      },
      {
        id: "decoy-strong",
        label: "Should switch to strong consistency",
        isReal: false,
        explanation:
          "Decoy. Photo feed is fine as eventual — slightly stale order is acceptable for media. Strong consistency would force every read to bypass cache.",
      },
      {
        id: "decoy-mongo",
        label: "Should use MongoDB instead of Postgres",
        isReal: false,
        explanation:
          "Decoy. The store is fine. The problem is what the store is being used FOR (binary blobs, no cache).",
      },
    ],
  },

  {
    id: "notification-firehose",
    title: "Notification firehose with no controls",
    blurb:
      "A service that sends emails and push notifications. Customers periodically get duplicates or — worse — silence.",
    difficulty: "core",
    narrative:
      "A SaaS notification service. Other internal services call POST /notify (channel, user, payload). Volume spikes during incidents and product launches. Recently a downstream provider blip caused a 4-hour notification storm.",
    design: {
      constraints: {
        qpsRead: "100",
        qpsWrite: "8000",
        latencyP95: "500",
        consistency: "eventual",
        durability: "high",
        cost: "medium",
        team: "5",
        growth: "10x",
      },
      components: [
        {
          id: "c1",
          paletteId: "api-server",
          name: "API Server",
          justification:
            "Accepts /notify calls and synchronously sends to email/SMS/push providers. Returns 200 once the provider acks.",
        },
        {
          id: "c2",
          paletteId: "sql-database",
          name: "SQL Database",
          justification:
            "Postgres stores notification history.",
        },
        {
          id: "c3",
          paletteId: "message-queue",
          name: "Message Queue",
          justification:
            "Buffer for retry on provider failures.",
        },
      ],
    },
    candidateBugs: [
      {
        id: "queue-no-controls",
        label: "Queue has no DLQ / retry / lag controls",
        isReal: true,
        severity: "medium",
        ruleMatch: "queue-no-controls",
        explanation:
          'Justification just says "buffer for retry" — no DLQ destination, no max retries, no lag alarm. Queues silently grow until they collapse.',
        citations: ["03_design_patterns/back_pressure.md"],
      },
      {
        id: "sync-call",
        label: "API server calls providers synchronously",
        isReal: true,
        severity: "high",
        ruleMatch: null,
        explanation:
          "If a provider slows from 100ms to 5s, /notify slows with it. Inbound should enqueue and return 202; workers consume.",
        citations: ["02_building_blocks/message_queues.md"],
      },
      {
        id: "sql-write-bottleneck",
        label: "8K writes/s into a single Postgres primary",
        isReal: true,
        severity: "medium",
        ruleMatch: "sql-write-bottleneck",
        explanation:
          "Each notification logs a row → 8K writes/s on a single primary will saturate IO and replication. Either shard, partition, or use a write-optimized store.",
        citations: ["03_design_patterns/sharding.md"],
      },
      {
        id: "no-idempotency",
        label: "No idempotency keys on /notify",
        isReal: true,
        severity: "high",
        ruleMatch: null,
        explanation:
          "Internal services retry on timeout → same notification submitted twice → user sees duplicate emails. Idempotency keys per (caller, request-id).",
        citations: ["03_design_patterns/idempotency.md"],
      },
      {
        id: "no-rate-limit",
        label: "No rate limiting per caller",
        isReal: true,
        severity: "medium",
        ruleMatch: null,
        explanation:
          "One buggy caller can flood the queue and starve other tenants. Per-caller rate limits keep noisy neighbors contained.",
        citations: ["02_building_blocks/rate_limiter.md"],
      },
      {
        id: "no-observability",
        label: "No observability stack",
        isReal: true,
        severity: "medium",
        ruleMatch: "no-observability",
        explanation:
          "\"4-hour notification storm\" — without per-channel error rates and queue depth metrics, the team can't see the storm forming.",
        citations: ["02_building_blocks/monitoring_and_logging.md"],
      },
      {
        id: "decoy-pubsub",
        label: "Should use pub/sub instead of a queue",
        isReal: false,
        explanation:
          "Decoy. Each notification is a single delivery, not a fanout. Queue is the right choice; the real bug is its missing controls.",
      },
      {
        id: "decoy-strong",
        label: "Should use strong consistency",
        isReal: false,
        explanation:
          "Decoy. Notifications are inherently eventual — strong consistency adds latency without correctness benefit.",
      },
    ],
  },

  {
    id: "search-via-sql",
    title: "Search built on SQL LIKE",
    blurb:
      "Product search runs `WHERE name LIKE '%query%'`. It's slow, doesn't rank, and the DB is the bottleneck.",
    difficulty: "starter",
    narrative:
      "An online marketplace with 5M products. Product search is implemented as a SQL `LIKE` query in the same Postgres that handles orders. As traffic grows, search latency dominates the catalog page.",
    design: {
      constraints: {
        qpsRead: "8000",
        qpsWrite: "500",
        latencyP95: "200",
        consistency: "eventual",
        durability: "high",
        cost: "medium",
        team: "8",
        growth: "5x",
      },
      components: [
        {
          id: "c1",
          paletteId: "load-balancer",
          name: "Load Balancer",
          justification: "Routes API traffic.",
        },
        {
          id: "c2",
          paletteId: "api-server",
          name: "API Server",
          justification:
            "Handles catalog browsing, search, and order placement. Search runs `WHERE name LIKE '%q%'`.",
        },
        {
          id: "c3",
          paletteId: "sql-database",
          name: "SQL Database",
          justification:
            "Postgres holds products, orders, inventory. Search hits the same primary.",
        },
        {
          id: "c4",
          paletteId: "cache",
          name: "Cache",
          justification:
            "Caches popular product detail pages by product ID. TTL 5 minutes.",
        },
      ],
    },
    candidateBugs: [
      {
        id: "search-on-sql",
        label: "Full-text search via SQL LIKE",
        isReal: true,
        severity: "medium",
        ruleMatch: "search-via-sql",
        explanation:
          "LIKE '%q%' can't use indexes, doesn't rank by relevance, and full-scans the table. A search index (Elasticsearch, Meili) is the standard fix.",
        citations: ["02_building_blocks/search_systems.md"],
      },
      {
        id: "search-on-primary",
        label: "Search load hits the same Postgres primary as orders",
        isReal: true,
        severity: "high",
        ruleMatch: null,
        explanation:
          "Heavy search queries compete with order writes for IO and locks. Even if you keep search in SQL, it should at minimum hit a replica.",
        citations: ["03_design_patterns/replication.md"],
      },
      {
        id: "no-observability",
        label: "No observability stack",
        isReal: true,
        severity: "medium",
        ruleMatch: "no-observability",
        explanation:
          "Slow query log, p95 per endpoint, DB IO — none of it is captured. Optimization without measurement is guessing.",
        citations: ["02_building_blocks/monitoring_and_logging.md"],
      },
      {
        id: "no-rate-limit",
        label: "No rate limiter for search traffic",
        isReal: true,
        severity: "medium",
        ruleMatch: "no-rate-limit-on-public-api",
        explanation:
          "Search is the most expensive endpoint and the most abusable (scrapers, bots). Rate-limit it specifically.",
        citations: ["02_building_blocks/rate_limiter.md"],
      },
      {
        id: "decoy-cache-search",
        label: "Cache TTL of 5 minutes is too long",
        isReal: false,
        explanation:
          "Decoy. Product detail caching at 5 minutes is reasonable for a marketplace; staleness here is fine. Not the actual bug.",
      },
      {
        id: "decoy-cdn",
        label: "Should put a CDN in front of search results",
        isReal: false,
        explanation:
          "Decoy. Search results are personalized and dynamic; not CDN-cacheable. CDN belongs in front of static product images, not the search endpoint.",
      },
      {
        id: "decoy-shard",
        label: "Need to shard the database",
        isReal: false,
        explanation:
          "Decoy. 500 writes/s and 5M products is well within a single primary. Move search out of SQL first; sharding is an answer to the wrong question here.",
      },
    ],
  },

  {
    id: "iot-ingest-overload",
    title: "IoT ingest into a single Postgres",
    blurb:
      "Sensor pings from a million devices write to one SQL primary. The DB is on fire.",
    difficulty: "core",
    narrative:
      "A fleet-management product. ~1M IoT devices ping with location and telemetry every 30 seconds. Engineering keeps adding read replicas but the primary keeps falling over.",
    design: {
      constraints: {
        qpsRead: "2000",
        qpsWrite: "30000",
        latencyP95: "500",
        consistency: "eventual",
        durability: "high",
        cost: "medium",
        team: "10",
        growth: "5x",
      },
      components: [
        {
          id: "c1",
          paletteId: "load-balancer",
          name: "Load Balancer",
          justification: "Routes ingest traffic.",
        },
        {
          id: "c2",
          paletteId: "api-server",
          name: "API Server",
          justification:
            "Receives device pings via HTTP and writes them straight to Postgres.",
        },
        {
          id: "c3",
          paletteId: "sql-database",
          name: "SQL Database",
          justification:
            "Postgres primary stores all telemetry rows. Read replicas exist for dashboard queries.",
        },
        {
          id: "c4",
          paletteId: "sql-replica",
          name: "SQL Read Replica",
          justification: "Async replicas for dashboards.",
        },
      ],
    },
    candidateBugs: [
      {
        id: "sql-write-bottleneck",
        label: "30K writes/s into a single Postgres primary",
        isReal: true,
        severity: "high",
        ruleMatch: "sql-write-bottleneck",
        explanation:
          "Read replicas don't help write throughput. Postgres tops out well below 30K writes/s on commodity hardware. Sharding, time-series store, or buffered writes are the fix paths.",
        citations: [
          "03_design_patterns/sharding.md",
          "06_trade_offs/sql_vs_nosql.md",
        ],
      },
      {
        id: "no-buffer",
        label: "No queue/buffer between devices and the DB",
        isReal: true,
        severity: "high",
        ruleMatch: null,
        explanation:
          "Without a buffer, every spike (every device boots after a network blip) hits the DB synchronously. A queue absorbs spikes and lets workers write at sustainable rate.",
        citations: ["02_building_blocks/message_queues.md"],
      },
      {
        id: "no-observability",
        label: "No observability stack",
        isReal: true,
        severity: "medium",
        ruleMatch: "no-observability",
        explanation:
          "DB write latency, replica lag, queue depth — none of these are tracked. The team is firefighting blind.",
        citations: ["02_building_blocks/monitoring_and_logging.md"],
      },
      {
        id: "no-rate-limit",
        label: "No per-device rate limiting",
        isReal: true,
        severity: "medium",
        ruleMatch: "no-rate-limit-on-public-api",
        explanation:
          "A single misbehaving device firmware can flood the ingest path. Per-device caps protect the global service.",
        citations: ["02_building_blocks/rate_limiter.md"],
      },
      {
        id: "decoy-strong",
        label: "Should switch to strong consistency",
        isReal: false,
        explanation:
          "Decoy. Telemetry is inherently eventual; latest-write-wins is fine. Strong consistency would add cost without buying anything.",
      },
      {
        id: "decoy-cache",
        label: "Need a cache to handle the read load",
        isReal: false,
        explanation:
          "Decoy. Reads are 2K, writes are 30K. The bottleneck is writes. A cache wouldn't move the needle.",
      },
      {
        id: "decoy-cdn",
        label: "Need a CDN for the ingest path",
        isReal: false,
        explanation:
          "Decoy. Ingest is dynamic POST traffic, not CDN-cacheable.",
      },
    ],
  },

  {
    id: "premature-microservices",
    title: "Microservices for a 3-person team",
    blurb:
      "An early-stage startup splits into seven services before they have customers. Velocity tanks.",
    difficulty: "core",
    narrative:
      "A pre-product-market-fit startup with 3 engineers. Following best-practices blog posts, they split the codebase into seven microservices: users, orders, inventory, payments, notifications, search, and admin. Deployments take half a day.",
    design: {
      constraints: {
        qpsRead: "200",
        qpsWrite: "20",
        latencyP95: "500",
        consistency: "strong",
        durability: "high",
        cost: "low",
        team: "3",
        growth: "10x",
      },
      components: [
        {
          id: "c1",
          paletteId: "api-gateway",
          name: "API Gateway",
          justification:
            "Routes to seven services. Would handle auth in the future.",
        },
        {
          id: "c2",
          paletteId: "api-server",
          name: "User Service",
          justification: "Owns users.",
        },
        {
          id: "c3",
          paletteId: "api-server",
          name: "Order Service",
          justification: "Owns orders.",
        },
        {
          id: "c4",
          paletteId: "api-server",
          name: "Inventory Service",
          justification: "Owns inventory.",
        },
        {
          id: "c5",
          paletteId: "api-server",
          name: "Payment Service",
          justification: "Owns payments.",
        },
        {
          id: "c6",
          paletteId: "sql-database",
          name: "SQL Database",
          justification:
            "Postgres holds everything; each service has its own schema.",
        },
      ],
    },
    candidateBugs: [
      {
        id: "premature-microservices",
        label: "Five+ services for three engineers",
        isReal: true,
        severity: "low",
        ruleMatch: "microservices-small-team",
        explanation:
          "Each service adds deploy, observability, on-call, and inter-service-call cost. Three engineers can't pay that overhead and still ship product. A modular monolith is right at this stage.",
        citations: ["04_system_evolutions/from_monolith_to_microservices.md"],
      },
      {
        id: "gateway-no-auth",
        label: "API gateway with no real auth",
        isReal: true,
        severity: "low",
        ruleMatch: "api-gateway-without-auth",
        explanation:
          '"Would handle auth in the future" — the gateway exists, but the one job edge gateways are best at (centralized auth) is unbuilt. Either build it now or remove the gateway.',
        citations: ["02_building_blocks/api_gateway.md"],
      },
      {
        id: "no-observability",
        label: "No observability stack",
        isReal: true,
        severity: "medium",
        ruleMatch: "no-observability",
        explanation:
          "Distributed systems multiply the cost of bad observability. With seven services and no metrics/traces, debugging a slow request is impossible.",
        citations: ["02_building_blocks/monitoring_and_logging.md"],
      },
      {
        id: "shared-db",
        label: "Seven services sharing one Postgres",
        isReal: true,
        severity: "medium",
        ruleMatch: null,
        explanation:
          "If you really wanted independent services you'd give each its own data store. Shared DB means you have a distributed monolith — all the cost of microservices, none of the isolation.",
        citations: ["04_system_evolutions/from_monolith_to_microservices.md"],
      },
      {
        id: "decoy-pubsub",
        label: "Need pub/sub between services",
        isReal: false,
        explanation:
          "Decoy. Adding pub/sub on top of the over-decomposition makes it worse, not better. Consolidate first.",
      },
      {
        id: "decoy-shard",
        label: "Should shard the database",
        isReal: false,
        explanation:
          "Decoy. 20 writes/s. Sharding before product-market-fit is theater.",
      },
      {
        id: "decoy-cdn",
        label: "Should add a CDN",
        isReal: false,
        explanation:
          "Decoy. CDN doesn't address the actual problem (architecture vs team size).",
      },
    ],
  },
];

export function getBugScenario(id) {
  return BUG_SCENARIOS.find((s) => s.id === id) || null;
}
