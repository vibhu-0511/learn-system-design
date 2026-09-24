import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  Plus,
  Trash2,
  X,
  Zap,
  Timer,
} from "lucide-react";
import {
  COMPONENT_PALETTE,
  COMPONENT_CATEGORIES,
  DRILL_RUBRIC,
  PALETTE_BY_ID,
  getCase,
} from "../data/drillCases.js";
import { lintDrill, diffComponents } from "../lib/drillLinter.js";
import { scoreDrill } from "../lib/drillScore.js";
import { useCountdown, formatRemaining } from "../lib/useCountdown.js";
import { KATA_TWISTS } from "../data/kataTwists.js";
import {
  ensureDrillWorkspace,
  updateWorkspace,
  deleteWorkspace,
  findDrillWorkspace,
} from "../data/workspaces.js";
import { SourceNoteLink } from "../../library/SourceNoteLink.jsx";
import { NoteReader } from "../../library/NoteReader.jsx";
import { SketchPanel } from "./SketchPanel.jsx";
import { AiReviewPanel } from "./AiReviewPanel.jsx";

const STEP_LABELS = ["Constraints", "Entities & API", "Components", "Deep dive", "Review"];

const CONSISTENCY_OPTIONS = [
  { value: "strong", label: "Strong (linearizable, ACID)" },
  { value: "eventual", label: "Eventual (BASE-OK, lag tolerated)" },
];

const DURABILITY_OPTIONS = [
  { value: "high", label: "High (no data loss; replicated, durable)" },
  { value: "medium", label: "Medium (single-AZ replication is OK)" },
  { value: "low", label: "Low (cache/throwaway data)" },
];

const COST_OPTIONS = [
  { value: "low", label: "Low (startup, free tier)" },
  { value: "medium", label: "Medium (early stage)" },
  { value: "high", label: "High (enterprise)" },
];

const GROWTH_OPTIONS = [
  { value: "stable", label: "Stable (no growth assumed)" },
  { value: "2x", label: "2× over 12 months" },
  { value: "10x", label: "10× over 12 months" },
  { value: "100x", label: "100× over 12 months" },
];

const SEVERITY_LABEL = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

const EMPTY_DRILL = {
  constraints: {
    qpsRead: "",
    qpsWrite: "",
    latencyP95: "",
    consistency: "",
    durability: "",
    cost: "",
    team: "",
    growth: "",
  },
  entities: "",
  api: "",
  components: [],
  deepDive: { failure: "", scale: "" },
  edges: [],
  rubric: {},
  step: 0,
};

