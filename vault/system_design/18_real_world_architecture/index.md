# Real-World Architecture — How Top Companies Actually Build Systems

> **Purpose:** This index is a cross-reference matrix connecting **48 design patterns** across **15 companies**.
> Use it to answer the question: *"Who actually uses this pattern in production, and how?"*
>
> Every company file in this folder is a deep dive into the real systems behind the interview
> abstractions. When you study a pattern in [[03_design_patterns/sharding]], come back here to see
> who deploys it at scale. When you prep a case study from [[05_case_studies/]], check which company
> architecture maps to it.

---

## Navigation — Company Files

| # | Company | File | Key Systems | Patterns |
|---|---------|------|-------------|----------|
| 1 | Google | [[18_real_world_architecture/google]] | Bigtable, Spanner, Borg, GFS/Colossus, MapReduce | 17 |
| 2 | Meta | [[18_real_world_architecture/meta]] | TAO, Memcache fleet, Haystack/f4, Thrift, Gatekeeper | 15 |
| 3 | Netflix | [[18_real_world_architecture/netflix]] | EVCache, Zuul, Chaos Monkey, Open Connect CDN, Spinnaker, Titus | 15 |
| 4 | Uber | [[18_real_world_architecture/uber]] | Ringpop, Schemaless, H3, Cadence, M3, Michelangelo | 15 |
| 5 | Amazon/AWS | [[18_real_world_architecture/amazon_aws]] | Dynamo, S3, Aurora, Lambda, Cell architecture | 15 |
| 6 | Stripe | [[18_real_world_architecture/stripe]] | Idempotency, Sorbet, Payment pipeline, PCI vault, API versioning | 11 |
| 7 | LinkedIn | [[18_real_world_architecture/linkedin]] | Kafka, Espresso, Brooklin, Venice, Feed | 11 |
| 8 | Twitter/X | [[18_real_world_architecture/twitter_x]] | Snowflake IDs, Manhattan, Timeline, Earlybird Search | 11 |
| 9 | Discord | [[18_real_world_architecture/discord]] | Elixir-to-Rust migration, Message storage, Gateway, Guild sharding, Read states | 8 |
| 10 | Shopify | [[18_real_world_architecture/shopify]] | Pod architecture, Vitess, Flash sales, Storefront Renderer | 12 |
| 11 | Spotify | [[18_real_world_architecture/spotify]] | Backstage, Audio pipeline, ML/personalization, Event delivery | 11 |
| 12 | Airbnb | [[18_real_world_architecture/airbnb]] | Chronon, Minerva, Search ranking, Payments, Service mesh | 12 |
| 13 | Slack | [[18_real_world_architecture/slack]] | Flannel, Channel service, Search, Disasterpiece Theater | 10 |
| 14 | Cloudflare | [[18_real_world_architecture/cloudflare]] | Workers, Anycast, Quicksilver, R2, Argo | 11 |
| 15 | Razorpay | [[18_real_world_architecture/razorpay]] | Payment gateway, UPI PSP stack, Compliance, Reconciliation | 9 |

**Total unique patterns tracked:** 48
**Total company-pattern mappings:** 183

---

## Pattern Cross-Reference Matrix

> Each table below maps a pattern to the companies that use it in production.
> Where a vault note exists in `03_design_patterns/`, the link is provided.

### Data Patterns (14 patterns)

#### 1. Sharding — [[03_design_patterns/sharding]]

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/google\|Google]] | Bigtable tablet splitting; Spanner directory-based sharding |
| [[18_real_world_architecture/meta\|Meta]] | TAO graph sharding; MySQL horizontal shards |
| [[18_real_world_architecture/uber\|Uber]] | Schemaless key-based sharding; H3 geo-sharding |
| [[18_real_world_architecture/amazon_aws\|Amazon]] | Dynamo consistent-hash partitions |
| [[18_real_world_architecture/discord\|Discord]] | Guild-based sharding (each guild pinned to a shard) |
| [[18_real_world_architecture/shopify\|Shopify]] | Vitess sharding; pod architecture (shop-group shards) |
| [[18_real_world_architecture/twitter_x\|Twitter]] | Manhattan key-range sharding |
| [[18_real_world_architecture/slack\|Slack]] | Channel service sharding by workspace |
| [[18_real_world_architecture/razorpay\|Razorpay]] | Payment data sharding by merchant ID |

#### 2. Replication — [[03_design_patterns/replication]]

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/google\|Google]] | Spanner synchronous replication across zones; Colossus Reed-Solomon coding |
| [[18_real_world_architecture/meta\|Meta]] | TAO leader-follower replication; cross-region MySQL replication |
| [[18_real_world_architecture/netflix\|Netflix]] | EVCache zone-aware replication |
| [[18_real_world_architecture/amazon_aws\|Amazon]] | Dynamo sloppy quorum; Aurora 6-way replication across 3 AZs |
| [[18_real_world_architecture/linkedin\|LinkedIn]] | Espresso master-slave replication |
| [[18_real_world_architecture/twitter_x\|Twitter]] | Manhattan async cross-datacenter replication |
| [[18_real_world_architecture/shopify\|Shopify]] | Vitess semi-synchronous replication |

#### 3. Consistent Hashing — [[03_design_patterns/consistent_hashing]]
- [[18_real_world_architecture/amazon_aws\|Amazon]] — Dynamo partition ring with virtual nodes
- [[18_real_world_architecture/uber\|Uber]] — Ringpop SWIM + consistent hash ring for request routing
- [[18_real_world_architecture/discord\|Discord]] — Gateway session routing to specific nodes
- [[18_real_world_architecture/netflix\|Netflix]] — EVCache ketama consistent hashing

#### 4. LSM Trees
- [[18_real_world_architecture/google\|Google]] — Bigtable SSTable compaction (the original LSM implementation)
- [[18_real_world_architecture/twitter_x\|Twitter]] — Manhattan storage engine built on LSM structures
- [[18_real_world_architecture/meta\|Meta]] — RocksDB (LSM-based) in TAO cache layer
- [[18_real_world_architecture/uber\|Uber]] — Schemaless storage layer backed by LSM engines

