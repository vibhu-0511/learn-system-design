import { ArrowLeft } from "lucide-react";
import { href, navigate } from "../router.js";
import { useLocal } from "../store.js";
import PracticeHub, { TOOLS } from "./PracticeHub.jsx";
import { LevelPicker } from "./views/LevelPicker.jsx";
import { StarterPathToday } from "./views/StarterPathToday.jsx";
import { TodayView } from "./views/TodayView.jsx";
import { SkillsView } from "./views/SkillsView.jsx";
import { DrillView } from "./views/DrillView.jsx";
import { NapkinQuizView } from "./views/NapkinQuizView.jsx";
import { BugFinderView } from "./views/BugFinderView.jsx";
import { OutageReplayView } from "./views/OutageReplayView.jsx";
import { FailureDrillView } from "./views/FailureDrillView.jsx";
import { CapacityLabView } from "./views/CapacityLabView.jsx";
import { WorkspacesView } from "./views/WorkspacesView.jsx";
import { ReviewQueueView } from "./views/ReviewQueueView.jsx";
import { ReviewView } from "./views/ReviewView.jsx";
import { ProposalView } from "./views/ProposalView.jsx";
import { NotesView } from "./views/NotesView.jsx";
import { VocabView } from "./views/VocabView.jsx";
import "./practice.css";

// The old app named this tab "bugfinder"; the URL says "bugs".
const TAB_ALIASES = { bugfinder: "bugs" };

// Adapts the old tab-based app to URLs. The ported views keep their original props
// (callbacks and "active id"); this turns each callback into navigation and each
// active id into the item segment of #/practice/<tool>/<item>.
export default function PracticeRoute({ route, theme }) {
  const { tool, itemId } = route.params;
  const legacyTheme = theme === "dusk" ? "dark" : "light"; // the views and Excalidraw expect light | dark

  const [level, setLevel] = useLocal("hld-level", null);
  const [starter, setStarter] = useLocal("hld-starter-progress", { completedLessons: [] });
  const [draft, setDraft] = useLocal("lsd-review-draft", { text: "", name: "" });

  if (!tool) return <PracticeHub />;
  const current = TOOLS.find((t) => t.id === tool);
  if (!current) {
    return (
      <section className="glass error-card">
        <h2 style={{ margin: 0, color: "var(--ink)" }}>No practice tool "{tool}"</h2>
        <a className="pbtn" href={href({ name: "practice", params: {} })}>
          Back to practice
        </a>
      </section>
    );
  }

  const go = (t, item) => navigate({ name: "practice", params: { tool: t, itemId: item || undefined } });
  const openNote = (path) => navigate({ name: "library", params: { path } });
  const jump = (t) => (t === "library" ? navigate({ name: "library", params: {} }) : go(TAB_ALIASES[t] ?? t));
  const openWorkspace = (w) => {
    if (!w) return;
    if (w.kind === "drill" && w.caseId) go("drill", w.caseId);
    else if (w.kind === "outage" && w.outageId) go("outage", w.outageId);
    else if (w.kind === "bugfinder" && w.scenarioId) go("bugs", w.scenarioId);
    else if (w.kind === "review") go("review");
    else if (w.kind === "failure") go("failure");
    else go("workspaces");
  };
  const markLessonComplete = (n) =>
    setStarter((cur) => {
      const done = cur?.completedLessons ?? [];
      return done.includes(n) ? cur : { completedLessons: [...done, n].sort((a, b) => a - b) };
    });
  const effectiveLevel = level ?? "practicing";

  let view;
  switch (tool) {
    case "today":
      view =
        level === null ? (
          <LevelPicker onPick={setLevel} />
        ) : level === "beginner" ? (
          <StarterPathToday completedLessons={starter?.completedLessons ?? []} onMarkComplete={markLessonComplete} onSkipToPracticing={() => setLevel("practicing")} onOpenNote={openNote} theme={legacyTheme} />
        ) : (
          <TodayView onOpenNote={openNote} onJumpToTab={jump} onSelectSkill={(id) => go("skills", id)} onOpenWorkspace={openWorkspace} onOpenOutageReplay={(id) => go("outage", id)} onOpenReview={() => go("review-queue")} />
        );
      break;
    case "skills":
      view = <SkillsView activeSkillId={itemId ?? null} onSelectSkill={(id) => go("skills", id)} onOpenNote={openNote} level={effectiveLevel} />;
      break;
    case "drill":
      view = <DrillView activeCaseId={itemId ?? null} onSelectCase={(id) => go("drill", id)} onOpenNote={openNote} theme={legacyTheme} level={effectiveLevel} onOpenNapkin={() => go("napkin")} />;
      break;
    case "napkin":
      view = <NapkinQuizView onExit={() => go("drill")} onOpenNote={openNote} />;
      break;
    case "bugs":
      view = <BugFinderView activeBugScenarioId={itemId ?? null} onSelectScenario={(id) => go("bugs", id)} onOpenNote={openNote} />;
      break;
    case "outage":
      view = <OutageReplayView activeOutageId={itemId ?? null} onSelectOutage={(id) => go("outage", id)} onOpenNote={openNote} theme={legacyTheme} />;
      break;
    case "failure":
      view = <FailureDrillView onOpenNote={openNote} />;
      break;
    case "capacity":
      view = <CapacityLabView activeWorkspaceId={itemId ?? null} onSelectWorkspace={(id) => go("capacity", id)} onOpenNote={openNote} onJumpToTab={jump} />;
      break;
    case "workspaces":
      view = <WorkspacesView onOpenWorkspace={openWorkspace} onJumpToTab={jump} />;
      break;
    case "review-queue":
      view = <ReviewQueueView onExit={() => go("today")} onOpenNote={openNote} />;
      break;
    case "review":
      view = <ReviewView reviewText={draft.text} setReviewText={(text) => setDraft((d) => ({ ...d, text }))} systemName={draft.name} setSystemName={(name) => setDraft((d) => ({ ...d, name }))} />;
      break;
    case "proposal":
      view = <ProposalView reviewText={draft.text} systemName={draft.name} />;
      break;
    case "notes":
      view = <NotesView />;
      break;
    default:
      // vocab: the item segment pre-fills the search box, so a chapter can link straight to a term.
      view = <VocabView key={itemId ?? ""} onOpenNote={openNote} initialSearch={itemId ?? ""} />;
  }

  return (
    <div className="legacy">
      <a className="chip practice-back" href={href({ name: "practice", params: {} })}>
        <ArrowLeft size={14} aria-hidden="true" /> Practice · {current.label}
      </a>
      {view}
    </div>
  );
}
