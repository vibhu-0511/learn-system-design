import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Bug,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Target,
  XCircle,
} from "lucide-react";
import { BUG_SCENARIOS, getBugScenario } from "../data/bugScenarios.js";
import { lintDrill } from "../lib/drillLinter.js";
import {
  ensureBugFinderWorkspace,
  findBugFinderWorkspace,
  statusOf,
  updateWorkspace,
  useWorkspaces,
} from "../data/workspaces.js";
import { SourceNoteLink } from "../../library/SourceNoteLink.jsx";

const DIFFICULTY_LABEL = {
  starter: "Starter",
  core: "Core",
  deep: "Deep",
};

const STEP_LABELS = ["Brief", "Find bugs", "Reveal"];

const SEVERITY_LABEL = {
  high: "High",
  medium: "Medium",
  low: "Low",
};

export function BugFinderView({
  activeBugScenarioId,
  onSelectScenario,
  onOpenNote,
}) {
  const { workspaces } = useWorkspaces();

  const scenarios = useMemo(() => {
    return BUG_SCENARIOS.map((s) => {
      const ws = findBugFinderWorkspace(s.id);
      const attempts = ws?.bugfinder?.attempts?.length || 0;
      const status = ws ? statusOf(ws) : null;
      return { ...s, attempts, status, workspaceId: ws?.id ?? null };
    });
  }, [workspaces]);

  if (activeBugScenarioId) {
    return (
      <BugFinderDrill
        scenarioId={activeBugScenarioId}
        onExit={() => onSelectScenario(null)}
        onOpenNote={onOpenNote}
      />
    );
  }

  return (
    <div className="stack">
      <section className="panel drill-hero">
        <div>
          <p className="eyebrow">
            <Bug size={13} /> Bug Finder
          </p>
          <h1>Read a flawed design. Spot the failure modes.</h1>
          <p>
            Pick a scenario. The design is already drawn — your job is to
            read it like a reviewer and find what's wrong. Then compare your
            picks with the architecture linter and the postmortem-grade
            citations behind each rule.
          </p>
          <p className="muted">
            Decoys are mixed in on purpose. If you check everything, you score
            poorly. Specificity is the skill.
          </p>
        </div>
        <div className="drill-hero-decor">
          <Bug size={28} />
        </div>
      </section>

      <section className="drill-case-grid">
        {scenarios.map((s) => (
          <article
            key={s.id}
            className={`drill-case-card outage-card difficulty-${s.difficulty}`}
            onClick={() => onSelectScenario(s.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSelectScenario(s.id);
            }}
          >
            <div className="drill-case-top">
              <span className="difficulty-pill">
                {DIFFICULTY_LABEL[s.difficulty]}
              </span>
              {s.status === "completed" && (
                <span className="status-pill completed">
                  Done · {s.attempts}
                </span>
              )}
              {s.status === "in-progress" && (
                <span className="status-pill in-progress">In progress</span>
              )}
            </div>
            <h3>{s.title}</h3>
            <p>{s.blurb}</p>
            <button
              className="drill-case-cta"
              onClick={(event) => {
                event.stopPropagation();
                onSelectScenario(s.id);
              }}
            >
              {s.status === "in-progress"
                ? "Continue"
                : s.status === "completed"
                ? "Re-hunt"
                : "Start"}
              <ArrowRight size={14} />
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}

function newAttempt() {
  return {
    id: `bf_${Date.now().toString(36)}`,
    startedAt: new Date().toISOString(),
    selectedBugIds: [],
    submittedAt: null,
    completedAt: null,
  };
}

function BugFinderDrill({ scenarioId, onExit, onOpenNote }) {
  const scenario = getBugScenario(scenarioId);
  const [workspace, setWorkspace] = useState(() => {
    if (!scenario) return null;
    return ensureBugFinderWorkspace(scenario.id, scenario.title);
  });

  useEffect(() => {
    if (!scenario) return;
    if (
      !workspace ||
      workspace.kind !== "bugfinder" ||
      workspace.scenarioId !== scenarioId
    ) {
      const existing = findBugFinderWorkspace(scenarioId);
      setWorkspace(
        existing ?? ensureBugFinderWorkspace(scenario.id, scenario.title),
      );
    }
  }, [scenarioId, scenario, workspace]);

  if (!scenario) {
    return (
      <div className="stack">
        <section className="panel">
          <p className="muted">Scenario not found.</p>
          <button className="primary-cta" onClick={onExit}>
            Back to scenarios
          </button>
        </section>
      </div>
    );
  }

  const bf = workspace?.bugfinder || { step: 0, attempts: [], currentAttempt: null };
  const step = bf.step ?? 0;
  const currentAttempt = bf.currentAttempt;

  const persist = (patch) => {
    if (!workspace) return;
    const updated = updateWorkspace(workspace.id, { bugfinder: patch });
    if (updated) setWorkspace(updated);
  };

  const beginAttempt = () => {
    persist({ step: 1, currentAttempt: newAttempt() });
  };

  const toggleBug = (bugId) => {
    if (!currentAttempt) return;
    const set = new Set(currentAttempt.selectedBugIds);
    if (set.has(bugId)) set.delete(bugId);
    else set.add(bugId);
    persist({
      currentAttempt: {
        ...currentAttempt,
        selectedBugIds: [...set],
      },
    });
  };

  const submitFindings = () => {
    if (!currentAttempt) return;
    persist({
      step: 2,
      currentAttempt: {
        ...currentAttempt,
        submittedAt: new Date().toISOString(),
      },
    });
  };

  const finishAttempt = () => {
    if (!currentAttempt) return;
    const finished = {
      ...currentAttempt,
      completedAt: new Date().toISOString(),
    };
    persist({
      step: 3,
      currentAttempt: null,
      attempts: [...(bf.attempts || []), finished],
    });
  };

  const startAgain = () => persist({ step: 1, currentAttempt: newAttempt() });

  return (
    <div className="stack">
      <section className="panel drill-wizard-header">
        <button className="link-button" onClick={onExit}>
          <ArrowLeft size={14} />
          Back to scenarios
        </button>
        <p className="eyebrow">
          <Bug size={13} /> {DIFFICULTY_LABEL[scenario.difficulty]}
        </p>
        <h1>{scenario.title}</h1>
        <p>{scenario.blurb}</p>

        <div className="drill-stepper">
          {STEP_LABELS.map((label, idx) => {
            const isDone = step > idx;
            const isActive = step === idx;
            return (
              <span
                key={label}
                className={`drill-stepper-item ${isActive ? "is-active" : ""} ${
                  isDone ? "is-done" : ""
                }`}
              >
                <span className="drill-stepper-num">
                  {isDone ? <Check size={11} /> : idx + 1}
                </span>
                {label}
                {idx < STEP_LABELS.length - 1 && (
                  <ChevronRight size={12} className="drill-stepper-chev" />
                )}
              </span>
            );
          })}
        </div>
      </section>

      {step === 0 && (
        <BriefStep
          scenario={scenario}
          attempts={bf.attempts?.length || 0}
          onBegin={beginAttempt}
        />
      )}

      {step === 1 && currentAttempt && (
        <FindStep
          scenario={scenario}
          attempt={currentAttempt}
          onToggle={toggleBug}
          onSubmit={submitFindings}
          onBack={() => persist({ step: 0 })}
        />
      )}

      {step === 2 && currentAttempt && (
        <RevealStep
          scenario={scenario}
          attempt={currentAttempt}
          onFinish={finishAttempt}
          onBack={() => persist({ step: 1 })}
          onOpenNote={onOpenNote}
        />
      )}

      {step === 3 && (
        <DoneStep
          scenario={scenario}
          attempts={bf.attempts || []}
          onAttemptAgain={startAgain}
          onExit={onExit}
        />
      )}
    </div>
  );
}

function ConstraintRow({ label, value }) {
  return (
    <div className="bf-constraint">
      <span className="muted">{label}</span>
      <strong>{value || <em>(unset)</em>}</strong>
    </div>
  );
}

function DesignPanel({ design }) {
  const c = design.constraints || {};
  return (
    <div className="bf-design">
      <div className="bf-section">
        <p className="eyebrow">Constraints</p>
        <div className="bf-constraints-grid">
          <ConstraintRow label="Read QPS" value={c.qpsRead} />
          <ConstraintRow label="Write QPS" value={c.qpsWrite} />
          <ConstraintRow label="p95 latency (ms)" value={c.latencyP95} />
          <ConstraintRow label="Consistency" value={c.consistency} />
          <ConstraintRow label="Durability" value={c.durability} />
          <ConstraintRow label="Cost" value={c.cost} />
          <ConstraintRow label="Team" value={c.team} />
          <ConstraintRow label="Growth" value={c.growth} />
        </div>
      </div>
      <div className="bf-section">
        <p className="eyebrow">Components &amp; justifications</p>
        <ul className="bf-components">
          {(design.components || []).map((comp) => (
            <li key={comp.id}>
              <strong>{comp.name}</strong>
              <p>{comp.justification}</p>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function BriefStep({ scenario, attempts, onBegin }) {
  return (
    <section className="panel drill-step">
      <h2>The design under review</h2>
      <p className="muted">{scenario.narrative}</p>

      <DesignPanel design={scenario.design} />

      {attempts > 0 && (
        <p className="muted outage-attempts-note">
          You've hunted this design {attempts} time{attempts === 1 ? "" : "s"}.
        </p>
      )}

      <div className="drill-step-footer">
        <span className="muted">
          On the next step you'll see candidate bugs. Some are real, some are
          decoys.
        </span>
        <button className="primary-cta" onClick={onBegin}>
          Start the hunt
          <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}

function FindStep({ scenario, attempt, onToggle, onSubmit, onBack }) {
  const selected = new Set(attempt.selectedBugIds);
  const total = scenario.candidateBugs.length;
  const realCount = scenario.candidateBugs.filter((b) => b.isReal).length;

  return (
    <section className="panel drill-step">
      <h2>Pick the real bugs</h2>
      <p className="muted">
        {total} candidate issues, {realCount} are real. Read each carefully.
        Checking everything is the wrong answer.
      </p>

      <details className="bf-design-collapse">
        <summary>Re-read the design</summary>
        <DesignPanel design={scenario.design} />
      </details>

      <ul className="bf-candidate-list">
        {scenario.candidateBugs.map((bug) => {
          const isChecked = selected.has(bug.id);
          return (
            <li key={bug.id}>
              <label
                className={`bf-candidate ${isChecked ? "is-checked" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => onToggle(bug.id)}
                />
                <span>{bug.label}</span>
              </label>
            </li>
          );
        })}
      </ul>

      <div className="drill-step-footer">
        <button className="link-button" onClick={onBack}>
          <ArrowLeft size={14} /> Back to brief
        </button>
        <span className="muted">
          {selected.size} selected of {total}.
        </span>
        <button
          className="primary-cta"
          disabled={selected.size === 0}
          onClick={onSubmit}
        >
          Reveal verdict
          <Eye size={14} />
        </button>
      </div>
    </section>
  );
}

function RevealStep({ scenario, attempt, onFinish, onBack, onOpenNote }) {
  const selected = new Set(attempt.selectedBugIds);
  const candidates = scenario.candidateBugs;

  const realBugs = candidates.filter((b) => b.isReal);
  const decoys = candidates.filter((b) => !b.isReal);

  const hits = realBugs.filter((b) => selected.has(b.id));
  const misses = realBugs.filter((b) => !selected.has(b.id));
  const falsePositives = decoys.filter((b) => selected.has(b.id));

  const score = hits.length - falsePositives.length;
  const maxScore = realBugs.length;

  const lintFindings = useMemo(
    () => lintDrill(scenario.design),
    [scenario.design],
  );

  const lintRuleIds = new Set(lintFindings.map((f) => f.ruleId || f.id));
  const userRuleHits = new Set(
    hits.map((h) => h.ruleMatch).filter(Boolean),
  );
  const linterCaughtMissed = lintFindings.filter(
    (f) => !userRuleHits.has(f.ruleId || f.id),
  );

  return (
    <section className="panel drill-step">
      <h2>Verdict</h2>

      <div className="bf-score-banner">
        <div>
          <p className="eyebrow">Score</p>
          <h2>
            {score} / {maxScore}
          </h2>
        </div>
        <div className="bf-score-stats">
          <span className="bf-stat hit">
            <CheckCircle2 size={14} /> {hits.length} caught
          </span>
          <span className="bf-stat miss">
            <XCircle size={14} /> {misses.length} missed
          </span>
          <span className="bf-stat fp">
            <AlertTriangle size={14} /> {falsePositives.length} false positive
            {falsePositives.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {hits.length > 0 && (
        <div className="bf-result-section caught">
          <p className="eyebrow">
            <CheckCircle2 size={13} /> Real bugs you caught
          </p>
          <ul>
            {hits.map((bug) => (
              <BugRow key={bug.id} bug={bug} onOpenNote={onOpenNote} />
            ))}
          </ul>
        </div>
      )}

      {misses.length > 0 && (
        <div className="bf-result-section missed">
          <p className="eyebrow">
            <XCircle size={13} /> Real bugs you missed
          </p>
          <ul>
            {misses.map((bug) => (
              <BugRow key={bug.id} bug={bug} onOpenNote={onOpenNote} />
            ))}
          </ul>
        </div>
      )}

      {falsePositives.length > 0 && (
        <div className="bf-result-section fp">
          <p className="eyebrow">
            <AlertTriangle size={13} /> Decoys you fell for
          </p>
          <ul>
            {falsePositives.map((bug) => (
              <li key={bug.id} className="bf-bug-row">
                <strong>{bug.label}</strong>
                <p className="muted">{bug.explanation}</p>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="bf-result-section linter">
        <p className="eyebrow">
          <Sparkles size={13} /> What the architecture linter caught
        </p>
        <p className="muted">
          The linter ran the same {scenario.title.toLowerCase()} design through
          its 19 rules independently of your picks.
        </p>
        {lintFindings.length === 0 ? (
          <p className="muted">
            <em>No findings — the linter saw nothing wrong.</em>
          </p>
        ) : (
          <ul className="bf-lint-list">
            {lintFindings.map((f) => {
              const userCaughtIt = userRuleHits.has(f.ruleId || f.id);
              return (
                <li
                  key={f.id}
                  className={`bf-lint-row severity-${f.severity} ${
                    userCaughtIt ? "user-aligned" : ""
                  }`}
                >
                  <div className="bf-lint-header">
                    <span className={`severity ${f.severity}`}>
                      {SEVERITY_LABEL[f.severity]}
                    </span>
                    <strong>{f.title}</strong>
                    {userCaughtIt && (
                      <span className="bf-aligned-badge">
                        <Check size={11} /> matches your pick
                      </span>
                    )}
                  </div>
                  <p>{f.detail}</p>
                  <p className="muted">
                    <em>{f.suggestedFix}</em>
                  </p>
                  <div className="term-source-notes">
                    {(f.citations || []).map((p) => (
                      <SourceNoteLink
                        key={p}
                        path={p}
                        onOpenNote={onOpenNote}
                      />
                    ))}
                    {(f.outageRefs || []).map((p) => (
                      <SourceNoteLink
                        key={p}
                        path={p}
                        onOpenNote={onOpenNote}
                      />
                    ))}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {linterCaughtMissed.length > 0 && (
        <div className="bf-result-section linter-extras">
          <p className="muted">
            <Lightbulb size={13} /> The linter flagged{" "}
            {linterCaughtMissed.length} rule
            {linterCaughtMissed.length === 1 ? "" : "s"} you didn't pick — open
            the citations on each row above to study what you're not seeing.
          </p>
        </div>
      )}

      <div className="drill-step-footer">
        <button className="link-button" onClick={onBack}>
          <ArrowLeft size={14} /> Edit picks
        </button>
        <span className="muted">
          When you're ready, save this attempt and try a different scenario.
        </span>
        <button className="primary-cta" onClick={onFinish}>
          Save attempt
          <CheckCircle2 size={14} />
        </button>
      </div>
    </section>
  );
}

function BugRow({ bug, onOpenNote }) {
  return (
    <li className="bf-bug-row">
      <div className="bf-bug-row-header">
        {bug.severity && (
          <span className={`severity ${bug.severity}`}>
            {SEVERITY_LABEL[bug.severity]}
          </span>
        )}
        <strong>{bug.label}</strong>
      </div>
      <p>{bug.explanation}</p>
      {bug.citations && bug.citations.length > 0 && (
        <div className="term-source-notes">
          {bug.citations.map((p) => (
            <SourceNoteLink key={p} path={p} onOpenNote={onOpenNote} />
          ))}
        </div>
      )}
    </li>
  );
}

function DoneStep({ scenario, attempts, onAttemptAgain, onExit }) {
  const latest = attempts[attempts.length - 1];
  const realBugs = scenario.candidateBugs.filter((b) => b.isReal);

  let lastScore = 0;
  if (latest) {
    const sel = new Set(latest.selectedBugIds);
    const hits = realBugs.filter((b) => sel.has(b.id)).length;
    const fp = scenario.candidateBugs.filter(
      (b) => !b.isReal && sel.has(b.id),
    ).length;
    lastScore = hits - fp;
  }

  return (
    <section className="panel drill-step">
      <div className="outage-done-banner">
        <CheckCircle2 size={28} />
        <div>
          <h2>Saved.</h2>
          <p className="muted">
            Score {lastScore} / {realBugs.length}. Total hunts of this
            design: {attempts.length}.
          </p>
        </div>
      </div>

      <div className="outage-done-actions">
        <button className="primary-cta" onClick={onAttemptAgain}>
          <RotateCcw size={14} />
          Re-hunt this scenario
        </button>
        <button className="secondary-cta" onClick={onExit}>
          <ArrowLeft size={14} />
          Pick another scenario
        </button>
      </div>

      {attempts.length > 1 && (
        <div className="outage-history">
          <p className="eyebrow">Attempt history</p>
          <ul className="outage-history-list">
            {attempts
              .slice()
              .reverse()
              .map((att) => {
                const sel = new Set(att.selectedBugIds);
                const hits = realBugs.filter((b) => sel.has(b.id)).length;
                const fp = scenario.candidateBugs.filter(
                  (b) => !b.isReal && sel.has(b.id),
                ).length;
                const score = hits - fp;
                return (
                  <li key={att.id}>
                    <strong>
                      {new Date(
                        att.completedAt || att.startedAt,
                      ).toLocaleString()}
                    </strong>
                    <span>
                      Score {score} / {realBugs.length}
                    </span>
                  </li>
                );
              })}
          </ul>
        </div>
      )}

      <p className="muted outage-coda">
        Re-hunt the same scenario in a few weeks. Watch your false-positive
        rate drop as your eye sharpens.
      </p>
    </section>
  );
}