#### 5. Bloom Filters
- [[18_real_world_architecture/google\|Google]] — Bigtable read path (skip SSTables that cannot contain target row)
- [[18_real_world_architecture/amazon_aws\|Amazon]] — Dynamo anti-entropy (detect divergent replicas)
- [[18_real_world_architecture/twitter_x\|Twitter]] — Manhattan negative lookups (avoid disk reads for missing keys)
- [[18_real_world_architecture/meta\|Meta]] — Haystack index lookups (check needle existence before disk seek)

#### 6. Write-Ahead Log (WAL) — [[03_design_patterns/write_ahead_log]]

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/google\|Google]] | Bigtable commit log; Spanner Paxos log |
| [[18_real_world_architecture/amazon_aws\|Amazon]] | Aurora redo log shipping (log-is-the-database design) |
| [[18_real_world_architecture/linkedin\|LinkedIn]] | Kafka itself is a distributed WAL / commit log |
| [[18_real_world_architecture/stripe\|Stripe]] | Payment pipeline audit log for financial integrity |
| [[18_real_world_architecture/slack\|Slack]] | Message persistence layer write-ahead logging |

#### 7. Database Indexing — [[03_design_patterns/database_indexing]]

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/google\|Google]] | Bigtable row-key index; Spanner secondary indexes |
| [[18_real_world_architecture/meta\|Meta]] | TAO association index for graph edges |
| [[18_real_world_architecture/uber\|Uber]] | Schemaless secondary indexes on mutable fields |
| [[18_real_world_architecture/shopify\|Shopify]] | Vitess VIndex for cross-shard index lookups |
| [[18_real_world_architecture/airbnb\|Airbnb]] | Search ranking indexes in Elasticsearch |
| [[18_real_world_architecture/razorpay\|Razorpay]] | Payment lookup indexes by transaction ID, merchant, UPI ref |

#### 8. Polyglot Persistence
- [[18_real_world_architecture/uber\|Uber]] — MySQL + Schemaless + Cassandra + Redis + M3DB
- [[18_real_world_architecture/airbnb\|Airbnb]] — MySQL + DynamoDB + Elasticsearch + Redis
- [[18_real_world_architecture/netflix\|Netflix]] — Cassandra + EVCache + S3 + Elasticsearch
- [[18_real_world_architecture/shopify\|Shopify]] — MySQL/Vitess + Redis + Memcached + Kafka
- [[18_real_world_architecture/spotify\|Spotify]] — Cassandra + PostgreSQL + BigQuery + Cloud Datastore

#### 9. CRDTs
- [[18_real_world_architecture/discord\|Discord]] — Read state counters; presence sync across nodes
- [[18_real_world_architecture/slack\|Slack]] — Channel read-state synchronization
- [[18_real_world_architecture/cloudflare\|Cloudflare]] — Durable Objects state coordination at edge

#### 10. Data Mesh
- [[18_real_world_architecture/uber\|Uber]] — Domain-oriented data ownership across business units
- [[18_real_world_architecture/netflix\|Netflix]] — Data mesh with domain boundaries and self-serve data products
- [[18_real_world_architecture/airbnb\|Airbnb]] — Minerva metrics platform with data quality ownership
- [[18_real_world_architecture/spotify\|Spotify]] — Autonomous squad data ownership (tribes own their data)

#### 11. Change Data Capture (CDC)
- [[18_real_world_architecture/linkedin\|LinkedIn]] — Brooklin CDC streaming from MySQL/Espresso
- [[18_real_world_architecture/uber\|Uber]] — Schemaless changelog for downstream consumers
- [[18_real_world_architecture/airbnb\|Airbnb]] — SpinalTap CDC from MySQL to search and analytics
- [[18_real_world_architecture/shopify\|Shopify]] — Vitess VStream CDC for event-driven updates
- [[18_real_world_architecture/stripe\|Stripe]] — Payment state change propagation across services

#### 12. Time-Series Storage
- [[18_real_world_architecture/uber\|Uber]] — M3 metrics platform; M3DB purpose-built time-series store
- [[18_real_world_architecture/netflix\|Netflix]] — Atlas telemetry system for operational metrics
- [[18_real_world_architecture/cloudflare\|Cloudflare]] — Analytics pipeline; ABR time-series for network intelligence
- [[18_real_world_architecture/spotify\|Spotify]] — Event delivery pipeline metrics and playback analytics

#### 13. Materialized Views
- [[18_real_world_architecture/linkedin\|LinkedIn]] — Venice derived data serving (precomputed from Kafka)
- [[18_real_world_architecture/twitter_x\|Twitter]] — Timeline materialization (fan-out-on-write)
- [[18_real_world_architecture/meta\|Meta]] — TAO graph cache as materialized view layer
- [[18_real_world_architecture/airbnb\|Airbnb]] — Minerva pre-computed metrics for dashboards
- [[18_real_world_architecture/netflix\|Netflix]] — Precomputed recommendation lists per user

#### 14. Vector Clocks
- [[18_real_world_architecture/amazon_aws\|Amazon]] — Dynamo conflict resolution (later replaced with LWW)
- [[18_real_world_architecture/uber\|Uber]] — Schemaless versioning for conflict detection

---

### Reliability Patterns (10 patterns)

#### 1. Circuit Breaker — [[03_design_patterns/circuit_breaker]]

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/netflix\|Netflix]] | Hystrix (now Resilience4j patterns) — the canonical implementation |
| [[18_real_world_architecture/uber\|Uber]] | Service-to-service circuit breaking in RPC framework |
| [[18_real_world_architecture/stripe\|Stripe]] | Payment provider failover when bank gateway degrades |
| [[18_real_world_architecture/airbnb\|Airbnb]] | Service mesh circuit breaking via Envoy |
| [[18_real_world_architecture/shopify\|Shopify]] | Flash sale protection — trip circuits on downstream overload |
| [[18_real_world_architecture/razorpay\|Razorpay]] | Bank gateway circuit breakers per payment network |
| [[18_real_world_architecture/slack\|Slack]] | Downstream dependency isolation in channel service |

