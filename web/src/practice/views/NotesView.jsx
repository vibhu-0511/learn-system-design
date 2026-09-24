import { useEffect, useState } from "react";
import { Plus, Save, Search, Trash2 } from "lucide-react";
import { NOTE_TEMPLATES, LEARNING_PHASES } from "../data/learning.js";
import { useLocal } from "../../store.js";

export function NotesView() {
  const [notes, setNotes] = useLocal("hld-personal-notes", () => [
    {
      id: crypto.randomUUID(),
      title: "My first HLD note",
      body: NOTE_TEMPLATES["Learning Note"].body,
      tags: "learning, phase-0",
      attachment: "phase-0",
      updatedAt: new Date().toISOString(),
    },
  ]);
  const [selectedId, setSelectedId] = useState(notes[0]?.id ?? null);
  const [query, setQuery] = useState("");
  const [templateName, setTemplateName] = useState("Learning Note");
  const selectedNote = notes.find((note) => note.id === selectedId) ?? notes[0] ?? null;

  useEffect(() => {
    if (!selectedId && notes[0]) setSelectedId(notes[0].id);
  }, [notes, selectedId]);

  const filteredNotes = notes.filter((note) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [note.title, note.body, note.tags, note.attachment].some((value) =>
      (value ?? "").toLowerCase().includes(q),
    );
  });

  const updateSelectedNote = (patch) => {
    if (!selectedNote) return;
    setNotes((prev) =>
      prev.map((note) =>
        note.id === selectedNote.id ? { ...note, ...patch, updatedAt: new Date().toISOString() } : note,
      ),
    );
  };

  const createNote = () => {
    const template = NOTE_TEMPLATES[templateName];
    const note = {
      id: crypto.randomUUID(),
      title: template.title,
      body: template.body,
      tags: templateName.toLowerCase().replaceAll(" ", "-"),
      attachment: "general",
      updatedAt: new Date().toISOString(),
    };
    setNotes((prev) => [note, ...prev]);
    setSelectedId(note.id);
  };

  const deleteNote = () => {
    if (!selectedNote) return;
    const nextNote = notes.find((note) => note.id !== selectedNote.id);
    setNotes((prev) => prev.filter((note) => note.id !== selectedNote.id));
    setSelectedId(nextNote?.id ?? null);
  };

  return (
    <div className="stack">
      <section className="panel">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Personal Notes</p>
            <h2>Capture your own HLD thinking while you practice.</h2>
          </div>
          <span className="pill">{notes.length} local notes</span>
        </div>
        <p className="muted">Notes are saved in this browser's localStorage. They stay local to this machine/browser profile.</p>
      </section>

      <section className="notes-layout">
        <aside className="panel notes-sidebar">
          <label className="searchbox">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search notes..." />
          </label>
          <div className="notes-create-row">
            <select value={templateName} onChange={(event) => setTemplateName(event.target.value)}>
              {Object.keys(NOTE_TEMPLATES).map((name) => (
                <option key={name}>{name}</option>
              ))}
            </select>
            <button onClick={createNote}>
              <Plus size={15} />
              New
            </button>
          </div>
          <div className="notes-list">
            {filteredNotes.map((note) => (
              <button
                key={note.id}
                className={selectedNote?.id === note.id ? "is-active" : ""}
                onClick={() => setSelectedId(note.id)}
              >
                <strong>{note.title || "Untitled note"}</strong>
                <span>{note.tags || "no tags"}</span>
              </button>
            ))}
            {filteredNotes.length === 0 && <div className="empty-state">No notes match your search.</div>}
          </div>
        </aside>

        <section className="panel note-editor">
          {selectedNote ? (
            <>
              <div className="note-editor-actions">
                <span>
                  <Save size={15} />
                  Saved locally
                </span>
                <button onClick={deleteNote}>
                  <Trash2 size={15} />
                  Delete
                </button>
              </div>
              <label className="field-label">
                Title
                <input
                  value={selectedNote.title}
                  onChange={(event) => updateSelectedNote({ title: event.target.value })}
                  placeholder="Note title"
                />
              </label>
              <div className="notes-meta-grid">
                <label className="field-label">
                  Tags
                  <input
                    value={selectedNote.tags}
                    onChange={(event) => updateSelectedNote({ tags: event.target.value })}
                    placeholder="phase-2, checkout, idempotency"
                  />
                </label>
                <label className="field-label">
                  Attach to
                  <select
                    value={selectedNote.attachment}
                    onChange={(event) => updateSelectedNote({ attachment: event.target.value })}
                  >
                    <option value="general">General</option>
                    {LEARNING_PHASES.map((phaseItem) => (
                      <option key={phaseItem.id} value={phaseItem.id}>
                        Phase {phaseItem.number}: {phaseItem.title}
                      </option>
                    ))}
                    <option value="case">Case exercise</option>
                    <option value="bug">Bug scenario</option>
                    <option value="proposal">Founder proposal</option>
                  </select>
                </label>
              </div>
              <label className="field-label">
                Body
                <textarea
                  className="note-body"
                  value={selectedNote.body}
                  onChange={(event) => updateSelectedNote({ body: event.target.value })}
                  placeholder="Write markdown-style notes here..."
                />
              </label>
              <div className="note-preview">
                <p className="eyebrow">Preview</p>
                <pre>{selectedNote.body}</pre>
              </div>
            </>
          ) : (
            <div className="empty-state">Create a note to start writing.</div>
          )}
        </section>
      </section>
    </div>
  );
}

