import { FileText } from "lucide-react";
import { getNote } from "./vaultIndex.js";

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function SourceNoteLink({ path, onOpenNote, label }) {
  const note = getNote(path);
  const display = label || (note ? note.title : path);
  const missing = !note;
  return (
    <button
      className={cx("source-note-link", missing && "is-missing")}
      onClick={() => !missing && onOpenNote?.(path)}
      title={missing ? `Not in vault index: ${path}` : path}
      disabled={missing}
    >
      <FileText size={12} />
      <span>{display}</span>
    </button>
  );
}
