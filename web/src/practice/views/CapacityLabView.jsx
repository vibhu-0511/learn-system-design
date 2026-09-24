import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowRight,
  Calculator,
  CheckCircle2,
  ChevronDown,
  Database,
  DollarSign,
  Folder,
  Gauge,
  Layers,
  Network,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import {
  computeCapacity,
  DEFAULT_ASSUMPTIONS,
  formatGB,
  formatMbps,
  formatNumber,
  formatUSD,
  phasedComponents,
  simulateBottlenecks,
} from "../lib/capacity.js";
import { useWorkspaces } from "../data/workspaces.js";
import { getCase } from "../data/drillCases.js";
import { SourceNoteLink } from "../../library/SourceNoteLink.jsx";
import { benchmarkFor } from "../data/benchmarks.js";
import { SWAP_ALTERNATIVES, swapComponent } from "../lib/swapAlternatives.js";
import { lintDrill } from "../lib/drillLinter.js";
import { PALETTE_BY_ID } from "../data/drillCases.js";
import { simulateTraffic } from "../lib/trafficSim.js";

const SEVERITY_LABEL = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function CapacityLabView({
  activeWorkspaceId,
  onSelectWorkspace,
  onOpenNote,
  onJumpToTab,
}) {
  const { workspaces } = useWorkspaces();

  const drillWorkspaces = useMemo(
    () =>
      workspaces.filter(
        (w) => w.kind === "drill" && (w.drill?.components?.length || 0) > 0,
      ),
    [workspaces],
  );

  const activeWorkspace = useMemo(
    () => drillWorkspaces.find((w) => w.id === activeWorkspaceId) || null,
    [drillWorkspaces, activeWorkspaceId],
  );

  if (!activeWorkspace) {
    return (
      <CapacityPicker
        drillWorkspaces={drillWorkspaces}
        onSelectWorkspace={onSelectWorkspace}
        onJumpToTab={onJumpToTab}
      />
    );
  }

  return (
    <CapacityLab
      workspace={activeWorkspace}
      onExit={() => onSelectWorkspace(null)}
      onOpenNote={onOpenNote}
    />
  );
}

