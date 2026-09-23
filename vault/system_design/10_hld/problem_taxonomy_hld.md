#system-design #hld #taxonomy #framework

# HLD Problem Taxonomy — Recognize Before You Solve

## Intuition (30 sec)

A doctor doesn't treat every patient from scratch. They recognize: "This is a respiratory infection" → known treatment playbook. HLD works the same: recognize the problem TYPE → known architectural playbook. Then customize.

---

## The 6 HLD Problem Types

### Type 1: CRUD Platform
**Pattern:** Users create, read, update, delete resources. Most web apps.

**Examples:** E-commerce (Amazon), social media (Instagram), booking (Airbnb), project management (Jira)

**Playbook:**
```
Client → CDN (static) + API Gateway → App Servers → Cache → Database
         + Search Engine (if search needed)
         + Message Queue (for async: email, notifications)
         + Blob Storage (if media uploads)
```

**Core challenges:** Scale reads (caching), handle relationships (data model), search

**Key decisions:** SQL vs NoSQL, caching strategy, sync vs async for side effects

---

### Type 2: Real-Time System
**Pattern:** Instant bidirectional communication between users/systems.

**Examples:** Chat (WhatsApp), collaboration (Google Docs), live streaming, gaming

**Playbook:**
```
Client ↔ WebSocket Gateway ↔ Pub/Sub (Kafka/Redis) ↔ Services
         + Connection Registry (Redis)
         + Presence Service
         + Message Store (Cassandra — write-heavy)
```

**Core challenges:** Persistent connections at scale, message ordering, fan-out

**Key decisions:** WebSocket vs SSE vs long polling, fan-out on write vs read, message delivery guarantees

---

### Type 3: Data Pipeline
**Pattern:** Ingest, process, store, and serve large volumes of data.

**Examples:** Analytics platform, log aggregation, ML training pipeline, ETL system

**Playbook:**
```
Sources → Ingestion (Kafka) → Processing (Spark/Flink) → Storage (Data Lake/Warehouse)
          + Orchestration (Airflow)
          + Serving Layer (API or Dashboard)
```

**Core challenges:** Throughput, exactly-once processing, backpressure, data quality

**Key decisions:** Batch vs stream processing, storage format (Parquet, Avro), exactly-once vs at-least-once

---

### Type 4: Storage System
**Pattern:** Store and retrieve files/objects at scale.

**Examples:** File storage (Dropbox, Google Drive), CDN, image hosting, backup system

**Playbook:**
```
Client → Upload Service → Blob Storage (S3)
         + Metadata Service → Database
         + Sync Service (for multi-device)
         + CDN (for delivery)
         + Chunking + Deduplication (for efficiency)
```

**Core challenges:** Large file handling (chunking), deduplication, sync across devices, storage efficiency

**Key decisions:** Push vs pull sync, chunking strategy, dedup at block vs file level

---

### Type 5: Coordination System
**Pattern:** Coordinate transactions across multiple parties/services.

**Examples:** Payment system (Stripe), marketplace (Uber matching), auction, booking with inventory

**Playbook:**
```
Client → API Gateway → Orchestrator Service
         → Service A (e.g., Payment)
         → Service B (e.g., Inventory)
         → Service C (e.g., Fulfillment)
         + Saga/2PC for distributed transactions
         + Idempotency for retry safety
```

**Core challenges:** Distributed transactions, consistency across services, failure compensation

**Key decisions:** Saga vs 2PC, orchestration vs choreography, idempotency strategy

---

### Type 6: Search/Discovery System
**Pattern:** Help users find relevant content from large datasets.

**Examples:** Search engine, recommendation system, autocomplete, news feed ranking

**Playbook:**
```
Data Sources → Indexing Pipeline → Search Index (Elasticsearch)
               + Ranking Service (ML models)
               + Query Service → Cache → Client
               + Feedback Loop (clicks → improve ranking)
```

**Core challenges:** Relevance ranking, index freshness, query performance, personalization

**Key decisions:** Inverted index vs vector search, real-time vs batch indexing, ranking algorithm

---

## How to Use This

When you see a new HLD problem:

```
1. "What TYPE is this?" → Identify from the 6 types
2. Start with that type's PLAYBOOK as your skeleton
3. Identify what's UNIQUE about this specific problem
4. Customize the playbook for the unique aspects
5. Validate with the constraints-first method
```

**Many systems are HYBRIDS.** Instagram is Type 1 (CRUD) + Type 2 (real-time DMs) + Type 6 (feed ranking). Identify the primary type, start there, and layer on.

## Interview Tip

In the first 60 seconds, say: "This looks like a [type] system with [unique twist]. Let me start with the standard architecture for [type] and then address [unique twist]."

This signals you recognize patterns AND can customize — exactly what senior engineers do.

## Links

- [[hld_thinking_system]] — The full thinking framework
- [[architecture_decision_records]] — Document type-specific decisions
- [[../07_interview_framework/the_four_step_framework]] — Interview approach
