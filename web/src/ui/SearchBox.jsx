import { useEffect, useId, useState } from "react";
import { Search } from "lucide-react";
import { href, navigate } from "../router.js";
import { search } from "../course/courseData.js";

// The vault index is ~900 KB, so it loads on first focus, never in the initial bundle.
let vaultNotes = null;
const loadNotes = () => (vaultNotes ??= import("../library/vaultIndex.js").then((m) => Object.values(m.VAULT_NOTES)));

export function SearchBox() {
  const [query, setQuery] = useState("");
  const [notes, setNotes] = useState([]);
  const [active, setActive] = useState(0);
  const [open, setOpen] = useState(false);
  const listId = useId();

  useEffect(() => {
    if (open) loadNotes().then(setNotes);
  }, [open]);

  const q = query.trim().toLowerCase();
  const items = q
    ? [
        ...search(q, 6).map((c) => ({ key: c.id, label: c.title, tag: c.id, to: { name: "lesson", params: { id: c.id } } })),
        ...notes
          .filter((n) => n.title.toLowerCase().includes(q))
          .slice(0, 6)
          .map((n) => ({ key: n.path, label: n.title, tag: "note", to: { name: "library", params: { path: n.path } } })),
      ]
    : [];

  const go = (item) => {
    navigate(item.to);
    setOpen(false);
    setQuery("");
  };
  const onKeyDown = (e) => {
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (items.length ? (a + (e.key === "ArrowDown" ? 1 : items.length - 1)) % items.length : 0));
    } else if (e.key === "Enter" && items[active]) go(items[active]);
    else if (e.key === "Escape") setOpen(false);
  };

  return (
    <div className="search" onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setOpen(false)}>
      <label className="field">
        <Search size={16} aria-hidden="true" />
        <input
          type="search"
          role="combobox"
          aria-expanded={open && q !== ""}
          aria-controls={listId}
          aria-activedescendant={items[active] ? `${listId}-${active}` : undefined}
          aria-label="Search chapters and notes"
          placeholder="Search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setActive(0);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
      </label>
      {open && q !== "" && (
        <ul className="glass search-pop" id={listId} role="listbox" aria-label="Search results">
          {items.map((it, i) => (
            <li key={it.key} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
              <a href={href(it.to)} tabIndex={-1} onMouseDown={(e) => e.preventDefault()} onClick={() => go(it)}>
                <span className="mono">{it.tag}</span> {it.label}
              </a>
            </li>
          ))}
          {items.length === 0 && <li className="muted" style={{ padding: "7px 8px", fontSize: 14 }}>No matches.</li>}
        </ul>
      )}
    </div>
  );
}