#### 2. Back Pressure — [[03_design_patterns/back_pressure]]

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/netflix\|Netflix]] | Zuul adaptive throttling based on backend health |
| [[18_real_world_architecture/uber\|Uber]] | QALM load management — adaptive admission control |
| [[18_real_world_architecture/discord\|Discord]] | Gateway back pressure during message storms |
| [[18_real_world_architecture/linkedin\|LinkedIn]] | Kafka consumer back pressure via partition lag monitoring |
| [[18_real_world_architecture/cloudflare\|Cloudflare]] | Request queuing and shedding at edge nodes |

#### 3. Chaos Engineering
- [[18_real_world_architecture/netflix\|Netflix]] — Chaos Monkey, Simian Army, FIT (Failure Injection Testing)
- [[18_real_world_architecture/amazon_aws\|Amazon]] — GameDay exercises across AWS service teams
- [[18_real_world_architecture/slack\|Slack]] — Disasterpiece Theater (tabletop + live failure exercises)
- [[18_real_world_architecture/shopify\|Shopify]] — Toxiproxy fault injection in CI and production
- [[18_real_world_architecture/uber\|Uber]] — Failure injection framework for city-level isolation testing

#### 4. Cell-Based Architecture
- [[18_real_world_architecture/amazon_aws\|Amazon]] — Cell-based deployment for core AWS services (e.g., DynamoDB cells)
- [[18_real_world_architecture/shopify\|Shopify]] — Pod architecture (each pod is a cell serving a group of shops)
- [[18_real_world_architecture/slack\|Slack]] — Workspace-scoped failure domains
- [[18_real_world_architecture/razorpay\|Razorpay]] — Payment gateway isolation cells per merchant tier

#### 5. Bulkhead
- [[18_real_world_architecture/netflix\|Netflix]] — Thread pool isolation per downstream dependency (Hystrix model)
- [[18_real_world_architecture/amazon_aws\|Amazon]] — Service cell isolation (failure does not spread)
- [[18_real_world_architecture/uber\|Uber]] — Per-city isolation (outage in one city contained)
- [[18_real_world_architecture/shopify\|Shopify]] — Pod-level blast radius (limited shop impact)
- [[18_real_world_architecture/stripe\|Stripe]] — PCI vault isolated from main API surface
- [[18_real_world_architecture/discord\|Discord]] — Guild shard isolation

#### 6. Saga Pattern — [[03_design_patterns/saga_pattern]]

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/uber\|Uber]] | Cadence workflow-based sagas for trip lifecycle |
| [[18_real_world_architecture/stripe\|Stripe]] | Payment pipeline multi-step orchestration with compensation |
| [[18_real_world_architecture/airbnb\|Airbnb]] | Booking + payment + payout coordination |
| [[18_real_world_architecture/razorpay\|Razorpay]] | Payment-settlement-reconciliation flow |
| [[18_real_world_architecture/shopify\|Shopify]] | Order-payment-fulfillment saga |

#### 7. Distributed Locking — [[03_design_patterns/distributed_locking]]

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/google\|Google]] | Chubby lock service (the original distributed lock paper) |
| [[18_real_world_architecture/stripe\|Stripe]] | Idempotency key locking to prevent duplicate charges |
| [[18_real_world_architecture/uber\|Uber]] | Ringpop distributed ownership tokens |
| [[18_real_world_architecture/shopify\|Shopify]] | Inventory reservation locking during flash sales |
| [[18_real_world_architecture/razorpay\|Razorpay]] | Double-payment prevention locks |

#### 8. Leader Election — [[03_design_patterns/leader_election]]
- [[18_real_world_architecture/google\|Google]] — Chubby-based leader election; Spanner Paxos group leaders
- [[18_real_world_architecture/uber\|Uber]] — Ringpop SWIM protocol leader selection
- [[18_real_world_architecture/linkedin\|LinkedIn]] — Kafka controller election via ZooKeeper
- [[18_real_world_architecture/amazon_aws\|Amazon]] — DynamoDB leader-based partition management

#### 9. Retry with Backoff + Jitter

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/amazon_aws\|Amazon]] | AWS SDK exponential backoff + full jitter (published the definitive blog post) |
| [[18_real_world_architecture/stripe\|Stripe]] | Webhook retry with exponential backoff schedule |
| [[18_real_world_architecture/netflix\|Netflix]] | Zuul retry policies with circuit breaker integration |
| [[18_real_world_architecture/uber\|Uber]] | Cadence activity retries with configurable backoff |
| [[18_real_world_architecture/razorpay\|Razorpay]] | Bank API retry logic with jitter to avoid thundering herd |
| [[18_real_world_architecture/slack\|Slack]] | External API delivery retries with backoff |

#### 10. Health Checks

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/google\|Google]] | Borg task health monitoring and automatic restart |
| [[18_real_world_architecture/netflix\|Netflix]] | Eureka heartbeat + health check registration |
| [[18_real_world_architecture/amazon_aws\|Amazon]] | ELB health checks; Route 53 health-based DNS routing |
| [[18_real_world_architecture/uber\|Uber]] | Ringpop SWIM protocol failure detection (protocol-level health) |
| [[18_real_world_architecture/cloudflare\|Cloudflare]] | Argo health-based routing across edge nodes |
| [[18_real_world_architecture/airbnb\|Airbnb]] | Service mesh health probes via Envoy |

---

### Communication Patterns (8 patterns)

