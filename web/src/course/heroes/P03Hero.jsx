import { shardLoads } from "../../../../course/4_patterns/p03_sharding/sim.mjs";

// Custom stage for p03: one bar per shard, so a hot shard is visible at a glance.
export default function P03Hero({ frame, params }) {
  const loads = shardLoads(frame.beat, params);
  const hottest = Math.max(...loads);
  const top = Math.max(100, hottest);
  const tone = (l) => (l >= 100 ? "bad" : l >= 70 ? "hot" : "ok");
  return (
    <div className="shards" role="img" aria-label={`${loads.length} shard${loads.length > 1 ? "s" : ""}; the busiest runs at ${hottest}% of capacity.`}>
      {loads.map((l, i) => (
        <div key={i} className="shard" data-tone={tone(l)}>
          <b>{l}%</b>
          <div className="shard-bar" aria-hidden="true">
            <div style={{ height: `${(l / top) * 100}%` }} />
          </div>
          <small>#{i + 1}</small>
        </div>
      ))}
    </div>
  );
}
