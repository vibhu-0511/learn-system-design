import { useEffect, useMemo, useState } from "react";
import { Search, FolderOpen, BookOpen } from "lucide-react";
import {
  VAULT_INDEX,
  VAULT_NOTES,
  VAULT_TOTALS,
} from "./vaultIndex.js";
import { NoteReader } from "./NoteReader.jsx";

const FOLDER_LABEL = {
  _root: "Root notes",
  "01_fundamentals": "Fundamentals",
  "02_building_blocks": "Building Blocks",
  "03_design_patterns": "Design Patterns",
  "04_system_evolutions": "System Evolutions",
  "05_case_studies": "Case Studies",
  "06_trade_offs": "Trade-offs",
  "07_interview_framework": "Interview Framework",
  "08_reference": "Reference",
  "09_real_outages": "Real Outages",
  "10_hld": "HLD Thinking",
  "11_lld": "LLD",
  "12_hld_lld_bridge": "HLD/LLD Bridge",
  "13_interview_prep": "Interview Prep",
  "14_real_projects": "Real Projects",
  "15_intermediate_topics": "Intermediate",
  "16_java_deep_dive": "Java Deep Dive",
  "17_company_interview_guide": "Company Guides",
  "18_real_world_architecture": "Real-World Architectures",
};

function folderLabel(folder) {
  return FOLDER_LABEL[folder] || folder;
}

export function LibraryView({ activeNotePath, onOpenNote, theme }) {
  const initialFolder = activeNotePath
    ? VAULT_NOTES[activeNotePath]?.folder
    : VAULT_INDEX.folders.find((f) => f.folder === "10_hld")?.folder ||
      VAULT_INDEX.folders[0]?.folder;
  const [openFolder, setOpenFolder] = useState(initialFolder);
  const [query, setQuery] = useState("");

  useEffect(() => {
    if (activeNotePath) {
      const folder = VAULT_NOTES[activeNotePath]?.folder;
      if (folder && folder !== openFolder) setOpenFolder(folder);
    }
  }, [activeNotePath]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return null;
    const matches = [];
    for (const note of Object.values(VAULT_NOTES)) {
      const haystack = `${note.title} ${note.tags.join(" ")} ${note.intuition || ""} ${note.headings.map((h) => h.text).join(" ")}`.toLowerCase();
      if (haystack.includes(q)) matches.push(note);
    }
    matches.sort((a, b) => a.title.localeCompare(b.title));
    return matches.slice(0, 60);
  }, [query]);

  const folderNotes = useMemo(() => {
    if (searchResults) return searchResults;
    return Object.values(VAULT_NOTES)
      .filter((note) => note.folder === openFolder)
      .sort((a, b) => a.title.localeCompare(b.title));
  }, [openFolder, searchResults]);

  return (
    <main className="library-layout">
      <aside className="panel library-sidebar">
        <div className="library-header">
          <div>
            <p className="eyebrow">Library</p>
            <h2>{VAULT_TOTALS.noteCount} notes</h2>
          </div>
          <span className="pill">
            {VAULT_TOTALS.flagged} flagged
          </span>
        </div>

        <label className="searchbox">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, tag, intuition..."
          />
        </label>

        {!searchResults && (
          <nav className="folder-tree" aria-label="Folders">
            {VAULT_INDEX.folders.map((folder) => (
              <button
                key={folder.folder}
                className={`folder-tree-item ${openFolder === folder.folder ? "is-active" : ""}`}
                onClick={() => setOpenFolder(folder.folder)}
                title={folder.folder}
              >
                <FolderOpen size={14} />
                <span>{folderLabel(folder.folder)}</span>
                <small>{folder.noteCount}</small>
              </button>
            ))}
          </nav>
        )}

        <div className="note-list">
          <p className="eyebrow note-list-label">
            {searchResults
              ? `${folderNotes.length} matches`
              : folderLabel(openFolder)}
          </p>
          {folderNotes.map((note) => (
            <button
              key={note.path}
              className={`note-list-item ${activeNotePath === note.path ? "is-active" : ""}`}
              onClick={() => onOpenNote(note.path)}
              title={note.path}
            >
              <strong>{note.title}</strong>
              <small>
                {searchResults ? folderLabel(note.folder) : note.type}
                {" · "}
                {note.wordCount.toLocaleString()} w
              </small>
              {note.reliability.flags.length > 0 && (
                <span
                  className="flag-dot"
                  title={note.reliability.flags.join(", ")}
                />
              )}
            </button>
          ))}
          {folderNotes.length === 0 && (
            <div className="empty-state">
              <BookOpen size={20} />
              <p>{searchResults ? "No notes match your search." : "Folder is empty."}</p>
            </div>
          )}
        </div>
      </aside>

      <section className="panel reader-pane">
        <NoteReader
          notePath={activeNotePath}
          theme={theme}
          onOpenNote={onOpenNote}
        />
      </section>
    </main>
  );
}