#### 1. Pub/Sub — [[03_design_patterns/pub_sub]]

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/google\|Google]] | Cloud Pub/Sub; internal Stubby notification channels |
| [[18_real_world_architecture/linkedin\|LinkedIn]] | Kafka — the definitive pub/sub system at scale |
| [[18_real_world_architecture/uber\|Uber]] | Kafka for trip events; Cherami (now deprecated) |
| [[18_real_world_architecture/netflix\|Netflix]] | Internal event bus built on Kafka |
| [[18_real_world_architecture/spotify\|Spotify]] | Event delivery system; Google Cloud Pub/Sub |
| [[18_real_world_architecture/shopify\|Shopify]] | Kafka for event streaming across services |
| [[18_real_world_architecture/airbnb\|Airbnb]] | Event-driven architecture for booking and payment events |
| [[18_real_world_architecture/slack\|Slack]] | Real-time message fan-out to connected clients |
| [[18_real_world_architecture/razorpay\|Razorpay]] | Payment event streaming for status updates |

#### 2. Event Sourcing — [[03_design_patterns/event_sourcing]]

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/linkedin\|LinkedIn]] | Kafka as event log of record (Jay Kreps' "The Log" paper) |
| [[18_real_world_architecture/uber\|Uber]] | Cadence event-sourced workflow state |
| [[18_real_world_architecture/stripe\|Stripe]] | Payment event log — immutable ledger for financial audit |
| [[18_real_world_architecture/airbnb\|Airbnb]] | Booking event history for state reconstruction |
| [[18_real_world_architecture/razorpay\|Razorpay]] | Payment state machine event log for reconciliation |

#### 3. CQRS — [[03_design_patterns/cqrs]]

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/linkedin\|LinkedIn]] | Espresso for writes; Venice for reads (separated data paths) |
| [[18_real_world_architecture/twitter_x\|Twitter]] | Write path to Manhattan; read path from timeline cache |
| [[18_real_world_architecture/meta\|Meta]] | TAO read-optimized cache; MySQL as write-of-record |
| [[18_real_world_architecture/airbnb\|Airbnb]] | Search read path (Elasticsearch) vs. booking write path (MySQL) |
| [[18_real_world_architecture/discord\|Discord]] | Message write to Cassandra/ScyllaDB; read from cache layer |

#### 4. Service Mesh
- [[18_real_world_architecture/airbnb\|Airbnb]] — Envoy-based service mesh with centralized control plane
- [[18_real_world_architecture/uber\|Uber]] — In-house service mesh for thousands of microservices
- [[18_real_world_architecture/netflix\|Netflix]] — Internal mesh (evolved from Ribbon/Eureka)
- [[18_real_world_architecture/shopify\|Shopify]] — Envoy/Istio service mesh
- [[18_real_world_architecture/stripe\|Stripe]] — Internal service connectivity layer for payment services

#### 5. Gossip Protocol
- [[18_real_world_architecture/uber\|Uber]] — Ringpop SWIM gossip for membership and failure detection
- [[18_real_world_architecture/amazon_aws\|Amazon]] — Dynamo gossip-based failure detection and membership
- [[18_real_world_architecture/netflix\|Netflix]] — Cassandra gossip protocol for cluster membership

#### 6. gRPC / Thrift / Protobuf

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/google\|Google]] | Created gRPC and Protocol Buffers |
| [[18_real_world_architecture/meta\|Meta]] | Created Apache Thrift |
| [[18_real_world_architecture/uber\|Uber]] | Thrift/gRPC for inter-service communication |
| [[18_real_world_architecture/netflix\|Netflix]] | gRPC for internal services |
| [[18_real_world_architecture/twitter_x\|Twitter]] | Finagle RPC framework + Thrift |
| [[18_real_world_architecture/stripe\|Stripe]] | gRPC internally; REST/JSON for external API |
| [[18_real_world_architecture/linkedin\|LinkedIn]] | Rest.li framework; migrating to gRPC |
| [[18_real_world_architecture/cloudflare\|Cloudflare]] | Cap'n Proto for internal communication |
| [[18_real_world_architecture/spotify\|Spotify]] | gRPC for backend service communication |

#### 7. GraphQL Federation
- [[18_real_world_architecture/netflix\|Netflix]] — DGS framework for studio apps
- [[18_real_world_architecture/airbnb\|Airbnb]] — Unified GraphQL API layer across mobile and web
- [[18_real_world_architecture/shopify\|Shopify]] — Storefront GraphQL API for merchants
- [[18_real_world_architecture/twitter_x\|Twitter]] — GraphQL for client-facing API

#### 8. Webhook Delivery
- [[18_real_world_architecture/stripe\|Stripe]] — Webhook event delivery with exponential retry and signing
- [[18_real_world_architecture/shopify\|Shopify]] — Webhook delivery for merchant event notifications
- [[18_real_world_architecture/razorpay\|Razorpay]] — Payment status webhooks to merchant endpoints
- [[18_real_world_architecture/slack\|Slack]] — Events API webhook delivery with retry
- [[18_real_world_architecture/cloudflare\|Cloudflare]] — Alert and notification webhooks

---

### Deployment Patterns (10 patterns)

#### 1. Canary Deployments
- [[18_real_world_architecture/google\|Google]] — Borg canary tasks (small percentage of instances first)
- [[18_real_world_architecture/netflix\|Netflix]] — Spinnaker automated canary analysis (ACA)
- [[18_real_world_architecture/uber\|Uber]] — Percentage-based canary rollout per data center
- [[18_real_world_architecture/meta\|Meta]] — Gatekeeper-controlled canary release
- [[18_real_world_architecture/linkedin\|LinkedIn]] — Canary with multiproduct validation
- [[18_real_world_architecture/spotify\|Spotify]] — Squad-level canary (each squad owns their rollout)

#### 2. Blue-Green Deployments
- [[18_real_world_architecture/amazon_aws\|Amazon]] — CodeDeploy blue-green with automatic rollback
- [[18_real_world_architecture/netflix\|Netflix]] — Red-black deployments via Spinnaker (Netflix term for blue-green)
- [[18_real_world_architecture/shopify\|Shopify]] — Pod-level blue-green switchover
- [[18_real_world_architecture/cloudflare\|Cloudflare]] — Edge network staged rollout (region by region)

