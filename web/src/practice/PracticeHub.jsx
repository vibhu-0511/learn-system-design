import { BookOpen, Briefcase, Bug, Calculator, ClipboardCheck, Compass, FileText, Flame, Gauge, Pencil, RefreshCw, StickyNote, Sun, Zap } from "lucide-react";
import { href } from "../router.js";

// The gym's tools. `id` is the URL segment: #/practice/<id>/<item?>.
export const TOOLS = [
  { id: "today", label: "Today", desc: "Daily drill, outage, term and streak", Icon: Sun },
  { id: "skills", label: "Skills", desc: "The ten architect behaviors", Icon: Compass },
  { id: "drill", label: "Design drill", desc: "12 cases, kata and interview modes", Icon: Pencil },
  { id: "napkin", label: "Napkin math", desc: "Estimate by order of magnitude", Icon: Calculator },
  { id: "bugs", label: "Bug finder", desc: "Find the real flaws among decoys", Icon: Bug },
  { id: "outage", label: "Outage replay", desc: "25 real outages: predict, then reveal", Icon: Flame },
  { id: "failure", label: "Failure injection", desc: "Break a component, predict the cascade", Icon: Zap },
  { id: "capacity", label: "Capacity lab", desc: "Storage, traffic flow, bottlenecks", Icon: Gauge },
  { id: "workspaces", label: "Workspaces", desc: "Everything you started, resumable", Icon: Briefcase },
  { id: "review-queue", label: "Review queue", desc: "Spaced repetition over terms and outages", Icon: RefreshCw },
  { id: "review", label: "Review a system", desc: "Paste a brief, get findings", Icon: ClipboardCheck },
  { id: "proposal", label: "Proposal", desc: "Turn findings into a recommendation", Icon: FileText },
  { id: "notes", label: "Notes", desc: "Your own notes and templates", Icon: StickyNote },
  { id: "vocab", label: "Vocabulary", desc: "Terms and flashcards", Icon: BookOpen },
];

export default function PracticeHub() {
  return (
    <div className="hub">
      <h1 className="h1">Practice</h1>
      <p className="hub-lead">Every tool from the original gym. Chapters link into these by id.</p>
      <div className="hub-grid">
        {TOOLS.map(({ id, label, desc, Icon }) => (
          <a key={id} className="glass hub-card" href={href({ name: "practice", params: { tool: id } })}>
            <Icon size={20} aria-hidden="true" />
            <b>{label}</b>
            <span>{desc}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
