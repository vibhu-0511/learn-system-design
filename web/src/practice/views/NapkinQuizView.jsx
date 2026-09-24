import { useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { NAPKIN_QUESTIONS } from "../data/napkinQuiz.js";
import { gradeAnswer } from "../lib/napkinCheck.js";
import { SourceNoteLink } from "../../library/SourceNoteLink.jsx";

function stableShuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function NapkinQuizView({ onExit, onOpenNote }) {
  const [questions] = useState(() => stableShuffle(NAPKIN_QUESTIONS));
  const [idx, setIdx] = useState(0);
  const [input, setInput] = useState("");
  const [result, setResult] = useState(null);
  const [results, setResults] = useState([]);
  const [done, setDone] = useState(false);

  const q = questions[idx];

  const check = () => {
    const r = gradeAnswer(input, q.expected);
    setResult({ ...r, expected: q.expected, explanation: q.explanation, citation: q.citation });
  };

  const next = () => {
    setResults((prev) => [...prev, result]);
    if (idx + 1 >= questions.length) {
      const all = [...results, result];
      const counts = { "spot-on": 0, close: 0, off: 0, invalid: 0 };
      for (const r of all) counts[r.grade] = (counts[r.grade] || 0) + 1;
      const best = JSON.parse(localStorage.getItem("hld-napkin-best") || "null");
      if (!best || counts["spot-on"] > (best.spotOn || 0)) {
        localStorage.setItem("hld-napkin-best", JSON.stringify({
          spotOn: counts["spot-on"], close: counts.close, off: counts.off, at: new Date().toISOString(),
        }));
      }
      setDone(true);
      return;
    }
    setIdx((i) => i + 1);
    setInput("");
    setResult(null);
  };

  const restart = () => {
    setIdx(0);
    setInput("");
    setResult(null);
    setResults([]);
    setDone(false);
  };

  if (done) {
    const all = [...results];
    const counts = { "spot-on": 0, close: 0, off: 0 };
    for (const r of all) {
      if (r.grade in counts) counts[r.grade]++;
    }
    return (
      <div className="stack">
        <section className="panel">
          <p className="eyebrow">Napkin Math Quiz — Results</p>
          <h2>You finished all {questions.length} questions</h2>
          <div className="napkin-summary">
            <div className="napkin-grade spot-on"><strong>{counts["spot-on"]}</strong>Spot-on</div>
            <div className="napkin-grade close"><strong>{counts.close}</strong>Close</div>
            <div className="napkin-grade off"><strong>{counts.off}</strong>Off</div>
          </div>
          <div className="button-row">
            <button className="primary-cta" onClick={restart}><RotateCcw size={14} /> Try again</button>
            <button onClick={onExit}>Back to drills</button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="stack">
      <section className="panel">
        <button className="link-button" onClick={onExit}>Back to drills</button>
        <p className="eyebrow">Question {idx + 1} / {questions.length}</p>
        <h2>{q.prompt}</h2>
        <label className="field-label">
          Your estimate ({q.unit})
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={`e.g. 5800 or 5.8k`}
            onKeyDown={(e) => { if (e.key === "Enter" && !result) check(); }}
          />
        </label>
        {!result ? (
          <button className="primary-cta" onClick={check} disabled={!input.trim()}>
            Check <ArrowRight size={14} />
          </button>
        ) : (
          <div className="stack">
            <div className={`napkin-grade ${result.grade}`}>
              {result.grade === "spot-on" && "Spot-on! "}
              {result.grade === "close" && "Close — right order of magnitude. "}
              {result.grade === "off" && "Off — more than 10× away. "}
              {result.grade === "invalid" && "Couldn't parse that input. "}
              Expected: {result.expected.toLocaleString()} {q.unit}
            </div>
            <p>{result.explanation}</p>
            <SourceNoteLink path={result.citation} onOpenNote={onOpenNote} />
            <button className="primary-cta" onClick={next}>
              {idx + 1 >= questions.length ? "See results" : "Next"} <ArrowRight size={14} />
            </button>
          </div>
        )}
      </section>
    </div>
  );
}
