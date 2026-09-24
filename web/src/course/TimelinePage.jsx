import { href } from "../router.js";
import { seenIds, useProgress } from "../store.js";
import { tracks, chapters, order } from "./courseData.js";
import "./overview.css";

const lessonHref = (id) => href({ name: "lesson", params: { id } });

export default function TimelinePage() {
  const seen = seenIds(useProgress());
  const nextId = order.find((id) => !seen.has(id));

  return (
    <div className="overview">
      <div className="glass overview-head">
        <h1 className="h1" style={{ fontSize: 32 }}>Timeline</h1>
        <p>
          The whole course in order: {order.length} chapters, {seen.size ? `${order.filter((id) => seen.has(id)).length} visited` : "none visited yet"}.
        </p>
        <a href={href({ name: "tracks" })}>Browse by track and concern</a>
      </div>

      {tracks.map((t) => (
        <section key={t.n} className="glass track-card" aria-labelledby={`track-${t.n}`}>
          <h2 id={`track-${t.n}`}>{t.n}. {t.title}</h2>
          <ol className="path">
            {t.ids.map((id) => (
              <li key={id} className={`${seen.has(id) ? "seen" : ""} ${id === nextId ? "next" : ""}`}>
                <a href={lessonHref(id)} aria-current={id === nextId ? "step" : undefined}>
                  <span className="mark mono">{seen.has(id) ? "✓ " : ""}{id}</span>
                  <span>{chapters[id].title}{id === nextId ? " (next)" : ""}</span>
                  <span className="sub">{chapters[id].subtitle}</span>
                </a>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}
