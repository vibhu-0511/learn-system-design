import { useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  Bug,
  ClipboardList,
  Flame,
  Folder,
  Plus,
  Search,
  Trash2,
  Wrench,
} from "lucide-react";
import {
  createWorkspace,
  deleteWorkspace,
  statusOf,
  useWorkspaces,
} from "../data/workspaces.js";
import { getCase } from "../data/drillCases.js";
import { getReplay } from "../data/outageReplays.js";
import { getBugScenario } from "../data/bugScenarios.js";

const KIND_LABEL = {
  drill: "Drill",
  review: "System review",
  outage: "Outage replay",
  bugfinder: "Bug Finder",
  failure: "Failure drill",
  note: "Note",
};

const KIND_ICON = {
  drill: Wrench,
  review: ClipboardList,
  outage: AlertTriangle,
  bugfinder: Bug,
  failure: Flame,
  note: Folder,
};

function formatTime(iso) {
  if (!iso) return "—";
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "—";
  const now = new Date();
  const diffMs = now - date;
  const minutes = Math.floor(diffMs / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
}

export function WorkspacesView({ onOpenWorkspace, onJumpToTab }) {
  const { workspaces } = useWorkspaces();
  const [query, setQuery] = useState("");

  const filtered = workspaces.filter((w) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    const hay = `${w.name} ${w.kind} ${(w.tags || []).join(" ")}`.toLowerCase();
    return hay.includes(q);
  });

  const inProgress = filtered.filter((w) => statusOf(w) === "in-progress");
  const completed = filtered.filter((w) => statusOf(w) === "completed");

  const handleCreateReview = () => {
    const ws = createWorkspace({
      name: "New system review",
      kind: "review",
      review: { systemName: "", brief: "" },
    });
    onOpenWorkspace?.(ws);
  };

  const handleDelete = (workspace) => {
    if (!confirm(`Delete "${workspace.name}"? This cannot be undone.`)) return;
    deleteWorkspace(workspace.id);
  };

  return (
    <div className="stack">
      <section className="panel workspaces-hero">
        <div>
          <p className="eyebrow">
            <Folder size={13} /> Workspaces
          </p>
          <h1>Every analysis you've started, in one place.</h1>
          <p>
            Workspaces persist your work across sessions. Drill cases create
            workspaces automatically. You can also start a free-form review of
            a real system here.
          </p>
        </div>
        <div className="workspaces-actions">
          <button className="primary-cta" onClick={handleCreateReview}>
            <Plus size={14} />
            New system review
          </button>
          <button
            className="secondary-cta"
            onClick={() => onJumpToTab?.("drill")}
          >
            <Wrench size={14} />
            Browse drill cases
          </button>
        </div>
      </section>

      <section className="panel">
        <label className="searchbox">
          <Search size={16} />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name or tag..."
          />
        </label>

        {workspaces.length === 0 ? (
          <div className="empty-state">
            <Folder size={28} />
            <p>
              No workspaces yet. Start a drill case or create a system review.
            </p>
          </div>
        ) : null}

        {inProgress.length > 0 && (
          <div className="workspace-section">
            <h3>In progress ({inProgress.length})</h3>
            <ul className="workspace-list">
              {inProgress.map((w) => (
                <WorkspaceRow
                  key={w.id}
                  workspace={w}
                  onOpen={() => onOpenWorkspace?.(w)}
                  onDelete={() => handleDelete(w)}
                />
              ))}
            </ul>
          </div>
        )}

        {completed.length > 0 && (
          <div className="workspace-section">
            <h3>Completed ({completed.length})</h3>
            <ul className="workspace-list">
              {completed.map((w) => (
                <WorkspaceRow
                  key={w.id}
                  workspace={w}
                  onOpen={() => onOpenWorkspace?.(w)}
                  onDelete={() => handleDelete(w)}
                />
              ))}
            </ul>
          </div>
        )}

        {filtered.length === 0 && workspaces.length > 0 && (
          <div className="empty-state">
            <p>No workspaces match your search.</p>
          </div>
        )}
      </section>
    </div>
  );
}

function WorkspaceRow({ workspace, onOpen, onDelete }) {
  const Icon = KIND_ICON[workspace.kind] || Folder;
  const drillCase =
    workspace.kind === "drill" ? getCase(workspace.caseId) : null;
  const outageReplay =
    workspace.kind === "outage" ? getReplay(workspace.outageId) : null;
  const bugScenario =
    workspace.kind === "bugfinder" ? getBugScenario(workspace.scenarioId) : null;

  let progress = null;
  if (workspace.kind === "drill" && workspace.drill) {
    const componentCount = workspace.drill.components?.length || 0;
    const constraintCount = Object.values(workspace.drill.constraints || {}).filter(Boolean)
      .length;
    progress = `${constraintCount}/8 constraints, ${componentCount} components`;
  } else if (workspace.kind === "review" && workspace.review) {
    const briefLen = (workspace.review.brief || "").length;
    progress = briefLen ? `${briefLen} chars` : "empty brief";
  } else if (workspace.kind === "outage" && workspace.outage) {
    const attemptCount = workspace.outage.attempts?.length || 0;
    const inFlight = workspace.outage.currentAttempt ? " · attempt in progress" : "";
    progress = `${attemptCount} attempt${attemptCount === 1 ? "" : "s"}${inFlight}`;
  } else if (workspace.kind === "bugfinder" && workspace.bugfinder) {
    const attemptCount = workspace.bugfinder.attempts?.length || 0;
    const inFlight = workspace.bugfinder.currentAttempt ? " · hunt in progress" : "";
    progress = `${attemptCount} hunt${attemptCount === 1 ? "" : "s"}${inFlight}`;
  }

  const subType = drillCase
    ? drillCase.difficulty
    : outageReplay
    ? `${outageReplay.year} · ${outageReplay.difficulty}`
    : bugScenario
    ? bugScenario.difficulty
    : null;

  return (
    <li className="workspace-row">
      <button className="workspace-row-main" onClick={onOpen}>
        <span className="workspace-row-icon">
          <Icon size={16} />
        </span>
        <div>
          <strong>{workspace.name}</strong>
          <small>
            {KIND_LABEL[workspace.kind] || workspace.kind}
            {subType ? ` · ${subType}` : ""}
            {progress ? ` · ${progress}` : ""}
            {" · "}
            updated {formatTime(workspace.updatedAt)}
          </small>
        </div>
        <ArrowRight size={14} />
      </button>
      <button
        className="icon-button"
        onClick={onDelete}
        title="Delete workspace"
      >
        <Trash2 size={14} />
      </button>
    </li>
  );
}
