import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  Lightbulb,
  RotateCcw,
  Sparkles,
  Target,
} from "lucide-react";
import {
  OUTAGE_REPLAYS,
  PREDICT_PROMPTS,
  getReplay,
} from "../data/outageReplays.js";
import {
  ensureOutageWorkspace,
  findOutageWorkspace,
  updateWorkspace,
  statusOf,
  useWorkspaces,
} from "../data/workspaces.js";
import { SourceNoteLink } from "../../library/SourceNoteLink.jsx";
import { NoteReader } from "../../library/NoteReader.jsx";

const DIFFICULTY_LABEL = {
  starter: "Starter",
  core: "Core",
  deep: "Deep",
};

const SCORE_OPTIONS = [
  { value: 1, label: "Off", tone: "danger" },
  { value: 2, label: "Some clue", tone: "warning" },
  { value: 3, label: "Got close", tone: "chip" },
  { value: 4, label: "Got it", tone: "success" },
];

const STEP_LABELS = ["Brief", "Predict", "Reveal"];

export function OutageReplayView({
  activeOutageId,
  onSelectOutage,
  onOpenNote,
  theme,
}) {
  const { workspaces } = useWorkspaces();

  const replays = useMemo(() => {
    return OUTAGE_REPLAYS.map((r) => {
      const ws = findOutageWorkspace(r.id);
      const attempts = ws?.outage?.attempts?.length || 0;
      const status = ws ? statusOf(ws) : null;
      return { ...r, attempts, status, workspaceId: ws?.id ?? null };
    });
  }, [workspaces]);

  if (activeOutageId) {
    return (
      <OutageDrill
        outageId={activeOutageId}
        onExit={() => onSelectOutage(null)}
        onOpenNote={onOpenNote}
        theme={theme}
      />
    );
  }

  return (
    <div className="stack">
      <section className="panel drill-hero">
        <div>
          <p className="eyebrow">
            <AlertTriangle size={13} /> Outage Replay
          </p>
          <h1>Predict the failure before you read the postmortem.</h1>
          <p>
            Pick a real outage. Read the pre-incident architecture, predict the
            root cause, blast radius, recovery time, and what would have
            prevented it. Then compare your prediction with what actually
            happened.
          </p>
          <p className="muted">
            Failure-first thinking is a muscle. Every replay is a rep.
          </p>
        </div>
        <div className="drill-hero-decor">
          <AlertTriangle size={28} />
        </div>
      </section>

      <section className="drill-case-grid">
        {replays.map((r) => (
          <article
            key={r.id}
            className={`drill-case-card outage-card difficulty-${r.difficulty}`}
            onClick={() => onSelectOutage(r.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSelectOutage(r.id);
            }}
          >
            <div className="drill-case-top">
              <span className="difficulty-pill">
                {DIFFICULTY_LABEL[r.difficulty]}
              </span>
              {r.status === "completed" && (
                <span className="status-pill completed">
                  Done · {r.attempts}
                </span>
              )}
              {r.status === "in-progress" && (
                <span className="status-pill in-progress">In progress</span>
              )}
            </div>
            <h3>
              {r.title} <span className="outage-year">({r.year})</span>
            </h3>
            <p className="outage-impact">{r.impact}</p>
            <p className="muted outage-duration">Duration: {r.duration}</p>
            <button
              className="drill-case-cta"
              onClick={(event) => {
                event.stopPropagation();
                onSelectOutage(r.id);
              }}
            >
              {r.status === "in-progress"
                ? "Continue"
                : r.status === "completed"
                ? "Replay"
                : "Start"}
              <ArrowRight size={14} />
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}

const EMPTY_PREDICTIONS = {
  rootCause: "",
  blastRadius: "",
  recovery: "",
  prevention: "",
};

function newAttempt() {
  return {
    id: `att_${Date.now().toString(36)}`,
    startedAt: new Date().toISOString(),
    predictions: { ...EMPTY_PREDICTIONS },
    predictedAt: null,
    scores: {},
    reflectedAt: null,
  };
}

function OutageDrill({ outageId, onExit, onOpenNote, theme }) {
  const replay = getReplay(outageId);
  const [workspace, setWorkspace] = useState(() => {
    if (!replay) return null;
    return ensureOutageWorkspace(replay.id, replay.title);
  });

  useEffect(() => {
    if (!replay) return;
    if (
      !workspace ||
      workspace.kind !== "outage" ||
      workspace.outageId !== outageId
    ) {
      const existing = findOutageWorkspace(outageId);
      setWorkspace(existing ?? ensureOutageWorkspace(replay.id, replay.title));
    }
  }, [outageId, replay, workspace]);

  if (!replay) {
    return (
      <div className="stack">
        <section className="panel">
          <p className="muted">Outage not found.</p>
          <button className="primary-cta" onClick={onExit}>
            Back to outages
          </button>
        </section>
      </div>
    );
  }

  const outage = workspace?.outage || { step: 0, attempts: [], currentAttempt: null };
  const step = outage.step ?? 0;
  const currentAttempt = outage.currentAttempt;

  const persist = (patch) => {
    if (!workspace) return;
    const updated = updateWorkspace(workspace.id, { outage: patch });
    if (updated) setWorkspace(updated);
  };

  const setStep = (next) => persist({ step: next });

  const beginAttempt = () => {
    const attempt = newAttempt();
    persist({ step: 1, currentAttempt: attempt });
  };

  const updatePrediction = (id, value) => {
    if (!currentAttempt) return;
    persist({
      currentAttempt: {
        ...currentAttempt,
        predictions: { ...currentAttempt.predictions, [id]: value },
      },
    });
  };

  const submitPredictions = () => {
    if (!currentAttempt) return;
    persist({
      step: 2,
      currentAttempt: {
        ...currentAttempt,
        predictedAt: new Date().toISOString(),
      },
    });
  };

  const setScore = (id, value) => {
    if (!currentAttempt) return;
    persist({
      currentAttempt: {
        ...currentAttempt,
        scores: { ...(currentAttempt.scores || {}), [id]: value },
      },
    });
  };

  const finishReflection = () => {
    if (!currentAttempt) return;
    const finished = {
      ...currentAttempt,
      reflectedAt: new Date().toISOString(),
    };
    persist({
      step: 3,
      currentAttempt: null,
      attempts: [...(outage.attempts || []), finished],
    });
  };

  const startNewAttempt = () => {
    const attempt = newAttempt();
    persist({ step: 1, currentAttempt: attempt });
  };

  const allFilled = currentAttempt
    ? PREDICT_PROMPTS.every(
        (p) => (currentAttempt.predictions[p.id] || "").trim().length >= 20,
      )
    : false;

  const allScored = currentAttempt
    ? PREDICT_PROMPTS.every((p) => (currentAttempt.scores || {})[p.id])
    : false;

  return (
    <div className="stack">
      <section className="panel drill-wizard-header">
        <button className="link-button" onClick={onExit}>
          <ArrowLeft size={14} />
          Back to outages
        </button>
        <p className="eyebrow">
          <AlertTriangle size={13} /> {replay.year} · {DIFFICULTY_LABEL[replay.difficulty]}
        </p>
        <h1>{replay.title}</h1>
        <p>{replay.impact}</p>

        <div className="drill-stepper">
          {STEP_LABELS.map((label, idx) => {
            const stepIdx = idx;
            const isDone = step > stepIdx;
            const isActive = step === stepIdx;
            return (
              <span
                key={label}
                className={`drill-stepper-item ${isActive ? "is-active" : ""} ${
                  isDone ? "is-done" : ""
                }`}
              >
                <span className="drill-stepper-num">
                  {isDone ? <Check size={11} /> : stepIdx + 1}
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
          replay={replay}
          attempts={outage.attempts?.length || 0}
          onBegin={beginAttempt}
          onOpenNote={onOpenNote}
        />
      )}

      {step === 1 && currentAttempt && (
        <PredictStep
          replay={replay}
          attempt={currentAttempt}
          onUpdate={updatePrediction}
          onSubmit={submitPredictions}
          onBack={() => setStep(0)}
          allFilled={allFilled}
        />
      )}

      {step === 2 && currentAttempt && (
        <RevealStep
          replay={replay}
          attempt={currentAttempt}
          onScore={setScore}
          onFinish={finishReflection}
          onBack={() => setStep(1)}
          allScored={allScored}
          onOpenNote={onOpenNote}
          theme={theme}
        />
      )}

      {step === 3 && (
        <DoneStep
          replay={replay}
          attempts={outage.attempts || []}
          onAttemptAgain={startNewAttempt}
          onExit={onExit}
          onOpenNote={onOpenNote}
        />
      )}
    </div>
  );
}

function BriefStep({ replay, attempts, onBegin, onOpenNote }) {
  return (
    <section className="panel drill-step">
      <h2>The setup</h2>
      <p className="muted">
        Read this before predicting. No spoilers — just what was true the
        moment before things broke.
      </p>

      <div className="outage-brief">
        <div className="outage-brief-row">
          <p className="eyebrow">Architecture</p>
          <p>{replay.preIncident.summary}</p>
        </div>

        <div className="outage-brief-row">
          <p className="eyebrow">Components in play</p>
          <ul className="outage-component-list">
            {replay.preIncident.components.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>

        <div className="outage-brief-row">
          <p className="eyebrow">Normal state</p>
          <p>{replay.preIncident.normalState}</p>
        </div>

        <div className="outage-brief-row outage-trigger">
          <p className="eyebrow">
            <AlertTriangle size={13} /> The trigger
          </p>
          <p>{replay.preIncident.triggerHint}</p>
        </div>
      </div>

      {attempts > 0 && (
        <p className="muted outage-attempts-note">
          You've done this replay {attempts} time{attempts === 1 ? "" : "s"}.
          Re-doing it after a few weeks is the point.
        </p>
      )}

      <div className="drill-step-footer">
        <span className="muted">
          When you click Begin, four prediction prompts appear.
        </span>
        <button className="primary-cta" onClick={onBegin}>
          Begin prediction
          <ArrowRight size={14} />
        </button>
      </div>
    </section>
  );
}

function PredictStep({ replay, attempt, onUpdate, onSubmit, onBack, allFilled }) {
  return (
    <section className="panel drill-step">
      <h2>Predict</h2>
      <p className="muted">
        Don't peek. Write what you'd say if a colleague walked up and described
        the trigger. Be specific — vague answers are easy to feel right about
        later.
      </p>

      <div className="outage-predict-form">
        {PREDICT_PROMPTS.map((prompt) => {
          const value = attempt.predictions[prompt.id] || "";
          const tooShort = value.trim().length > 0 && value.trim().length < 20;
          return (
            <label key={prompt.id} className="field-label outage-predict-field">
              <span className="outage-predict-label">
                <Target size={13} /> {prompt.label}
              </span>
              <span className="field-hint">{prompt.helper}</span>
              <textarea
                value={value}
                onChange={(event) => onUpdate(prompt.id, event.target.value)}
                placeholder="Type your best guess…"
                rows={4}
              />
              {tooShort && (
                <span className="field-hint warning">
                  Push past one sentence — the prompt asks for reasoning.
                </span>
              )}
            </label>
          );
        })}
      </div>

      <div className="drill-step-footer">
        <button className="link-button" onClick={onBack}>
          <ArrowLeft size={14} /> Back to brief
        </button>
        <span className={`muted ${allFilled ? "is-ok" : ""}`}>
          {allFilled
            ? "All four predictions look substantive. Submit to reveal the postmortem."
            : "Each prompt needs a real answer (≥20 chars)."}
        </span>
        <button
          className="primary-cta"
          disabled={!allFilled}
          onClick={onSubmit}
        >
          Reveal postmortem
          <Eye size={14} />
        </button>
      </div>
    </section>
  );
}

function RevealStep({
  replay,
  attempt,
  onScore,
  onFinish,
  onBack,
  allScored,
  onOpenNote,
  theme,
}) {
  return (
    <section className="panel drill-step">
      <h2>Reveal</h2>
      <p className="muted">
        Side-by-side. Be honest about how close each prediction was. The point
        isn't to feel good — it's to find your blind spots.
      </p>

      <div className="outage-reveal-list">
        {PREDICT_PROMPTS.map((prompt) => {
          const yourAnswer = attempt.predictions[prompt.id] || "";
          const truth = replay.reveal[prompt.id] || "";
          const score = attempt.scores?.[prompt.id];
          return (
            <div key={prompt.id} className="outage-reveal-row">
              <div className="outage-reveal-header">
                <span className="outage-predict-label">
                  <Target size={13} /> {prompt.label}
                </span>
              </div>
              <div className="outage-reveal-grid">
                <div className="outage-reveal-cell yours">
                  <p className="eyebrow">Your prediction</p>
                  <p>{yourAnswer || <em className="muted">(empty)</em>}</p>
                </div>
                <div className="outage-reveal-cell truth">
                  <p className="eyebrow">
                    <Lightbulb size={13} /> What actually happened
                  </p>
                  <p>{truth}</p>
                </div>
              </div>
              <div className="outage-rate-row">
                <span className="muted">How close were you?</span>
                <div className="outage-rate-buttons">
                  {SCORE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`outage-rate-btn tone-${opt.tone} ${
                        score === opt.value ? "is-active" : ""
                      }`}
                      onClick={() => onScore(prompt.id, opt.value)}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="outage-lessons">
        <p className="eyebrow">
          <Sparkles size={13} /> Key lessons
        </p>
        <ul>
          {replay.keyLessons.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>

      <div className="outage-related">
        <p className="eyebrow">
          <BookOpen size={13} /> Read the full postmortem and related notes
        </p>
        <div className="term-source-notes">
          <SourceNoteLink path={replay.path} onOpenNote={onOpenNote} />
          {replay.relatedNotes.map((path) => (
            <SourceNoteLink
              key={path}
              path={path}
              onOpenNote={onOpenNote}
            />
          ))}
        </div>
      </div>

      <div className="outage-postmortem-inline">
        <NoteReader
          notePath={replay.path}
          theme={theme}
          onOpenNote={onOpenNote}
        />
      </div>

      <div className="drill-step-footer">
        <button className="link-button" onClick={onBack}>
          <ArrowLeft size={14} /> Edit predictions
        </button>
        <span className={`muted ${allScored ? "is-ok" : ""}`}>
          {allScored
            ? "Self-rated all four. Save this attempt to your history."
            : "Rate each prediction before saving."}
        </span>
        <button
          className="primary-cta"
          disabled={!allScored}
          onClick={onFinish}
        >
          Save attempt
          <CheckCircle2 size={14} />
        </button>
      </div>
    </section>
  );
}

function DoneStep({ replay, attempts, onAttemptAgain, onExit, onOpenNote }) {
  const latest = attempts[attempts.length - 1];
  const score = latest
    ? PREDICT_PROMPTS.reduce(
        (acc, p) => acc + (latest.scores?.[p.id] || 0),
        0,
      )
    : 0;
  const max = PREDICT_PROMPTS.length * 4;

  return (
    <section className="panel drill-step">
      <div className="outage-done-banner">
        <CheckCircle2 size={28} />
        <div>
          <h2>Saved.</h2>
          <p className="muted">
            Attempt logged. Score: {score} / {max}. Total replays of this
            outage: {attempts.length}.
          </p>
        </div>
      </div>

      <div className="outage-done-actions">
        <button className="primary-cta" onClick={onAttemptAgain}>
          <RotateCcw size={14} />
          Replay this outage
        </button>
        <button className="secondary-cta" onClick={onExit}>
          <ArrowLeft size={14} />
          Pick another outage
        </button>
      </div>

      <div className="outage-history">
        <p className="eyebrow">Your history on this outage</p>
        <ul className="outage-history-list">
          {attempts
            .slice()
            .reverse()
            .map((att, idx) => {
              const total = PREDICT_PROMPTS.reduce(
                (acc, p) => acc + (att.scores?.[p.id] || 0),
                0,
              );
              return (
                <li key={att.id || idx}>
                  <strong>
                    {new Date(att.reflectedAt || att.startedAt).toLocaleString()}
                  </strong>
                  <span>
                    Score {total} / {max}
                  </span>
                </li>
              );
            })}
        </ul>
      </div>

      <p className="muted outage-coda">
        Open the postmortem again in a week. The lessons stick when they're
        revisited cold.
      </p>
      <SourceNoteLink path={replay.path} onOpenNote={onOpenNote} />
    </section>
  );
}
