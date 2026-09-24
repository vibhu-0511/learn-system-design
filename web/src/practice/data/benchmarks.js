// Rough single-node / single-cluster capability envelopes. Order-of-magnitude
// numbers used by the traffic simulator and the Capacity Lab. "Infinity"
// means the component scales horizontally enough that it is never the
// first bottleneck at the scales this app simulates.
export const BENCHMARKS = {
  "cdn":            { maxQps: Infinity, p50LatencyMs: 20,  note: "Edge POPs scale horizontally; origin offload is the point.", citation: "02_building_blocks/cdn.md" },
  "load-balancer":  { maxQps: 200000,  p50LatencyMs: 1,   note: "L7 LB on commodity hardware; L4 goes far higher.", citation: "02_building_blocks/load_balancers.md" },
  "api-gateway":    { maxQps: 50000,   p50LatencyMs: 5,   note: "Auth + routing + rate-limit checks per request.", citation: "02_building_blocks/api_gateway.md" },
  "rate-limiter":   { maxQps: 100000,  p50LatencyMs: 1,   note: "Counter check in memory/Redis.", citation: "02_building_blocks/rate_limiter.md" },
  "api-server":     { maxQps: 5000,    p50LatencyMs: 30,  note: "Single stateless app instance; scale with LB.", citation: "01_fundamentals/scalability.md" },
  "worker":         { maxQps: 5000,    p50LatencyMs: 50,  note: "Per consumer instance; scale by partition count.", citation: "02_building_blocks/message_queues.md" },
  "sql-database":   { maxQps: 20000,   p50LatencyMs: 5,   note: "Reads on a tuned primary; writes top out far lower (~5K/s).", citation: "02_building_blocks/databases_sql.md" },
  "sql-replica":    { maxQps: 20000,   p50LatencyMs: 5,   note: "Read-only; lag applies.", citation: "03_design_patterns/replication.md" },
  "sql-shard":      { maxQps: 100000,  p50LatencyMs: 5,   note: "Scales with shard count; hot partitions break the math.", citation: "03_design_patterns/sharding.md" },
  "kv-store":       { maxQps: 100000,  p50LatencyMs: 1,   note: "Redis-class in-memory lookups per node.", citation: "02_building_blocks/databases_nosql.md" },
  "cache":          { maxQps: 100000,  p50LatencyMs: 1,   note: "In-memory; the miss path is the real cost.", citation: "02_building_blocks/caching.md" },
  "search-index":   { maxQps: 10000,   p50LatencyMs: 20,  note: "Per node, query-complexity dependent.", citation: "02_building_blocks/search_systems.md" },
  "blob-storage":   { maxQps: 50000,   p50LatencyMs: 50,  note: "Object GET/PUT; bandwidth matters more than QPS.", citation: "02_building_blocks/blob_storage.md" },
  "message-queue":  { maxQps: 100000,  p50LatencyMs: 5,   note: "Enqueue throughput; consumer lag is the failure mode.", citation: "02_building_blocks/message_queues.md" },
  "pub-sub":        { maxQps: 500000,  p50LatencyMs: 10,  note: "Kafka-class partitioned log.", citation: "03_design_patterns/pub_sub.md" },
  "observability":  { maxQps: Infinity, p50LatencyMs: 0,  note: "Off the request path (sampled).", citation: "02_building_blocks/monitoring_and_logging.md" },
};

export function benchmarkFor(paletteId) {
  return BENCHMARKS[paletteId] ?? null;
}
