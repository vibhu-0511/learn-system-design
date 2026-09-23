#system-design #case-study #intermediate

# Design a Distributed Key-Value Store (DynamoDB-like)

## The Question
> "Design a distributed key-value store that supports GET, PUT, DELETE with high availability."

---

## Core Design

| Component | Choice | Why |
|-----------|--------|-----|
| Partitioning | Consistent hashing | Minimize data movement on scaling |
| Replication | N=3, quorum-based | Tunable consistency |
| Conflict resolution | Vector clocks + LWW | Detect and resolve conflicts |
| Failure detection | Gossip protocol | Decentralized, no SPOF |
| Write path | Write to coordinator → replicate to N-1 nodes | Tunable W |
| Read path | Read from R nodes, return latest | Tunable R |

### Write Path
```
Client → Coordinator node (via consistent hashing)
  → Write to local storage (LSM tree)
  → Replicate to N-1 nodes async or sync (based on W)
  → Return success when W nodes acknowledge

W=1: Fast, risk of data loss
W=N: Slow, durable
W=majority (2 of 3): Balance
```

### Read Path
```
Client → Coordinator → Read from R nodes → Return latest version

R=1: Fast, might be stale
R=N: Slow, always fresh
R+W > N: Strong consistency guaranteed (quorum overlap)
```

### Consistent Hashing Ring
```
hash(key) → position on ring → walk clockwise → first N nodes store the data

Adding node: only ~1/N keys need to move
Virtual nodes: 100-200 per physical node for better distribution
```

### Conflict Resolution
When R responses disagree (replication lag, concurrent writes):
- **Vector clocks:** Detect if one version causally supersedes another
- **Last-Write-Wins (LWW):** If concurrent (no causal order), highest timestamp wins
- **Read repair:** On read, if versions differ, update stale replicas with latest

## Interview Tip
> "The key decisions are: consistent hashing for partitioning, quorum reads/writes for tunable consistency (W+R>N for strong consistency), and vector clocks for conflict detection. This is essentially how DynamoDB and Cassandra work."

## Links
- [[../03_design_patterns/consistent_hashing]] — Partitioning
- [[../03_design_patterns/replication]] — Quorum reads/writes
- [[../01_fundamentals/consistency_models]] — Tunable consistency
- [[design_distributed_cache]] — Similar but for caching
