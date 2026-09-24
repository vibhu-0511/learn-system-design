import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Brain,
  CalendarDays,
  Flame,
  Folder,
  RefreshCw,
  Sparkles,
  Target,
  Wrench,
} from "lucide-react";
import { SKILLS } from "../data/skills.js";
import { ALL_TERMS } from "../data/terms.js";
import { LEARNING_PHASES } from "../data/learning.js";
import { dueCount } from "../lib/reviewQueue.js";
import { notesByType, getNote } from "../../library/vaultIndex.js";
import { statusOf, useWorkspaces } from "../data/workspaces.js";
import { getCase } from "../data/drillCases.js";
import { getReplayByPath } from "../data/outageReplays.js";
import { SourceNoteLink } from "../../library/SourceNoteLink.jsx";

const DAY_MS = 86_400_000;

function todayDayNumber() {
  return Math.floor(Date.now() / DAY_MS);
}

function todayLabel() {
  return new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

function dayHash(seed = 0) {
  let h = (todayDayNumber() + seed) | 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return Math.abs(h ^ (h >>> 16));
}

function pickDaily(items, seed = 0) {
  if (!items || items.length === 0) return null;
  return items[dayHash(seed) % items.length];
}

function useStreak(storage) {
  const [streak, setStreak] = useState(() => readStreak(storage));

  useEffect(() => {
    const today = todayDayNumber();
    if (streak.lastDay === today) return;
    let count = 1;
    if (streak.lastDay === today - 1) count = streak.count + 1;
    const next = { count, lastDay: today };
    writeStreak(storage, next);
    setStreak(next);
  }, []); // run once per mount; consumers re-mount on new day naturally

  return streak.count;
}

function readStreak(storage) {
  try {
    const raw = storage.getItem("hld-streak");
    if (!raw) return { count: 0, lastDay: null };
    const parsed = JSON.parse(raw);
    if (typeof parsed?.count !== "number") return { count: 0, lastDay: null };
    return parsed;
  } catch {
    return { count: 0, lastDay: null };
  }
}

function writeStreak(storage, value) {
  try {
    storage.setItem("hld-streak", JSON.stringify(value));
  } catch {
    /* ignore quota errors */
  }
}

const DRILL_POOL = LEARNING_PHASES.flatMap((phase) =>
  phase.caseExercise
    ? [
        {
          phaseId: phase.id,
          phaseNumber: phase.number,
          phaseTitle: phase.title,
          ...phase.caseExercise,
        },
      ]
    : [],
);

export function TodayView({
  onOpenNote,
  onJumpToTab,
  onSelectSkill,
  onOpenWorkspace,
  onOpenOutageReplay,
  onOpenReview,
}) {
  const streak = useStreak(typeof window === "undefined" ? null : window.localStorage);
  const { workspaces } = useWorkspaces();

  const dailyOutage = useMemo(() => {
    const outages = notesByType("outage");
    return pickDaily(outages, 1);
  }, []);
  const dailyOutageReplay = useMemo(
    () => (dailyOutage ? getReplayByPath(dailyOutage.path) : null),
    [dailyOutage],
  );

  const dailyTerm = useMemo(() => pickDaily(ALL_TERMS, 2), []);
  const dailySkill = useMemo(() => pickDaily(SKILLS, 3), []);
  const dailyDrill = useMemo(() => pickDaily(DRILL_POOL, 4), []);
  const drillSkill = useMemo(
    () => SKILLS.find((s) => s.drill?.title === dailyDrill?.title) || null,
    [dailyDrill],
  );

  const openWorkspaces = workspaces
    .filter((w) => statusOf(w) === "in-progress")
    .slice(0, 4);

  const goSkill = (id) => {
    onSelectSkill?.(id);
    onJumpToTab?.("skills");
  };

  const goVocab = () => onJumpToTab?.("vocab");
  const goWorkspaces = () => onJumpToTab?.("workspaces");

  return (
    <div className="stack">
      <section className="today-hero panel">
        <div>
          <p className="eyebrow">
            <CalendarDays size={13} /> {todayLabel()}
          </p>
          <h1>One drill, one outage, one term — every day.</h1>
          <p>
            Architects don't graduate. They keep practicing. Five minutes here today
            beats two hours next week.
          </p>
        </div>
        <div className="streak-badge" title="Days in a row you've opened Today">
          <Flame size={22} />
          <strong>{streak}</strong>
          <span>day{streak === 1 ? "" : "s"}</span>
        </div>
      </section>

      <section className="today-grid">
        <article className="today-card today-drill">
          <header>
            <Sparkles size={16} />
            <span>Today's drill</span>
          </header>
          {dailyDrill ? (
            <>
              <h3>{dailyDrill.title}</h3>
              <p>{dailyDrill.prompt}</p>
              <button
                className="card-cta"
                onClick={() => drillSkill && goSkill(drillSkill.id)}
              >
                Open drill <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <p className="muted">No drill available.</p>
          )}
        </article>

        <article className="today-card today-outage">
          <header>
            <AlertTriangle size={16} />
            <span>Today's outage</span>
          </header>
          {dailyOutage ? (
            <>
              <h3>{dailyOutage.title}</h3>
              <p>
                {dailyOutage.failureFirst?.slice(0, 220) ||
                  dailyOutage.intuition?.slice(0, 220) ||
                  "A real production failure. Read the postmortem and ask: would my current designs survive this?"}
                {(dailyOutage.failureFirst || dailyOutage.intuition || "").length > 220
                  ? "…"
                  : ""}
              </p>
              {dailyOutageReplay ? (
                <button
                  className="card-cta"
                  onClick={() =>
                    onOpenOutageReplay?.(dailyOutageReplay.id)
                  }
                >
                  Replay this outage <ArrowRight size={14} />
                </button>
              ) : (
                <button
                  className="card-cta"
                  onClick={() => onOpenNote?.(dailyOutage.path)}
                >
                  Read postmortem <ArrowRight size={14} />
                </button>
              )}
            </>
          ) : (
            <p className="muted">No outages indexed.</p>
          )}
        </article>

        <article className="today-card today-term">
          <header>
            <Brain size={16} />
            <span>Term to revisit</span>
          </header>
          {dailyTerm ? (
            <>
              <h3>{dailyTerm.term}</h3>
              <p>{dailyTerm.beginner}</p>
              <p className="muted">
                <strong>When:</strong> {dailyTerm.when}
              </p>
              <button className="card-cta" onClick={goVocab}>
                Open vocabulary <ArrowRight size={14} />
              </button>
            </>
          ) : (
            <p className="muted">No terms.</p>
          )}
        </article>

        <article className="today-card today-skill">
          <header>
            <Target size={16} />
            <span>Skill to focus on</span>
          </header>
          {dailySkill && (
            <>
              <h3>{dailySkill.name}</h3>
              <p>{dailySkill.cue}</p>
              <div className="term-source-notes">
                {dailySkill.sourceNotes.slice(0, 3).map((path) => (
                  <SourceNoteLink
                    key={path}
                    path={path}
                    onOpenNote={onOpenNote}
                  />
                ))}
              </div>
              <button
                className="card-cta"
                onClick={() => goSkill(dailySkill.id)}
              >
                Open skill <ArrowRight size={14} />
              </button>
            </>
          )}
        </article>

        <article className="today-card today-review">
          <header><RefreshCw size={16} /><span>Review queue</span></header>
          <h3>{dueCount()} cards due</h3>
          <p>Spaced repetition over terms and outage lessons. Five minutes.</p>
          <button className="card-cta" onClick={() => onOpenReview?.()}>
            Start reviewing <ArrowRight size={14} />
          </button>
        </article>
      </section>

      {openWorkspaces.length > 0 && (
        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">
                <Folder size={13} /> Open workspaces
              </p>
              <h2>{openWorkspaces.length} in progress</h2>
            </div>
            <button className="link-button" onClick={goWorkspaces}>
              See all →
            </button>
          </div>
          <ul className="today-workspace-list">
            {openWorkspaces.map((w) => {
              const drillCase = w.kind === "drill" ? getCase(w.caseId) : null;
              let summary = w.kind;
              if (drillCase) {
                const componentCount = w.drill?.components?.length || 0;
                const constraintCount = Object.values(w.drill?.constraints || {}).filter(Boolean).length;
                summary = `${constraintCount}/8 constraints · ${componentCount} components`;
              } else if (w.kind === "outage") {
                const attempts = w.outage?.attempts?.length || 0;
                const inFlight = w.outage?.currentAttempt ? " · resume" : "";
                summary = `outage replay · ${attempts} attempt${attempts === 1 ? "" : "s"}${inFlight}`;
              }
              return (
                <li key={w.id}>
                  <button onClick={() => onOpenWorkspace?.(w)}>
                    <Wrench size={14} />
                    <div>
                      <strong>{w.name}</strong>
                      <small>{summary}</small>
                    </div>
                    <ArrowRight size={14} />
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The loop</p>
            <h2>Each visit, do one thing. Don't break the chain.</h2>
          </div>
        </div>
        <div className="learning-loop">
          {[
            "Learn concept",
            "Apply to small flow",
            "Practice full case",
            "Find bugs",
            "Write notes",
            "Propose improvement",
          ].map((item) => (
            <span key={item}>{item}</span>
          ))}
        </div>
      </section>
    </div>
  );
}