export function DrillWizard({ caseId, onExit, onOpenNote, theme }) {
  const drillCase = getCase(caseId);
  const [workspace, setWorkspace] = useState(() => {
    if (!drillCase) return null;
    return ensureDrillWorkspace(caseId);
  });

  // If the workspace was deleted elsewhere (e.g., by a Reset), refresh.
  useEffect(() => {
    if (!drillCase) return;
    if (!workspace || workspace.kind !== "drill" || workspace.caseId !== caseId) {
      const existing = findDrillWorkspace(caseId);
      setWorkspace(existing ?? ensureDrillWorkspace(caseId));
    }
  }, [caseId, drillCase, workspace]);

  const drill = { ...EMPTY_DRILL, ...(workspace?.drill || {}) };
  const completedAt = workspace?.completedAt || null;
  const step = drill.step ?? 0;

  const persist = (drillPatch, extra = {}) => {
    if (!workspace) return;
    const updated = updateWorkspace(workspace.id, {
      drill: { ...drill, ...drillPatch },
      ...extra,
    });
    if (updated) setWorkspace(updated);
  };

  // Maintain the same "state-shaped" view for downstream components.
  const state = {
    constraints: drill.constraints,
    components: drill.components,
    rubric: drill.rubric,
    step,
    completedAt,
  };

  if (!drillCase) {
    return (
      <div className="stack">
        <section className="panel">
          <p className="eyebrow">Case not found</p>
          <h2>Unknown drill case: {caseId}</h2>
          <button className="link-button" onClick={onExit}>
            ← Back to drill cases
          </button>
        </section>
      </div>
    );
  }

  const setStep = (next) => persist({ step: next });

  const updateConstraints = (patch) =>
    persist({ constraints: { ...drill.constraints, ...patch } });

  const addComponent = (paletteId) => {
    const palette = PALETTE_BY_ID[paletteId];
    if (!palette) return;
    const id = `${paletteId}-${Date.now().toString(36)}`;
    persist({
      components: [
        ...drill.components,
        { id, paletteId, name: palette.name, justification: "" },
      ],
    });
  };

  const removeComponent = (id) =>
    persist({
      components: drill.components.filter((c) => c.id !== id),
      edges: (drill.edges || []).filter((e) => e.from !== id && e.to !== id),
    });

  const updateComponent = (id, patch) =>
    persist({
      components: drill.components.map((c) =>
        c.id === id ? { ...c, ...patch } : c,
      ),
    });

  const toggleRubric = (rubricId) =>
    persist({
      rubric: { ...drill.rubric, [rubricId]: !drill.rubric?.[rubricId] },
    });

  const kataTwist = drill.kata?.twistId
    ? KATA_TWISTS.find((t) => t.id === drill.kata.twistId) || null
    : null;

  const toggleInterview = () => {
    if (drill.interview) {
      persist({ interview: null });
    } else {
      persist({ interview: { startedAt: Date.now(), durationMin: 45 } });
    }
  };

  const deadline = drill.interview ? drill.interview.startedAt + drill.interview.durationMin * 60000 : null;
  const remaining = useCountdown(deadline);

  useEffect(() => {
    if (deadline && remaining === 0 && step < 4) {
      setStep(4);
    }
  }, [remaining, deadline, step]);

  const timerTone = remaining > 15 * 60000 ? "tone-success" : remaining > 5 * 60000 ? "tone-warning" : "tone-danger";

  const toggleKata = () => {
    if (kataTwist) {
      persist({ kata: null });
    } else {
      const twist = KATA_TWISTS[Math.floor(Math.random() * KATA_TWISTS.length)];
      persist({ kata: { twistId: twist.id, adr: "" } });
    }
  };

  const useSuggestedConstraints = () => {
    let c = { ...drillCase.suggestedConstraints };
    if (kataTwist) c = kataTwist.mutate(c);
    persist({ constraints: c });
  };

  const markComplete = () => {
    if (!workspace) return;
    const updated = updateWorkspace(workspace.id, {
      completedAt: new Date().toISOString(),
    });
    if (updated) setWorkspace(updated);
  };

  const resetCase = () => {
    if (!confirm("Reset this drill? Constraints, components, and rubric will be cleared. The workspace will be deleted.")) return;
    if (workspace) deleteWorkspace(workspace.id);
    onExit?.();
  };

  return (
    <div className="stack drill-wizard">
      <section className="panel drill-wizard-header">
        <button className="lesson-back" onClick={onExit}>
          <ArrowLeft size={14} />
          Back to drill cases
        </button>
        <p className="eyebrow">
          Greenfield Drill · {drillCase.difficulty}
        </p>
        <h1>{drillCase.title}</h1>
        <p>{drillCase.prompt}</p>
        <div className="button-row">
          <button className={kataTwist ? "is-active" : ""} onClick={toggleKata}>
            <Zap size={14} /> {kataTwist ? "Kata ON" : "Kata mode"}
          </button>
          <button className={drill.interview ? "is-active" : ""} onClick={toggleInterview}>
            <Timer size={14} /> {drill.interview ? "Interview ON" : "Interview mode"}
          </button>
          {drill.interview && (
            <span className={`timer-pill ${timerTone}`}>
              <Timer size={13} />
              {remaining > 0 ? formatRemaining(remaining) : "Time!"}
            </span>
          )}
        </div>
        {kataTwist && (
          <div className="kata-banner">
            <Zap size={14} />
            <div>
              <strong>Kata twist: {kataTwist.label}</strong>
              <p>{kataTwist.description}</p>
            </div>
          </div>
        )}
        <Stepper step={step} onJump={setStep} />
      </section>

      {step === 0 && (
        <ConstraintsStep
          drillCase={drillCase}
          constraints={state.constraints}
          onChange={updateConstraints}
          onUseSuggested={useSuggestedConstraints}
          onNext={() => setStep(1)}
        />
      )}

      {step === 1 && (
        <EntitiesStep
          drill={drill}
          onChange={(patch) => persist(patch)}
          onBack={() => setStep(0)}
          onNext={() => setStep(2)}
        />
      )}

      {step === 2 && (
        <ComponentsStep
          drillCase={drillCase}
          components={state.components || []}
          edges={drill.edges || []}
          sketch={drill.sketch}
          theme={theme}
          onAdd={addComponent}
          onRemove={removeComponent}
          onUpdate={updateComponent}
          onEdgesChange={(edges) => persist({ edges })}
          onSaveSketch={(sketch) => persist({ sketch })}
          onBack={() => setStep(1)}
          onNext={() => setStep(3)}
        />
      )}

      {step === 3 && (
        <DeepDiveStep
          drill={drill}
          onChange={(patch) => persist(patch)}
          onBack={() => setStep(2)}
          onNext={() => setStep(4)}
        />
      )}

      {step === 4 && (
        <ReviewStep
          drillCase={drillCase}
          state={state}
          onToggleRubric={toggleRubric}
          onMarkComplete={markComplete}
          onBack={() => setStep(3)}
          onReset={resetCase}
          onOpenNote={onOpenNote}
          theme={theme}
          kata={drill.kata || null}
          onUpdateKataAdr={(adr) => persist({ kata: { ...drill.kata, adr } })}
          drill={drill}
        />
      )}
    </div>
  );
}

