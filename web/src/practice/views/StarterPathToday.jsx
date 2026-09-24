import { useMemo, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Circle,
  PartyPopper,
  Sparkles,
} from "lucide-react";
import {
  STARTER_LESSONS,
  TOTAL_LESSONS,
  getLesson,
  nextLesson,
  isPathComplete,
} from "../data/starterPath.js";
import { ALL_TERMS } from "../data/terms.js";
import { LessonView } from "./LessonView.jsx";

const DAY_MS = 86_400_000;
function dayHash(seed = 0) {
  let h = (Math.floor(Date.now() / DAY_MS) + seed) | 0;
  h = Math.imul(h ^ (h >>> 15), 0x85ebca6b);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae35);
  return Math.abs(h ^ (h >>> 16));
}

const FUNDAMENTAL_TERMS = ALL_TERMS.filter((t) => t.category === "Fundamentals");

export function StarterPathToday({
  completedLessons,
  onMarkComplete,
  onSkipToPracticing,
  onOpenNote,
  theme,
}) {
  const [activeLessonNumber, setActiveLessonNumber] = useState(null);
  const completedSet = useMemo(
    () => new Set(completedLessons),
    [completedLessons],
  );
  const next = nextLesson(completedLessons);
  const complete = isPathComplete(completedLessons);
  const progressPct = Math.round(
    (completedLessons.length / TOTAL_LESSONS) * 100,
  );
  const dailyTerm = useMemo(
    () => FUNDAMENTAL_TERMS[dayHash(2) % Math.max(FUNDAMENTAL_TERMS.length, 1)],
    [],
  );

  if (activeLessonNumber != null) {
    const lesson = getLesson(activeLessonNumber);
    if (lesson) {
      return (
        <LessonView
          lesson={lesson}
          isCompleted={completedSet.has(lesson.number)}
          theme={theme}
          onBack={() => setActiveLessonNumber(null)}
          onComplete={(num) => {
            onMarkComplete?.(num);
            setActiveLessonNumber(null);
          }}
          onOpenNote={onOpenNote}
        />
      );
    }
  }

  if (complete) {
    return (
      <div className="stack">
        <section className="panel graduation-card">
          <PartyPopper size={36} />
          <p className="eyebrow">Graduated</p>
          <h1>You finished the starter path.</h1>
          <p>
            Fourteen lessons covering fundamentals, building blocks, and the HLD
            thinking system. The drill prompts on the Skills tab should make
            sense now.
          </p>
          <p className="muted">
            Switch to Practicing mode below to unlock the daily-loop Today tab —
            drills, real outages, and the streak counter. You can re-read any
            starter lesson at any time.
          </p>
          <div className="button-row">
            <button className="primary-cta" onClick={onSkipToPracticing}>
              Switch to Practicing mode <ArrowRight size={14} />
            </button>
          </div>
        </section>

        <section className="panel">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Starter Path · Archive</p>
              <h2>Re-read any lesson</h2>
            </div>
            <span className="pill">{TOTAL_LESSONS} / {TOTAL_LESSONS}</span>
          </div>
          <LessonList
            lessons={STARTER_LESSONS}
            completedSet={completedSet}
            currentNumber={null}
            onSelect={setActiveLessonNumber}
          />
        </section>
      </div>
    );
  }

  return (
    <div className="stack">
      <section className="panel starter-hero">
        <div>
          <p className="eyebrow">
            <Sparkles size={13} /> Starter Path · Beginner mode
          </p>
          <h1>One small lesson at a time.</h1>
          <p>
            Each lesson takes 10–15 minutes: read one note, answer two short
            questions, mark complete. Move at your own pace. No streak pressure.
          </p>
        </div>
        <div className="starter-progress">
          <strong>
            {completedLessons.length}
            <span> / {TOTAL_LESSONS}</span>
          </strong>
          <span>lessons complete</span>
          <div className="progress-bar">
            <i style={{ width: `${progressPct}%` }} />
          </div>
        </div>
      </section>

      {next && (
        <section
          className="panel current-lesson-card"
          onClick={() => setActiveLessonNumber(next.number)}
          role="button"
          tabIndex={0}
        >
          <div>
            <p className="eyebrow">Up next · Lesson {next.number}</p>
            <h2>{next.title}</h2>
            <p>{next.whyThisMatters}</p>
          </div>
          <button
            className="primary-cta"
            onClick={(e) => {
              e.stopPropagation();
              setActiveLessonNumber(next.number);
            }}
          >
            Start lesson <ArrowRight size={14} />
          </button>
        </section>
      )}

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">All lessons</p>
            <h2>Path overview</h2>
          </div>
          <span className="pill">
            {completedLessons.length} of {TOTAL_LESSONS} done
          </span>
        </div>
        <LessonList
          lessons={STARTER_LESSONS}
          completedSet={completedSet}
          currentNumber={next?.number ?? null}
          onSelect={setActiveLessonNumber}
        />
      </section>

      {dailyTerm && (
        <section className="panel beginner-term-card">
          <p className="eyebrow">Term to know</p>
          <h2>{dailyTerm.term}</h2>
          <p>{dailyTerm.beginner}</p>
          <p className="muted">
            <strong>When to use:</strong> {dailyTerm.when}
          </p>
        </section>
      )}

      <section className="panel skip-card">
        <div>
          <p className="eyebrow">Already comfortable with the basics?</p>
          <p className="muted">
            You can switch to Practicing mode any time. Today tab will swap to
            daily drills, outages, and the streak counter. Starter Path stays
            accessible.
          </p>
        </div>
        <button className="link-button" onClick={onSkipToPracticing}>
          Skip to Practicing mode →
        </button>
      </section>
    </div>
  );
}

function LessonList({ lessons, completedSet, currentNumber, onSelect }) {
  return (
    <ol className="lesson-list">
      {lessons.map((lesson) => {
        const done = completedSet.has(lesson.number);
        const current = currentNumber === lesson.number;
        return (
          <li
            key={lesson.number}
            className={`lesson-row ${done ? "is-done" : ""} ${current ? "is-current" : ""}`}
          >
            <button onClick={() => onSelect(lesson.number)}>
              <span className="lesson-row-icon">
                {done ? <CheckCircle2 size={18} /> : <Circle size={18} />}
              </span>
              <div className="lesson-row-body">
                <strong>
                  Lesson {lesson.number}: {lesson.title}
                </strong>
                <small>{lesson.whyThisMatters}</small>
              </div>
              {current && <span className="lesson-row-tag">Up next</span>}
            </button>
          </li>
        );
      })}
    </ol>
  );
}
