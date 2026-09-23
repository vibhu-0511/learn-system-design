#system-design #intermediate #redis

# Redis Deep Dive — Beyond GET/SET

> Redis appears in every system design. Knowing its internals sets you apart.

---

## Why Redis is Fast

1. **In-memory:** Data stored in RAM (~100ns access vs ~150μs SSD)
2. **Single-threaded:** No lock contention, no context switching (event loop like Node.js)
3. **Efficient data structures:** Purpose-built (not generic hash tables)
4. **I/O multiplexing:** epoll handles thousands of connections with one thread

**Single-threaded but fast:** One thread doing 100K ops/sec in RAM is faster than 100 threads fighting over locks on disk.

---

## Data Structures You Should Know

### Strings (Basic)
```
SET user:123:name "Rahul"
GET user:123:name → "Rahul"
INCR user:123:views → 1, 2, 3... (atomic counter)
SETNX lock:order_123 "server_a" EX 30  → distributed lock
```

### Hashes (Object Storage)
```
HSET user:123 name "Rahul" email "rahul@x.com" age 25
HGET user:123 name → "Rahul"
HGETALL user:123 → {name: "Rahul", email: "rahul@x.com", age: "25"}
HINCRBY user:123 age 1 → 26
```
**Use for:** User sessions, configs, any object with fields. More memory-efficient than separate string keys.

### Lists (Queues)
```
LPUSH queue:emails "job1" "job2" "job3"  → push to left
RPOP queue:emails → "job1"               → pop from right (FIFO queue)
BRPOP queue:emails 30                    → blocking pop (wait up to 30s)
LRANGE queue:emails 0 -1                 → peek at all items
```
**Use for:** Simple job queues, recent activity feeds, message buffers.

### Sets (Unique Collections)
```
SADD online:users "user1" "user2" "user3"
SISMEMBER online:users "user2" → true
SMEMBERS online:users → {"user1", "user2", "user3"}
SCARD online:users → 3
SINTER set1 set2 → intersection (mutual friends!)
```
**Use for:** Online presence, tags, mutual friends, deduplication.

### Sorted Sets (Ranked Data) — MOST POWERFUL

```
ZADD leaderboard 1500 "player_a" 2300 "player_b" 1800 "player_c"
ZREVRANGE leaderboard 0 9 WITHSCORES → top 10 players
ZRANK leaderboard "player_a" → rank (0-based)
ZINCRBY leaderboard 100 "player_a" → increment score

ZADD timeline:user123 1705123456 "post_abc"  → timestamp as score
ZREVRANGEBYSCORE timeline:user123 +inf -inf LIMIT 0 20 → latest 20 posts
```
**Use for:** Leaderboards, timelines/feeds, rate limiting (sliding window), priority queues, delayed job scheduling.

### HyperLogLog (Approximate Counting)

```
PFADD daily_visitors "ip_1" "ip_2" "ip_3" "ip_1"  → 3 unique
PFCOUNT daily_visitors → ~3 (0.81% error)
```
**12KB memory** regardless of how many items. Counts billions of unique items. **Use for:** Unique visitor counts, unique search queries.

### Streams (Event Streaming — Like Kafka Lite)

```
XADD events * user_id 123 action "purchase" amount 5000
XADD events * user_id 456 action "view" product "iphone"

XREAD COUNT 10 STREAMS events 0   → read from beginning
XREAD BLOCK 5000 STREAMS events $  → blocking read (wait for new events)
```
**Use for:** Event logs, activity streams, simple pub/sub with persistence. Lighter than Kafka.

---

## Redis Persistence

| Mode | How | Trade-off |
|------|-----|-----------|
| **RDB (Snapshot)** | Periodic point-in-time dump to disk | Fast restart, may lose recent data |
| **AOF (Append-Only File)** | Log every write operation | Durable, slower restart (replay log) |
| **RDB + AOF** | Both | Best durability + fast restart |
| **No persistence** | Pure cache | Fastest, all data lost on restart |

**Production default:** RDB + AOF. RDB for fast restart, AOF for durability.

---

## Redis Cluster (Sharding)

```
16384 hash slots distributed across nodes:
  Node A: slots 0-5460
  Node B: slots 5461-10922
  Node C: slots 10923-16383

Key → CRC16(key) % 16384 → slot → node

Adding Node D: some slots migrate from A/B/C to D (automatic resharding)
```

Each node has replicas for failover. If Node A dies, its replica promotes automatically.

---

## Redis in System Design — Quick Reference

| Use Case | Data Structure | Example |
|----------|---------------|---------|
| Cache | String / Hash | `SET product:123 "{json}"` |
| Session store | Hash | `HSET session:abc user_id 123 expires 3600` |
| Rate limiting | Sorted Set | Sliding window with timestamps as scores |
| Leaderboard | Sorted Set | `ZADD leaderboard score player` |
| Distributed lock | String + SETNX | `SET lock:resource "owner" NX EX 30` |
| Job queue | List | `LPUSH / BRPOP` |
| Online presence | String + TTL | `SET presence:user123 "online" EX 60` |
| Unique counts | HyperLogLog | `PFADD / PFCOUNT` |
| Pub/sub notifications | Pub/Sub | `PUBLISH / SUBSCRIBE` |
| Timeline/feed | Sorted Set | Post IDs scored by timestamp |
| Geo queries | Geospatial | `GEOADD / GEORADIUS` (Uber driver locations) |

---

## Performance Numbers

| Operation | Throughput |
|-----------|-----------|
| GET/SET (single key) | 100,000-200,000 ops/sec |
| LPUSH/RPOP | 100,000+ ops/sec |
| Pipelined commands | 500,000+ ops/sec |
| Lua script (atomic multi-op) | 50,000-100,000 ops/sec |
| Cluster (3 masters) | 300,000-500,000 ops/sec |

---

## Interview Power Moves

- "We'd use Redis sorted sets for the leaderboard — O(log N) insert and O(log N + M) range query"
- "For unique daily visitors, HyperLogLog gives us approximate counts in 12KB regardless of cardinality"
- "Redis streams as a lightweight alternative to Kafka for services under 50K events/sec"
- "Token bucket rate limiter implemented as a Lua script in Redis for atomicity"

## Links

- [[../02_building_blocks/caching]] — Caching patterns using Redis
- [[../03_design_patterns/distributed_locking]] — Redis locks
- [[../05_case_studies/design_distributed_cache]] — Build Redis-like cache
- [[../14_real_projects/project_rate_limiter]] — Redis Lua rate limiter
