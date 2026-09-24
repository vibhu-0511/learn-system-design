export const CATEGORIES = {
  Fundamentals: {
    color: "#2f68d8",
    terms: [
      {
        term: "Client-Server Model",
        beginner:
          "A client asks for work, a server performs it, and a response comes back. Almost every web system starts here.",
        what: "Client sends request -> server processes -> returns response. Stateless by default.",
        when: "Use as the baseline mental model for APIs, web apps, mobile backends, and internal services.",
        notWhen: "Peer-to-peer systems or offline-first sync where no central server is the main coordinator.",
        cost: "Simple to reason about, but one server becomes a bottleneck unless traffic is distributed.",
        example: "Browser -> REST API -> database.",
        sourceNotes: ["01_fundamentals/client_server_architecture.md"],
      },
      {
        term: "Latency",
        beginner:
          "How long one action takes. For users, slow p95 or p99 latency often matters more than average speed.",
        what: "Time for a single operation, usually measured with percentiles like p50, p95, and p99.",
        when: "Use for user experience, dependency budgets, SLOs, and performance debugging.",
        notWhen: "Never ignore it, but do not optimize every internal path before knowing the user-facing bottleneck.",
        cost: "Every network hop, database query, lock wait, and synchronous dependency can add latency.",
        example: "Checkout p99 = 900ms means 1% of checkout requests are slower than 900ms.",
        sourceNotes: ["01_fundamentals/latency_and_throughput.md"],
      },
      {
        term: "Throughput",
        beginner:
          "How much work the system can do per second. High throughput without bounded latency still feels broken.",
        what: "Operations per unit time, such as QPS, TPS, messages/sec, or jobs/min.",
        when: "Use for capacity planning, autoscaling, DB sizing, worker pools, and queue sizing.",
        notWhen: "Do not optimize throughput alone when the product needs fast individual responses.",
        cost: "Batching can improve throughput while increasing latency.",
        example: "20K read QPS and 800 write QPS drive very different designs.",
        sourceNotes: ["01_fundamentals/latency_and_throughput.md"],
      },
      {
        term: "Consistency",
        beginner:
          "Whether users see the latest correct data. Stronger consistency usually costs speed or availability.",
        what: "The guarantee a system gives about freshness and ordering of reads after writes.",
        when: "Use strong consistency for money, inventory, permissions, and identity-critical data.",
        notWhen: "Do not force strong consistency for likes, counters, feeds, analytics, or search unless product requires it.",
        cost: "Stronger guarantees need coordination, which adds latency and reduces availability during failures.",
        example: "Payment balance should be strongly consistent; a like count can be eventually consistent.",
        sourceNotes: ["01_fundamentals/consistency_models.md", "06_trade_offs/consistency_vs_availability.md"],
      },
    ],
  },
  BuildingBlocks: {
    color: "#0f8b6f",
    label: "Building Blocks",
    terms: [
      {
        term: "Load Balancer",
        beginner:
          "The traffic distributor. It lets you add more app servers and route around unhealthy ones.",
        what: "Distributes incoming traffic across multiple servers at L4 or L7.",
        when: "Use when more than one instance serves the same traffic or when you need health-based routing.",
        notWhen: "A tiny internal prototype can start without it, but production usually needs one.",
        cost: "Adds a hop and must itself be highly available.",
        example: "AWS ALB -> API servers.",
        sourceNotes: ["02_building_blocks/load_balancers.md"],
      },
      {
        term: "Cache",
        beginner:
          "A fast copy of data. Great for hot reads, dangerous when the copy becomes wrong and nobody notices.",
        what: "Stores frequently used data closer to the app or user, often in memory.",
        when: "Use for read-heavy data that tolerates staleness or can be invalidated cleanly.",
        notWhen: "Avoid for correctness-critical writes unless you have a clear consistency strategy.",
        cost: "Cache misses, stale data, invalidation complexity, and extra memory cost.",
        example: "Redis cache for product details; CDN cache for images.",
        sourceNotes: ["02_building_blocks/caching.md"],
      },
      {
        term: "Message Queue",
        beginner:
          "A buffer between producers and workers. It turns immediate work into later work, which protects user-facing paths.",
        what: "Asynchronous communication where producers enqueue messages and consumers process them independently.",
        when: "Use for background jobs, spike absorption, retries, and non-critical side effects.",
        notWhen: "Avoid when the caller needs an immediate answer or one transaction must be strongly atomic.",
        cost: "Eventual consistency, duplicate handling, ordering issues, DLQs, and consumer lag.",
        example: "OrderPlaced event -> email worker, analytics worker, shipping worker.",
        sourceNotes: ["02_building_blocks/message_queues.md", "03_design_patterns/pub_sub.md"],
      },
      {
        term: "Observability",
        beginner:
          "The system's ability to explain itself. Without it, every production issue becomes guesswork.",
        what: "Metrics, logs, traces, dashboards, alerts, and correlation IDs.",
        when: "Use from day one for production systems and especially for distributed systems.",
        notWhen: "Do not add noisy alerts without clear action; that creates alert fatigue.",
        cost: "Storage, instrumentation effort, sampling decisions, and dashboard maintenance.",
        example: "RED metrics: rate, errors, duration. USE metrics: utilization, saturation, errors.",
        sourceNotes: ["02_building_blocks/monitoring_and_logging.md"],
      },
    ],
  },
  Patterns: {
    color: "#c2412d",
    label: "Patterns",
    terms: [
      {
        term: "Circuit Breaker",
        beginner:
          "A protective switch. If a dependency is failing, stop hammering it and fail gracefully.",
        what: "Stops calls to unhealthy dependencies using closed, open, and half-open states.",
        when: "Use around external APIs, remote services, and unstable downstream dependencies.",
        notWhen: "Avoid using it to hide bugs inside the same process; fix those directly.",
        cost: "Bad thresholds can block healthy traffic or allow cascading failures for too long.",
        example: "Payment provider timeout opens breaker; checkout shows retryable state.",
        sourceNotes: ["03_design_patterns/circuit_breaker.md"],
      },
      {
        term: "Idempotency",
        beginner:
          "Retry safety. If the same request is sent twice, the system should not create two payments or two orders.",
        what: "Repeating the same operation produces the same final result.",
        when: "Use for payment APIs, order creation, queue consumers, webhooks, and retries.",
        notWhen: "Reads are already naturally idempotent; append-only actions need explicit keys.",
        cost: "Requires idempotency keys, storage, and expiry policy.",
        example: "Stripe-style Idempotency-Key on POST /payments.",
        sourceNotes: ["03_design_patterns/idempotency.md"],
      },
      {
        term: "Saga Pattern",
        beginner:
          "A way to coordinate a business workflow across services without one giant database transaction.",
        what: "A sequence of local transactions with compensating actions for failure.",
        when: "Use for multi-service workflows like order, payment, inventory, and shipping.",
        notWhen: "Avoid if one database transaction can solve the problem simply.",
        cost: "Intermediate states, compensation logic, retries, and idempotency are mandatory.",
        example: "Reserve inventory -> charge payment -> create shipment; failure triggers compensation.",
        sourceNotes: ["03_design_patterns/saga_pattern.md"],
      },
      {
        term: "Back Pressure",
        beginner:
          "A system saying: slow down, I cannot safely process more right now.",
        what: "Flow control that prevents producers from overwhelming consumers.",
        when: "Use for queues, streams, APIs under load, and worker pools.",
        notWhen: "For low-value telemetry, dropping or sampling may be better than slowing critical paths.",
        cost: "Requires bounded queues, rejection policy, queue lag monitoring, and product-level fallback.",
        example: "Return 429 when the request queue is full; Kafka consumers control poll rate.",
        sourceNotes: ["03_design_patterns/back_pressure.md"],
      },
    ],
  },
  Architecture: {
    color: "#7c3aed",
    terms: [
      {
        term: "Event-Driven Architecture",
        beginner:
          "Services react to facts that happened. It decouples systems, but debugging becomes harder.",
        what: "Services publish and consume events asynchronously instead of calling each other for every action.",
        when: "Use when one action triggers multiple independent reactions or when user-facing latency must stay low.",
        notWhen: "Avoid when immediate confirmation or strong transaction boundaries are required.",
        cost: "Eventual consistency, schema evolution, replay strategy, ordering, and duplicate events.",
        example: "OrderPlaced -> notification, analytics, fraud checks, shipment planning.",
        sourceNotes: ["03_design_patterns/pub_sub.md", "10_hld/component_interaction_patterns.md"],
      },
      {
        term: "Monolith",
        beginner:
          "One deployable application. Often the right starting point because the team can move faster.",
        what: "All major features live in one codebase and one deployable unit.",
        when: "Use for small teams, early products, unclear domains, and operational simplicity.",
        notWhen: "Avoid when independent scaling, ownership, or isolation clearly matters.",
        cost: "Can become hard to change and scale if boundaries are not managed.",
        example: "Early-stage SaaS backend with modules for auth, billing, and dashboard.",
        sourceNotes: ["04_system_evolutions/from_monolith_to_microservices.md"],
      },
      {
        term: "Microservices",
        beginner:
          "Many independently deployed services. Powerful for mature teams, expensive for beginners.",
        what: "Services own bounded contexts and communicate over the network.",
        when: "Use when teams and domains are stable enough to benefit from independent ownership and scaling.",
        notWhen: "Avoid for small teams that do not yet have observability, CI/CD, and clear domain boundaries.",
        cost: "Network failures, tracing, deployment complexity, data consistency, and operational load.",
        example: "Separate payment, order, catalog, notification, and search services.",
        sourceNotes: ["10_hld/microservices_patterns.md", "04_system_evolutions/from_monolith_to_microservices.md"],
      },
    ],
  },
};

export const ALL_TERMS = Object.entries(CATEGORIES).flatMap(([category, info]) =>
  info.terms.map((term) => ({
    ...term,
    category,
    categoryLabel: info.label ?? category,
    color: info.color,
  })),
);
