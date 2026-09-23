#system-design #intermediate #database

# Database Internals — How Databases Actually Work

> Knowing internals helps you choose the right DB, optimize queries, and debug production issues.

---

## How PostgreSQL Executes a Query

```
SQL Query → Parser → Query Planner → Executor → Storage Engine → Result

Parser: Validates syntax, creates parse tree
Planner: Generates execution plan (which index? join order? scan type?)
Executor: Runs the plan
Storage Engine: Reads/writes data from/to disk
```

### Reading EXPLAIN ANALYZE

```sql
EXPLAIN ANALYZE SELECT * FROM orders WHERE user_id = 123 ORDER BY created_at DESC LIMIT 20;

-- Bad plan (no index):
Seq Scan on orders  (cost=0.00..185432.00 rows=10000000 actual time=3240ms)
  Filter: (user_id = 123)
  Rows Removed by Filter: 9999800

-- Good plan (with index):
Index Scan using idx_orders_user_created on orders  (cost=0.43..45.12 rows=200 actual time=0.05ms)
  Index Cond: (user_id = 123)
  Rows Fetched: 20
```

**Key indicators:**
- `Seq Scan` = full table scan (bad for large tables)
- `Index Scan` = using index (good)
- `Index Only Scan` = answered entirely from index (best)
- `actual time` = real execution time
- `Rows Removed by Filter` = wasted work (too many rows scanned)

---

## MVCC (Multi-Version Concurrency Control)

How PostgreSQL handles concurrent reads and writes WITHOUT locking:

```
Transaction A starts (snapshot at t=1)
Transaction B updates row X from "old" to "new" (at t=2)
Transaction B commits

Transaction A reads row X → still sees "old" (its snapshot is t=1)
Transaction A commits

New transaction reads row X → sees "new"
```

**Each transaction sees a consistent snapshot.** Readers don't block writers. Writers don't block readers. This is WHY PostgreSQL is fast under concurrent load.

**Trade-off:** Old row versions accumulate → VACUUM cleans them up (autovacuum runs automatically).

---

## B-Tree Index Internals

```
                    [50]
                /          \
          [20, 30]        [70, 80]
         /   |   \       /   |   \
     [10] [25] [35]  [60] [75] [90]
         ↓     ↓ ↓      ↓     ↓    ↓
       data  data data  data  data  data
```

- **Balanced:** All leaf nodes at same depth → O(log N) guaranteed
- **Sorted:** Supports range queries (`WHERE price BETWEEN 100 AND 500`)
- **Wide nodes:** Each node holds many keys → fewer disk reads (B-tree, not binary tree)
- **Leaf nodes linked:** Efficient range scans (follow leaf chain)

**For 10M rows:** Tree depth ~4. Each lookup = 4 disk reads. With caching, often 1-2 reads.

---

## LSM Tree (Write-Optimized — Cassandra, RocksDB)

```
Write → MemTable (in-memory, sorted) + WAL (durability)
         ↓ (when MemTable full)
     SSTable L0 (sorted file on disk)
         ↓ (background compaction)
     SSTable L1 (merged, larger)
         ↓
     SSTable L2 (merged, even larger)
```

**Reads:** Check MemTable → L0 → L1 → L2 (use Bloom filters to skip SSTables that don't have the key)

| | B-Tree (PostgreSQL) | LSM Tree (Cassandra) |
|--|------|------|
| Write speed | Moderate (random I/O) | Fast (sequential I/O) |
| Read speed | Fast (single lookup) | Slower (check multiple levels) |
| Space amplification | Low | Higher (duplicates during compaction) |
| Write amplification | Low | Higher (compaction rewrites) |
| Best for | Read-heavy, OLTP | Write-heavy, time-series |

---

## Connection Pooling — Why It Matters

Each PostgreSQL connection uses **~10MB RAM** + fork overhead:
```
100 app servers × 20 connections each = 2000 connections
2000 × 10MB = 20GB RAM just for connections!
PostgreSQL max_connections default: 100
```

**Solution: PgBouncer (connection pooler)**
```
App Servers (2000 connections) → PgBouncer (pool of 100) → PostgreSQL (100 actual connections)
```

**Modes:**
- **Transaction pooling:** Connection returned to pool after each transaction (most common)
- **Session pooling:** Connection held for entire session
- **Statement pooling:** Connection returned after each statement (most aggressive)

---

## Partitioning vs Sharding

| | Partitioning | Sharding |
|--|-------------|---------|
| **Where** | Same server, multiple physical tables | Different servers |
| **Why** | Faster queries on subsets, easier maintenance | Write scaling, storage scaling |
| **Managed by** | Database engine | Application or middleware |
| **Example** | `orders_2024_q1`, `orders_2024_q2` | Shard 1 (users A-M), Shard 2 (users N-Z) |

---

## Transaction Isolation Levels (Practical)

```sql
-- PostgreSQL default: Read Committed
-- See only committed data, but re-reading may give different results

-- Repeatable Read: Your snapshot is frozen for the entire transaction
SET TRANSACTION ISOLATION LEVEL REPEATABLE READ;

-- Serializable: Transactions behave as if run one-at-a-time (slowest)
SET TRANSACTION ISOLATION LEVEL SERIALIZABLE;
```

**When to change from default:**
- **Repeatable Read:** Financial calculations that read multiple rows (must be consistent)
- **Serializable:** Preventing phantom reads in booking systems (double-booking prevention)

## Links

- [[../02_building_blocks/databases_sql]] — SQL fundamentals
- [[../03_design_patterns/database_indexing]] — Index types and usage
- [[../03_design_patterns/sharding]] — When partitioning isn't enough
- [[../03_design_patterns/write_ahead_log]] — WAL internals
