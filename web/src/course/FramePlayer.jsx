import { Suspense, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { BEAT_LABEL, metricLabel, formatMetric, metricTone } from "./metrics.js";

export function MetricTiles({ metrics }) {
  return (
    <div className="tiles">
      {Object.entries(metrics).map(([key, value]) => (
        <div key={key} className="tile" data-tone={metricTone(key, value)}>
          <small>{metricLabel(key)}</small>
          <b>{formatMetric(key, value)}</b>
        </div>
      ))}
    </div>
  );
}

// Steps through the frames of run(params): one frame per beat of the architect's loop.
// `Hero` is an optional custom stage for chapters whose idea needs a picture.
export default function FramePlayer({ frames, params, Hero }) {
  const [index, setIndex] = useState(0);
  const i = Math.min(index, frames.length - 1);
  const frame = frames[i];
  const go = (n) => setIndex((n + frames.length) % frames.length);

  return (
    <section className="glass hero-card" aria-label="Simulation">
      <div className="beats" role="group" aria-label="Steps">
        {frames.map((f, n) => (
          <button key={n} className="tab" aria-pressed={n === i} onClick={() => setIndex(n)}>
            <span className="mono">{n + 1}</span> {BEAT_LABEL[f.beat] ?? f.beat}
          </button>
        ))}
      </div>

      <h2 className="frame-title">{frame.title}</h2>
      <div className="stage">
        {Hero ? (
          <Suspense fallback={<MetricTiles metrics={frame.metrics} />}>
            <Hero frame={frame} params={params} />
          </Suspense>
        ) : (
          <MetricTiles metrics={frame.metrics} />
        )}
      </div>

      <div className="player-controls">
        <button className="iconbtn bordered" onClick={() => go(i - 1)} aria-label="Previous step">
          <ArrowLeft size={16} aria-hidden="true" />
        </button>
        <button className="iconbtn bordered" onClick={() => go(i + 1)} aria-label="Next step">
          <ArrowRight size={16} aria-hidden="true" />
        </button>
        <p className="frame-note" aria-live="polite">
          {frame.note}
        </p>
      </div>
    </section>
  );
}
