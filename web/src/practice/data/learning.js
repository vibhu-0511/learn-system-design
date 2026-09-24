export const SCORE_CATEGORIES = [
  "Completeness",
  "Scalability",
  "Reliability",
  "Consistency",
  "Observability",
  "Simplicity / Cost",
];

export const REVIEW_CATEGORIES = [
  "Requirements and current flow",
  "Latency and throughput",
  "Data ownership and consistency",
  "Failure modes and reliability",
  "Async processing and back pressure",
  "Observability and operations",
  "Cost and simplicity",
];

export const LEARNING_PHASES = [
  {
    id: "phase-0",
    number: 0,
    title: "How To Think",
    level: "Beginner",
    duration: "2 days",
    goal: "Stop memorizing tools and start reading systems through constraints, flows, and failure.",
    mentalModel:
      "Every design is a response to forces: scale, latency, correctness, availability, durability, cost, and team ability.",
    concepts: ["Requirements", "Constraints", "Read path", "Write path", "Latency", "Throughput", "Team size"],
    sourceNotes: ["10_hld/hld_thinking_system.md", "07_interview_framework/the_four_step_framework.md"],
    miniExercise:
      "Pick one product action like login, checkout, search, or send message. Trace: user action -> API -> data store -> response -> side effects.",
    caseExercise: {
      title: "Trace a checkout request",
      prompt:
        "A user taps Pay. Write the request flow, data written, synchronous dependencies, async side effects, and what the user sees.",
      steps: [
        {
          id: "requirements",
          title: "Clarify the action",
          question: "What must happen before the user can see success?",
          hint: "Separate must-have work from nice-to-have side effects.",
          reference:
            "Payment authorization and order creation are blocking. Email, analytics, and loyalty updates can be async.",
        },
        {
          id: "flow",
          title: "Trace the path",
          question: "Write the read path, write path, and side-effect path.",
          hint: "If you cannot trace the path, you cannot debug or optimize it.",
          reference:
            "Client -> Checkout API -> Order DB + Payment Provider -> response. Then event -> notification, analytics, fulfillment.",
        },
      ],
    },
    bugScenario: {
      title: "Template architecture without reasoning",
      flawed: "Client -> Load Balancer -> App -> DB -> Cache -> Queue. No constraints, no read/write path, no failure handling.",
      bugs: ["Components are chosen before requirements", "No critical path", "No correctness boundary"],
      fix: "Start by naming the user flows, scale, latency target, data correctness needs, and top 3 constraints.",
    },
    readiness: [
      "I can explain the system goal in one sentence.",
      "I can trace the main read and write paths.",
      "I can name the top 3 constraints before naming tools.",
    ],
  },
  {
    id: "phase-1",
    number: 1,
    title: "Core Building Blocks",
    level: "Foundation",
    duration: "4 days",
    goal: "Understand what each common component does and why it exists.",
    mentalModel:
      "A component is justified only when it solves a bottleneck, failure risk, or product requirement.",
    concepts: ["API", "Load balancer", "Database", "Cache", "Queue", "CDN", "Blob storage", "Monitoring"],
    sourceNotes: ["02_building_blocks/load_balancers.md", "02_building_blocks/caching.md", "02_building_blocks/message_queues.md"],
    miniExercise:
      "Design a simple CRUD app with one app server and one database. Then add only the components that remove a real bottleneck.",
    caseExercise: {
      title: "Design a simple CRUD product catalog",
      prompt:
        "Users browse products, admins update products, images are shown on product pages, and search is optional.",
      steps: [
        {
          id: "components",
          title: "Choose components",
          question: "Which components do you need for v1, and which should wait?",
          hint: "Start simple. CDN for images may be justified early; sharding probably is not.",
          reference:
            "API server + SQL DB + blob storage + CDN is enough. Add cache/search when traffic or query needs justify it.",
        },
        {
          id: "why",
          title: "Defend choices",
          question: "For each component, write what problem it solves.",
          hint: "If the reason is 'because everyone uses it', it is not a reason.",
          reference:
            "DB stores product truth. Blob storage holds images. CDN reduces image latency and origin load. Cache helps hot product reads later.",
        },
      ],
    },
    bugScenario: {
      title: "Overbuilt MVP",
      flawed: "The first version uses API gateway, Kafka, Elasticsearch, Redis, Kubernetes, and five microservices for a small admin CRUD tool.",
      bugs: ["Operational load is higher than product value", "No proven scaling need", "More failure modes for a small team"],
      fix: "Use a modular monolith, one DB, object storage, CDN for static assets, and add components only after measured bottlenecks.",
    },
    readiness: [
      "I can explain load balancer, DB, cache, queue, CDN, and monitoring without tool worship.",
      "I can say when not to use a component.",
      "I can keep v1 simple without ignoring the growth path.",
    ],
  },
  {
    id: "phase-2",
    number: 2,
    title: "Data And Correctness",
    level: "Core",
    duration: "5 days",
    goal: "Avoid dangerous bugs around duplicate writes, stale reads, transactions, and cache invalidation.",
    mentalModel:
      "Data correctness is not one setting. Each data type needs its own consistency and ownership decision.",
    concepts: ["SQL vs NoSQL", "ACID", "BASE", "Consistency", "Transactions", "Idempotency", "Cache invalidation"],
    sourceNotes: ["01_fundamentals/acid_vs_base.md", "01_fundamentals/consistency_models.md", "03_design_patterns/idempotency.md"],
    miniExercise:
      "Take order, payment, inventory, and notification data. Mark each one strong consistency, eventual consistency, or derived view.",
    caseExercise: {
      title: "Fix duplicate checkout writes",
      prompt:
        "A mobile checkout request times out. The user retries. Sometimes two orders are created for one payment attempt.",
      steps: [
        {
          id: "boundary",
          title: "Find correctness boundary",
          question: "Which write must be protected from duplication?",
          hint: "Retries happen at clients, load balancers, queues, and webhooks.",
          reference:
            "Order creation and payment capture need idempotency. Use an idempotency key per checkout attempt.",
        },
        {
          id: "cache",
          title: "Check stale data",
          question: "Where could stale data create wrong behavior?",
          hint: "Price, inventory, coupon, and user eligibility often become stale.",
          reference:
            "Use source-of-truth reads or short TTL/validation for price and inventory during checkout.",
        },
      ],
    },
    bugScenario: {
      title: "Payment without idempotency",
      flawed: "POST /pay creates a payment every time it is called. Mobile retries after timeout. Webhook retries also create updates blindly.",
      bugs: ["Duplicate payments", "Duplicate orders", "Non-idempotent consumers"],
      fix: "Require idempotency keys, store first result, dedupe webhooks, and make queue consumers idempotent.",
    },
    readiness: [
      "I can identify source of truth for every core entity.",
      "I can decide strong vs eventual consistency per workflow.",
      "I can design retry-safe write APIs.",
    ],
  },
  {
    id: "phase-3",
    number: 3,
    title: "Scaling And Performance",
    level: "Core",
    duration: "5 days",
    goal: "Know how to evolve a system when traffic grows without jumping to giant-scale designs too early.",
    mentalModel:
      "Scaling is a sequence of bottleneck removals: compute, database reads, hot data, writes, storage, geography.",
    concepts: ["Vertical scaling", "Horizontal scaling", "Read replicas", "Sharding", "Caching", "Async workers", "Back pressure"],
    sourceNotes: ["04_system_evolutions/scaling_a_web_app.md", "10_hld/capacity_planning.md", "03_design_patterns/sharding.md"],
    miniExercise:
      "Given current QPS, p95 latency, and read/write ratio, choose the next bottleneck to remove.",
    caseExercise: {
      title: "Scale a web app from 1 server to 1000x",
      prompt:
        "A single-server app grows from 100 users to 1M users. Add architecture changes only when the previous stage breaks.",
      steps: [
        {
          id: "stages",
          title: "Plan growth stages",
          question: "What changes at 100, 1K, 10K, 100K, and 1M users?",
          hint: "Separate DB, add app servers, cache hot reads, add replicas, then consider sharding.",
          reference:
            "Single server -> separate DB -> load balancer + stateless app servers -> cache -> read replicas -> async workers -> sharding only when needed.",
        },
        {
          id: "capacity",
          title: "Estimate capacity",
          question: "What numbers decide the next step?",
          hint: "Use QPS, read/write ratio, latency, DB CPU, cache hit ratio, queue lag, and storage growth.",
          reference:
            "If reads dominate, cache/replicas help. If writes dominate, queues, partitioning, and write-optimized stores matter.",
        },
      ],
    },
    bugScenario: {
      title: "One DB handles everything forever",
      flawed: "All app servers read and write to one DB. Search, analytics, reporting, and checkout all hit the same primary database.",
      bugs: ["Read/write contention", "Reporting hurts checkout", "No isolation of heavy workloads"],
      fix: "Add cache for hot reads, read replicas for read traffic, async pipelines for analytics, and eventually partition by access pattern.",
    },
    readiness: [
      "I can name the current bottleneck before adding infrastructure.",
      "I can estimate whether one DB/server is enough.",
      "I can explain the next 10x and 100x scaling steps.",
    ],
  },
  {
    id: "phase-4",
    number: 4,
    title: "Async And Event-Driven Systems",
    level: "Core",
    duration: "5 days",
    goal: "Know when queues/events reduce latency and coupling, and when they create unnecessary complexity.",
    mentalModel:
      "Keep the user-facing critical path small. Push non-critical, retryable, fanout work to async flows.",
    concepts: ["Message queues", "Pub/Sub", "Event streams", "DLQ", "Retries", "Ordering", "Consumer lag"],
    sourceNotes: ["02_building_blocks/message_queues.md", "03_design_patterns/pub_sub.md", "10_hld/component_interaction_patterns.md"],
    miniExercise:
      "List side effects in checkout or signup. Mark each one sync, async queue, or pub/sub.",
    caseExercise: {
      title: "Move notifications and analytics async",
      prompt:
        "The signup API waits for email, CRM sync, referral update, and analytics before responding.",
      steps: [
        {
          id: "classify",
          title: "Classify work",
          question: "Which work must block the response, and which can happen later?",
          hint: "The user only needs account creation and auth result. Most integrations can lag.",
          reference:
            "Create user synchronously. Publish UserCreated event for email, CRM, referral, and analytics consumers.",
        },
        {
          id: "operability",
          title: "Make async safe",
          question: "What operational controls does the queue need?",
          hint: "Queues are not magic. Think retry count, DLQ, lag alerts, idempotent consumers, and replay.",
          reference:
            "Add max retries, DLQ, consumer lag dashboard, idempotency key, and replay procedure.",
        },
      ],
    },
    bugScenario: {
      title: "Queue without DLQ",
      flawed: "A poison message keeps failing. Consumers retry forever. Lag grows and all later notifications are delayed.",
      bugs: ["No retry limit", "No DLQ", "No lag alert", "No replay strategy"],
      fix: "Add bounded retries, DLQ, alert on lag/failure rate, and a controlled reprocessor.",
    },
    readiness: [
      "I can break sync chains safely.",
      "I can choose queue vs pub/sub.",
      "I can define DLQ, retry, ordering, and lag behavior.",
    ],
  },
  {
    id: "phase-5",
    number: 5,
    title: "Reliability And Operations",
    level: "Core",
    duration: "4 days",
    goal: "Design systems that degrade safely, alert clearly, and survive dependency failures.",
    mentalModel:
      "A design is not production-ready until every important component has failure behavior and a metric.",
    concepts: ["SPOF", "Redundancy", "Failover", "Circuit breakers", "Retries", "Timeouts", "Observability", "Alerts"],
    sourceNotes: ["10_hld/hld_review_checklist.md", "02_building_blocks/monitoring_and_logging.md", "03_design_patterns/circuit_breaker.md"],
    miniExercise:
      "For five dependencies, define timeout, retry, fallback, circuit breaker, and alert.",
    caseExercise: {
      title: "Add failure handling to checkout",
      prompt:
        "Payment provider latency spikes. Checkout starts timing out. Support cannot tell if orders are paid, pending, or failed.",
      steps: [
        {
          id: "failure",
          title: "Name failure modes",
          question: "What can fail, and what should users see?",
          hint: "Slow, down, partial success, duplicate callback, and unknown status are different failures.",
          reference:
            "Use timeouts, pending payment state, reconciliation job, idempotent callbacks, and user-safe retry messaging.",
        },
        {
          id: "metrics",
          title: "Add observability",
          question: "Which metrics prove the fix works?",
          hint: "Track both user experience and internal saturation.",
          reference:
            "Track p95/p99 checkout latency, payment timeout rate, pending order age, duplicate retry count, provider error rate, and alert thresholds.",
        },
      ],
    },
    bugScenario: {
      title: "Microservices without observability",
      flawed: "Five services call each other. Logs have no correlation ID. Alerts only fire when CPU is high.",
      bugs: ["No request tracing", "No user-facing SLO", "No dependency-level errors", "Hard incident debugging"],
      fix: "Add correlation IDs, traces, RED metrics, dependency dashboards, and action-oriented alerts.",
    },
    readiness: [
      "I can ask what happens if each component fails.",
      "I can define useful metrics and alerts.",
      "I can design degraded behavior instead of only happy paths.",
    ],
  },
  {
    id: "phase-6",
    number: 6,
    title: "Full HLD Case Lab",
    level: "Applied",
    duration: "Ongoing",
    goal: "Design full systems independently using the same repeatable process.",
    mentalModel:
      "A full HLD answer is a structured conversation: requirements, constraints, estimates, APIs, data, architecture, bottlenecks, failures, trade-offs.",
    concepts: ["URL shortener", "Notification service", "Checkout", "Food delivery", "Chat", "Search", "File storage", "Payments"],
    sourceNotes: ["05_case_studies/design_url_shortener.md", "05_case_studies/design_notification_system.md", "10_hld/examples"],
    miniExercise:
      "Pick one case and write the first 10 questions you would ask before drawing architecture.",
    caseExercise: {
      title: "Design a URL shortener",
      prompt:
        "Design a service like Bitly. Users create short links, redirects must be fast, analytics can lag.",
      steps: [
        {
          id: "requirements",
          title: "Scope requirements",
          question: "What are the functional and non-functional requirements?",
          hint: "Create short URL, redirect, custom alias, expiry, analytics, high read traffic.",
          reference:
            "Redirect path is read-heavy and latency-sensitive. Analytics is async. Link creation needs collision handling.",
        },
        {
          id: "architecture",
          title: "Sketch architecture",
          question: "What components serve create, redirect, and analytics paths?",
          hint: "Separate hot redirect path from analytics processing.",
          reference:
            "API + DB for link metadata, cache for short-code lookup, redirect service, event queue for click analytics, dashboard store for reports.",
        },
      ],
    },
    bugScenario: {
      title: "URL shortener slow redirects",
      flawed: "Every redirect queries primary SQL DB and synchronously writes analytics before returning HTTP 302.",
      bugs: ["Hot read path hits DB", "Analytics blocks redirect", "Primary DB bottleneck"],
      fix: "Cache short-code lookups, return redirect fast, publish click event asynchronously, aggregate analytics later.",
    },
    readiness: [
      "I can design at least three full systems without copying a template.",
      "I can explain the core challenge of each system.",
      "I can compare my answer with reference trade-offs.",
    ],
  },
  {
    id: "phase-7",
    number: 7,
    title: "Bug Finder And Optimizer",
    level: "Applied",
    duration: "Ongoing",
    goal: "Inspect existing systems and identify practical improvements quickly.",
    mentalModel:
      "Architecture review is pattern recognition: find slow chains, missing dedupe, unsafe caches, overloaded stores, and blind spots.",
    concepts: ["Synchronous chain", "Cache invalidation", "DLQ", "Idempotency", "Overloaded DB", "Missing observability"],
    sourceNotes: ["10_hld/hld_review_checklist.md", "10_hld/component_interaction_patterns.md", "09_real_outages"],
    miniExercise:
      "Take one real flow. Mark every sync call, external dependency, cache, queue, and source of truth.",
    caseExercise: {
      title: "Debug flawed checkout architecture",
      prompt:
        "Checkout calls payment, email, inventory, analytics, invoice, and CRM synchronously. It has no trace IDs and retries create duplicates.",
      steps: [
        {
          id: "risks",
          title: "Prioritize risks",
          question: "What are the top three risks and why?",
          hint: "Start with user-visible failure and data correctness.",
          reference:
            "Top risks: duplicate orders/payments, synchronous chain latency, no observability for incident debugging.",
        },
        {
          id: "fixes",
          title: "Choose fixes",
          question: "What changes produce the best risk reduction with lowest blast radius?",
          hint: "Prefer narrow, measurable changes before redesign.",
          reference:
            "Add idempotency, move non-critical side effects async, add correlation IDs/tracing, and define payment pending/reconciliation flow.",
        },
      ],
    },
    bugScenario: {
      title: "Synchronous chain of death",
      flawed: "Client -> API -> Order -> Payment -> Inventory -> Email -> Analytics -> CRM. One slow dependency slows the whole user request.",
      bugs: ["Latency accumulation", "Cascading failure", "No isolation", "Poor user experience"],
      fix: "Keep only required decisions sync. Move email, analytics, CRM, and post-processing to events with retries and DLQ.",
    },
    readiness: [
      "I can find issues in a flawed architecture in under 10 minutes.",
      "I can prioritize by impact and implementation risk.",
      "I can propose measurable optimizations.",
    ],
  },
  {
    id: "phase-8",
    number: 8,
    title: "Founder Proposal Mode",
    level: "Communication",
    duration: "Ongoing",
    goal: "Turn technical findings into clear, business-useful recommendations.",
    mentalModel:
      "Founders need clarity: what is broken, why it matters, options, recommendation, trade-offs, rollout, and success metrics.",
    concepts: ["ADR", "Impact", "Options", "Trade-offs", "Rollout", "Success metrics"],
    sourceNotes: ["10_hld/architecture_decision_records.md", "10_hld/hld_review_checklist.md"],
    miniExercise:
      "Write one ADR for a real performance or reliability risk using context, constraints, options, decision, and consequences.",
    caseExercise: {
      title: "Write a founder-ready architecture proposal",
      prompt:
        "You found checkout latency and duplicate payment risk. Write a proposal that a founder can approve.",
      steps: [
        {
          id: "message",
          title: "Frame the problem",
          question: "How would you explain the issue without jargon?",
          hint: "Connect architecture risk to user experience, revenue, support, or engineering speed.",
          reference:
            "Checkout sometimes times out and retries can duplicate orders. This risks lost trust, support tickets, and revenue leakage.",
        },
        {
          id: "rollout",
          title: "Make it executable",
          question: "What is the low-risk rollout plan and success metric?",
          hint: "Founder proposals need sequencing and proof.",
          reference:
            "Phase 1: add idempotency and tracing. Phase 2: async side effects. Metrics: duplicate order count, checkout p95, timeout rate, pending payment age.",
        },
      ],
    },
    bugScenario: {
      title: "Proposal too technical",
      flawed: "We should add Kafka, CQRS, Redis, and saga orchestration because modern architecture needs it.",
      bugs: ["No business impact", "No constraints", "No trade-offs", "Tool-first thinking"],
      fix: "Describe the problem, user/business impact, options, recommended narrow fix, rollout, and metrics.",
    },
    readiness: [
      "I can write an ADR-style recommendation.",
      "I can explain trade-offs without sounding hand-wavy.",
      "I can propose small safe rollouts with success metrics.",
    ],
  },
];

export const NOTE_TEMPLATES = {
  "Learning Note": {
    title: "Learning Note",
    body: `## Concept\n\n## My explanation\n\n## When to use\n\n## When not to use\n\n## Example\n\n## Source notes\n`,
  },
  "System Review": {
    title: "System Review",
    body: `## System\n\n## Current flow\n\n## Constraints\n\n## Risks found\n\n## Suggested improvements\n\n## Metrics to verify\n`,
  },
  "ADR Draft": {
    title: "ADR Draft",
    body: `## Context\n\n## Constraints\n\n## Options considered\n\n## Decision\n\n## Consequences\n\n## When to revisit\n`,
  },
  "Bug Finding": {
    title: "Bug Finding",
    body: `## Symptom\n\n## Likely root cause\n\n## Architecture smell\n\n## Fix\n\n## Test/metric\n`,
  },
  "Founder Proposal": {
    title: "Founder Proposal",
    body: `## Problem\n\n## Business impact\n\n## Options\n\n## Recommendation\n\n## Rollout\n\n## Success metrics\n`,
  },
};
