import { Bug, Flame, Layers, Pencil } from "lucide-react";
import { href } from "../../router.js";

// Cards link into the practice tools by id. The full tools (and their titles) arrive when
// the gym is ported, so for now each card shows the id in words.
const KINDS = [
  { field: "outageRefs", tool: "outage", label: "Outage replay", Icon: Flame },
  { field: "bugScenarioIds", tool: "bugs", label: "Bug hunt", Icon: Bug },
  { field: "drillCaseIds", tool: "drill", label: "Design drill", Icon: Pencil },
  { field: "terms", tool: "vocab", label: "Flashcard", Icon: Layers },
];

const humanize = (id) => {
  const words = id.replace(/[_-]/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export default function PracticeTab({ chapter }) {
  const cards = KINDS.flatMap(({ field, tool, label, Icon }) =>
    (chapter[field] ?? []).map((id) => ({ key: `${field}:${id}`, tool, label, Icon, id })),
  );

  if (cards.length === 0) return <p className="muted">No practice items are linked to this chapter yet.</p>;

  return (
    <div>
      <div className="cards">
        {cards.map(({ key, tool, label, Icon, id }) => (
          <a key={key} className="glass card" href={href({ name: "practice", params: { tool, itemId: id } })}>
            <Icon size={18} aria-hidden="true" />
            <small>{label}</small>
            <b>{humanize(id)}</b>
          </a>
        ))}
      </div>
      <p className="muted">The practice tools are being ported next, so these links open a placeholder until then.</p>
    </div>
  );
}
