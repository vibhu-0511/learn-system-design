// Custom stage for p13: thread-pool compartments, one per dependency, the first of which misbehaves.
export default function P13Hero({ frame, params }) {
  const { deps, poolSize, rps, hungMs, spikeX } = params;
  const m = frame.metrics;
  const shared = frame.beat === "constraints";
  const size = (frame.beat === "tradeoff" ? 2 : 1) * (poolSize / deps);
  const hung = shared || frame.beat === "component";
  const base = rps / deps;
  // Threads a dependency wants (rate x hold time), against its compartment's size.
  const want = (i) => (i === 0 ? (hung ? base * (hungMs / 1000) : base * spikeX * 0.05) : base * 0.05);
  const cells = shared
    ? [{ fill: Math.min(1, m.threadsHeldByHung / poolSize), bad: true, name: `Shared pool of ${poolSize}` }]
    : Array.from({ length: deps }, (_, i) => ({ fill: Math.min(1, want(i) / size), bad: i === 0, name: String(i + 1) }));
  const label = shared
    ? `One shared pool: the hung dependency holds ${m.threadsHeldByHung} of ${poolSize} threads and ${m.healthyDepsFailedPct}% of healthy calls fail.`
    : `${deps} compartments of ${Math.round(size * 10) / 10} threads; ${m.failedRequestsPct}% of requests fail, ${m.healthyDepsFailedPct}% on healthy dependencies.`;

  return (
    <div className="pools" role="img" aria-label={label}>
      {cells.map((c, i) => (
        <div key={i} className="pool" data-tone={c.bad ? (c.fill >= 1 ? "bad" : "hot") : "ok"} data-wide={shared}>
          <div className="pool-bar" aria-hidden="true">
            <div style={{ height: `${Math.round(c.fill * 100)}%` }} />
          </div>
          <small>{c.name}</small>
        </div>
      ))}
    </div>
  );
}
