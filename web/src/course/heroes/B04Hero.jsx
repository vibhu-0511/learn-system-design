import { formatMetric, metricTone } from "../metrics.js";

// Custom stage for b04: reads flow from clients through the cache to the database.
export default function B04Hero({ frame, params }) {
  const m = frame.metrics;
  const tone = metricTone("dbUtilizationPct", m.dbUtilizationPct);
  const cache = frame.beat === "constraints" ? ["No cache", "reads go straight through"] : frame.beat === "failure" ? ["Cache empty", "every read misses"] : [`${formatMetric("hitRatePct", m.hitRatePct)} hits`, "served from memory"];

  return (
    <div className="flow" role="img" aria-label={`Clients send ${params.readRps} reads per second. ${cache[0]}. The database receives ${m.dbLoadRps} reads per second.`}>
      <div className="node">
        <small>Clients</small>
        <b>{params.readRps.toLocaleString("en-US")} req/s</b>
      </div>
      <span className="link" aria-hidden="true">→</span>
      <div className="node" data-dashed={frame.beat === "constraints" || frame.beat === "failure"}>
        <small>{cache[0]}</small>
        <b>{cache[1]}</b>
      </div>
      <span className="link" aria-hidden="true">
        <i>{m.dbLoadRps.toLocaleString("en-US")}/s misses</i> →
      </span>
      <div className="node" data-tone={tone}>
        <small>Database</small>
        <b>{formatMetric("dbLoadRps", m.dbLoadRps)}</b>
        <div className="bar" aria-hidden="true">
          <div style={{ width: `${Math.min(100, m.dbUtilizationPct)}%` }} />
        </div>
        <small>
          load {formatMetric("dbUtilizationPct", m.dbUtilizationPct)} of {params.dbCapacity.toLocaleString("en-US")}/s
        </small>
      </div>
    </div>
  );
}
