import { formatMetric, metricTone } from "../metrics.js";

// Custom stage for e01: the topology gains parts frame by frame.
export default function E01Hero({ frame, params }) {
  const m = frame.metrics;
  const grown = frame.beat !== "constraints";
  const scaled = frame.beat === "tradeoff";
  const node = (title, value, tone) => (
    <div className="flow-node" data-tone={tone}>
      <small>{title}</small>
      <b>{value}</b>
    </div>
  );
  const arrow = (
    <span className="link" aria-hidden="true">
      →
    </span>
  );
  const label = grown
    ? `Clients reach a load balancer, ${m.appServers} app servers at ${m.appUtilizationPct}%, a cache and a database at ${m.dbUtilizationPct}%${scaled ? `, plus ${params.replicas} read replicas at ${m.replicaUtilizationPct}%` : ""}.`
    : `Clients reach one server that also runs the database, at ${m.appUtilizationPct}%.`;
  const tone = (key) => metricTone(key, m[key]);

  return (
    <div className="flow" role="img" aria-label={label}>
      {node("Clients", "traffic")}
      {arrow}
      {grown && (
        <>
          {node("Load balancer", "spreads requests")}
          {arrow}
        </>
      )}
      {node(grown ? `${m.appServers} app servers` : "One server + database", formatMetric("appUtilizationPct", m.appUtilizationPct), tone("appUtilizationPct"))}
      {grown && (
        <>
          {arrow}
          {node("Cache", `${params.hitRatePct}% hits`)}
          {arrow}
          {node("Primary database", formatMetric("dbUtilizationPct", m.dbUtilizationPct), tone("dbUtilizationPct"))}
        </>
      )}
      {scaled && (
        <>
          {arrow}
          {node(`${params.replicas} read replicas`, formatMetric("replicaUtilizationPct", m.replicaUtilizationPct), tone("replicaUtilizationPct"))}
        </>
      )}
    </div>
  );
}