#### 3. Feature Flags

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/meta\|Meta]] | Gatekeeper — feature gating at billions-of-users scale |
| [[18_real_world_architecture/netflix\|Netflix]] | Feature flags for A/B tests and progressive rollout |
| [[18_real_world_architecture/uber\|Uber]] | Feature flag-driven rollouts per city and per rider/driver |
| [[18_real_world_architecture/spotify\|Spotify]] | Squad-controlled feature toggles |
| [[18_real_world_architecture/slack\|Slack]] | Feature flags for gradual workspace-level rollouts |
| [[18_real_world_architecture/stripe\|Stripe]] | API version feature flags for backward compatibility |
| [[18_real_world_architecture/airbnb\|Airbnb]] | Experiment-driven feature flags tied to A/B tests |
| [[18_real_world_architecture/shopify\|Shopify]] | Merchant-scoped feature flags |

#### 4. Edge Computing
- [[18_real_world_architecture/cloudflare\|Cloudflare]] — Workers (V8 isolates at 300+ edge locations)
- [[18_real_world_architecture/netflix\|Netflix]] — Open Connect CDN appliances inside ISP networks
- [[18_real_world_architecture/shopify\|Shopify]] — Oxygen/Storefront Renderer at edge
- [[18_real_world_architecture/amazon_aws\|Amazon]] — Lambda@Edge; CloudFront Functions

#### 5. Serverless
- [[18_real_world_architecture/amazon_aws\|Amazon]] — Lambda (pioneered the serverless model)
- [[18_real_world_architecture/cloudflare\|Cloudflare]] — Workers (serverless at the edge with V8 isolates)
- [[18_real_world_architecture/google\|Google]] — Cloud Functions; Cloud Run
- [[18_real_world_architecture/netflix\|Netflix]] — Titus containers providing serverless-like abstractions
- [[18_real_world_architecture/stripe\|Stripe]] — Serverless for async payment webhook processing

#### 6. Rate Limiting

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/cloudflare\|Cloudflare]] | Distributed rate limiting at edge using sliding window counters |
| [[18_real_world_architecture/stripe\|Stripe]] | API rate limiting with token bucket algorithm |
| [[18_real_world_architecture/razorpay\|Razorpay]] | API and transaction rate limiting per merchant |
| [[18_real_world_architecture/uber\|Uber]] | Per-service rate limits in the RPC layer |
| [[18_real_world_architecture/shopify\|Shopify]] | Leaky bucket per merchant; burst allowance for flash sales |
| [[18_real_world_architecture/discord\|Discord]] | Per-user and per-guild rate limits on API endpoints |
| [[18_real_world_architecture/twitter_x\|Twitter]] | API rate limiting tiers (app-level and user-level) |
| [[18_real_world_architecture/slack\|Slack]] | Web API rate tiers per method |

#### 7. Load Shedding

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/google\|Google]] | Borg overload protection with CoDel-based queue management |
| [[18_real_world_architecture/uber\|Uber]] | QALM adaptive load shedding based on latency percentiles |
| [[18_real_world_architecture/netflix\|Netflix]] | Zuul priority-based shedding (drop lower-priority requests first) |
| [[18_real_world_architecture/amazon_aws\|Amazon]] | Shuffle sharding + load shedding for blast radius reduction |
| [[18_real_world_architecture/shopify\|Shopify]] | Flash sale load shedding for non-critical features |
| [[18_real_world_architecture/cloudflare\|Cloudflare]] | Automatic DDoS shedding at the edge |

#### 8. Autoscaling

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/google\|Google]] | Borg autoscaling; Autopilot for resource recommendation |
| [[18_real_world_architecture/amazon_aws\|Amazon]] | EC2 Auto Scaling; Lambda concurrency scaling |
| [[18_real_world_architecture/netflix\|Netflix]] | Titus container autoscaling based on metrics |
| [[18_real_world_architecture/uber\|Uber]] | Peloton resource manager for container scaling |
| [[18_real_world_architecture/meta\|Meta]] | Twine container orchestration with autoscaling |
| [[18_real_world_architecture/shopify\|Shopify]] | Pod autoscaling pre-provisioned before flash sales |

#### 9. A/B Testing
- [[18_real_world_architecture/netflix\|Netflix]] — Large-scale A/B for UI, algorithms, and infrastructure
- [[18_real_world_architecture/meta\|Meta]] — Gatekeeper-driven experiments at billions-of-users scale
- [[18_real_world_architecture/uber\|Uber]] — City-level experiments with market-specific controls
- [[18_real_world_architecture/spotify\|Spotify]] — ABBA personalization A/B experiment platform
- [[18_real_world_architecture/airbnb\|Airbnb]] — ERF (Experiment Reporting Framework) for search ranking
- [[18_real_world_architecture/linkedin\|LinkedIn]] — XLNT experiment platform integrated with feature flags

#### 10. ML Pipeline
- [[18_real_world_architecture/uber\|Uber]] — Michelangelo (end-to-end ML: train, deploy, monitor)
- [[18_real_world_architecture/spotify\|Spotify]] — ML personalization pipeline (Discover Weekly, Daily Mix)
- [[18_real_world_architecture/airbnb\|Airbnb]] — Bighead ML platform; Chronon feature engine
- [[18_real_world_architecture/netflix\|Netflix]] — ML for recommendations, video encoding, content decisions
- [[18_real_world_architecture/meta\|Meta]] — FBLearner Flow (ML workflow manager at scale)
- [[18_real_world_architecture/google\|Google]] — TFX (TensorFlow Extended production ML pipeline)

---

### Caching Patterns (5 patterns)

#### 1. Multi-Layer Caching

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/meta\|Meta]] | Memcache fleet — L1 regional cache + L2 cross-region cache |
| [[18_real_world_architecture/netflix\|Netflix]] | EVCache — L1 zone-local + L2 cross-zone + origin fallback |
| [[18_real_world_architecture/twitter_x\|Twitter]] | Timeline cache + Manhattan warm store + cold storage |
| [[18_real_world_architecture/uber\|Uber]] | In-process cache + Redis cluster + persistent data store |
| [[18_real_world_architecture/shopify\|Shopify]] | Storefront Renderer cache layers (edge + app + DB) |
| [[18_real_world_architecture/slack\|Slack]] | Flannel edge cache + channel service cache + database |

