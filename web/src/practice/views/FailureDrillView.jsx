import { useState, useMemo } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Flame,
  Zap,
} from "lucide-react";
import { injectFailure, FAILURE_MODES } from "../lib/failureSim.js";
import { formatNumber } from "../lib/capacity.js";
import {
  useWorkspaces,
  updateWorkspace,
  ensureFailureWorkspace,
} from "../data/workspaces.js";

const SCORE_OPTIONS = [
  { value: 1, label: "Off", tone: "danger" },
  { value: 2, label: "Some clue", tone: "warning" },
  { value: 3, label: "Got close", tone: "chip" },
  { value: 4, label: "Got it", tone: "success" },
];

export function FailureDrillView({ onOpenNote }) {
  const { workspaces } = useWorkspaces();
  const drillWorkspaces = workspaces.filter(
    (w) => w.kind === "drill" && (w.drill?.components?.length || 0) > 0,
  );

  const [selectedDrillId, setSelectedDrillId] = useState(
    drillWorkspaces[0]?.id || "",
  );
  const drillWs = drillWorkspaces.find((w) => w.id === selectedDrillId);

  const [workspace, setWorkspace] = useState(null);
  const [step, setStep] = useState(0);
  const [targetId, setTargetId] = useState("");
  const [mode, setMode] = useState("dead");
  const [prediction, setPrediction] = useState("");
  const [score, setScore] = useState(null);

  const components = drillWs?.drill?.components || [];
  const edges = drillWs?.drill?.edges || [];
  const constraints = drillWs?.drill?.constraints || {};

  const result = useMemo(() => {
    if (!targetId || !mode || components.length === 0) return null;
    return injectFailure(constraints, components, edges, targetId, mode);
  }, [constraints, components, edges, targetId, mode]);

  const startDrill = () => {
    if (!drillWs) return;
    const ws = ensureFailureWorkspace(drillWs.id, drillWs.name);
    setWorkspace(ws);
    setStep(0);
    setTargetId(components[0]?.id || "");
    setMode("dead");
    setPrediction("");
    setScore(null);
  };

  const finishAttempt = () => {
    if (!workspace || !score) return;
    const attempt = {
      workspaceRef: drillWs.id,
      componentId: targetId,
      mode,
      prediction,
      score,
      completedAt: Date.now(),
    };
    const updated = updateWorkspace(workspace.id, {
      failure: {
        ...workspace.failure,
        currentAttempt: null,
        attempts: [...(workspace.failure?.attempts || []), attempt],
      },
    });
    if (updated) setWorkspace(updated);
    setStep(0);
    setPrediction("");
    setScore(null);
  };

  if (drillWorkspaces.length === 0) {
    return (
      <div className="stack">
        <section className="panel">
          <p className="eyebrow"><Flame size={13} /> Failure injection</p>
          <h2>No drill designs yet</h2>
          <p className="muted">
            Complete a drill case first — add components so there's something to break.
          </p>
        </section>
      </div>
    );
  }

  return (
    <div className="stack">
      <section className="panel">
        <p className="eyebrow"><Flame size={13} /> Failure injection</p>
        <h1>Kill a component. Predict the blast radius.</h1>
        <p className="muted">
          Pick a drill design, choose what breaks and how, predict the cascade,
          then reveal the simulated impact.
        </p>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Workspace</p>
            <h2>Choose a design to break</h2>
          </div>
        </div>
        <select
          value={selectedDrillId}
          onChange={(e) => setSelectedDrillId(e.target.value)}
          style={{ width: "100%", padding: "8px", marginBottom: "var(--space-3)" }}
        >
          {drillWorkspaces.map((w) => (
            <option key={w.id} value={w.id}>
              {w.name} ({w.drill?.components?.length || 0} components)
            </option>
          ))}
        </select>
        <button className="primary-cta" onClick={startDrill} disabled={!drillWs}>
          Start failure drill <Zap size={14} />
        </button>
      </section>

      {workspace && step === 0 && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Step 1 — Pick</p>
              <h2>What breaks, and how?</h2>
            </div>
          </div>
          <div style={{ display: "grid", gap: "var(--space-3)" }}>
            <div>
              <label className="eyebrow">Component</label>
              <select
                value={targetId}
                onChange={(e) => setTargetId(e.target.value)}
                style={{ width: "100%", padding: "8px" }}
              >
                {components.map((c) => (
                  <option key={c.id} value={c.id}>{c.name} ({c.paletteId})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="eyebrow">Failure mode</label>
              <div className="failure-modes">
                {FAILURE_MODES.map((fm) => (
                  <label key={fm.id} className={`failure-mode-card ${mode === fm.id ? "is-active" : ""}`}>
                    <input
                      type="radio"
                      name="failureMode"
                      value={fm.id}
                      checked={mode === fm.id}
                      onChange={() => setMode(fm.id)}
                    />
                    <strong>{fm.label}</strong>
                    <small>{fm.effect}</small>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="drill-step-footer">
            <span />
            <button className="primary-cta" onClick={() => setStep(1)}>
              Predict the cascade <ArrowRight size={14} />
            </button>
          </div>
        </section>
      )}

      {workspace && step === 1 && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Step 2 — Predict</p>
              <h2>Walk the cascade</h2>
            </div>
          </div>
          <p className="muted">
            Who notices first? What does the user see? What stops the bleeding?
          </p>
          <textarea
            value={prediction}
            onChange={(e) => setPrediction(e.target.value)}
            placeholder="The LB health check detects the dead API within 10s. Meanwhile, all requests to that shard 502. The user sees..."
            rows={6}
            style={{ width: "100%" }}
          />
          <div className="drill-step-footer">
            <button className="link-button" onClick={() => setStep(0)}>
              <ArrowLeft size={14} /> Back
            </button>
            <span className="muted">
              {prediction.trim().length < 40
                ? `${40 - prediction.trim().length} more chars needed`
                : "Ready to reveal"}
            </span>
            <button
              className="primary-cta"
              disabled={prediction.trim().length < 40}
              onClick={() => setStep(2)}
            >
              Reveal impact <ArrowRight size={14} />
            </button>
          </div>
        </section>
      )}

      {workspace && step === 2 && result && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Step 3 — Reveal</p>
              <h2>Simulated impact</h2>
            </div>
          </div>

          {result.impacts.length === 0 ? (
            <p className="muted">No downstream impact detected — design is resilient to this failure.</p>
          ) : (
            <ul className="impact-list">
              {result.impacts.map((imp, i) => (
                <li key={i} className={`impact-item impact-${imp.kind}`}>
                  <AlertTriangle size={14} />
                  <span>{imp.detail}</span>
                </li>
              ))}
            </ul>
          )}

          <table className="flow-table" style={{ marginTop: "var(--space-3)" }}>
            <thead>
              <tr><th>Component</th><th>Before QPS</th><th>After QPS</th><th>Status</th></tr>
            </thead>
            <tbody>
              {Object.entries(result.after.nodes).map(([id, node]) => {
                const prev = result.before.nodes[id];
                return (
                  <tr key={id}>
                    <td>{node.name}{id === targetId ? " ⚡" : ""}</td>
                    <td>{formatNumber(prev.qpsIn)}</td>
                    <td>{formatNumber(node.qpsIn)}</td>
                    <td><span className={`status-pill status-${node.status}`}>{node.status}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ marginTop: "var(--space-4)" }}>
            <p className="eyebrow">How close was your prediction?</p>
            <div className="button-row">
              {SCORE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  className={`chip ${score === opt.value ? `tone-${opt.tone}` : ""}`}
                  onClick={() => setScore(opt.value)}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="drill-step-footer">
            <button className="link-button" onClick={() => setStep(1)}>
              <ArrowLeft size={14} /> Back
            </button>
            <span />
            <button
              className="primary-cta"
              disabled={!score}
              onClick={finishAttempt}
            >
              Save & finish
            </button>
          </div>
        </section>
      )}

      {workspace && (workspace.failure?.attempts?.length || 0) > 0 && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">History</p>
              <h2>{workspace.failure.attempts.length} past attempt{workspace.failure.attempts.length === 1 ? "" : "s"}</h2>
            </div>
          </div>
          <ul className="today-workspace-list">
            {workspace.failure.attempts.map((a, i) => (
              <li key={i}>
                <span>{a.componentId} — {a.mode} — score {a.score}/4</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
