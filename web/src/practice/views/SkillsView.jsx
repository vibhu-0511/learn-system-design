import { useState } from "react";
import {
  AlertTriangle,
  BookOpen,
  Check,
  CheckCircle2,
  Eye,
  Lightbulb,
  Sparkles,
} from "lucide-react";
import { SKILLS } from "../data/skills.js";
import { SourceNoteLink } from "../../library/SourceNoteLink.jsx";
import { VaultMap } from "../../library/VaultMap.jsx";
import { DrillApproachScaffold } from "./DrillApproachScaffold.jsx";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function SkillsView({ activeSkillId, onSelectSkill, onOpenNote, level }) {
  const initialId = activeSkillId || SKILLS[0].id;
  const [skillId, setSkillId] = useState(initialId);
  const [mode, setMode] = useState("overview");
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [answers, setAnswers] = useState({});

  const skill = SKILLS.find((s) => s.id === skillId) ?? SKILLS[0];
  const drill = skill.drill;
  const steps = drill?.steps ?? [];
  const activeStep = steps[activeStepIndex] ?? steps[0];
  const answerKey = activeStep ? `${skill.id}:${activeStep.id}` : null;
  const currentAnswer = answerKey ? answers[answerKey] ?? "" : "";

  const handleSelect = (id) => {
    setSkillId(id);
    setActiveStepIndex(0);
    onSelectSkill?.(id);
  };

  const updateAnswer = (value) => {
    if (!answerKey) return;
    setAnswers((prev) => ({ ...prev, [answerKey]: value }));
  };

  return (
    <div className="stack">
      <section className="learning-hero panel">
        <div>
          <p className="eyebrow">Architect Skills</p>
          <h2>Ten behaviors that separate good from great.</h2>
          <p>
            Each skill is something you practice — not something you finish. Read the
            cue, do the drill, study the bug, check readiness. Repeat across systems.
          </p>
        </div>
        <div className="lab-mode-tabs">
          {[
            { id: "overview", label: "Overview", Icon: BookOpen },
            { id: "drill", label: "Drill", Icon: Sparkles },
            { id: "bug", label: "Bug scenario", Icon: AlertTriangle },
          ].map(({ id, label, Icon }) => (
            <button
              key={id}
              className={mode === id ? "is-active" : ""}
              onClick={() => setMode(id)}
            >
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      </section>

      <section className="learning-layout">
        <aside className="panel phase-timeline">
          <div className="section-heading">
            <div>
              <p className="eyebrow">Skills</p>
              <h2>{SKILLS.length} behaviors</h2>
            </div>
          </div>
          {SKILLS.map((item) => (
            <button
              key={item.id}
              className={cx("stage-button", skill.id === item.id && "is-active")}
              onClick={() => handleSelect(item.id)}
              style={{ "--accent": item.accent }}
            >
              <span>{item.number.toString().padStart(2, "0")}</span>
              <div>
                <strong>{item.name}</strong>
                <small>{item.short}</small>
              </div>
            </button>
          ))}
        </aside>

        <section className="panel phase-workbench">
          <div className="phase-header" style={{ "--accent": skill.accent }}>
            <div>
              <p className="eyebrow">Skill {skill.number}</p>
              <h2>{skill.name}</h2>
              <p>{skill.behavior}</p>
            </div>
          </div>

          {mode === "overview" && (
            <div className="roadmap-grid">
              <article className="learning-card">
                <h3>Cue</h3>
                <p>{skill.cue}</p>
              </article>
              <article className="learning-card">
                <h3>Source notes</h3>
                <div className="term-source-notes">
                  {skill.sourceNotes.map((path) => (
                    <SourceNoteLink
                      key={path}
                      path={path}
                      onOpenNote={onOpenNote}
                    />
                  ))}
                </div>
              </article>
              <article className="learning-card">
                <h3>You're calibrated when...</h3>
                <ul className="clean-list">
                  {skill.readiness.map((item) => (
                    <li key={item}>
                      <CheckCircle2 size={15} />
                      {item}
                    </li>
                  ))}
                </ul>
              </article>
              <article className="learning-card">
                <h3>Quick drill</h3>
                <p>
                  <strong>{drill?.title}</strong>
                </p>
                <p>{drill?.prompt}</p>
                <button className="link-button" onClick={() => setMode("drill")}>
                  Open drill →
                </button>
              </article>
            </div>
          )}

          {mode === "drill" && drill && (
            <div className="case-lab">
              <DrillApproachScaffold
                defaultOpen={level !== "advanced"}
              />
              <div className="case-intro">
                <span className="pill">{drill.title}</span>
                <p>{drill.prompt}</p>
              </div>
              {steps.length > 0 && (
                <>
                  <div className="stepper">
                    {steps.map((step, index) => (
                      <button
                        key={step.id}
                        className={cx(
                          activeStepIndex === index && "is-active",
                          (answers[`${skill.id}:${step.id}`] ?? "").trim() && "is-done",
                        )}
                        onClick={() => setActiveStepIndex(index)}
                      >
                        {(answers[`${skill.id}:${step.id}`] ?? "").trim() ? (
                          <Check size={14} />
                        ) : (
                          index + 1
                        )}
                        {step.title}
                      </button>
                    ))}
                  </div>
                  <label className="field-label coach-question">
                    {activeStep.question}
                    <textarea
                      value={currentAnswer}
                      onChange={(event) => updateAnswer(event.target.value)}
                      placeholder="Write your answer first. Mention constraints, trade-offs, and failure behavior."
                    />
                  </label>
                  <div className="coach-grid">
                    <div className="outcome-box">
                      <Lightbulb size={18} />
                      <div>
                        <strong>Hint</strong>
                        <span>{activeStep.hint}</span>
                      </div>
                    </div>
                    <div className="reference-box">
                      <div>
                        <Eye size={17} />
                        <strong>Compare with reference</strong>
                      </div>
                      {currentAnswer.trim() ? (
                        <p>{activeStep.reference}</p>
                      ) : (
                        <p className="muted">
                          Write an attempt to unlock the reference answer.
                        </p>
                      )}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {mode === "bug" && skill.bugScenario && (
            <div className="bug-lab">
              <article className="learning-card danger-card">
                <p className="eyebrow">Flawed thinking</p>
                <h3>{skill.bugScenario.title}</h3>
                <p>{skill.bugScenario.flawed}</p>
              </article>
              <div className="roadmap-grid">
                <article className="learning-card">
                  <h3>Bugs to find</h3>
                  <ul className="clean-list">
                    {skill.bugScenario.bugs.map((bug) => (
                      <li key={bug}>
                        <AlertTriangle size={15} />
                        {bug}
                      </li>
                    ))}
                  </ul>
                </article>
                <article className="learning-card">
                  <h3>Path forward</h3>
                  <p>{skill.bugScenario.fix}</p>
                </article>
              </div>
            </div>
          )}
        </section>
      </section>

      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">The loop</p>
            <h2>Same order every time. Repeat across systems.</h2>
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

      <VaultMap />
    </div>
  );
}