#### 2. Cache Invalidation

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/meta\|Meta]] | McSqueal — MySQL binlog-triggered cache invalidation |
| [[18_real_world_architecture/netflix\|Netflix]] | EVCache Moneta invalidation pipeline |
| [[18_real_world_architecture/twitter_x\|Twitter]] | Timeline cache invalidation on new tweet or engagement |
| [[18_real_world_architecture/amazon_aws\|Amazon]] | CloudFront invalidation API for edge purge |
| [[18_real_world_architecture/slack\|Slack]] | Flannel cache invalidation on channel or user updates |
| [[18_real_world_architecture/shopify\|Shopify]] | Storefront cache purge on product or inventory update |

#### 3. Write-Through / Write-Behind
- [[18_real_world_architecture/meta\|Meta]] — TAO write-through to MySQL (synchronous cache update)
- [[18_real_world_architecture/amazon_aws\|Amazon]] — DAX write-through for DynamoDB
- [[18_real_world_architecture/netflix\|Netflix]] — EVCache write-behind for non-critical data paths
- [[18_real_world_architecture/airbnb\|Airbnb]] — Search index write-behind from booking writes

#### 4. CDN Edge Caching
- [[18_real_world_architecture/netflix\|Netflix]] — Open Connect CDN (custom hardware in ISP networks)
- [[18_real_world_architecture/cloudflare\|Cloudflare]] — Global edge cache with Argo tiered caching
- [[18_real_world_architecture/amazon_aws\|Amazon]] — CloudFront edge locations worldwide
- [[18_real_world_architecture/shopify\|Shopify]] — Shopify CDN for storefront static assets
- [[18_real_world_architecture/spotify\|Spotify]] — Audio file edge caching via CDN partners
- [[18_real_world_architecture/meta\|Meta]] — Static content CDN for images, videos, JS bundles

#### 5. Cache Stampede Prevention
- [[18_real_world_architecture/meta\|Meta]] — Lease-based anti-stampede in Memcache (2013 NSDI paper)
- [[18_real_world_architecture/netflix\|Netflix]] — EVCache hot key protection with request coalescing
- [[18_real_world_architecture/discord\|Discord]] — Read state cache coordination to prevent thundering herd
- [[18_real_world_architecture/shopify\|Shopify]] — Flash sale cache warming + lock-based single-flight

---

### Search / ML Patterns (3 patterns)

#### 1. Inverted Index

| Company | Implementation |
|---------|---------------|
| [[18_real_world_architecture/google\|Google]] | Web search index — the original inverted index at web scale |
| [[18_real_world_architecture/twitter_x\|Twitter]] | Earlybird real-time search index with in-memory posting lists |
| [[18_real_world_architecture/slack\|Slack]] | Search index for messages, files, and channels |
| [[18_real_world_architecture/airbnb\|Airbnb]] | Elasticsearch inverted index for listing search |
| [[18_real_world_architecture/spotify\|Spotify]] | Search index for tracks, artists, and playlists |
| [[18_real_world_architecture/linkedin\|LinkedIn]] | Galene search index for people, jobs, and content |
| [[18_real_world_architecture/shopify\|Shopify]] | Elasticsearch for merchant product search |

#### 2. Feature Store
- [[18_real_world_architecture/uber\|Uber]] — Michelangelo feature store for online and offline features
- [[18_real_world_architecture/airbnb\|Airbnb]] — Chronon (consistent online/offline feature computation)
- [[18_real_world_architecture/spotify\|Spotify]] — ML feature computation pipeline for recommendations
- [[18_real_world_architecture/netflix\|Netflix]] — Feature store serving recommendation model inputs
- [[18_real_world_architecture/meta\|Meta]] — Feature engineering in FBLearner ecosystem

#### 3. Experiment Platform
- [[18_real_world_architecture/netflix\|Netflix]] — XP experiment platform with automated analysis
- [[18_real_world_architecture/uber\|Uber]] — Experiment platform for city-level and global tests
- [[18_real_world_architecture/meta\|Meta]] — Gatekeeper experiment infrastructure at scale
- [[18_real_world_architecture/spotify\|Spotify]] — ABBA experiment analysis platform
- [[18_real_world_architecture/airbnb\|Airbnb]] — ERF (Experiment Reporting Framework)
- [[18_real_world_architecture/linkedin\|LinkedIn]] — XLNT experiment platform
- [[18_real_world_architecture/google\|Google]] — Vizier (black-box optimization and experiment platform)

---

## Pattern Density Leaderboard

How many of the 48 patterns does each company employ? This ranking reflects the breadth of
their publicly documented engineering.

| Rank | Company | Pattern Count | Strongest Categories |
|------|---------|--------------|---------------------|
| 1 | **Google** | 17 | Data (Bigtable, Spanner), Deployment (Borg), Reliability (Chubby) |
| 2 | **Netflix** | 15 | Reliability (Chaos), Caching (EVCache), Deployment (Spinnaker) |
| 2 | **Uber** | 15 | Data (Schemaless, M3), Communication (Ringpop), ML (Michelangelo) |
| 2 | **Amazon/AWS** | 15 | Data (Dynamo, Aurora), Reliability (Cells), Deployment (Lambda) |
| 2 | **Meta** | 15 | Caching (Memcache), Data (TAO), Deployment (Gatekeeper) |
| 6 | **Shopify** | 12 | Reliability (Pods), Data (Vitess), Deployment (Flash sales) |
| 6 | **Airbnb** | 12 | ML (Chronon), Communication (Service mesh), Search (Ranking) |
| 8 | **Stripe** | 11 | Reliability (Idempotency), Communication (Event sourcing), Data (WAL) |
| 8 | **LinkedIn** | 11 | Communication (Kafka), Data (Espresso/Venice), Search (Galene) |
| 8 | **Twitter/X** | 11 | Data (Manhattan), Search (Earlybird), Caching (Timeline) |
| 8 | **Spotify** | 11 | ML (Personalization), Deployment (Backstage), Communication (Events) |
| 8 | **Cloudflare** | 11 | Deployment (Workers/Edge), Caching (CDN), Reliability (Anycast) |
| 13 | **Slack** | 10 | Reliability (Disasterpiece), Caching (Flannel), Communication (Real-time) |
| 14 | **Razorpay** | 9 | Reliability (Payment safety), Data (Reconciliation), Communication (Webhooks) |
| 15 | **Discord** | 8 | Data (Sharding), Reliability (Back pressure), Communication (Gateway) |