function CapacityPicker({ drillWorkspaces, onSelectWorkspace, onJumpToTab }) {
  return (
    <div className="stack">
      <section className="panel drill-hero">
        <div>
          <p className="eyebrow">
            <Calculator size={13} /> Capacity Lab
          </p>
          <h1>Pick a design. See what it costs and what breaks first.</h1>
          <p>
            Capacity numbers (storage, bandwidth, cost), a bottleneck
            simulator at 2× / 10× / 100× / 1000×, and a phased canvas of how
            the architecture must evolve. All driven by the typed design in
            your drill workspaces.
          </p>
          <p className="muted">
            Numbers are rough order-of-magnitude. The point is decision-grade,
            not procurement-grade.
          </p>
        </div>
        <div className="drill-hero-decor">
          <Gauge size={28} />
        </div>
      </section>

      {drillWorkspaces.length === 0 ? (
        <section className="panel">
          <div className="empty-state">
            <Folder size={24} />
            <p>
              No drill workspaces with components yet. Build a design in the
              Drill tab first.
            </p>
            <button
              className="primary-cta"
              onClick={() => onJumpToTab?.("drill")}
            >
              Open Drill <ArrowRight size={14} />
            </button>
          </div>
        </section>
      ) : (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Drill workspaces</p>
              <h2>Pick a design to analyse</h2>
            </div>
          </div>
          <ul className="capacity-workspace-list">
            {drillWorkspaces.map((w) => {
              const drillCase = getCase(w.caseId);
              const componentCount = w.drill?.components?.length || 0;
              const constraintCount = Object.values(
                w.drill?.constraints || {},
              ).filter(Boolean).length;
              return (
                <li key={w.id}>
                  <button onClick={() => onSelectWorkspace(w.id)}>
                    <Layers size={16} />
                    <div>
                      <strong>{w.name}</strong>
                      <small>
                        {drillCase?.difficulty || "drill"} ·{" "}
                        {constraintCount}/8 constraints · {componentCount}{" "}
                        components
                      </small>
                    </div>
                    <ArrowRight size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function CapacityLab({ workspace, onExit, onOpenNote }) {
  const drillCase = getCase(workspace.caseId);
  const constraints = workspace.drill?.constraints || {};
  const components = workspace.drill?.components || [];
  const edges = workspace.drill?.edges || [];

  const [assumptions, setAssumptions] = useState(DEFAULT_ASSUMPTIONS);

  const capacity = useMemo(
    () => computeCapacity(constraints, components, assumptions),
    [constraints, components, assumptions],
  );

  const bottlenecks = useMemo(
    () => simulateBottlenecks(constraints, components),
    [constraints, components],
  );

  const trafficFlow = useMemo(
    () => simulateTraffic(constraints, components, edges),
    [constraints, components, edges],
  );

  const phases = useMemo(
    () => phasedComponents(constraints, components),
    [constraints, components],
  );

  const setAssumption = (key, value) => {
    setAssumptions((prev) => ({ ...prev, [key]: value }));
  };

  const resetAssumptions = () => setAssumptions(DEFAULT_ASSUMPTIONS);

  return (
    <div className="stack">
      <section className="panel drill-wizard-header">
        <button className="link-button" onClick={onExit}>
          <Folder size={14} />
          Pick a different workspace
        </button>
        <p className="eyebrow">
          <Calculator size={13} /> Capacity Lab ·{" "}
          {drillCase?.difficulty || "drill"}
        </p>
        <h1>{workspace.name}</h1>
        <p className="muted">
          {drillCase?.blurb ||
            "Capacity, bottlenecks, and phased evolution for this design."}
        </p>
      </section>

      <CapacityCard
        capacity={capacity}
        assumptions={assumptions}
        onChange={setAssumption}
        onReset={resetAssumptions}
      />

      <TrafficFlowPanel flow={trafficFlow} hasEdges={edges.length > 0} />

      <BottleneckPanel bottlenecks={bottlenecks} onOpenNote={onOpenNote} />

      <SwapPanel constraints={constraints} components={components} />

      <PhasedCanvas phases={phases} />

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Component envelopes</p>
            <h2>What each box can take before it bends</h2>
          </div>
        </div>
        <ul className="benchmark-list">
          {components.map((c) => {
            const b = benchmarkFor(c.paletteId);
            if (!b) return null;
            return (
              <li key={c.id}>
                <strong>{c.name}</strong>
                <span>{b.maxQps === Infinity ? "scales out" : `~${b.maxQps.toLocaleString()} QPS`} · ~{b.p50LatencyMs}ms p50</span>
                <p className="muted">{b.note}</p>
                <SourceNoteLink path={b.citation} onOpenNote={onOpenNote} />
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}

function CapacityCard({ capacity, assumptions, onChange, onReset }) {
  return (
    <section className="panel capacity-section">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            <Activity size={13} /> Capacity numbers
          </p>
          <h2>Storage, bandwidth, and a rough cost band</h2>
        </div>
        <button className="link-button" onClick={onReset}>
          <RotateCcw size={14} /> Reset assumptions
        </button>
      </div>

      <div className="capacity-stats-grid">
        <Stat
          icon={<Database size={14} />}
          label="Storage / day"
          value={formatGB(capacity.storage.perDayGB)}
        />
        <Stat
          icon={<Database size={14} />}
          label="Storage / year"
          value={formatGB(capacity.storage.perYearGB)}
          sub={`with ${capacity.inputs.replicationFactor}× replication: ${formatGB(capacity.storage.withReplicationGB)}`}
        />
        <Stat
          icon={<Network size={14} />}
          label="Bandwidth in (peak)"
          value={formatMbps(capacity.bandwidth.inMbps)}
        />
        <Stat
          icon={<Network size={14} />}
          label="Bandwidth out (peak)"
          value={formatMbps(capacity.bandwidth.outMbps)}
          sub={`${formatGB(capacity.bandwidth.gbOutPerMonth)} egress / month`}
        />
        <Stat
          icon={<TrendingUp size={14} />}
          label="DB IOPS (peak est.)"
          value={formatNumber(capacity.db.iopsPeak)}
          sub={`assumes ${Math.round(capacity.inputs.cacheHitRate * 100)}% cache hit rate`}
        />
        <Stat
          icon={<DollarSign size={14} />}
          label="Monthly cost band"
          value={`${formatUSD(capacity.cost.monthlyLow)} – ${formatUSD(capacity.cost.monthlyHigh)}`}
          sub={`compute ≈ ${formatUSD(capacity.cost.breakdown.compute)} · egress ≈ ${formatUSD(capacity.cost.breakdown.bandwidth)}`}
        />
      </div>

      <details className="capacity-assumptions">
        <summary>
          <ChevronDown size={14} /> Adjust assumptions
        </summary>
        <div className="capacity-assumptions-grid">
          <NumberAssumption
            label="Avg payload (KB)"
            value={assumptions.avgPayloadKB}
            onChange={(v) => onChange("avgPayloadKB", v)}
            step={0.5}
          />
          <NumberAssumption
            label="Retention (days)"
            value={assumptions.retentionDays}
            onChange={(v) => onChange("retentionDays", v)}
            step={30}
          />
          <NumberAssumption
            label="Write amplification"
            value={assumptions.writeAmplification}
            onChange={(v) => onChange("writeAmplification", v)}
            step={0.5}
          />
          <NumberAssumption
            label="Read amplification"
            value={assumptions.readAmplification}
            onChange={(v) => onChange("readAmplification", v)}
            step={0.5}
          />
          <NumberAssumption
            label="Cache hit rate (0–1)"
            value={assumptions.cacheHitRate}
            onChange={(v) => onChange("cacheHitRate", v)}
            step={0.05}
            min={0}
            max={1}
          />
          <NumberAssumption
            label="Replication (high durability)"
            value={assumptions.replicationFactor}
            onChange={(v) => onChange("replicationFactor", v)}
            step={1}
          />
        </div>
      </details>
    </section>
  );
}

function Stat({ icon, label, value, sub }) {
  return (
    <div className="capacity-stat">
      <span className="capacity-stat-label">
        {icon} {label}
      </span>
      <strong>{value}</strong>
      {sub && <small className="muted">{sub}</small>}
    </div>
  );
}

function NumberAssumption({ label, value, onChange, step = 1, min, max }) {
  return (
    <label className="capacity-assumption">
      <span>{label}</span>
      <input
        type="number"
        value={value}
        step={step}
        min={min}
        max={max}
        onChange={(e) => {
          const v = parseFloat(e.target.value);
          if (Number.isFinite(v)) onChange(v);
        }}
      />
    </label>
  );
}

function TrafficFlowPanel({ flow, hasEdges }) {
  const nodes = Object.values(flow.nodes);
  if (nodes.length === 0) return null;
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow"><Activity size={13} /> Traffic flow</p>
          <h2>QPS propagation through the topology</h2>
        </div>
      </div>
      {!hasEdges && (
        <p className="muted">
          No wiring yet — open the drill's Components step to connect boxes;
          simulating flat fan-out for now.
        </p>
      )}
      {flow.hasCycle && (
        <p className="reader-error">Wiring has a cycle — flow shown is partial.</p>
      )}
      <table className="flow-table">
        <thead>
          <tr><th>Component</th><th>QPS in</th><th>Capacity</th><th>Utilization</th><th>Status</th></tr>
        </thead>
        <tbody>
          {nodes.map((n) => (
            <tr key={n.name + n.paletteId}>
              <td>{n.name}</td>
              <td>{formatNumber(n.qpsIn)}</td>
              <td>{n.capacity === Infinity ? "∞" : formatNumber(n.capacity)}</td>
              <td>
                <div className="axis-bar" style={{ "--pct": `${Math.min(n.utilization * 100, 100)}%` }}>
                  <div className="axis-fill" style={{ background: n.utilization > 1 ? "var(--red, #dc2626)" : n.utilization > 0.7 ? "var(--amber, #d97706)" : "var(--green, #16a34a)" }} />
                </div>
              </td>
              <td><span className={`status-pill status-${n.status}`}>{n.status}</span></td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

function BottleneckPanel({ bottlenecks, onOpenNote }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            <Sparkles size={13} /> Bottleneck simulator
          </p>
          <h2>What breaks next at 2× / 10× / 100× / 1000×</h2>
        </div>
      </div>

      <div className="capacity-bottleneck-grid">
        {bottlenecks.map((row) => (
          <BottleneckCard
            key={row.multiplier}
            row={row}
            onOpenNote={onOpenNote}
          />
        ))}
      </div>
    </section>
  );
}

function BottleneckCard({ row, onOpenNote }) {
  const { multiplier, scaledQpsRead, scaledQpsWrite, breaks } = row;
  return (
    <article className={`capacity-bottleneck-card multiplier-${multiplier}`}>
      <header>
        <strong>{multiplier}× scale</strong>
        <small className="muted">
          {formatNumber(scaledQpsRead)} read · {formatNumber(scaledQpsWrite)}{" "}
          write QPS
        </small>
      </header>

      {breaks.length === 0 ? (
        <div className="capacity-bottleneck-clean">
          <CheckCircle2 size={16} />
          <span>No new bottleneck at this scale.</span>
        </div>
      ) : (
        <ul className="capacity-bottleneck-breaks">
          {breaks.map((b, idx) => (
            <li
              key={`${b.title}-${idx}`}
              className={`capacity-break severity-${b.severity || "medium"}`}
            >
              <div className="capacity-break-header">
                <span className={`severity ${b.severity || "medium"}`}>
                  {SEVERITY_LABEL[b.severity || "medium"]}
                </span>
                <strong>{b.title}</strong>
              </div>
              <p>{b.detail}</p>
              {b.suggestedFix && (
                <p className="muted">
                  <em>{b.suggestedFix}</em>
                </p>
              )}
              <div className="term-source-notes">
                {(b.citations || []).map((p) => (
                  <SourceNoteLink
                    key={p}
                    path={p}
                    onOpenNote={onOpenNote}
                  />
                ))}
                {(b.outageRefs || [])
                  .filter((p) => !(b.citations || []).includes(p))
                  .map((p) => (
                    <SourceNoteLink
                      key={p}
                      path={p}
                      onOpenNote={onOpenNote}
                    />
                  ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function SwapPanel({ constraints, components }) {
  const swappable = components.filter((c) => SWAP_ALTERNATIVES[c.paletteId]);
  const [selectedId, setSelectedId] = useState(swappable[0]?.id || "");
  const selected = components.find((c) => c.id === selectedId);
  const alternatives = selected ? SWAP_ALTERNATIVES[selected.paletteId] || [] : [];
  const [altPalette, setAltPalette] = useState(alternatives[0] || "");

  useEffect(() => {
    if (swappable.length && !swappable.find((c) => c.id === selectedId)) {
      setSelectedId(swappable[0]?.id || "");
    }
  }, [swappable, selectedId]);

  useEffect(() => {
    if (alternatives.length && !alternatives.includes(altPalette)) {
      setAltPalette(alternatives[0] || "");
    }
  }, [alternatives, altPalette]);

  if (swappable.length === 0) return null;

  const swapped = altPalette && selected
    ? swapComponent(components, selectedId, altPalette, PALETTE_BY_ID)
    : components;

  const baseBreaks = simulateBottlenecks(constraints, components).reduce((n, r) => n + r.breaks.length, 0);
  const swapBreaks = simulateBottlenecks(constraints, swapped).reduce((n, r) => n + r.breaks.length, 0);
  const baseLint = lintDrill({ constraints, components, rubric: {} }).length;
  const swapLint = lintDrill({ constraints, components: swapped, rubric: {} }).length;
  const baseCap = computeCapacity(constraints, components, DEFAULT_ASSUMPTIONS);
  const swapCap = computeCapacity(constraints, swapped, DEFAULT_ASSUMPTIONS);

  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Component swap</p>
          <h2>What if you swapped one box?</h2>
        </div>
      </div>
      <div className="button-row">
        <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)}>
          {swappable.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.paletteId})</option>)}
        </select>
        <span>→</span>
        <select value={altPalette} onChange={(e) => setAltPalette(e.target.value)}>
          {alternatives.map((p) => <option key={p} value={p}>{PALETTE_BY_ID[p]?.name || p}</option>)}
        </select>
      </div>
      <div className="swap-grid">
        <div className={`swap-col ${baseBreaks <= swapBreaks ? "is-better" : ""}`}>
          <strong>Current</strong>
          <p>Bottleneck breaks: {baseBreaks}</p>
          <p>Lint findings: {baseLint}</p>
          <p>Cost band: {formatUSD(baseCap.cost.lowerUSD)}–{formatUSD(baseCap.cost.upperUSD)}/mo</p>
        </div>
        <div className={`swap-col ${swapBreaks < baseBreaks ? "is-better" : ""}`}>
          <strong>With {PALETTE_BY_ID[altPalette]?.name || altPalette}</strong>
          <p>Bottleneck breaks: {swapBreaks}</p>
          <p>Lint findings: {swapLint}</p>
          <p>Cost band: {formatUSD(swapCap.cost.lowerUSD)}–{formatUSD(swapCap.cost.upperUSD)}/mo</p>
        </div>
      </div>
    </section>
  );
}

function PhasedCanvas({ phases }) {
  return (
    <section className="panel">
      <div className="section-heading">
        <div>
          <p className="eyebrow">
            <Layers size={13} /> Phased canvas
          </p>
          <h2>How the architecture must evolve</h2>
        </div>
      </div>
      <p className="muted capacity-phased-intro">
        Read left to right. Each column shows the stack at that scale and the
        components that get added vs the previous phase.
      </p>

      <div className="capacity-phased-grid">
        {phases.map((p) => (
          <PhaseColumn key={p.phase} phase={p} />
        ))}
      </div>
    </section>
  );
}

function PhaseColumn({ phase }) {
  const addedIds = new Set(phase.additions.map((a) => a.id));
  return (
    <article className={`capacity-phase phase-${phase.phase}`}>
      <header>
        <strong>{phase.label}</strong>
        <small className="muted">{phase.traffic}</small>
      </header>
      <ul className="capacity-phase-stack">
        {phase.stack.map((c) => (
          <li
            key={c.id}
            className={addedIds.has(c.id) ? "is-new" : ""}
            title={addedIds.has(c.id) ? "Added at this phase" : ""}
          >
            <span>{c.name}</span>
          </li>
        ))}
        {phase.stack.length === 0 && (
          <li className="muted">
            <span>(empty)</span>
          </li>
        )}
      </ul>
      {phase.additions.length > 0 && (
        <div className="capacity-phase-additions">
          <p className="eyebrow">Why these are added</p>
          <ul>
            {phase.additions.map((a) => (
              <li key={a.id}>
                <strong>{a.name}</strong>
                <span>{a.why}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      <p className="muted capacity-phase-rationale">{phase.rationale}</p>
    </article>
  );
}
