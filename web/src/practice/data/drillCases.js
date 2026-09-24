// Greenfield drill cases. Each case is a real system you'll design end-to-end:
// state constraints → choose components with justification → get linted →
// compare with the case study from your vault.

export const DRILL_CASES = [
  {
    id: "url-shortener",
    title: "URL Shortener",
    blurb:
      "Like bit.ly. Short codes redirect to long URLs. Massive read traffic, async analytics. Classic warm-up case.",
    difficulty: "beginner",
    prompt:
      "Design a service like Bitly. Users create short codes from long URLs. Redirects must be fast (p95 < 100 ms). Analytics is allowed to lag.",
    refCasePath: "05_case_studies/design_url_shortener.md",
    suggestedConstraints: {
      qpsRead: "17000",
      qpsWrite: "200",
      latencyP95: "100",
      consistency: "eventual",
      durability: "high",
      cost: "low",
      team: "5",
      growth: "10x",
    },
    expectedComponents: [
      "cdn",
      "load-balancer",
      "api-server",
      "cache",
      "sql-database",
      "message-queue",
    ],
    keyInsights: [
      "Redirect path is read-heavy: cache aggressively, treat as the hot path.",
      "Analytics is async — don't block the redirect on a click counter write.",
      "Short-code collision needs a strategy: counter + base62, or hash with retry.",
    ],
  },
  {
    id: "notification-service",
    title: "Notification Service",
    blurb:
      "Sends emails, SMS, and push notifications. The classic queue-based fanout system.",
    difficulty: "beginner",
    prompt:
      "Design a notification service. Other services send `notify(user, channel, payload)`. The service delivers via email/SMS/push, retries failures, dedupes duplicates.",
    refCasePath: "05_case_studies/design_notification_system.md",
    suggestedConstraints: {
      qpsRead: "100",
      qpsWrite: "5000",
      latencyP95: "500",
      consistency: "eventual",
      durability: "high",
      cost: "medium",
      team: "4",
      growth: "10x",
    },
    expectedComponents: [
      "api-server",
      "message-queue",
      "worker",
      "sql-database",
      "kv-store",
    ],
    keyInsights: [
      "Inbound is fire-and-forget: enqueue, return 202.",
      "Idempotency keys prevent duplicate notifications on retry.",
      "Per-channel workers; bounded retries with DLQ for poison messages.",
    ],
  },
  {
    id: "chat",
    title: "Real-time Chat",
    blurb:
      "Like WhatsApp groups or Discord channels. Long-lived connections, presence, message history.",
    difficulty: "intermediate",
    prompt:
      "Design a chat system supporting 1:1 and group chat. Messages must arrive in <500 ms. Users see online presence and unread counts.",
    refCasePath: "05_case_studies/design_chat_system.md",
    suggestedConstraints: {
      qpsRead: "50000",
      qpsWrite: "20000",
      latencyP95: "500",
      consistency: "eventual",
      durability: "high",
      cost: "high",
      team: "10",
      growth: "5x",
    },
    expectedComponents: [
      "api-gateway",
      "api-server",
      "kv-store",
      "message-queue",
      "pub-sub",
      "sql-database",
      "blob-storage",
    ],
    keyInsights: [
      "WebSocket / long-lived connection per user; sticky routing.",
      "Pub/sub fanout for group messages; per-user inbox in KV.",
      "Presence is high-churn — keep in memory, not the main DB.",
    ],
  },
  {
    id: "food-delivery",
    title: "Food Delivery",
    blurb:
      "Like DoorDash or Swiggy. Customers order, restaurants prepare, riders deliver. Geospatial + ACID.",
    difficulty: "intermediate",
    prompt:
      "Design the order flow: customer browses, places order, payment captured, restaurant accepts, rider picks up, customer tracks delivery on a map.",
    refCasePath: "05_case_studies/design_ride_sharing.md",
    suggestedConstraints: {
      qpsRead: "10000",
      qpsWrite: "1000",
      latencyP95: "300",
      consistency: "strong",
      durability: "high",
      cost: "medium",
      team: "12",
      growth: "5x",
    },
    expectedComponents: [
      "api-gateway",
      "api-server",
      "sql-database",
      "kv-store",
      "cache",
      "message-queue",
      "pub-sub",
      "search-index",
    ],
    keyInsights: [
      "Orders need ACID — money + inventory.",
      "Tracking is high-frequency low-value — async, KV-cached.",
      "Geospatial queries (nearby restaurants, riders) need a geo index, not OLTP scans.",
    ],
  },
  {
    id: "search-autocomplete",
    title: "Search Autocomplete",
    blurb:
      "Type-ahead suggestions like Google search. Latency-sensitive, ranked by frequency.",
    difficulty: "intermediate",
    prompt:
      "Design a typeahead service. User types prefix, system returns top 10 suggestions in <50 ms. Suggestions ranked by recent popularity.",
    refCasePath: "05_case_studies/design_search_autocomplete.md",
    suggestedConstraints: {
      qpsRead: "100000",
      qpsWrite: "500",
      latencyP95: "50",
      consistency: "eventual",
      durability: "medium",
      cost: "medium",
      team: "6",
      growth: "10x",
    },
    expectedComponents: [
      "cdn",
      "load-balancer",
      "api-server",
      "cache",
      "search-index",
      "message-queue",
    ],
    keyInsights: [
      "Trie or prefix-indexed structure; pre-compute top-K per prefix.",
      "Cache hot prefixes hard — most queries hit the same letters.",
      "Update from query stream asynchronously; lag of minutes is fine.",
    ],
  },
  {
    id: "payment-system",
    title: "Payment System",
    blurb:
      "Process payments, store ledger, handle webhooks. The strictest correctness requirements.",
    difficulty: "advanced",
    prompt:
      "Design a payments service. POST /charge takes a card and amount. Must handle network retries safely (no double-charges), provider webhooks, partial failures, and reconciliation.",
    refCasePath: "05_case_studies/design_flash_sale.md",
    suggestedConstraints: {
      qpsRead: "1000",
      qpsWrite: "500",
      latencyP95: "1500",
      consistency: "strong",
      durability: "high",
      cost: "medium",
      team: "8",
      growth: "10x",
    },
    expectedComponents: [
      "api-gateway",
      "api-server",
      "sql-database",
      "message-queue",
      "kv-store",
    ],
    keyInsights: [
      "Idempotency keys are non-negotiable — every retry returns the original result.",
      "Ledger uses ACID; never overwrite, only append.",
      "Webhook handlers must be idempotent and dedupe; verify signatures.",
    ],
  },
  {
    id: "ticketmaster",
    title: "Ticket Booking (Flash Sale)",
    blurb:
      "Like Ticketmaster on tour-announcement day. Huge read spike, strict no-double-sell guarantee.",
    difficulty: "advanced",
    prompt:
      "Design ticket booking for a 50K-seat venue where 2M people arrive in the first 10 minutes. No seat may be sold twice. Browsing can lag; checkout cannot oversell.",
    refCasePath: "05_case_studies/design_ticketmaster.md",
    suggestedConstraints: {
      qpsRead: "200000", qpsWrite: "3000", latencyP95: "500",
      consistency: "strong", durability: "high", cost: "high",
      team: "15", growth: "stable",
    },
    expectedComponents: [
      "cdn", "load-balancer", "api-gateway", "rate-limiter",
      "api-server", "cache", "sql-database", "message-queue", "kv-store",
    ],
    keyInsights: [
      "Browsing is eventually consistent and heavily cached; only seat-hold + purchase need strong consistency.",
      "A virtual waiting room (queue) absorbs the spike so the booking core sees bounded traffic.",
      "Seat holds are short-TTL locks in a KV store; the DB transaction is the final arbiter.",
    ],
  },
  {
    id: "google-docs",
    title: "Collaborative Docs",
    blurb:
      "Real-time collaborative editing like Google Docs. Multiple cursors, zero lost keystrokes.",
    difficulty: "advanced",
    prompt:
      "Design a collaborative document editor supporting 50 concurrent editors per doc and 10M total docs. Edits must converge within 200ms for co-located users. Offline editing must merge on reconnect.",
    refCasePath: "05_case_studies/design_google_docs.md",
    suggestedConstraints: {
      qpsRead: "50000", qpsWrite: "20000", latencyP95: "200",
      consistency: "eventual", durability: "high", cost: "medium",
      team: "10", growth: "10x",
    },
    expectedComponents: [
      "load-balancer", "api-gateway", "api-server",
      "sql-database", "kv-store", "pub-sub", "blob-storage", "cache",
    ],
    keyInsights: [
      "OT or CRDT algorithms resolve concurrent edits deterministically — the server is the sequencer.",
      "WebSocket connections deliver real-time presence and character-level updates; HTTP is only for load/save.",
      "Document snapshots go to blob storage periodically; the operation log is the source of truth between snapshots.",
    ],
  },
  {
    id: "video-streaming",
    title: "Video Streaming",
    blurb:
      "Upload, transcode, and stream video at scale. ABR adapts quality to every viewer's bandwidth.",
    difficulty: "intermediate",
    prompt:
      "Design a video streaming platform handling 10K uploads/day and 1M concurrent viewers. Videos must be playable within 5 minutes of upload. Adaptive bitrate streaming across mobile and desktop.",
    refCasePath: "05_case_studies/design_video_streaming.md",
    suggestedConstraints: {
      qpsRead: "100000", qpsWrite: "500", latencyP95: "200",
      consistency: "eventual", durability: "high", cost: "high",
      team: "12", growth: "10x",
    },
    expectedComponents: [
      "cdn", "load-balancer", "api-server", "blob-storage",
      "message-queue", "worker", "sql-database", "cache",
    ],
    keyInsights: [
      "Upload and transcode are async — a message queue decouples ingest from the CPU-heavy encoding pipeline.",
      "CDN handles 95%+ of read traffic; origin serves only cache misses and manifest files.",
      "Adaptive bitrate (HLS/DASH) chunks video into 2-10s segments at multiple qualities; the player switches seamlessly.",
    ],
  },
  {
    id: "web-crawler",
    title: "Web Crawler",
    blurb:
      "Crawl billions of pages without hammering any single host. Politeness, dedup, and frontier management.",
    difficulty: "intermediate",
    prompt:
      "Design a web crawler that indexes 1B pages/month. Must respect robots.txt, avoid duplicate crawls, and prioritize fresh/important pages. Budget: 1000 crawler nodes.",
    refCasePath: "05_case_studies/design_web_crawler.md",
    suggestedConstraints: {
      qpsRead: "400", qpsWrite: "400", latencyP95: "2000",
      consistency: "eventual", durability: "medium", cost: "medium",
      team: "8", growth: "stable",
    },
    expectedComponents: [
      "message-queue", "worker", "kv-store",
      "blob-storage", "sql-database", "cache",
    ],
    keyInsights: [
      "The frontier queue prioritizes URLs by freshness, PageRank, and domain politeness intervals.",
      "Bloom filters or content hashing deduplicates URLs and page content cheaply at scale.",
      "Per-host rate limiting (politeness) is critical — without it you'll get IP-banned and skew crawl coverage.",
    ],
  },
  {
    id: "logging-pipeline",
    title: "Logging Pipeline",
    blurb:
      "Ingest millions of log lines per second. Hot storage for search, cold archive for compliance.",
    difficulty: "intermediate",
    prompt:
      "Design a centralized logging system ingesting 2M events/second from 5000 microservices. Support full-text search over the last 7 days and cold storage for 1 year. Alert on error rate spikes.",
    refCasePath: "05_case_studies/design_logging_system.md",
    suggestedConstraints: {
      qpsRead: "10000", qpsWrite: "2000000", latencyP95: "1000",
      consistency: "eventual", durability: "high", cost: "medium",
      team: "6", growth: "10x",
    },
    expectedComponents: [
      "pub-sub", "worker", "search-index",
      "blob-storage", "kv-store", "observability",
    ],
    keyInsights: [
      "Pub/sub (Kafka-class) is the backbone — it decouples ingest from indexing/archival consumers.",
      "Hot tier (search index, 7 days) vs cold tier (blob/object storage, 1 year) keeps costs sane.",
      "Sampling and aggregation at the edge reduces volume before it hits the pipeline — not every DEBUG line matters.",
    ],
  },
  {
    id: "google-maps",
    title: "Maps & ETA",
    blurb:
      "Serve map tiles, compute routes, and estimate arrival times with live traffic data.",
    difficulty: "advanced",
    prompt:
      "Design a maps service covering 200 countries. Pre-rendered tiles for browsing, real-time routing with live traffic, and ETA predictions accurate to ±2 minutes for trips under 30 min.",
    refCasePath: "05_case_studies/design_google_maps.md",
    suggestedConstraints: {
      qpsRead: "500000", qpsWrite: "50000", latencyP95: "300",
      consistency: "eventual", durability: "medium", cost: "high",
      team: "20", growth: "stable",
    },
    expectedComponents: [
      "cdn", "load-balancer", "api-gateway", "api-server",
      "cache", "kv-store", "pub-sub", "worker", "blob-storage",
    ],
    keyInsights: [
      "Map tiles are static pre-rendered images served from CDN — the read path is a cache lookup, not a computation.",
      "Live traffic data ingested async via pub/sub; GPS pings from drivers update edge weights in near-real-time.",
      "Routing uses hierarchical graph algorithms (contraction hierarchies) — you don't Dijkstra the entire planet per query.",
    ],
  },
];

