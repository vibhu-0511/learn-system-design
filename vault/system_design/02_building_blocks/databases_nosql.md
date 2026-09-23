#system-design #building-block #storage #database

# NoSQL Databases

## Intuition (30 sec)

Instead of one rigid spreadsheet for everything, imagine different storage for different needs: a **filing cabinet** for documents (MongoDB), a **lookup table** for quick key-value access (Redis), a **massive ledger** with billions of rows (Cassandra), and a **relationship map** connecting everything (Neo4j).

## Failure-First Scenario

> Your social media app stores user posts in PostgreSQL. Each post has different fields: some have images, some have polls, some have locations. Your rigid schema requires ALTER TABLE for every new feature. At 100M posts, joins between users-posts-comments-likes are killing performance. You need a flexible, horizontally scalable database.

## Core Definitions

### NoSQL
**NoSQL (Not Only SQL)** databases are non-relational data stores designed for specific data models and access patterns. They prioritize horizontal scalability, schema flexibility, and performance over strict ACID guarantees and complex joins.

### Document Store
A database that stores semi-structured data as documents (typically JSON, BSON, or XML). Each document is self-contained with no enforced schema. Documents are grouped in collections.

**Key characteristics:**
- Schema-less or flexible schema
- Nested data structures
- Secondary indexes support
- Rich query capabilities

### Key-Value Store
The simplest NoSQL model: a hash table where every item contains a key and a value. The database has no knowledge of the value's structure.

**Key characteristics:**
- O(1) lookups by key
- No query language (just get/put/delete)
- Extremely high throughput
- Often in-memory with optional persistence

### Column-Family Store (Wide-Column)
Stores data in column families (groups of columns) rather than rows. Each row can have a different set of columns, making it schema-flexible while still being tabular.

![[Pasted image 20260219135404.png|L|400]]

