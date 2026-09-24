import { useMemo } from "react";
import { ArrowRight, Sparkles, Wrench } from "lucide-react";
import { DRILL_CASES } from "../data/drillCases.js";
import { findDrillWorkspace, statusOf, useWorkspaces } from "../data/workspaces.js";
import { DrillWizard } from "./DrillWizard.jsx";

const DIFFICULTY_LABEL = {
  beginner: "Beginner",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

export function DrillView({ activeCaseId, onSelectCase, onOpenNote, theme, level, onOpenNapkin }) {
  const { workspaces } = useWorkspaces();

  const cases = useMemo(() => {
    return DRILL_CASES.map((c) => {
      const ws = findDrillWorkspace(c.id);
      const status = ws ? statusOf(ws) : null;
      return { ...c, status, workspaceId: ws?.id ?? null };
    });
    // workspaces is read inside findDrillWorkspace; passing it in deps refreshes
    // when the store changes
  }, [workspaces]);

  if (activeCaseId) {
    return (
      <DrillWizard
        caseId={activeCaseId}
        onExit={() => onSelectCase(null)}
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
            <Wrench size={13} /> Greenfield Drill
          </p>
          <h1>Design a real system end-to-end.</h1>
          <p>
            Pick a case. State constraints. Choose components and defend each
            one. Get linted against architecture rules anchored to your vault.
            Then compare with the case study.
          </p>
          {level === "beginner" && (
            <p className="muted">
              Tip: this is most useful after you've finished the starter path.
              Feel free to peek now though.
            </p>
          )}
        </div>
        <div className="drill-hero-decor">
          <Sparkles size={28} />
        </div>
      </section>

      <section className="drill-case-grid">
        <article className="drill-case-card napkin-card" onClick={onOpenNapkin} role="button" tabIndex={0}>
          <span className="difficulty-pill">Daily reps</span>
          <h3>Napkin Math Quiz</h3>
          <p>12 estimation questions. Land within the right order of magnitude.</p>
          <button className="drill-case-cta" onClick={(e) => { e.stopPropagation(); onOpenNapkin(); }}>
            Start <ArrowRight size={14} />
          </button>
        </article>
        {cases.map((c) => (
          <article
            key={c.id}
            className={`drill-case-card difficulty-${c.difficulty}`}
            onClick={() => onSelectCase(c.id)}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter") onSelectCase(c.id);
            }}
          >
            <div className="drill-case-top">
              <span className="difficulty-pill">
                {DIFFICULTY_LABEL[c.difficulty]}
              </span>
              {c.status === "in-progress" && (
                <span className="status-pill in-progress">In progress</span>
              )}
              {c.status === "completed" && (
                <span className="status-pill completed">Completed</span>
              )}
            </div>
            <h3>{c.title}</h3>
            <p>{c.blurb}</p>
            <button
              className="drill-case-cta"
              onClick={(event) => {
                event.stopPropagation();
                onSelectCase(c.id);
              }}
            >
              {c.status === "in-progress" ? "Continue" : c.status === "completed" ? "Re-do" : "Start"}
              <ArrowRight size={14} />
            </button>
          </article>
        ))}
      </section>
    </div>
  );
}