// Component palette. Categorized so users orient by layer.
export const COMPONENT_PALETTE = [
  // Edge
  {
    id: "cdn",
    name: "CDN",
    category: "Edge",
    what: "Caches static assets and responses near the user.",
  },
  {
    id: "load-balancer",
    name: "Load Balancer",
    category: "Edge",
    what: "Distributes traffic across servers; routes around failures.",
  },
  {
    id: "api-gateway",
    name: "API Gateway",
    category: "Edge",
    what: "Authentication, rate limiting, request routing at the edge.",
  },
  {
    id: "rate-limiter",
    name: "Rate Limiter",
    category: "Edge",
    what: "Protects services from abusive or buggy clients.",
  },
  // App
  {
    id: "api-server",
    name: "API Server",
    category: "Application",
    what: "Stateless application logic. The classic web server.",
  },
  {
    id: "worker",
    name: "Worker / Consumer",
    category: "Application",
    what: "Background processor; consumes jobs from queues.",
  },
  // Data
  {
    id: "sql-database",
    name: "SQL Database",
    category: "Data",
    what: "Relational store with ACID. Default for transactional data.",
  },
  {
    id: "sql-replica",
    name: "SQL Read Replica",
    category: "Data",
    what: "Async-replicated copy for read scaling.",
  },
  {
    id: "sql-shard",
    name: "Sharded SQL",
    category: "Data",
    what: "Partitioned by key when one primary can't keep up with writes.",
  },
  {
    id: "kv-store",
    name: "Key-Value Store",
    category: "Data",
    what: "Fast lookups by key (Redis, DynamoDB). Often used for sessions, counters, simple objects.",
  },
  {
    id: "cache",
    name: "Cache (in-memory)",
    category: "Data",
    what: "Fast copy of hot data. Dangerous without invalidation.",
  },
  {
    id: "search-index",
    name: "Search Index",
    category: "Data",
    what: "Full-text or prefix search (Elasticsearch). Not the source of truth.",
  },
  {
    id: "blob-storage",
    name: "Blob Storage",
    category: "Data",
    what: "Object store for files, images, videos (S3-style).",
  },
  // Async
  {
    id: "message-queue",
    name: "Message Queue",
    category: "Async",
    what: "Buffers work for later. Decouples producers from consumers (SQS, RabbitMQ).",
  },
  {
    id: "pub-sub",
    name: "Pub/Sub / Event Stream",
    category: "Async",
    what: "Fanout to multiple consumers (Kafka, PubSub). For events.",
  },
  // Observability
  {
    id: "observability",
    name: "Observability stack",
    category: "Observability",
    what: "Metrics, logs, traces. Can't fix what you can't see.",
  },
];

