import { Bug, Flame, Layers, Pencil } from "lucide-react";
import { href } from "../../router.js";

// Cards link into the practice tools by id. The extractor resolved each title from the gym data,
// so a chapter's meta.json only lists ids.
const KINDS = {
  outage: { label: "Outage replay", Icon: Flame },
  bugs: { label: "Bug hunt", Icon: Bug },
  drill: { label: "Design drill", Icon: Pencil },
  vocab: { label: "Flashcard", Icon: Layers },
};

export default function PracticeTab({ chapter }) {
  if (chapter.practice.length === 0) return <p className="muted">No practice items are linked to this chapter yet.</p>;

  return (
    <div className="cards">
      {chapter.practice.map(({ kind, id, title }) => {
        const { label, Icon } = KINDS[kind];
        return (
          <a key={`${kind}:${id}`} className="glass card" href={href({ name: "practice", params: { tool: kind, itemId: id } })}>
            <Icon size={18} aria-hidden="true" />
            <small>{label}</small>
            <b>{title}</b>
          </a>
        );
      })}
    </div>
  );
}
