import { useState } from "react";
import { ChevronDown, ChevronRight, Map } from "lucide-react";

const STEPS = [
  {
    id: "restate",
    title: "Restate the prompt",
    body: "What is the user actually doing? What does success look like? Write one sentence — no jargon.",
  },
  {
    id: "constraints",
    title: "State 3–5 constraints",
    body: "Even guessed numbers beat none. Try: QPS (avg + peak), latency target, item size, consistency need, team size, monthly budget.",
  },
  {
    id: "paths",
    title: "Sketch the request paths",
    body: "Read path: client → ? → ? → response. Write path: client → ? → ? → confirmation. Async path (if any): event → ? → consumer.",
  },
  {
    id: "components",
    title: "List components, defend each",
    body: "For every box you draw, write one sentence: \"This removes <bottleneck or risk>.\" Empty justification = wrong box.",
  },
  {
    id: "failures",
    title: "Name one failure mode per component",
    body: "What if this is slow / dead / partitioned / dropping 1% / dropping 50%? Don't draw happy paths only.",
  },
  {
    id: "tradeoffs",
    title: "Compare two trade-offs",
    body: "Pick two decisions and steelman the alternative. \"SQL because X; would flip to NoSQL if Y.\" That's an architect answer.",
  },
];

export function DrillApproachScaffold({ defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className={`drill-scaffold ${open ? "is-open" : ""}`}>
      <button className="drill-scaffold-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <Map size={14} />
        <strong>How to approach this</strong>
        <span className="muted">
          {open ? "(hide)" : "(show 6-step recipe)"}
        </span>
      </button>
      {open && (
        <ol className="drill-scaffold-list">
          {STEPS.map((step, i) => (
            <li key={step.id}>
              <span className="drill-scaffold-num">{i + 1}</span>
              <div>
                <strong>{step.title}</strong>
                <p>{step.body}</p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