export const PALETTE_BY_ID = Object.fromEntries(
  COMPONENT_PALETTE.map((item) => [item.id, item]),
);

// Rubric items shown on the review screen. Aligned with the ten architect
// behaviors but phrased as drill-specific yes/no checks.
export const DRILL_RUBRIC = [
  {
    id: "constraints-stated",
    skillId: "constraints-first",
    label: "I stated all constraints before adding components.",
  },
  {
    id: "every-component-justified",
    skillId: "defends-components",
    label: "Every component I added has a real justification.",
  },
  {
    id: "tradeoffs-considered",
    skillId: "trade-offs",
    label:
      "I considered at least two alternatives (e.g., SQL vs NoSQL, sync vs async).",
  },
  {
    id: "math-done",
    skillId: "napkin-math",
    label:
      "I estimated QPS, storage, or bandwidth — not just guessed at scale.",
  },
  {
    id: "failures-named",
    skillId: "failure-first",
    label:
      "I can name what happens when each component fails or slows down.",
  },
  {
    id: "patterns-recognized",
    skillId: "patterns",
    label:
      "I recognized at least one pattern (idempotency, fanout, back pressure, etc).",
  },
  {
    id: "phased-complexity",
    skillId: "phases-complexity",
    label:
      "I didn't add complexity (sharding, microservices) before it's earned.",
  },
  {
    id: "communicated",
    skillId: "communicates",
    label:
      "My justifications would make sense to a non-engineer founder.",
  },
  {
    id: "calibrated",
    skillId: "calibrated",
    label:
      "I avoided absolute claims; I named the conditions that flip my decisions.",
  },
  {
    id: "completed",
    skillId: "loop",
    label: "I finished the drill instead of leaving it half-done.",
  },
];

export function getCase(id) {
  return DRILL_CASES.find((c) => c.id === id) ?? null;
}

export const COMPONENT_CATEGORIES = ["Edge", "Application", "Data", "Async", "Observability"];
