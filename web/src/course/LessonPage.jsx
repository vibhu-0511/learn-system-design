import { useEffect, useMemo, useState } from "react";
import { href } from "../router.js";
import { markVisited, readStored, writeStored } from "../store.js";
import { getChapter, neighbors, loadBody } from "./courseData.js";
import { loadSim, sanitizeParams } from "./loadSim.js";
import FramePlayer from "./FramePlayer.jsx";
import { HEROES } from "./heroes/index.js";
import LearnTab from "./tabs/LearnTab.jsx";
import SimulateTab from "./tabs/SimulateTab.jsx";
import CodeTab from "./tabs/CodeTab.jsx";
import PracticeTab from "./tabs/PracticeTab.jsx";
import DeepDiveTab from "./tabs/DeepDiveTab.jsx";
import "./course.css";

const TABS = [
  { id: "learn", label: "Learn" },
  { id: "simulate", label: "Simulate" },
  { id: "code", label: "Code" },
  { id: "practice", label: "Practice" },
  { id: "deep", label: "Deep dive" },
];

const lessonHref = (id, tab) => href({ name: "lesson", params: { id }, query: tab && tab !== "learn" ? { tab } : {} });

function Lesson({ chapter, tab, theme }) {
  const { id } = chapter;
  const [body, setBody] = useState(null);
  const [sim, setSim] = useState(null);
  const [params, setParams] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => markVisited(id), [id]);

  useEffect(() => {
    let alive = true;
    Promise.all([loadBody(id), loadSim(id)])
      .then(([b, s]) => {
        if (!alive) return;
        if (!b || !s) throw new Error(`Chapter ${id} is missing its ${!b ? "text" : "simulator"}. Run npm run extract.`);
        setBody(b);
        setSim(s);
        setParams(sanitizeParams(readStored(`lsd-sim-${id}`, null), s.PARAMS));
      })
      .catch((err) => alive && setError(err));
    return () => {
      alive = false;
    };
  }, [id]);

  useEffect(() => {
    if (params) writeStored(`lsd-sim-${id}`, params);
  }, [id, params]);

  const result = useMemo(() => (sim && params ? sim.run(params) : null), [sim, params]);
  const active = TABS.some((t) => t.id === tab) ? tab : "learn";
  const { prev, next } = neighbors(id);
  const setParam = (key, value) => setParams((p) => ({ ...p, [key]: value }));
  const resetParams = () => setParams(sanitizeParams(null, sim.PARAMS));

  return (
    <div className="lesson">
      <header className="glass lesson-head">
        <div className="crumbs">
          <span className="idpill mono">{chapter.id}</span>
          <h1 className="h1">{chapter.title}</h1>
        </div>
        <p className="claim">{chapter.subtitle}</p>
        <div className="chips small left">
          {chapter.concerns.map((c) => (
            <span key={c} className="chip">
              {c}
            </span>
          ))}
          <span className="chip mono">sim.mjs · {chapter.loc} lines</span>
        </div>
        <p className="insight">{chapter.keyInsight}</p>
      </header>

      {error && (
        <section className="glass error-card">
          <h2>This chapter failed to load</h2>
          <pre>{String(error.message || error)}</pre>
        </section>
      )}

      {result ? (
        <FramePlayer frames={result.frames} params={params} Hero={HEROES[id]} />
      ) : (
        !error && <div className="glass hero-card muted">Loading the simulator…</div>
      )}

      <div className="tabs" role="tablist" aria-label="Lesson sections">
        {TABS.map((t) => (
          <a key={t.id} role="tab" aria-selected={t.id === active} className="tab" href={lessonHref(id, t.id)}>
            {t.label}
          </a>
        ))}
      </div>

      <div className="glass lesson-panel" role="tabpanel">
        {!body || !result ? (
          <p className="muted">{error ? "Nothing to show." : "Loading…"}</p>
        ) : active === "learn" ? (
          <LearnTab readme={body.readme} theme={theme} />
        ) : active === "simulate" ? (
          <SimulateTab sim={sim} params={params} result={result} chapter={chapter} onChange={setParam} onReset={resetParams} />
        ) : active === "code" ? (
          <CodeTab source={body.simSource} chapter={chapter} theme={theme} />
        ) : active === "practice" ? (
          <PracticeTab chapter={chapter} />
        ) : (
          <DeepDiveTab chapter={chapter} />
        )}
      </div>

      <nav className="lesson-nav" aria-label="Chapters">
        {prev ? (
          <a href={lessonHref(prev.id)}>
            <small>Previous</small>
            <span>
              <span className="mono">{prev.id}</span> {prev.title}
            </span>
          </a>
        ) : (
          <span />
        )}
        {next ? (
          <a href={lessonHref(next.id)} className="next">
            <small>Next</small>
            <span>
              <span className="mono">{next.id}</span> {next.title}
            </span>
          </a>
        ) : (
          <span />
        )}
      </nav>
    </div>
  );
}

export default function LessonPage({ route, theme }) {
  const chapter = getChapter(route.params.id);
  if (!chapter) {
    return (
      <section className="glass error-card">
        <h2>No chapter "{route.params.id}" yet</h2>
        <p>This chapter has not been written. Try the home page to see what exists.</p>
        <a className="pbtn" href={href({ name: "home" })}>
          Back home
        </a>
      </section>
    );
  }
  return <Lesson key={chapter.id} chapter={chapter} tab={route.query.tab} theme={theme} />;
}