function Stepper({ step, onJump }) {
  return (
    <div className="drill-stepper">
      {STEP_LABELS.map((label, i) => (
        <button
          key={label}
          className={`drill-stepper-item ${step === i ? "is-active" : ""} ${step > i ? "is-done" : ""}`}
          onClick={() => onJump(i)}
        >
          <span className="drill-stepper-num">
            {step > i ? <Check size={14} /> : i + 1}
          </span>
          <span>{label}</span>
          {i < STEP_LABELS.length - 1 && <ChevronRight size={14} className="drill-stepper-chev" />}
        </button>
      ))}
    </div>
  );
}

function EntitiesStep({ drill, onChange, onBack, onNext }) {
  const okEntities = (drill.entities || "").trim().length >= 40;
  const okApi = (drill.api || "").trim().length >= 40;
  return (
    <section className="panel drill-step">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Step 2</p>
          <h2>Name the entities. Sketch the API.</h2>
        </div>
      </div>
      <p className="muted">
        Before boxes: what data exists, and what operations touch it? This is
        the step interviewers say candidates skip most.
      </p>
      <label className="field-label">
        Core entities (one per line: name — key fields — owner of truth)
        <textarea rows={5} value={drill.entities || ""} onChange={(e) => onChange({ entities: e.target.value })}
          placeholder={"User — id, email — Users DB\nShortLink — code, longUrl, ownerId — Links DB\nClickEvent — code, ts, ua — analytics store (derived)"} />
      </label>
      <label className="field-label">
        API sketch (method path → behavior, one per line)
        <textarea rows={5} value={drill.api || ""} onChange={(e) => onChange({ api: e.target.value })}
          placeholder={"POST /links {longUrl} → 201 {code}\nGET /{code} → 302 Location: longUrl\nGET /links/{code}/stats → 200 {clicks}"} />
      </label>
      <div className="drill-step-footer">
        <button className="link-button" onClick={onBack}><ArrowLeft size={14} /> Back</button>
        <span className={`muted ${okEntities && okApi ? "is-ok" : ""}`}>
          {okEntities && okApi ? "Entities and API stated." : "Both boxes need real content (≥40 chars each)."}
        </span>
        <button className="primary-cta" disabled={!okEntities || !okApi} onClick={onNext}>
          Continue to Components <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}

function DeepDiveStep({ drill, onChange, onBack, onNext }) {
  const dd = drill.deepDive || { failure: "", scale: "" };
  const okFailure = (dd.failure || "").trim().length >= 60;
  const okScale = (dd.scale || "").trim().length >= 60;
  return (
    <section className="panel drill-step">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Step 4</p>
          <h2>Deep dive — failure and scale.</h2>
        </div>
      </div>
      <label className="field-label">
        Failure analysis — pick your most critical component. Walk what users see when it is slow, dead, and partitioned — and what limits the blast radius.
        <textarea rows={6} value={dd.failure} onChange={(e) => onChange({ deepDive: { ...dd, failure: e.target.value } })}
          placeholder="If the database goes down, writes queue in the message broker for up to 5 minutes..." />
      </label>
      <label className="field-label">
        Scale plan — traffic is 10× tomorrow morning. What breaks first, how do you know (which metric), and what is the first fix?
        <textarea rows={6} value={dd.scale} onChange={(e) => onChange({ deepDive: { ...dd, scale: e.target.value } })}
          placeholder="The API servers hit CPU saturation first (p95 latency crosses SLO). Horizontal scale behind the LB..." />
      </label>
      <div className="drill-step-footer">
        <button className="link-button" onClick={onBack}><ArrowLeft size={14} /> Back to components</button>
        <span className={`muted ${okFailure && okScale ? "is-ok" : ""}`}>
          {okFailure && okScale ? "Deep dive complete." : "Each answer needs ≥60 chars."}
        </span>
        <button className="primary-cta" disabled={!okFailure || !okScale} onClick={onNext}>
          Continue to Review <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}

function ConstraintsStep({
  drillCase,
  constraints,
  onChange,
  onUseSuggested,
  onNext,
}) {
  const allFilled = [
    "qpsRead",
    "qpsWrite",
    "latencyP95",
    "consistency",
    "durability",
    "cost",
    "team",
    "growth",
  ].every((key) => constraints[key] && String(constraints[key]).trim());

  return (
    <section className="panel drill-step">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Step 1</p>
          <h2>State the constraints first.</h2>
        </div>
        <button className="link-button" onClick={onUseSuggested}>
          Use suggested values for this case →
        </button>
      </div>
      <p className="muted">
        Even guessed numbers beat blanks. Real architects refuse to draw boxes
        before this step.
      </p>

      <div className="constraints-grid">
        <NumberField
          label="Read QPS (peak)"
          value={constraints.qpsRead}
          onChange={(v) => onChange({ qpsRead: v })}
          hint="Estimate. Peak ~3× average for diurnal traffic."
        />
        <NumberField
          label="Write QPS (peak)"
          value={constraints.qpsWrite}
          onChange={(v) => onChange({ qpsWrite: v })}
          hint="Often 10–100× lower than reads."
        />
        <NumberField
          label="p95 latency target (ms)"
          value={constraints.latencyP95}
          onChange={(v) => onChange({ latencyP95: v })}
          hint="What users tolerate. Web < 300ms typical."
        />
        <NumberField
          label="Team size (engineers)"
          value={constraints.team}
          onChange={(v) => onChange({ team: v })}
          hint="Includes on-call rotation."
        />
        <SelectField
          label="Consistency tier"
          value={constraints.consistency}
          onChange={(v) => onChange({ consistency: v })}
          options={CONSISTENCY_OPTIONS}
        />
        <SelectField
          label="Durability tier"
          value={constraints.durability}
          onChange={(v) => onChange({ durability: v })}
          options={DURABILITY_OPTIONS}
        />
        <SelectField
          label="Cost ceiling"
          value={constraints.cost}
          onChange={(v) => onChange({ cost: v })}
          options={COST_OPTIONS}
        />
        <SelectField
          label="Growth (12 months)"
          value={constraints.growth}
          onChange={(v) => onChange({ growth: v })}
          options={GROWTH_OPTIONS}
        />
      </div>

      <div className="drill-step-footer">
        <span className={`muted ${allFilled ? "is-ok" : ""}`}>
          {allFilled
            ? "All constraints stated. Ready for entities and API."
            : "Fill all eight fields to continue."}
        </span>
        <button
          className="primary-cta"
          disabled={!allFilled}
          onClick={onNext}
        >
          Continue to Entities & API <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}

function NumberField({ label, value, onChange, hint }) {
  return (
    <label className="field-label">
      {label}
      <input
        type="text"
        inputMode="numeric"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
        placeholder="e.g. 1000"
      />
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="field-label">
      {label}
      <select
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">— pick one —</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function ComponentsStep({
  drillCase,
  components,
  edges,
  sketch,
  theme,
  onAdd,
  onRemove,
  onUpdate,
  onEdgesChange,
  onSaveSketch,
  onBack,
  onNext,
}) {
  const allJustified =
    components.length > 0 &&
    components.every((c) => (c.justification || "").trim().length >= 12);

  return (
    <section className="panel drill-step">
      <div className="section-heading">
        <div>
          <p className="eyebrow">Step 3</p>
          <h2>Pick components. Defend each one.</h2>
        </div>
      </div>
      <p className="muted">
        Click to add. For every component, write one sentence: what bottleneck
        or risk does this remove? Empty justification = wrong box.
      </p>

      <div className="components-layout">
        <aside className="component-palette">
          <p className="eyebrow">Palette</p>
          {COMPONENT_CATEGORIES.map((category) => (
            <div key={category} className="palette-category">
              <h4>{category}</h4>
              {COMPONENT_PALETTE.filter((c) => c.category === category).map(
                (c) => (
                  <button
                    key={c.id}
                    className="palette-item"
                    onClick={() => onAdd(c.id)}
                    title={c.what}
                  >
                    <Plus size={12} />
                    <span>{c.name}</span>
                  </button>
                ),
              )}
            </div>
          ))}
        </aside>

        <div className="chosen-components">
          <p className="eyebrow">Your design ({components.length})</p>
          {components.length === 0 ? (
            <div className="empty-state">
              <p>No components yet. Pick from the palette on the left.</p>
            </div>
          ) : (
            <div className="chosen-list">
              {components.map((c) => {
                const palette = PALETTE_BY_ID[c.paletteId];
                const justLength = (c.justification || "").trim().length;
                return (
                  <article
                    key={c.id}
                    className={`chosen-item ${justLength < 12 ? "needs-justification" : ""}`}
                  >
                    <header>
                      <div>
                        <strong>{c.name}</strong>
                        {palette && <small>{palette.what}</small>}
                      </div>
                      <button
                        className="icon-button"
                        onClick={() => onRemove(c.id)}
                        title="Remove"
                      >
                        <Trash2 size={14} />
                      </button>
                    </header>
                    <textarea
                      value={c.justification}
                      onChange={(event) =>
                        onUpdate(c.id, { justification: event.target.value })
                      }
                      placeholder="What bottleneck or risk does this remove? Reference a constraint."
                    />
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {components.length >= 2 && (
        <div className="wiring-section">
          <p className="eyebrow">Wiring</p>
          <p className="muted">Connect boxes. Client is the implicit entry point.</p>
          {edges.map((e) => (
            <div key={e.id} className="wiring-row">
              <select
                value={e.from}
                onChange={(ev) =>
                  onEdgesChange(edges.map((x) => (x.id === e.id ? { ...x, from: ev.target.value } : x)))
                }
              >
                <option value="client">Client</option>
                {components.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <span>→</span>
              <select
                value={e.to}
                onChange={(ev) =>
                  onEdgesChange(edges.map((x) => (x.id === e.id ? { ...x, to: ev.target.value } : x)))
                }
              >
                {components.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <button
                className="icon-button"
                onClick={() => onEdgesChange(edges.filter((x) => x.id !== e.id))}
                title="Remove"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
          <button
            className="link-button"
            onClick={() =>
              onEdgesChange([
                ...edges,
                { id: `e-${Date.now().toString(36)}`, from: "client", to: components[0].id },
              ])
            }
          >
            + Add connection
          </button>
        </div>
      )}

      <SketchPanel sketch={sketch} onSave={onSaveSketch} theme={theme} />

      <div className="drill-step-footer">
        <button className="link-button" onClick={onBack}>
          <ArrowLeft size={14} /> Back to entities & API
        </button>
        <span className={`muted ${allJustified ? "is-ok" : ""}`}>
          {components.length === 0
            ? "Add at least one component."
            : allJustified
              ? "All components justified. Ready for the deep dive."
              : "Each component needs at least a 12-char justification."}
        </span>
        <button
          className="primary-cta"
          disabled={!allJustified}
          onClick={onNext}
        >
          Continue to Deep dive <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}

function ReviewStep({
  drillCase,
  state,
  onToggleRubric,
  onMarkComplete,
  onBack,
  onReset,
  onOpenNote,
  theme,
  kata,
  onUpdateKataAdr,
  drill,
}) {
  const score = useMemo(
    () => scoreDrill(state, drillCase.expectedComponents || []),
    [state, drillCase.expectedComponents],
  );
  const findings = useMemo(() => lintDrill(state), [state]);
  const componentDiff = useMemo(
    () =>
      diffComponents(
        (state.components || []).map((c) => c.paletteId),
        drillCase.expectedComponents || [],
      ),
    [state.components, drillCase.expectedComponents],
  );

  const findingsBySeverity = {
    high: findings.filter((f) => f.severity === "high"),
    medium: findings.filter((f) => f.severity === "medium"),
    low: findings.filter((f) => f.severity === "low"),
  };

  const rubricChecked = DRILL_RUBRIC.filter(
    (item) => state.rubric?.[item.id],
  ).length;

  return (
    <section className="drill-step drill-review-grid">
      <div className="panel drill-score-panel">
        <div className="drill-score-total">
          <span className="eyebrow">Design score</span>
          <strong>{score.total}</strong>
          <span className={`verdict-pill verdict-${score.verdict.replace(/\s+/g, "-").toLowerCase()}`}>
            {score.verdict}
          </span>
        </div>
        <div className="drill-score-axes">
          {Object.entries(score.axes).map(([axis, value]) => (
            <div key={axis} className="drill-score-axis">
              <span>{axis === "tradeoffs" ? "trade-offs" : axis}</span>
              <div className="axis-bar"><i style={{ width: `${value}%` }} /></div>
              <small>{value}</small>
            </div>
          ))}
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Step 5 · Review</p>
            <h2>Lint findings ({findings.length})</h2>
          </div>
          {findings.length === 0 && (
            <span className="status-pill completed">Clean</span>
          )}
        </div>
        {findings.length === 0 ? (
          <p className="muted">
            No lint findings. That's rare — go back through and stress-test.
            What about failure modes? Trade-offs you didn't pick?
          </p>
        ) : (
          <div className="findings-list">
            {findings.map((f) => (
              <article key={f.id} className={`finding-card severity-${f.severity}`}>
                <header>
                  <span className={`severity-pill ${f.severity}`}>
                    {SEVERITY_LABEL[f.severity]}
                  </span>
                  <h3>{f.title}</h3>
                </header>
                <p>{f.detail}</p>
                <div className="finding-fix">
                  <strong>Fix:</strong> {f.suggestedFix}
                </div>
                {f.citations?.length > 0 && (
                  <div className="finding-citations">
                    <small>From your vault:</small>
                    {f.citations.map((path) => (
                      <SourceNoteLink
                        key={path}
                        path={path}
                        onOpenNote={onOpenNote}
                      />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Component diff</p>
            <h2>vs. case-study reference</h2>
          </div>
        </div>
        <div className="component-diff">
          <DiffSection
            label="You covered"
            ids={componentDiff.covered}
            tone="ok"
            empty="None of the expected components matched."
          />
          <DiffSection
            label="You missed"
            ids={componentDiff.missed}
            tone="warn"
            empty="No misses — every expected component is in your design."
          />
          <DiffSection
            label="You added (not in reference)"
            ids={componentDiff.extra}
            tone="info"
            empty="No extras."
          />
        </div>
        <p className="muted">
          The reference is one valid design, not the only one. Extras may be
          right; misses may be intentional. Use this as a discussion prompt.
        </p>
        {drillCase.keyInsights?.length > 0 && (
          <div className="key-insights">
            <p className="eyebrow">Key insights from the reference</p>
            <ul>
              {drillCase.keyInsights.map((insight) => (
                <li key={insight}>
                  <Eye size={13} /> {insight}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Self-rubric ({rubricChecked} / {DRILL_RUBRIC.length})</p>
            <h2>Honest check.</h2>
          </div>
        </div>
        <p className="muted">
          Tick only the ones you actually did, not the ones that sound good.
          Skipped checkboxes are signals for what to practice next.
        </p>
        <ul className="rubric-list">
          {DRILL_RUBRIC.map((item) => {
            const checked = !!state.rubric?.[item.id];
            return (
              <li key={item.id}>
                <label>
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() => onToggleRubric(item.id)}
                  />
                  <span>{item.label}</span>
                </label>
              </li>
            );
          })}
        </ul>

        {(drill?.deepDive?.failure || drill?.deepDive?.scale) && (
          <div className="panel" style={{ background: "var(--soft)" }}>
            <p className="eyebrow">Your deep dive</p>
            {drill.deepDive.failure && <><strong>Failure analysis</strong><p style={{ whiteSpace: "pre-wrap" }}>{drill.deepDive.failure}</p></>}
            {drill.deepDive.scale && <><strong>Scale plan</strong><p style={{ whiteSpace: "pre-wrap" }}>{drill.deepDive.scale}</p></>}
          </div>
        )}

        {kata && (
          <label className="field-label">
            ADR — defend how your design absorbs the twist (min 200 chars)
            <textarea
              rows={8}
              value={kata.adr || ""}
              onChange={(e) => onUpdateKataAdr(e.target.value)}
              placeholder={"Context:\nDecision:\nAlternatives considered:\nConsequences / what we give up:\nRevisit when:"}
            />
          </label>
        )}

        <div className="drill-step-footer">
          <button className="link-button" onClick={onBack}>
            <ArrowLeft size={14} /> Back to components
          </button>
          <button className="link-button" onClick={onReset}>
            <X size={14} /> Reset drill
          </button>
          <button
            className="primary-cta"
            onClick={onMarkComplete}
            disabled={!!state.completedAt || (kata && (kata.adr || "").length < 200)}
          >
            <CheckCircle2 size={14} />
            {state.completedAt ? "Drill marked complete" : "Mark drill complete"}
          </button>
        </div>
      </div>

      <div className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">AI second opinion</p>
            <h2>Optional — bring your own LLM key</h2>
          </div>
        </div>
        <AiReviewPanel drill={drill} />
      </div>

      <div className="panel reference-panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Reference case study</p>
            <h2>How your vault answers this case</h2>
          </div>
        </div>
        <NoteReader
          notePath={drillCase.refCasePath}
          theme={theme}
          onOpenNote={onOpenNote}
        />
      </div>
    </section>
  );
}

function DiffSection({ label, ids, tone, empty }) {
  return (
    <div className={`diff-section diff-${tone}`}>
      <strong>{label}</strong>
      {ids.length === 0 ? (
        <span className="muted">{empty}</span>
      ) : (
        <ul>
          {ids.map((id) => {
            const palette = PALETTE_BY_ID[id];
            return (
              <li key={id}>
                {tone === "ok" && <Check size={12} />}
                {tone === "warn" && <AlertTriangle size={12} />}
                {tone === "info" && <Plus size={12} />}
                {palette ? palette.name : id}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
