import { useEffect, useMemo, useState } from "react";
import { Network, RefreshCw, Search, Shuffle } from "lucide-react";
import { ALL_TERMS, CATEGORIES } from "../data/terms.js";
import { SourceNoteLink } from "../../library/SourceNoteLink.jsx";
import { cx } from "../../ui/cx.js";

function stableShuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function TermCard({ term, expanded, onToggle, onOpenNote }) {
  return (
    <article className={cx("term-card", expanded && "is-expanded")} style={{ "--accent": term.color }}>
      <button className="term-card-button" onClick={onToggle}>
        <span className="term-category">{term.categoryLabel}</span>
        <strong>{term.term}</strong>
        <span className="expand-symbol">{expanded ? "Close" : "Open"}</span>
      </button>
      <p>{term.beginner}</p>
      {expanded && (
        <div className="term-details">
          {[
            ["What", term.what],
            ["When", term.when],
            ["Not when", term.notWhen],
            ["Cost / risk", term.cost],
            ["Example", term.example],
          ].map(([label, value]) => (
            <div key={label}>
              <span>{label}</span>
              <p>{value}</p>
            </div>
          ))}
          <div>
            <span>Source notes</span>
            <div className="term-source-notes">
              {term.sourceNotes.map((note) => (
                <SourceNoteLink key={note} path={note} onOpenNote={onOpenNote} />
              ))}
            </div>
          </div>
        </div>
      )}
    </article>
  );
}

function Flashcards({ terms }) {
  const [cards, setCards] = useState(() => stableShuffle(terms));
  const [idx, setIdx] = useState(0);
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setCards(stableShuffle(terms));
    setIdx(0);
    setFlipped(false);
  }, [terms]);

  const card = cards[idx];

  if (!card) {
    return <div className="empty-state">No cards match this filter.</div>;
  }

  const next = () => {
    setFlipped(false);
    setIdx((current) => (current + 1) % cards.length);
  };

  const previous = () => {
    setFlipped(false);
    setIdx((current) => (current - 1 + cards.length) % cards.length);
  };

  const reshuffle = () => {
    setCards(stableShuffle(terms));
    setIdx(0);
    setFlipped(false);
  };

  return (
    <section className="flashcard-wrap">
      <p className="muted">
        {idx + 1} / {cards.length}
      </p>
      <button className="flashcard" onClick={() => setFlipped((value) => !value)} style={{ "--accent": card.color }}>
        {!flipped ? (
          <>
            <span className="term-category">{card.categoryLabel}</span>
            <strong>{card.term}</strong>
            <small>Tap to reveal the beginner explanation</small>
          </>
        ) : (
          <div>
            <strong>{card.term}</strong>
            <p>{card.beginner}</p>
            <p>{card.when}</p>
          </div>
        )}
      </button>
      <div className="button-row">
        <button onClick={previous}>Previous</button>
        <button onClick={next}>Next</button>
        <button onClick={reshuffle}>
          <Shuffle size={15} />
          Shuffle
        </button>
      </div>
    </section>
  );
}

export function VocabView({ onOpenNote, initialSearch = "" }) {
  const [search, setSearch] = useState(initialSearch);
  const [selectedCat, setSelectedCat] = useState("All");
  const [expanded, setExpanded] = useState(null);
  const [mode, setMode] = useState("browse");

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return ALL_TERMS.filter((term) => {
      const categoryMatch = selectedCat === "All" || term.category === selectedCat;
      const searchMatch =
        !query ||
        [term.term, term.beginner, term.what, term.when, term.example].some((value) =>
          value.toLowerCase().includes(query),
        );
      return categoryMatch && searchMatch;
    });
  }, [search, selectedCat]);

  return (
    <div className="stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Vocabulary</p>
            <h2>Terms that explain decisions, not just definitions.</h2>
          </div>
          <span className="pill">{ALL_TERMS.length} curated terms</span>
        </div>

        <div className="toolbar">
          <label className="searchbox">
            <Search size={17} />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search cache, queue, idempotency..."
            />
          </label>
          <div className="segmented">
            {["browse", "flashcard"].map((item) => (
              <button
                key={item}
                className={mode === item ? "is-active" : ""}
                onClick={() => setMode(item)}
              >
                {item === "flashcard" ? <RefreshCw size={15} /> : <Network size={15} />}
                {item}
              </button>
            ))}
          </div>
        </div>

        <div className="filter-row">
          {["All", ...Object.keys(CATEGORIES)].map((category) => (
            <button
              key={category}
              className={selectedCat === category ? "is-active" : ""}
              onClick={() => setSelectedCat(category)}
            >
              {category === "BuildingBlocks" ? "Building Blocks" : category}
            </button>
          ))}
        </div>
      </section>

      {mode === "flashcard" ? (
        <Flashcards terms={filtered} />
      ) : (
        <section className="term-grid">
          {filtered.map((term) => (
            <TermCard
              key={term.term}
              term={term}
              expanded={expanded === term.term}
              onToggle={() => setExpanded(expanded === term.term ? null : term.term)}
              onOpenNote={onOpenNote}
            />
          ))}
          {filtered.length === 0 && <div className="empty-state">No terms match your search.</div>}
        </section>
      )}
    </div>
  );
}

