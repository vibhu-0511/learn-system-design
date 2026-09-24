// Custom stage for b05: a tank that fills when jobs arrive faster than workers finish them.
export default function B05Hero({ frame, params }) {
  const m = frame.metrics;
  const spiking = frame.beat === "failure";
  const queued = frame.beat !== "constraints";
  const inflow = params.uploadsPerSec * (spiking ? params.spikeMultiplier : 1);
  const outflow = params.workers / params.jobSec;
  // Backlog as a share of everything that arrived during the spike.
  const fill = Math.min(1, Math.max(0, m.backlogJobs / Math.max(1, inflow * params.spikeSec)));
  const rate = (n) => `${(Math.round(n * 10) / 10).toLocaleString("en-US")}/s`;
  const label = queued
    ? `Jobs arrive at ${rate(inflow)}, workers finish ${rate(outflow)}, ${m.backlogJobs.toLocaleString("en-US")} jobs are waiting.`
    : `No queue: each request waits ${m.responseMs / 1000} seconds for its job.`;

  return (
    <div className="flow" role="img" aria-label={label}>
      <div className="flow-node">
        <small>Producers</small>
        <b>{rate(inflow)} in</b>
      </div>
      <span className="link" aria-hidden="true">
        →
      </span>
      <div className="flow-node" data-dashed={!queued} data-tone={m.backlogJobs > 0 ? "bad" : undefined}>
        <small>{queued ? "Queue" : "No queue"}</small>
        <div className="tank-body" aria-hidden="true">
          <div style={{ height: `${Math.round(fill * 100)}%` }} />
        </div>
        <b>{queued ? `${m.backlogJobs.toLocaleString("en-US")} waiting` : `user waits ${m.responseMs / 1000} s`}</b>
        {m.waitSec > 0 && <small>last job waits {m.waitSec} s</small>}
        {m.duplicateJobs > 0 && <small>{m.duplicateJobs.toLocaleString("en-US")} redelivered per hour</small>}
      </div>
      <span className="link" aria-hidden="true">
        →
      </span>
      <div className="flow-node">
        <small>Workers</small>
        <b>{rate(outflow)} out</b>
      </div>
    </div>
  );
}
