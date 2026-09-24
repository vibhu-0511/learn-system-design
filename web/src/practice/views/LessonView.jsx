import { useState } from "react";
import { ArrowLeft, CheckCircle2, Lightbulb, Sparkles } from "lucide-react";
import { NoteReader } from "../../library/NoteReader.jsx";

export function LessonView({
  lesson,
  isCompleted,
  theme,
  onBack,
  onComplete,
  onOpenNote,
}) {
  const [answers, setAnswers] = useState(["", ""]);
  const [confirming, setConfirming] = useState(false);

  const handleComplete = () => {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    onComplete?.(lesson.number);
  };

  return (
    <div className="stack lesson-view">
      <section className="panel lesson-header">
        <button className="lesson-back" onClick={onBack}>
          <ArrowLeft size={14} />
          Back to starter path
        </button>
        <p className="eyebrow">
          <Sparkles size={13} /> Lesson {lesson.number} of 14
        </p>
        <h1>{lesson.title}</h1>
        <div className="lesson-callout">
          <Lightbulb size={16} />
          <div>
            <strong>Why this matters</strong>
            <p>{lesson.whyThisMatters}</p>
          </div>
        </div>
      </section>

      <section className="panel lesson-reading">
        <NoteReader
          notePath={lesson.notePath}
          theme={theme}
          onOpenNote={onOpenNote}
        />
      </section>

      <section className="panel lesson-reflect">
        <p className="eyebrow">Reflect</p>
        <h2>Two short questions before you mark this lesson done.</h2>
        <p className="muted">
          Don't skip these. Writing forces understanding. Your answers stay on
          this page; nothing is graded.
        </p>
        {lesson.checkQuestions.map((question, index) => (
          <label key={index} className="field-label lesson-question">
            {index + 1}. {question}
            <textarea
              value={answers[index]}
              onChange={(event) => {
                const next = [...answers];
                next[index] = event.target.value;
                setAnswers(next);
              }}
              placeholder="Type your answer here. A sentence or two is plenty."
            />
          </label>
        ))}

        <div className="lesson-complete-row">
          {isCompleted ? (
            <span className="lesson-complete-badge">
              <CheckCircle2 size={16} /> Lesson already completed
            </span>
          ) : (
            <button
              className={`lesson-complete-button ${confirming ? "is-confirming" : ""}`}
              onClick={handleComplete}
            >
              <CheckCircle2 size={16} />
              {confirming ? "Confirm: I've read this and answered both" : "Mark lesson complete"}
            </button>
          )}
          {confirming && !isCompleted && (
            <button
              className="lesson-cancel"
              onClick={() => setConfirming(false)}
            >
              Cancel
            </button>
          )}
        </div>
      </section>
    </div>
  );
}