---

## Category Leaders

Which company is the best reference for each pattern category?

| Category | Top Companies | Why |
|----------|--------------|-----|
| **Data** | Google, Uber, Amazon | Bigtable/Spanner defined distributed storage; Dynamo defined eventual consistency; Uber runs 5+ storage engines |
| **Reliability** | Netflix, Amazon, Shopify | Netflix invented chaos engineering; Amazon pioneered cells; Shopify handles flash-sale extremes |
| **Communication** | LinkedIn, Google, Uber | LinkedIn created Kafka; Google created gRPC; Uber operates massive pub/sub and gossip systems |
| **Deployment** | Netflix, Google, Cloudflare | Spinnaker is the reference CD tool; Borg inspired Kubernetes; Workers redefined edge computing |
| **Caching** | Meta, Netflix | Meta's Memcache fleet paper is the bible; Netflix EVCache handles billions of requests/day |
| **Search/ML** | Google, Uber, Airbnb | Google defined search; Michelangelo is the reference ML platform; Chronon is the reference feature store |

---

## Reverse Lookup: Case Study to Real Architecture

When studying a system design case study from [[05_case_studies/]], use this table to jump to
the company that actually built it. Reading the real architecture will give you concrete details,
actual numbers, and genuine trade-offs to cite in interviews.

| Case Study | Real Company Architecture | Key Insight |
|------------|--------------------------|-------------|
| [[05_case_studies/design_twitter]] | [[18_real_world_architecture/twitter_x]] | Fan-out on write vs. read, Snowflake IDs, Manhattan KV store |
| [[05_case_studies/design_chat_system]] | [[18_real_world_architecture/slack]], [[18_real_world_architecture/discord]] | Slack uses Flannel edge cache; Discord migrated Cassandra to ScyllaDB |
| [[05_case_studies/design_video_streaming]] | [[18_real_world_architecture/netflix]] | Open Connect CDN, per-title encoding, EVCache for session state |
| [[05_case_studies/design_spotify]] | [[18_real_world_architecture/spotify]] | Audio pipeline (OGG/AAC), Discover Weekly ML, Backstage dev portal |
| [[05_case_studies/design_ride_sharing]] | [[18_real_world_architecture/uber]] | H3 geospatial index, Ringpop hashing, Cadence workflows |
| [[05_case_studies/design_rate_limiter]] | [[18_real_world_architecture/cloudflare]], [[18_real_world_architecture/razorpay]] | Cloudflare: distributed edge rate limiting; Razorpay: payment API limits |
| [[05_case_studies/design_notification_system]] | [[18_real_world_architecture/meta]], [[18_real_world_architecture/airbnb]] | Meta pushes billions/day; Airbnb coordinates email, push, SMS |
| [[05_case_studies/design_distributed_cache]] | [[18_real_world_architecture/meta]], [[18_real_world_architecture/netflix]] | Meta Memcache paper (2013); Netflix EVCache (largest memcached fleet) |
| [[05_case_studies/design_key_value_store]] | [[18_real_world_architecture/google]], [[18_real_world_architecture/amazon_aws]] | Bigtable (2006) and Dynamo (2007) — the two foundational papers |
| [[05_case_studies/design_flash_sale]] | [[18_real_world_architecture/shopify]] | Pod isolation, Vitess write spikes, queue-based checkout |
| [[05_case_studies/design_search_autocomplete]] | [[18_real_world_architecture/twitter_x]] | Earlybird real-time search with in-memory posting lists |
| [[05_case_studies/design_web_crawler]] | [[18_real_world_architecture/google]] | GFS/Colossus + MapReduce; politeness and priority queues |
| [[05_case_studies/design_url_shortener]] | *(general)* | Consistent hashing, base62 encoding, read-heavy caching |
| [[05_case_studies/design_google_docs]] | [[18_real_world_architecture/google]] | OT/CRDT for collaboration, Spanner for metadata |
| [[05_case_studies/design_google_maps]] | [[18_real_world_architecture/google]], [[18_real_world_architecture/uber]] | Google for tiles/routing; Uber for real-time geospatial (H3) |
| [[05_case_studies/design_instagram_stories]] | [[18_real_world_architecture/meta]] | TAO for social graph, Haystack/f4 for media, Memcache for hot stories |
| [[05_case_studies/design_zoom]] | *(general)* | SFU/MCU media servers, WebRTC, adaptive bitrate |
| [[05_case_studies/design_logging_system]] | *(general)* | Kafka ingestion, Elasticsearch indexing, LSM storage |
| [[05_case_studies/design_pastebin]] | *(general)* | Object store + metadata DB + CDN |
| [[05_case_studies/design_ticketmaster]] | [[18_real_world_architecture/shopify]] | Flash sale patterns: inventory locking, queue admission, pods |

---

## Outage to Architecture Link

Every outage in [[09_real_outages/]] is a lesson about what happens when an architecture pattern
fails. Cross-reference the outage with the company architecture to understand both the failure
mode and the system that was supposed to prevent it.