**Key characteristics:**
- Optimized for write-heavy workloads
- Sparse data (rows don't need all columns)
- Massive horizontal scaling
- Time-series data optimization

### Graph Database
Stores entities (nodes) and relationships (edges) as first-class citizens. Optimized for traversing connections between entities.

**Key characteristics:**
- Nodes with properties
- Directed, typed edges with properties
- Path queries native to the model
- ACID transactions on subgraphs

### CAP in NoSQL Context
In distributed NoSQL systems, the CAP theorem forces a choice:

**CA (Consistency + Availability):** Not achievable in partition-tolerant distributed systems
**CP (Consistency + Partition Tolerance):** Sacrifice availability during network partitions (MongoDB, HBase, Redis Cluster)
**AP (Availability + Partition Tolerance):** Sacrifice strong consistency (Cassandra, DynamoDB, Riak)

Most NoSQL databases are either CP or AP, choosing based on their target use case.

### Eventual Consistency
A consistency model where, given no new updates, all replicas will eventually converge to the same state. Reads may return stale data temporarily.

**Properties:**
- High availability during partitions
- Lower latency (no coordination needed)
- Requires conflict resolution strategies
- Trade-off: temporary inconsistency for availability

## Visual Diagrams

### NoSQL Types Comparison

```
┌────────────────────────────────────────────────────────────────┐
│                    NoSQL DATABASE TYPES                        │
├─────────────────┬─────────────┬──────────────┬─────────────────┤
│  DOCUMENT       │  KEY-VALUE  │  WIDE-COLUMN │  GRAPH          │
├─────────────────┼─────────────┼──────────────┼─────────────────┤
│                 │             │              │                 │
│ ┌─────────┐     │  KEY │ VAL  │  Row Key     │  (Node1)        │
│ │{_id:123 │     │  ────┼────  │   ├─Col1     │     │           │
│ │ name:   │     │  u:1 │{..}  │   ├─Col2     │  [EDGE]         │
│ │ "Alice" │     │  s:5 │"ab"  │   └─Col3     │     │           │
│ │ age: 30 │     │  c:3 │ 42   │              │     ▼           │
│ │ tags:[..]│    │             │  Row Key     │  (Node2)        │
│ └─────────┘     │             │   ├─Col1     │                 │
│                 │             │   ├─Col4     │                 │
│ ┌─────────┐     │             │   └─Col5     │                 │
│ │{_id:456 │     │             │              │                 │
│ │ name:   │     │             │              │                 │
│ │ "Bob"   │     │             │              │                 │
│ │ city:   │     │             │              │                 │
│ │ "NYC"   │     │             │              │                 │
│ └─────────┘     │             │              │                 │
├─────────────────┼─────────────┼──────────────┼─────────────────┤
│ MongoDB         │ Redis       │ Cassandra    │ Neo4j           │
│ CouchDB         │ DynamoDB    │ HBase        │ Neptune         │
│ Firestore       │ Memcached   │ ScyllaDB     │ ArangoDB        │
├─────────────────┼─────────────┼──────────────┼─────────────────┤
│ USE CASES:      │ USE CASES:  │ USE CASES:   │ USE CASES:      │
│ • Content mgmt  │ • Caching   │ • Time-series│ • Social graphs │
│ • Catalogs      │ • Sessions  │ • IoT data   │ • Fraud detect  │
│ • User profiles │ • Cart      │ • Analytics  │ • Recommend.    │
│ • Rapid dev     │ • Counters  │ • Feeds      │ • Knowledge DB  │
└─────────────────┴─────────────┴──────────────┴─────────────────┘
```

### Data Model Examples

```
═══════════════════════════════════════════════════════════════════
                    DATA MODEL COMPARISON
═══════════════════════════════════════════════════════════════════

SCENARIO: Store blog posts with comments

┌────────────────────────── DOCUMENT (MongoDB) ──────────────────┐
│                                                                 │
│  posts collection:                                              │
│  {                                                              │
│    "_id": "post_789",                                           │
│    "title": "NoSQL Guide",                                      │
│    "author": {                                                  │
│      "id": "user_123",                                          │
│      "name": "Alice"                                            │
│    },                                                           │
│    "content": "...",                                            │
│    "tags": ["database", "nosql"],                               │
│    "comments": [                     ← EMBEDDED                 │
│      {                                                          │
│        "user": "Bob",                                           │
│        "text": "Great post!",                                   │
│        "timestamp": "2026-01-15T10:30:00Z"                      │
│      },                                                         │
│      {                                                          │
│        "user": "Carol",                                         │
│        "text": "Thanks!",                                       │
│        "timestamp": "2026-01-15T11:00:00Z"                      │
│      }                                                          │
│    ],                                                           │
│    "likes": 42,                                                 │
│    "created": "2026-01-15T09:00:00Z"                            │
│  }                                                              │
│                                                                 │
│  ✓ One read gets everything                                    │
│  ✓ No joins needed                                             │
│  ✗ Comments can't be queried independently                     │
└─────────────────────────────────────────────────────────────────┘

┌────────────────────── KEY-VALUE (Redis) ────────────────────────┐
│                                                                 │
│  "post:789:title"     → "NoSQL Guide"                           │
│  "post:789:author"    → "user_123"                              │
│  "post:789:content"   → "..."                                   │
│  "post:789:likes"     → 42                                      │
│  "post:789:comments"  → ["comment:1", "comment:2"]              │
│                                                                 │
│  "comment:1" → '{"user":"Bob","text":"Great post!"}'            │
│  "comment:2" → '{"user":"Carol","text":"Thanks!"}'              │
│                                                                 │
│  ✓ Extremely fast lookups                                      │
│  ✗ No complex queries                                          │
│  ✗ Manual relationship management                              │
└─────────────────────────────────────────────────────────────────┘

┌──────────────────── WIDE-COLUMN (Cassandra) ────────────────────┐
│                                                                 │
│  posts_by_author table:                                         │
│  ┌──────────────┬────────────────┬──────────────────────────┐  │
│  │ author_id    │ created:post_id│ column_values            │  │
│  │ (partition)  │ (clustering)   │                          │  │
│  ├──────────────┼────────────────┼──────────────────────────┤  │
│  │ user_123     │ 2026-01-15:789 │ title, content, likes    │  │
│  │ user_123     │ 2026-01-10:555 │ title, content, likes    │  │
│  └──────────────┴────────────────┴──────────────────────────┘  │
│                                                                 │
│  posts_by_tag table:                                            │
│  ┌──────────────┬────────────────┬──────────────────────────┐  │
│  │ tag          │ created:post_id│ column_values            │  │
│  ├──────────────┼────────────────┼──────────────────────────┤  │
│  │ database     │ 2026-01-15:789 │ title, author            │  │
│  │ nosql        │ 2026-01-15:789 │ title, author            │  │
│  └──────────────┴────────────────┴──────────────────────────┘  │
│                                                                 │
│  ✓ One table per query pattern                                 │
│  ✓ Massive write throughput                                    │
│  ✗ Data duplication                                            │
│  ✗ No ad-hoc queries                                           │
└─────────────────────────────────────────────────────────────────┘

┌───────────────────────── GRAPH (Neo4j) ─────────────────────────┐
│                                                                 │
│     (Alice:User)                                                │
│         │                                                       │
│         ├──[WROTE]──→ (Post789:Post)                            │
│         │                 │                                     │
│         │                 ├──[TAGGED_WITH]──→ (database:Tag)   │
│         │                 │                                     │
│         │                 ├──[TAGGED_WITH]──→ (nosql:Tag)      │
│         │                 │                                     │
│     (Bob:User)            │                                     │
│         │                 │                                     │
│         ├──[COMMENTED]────┤                                     │
│         │                 │                                     │
│         └──[LIKES]────────┘                                     │
│                                                                 │
│  Query: "Find all posts by Alice's followers tagged 'nosql'"   │
│  MATCH (u:User)-[:FOLLOWS]->(alice:User {name:'Alice'})        │
│        -[:WROTE]->(p:Post)-[:TAGGED_WITH]->(t:Tag {name:'nosql'})│
│  RETURN p                                                       │
│                                                                 │
│  ✓ Natural relationship queries                                │
│  ✓ Path traversal optimized                                    │
│  ✗ Not designed for bulk data                                  │
└─────────────────────────────────────────────────────────────────┘
```

### CAP Theorem and Consistency Trade-offs

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAP THEOREM IN NOSQL                         │
│                                                                 │
│                      Consistency                                │
│                          △                                      │
│                         ╱ ╲                                     │
│                        ╱   ╲                                    │
│                       ╱     ╲                                   │
│                      ╱       ╲                                  │
│                     ╱   CA    ╲                                 │
│                    ╱  (Not     ╲                                │
│                   ╱  achievable ╲                               │
│                  ╱   in dist.   ╲                               │
│                 ╱    systems)    ╲                              │
│                ╱─────────────────╲                              │
│               ╱   CP         AP   ╲                             │
│              ╱                     ╲                            │
│             ╱                       ╲                           │
│            ╱                         ╲                          │
│           ╱                           ╲                         │
│    Partition ◀─────────────────────────▶ Availability          │
│    Tolerance                                                    │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CP SYSTEMS (Consistency + Partition Tolerance)                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • MongoDB (default)      • Redis Cluster                │  │
│  │  • HBase                  • Neo4j                        │  │
│  │  • BigTable               • Zookeeper                    │  │
│  │                                                          │  │
│  │  Behavior during partition:                             │  │
│  │    Minority partition → Rejects writes/reads            │  │
│  │    Majority partition → Continues with strong consistency│ │
│  │                                                          │  │
│  │  Use when: Financial data, inventory, user auth         │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  AP SYSTEMS (Availability + Partition Tolerance)                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  • Cassandra (default)    • Riak                         │  │
│  │  • DynamoDB (eventual)    • CouchDB                      │  │
│  │  • Voldemort              • SimpleDB                     │  │
│  │                                                          │  │
│  │  Behavior during partition:                             │  │
│  │    Both partitions → Accept writes/reads                │  │
│  │    After heal → Merge with conflict resolution          │  │
│  │                                                          │  │
│  │  Use when: Social feeds, analytics, metrics, caching    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│              CONSISTENCY LEVELS (Cassandra)                     │
│                                                                 │
│  Write/Read Consistency Configuration:                          │
│                                                                 │
│  ALL ──────────────────────────────────────┐                    │
│    Wait for ALL replicas                   │  Strong           │
│    Highest consistency, lowest availability│  Consistency      │
│                                            │                   │
│  QUORUM (N/2 + 1) ─────────────────────────┤                    │
│    Wait for majority of replicas           │  Tunable          │
│    Balance of consistency & availability   │  Consistency      │
│                                            │                   │
│  ONE ──────────────────────────────────────┤                    │
│    Wait for any single replica             │  Eventual         │
│    Highest availability, lowest consistency│  Consistency      │
│                                            │                   │
│  ANY ──────────────────────────────────────┘                    │
│    Hinted handoff (weakest)                                    │
│                                                                 │
│  Strong Consistency = Write(QUORUM) + Read(QUORUM)             │
│                       where W + R > N                           │
│                                                                 │
│  Example with RF=3:                                             │
│    Write(QUORUM=2) + Read(QUORUM=2) = Strong Consistency       │
│    Write(ONE=1) + Read(ONE=1) = Eventual Consistency           │
└─────────────────────────────────────────────────────────────────┘
```

## Working Knowledge (5 min)

### The Four Types

| Type | Model | Examples | Best For |
|------|-------|----------|----------|
| **Document** | JSON-like documents in collections | MongoDB, CouchDB, Firestore | Flexible schemas, content management |
| **Key-Value** | Simple key → value pairs | Redis, DynamoDB, Memcached | Caching, sessions, simple lookups |
| **Wide-Column** | Rows with dynamic columns | Cassandra, HBase, ScyllaDB | Time-series, IoT, massive write throughput |
| **Graph** | Nodes + edges (relationships) | Neo4j, Amazon Neptune, ArangoDB | Social networks, recommendations, fraud detection |

### Document Databases (MongoDB)

```json
{
  "_id": "post_123",
  "author": "user_456",
  "text": "Hello world",
  "images": ["img1.jpg", "img2.jpg"],
  "poll": {
    "question": "Cats or dogs?",
    "options": ["Cats", "Dogs"]
  },
  "location": { "lat": 37.7, "lng": -122.4 }
}
```

No rigid schema — each document can have different fields. Great for rapid development and evolving data.

### Key-Value Stores (Redis, DynamoDB)

```
"user:123:session" → { token: "abc", expires: "..." }
"user:123:cart"    → [ { item: "shirt", qty: 2 } ]
"rate:ip:1.2.3.4" → 47
```

Extremely fast (O(1) lookups). No complex queries — just get/set by key.

### Wide-Column (Cassandra)

```
Row key: "user_123"
  Column: "2024-01-01:post_1" → { text: "Hello" }
  Column: "2024-01-02:post_2" → { text: "World" }
  Column: "2024-01-03:post_3" → { text: "!" }
```

Designed for massive scale writes. Each row can have millions of columns. Partitioned and replicated automatically.

### Graph Databases (Neo4j)

```
(Alice)-[:FOLLOWS]->(Bob)
(Bob)-[:LIKES]->(Post1)
(Alice)-[:FRIENDS_WITH]->(Charlie)
```

Queries like "friends of friends who liked X" are natural and fast. Terrible in SQL (recursive joins).

## Configuration Examples

### MongoDB Configuration (Annotated)

```yaml
# mongod.conf - Production MongoDB Configuration

# Network settings
net:
  port: 27017
  bindIp: 0.0.0.0  # Listen on all interfaces (use specific IPs in production)
  maxIncomingConnections: 65536  # Limit concurrent connections

# Storage configuration
storage:
  dbPath: /var/lib/mongodb  # Where data files are stored
  journal:
    enabled: true  # Write-ahead log for crash recovery
  wiredTiger:
    engineConfig:
      cacheSizeGB: 8  # Memory cache size (50-80% of RAM recommended)
      journalCompressor: snappy  # Compress journal (snappy, zlib, none)
      directoryForIndexes: true  # Separate directory per database
    collectionConfig:
      blockCompressor: snappy  # Compress data on disk
    indexConfig:
      prefixCompression: true  # Compress index prefixes

# Replication (Replica Set)
replication:
  replSetName: "rs0"  # Replica set identifier
  oplogSizeMB: 51200  # 50GB oplog (grows as needed on WiredTiger)

# Sharding (if using sharded cluster)
sharding:
  clusterRole: shardsvr  # Or configsvr for config servers

# Operation profiling
operationProfiling:
  mode: slowOp  # Log slow operations (off, slowOp, all)
  slowOpThresholdMs: 100  # Operations slower than 100ms are logged

# Security
security:
  authorization: enabled  # Require authentication
  keyFile: /var/lib/mongodb/keyfile  # For replica set authentication

# Logging
systemLog:
  destination: file
  path: /var/log/mongodb/mongod.log
  logAppend: true
  logRotate: reopen  # Use with logrotate utility

# Process management
processManagement:
  fork: true  # Run as daemon
  pidFilePath: /var/run/mongodb/mongod.pid

# Performance tuning
setParameter:
  # Increase write concern timeout
  wiredTigerMaxCacheOverflowSizeGB: 2
  # Connection pool tuning
  maxConns: 100000
  # Disable transparent huge pages warning
  disableJavaScriptJIT: false
```

**MongoDB Connection String Example:**

```javascript
// Production connection with options
const uri = "mongodb://user:pass@host1:27017,host2:27017,host3:27017/mydb?replicaSet=rs0&readPreference=secondaryPreferred&maxPoolSize=100&retryWrites=true&w=majority";

// Key connection options:
// - replicaSet: Connect to replica set
// - readPreference: Where to read (primary, secondary, nearest)
// - maxPoolSize: Connection pool size per host
// - retryWrites: Automatically retry failed writes
// - w=majority: Write concern (wait for majority acknowledgment)
// - wtimeoutMS: Timeout for write concern
// - readConcernLevel: Read concern (local, majority, linearizable)
```

### Cassandra Configuration (Annotated)

```yaml
# cassandra.yaml - Production Cassandra Configuration

# Cluster information
cluster_name: 'Production Cluster'
num_tokens: 256  # Virtual nodes per physical node (increases data distribution)

# Data storage
data_file_directories:
  - /var/lib/cassandra/data  # SSD recommended
commitlog_directory: /var/lib/cassandra/commitlog  # Separate disk from data
saved_caches_directory: /var/lib/cassandra/saved_caches

# Commit log settings
commitlog_sync: periodic  # periodic or batch (periodic for performance)
commitlog_sync_period_in_ms: 10000  # Flush every 10 seconds
commitlog_segment_size_in_mb: 32  # Size of each commit log file

# Memory settings
memtable_heap_space_in_mb: 2048  # On-heap memory for memtables
memtable_offheap_space_in_mb: 2048  # Off-heap memory
memtable_cleanup_threshold: 0.5  # Flush when 50% full

# Cache settings
row_cache_size_in_mb: 0  # Row cache (use with caution, often disabled)
key_cache_size_in_mb: 100  # Key cache (partition key locations)
counter_cache_size_in_mb: 50  # Counter column cache

# Network and timeouts
listen_address: 10.0.1.5  # Internal cluster communication IP
rpc_address: 10.0.1.5  # Client connection IP
broadcast_address: 10.0.1.5  # Address to broadcast to other nodes

read_request_timeout_in_ms: 5000
write_request_timeout_in_ms: 2000
counter_write_request_timeout_in_ms: 5000
cas_contention_timeout_in_ms: 1000

# Seed nodes (for gossip)
seed_provider:
  - class_name: org.apache.cassandra.locator.SimpleSeedProvider
    parameters:
      - seeds: "10.0.1.1,10.0.1.2,10.0.1.3"  # Initial contact points

# Snitch (topology awareness)
endpoint_snitch: GossipingPropertyFileSnitch  # Or Ec2Snitch for AWS

# Compaction
compaction_throughput_mb_per_sec: 16  # Limit compaction I/O
concurrent_compactors: 4  # Parallel compaction threads

# Read/write concurrency
concurrent_reads: 32  # Concurrent read operations
concurrent_writes: 32  # Concurrent write operations
concurrent_counter_writes: 32

# Streaming (repair, bootstrap)
stream_throughput_outbound_megabits_per_sec: 200

# Authentication and authorization
authenticator: PasswordAuthenticator  # Require passwords
authorizer: CassandraAuthorizer  # Enable authorization

# Encryption
server_encryption_options:
  internode_encryption: all  # Encrypt node-to-node communication
  keystore: /path/to/keystore.jks
  keystore_password: changeit
  truststore: /path/to/truststore.jks
  truststore_password: changeit

client_encryption_options:
  enabled: true  # Encrypt client connections
  optional: false  # Make encryption mandatory
  keystore: /path/to/keystore.jks
  keystore_password: changeit
```

**Cassandra CQL Schema Example:**

```sql
-- Create keyspace (database) with replication
CREATE KEYSPACE user_activity
WITH REPLICATION = {
  'class': 'NetworkTopologyStrategy',  -- Multi-datacenter replication
  'dc1': 3,  -- 3 replicas in datacenter 1
  'dc2': 2   -- 2 replicas in datacenter 2
}
AND DURABLE_WRITES = true;  -- Ensure writes go to commit log

-- Time-series table: user activity feed
CREATE TABLE user_activity.activity_by_user (
  user_id uuid,              -- Partition key (determines which node)
  activity_time timestamp,   -- Clustering key (sort order within partition)
  activity_id timeuuid,      -- Clustering key (unique, time-based)
  activity_type text,
  content text,
  metadata map<text, text>,
  PRIMARY KEY (user_id, activity_time, activity_id)
)
WITH CLUSTERING ORDER BY (activity_time DESC, activity_id DESC)  -- Newest first
AND compaction = {
  'class': 'TimeWindowCompactionStrategy',  -- Best for time-series
  'compaction_window_unit': 'DAYS',
  'compaction_window_size': 1
}
AND default_time_to_live = 2592000  -- Auto-delete after 30 days
AND gc_grace_seconds = 864000  -- 10 days before tombstone cleanup
AND read_repair_chance = 0.1;  -- 10% of reads trigger repair

-- Query patterns this table supports:
-- 1. Get all activities for a user (efficient: single partition)
SELECT * FROM user_activity.activity_by_user
WHERE user_id = ?
ORDER BY activity_time DESC
LIMIT 50;

-- 2. Get activities in time range (efficient: single partition, range scan)
SELECT * FROM user_activity.activity_by_user
WHERE user_id = ?
  AND activity_time >= ?
  AND activity_time <= ?;

-- Write consistency levels per query:
INSERT INTO user_activity.activity_by_user (...) VALUES (...)
USING CONSISTENCY LOCAL_QUORUM;  -- Wait for majority in local DC

SELECT * FROM user_activity.activity_by_user
WHERE user_id = ?
USING CONSISTENCY LOCAL_ONE;  -- Read from any local replica
```

### Redis Configuration (Production)

```conf
# redis.conf - Production Redis Configuration

# Network
bind 0.0.0.0
port 6379
tcp-backlog 511
timeout 0
tcp-keepalive 300

# General
daemonize yes
supervised systemd
pidfile /var/run/redis_6379.pid
loglevel notice
logfile /var/log/redis/redis-server.log

# Snapshotting (RDB persistence)
save 900 1      # Save if 1 key changed in 900 seconds
save 300 10     # Save if 10 keys changed in 300 seconds
save 60 10000   # Save if 10000 keys changed in 60 seconds
stop-writes-on-bgsave-error yes
rdbcompression yes
rdbchecksum yes
dbfilename dump.rdb
dir /var/lib/redis

# AOF (Append Only File) persistence - more durable
appendonly yes
appendfilename "appendonly.aof"
appendfsync everysec  # everysec (balanced), always (slow, durable), no (fast, risky)
no-appendfsync-on-rewrite no
auto-aof-rewrite-percentage 100
auto-aof-rewrite-min-size 64mb

# Memory management
maxmemory 4gb
maxmemory-policy allkeys-lru  # Eviction policy (allkeys-lru, volatile-lru, allkeys-lfu)

# Replication (on replica nodes)
# replicaof master-ip master-port
replica-read-only yes
repl-diskless-sync no

# Security
requirepass your-strong-password-here
rename-command FLUSHDB ""  # Disable dangerous commands
rename-command FLUSHALL ""
rename-command CONFIG ""

# Clients
maxclients 10000

# Slow log
slowlog-log-slower-than 10000  # Log queries slower than 10ms
slowlog-max-len 128
```

## Monitoring Dashboards

### MongoDB Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│                  MONGODB MONITORING DASHBOARD                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CLUSTER HEALTH                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Primary: ✓ node1 (OK)          Oplog Window: 48h          │ │
│  │ Secondary: ✓ node2 (OK)        Replication Lag: 0.2s      │ │
│  │ Secondary: ✓ node3 (OK)        Elections: 0 (24h)         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  OPERATIONS (per second)                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Queries:   ▂▄▆█▇▅▃▂▄▆   2,340/s    Avg: 2,150/s          │ │
│  │ Inserts:   ▁▂▃▄▃▂▂▁▂▃     485/s    Avg: 420/s            │ │
│  │ Updates:   ▂▂▃▃▂▂▂▂▂▂     220/s    Avg: 215/s            │ │
│  │ Deletes:   ▁▁▁▂▁▁▁▁▁▁      15/s    Avg: 12/s             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  LATENCY (p95)                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Read:      ▂▃▄▃▂▃▄▅▄▃    15ms     Target: <20ms           │ │
│  │ Write:     ▁▂▂▂▁▂▃▂▂▁     8ms     Target: <10ms           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  CONNECTIONS                                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Current: 245/1000                                          │ │
│  │ ████████████░░░░░░░░░░░░░░░░░░░░░░░░░░  24.5%            │ │
│  │ Available: 755                                             │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  MEMORY & CACHE                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ WiredTiger Cache: 6.2GB / 8.0GB   (77.5% used)            │ │
│  │ Resident Memory:  8.5GB                                    │ │
│  │ Virtual Memory:   24.3GB                                   │ │
│  │ Cache Hit Ratio:  95.2%            Target: >90%           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  STORAGE                                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Data Size:        245GB                                    │ │
│  │ Index Size:       32GB                                     │ │
│  │ Storage Size:     180GB (compressed)                       │ │
│  │ Compression:      1.5x                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  SLOW QUERIES (>100ms)                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 285ms  db.posts.find({author:/^A/}).sort({date:-1})       │ │
│  │        → Missing index on author + date                    │ │
│  │ 142ms  db.users.aggregate([{$lookup:...}])                │ │
│  │        → Consider embedding instead of lookup              │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  KEY METRICS TO WATCH                                           │
│  • Replication lag > 5s: Check network/load                    │
│  • Oplog window < 24h: Increase oplog size                     │
│  • Cache hit ratio < 90%: Increase cache or optimize queries   │
│  • Page faults > 100/s: Data doesn't fit in RAM               │
│  • Lock %: High lock contention indicates index issues         │
└─────────────────────────────────────────────────────────────────┘

MongoDB Monitoring Commands:
  db.serverStatus()                    # Overall server stats
  db.currentOp()                       # Active operations
  db.collection.stats()                # Collection statistics
  db.collection.getIndexes()           # List indexes
  db.collection.explain("executionStats").find({...})  # Query plan
  rs.status()                          # Replica set status
  rs.printReplicationInfo()            # Oplog info
```

### Cassandra Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│                CASSANDRA MONITORING DASHBOARD                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CLUSTER STATUS                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Datacenter: dc1 (3 nodes)    Datacenter: dc2 (2 nodes)    │ │
│  │   ✓ node1  Load: 245GB         ✓ node4  Load: 180GB      │ │
│  │   ✓ node2  Load: 238GB         ✓ node5  Load: 175GB      │ │
│  │   ✓ node3  Load: 242GB                                    │ │
│  │ Status: UN (Up/Normal) for all nodes                       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  READ/WRITE LATENCY (p99)                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Local Read:    ▂▃▄▃▂▃▂▃▄▃    3.2ms    Target: <5ms       │ │
│  │ Local Write:   ▁▂▂▁▁▂▂▁▂▁    0.8ms    Target: <2ms       │ │
│  │ Remote Read:   ▃▄▅▆▅▄▃▄▅▄   12.5ms    Target: <20ms      │ │
│  │ Remote Write:  ▂▃▃▂▂▃▃▂▃▂    4.2ms    Target: <10ms      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  THROUGHPUT (per second)                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Reads:     ▂▄▆█▇▅▃▂▄▆    45,230/s   Avg: 42,000/s        │ │
│  │ Writes:    ▄▅▆█▆▅▄▃▅▆    85,450/s   Avg: 80,000/s        │ │
│  │ Range Scans: ▁▁▂▂▁▁▁▁      120/s   (expensive!)          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  COMPACTION                                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Pending Tasks: 3                                           │ │
│  │ Completed (1h): 145                                        │ │
│  │ Bytes Compacted: 28.4GB/hr                                 │ │
│  │ SSTable Count: 1,240 (across all tables)                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  MEMORY & CACHE                                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Heap Used:        5.2GB / 8.0GB    (65%)                  │ │
│  │ Off-Heap Used:    3.8GB                                    │ │
│  │ Key Cache Hit:    98.5%             Target: >95%          │ │
│  │ Row Cache Hit:    N/A (disabled)                           │ │
│  │ Memtable Space:   1.2GB / 4.0GB                            │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  CONSISTENCY LEVELS (last hour)                                 │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Read ONE:      65%    Write ONE:      12%                  │ │
│  │ Read QUORUM:   30%    Write QUORUM:   85%                  │ │
│  │ Read ALL:       5%    Write ALL:       3%                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  ERRORS & TIMEOUTS                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Read Timeouts:     24/hr    ⚠ Investigate if >100/hr      │ │
│  │ Write Timeouts:     8/hr    ⚠ Investigate if >50/hr       │ │
│  │ Unavailable:        0/hr    🚨 Critical if >0              │ │
│  │ Tombstone Warns:   15/hr    ⚠ Check GC grace period       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  HOT PARTITIONS (Top 5)                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ user_activity.popular_user_123   : 8,500 reads/s  🔥      │ │
│  │ feeds.timeline_trending          : 4,200 writes/s 🔥      │ │
│  │ metrics.global_counter           : 3,800 writes/s ⚠       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  KEY METRICS TO WATCH                                           │
│  • Pending compactions > 10: Increase compaction throughput    │
│  • SSTable count > 20 per table: Compaction falling behind     │
│  • Heap usage > 75%: Tune JVM or add memory                    │
│  • Read latency spikes: Check for large partitions             │
│  • Tombstone warnings: Review TTL and delete patterns          │
└─────────────────────────────────────────────────────────────────┘

Cassandra Monitoring Commands:
  nodetool status                      # Cluster status
  nodetool tpstats                     # Thread pool statistics
  nodetool cfstats keyspace.table      # Table statistics
  nodetool compactionstats             # Compaction progress
  nodetool tablehistograms keyspace.table  # Latency histograms
  nodetool proxyhistograms             # Coordinator latency
```

### Redis Monitoring Dashboard

```
┌─────────────────────────────────────────────────────────────────┐
│                   REDIS MONITORING DASHBOARD                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  INSTANCE STATUS                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Role: Master              Uptime: 45 days 12:34:56        │ │
│  │ Connected Replicas: 2     Replication: OK                  │ │
│  │ Version: 7.0.5            Mode: Standalone                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  OPERATIONS (per second)                                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Total:     ▃▅▇█▆▄▃▅▇█   125,340/s   Avg: 118,000/s       │ │
│  │ Reads:     ▃▄▆█▇▅▄▃▅▇    98,450/s   (78%)                │ │
│  │ Writes:    ▂▃▄▅▄▃▂▃▄▅    26,890/s   (22%)                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  LATENCY (microseconds)                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Average:   ▁▁▂▁▁▁▁▁▁▁      450μs    Target: <1ms          │ │
│  │ p99:       ▂▂▃▃▂▂▂▂▂▂    1,200μs    Target: <5ms          │ │
│  │ p999:      ▃▄▅▄▃▃▄▅▄▃    4,800μs    Monitor closely       │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  MEMORY                                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Used: 3.2GB / 4.0GB                                        │ │
│  │ ████████████████████████████████░░░░░░░░  80%             │ │
│  │ Peak: 3.5GB                                                │ │
│  │ Fragmentation Ratio: 1.12          Target: <1.5           │ │
│  │ Evicted Keys: 1,245/hr             ⚠ Increase maxmemory   │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  KEYSPACE                                                       │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ db0: keys=2,485,234, expires=1,240,128                     │ │
│  │ db1: keys=842,091, expires=842,091                         │ │
│  │ Expired Keys: 4,250/s              (automatic cleanup)    │ │
│  │ Evicted Keys: 0.3/s                (LRU eviction)         │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  CONNECTIONS                                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Connected Clients: 145                                     │ │
│  │ Blocked Clients: 3                 (waiting on BLPOP)     │ │
│  │ Total Connections: 45,823          (since startup)        │ │
│  │ Rejected: 0                        (max clients not hit)  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  PERSISTENCE                                                    │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ AOF: Enabled                                               │ │
│  │ Last Save: 120 seconds ago                                 │ │
│  │ RDB Changes Since Last Save: 2,450                         │ │
│  │ AOF Rewrite in Progress: No                                │ │
│  │ Last AOF Rewrite: 2h ago (duration: 3.2s)                 │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  SLOW LOG (>10ms)                                               │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 45ms   KEYS pattern:*              🚨 Never use in prod!  │ │
│  │ 23ms   SMEMBERS large:set:key      ⚠ Set too large       │ │
│  │ 18ms   SORT user:list BY weight    ⚠ Expensive operation │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  COMMAND STATS (Top 5)                                          │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ GET:       42,340/s    (34%)                               │ │
│  │ SET:       18,920/s    (15%)                               │ │
│  │ ZADD:      12,450/s    (10%)                               │ │
│  │ HGET:      10,230/s    (8%)                                │ │
│  │ EXPIRE:     8,120/s    (6%)                                │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  KEY METRICS TO WATCH                                           │
│  • Memory usage > 80%: Risk of evictions or OOM                │
│  • Evicted keys > 0: Increase memory or review eviction policy│
│  • Fragmentation > 1.5: Consider restart to defragment         │
│  • Slow log entries: Optimize commands (avoid KEYS, large sets)│
│  • Blocked clients: Check list/stream consumers               │
└─────────────────────────────────────────────────────────────────┘

Redis Monitoring Commands:
  INFO                                 # Comprehensive stats
  INFO stats                           # Operation statistics
  INFO memory                          # Memory details
  INFO replication                     # Replication status
  SLOWLOG GET 10                       # Recent slow commands
  CLIENT LIST                          # Connected clients
  MEMORY STATS                         # Detailed memory breakdown
  LATENCY DOCTOR                       # Latency diagnosis
```

### Graph Database (Neo4j) Monitoring

```
┌─────────────────────────────────────────────────────────────────┐
│                   NEO4J MONITORING DASHBOARD                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  DATABASE STATUS                                                │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Database: neo4j           Status: Online                   │ │
│  │ Role: Leader              Cluster: 3 nodes healthy         │ │
│  │ Store Size: 124GB         Transaction Log: 2.4GB           │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  GRAPH SIZE                                                     │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Nodes:          45,823,492                                 │ │
│  │ Relationships:  234,582,103   (avg 5.1 per node)           │ │
│  │ Properties:     892,342,234                                │ │
│  │ Node Labels:    12                                         │ │
│  │ Relationship Types: 24                                     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  TRANSACTIONS (per second)                                      │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Started:   ▂▄▆█▇▅▃▂▄▆    1,240/s    Avg: 1,150/s         │ │
│  │ Committed: ▂▄▆█▇▅▃▂▄▆    1,235/s    (99.6% success)      │ │
│  │ Rolled Back: ▁▁▁▁▁▁▁▁        5/s                          │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  QUERY PERFORMANCE                                              │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Queries/sec:   ▃▅▇█▆▄▃▅▇█    845/s    Avg: 780/s         │ │
│  │ Avg Duration:  ▂▃▄▃▂▃▂▃▄▃    42ms     Target: <50ms      │ │
│  │ p95 Duration:  ▃▄▅▆▅▄▃▄▅▄    185ms    Target: <200ms     │ │
│  │ Failed Queries: 2/min                                      │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  MEMORY                                                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Heap Used:     6.8GB / 8.0GB    (85%)  ⚠ Monitor         │ │
│  │ Page Cache:    12.4GB / 16.0GB  (77%)                     │ │
│  │ Transaction Memory: 245MB                                  │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                 │
│  SLOW QUERIES (>1s)                                             │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ 3.4s  MATCH (u:User)-[:FOLLOWS*3..5]->(f)                 │ │
│  │       → Variable-length path too deep                      │ │
│  │ 2.1s  MATCH (p:Post) WHERE p.text CONTAINS "keyword"      │ │
│  │       → Missing full-text index                            │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

## Decision Tree: Which NoSQL Type?

```
┌─────────────────────────────────────────────────────────────────┐
│              NOSQL DATABASE SELECTION DECISION TREE             │
└─────────────────────────────────────────────────────────────────┘

START: What is your primary use case?
  |
  ├─ Simple, fast lookups by unique key?
  │  └─ YES → Is data temporary/can be lost?
  │            ├─ YES → Caching, sessions, leaderboards
  │            │         ✓ REDIS (in-memory, optional persistence)
  │            │         - Ultra-fast: <1ms latency
  │            │         - Rich data structures (sets, sorted sets, lists)
  │            │         - Pub/sub, streams
  │            │
  │            └─ NO → Need guaranteed persistence?
  │                      ✓ DYNAMODB or REDIS (with AOF/RDB)
  │                      - DynamoDB: Fully managed, auto-scaling
  │                      - Redis: Lower latency, more data structures
  │
  ├─ Documents with varying fields?
  │  └─ YES → Need complex queries (filters, aggregations)?
  │            ├─ YES → Need ACID transactions?
  │            │        ├─ YES → ✓ MONGODB (with transactions)
  │            │        │        - Flexible schema
  │            │        │        - Rich query language
  │            │        │        - Good for: CMS, catalogs, user profiles
  │            │        │        - Scale: Vertical initially, sharding for horizontal
  │            │        │
  │            │        └─ NO → ✓ COUCHDB or FIRESTORE
  │            │                - CouchDB: Multi-master replication, offline-first
  │            │                - Firestore: Real-time sync, mobile-friendly
  │            │
  │            └─ NO → Just get/put entire documents?
  │                      ✓ DYNAMODB or MONGODB (simple queries)
  │                      - DynamoDB: Better for pure key-value + some attributes
  │
  ├─ Massive write throughput (>50K writes/sec)?
  │  └─ YES → Time-series or append-only data?
  │            └─ YES → ✓ CASSANDRA or SCYLLADB
  │                      - Cassandra: Proven at scale (Netflix, Apple)
  │                      - ScyllaDB: Cassandra-compatible, C++, lower latency
  │                      - Best for: IoT sensors, analytics events, feeds
  │                      - Write-optimized (sequential writes to commit log)
  │                      - Linear scalability (add nodes = add throughput)
  │                      - Tunable consistency (ONE, QUORUM, ALL)
  │
  │                      When to use CASSANDRA:
  │                      ✓ Time-series data (metrics, logs, events)
  │                      ✓ Activity feeds, messaging
  │                      ✓ 100K+ writes/sec required
  │                      ✓ Multi-datacenter replication needed
  │                      ✗ Complex queries or joins needed
  │                      ✗ Data fits in single server
  │
  └─ Relationship-heavy queries?
     └─ YES → Need to traverse connections?
               └─ YES → ✓ NEO4J or AMAZON NEPTUNE
                         - Neo4j: Most mature, ACID, Cypher query language
                         - Neptune: Managed, supports Gremlin & SPARQL
                         - Best for: Social networks, fraud detection,
                                     recommendations, knowledge graphs
                         - Path queries are O(1) hops vs O(n) joins in SQL

                         When to use NEO4J:
                         ✓ "Friends of friends who liked X"
                         ✓ Shortest path between entities
                         ✓ Pattern matching in networks
                         ✓ Fraud rings (connected suspicious activity)
                         ✗ Bulk data analytics
                         ✗ Simple lookups (overkill)

═══════════════════════════════════════════════════════════════════
                   ADDITIONAL CONSIDERATIONS
═══════════════════════════════════════════════════════════════════

CONSISTENCY REQUIREMENTS:
  Strong consistency needed (financial, inventory)?
  → MongoDB (CP), HBase (CP), Redis (CP on single node)

  Eventual consistency okay (feeds, analytics)?
  → Cassandra (AP), DynamoDB (AP), CouchDB (AP)

SCALE REQUIREMENTS:
  < 1TB, < 10K ops/sec?
  → MongoDB, PostgreSQL (with JSONB)

  1-100TB, 10K-100K ops/sec?
  → MongoDB (sharded), Cassandra, DynamoDB

  > 100TB, > 100K ops/sec?
  → Cassandra, ScyllaDB, DynamoDB

OPERATIONAL COMPLEXITY:
  Want managed/serverless?
  → DynamoDB (AWS), Firestore (GCP), DocumentDB (AWS), CosmosDB (Azure)

  Okay self-hosting?
  → MongoDB, Cassandra, Redis, Neo4j

  Want simplicity?
  → Redis (single node), MongoDB (replica set)

  Need multi-datacenter?
  → Cassandra (built-in), MongoDB (complex), CouchDB (great)

POLYGLOT PERSISTENCE (Use multiple):
  User accounts → PostgreSQL (ACID, structured)
  User sessions → Redis (fast, temporary)
  Activity feed → Cassandra (write-heavy, time-series)
  User profiles → MongoDB (flexible schema)
  Social graph → Neo4j (relationships)
  Search → Elasticsearch (full-text search)
```

## Deep Dive (30 min)

### CAP Trade-offs by Database

| Database | CAP | Consistency | Notes |
|----------|-----|-------------|-------|
| MongoDB | CP | Strong (default) | Writes to primary, reads from primary |
| Cassandra | AP | Tunable | Choose per-query: ONE, QUORUM, ALL |
| DynamoDB | AP | Tunable | Eventually consistent or strongly consistent reads |
| Redis | CP | Strong (single) | Single-threaded, consistent within node |
| CouchDB | AP | Eventual | Multi-master replication |
| Neo4j | CP | Strong | ACID transactions on graphs |

### Data Modeling Differences

**SQL:** Model your data, then figure out queries
**NoSQL:** Model your queries, then design your data

Example — Blog with users and posts:

**SQL approach:** Users table + Posts table + JOIN
**MongoDB approach:** Embed posts inside user document (if posts are always read with user)
**Cassandra approach:** Create a table per query pattern (`posts_by_user`, `posts_by_date`)

### When Each Type Shines

**Document (MongoDB):**
- Product catalogs (each product has different attributes)
- Content management systems
- User profiles with varying fields
- Prototyping / rapid development

**Key-Value (Redis/DynamoDB):**
- Session storage
- Caching (see [[caching]])
- Real-time leaderboards
- Rate limiting counters (see [[rate_limiter]])
- Shopping carts

**Wide-Column (Cassandra):**
- Time-series data (IoT sensor readings)
- Activity feeds and timelines
- Messaging systems (messages by conversation)
- Analytics event logging
- 100K+ writes/second

**Graph (Neo4j):**
- Social networks (friends, followers)
- Recommendation engines
- Fraud detection (find suspicious patterns)
- Knowledge graphs

## Production Patterns

### Sharding Strategies

```
┌─────────────────────────────────────────────────────────────────┐
│                    MONGODB SHARDING                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Sharded Cluster Architecture:                                  │
│                                                                 │
│    ┌─────────────┐  ┌─────────────┐  ┌─────────────┐           │
│    │   mongos    │  │   mongos    │  │   mongos    │           │
│    │  (router)   │  │  (router)   │  │  (router)   │           │
│    └──────┬──────┘  └──────┬──────┘  └──────┬──────┘           │
│           │                 │                │                  │
│           └─────────────────┴────────────────┘                  │
│                         │                                       │
│              ┌──────────┼──────────┐                            │
│              │          │          │                            │
│         ┌────▼────┐ ┌───▼────┐ ┌──▼─────┐                      │
│         │ Config  │ │ Config │ │ Config │                      │
│         │ Server  │ │ Server │ │ Server │                      │
│         └─────────┘ └────────┘ └────────┘                      │
│              │          │          │                            │
│         ┌────┴──────────┴──────────┴────┐                      │
│         │                                │                      │
│    ┌────▼─────┐  ┌─────────┐  ┌─────────▼────┐                │
│    │ Shard 1  │  │ Shard 2 │  │   Shard 3    │                │
│    │  (RS)    │  │  (RS)   │  │    (RS)      │                │
│    │          │  │         │  │              │                │
│    │ {_id:    │  │ {_id:   │  │  {_id:       │                │
│    │  0-333}  │  │ 333-666}│  │  666-999}    │                │
│    └──────────┘  └─────────┘  └──────────────┘                │
│                                                                 │
│  Shard Key Selection (CRITICAL):                                │
│                                                                 │
│  ✓ GOOD shard keys:                                             │
│    • user_id (high cardinality, distributes well)               │
│    • {country: 1, user_id: 1} (compound, avoids hot spots)     │
│    • hashed(_id) (random distribution)                          │
│                                                                 │
│  ✗ BAD shard keys:                                              │
│    • timestamp (monotonically increasing = hot shard)           │
│    • country alone (low cardinality = uneven distribution)      │
│    • status (very low cardinality)                              │
│                                                                 │
│  Shard Key Properties:                                          │
│    1. High Cardinality: Many unique values                      │
│    2. Even Distribution: Values spread evenly                   │
│    3. Query Isolation: Queries target single shard when possible│
│    4. Immutable: Can't change shard key value after insert      │
│                                                                 │
│  Commands:                                                      │
│    sh.enableSharding("mydb")                                    │
│    sh.shardCollection("mydb.users", {user_id: 1})               │
│    sh.status()  // View shard distribution                      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                 CASSANDRA PARTITIONING                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Consistent Hashing Ring:                                       │
│                                                                 │
│                        Node 1                                   │
│                      (token: 0)                                 │
│                          ●                                      │
│                      ╱       ╲                                  │
│                  ╱               ╲                              │
│              ╱                       ╲                          │
│          ╱                               ╲                      │
│      ●                                       ●                  │
│    Node 4                                   Node 2              │
│  (token: -2^63)                        (token: 2^63/3)          │
│      │                                       │                  │
│      │         Partition Key                 │                  │
│      │       hash(user_id=123)               │                  │
│      │              │                        │                  │
│      │              ▼                        │                  │
│      │         Token: 12345                  │                  │
│      │         Goes to: Node 2               │                  │
│      │                                       │                  │
│      ●                                       ●                  │
│    Node 3                                   Replica 1           │
│  (token: -2^63/3)                       (next clockwise)        │
│          ╲                               ╱                      │
│              ╲                       ╱                          │
│                  ╲               ╱                              │
│                      ╲       ╱                                  │
│                          ●                                      │
│                      Replica 2                                  │
│                  (next clockwise)                               │
│                                                                 │
│  Partition Key determines which nodes store data:               │
│    PRIMARY KEY (user_id, timestamp)                             │
│                 └───┬───┘  └────┬────┘                          │
│              Partition Key  Clustering Key                      │
│              (which node)   (sort order)                        │
│                                                                 │
│  Good Partition Keys:                                           │
│    ✓ user_id: Each user on different node                      │
│    ✓ sensor_id: Each sensor on different node                  │
│    ✓ (date_bucket, device_id): Distributes by day + device     │
│                                                                 │
│  Bad Partition Keys:                                            │
│    ✗ timestamp alone: All recent data on same node (hot spot)  │
│    ✗ status: Low cardinality = uneven distribution             │
│                                                                 │
│  Virtual Nodes (vnodes):                                        │
│    - Each physical node owns 256 token ranges (default)         │
│    - Better distribution when adding/removing nodes            │
│    - Faster recovery from failures                             │
└─────────────────────────────────────────────────────────────────┘
```

### Replication Strategies

```
┌─────────────────────────────────────────────────────────────────┐
│                  REPLICATION PATTERNS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MONGODB REPLICA SET:                                           │
│                                                                 │
│    ┌──────────┐                                                 │
│    │ PRIMARY  │ ──── Write ────┐                                │
│    │          │ ←─── Read ─────┤                                │
│    └────┬─────┘                │                                │
│         │ Replication           │                                │
│         │ (oplog)               │                                │
│         ├──────────┬────────────┤                                │
│         ▼          ▼            ▼                                │
│    ┌──────────┐ ┌──────────┐ ┌──────────┐                      │
│    │SECONDARY │ │SECONDARY │ │ ARBITER  │                      │
│    │          │ │          │ │(vote only)│                      │
│    └──────────┘ └──────────┘ └──────────┘                      │
│         │          │                                             │
│         └──Read───┘                                              │
│       (if configured)                                            │
│                                                                 │
│  Failover Process:                                              │
│    1. Primary becomes unavailable                               │
│    2. Secondaries detect failure (heartbeat timeout: 10s)       │
│    3. Election triggered (majority vote required)               │
│    4. Secondary with latest oplog elected as new primary        │
│    5. Application reconnects automatically                      │
│    6. Total downtime: ~10-30 seconds                            │
│                                                                 │
│  Read Preferences:                                              │
│    • primary: Only read from primary (default, strong)          │
│    • primaryPreferred: Primary if available, else secondary     │
│    • secondary: Only read from secondary (may be stale)         │
│    • secondaryPreferred: Secondary if available                 │
│    • nearest: Lowest latency (geographic distribution)          │
│                                                                 │
│  Write Concerns:                                                │
│    • w:1 - Ack from primary only (fast, risky)                 │
│    • w:"majority" - Ack from majority (durable, recommended)   │
│    • w:3 - Ack from 3 nodes (slower, very durable)             │
│    • j:true - Wait for journal write (crash-safe)              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  CASSANDRA MULTI-DATACENTER REPLICATION:                        │
│                                                                 │
│    Datacenter 1 (us-east)        Datacenter 2 (eu-west)        │
│    ┌──────────────────┐          ┌──────────────────┐          │
│    │  ┌────┐  ┌────┐  │          │  ┌────┐  ┌────┐  │          │
│    │  │ N1 │  │ N2 │  │  Async   │  │ N4 │  │ N5 │  │          │
│    │  └────┘  └────┘  │◄────────►│  └────┘  └────┘  │          │
│    │      ┌────┐       │  Gossip  │      ┌────┐      │          │
│    │      │ N3 │       │          │      │ N6 │      │          │
│    │      └────┘       │          │      └────┘      │          │
│    └──────────────────┘          └──────────────────┘          │
│                                                                 │
│  Replication Strategy:                                          │
│    CREATE KEYSPACE my_app                                       │
│    WITH REPLICATION = {                                         │
│      'class': 'NetworkTopologyStrategy',                        │
│      'us-east': 3,  -- 3 replicas in us-east                   │
│      'eu-west': 3   -- 3 replicas in eu-west                   │
│    };                                                           │
│                                                                 │
│  Consistency Levels:                                            │
│    • LOCAL_ONE: 1 replica in local DC (fast, eventual)         │
│    • LOCAL_QUORUM: Majority in local DC (strong local)         │
│    • EACH_QUORUM: Majority in EACH DC (strong global)          │
│    • ALL: All replicas (slow, fragile)                         │
│                                                                 │
│  Write Path:                                                    │
│    1. Client writes to any node (coordinator)                   │
│    2. Coordinator determines replicas based on partition key    │
│    3. Write to commit log (sequential, fast)                    │
│    4. Write to memtable (in-memory)                             │
│    5. Ack based on consistency level                            │
│    6. Background flush to SSTable                               │
│                                                                 │
│  Read Path:                                                     │
│    1. Coordinator contacts replicas based on consistency        │
│    2. Return fastest response to client                         │
│    3. Background read repair if replicas disagree               │
│    4. Use timestamp to resolve conflicts (last-write-wins)      │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│             REDIS REPLICATION                                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Master-Replica (Simple):                                       │
│    ┌────────┐                                                   │
│    │ MASTER │───Write──┐                                        │
│    └───┬────┘          │                                        │
│        │ Replication   │                                        │
│        │ Stream        │                                        │
│        ├──────┬────────┘                                        │
│        ▼      ▼                                                 │
│    ┌────────┐ ┌────────┐                                        │
│    │REPLICA │ │REPLICA │                                        │
│    └────────┘ └────────┘                                        │
│        │        │                                               │
│        └─Read──┘                                                │
│                                                                 │
│  Redis Sentinel (High Availability):                            │
│    ┌────────────┐  ┌────────────┐  ┌────────────┐              │
│    │ Sentinel 1 │  │ Sentinel 2 │  │ Sentinel 3 │              │
│    └──────┬─────┘  └──────┬─────┘  └──────┬─────┘              │
│           │ Monitor         │Monitor        │Monitor            │
│           └────────┬────────┴───────────────┘                   │
│                    ▼                                            │
│              ┌──────────┐                                        │
│              │  MASTER  │                                        │
│              └────┬─────┘                                        │
│                   │ Replication                                 │
│              ┌────┴──────┐                                      │
│              ▼           ▼                                      │
│         ┌────────┐  ┌────────┐                                  │
│         │REPLICA │  │REPLICA │                                  │
│         └────────┘  └────────┘                                  │
│                                                                 │
│  Automatic Failover:                                            │
│    1. Sentinels detect master failure (quorum)                  │
│    2. Vote to elect new master from replicas                    │
│    3. Promote replica to master                                 │
│    4. Reconfigure other replicas                                │
│    5. Update clients via Sentinel                               │
│                                                                 │
│  Redis Cluster (Sharding + Replication):                        │
│    - 16,384 hash slots divided among masters                    │
│    - Each master has replicas                                   │
│    - Client-side sharding (MOVED/ASK redirects)                 │
│    - Automatic failover                                         │
└─────────────────────────────────────────────────────────────────┘
```

### Data Consistency Patterns

```
┌─────────────────────────────────────────────────────────────────┐
│           EVENTUAL CONSISTENCY PATTERNS                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Problem: Multiple replicas accept writes, conflicts arise      │
│                                                                 │
│  LAST-WRITE-WINS (Cassandra, DynamoDB):                         │
│    Node 1: user.balance = 100 (timestamp: 1000)                 │
│    Node 2: user.balance = 50  (timestamp: 1001)  ← WINS        │
│    Result: balance = 50                                         │
│                                                                 │
│    ✓ Simple, deterministic                                      │
│    ✗ Lost updates (first write disappeared)                     │
│    Use: When latest value is always correct (status updates)    │
│                                                                 │
│  VERSION VECTORS (Riak, DynamoDB):                              │
│    Track causality per replica:                                 │
│      Replica A: {A:1} balance=100                               │
│      Replica B: {B:1} balance=50                                │
│    After merge: {A:1, B:1} CONFLICT detected                    │
│                                                                 │
│    ✓ Detects conflicts                                          │
│    ✗ Application must resolve                                   │
│    Use: Shopping carts (merge = union of items)                 │
│                                                                 │
│  CRDT (Conflict-free Replicated Data Types):                    │
│    Counter CRDT:                                                │
│      Node 1: +10, +5  = {N1: 15}                                │
│      Node 2: +20, +3  = {N2: 23}                                │
│      Merge: 15 + 23 = 38 (no conflict!)                         │
│                                                                 │
│    ✓ Automatic conflict resolution                              │
│    ✓ Commutative, associative operations                        │
│    ✗ Limited data types                                         │
│    Use: Counters, sets, collaborative editing                   │
│                                                                 │
│  APPLICATION-LEVEL RESOLUTION:                                  │
│    Store all conflicting versions, let user choose:             │
│      Version 1: "Hello world"                                   │
│      Version 2: "Hi world"                                      │
│      → Show both, user picks or merges                          │
│                                                                 │
│    Use: Document editing, collaborative apps                    │
└─────────────────────────────────────────────────────────────────┘
```

## Troubleshooting

### Hot Partitions (Cassandra)

```
┌─────────────────────────────────────────────────────────────────┐
│                HOT PARTITION PROBLEMS                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PROBLEM: One partition gets disproportionate traffic           │
│                                                                 │
│    Normal Distribution:         Hot Partition:                  │
│    Node1 Node2 Node3           Node1 Node2 Node3                │
│      ║     ║     ║               ║     ║     ║                 │
│      ║     ║     ║             🔥🔥🔥   ║     ║                 │
│    ─────────────────           ─────────────────               │
│     33%  33%  33%              80%   10%  10%                  │
│                                                                 │
│  CAUSES:                                                        │
│    1. Celebrity/trending user (millions of followers)           │
│    2. Popular content (viral post)                              │
│    3. Global counters (single partition key)                    │
│    4. Date-based partition (all today's data on one node)      │
│                                                                 │
│  SYMPTOMS:                                                      │
│    • One node has high CPU/memory/disk I/O                      │
│    • Read/write timeouts on specific queries                    │
│    • Large partition warnings in logs                           │
│    • Uneven load distribution                                   │
│                                                                 │
│  DETECTION:                                                     │
│    nodetool cfstats keyspace.table | grep "Compacted partition" │
│    # Look for partitions >100MB                                 │
│                                                                 │
│    SELECT * FROM system.size_estimates                          │
│    WHERE keyspace_name='my_keyspace'                            │
│      AND table_name='my_table';                                 │
│                                                                 │
│  SOLUTIONS:                                                     │
│                                                                 │
│  1. ADD BUCKETING to partition key:                             │
│     BAD:  PRIMARY KEY (user_id, timestamp)                      │
│     GOOD: PRIMARY KEY ((user_id, bucket), timestamp)            │
│           WHERE bucket = timestamp % 10                         │
│                                                                 │
│     Spreads one user's data across 10 partitions                │
│                                                                 │
│  2. DENORMALIZE with separate table for hot data:               │
│     posts_by_user: Normal users                                 │
│     celebrity_posts: Separate handling, caching                 │
│                                                                 │
│  3. USE CACHING layer (Redis):                                  │
│     Cache reads for hot partitions                              │
│     Reduce load on Cassandra                                    │
│                                                                 │
│  4. SPLIT APPLICATION-SIDE:                                     │
│     Detect popular items in app code                            │
│     Route to different storage (Redis, CDN)                     │
│                                                                 │
│  PREVENTION:                                                    │
│    • Model for your query patterns BEFORE production            │
│    • Monitor partition sizes regularly                          │
│    • Test with realistic data distributions                     │
│    • Plan for power law distributions (80/20 rule)              │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│            LARGE PARTITION ISSUES                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Cassandra Partition Limits:                                    │
│    Soft limit: 100MB per partition                              │
│    Hard limit: 2 billion cells per partition                    │
│                                                                 │
│  Problems with large partitions:                                │
│    • Increased compaction time                                  │
│    • Memory pressure (entire partition must fit in memory)      │
│    • Slow reads (scan entire partition)                         │
│    • Tombstone accumulation                                     │
│                                                                 │
│  Fix: Use time-based bucketing:                                 │
│    PRIMARY KEY ((user_id, year_month), timestamp)               │
│                                                                 │
│    user_123, 2026-01: 10MB                                      │
│    user_123, 2026-02: 10MB                                      │
│    vs.                                                          │
│    user_123: 500MB (TOO BIG!)                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Consistency Issues

```
┌─────────────────────────────────────────────────────────────────┐
│              CONSISTENCY DEBUGGING                              │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PROBLEM: Stale reads, data inconsistencies                     │
│                                                                 │
│  SCENARIO 1: Write goes to node A, read from node B (stale)    │
│    Time │ Node A    │ Node B    │ Client                       │
│    ────┼───────────┼───────────┼─────────────                  │
│    t0  │ balance=0 │ balance=0 │                               │
│    t1  │ WRITE     │           │ SET balance=100               │
│        │ balance=100│ (repl.)  │                              │
│    t2  │ balance=100│ balance=0│ READ → 0  ❌ STALE!          │
│    t3  │ balance=100│balance=100│ READ → 100 ✓                │
│                                                                 │
│  CASSANDRA SOLUTIONS:                                           │
│                                                                 │
│  1. Increase Read Consistency:                                  │
│     Write: QUORUM (wait for 2/3 nodes)                          │
│     Read:  QUORUM (read from 2/3 nodes)                         │
│     → Guaranteed consistency (W + R > N)                        │
│                                                                 │
│  2. Use SERIAL consistency for critical ops:                    │
│     INSERT INTO accounts (id, balance) VALUES (?, ?)            │
│     IF NOT EXISTS                                               │
│     USING CONSISTENCY SERIAL;  -- Paxos/lightweight transactions│
│                                                                 │
│  3. Application-level timestamp check:                          │
│     Store last_updated timestamp                                │
│     Reject stale data in application                            │
│                                                                 │
│  MONGODB SOLUTIONS:                                             │
│                                                                 │
│  1. Read from Primary:                                          │
│     readPreference: "primary"  // Never stale                   │
│                                                                 │
│  2. Use Read Concern:                                           │
│     readConcern: "majority"  // Wait until replicated           │
│     readConcern: "linearizable"  // Strictest, slowest          │
│                                                                 │
│  3. Use Causally Consistent Sessions:                           │
│     const session = client.startSession({                       │
│       causalConsistency: true                                   │
│     });                                                         │
│     // Reads see own writes                                     │
│                                                                 │
│  DEBUGGING TOOLS:                                               │
│                                                                 │
│  Cassandra:                                                     │
│    nodetool repair keyspace.table  # Sync replicas              │
│    nodetool getendpoints keyspace table key  # Find replicas    │
│    SELECT * FROM table WHERE key=? USING CONSISTENCY ALL;       │
│                                                                 │
│  MongoDB:                                                       │
│    db.collection.find().readConcern("majority")                 │
│    rs.status()  # Check replication lag                         │
│    rs.printSlaveReplicationInfo()  # Lag details                │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│               SPLIT BRAIN / NETWORK PARTITION                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  PROBLEM: Network partition splits cluster                      │
│                                                                 │
│    Before:                      After Partition:                │
│    ┌────────────────┐           ┌─────┐     ┌─────┐            │
│    │  N1   N2   N3  │           │ N1  │  ✗  │N2 N3│            │
│    │  ✓    ✓    ✓   │           │  ✓  │     │ ✓ ✓ │            │
│    └────────────────┘           └─────┘     └─────┘            │
│                                 Minority    Majority            │
│                                                                 │
│  MongoDB Behavior (CP):                                         │
│    • Minority partition (N1): Becomes secondary (read-only)     │
│    • Majority partition (N2,N3): Elects new primary             │
│    • Minority rejects writes (no split brain)                   │
│    • After heal: Minority syncs from majority                   │
│                                                                 │
│  Cassandra Behavior (AP):                                       │
│    • Both partitions accept writes                              │
│    • After heal: Resolve with timestamps (last-write-wins)      │
│    • Potential data loss if conflict resolution is wrong        │
│    • Use QUORUM to avoid accepting writes in minority           │
│                                                                 │
│  PREVENTION:                                                    │
│    • Deploy across availability zones                           │
│    • Use odd number of nodes (3, 5, 7)                          │
│    • Monitor network latency between nodes                      │
│    • Use appropriate consistency levels                         │
└─────────────────────────────────────────────────────────────────┘
```

### Performance Degradation

```
┌─────────────────────────────────────────────────────────────────┐
│            PERFORMANCE TROUBLESHOOTING                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  MONGODB SLOW QUERIES                                           │
│                                                                 │
│  1. Identify slow queries:                                      │
│     db.setProfilingLevel(1, { slowms: 100 })  # Log >100ms     │
│     db.system.profile.find().sort({ts:-1}).limit(5)            │
│                                                                 │
│  2. Check query plan:                                           │
│     db.collection.explain("executionStats").find({...})         │
│                                                                 │
│     Look for:                                                   │
│       • COLLSCAN (table scan) → Add index                       │
│       • High nReturned vs. totalDocsExamined → Inefficient      │
│       • SORT in memory → Add index to avoid sort                │
│                                                                 │
│  3. Add indexes:                                                │
│     db.collection.createIndex({ author: 1, date: -1 })         │
│                                                                 │
│     Compound index rules:                                       │
│       Equality → Sort → Range                                   │
│       {status: 1, date: -1, score: 1}                           │
│                                                                 │
│  4. Check index usage:                                          │
│     db.collection.aggregate([{$indexStats:{}}])                 │
│                                                                 │
│  CASSANDRA SLOW QUERIES                                         │
│                                                                 │
│  1. Enable tracing:                                             │
│     TRACING ON;                                                 │
│     SELECT * FROM table WHERE ...;                              │
│     # Shows which nodes, latency per node                       │
│                                                                 │
│  2. Check for anti-patterns:                                    │
│     • ALLOW FILTERING (full table scan)                         │
│     • Large IN clauses (>10 values)                             │
│     • Secondary index on high-cardinality column                │
│     • Queries without partition key                             │
│                                                                 │
│  3. Examine table histograms:                                   │
│     nodetool tablehistograms keyspace.table                     │
│     # Shows latency distribution, partition sizes               │
│                                                                 │
│  4. Check for tombstones:                                       │
│     SELECT * FROM table WHERE ... LIMIT 1;                      │
│     # If warnings about tombstones → data model issue           │
│                                                                 │
│  REDIS SLOW COMMANDS                                            │
│                                                                 │
│  1. Check slow log:                                             │
│     SLOWLOG GET 10                                              │
│                                                                 │
│  2. Common slow commands:                                       │
│     • KEYS * (scans all keys) → Use SCAN instead               │
│     • SMEMBERS on large sets → Use SSCAN                       │
│     • SORT without LIMIT → O(n log n)                          │
│     • Large MGET/MSET → Split into smaller batches             │
│                                                                 │
│  3. Monitor command stats:                                      │
│     INFO commandstats                                           │
│                                                                 │
│  GENERAL CHECKLIST                                              │
│  ☐ Check memory: Is database swapping?                         │
│  ☐ Check disk: Is I/O saturated?                               │
│  ☐ Check network: High latency between nodes?                  │
│  ☐ Check connections: Too many idle connections?               │
│  ☐ Check compaction: Falling behind? (Cassandra)               │
│  ☐ Check replication lag: Secondaries behind? (MongoDB)        │
└─────────────────────────────────────────────────────────────────┘
```

## Real-World Examples

### Netflix: Cassandra for Viewing History

```
┌─────────────────────────────────────────────────────────────────┐
│           NETFLIX CASSANDRA ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  USE CASE: Store viewing history for 200M+ users                │
│                                                                 │
│  Requirements:                                                  │
│    • 1M+ writes/sec (user watch events)                         │
│    • Low latency reads (<10ms p99)                              │
│    • Multi-region replication                                   │
│    • 99.99% availability                                        │
│                                                                 │
│  Data Model:                                                    │
│                                                                 │
│    viewing_history table:                                       │
│    PRIMARY KEY (user_id, watch_date, video_id)                  │
│                 └──┬──┘  └─────┬─────┘                          │
│              Partition  Clustering Keys                         │
│                                                                 │
│    Why this design?                                             │
│    • user_id: Distributes across nodes                          │
│    • watch_date: Time bucketing (prevent large partitions)      │
│    • video_id: Sort order within partition                      │
│                                                                 │
│    Query: "Get recent watch history for user"                   │
│    SELECT * FROM viewing_history                                │
│    WHERE user_id = ?                                            │
│      AND watch_date >= '2026-01-01'                             │
│    LIMIT 50;                                                    │
│    → Single partition read, very fast!                          │
│                                                                 │
│  Cluster Configuration:                                         │
│    • 3 AWS regions (us-east, eu-west, ap-south)                 │
│    • RF=3 per region (9 total copies)                           │
│    • NetworkTopologyStrategy replication                        │
│    • Consistency: LOCAL_QUORUM (strong within region)           │
│                                                                 │
│  Write Path:                                                    │
│    User watches video                                           │
│         │                                                       │
│         ▼                                                       │
│    API Gateway (us-east)                                        │
│         │                                                       │
│         ▼                                                       │
│    Cassandra Write (LOCAL_QUORUM)                               │
│         │                                                       │
│         ├──→ Node 1 (us-east) ✓                                 │
│         ├──→ Node 2 (us-east) ✓  ← Wait for 2/3                │
│         └──→ Node 3 (us-east) ✓                                 │
│         │                                                       │
│         ├──→ Async replication to eu-west                       │
│         └──→ Async replication to ap-south                      │
│                                                                 │
│  Scale Stats (reported):                                        │
│    • 2,500+ Cassandra nodes                                     │
│    • 420 TB of data                                             │
│    • 1M+ ops/sec at peak                                        │
│    • p99 read latency: 8ms                                      │
│    • p99 write latency: 3ms                                     │
│                                                                 │
│  Key Learnings:                                                 │
│    ✓ Time bucketing prevents unbounded partition growth         │
│    ✓ LOCAL_QUORUM balances consistency and latency              │
│    ✓ Multi-region for global low latency                        │
│    ✓ Async cross-region replication for availability            │
│    ✓ Denormalized data model (no joins needed)                  │
│                                                                 │
│  Challenges & Solutions:                                        │
│    • Tombstone accumulation from TTL                            │
│      → Tuned gc_grace_seconds to 1 day                          │
│    • Compaction falling behind                                  │
│      → Increased compaction throughput                          │
│    • JVM GC pauses                                              │
│      → Tuned G1GC parameters, increased heap                    │
└─────────────────────────────────────────────────────────────────┘
```

### LinkedIn: MongoDB for Member Profiles

```
┌─────────────────────────────────────────────────────────────────┐
│            LINKEDIN MONGODB ARCHITECTURE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  USE CASE: Store 800M+ member profiles                          │
│                                                                 │
│  Requirements:                                                  │
│    • Flexible schema (profiles evolve constantly)               │
│    • Complex queries (search, recommendations)                  │
│    • Strong consistency (profile updates must be accurate)      │
│    • Low latency (<50ms p95)                                    │
│                                                                 │
│  Data Model:                                                    │
│                                                                 │
│    members collection:                                          │
│    {                                                            │
│      "_id": "user_12345",                                       │
│      "name": "Jane Doe",                                        │
│      "headline": "Software Engineer",                           │
│      "location": {                                              │
│        "city": "San Francisco",                                 │
│        "country": "US"                                          │
│      },                                                         │
│      "experience": [                ← Embedded array            │
│        {                                                        │
│          "company": "Tech Corp",                                │
│          "title": "Senior Engineer",                            │
│          "start": "2020-01",                                    │
│          "end": null,                                           │
│          "description": "..."                                   │
│        }                                                        │
│      ],                                                         │
│      "skills": ["Python", "Go", "Distributed Systems"],        │
│      "connections": 500,            ← Denormalized count        │
│      "profile_views": 1250,                                     │
│      "last_updated": ISODate("2026-02-14T10:30:00Z")           │
│    }                                                            │
│                                                                 │
│  Why MongoDB?                                                   │
│    ✓ Flexible schema: Add fields without ALTER TABLE            │
│    ✓ Nested documents: Experience, education embedded          │
│    ✓ Rich queries: Find by location, skills, company           │
│    ✓ Aggregation: Analytics on profiles                        │
│                                                                 │
│  Sharding Strategy:                                             │
│    • Shard key: hashed(_id)                                     │
│    • Why hashed? Random distribution, no hot spots              │
│    • 100+ shards across data centers                            │
│                                                                 │
│    Hash(_id) → Shard                                            │
│    user_12345 → Shard 42                                        │
│    user_67890 → Shard 7                                         │
│                                                                 │
│  Indexes:                                                       │
│    db.members.createIndex({ "location.city": 1, skills: 1 })   │
│    db.members.createIndex({ company: 1, title: 1 })            │
│    db.members.createIndex({ last_updated: -1 })                │
│                                                                 │
│  Read/Write Pattern:                                            │
│                                                                 │
│    Profile Page Load (Read):                                    │
│      db.members.findOne(                                        │
│        { _id: "user_12345" },                                   │
│        { projection: { connections: 0, profile_views: 0 } }     │
│      )                                                          │
│      → Single shard read, ~10ms                                 │
│                                                                 │
│    Profile Update (Write):                                      │
│      db.members.updateOne(                                      │
│        { _id: "user_12345" },                                   │
│        { $push: { experience: newJob } },                       │
│        { writeConcern: { w: "majority" } }                      │
│      )                                                          │
│      → Wait for majority replica ack, ~20ms                     │
│                                                                 │
│  Caching Layer:                                                 │
│    Redis (for hot profiles)                                     │
│         ▲                                                       │
│         │ Cache miss                                            │
│         │                                                       │
│    MongoDB (source of truth)                                    │
│                                                                 │
│    TTL: 5 minutes for profile data                              │
│    Cache hit rate: ~95%                                         │
│                                                                 │
│  Challenges & Solutions:                                        │
│    • Large documents (>1MB with rich profiles)                  │
│      → Split into base profile + detail collections             │
│    • Index bloat (too many indexes)                             │
│      → Regular index usage analysis, drop unused                │
│    • Sharding key can't be changed                              │
│      → Careful initial design, tested at scale                  │
│    • Connection storms during deploys                           │
│      → Connection pooling, gradual rollouts                     │
│                                                                 │
│  Scale Stats:                                                   │
│    • 800M+ documents                                            │
│    • 100+ shards                                                │
│    • 10K+ reads/sec per shard                                   │
│    • p95 read latency: 15ms                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Uber: Redis for Geospatial Indexing

```
┌─────────────────────────────────────────────────────────────────┐
│               UBER REDIS GEOSPATIAL                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  USE CASE: Find nearby drivers in real-time                     │
│                                                                 │
│  Requirements:                                                  │
│    • Sub-second latency (<100ms)                                │
│    • Millions of driver location updates/sec                    │
│    • Real-time radius queries (find drivers within 1km)         │
│    • High availability                                          │
│                                                                 │
│  Redis Geospatial Commands:                                     │
│                                                                 │
│    # Store driver location                                      │
│    GEOADD drivers:city_sf -122.4194 37.7749 driver_123          │
│                           └──lon──┘ └─lat──┘ └─member─┘         │
│                                                                 │
│    # Find drivers within radius                                 │
│    GEORADIUS drivers:city_sf -122.4194 37.7749 1 km WITHDIST    │
│    # Returns: driver_456 (0.3km), driver_789 (0.8km)            │
│                                                                 │
│    # Update driver location (very fast)                         │
│    GEOADD drivers:city_sf -122.4200 37.7750 driver_123          │
│                                                                 │
│  Architecture:                                                  │
│                                                                 │
│    Driver App → Location Update (every 4 seconds)               │
│         │                                                       │
│         ▼                                                       │
│    API Gateway                                                  │
│         │                                                       │
│         ▼                                                       │
│    Redis Cluster (sharded by city)                              │
│         │                                                       │
│         ├── drivers:city_sf (San Francisco drivers)             │
│         ├── drivers:city_ny (New York drivers)                  │
│         └── drivers:city_la (Los Angeles drivers)               │
│                                                                 │
│  Sharding Strategy:                                             │
│    • Shard by city/region (geographic locality)                 │
│    • Each city = separate Redis key                             │
│    • Queries within city = single shard (fast!)                 │
│                                                                 │
│  Data Structure:                                                │
│    Geospatial index uses Sorted Set internally:                 │
│    • Member: driver_id                                          │
│    • Score: geohash (encodes lat/lon)                           │
│    • O(log N) insertion and query                               │
│                                                                 │
│  Typical Query Flow:                                            │
│                                                                 │
│    1. User requests ride at (-122.4194, 37.7749)                │
│    2. App determines city: San Francisco                        │
│    3. Query: GEORADIUS drivers:city_sf -122.4194 37.7749 1km    │
│    4. Redis returns 3 nearest drivers in 5ms                    │
│    5. App filters by: available, rating, acceptance rate        │
│    6. Send ride request to best driver                          │
│                                                                 │
│  Persistence Strategy:                                          │
│    • AOF (Append-Only File) enabled                             │
│    • fsync every second                                         │
│    • Replica nodes for failover                                 │
│    • Location data can be rebuilt from driver apps if lost      │
│                                                                 │
│  Scalability:                                                   │
│    • 1M+ location updates/sec                                   │
│    • p99 latency: 3ms                                           │
│    • Redis Cluster: 100+ nodes                                  │
│    • Each city on multiple replicas                             │
│                                                                 │
│  Optimizations:                                                 │
│    • Pipeline multiple GEOADDs (batch updates)                  │
│    • TTL on driver entries (auto-remove inactive)               │
│    • Connection pooling (reduce overhead)                       │
│    • Monitor memory usage (evict old data)                      │
│                                                                 │
│  Alternative Considered:                                        │
│    • PostgreSQL PostGIS: Too slow for real-time                 │
│    • MongoDB Geospatial: Higher latency than Redis              │
│    • Elasticsearch: Better for complex queries, overkill here   │
│                                                                 │
│  Why Redis Won:                                                 │
│    ✓ Native geospatial support                                  │
│    ✓ In-memory = ultra-low latency                              │
│    ✓ Simple API (GEOADD, GEORADIUS)                             │
│    ✓ Proven at Uber's scale                                     │
└─────────────────────────────────────────────────────────────────┘
```

### Twitter: Cassandra for Timeline

```
┌─────────────────────────────────────────────────────────────────┐
│            TWITTER CASSANDRA TIMELINE                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  USE CASE: Store and retrieve user timelines (tweets)           │
│                                                                 │
│  Requirements:                                                  │
│    • Billions of tweets                                         │
│    • 500M+ active users                                         │
│    • High write throughput (6K tweets/sec average, 40K peak)    │
│    • Fast timeline reads (latest 50 tweets)                     │
│                                                                 │
│  Data Model:                                                    │
│                                                                 │
│    tweets table (store all tweets):                             │
│    PRIMARY KEY (tweet_id)                                       │
│    Columns: user_id, text, timestamp, retweet_count, etc.       │
│                                                                 │
│    user_timeline table (user's own tweets):                     │
│    PRIMARY KEY (user_id, timestamp, tweet_id)                   │
│                 └──┬──┘  └────────┬────────┘                    │
│              Partition    Clustering Keys                       │
│                           (reverse chronological)               │
│                                                                 │
│    home_timeline table (tweets from followed users):            │
│    PRIMARY KEY (user_id, timestamp, tweet_id)                   │
│                                                                 │
│  Query Patterns:                                                │
│                                                                 │
│    Get user's timeline:                                         │
│    SELECT * FROM user_timeline                                  │
│    WHERE user_id = ?                                            │
│    ORDER BY timestamp DESC                                      │
│    LIMIT 50;                                                    │
│    → Single partition read, very fast                           │
│                                                                 │
│    Get home timeline (feed):                                    │
│    SELECT * FROM home_timeline                                  │
│    WHERE user_id = ?                                            │
│    ORDER BY timestamp DESC                                      │
│    LIMIT 50;                                                    │
│    → Precomputed, no joins needed!                              │
│                                                                 │
│  Fanout Strategy:                                               │
│                                                                 │
│    When user tweets:                                            │
│    1. Write to tweets table (1 write)                           │
│    2. Write to user_timeline table (1 write)                    │
│    3. Fanout to followers' home_timeline (N writes)             │
│                                                                 │
│    Example:                                                     │
│    @elonmusk tweets → 100M followers                            │
│    → 100M writes to home_timeline tables!                       │
│                                                                 │
│    Optimization for celebrities:                                │
│    • Don't fanout for users with >1M followers                  │
│    • Compute timeline at read time (pull model)                 │
│    • Hybrid: Push for normal users, pull for celebrities        │
│                                                                 │
│  Consistency Level:                                             │
│    • Writes: LOCAL_QUORUM (balance speed & durability)          │
│    • Reads: ONE (eventual consistency OK for feeds)             │
│                                                                 │
│  TTL Strategy:                                                  │
│    • home_timeline entries: 7 days TTL                          │
│    • Auto-delete old entries (reduce storage)                   │
│    • Full history in tweets table (no TTL)                      │
│                                                                 │
│  Scalability:                                                   │
│    • Thousands of Cassandra nodes                               │
│    • Multi-datacenter replication                               │
│    • Petabytes of data                                          │
│    • Millions of ops/sec                                        │
│                                                                 │
│  Key Learnings:                                                 │
│    ✓ Denormalization enables fast reads (no joins)              │
│    ✓ Write amplification trade-off for read speed               │
│    ✓ Hybrid push/pull for different user types                  │
│    ✓ TTL reduces storage costs                                  │
│    ✓ Cassandra's write throughput crucial for this pattern      │
└─────────────────────────────────────────────────────────────────┘
```

## The "Why" Chain

- **Why NoSQL?** → Flexible schemas, horizontal scaling, purpose-built for specific access patterns
- **What's the alternative?** → [[databases_sql]] — when you need joins, ACID, or complex queries
- **What breaks without it?** → SQL can't handle 1M writes/sec (Cassandra can). SQL can't traverse graphs efficiently (Neo4j can). SQL schema changes on 1B rows are painful.

## Common Pitfalls

- Using MongoDB as a replacement for ALL SQL — it's not. Joins are limited, transactions were added late.
- Not thinking about access patterns upfront in Cassandra → redesigning is extremely painful
- Treating Redis as a database instead of a cache (unless using Redis with persistence)
- Using NoSQL because "it scales better" without actually needing that scale
- Choosing document store for data that's actually relational (use SQL!)
- Not planning for hot partitions in distributed systems
- Ignoring consistency trade-offs (eventual consistency surprises)
- Over-indexing in MongoDB (each index slows writes)
- Using ALLOW FILTERING in Cassandra (indicates bad data model)
- Not monitoring partition sizes (large partitions kill performance)

## Interview Tips

- Don't say "NoSQL is better than SQL" — say "NoSQL is better for X use case because..."
- Know at least one specific database per type and when to use it
- Mention **polyglot persistence** — "We'd use PostgreSQL for user accounts (ACID) and Cassandra for the activity feed (write throughput)"
- When designing systems, specify which NoSQL type and why
- Understand CAP theorem and how each database trades off
- Be ready to explain your data model choices (partition keys, indexes)
- Know real-world examples (Netflix/Cassandra, Uber/Redis)
- Discuss trade-offs: consistency, latency, complexity, cost
- Mention monitoring and operational concerns

## Performance Checklist

**Before Production:**
- [ ] Data model designed for query patterns
- [ ] Partition key chosen to avoid hot spots
- [ ] Indexes created for common queries
- [ ] Consistency levels chosen appropriately
- [ ] Replication strategy configured
- [ ] Monitoring and alerting set up
- [ ] Backup and disaster recovery plan
- [ ] Load testing at expected scale

**Ongoing Monitoring:**
- [ ] Query latency (p50, p95, p99)
- [ ] Throughput (reads/writes per second)
- [ ] Error rates (timeouts, unavailable)
- [ ] Partition sizes (detect hot partitions)
- [ ] Compaction lag (Cassandra)
- [ ] Replication lag (MongoDB)
- [ ] Memory usage and cache hit rates
- [ ] Disk I/O and network saturation

## Links

- [[databases_sql]] — The alternative for structured data
- [[01_fundamentals/cap_theorem]] — CAP trade-offs per database
- [[01_fundamentals/consistency_models]] — Tunable consistency in NoSQL
- [[06_trade_offs/sql_vs_nosql]] — Decision framework
- [[caching]] — Redis as both cache and data store
- [[sharding]] — Horizontal partitioning strategies
- [[replication]] — Data replication patterns
