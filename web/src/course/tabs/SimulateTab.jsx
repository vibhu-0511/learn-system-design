import ParamPanel from "../ParamPanel.jsx";
import { BEAT_LABEL, metricLabel, formatMetric, metricTone } from "../metrics.js";

// Sliders on top, the four beats side by side below, so one change shows its effect on all of them.
export default function SimulateTab({ sim, params, result, chapter, onChange, onReset }) {
  const { frames } = result;
  const keys = [...new Set(frames.flatMap((f) => Object.keys(f.metrics)))];
  const [firstParam] = Object.keys(sim.PARAMS);

  return (
    <div className="simulate">
      <p className="lead">Move a slider. The player above and this table update together.</p>
      <ParamPanel params={sim.PARAMS} values={params} onChange={onChange} onReset={onReset} />

      <div className="compare">
        <table>
          <thead>
            <tr>
              <th scope="col">Metric</th>
              {frames.map((f, i) => (
                <th scope="col" key={i}>
                  {BEAT_LABEL[f.beat] ?? f.beat}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {keys.map((key) => (
              <tr key={key}>
                <th scope="row">{metricLabel(key)}</th>
                {frames.map((f, i) => (
                  <td key={i} data-tone={metricTone(key, f.metrics[key])}>
                    {formatMetric(key, f.metrics[key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="muted">
        The same code runs in a terminal: <code className="mono">node {chapter.dir}/sim.mjs --{firstParam}={params[firstParam]}</code>
      </p>
    </div>
  );
}
