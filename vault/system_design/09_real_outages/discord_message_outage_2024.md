#system-design #outage #database #scaling

# Discord Database Scaling Incident (2024)

## What Happened

Discord experienced several notable outages in 2024 related to their database infrastructure. Their message storage system — handling **trillions of messages** across millions of servers — hit scaling limits multiple times.

## Background: Discord's Architecture

Discord famously migrated from MongoDB to **Cassandra** for message storage, and later to **ScyllaDB** (C++ rewrite of Cassandra) for better performance. Their architecture:

```
User → API → Message Service → ScyllaDB cluster
  Partition key: channel_id
  Clustering key: message_id (snowflake, time-sorted)
```

**Scale:** 4B+ messages stored per day, 200M+ monthly active users.

## What Goes Wrong at This Scale

1. **Hot partition problem:** A single Discord server with 1M+ members creates massive read/write hotspot on one Cassandra partition
2. **Compaction storms:** Background compaction (merging SSTables) consumes CPU/I/O, slowing real-time queries
3. **Replication lag:** During peak, replication falls behind → users see stale data or "message not found"

## Lessons for System Design

| Lesson | Concept |
|--------|---------|
| **Hot partitions** are the #1 problem in distributed databases | [[../03_design_patterns/sharding]] — shard key choice |
| Cassandra/ScyllaDB compaction can impact latency | [[../15_intermediate_topics/database_internals]] — LSM trees |
| **Monitoring partition size** is critical at scale | Proactive alerting |
| Sometimes you need to **split hot partitions** at application level | Sub-sharding |

## The Key Takeaway

At trillion-message scale, your shard/partition key choice determines everything. Discord uses channel_id as partition key — but a 1M-member server's general channel is a hot partition. Mitigation: split large channels into sub-partitions at the application level.

## Links

- [[../03_design_patterns/sharding]] — Partition key selection
- [[../02_building_blocks/databases_nosql]] — Cassandra/ScyllaDB
- [[../15_intermediate_topics/database_internals]] — LSM compaction
