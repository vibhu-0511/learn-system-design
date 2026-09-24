import { useState } from "react";
import { ArrowRight, RotateCcw } from "lucide-react";
import { getDueItems, recordReview } from "../lib/reviewQueue.js";
import { SourceNoteLink } from "../../library/SourceNoteLink.jsx";

export function ReviewQueueView({ onExit, onOpenNote }) {
  const [cards] = useState(() => getDueItems(new Date()));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  const card = cards[idx];

  if (!card) {
    return (
      <div className="stack">
        <section className="panel">
          <p className="eyebrow">Review Queue</p>
          <h2>All clear — come back tomorrow.</h2>
          <p className="muted">No cards due right now. Spaced repetition works best in short daily sessions.</p>
          <button className="primary-cta" onClick={onExit}>Back</button>
        </section>
      </div>
    );
  }

  const remaining = cards.length - idx;

  const handleRating = (rating) => {
    recordReview(card.id, rating, new Date());
    setFlipped(false);
    if (idx + 1 >= cards.length) {
      onExit();
      return;
    }
    setIdx((i) => i + 1);
  };

  return (
    <div className="stack">
      <section className="panel">
        <button className="link-button" onClick={onExit}>Back</button>
        <p className="eyebrow">Review · {remaining} remaining</p>
      </section>

      <section className="flashcard-wrap">
        <button className="flashcard" onClick={() => setFlipped(true)}>
          {!flipped ? (
            <>
              <span className="term-category">{card.kind}</span>
              <strong>{card.front}</strong>
              <small>Tap to reveal</small>
            </>
          ) : (
            <div>
              <strong>{card.front}</strong>
              <p style={{ whiteSpace: "pre-wrap" }}>{card.back}</p>
              {card.sourceNotes?.map((note) => (
                <SourceNoteLink key={note} path={note} onOpenNote={onOpenNote} />
              ))}
            </div>
          )}
        </button>

        {flipped && (
          <div className="button-row">
            <button onClick={() => handleRating("again")} style={{ color: "var(--danger-ink)" }}>
              <RotateCcw size={14} /> Again
            </button>
            <button onClick={() => handleRating("hard")}>Hard</button>
            <button onClick={() => handleRating("good")} className="primary-cta">Good</button>
            <button onClick={() => handleRating("easy")}>Easy</button>
          </div>
        )}
      </section>
    </div>
  );
}