| Outage | Company Architecture | Patterns That Failed or Were Tested |
|--------|---------------------|-------------------------------------|
| [[09_real_outages/google_cloud_outage_2022]] | [[18_real_world_architecture/google]] | Config change propagation; cell isolation limits |
| [[09_real_outages/facebook_bgp_outage_2021]] | [[18_real_world_architecture/meta]] | BGP misconfiguration cascade; DNS + auth dependency loop |
| [[09_real_outages/amazon_s3_outage_2017]] | [[18_real_world_architecture/amazon_aws]] | Human error in S3 index partition removal; cascading deps |
| [[09_real_outages/aws_us_east_1_outage_2021]] | [[18_real_world_architecture/amazon_aws]], [[18_real_world_architecture/netflix]] | Network congestion; cell architecture tested; Netflix multi-region failover |
| [[09_real_outages/cloudflare_regex_outage_2019]] | [[18_real_world_architecture/cloudflare]] | WAF regex CPU spike across all edges; no canary |
| [[09_real_outages/slack_database_incident_2024]] | [[18_real_world_architecture/slack]] | Database incident in channel service; Disasterpiece findings applied |
| [[09_real_outages/discord_message_outage_2024]] | [[18_real_world_architecture/discord]] | Message storage layer; ScyllaDB behavior under load |
| [[09_real_outages/fastly_cdn_outage_2021]] | [[18_real_world_architecture/cloudflare]] *(related CDN)* | Single config triggered global edge failure; no progressive rollout |
| [[09_real_outages/github_database_incident_2018]] | *(no company file)* | MySQL failover triggered replication divergence |
| [[09_real_outages/gitlab_data_deletion_2017]] | *(no company file)* | Human error deleted production DB; all backups broken |
| [[09_real_outages/knight_capital_2012]] | *(no company file)* | Deployment flag reused old code path; $440M in 45 minutes |
| [[09_real_outages/roblox_73h_outage_2021]] | *(no company file)* | Consul contention under load; 73-hour cascading failure |
| [[09_real_outages/tsb_bank_migration_2018]] | *(no company file)* | Data migration failure; no rollback plan; weeks of impact |
| [[09_real_outages/crowdstrike_global_outage_2024]] | *(no company file)* | Kernel agent update crashed 8.5M machines; no staged rollout |
| [[09_real_outages/southwest_airlines_2022]] | *(no company file)* | Legacy crew scheduling failed after weather; technical debt |

---

## Cross-Reference Quick Queries

Use these paths to answer common interview prep questions quickly.

### "Which companies use sharding and how?"
Follow [[03_design_patterns/sharding]] for theory, then check the **Sharding** section above. Nine companies shard differently — Google (tablet + directory), Meta (graph + MySQL), Uber (key + geospatial H3), Amazon (consistent-hash ring), Discord (guild-based), Shopify (Vitess pods), Twitter (key-range), Slack (workspace), Razorpay (merchant).

### "What is the best example of chaos engineering?"
Netflix (Simian Army) is the textbook answer, but also study [[18_real_world_architecture/slack|Slack]] (Disasterpiece Theater), [[18_real_world_architecture/amazon_aws|Amazon]] (GameDays), [[18_real_world_architecture/shopify|Shopify]] (Toxiproxy), and [[18_real_world_architecture/uber|Uber]] (failure injection).

### "How do payment companies ensure exactly-once processing?"
Three approaches: [[18_real_world_architecture/stripe|Stripe]] (idempotency keys + distributed locking), [[18_real_world_architecture/razorpay|Razorpay]] (reconciliation + sagas), [[18_real_world_architecture/shopify|Shopify]] (inventory reservation locking).

### "What is the difference between Kafka and a message queue?"
Start with [[03_design_patterns/pub_sub]], then read [[18_real_world_architecture/linkedin]] for how Kafka was designed as a distributed commit log — not a traditional queue. Key differences: consumer groups, partition-ordered delivery, retention-based replay.

### "How does a CDN work at scale?"
Two contrasting approaches: [[18_real_world_architecture/netflix|Netflix]] Open Connect (dedicated hardware in ISPs) vs. [[18_real_world_architecture/cloudflare|Cloudflare]] Anycast + Workers (software-defined at 300+ PoPs).

---

## How to Use This Section

### For Interview Prep

1. **Start with the case study.** Open the relevant file in [[05_case_studies/]] and design the system from first principles.
2. **Check the reverse lookup above.** Find which company actually built it and read their architecture file.
3. **Reference specific patterns.** Use the cross-reference tables to find concrete examples. Saying "Meta uses lease-based anti-stampede in their Memcache fleet" is far more impressive than "we could add a cache."
4. **Study the outages.** For every system you design, check [[09_real_outages/]] to understand what can go wrong. Mentioning failure modes unprompted shows depth.
5. **Compare trade-offs across companies.** Two companies solving the same problem made different decisions for different reasons. Understanding *why* is what separates L5 from L6 answers.

### For Company-Specific Interviews

If you are interviewing at one of these 15 companies, read their architecture file thoroughly. Know:
- What systems they built in-house vs. adopted
- What open-source projects they created (Kafka at LinkedIn, gRPC at Google, Thrift at Meta, Chaos Monkey at Netflix, Backstage at Spotify, Cadence/Temporal at Uber)
- What their biggest engineering challenges are (scale numbers, latency requirements, consistency trade-offs)
- What outages they have had and what they learned (see Outage table above)

### For Learning Architecture Patterns

1. Pick a pattern from the cross-reference matrix.
2. Read the theory in [[03_design_patterns/]] if a vault link exists.
3. Read 2-3 company implementations from the tables above.
4. Compare trade-offs — each company made different decisions for different reasons.

### For Mock Interview Practice

- Pick a case study from [[05_case_studies/]] and design the system from scratch
- After your design, read the real company architecture and compare
- Identify which patterns you missed and which you got right
- Check [[17_company_interview_guide/]] for company-specific interview formats

### Navigation Quick Links

| Destination | Link |
|-------------|------|
| Design Patterns (theory) | [[03_design_patterns/]] |
| Case Studies | [[05_case_studies/]] |
| Real Outages | [[09_real_outages/]] |
| Company Interview Guide | [[17_company_interview_guide/]] |
| This folder (architecture files) | [[18_real_world_architecture/]] |

---

> **Last updated:** 2026-02-23
> **Pattern count:** 48 patterns across 15 companies
> **Total cross-references:** 183 company-pattern mappings
