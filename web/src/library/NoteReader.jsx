import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowUpRight, FileText } from "lucide-react";
import { renderMarkdown, postProcess } from "./markdown.js";
import { loadNoteContent } from "./vaultLoader.js";
import {
  VAULT_NOTES,
  VAULT_BACKLINKS,
  getNote,
} from "./vaultIndex.js";

const titleIndex = (() => {
  const m = new Map();
  for (const [path, note] of Object.entries(VAULT_NOTES)) {
    m.set(note.title.toLowerCase(), path);
    m.set(note.filename.toLowerCase(), path);
  }
  return m;
})();

function resolveWikilink(target) {
  return titleIndex.get(target.toLowerCase()) ?? null;
}

const FLAG_LABELS = {
  "absolute-language": "absolutes",
  "vendor-heavy": "vendor-heavy",
  "long-unverified": "long",
};

const FLAG_TITLES = {
  "absolute-language":
    "Note uses many absolute words (always/never/must). Treat claims as drafts; verify against real systems.",
  "vendor-heavy":
    "Note is heavy on specific tool names. Watch for tool-bias and missing trade-offs.",
  "long-unverified":
    "Note is long. Spot-check rather than memorize; long LLM-written content drifts.",
};

export function NoteReader({ notePath, theme, onOpenNote }) {
  const note = notePath ? getNote(notePath) : null;
  const [body, setBody] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const containerRef = useRef(null);

  useEffect(() => {
    if (!notePath) {
      setBody(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    loadNoteContent(notePath)
      .then((content) => {
        if (cancelled) return;
        if (content == null) {
          setError("Note content not found. Try `npm run index:vault`.");
          setBody(null);
        } else {
          setBody(content);
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(String(err?.message || err));
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [notePath]);

  const html = useMemo(() => (body ? renderMarkdown(body) : ""), [body]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.innerHTML = html;
    if (html) {
      postProcess(container, theme);
      container.scrollTop = 0;
    }
  }, [html, theme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !onOpenNote) return;
    const handler = (event) => {
      const link = event.target.closest("a.wikilink");
      if (!link) return;
      event.preventDefault();
      const target = link.dataset.target;
      const resolved = resolveWikilink(target);
      if (resolved) onOpenNote(resolved);
    };
    container.addEventListener("click", handler);
    return () => container.removeEventListener("click", handler);
  }, [html, onOpenNote]);

  if (!notePath || !note) {
    return (
      <div className="reader-empty">
        <FileText size={32} />
        <p>Pick a note from the left to start reading.</p>
      </div>
    );
  }

  const backlinks = VAULT_BACKLINKS[notePath] ?? [];

  return (
    <article className="note-reader">
      <header className="note-reader-header">
        <p className="eyebrow">{note.folder}</p>
        <h1>{note.title}</h1>
        <div className="note-meta-row">
          {note.tags.length > 0 && (
            <div className="note-tags">
              {note.tags.slice(0, 8).map((tag) => (
                <span key={tag} className="note-tag">#{tag}</span>
              ))}
            </div>
          )}
          {note.reliability.flags.length > 0 && (
            <div className="note-flags">
              {note.reliability.flags.map((flag) => (
                <span
                  key={flag}
                  className={`note-flag flag-${flag}`}
                  title={FLAG_TITLES[flag] || flag}
                >
                  <AlertTriangle size={12} />
                  {FLAG_LABELS[flag] || flag}
                </span>
              ))}
            </div>
          )}
          <span className="note-meta-pill">{note.wordCount.toLocaleString()} words</span>
          {note.hasMermaid && <span className="note-meta-pill">diagrams</span>}
        </div>
      </header>

      {error && (
        <div className="reader-error">
          <AlertTriangle size={16} />
          {error}
        </div>
      )}

      {loading && !body && <div className="reader-loading">Loading note...</div>}

      <div className="markdown-body" ref={containerRef} />

      {backlinks.length > 0 && (
        <aside className="backlinks-panel">
          <h3>Linked from</h3>
          <ul>
            {backlinks.map((bl) => {
              const blNote = getNote(bl);
              if (!blNote) return null;
              return (
                <li key={bl}>
                  <button onClick={() => onOpenNote?.(bl)}>
                    <ArrowUpRight size={14} />
                    <span>{blNote.title}</span>
                    <small>{blNote.folder}</small>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
      )}
    </article>
  );
}
