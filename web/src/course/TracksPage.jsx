import { useState } from "react";
import { href } from "../router.js";
import { seenIds, useProgress } from "../store.js";
import { tracks, chapters } from "./courseData.js";
import "./overview.css";

const lessonHref = (id) => href({ name: "lesson", params: { id } });
const concerns = [...new Set(Object.values(chapters).flatMap((c) => c.concerns))].sort();

export default function TracksPage() {
  const seen = seenIds(useProgress());
  const [concern, setConcern] = useState(null);
  const show = (id) => !concern || chapters[id].concerns.includes(concern);

  return (
    <div className="overview">
      <div className="glass overview-head">
        <h1 className="h1" style={{ fontSize: 32 }}>Tracks</h1>
        <p>Seven tracks, one loop. Filter by the concern you are worried about.</p>
        <div className="chips" role="group" aria-label="Filter by concern">
          <button className="chip" aria-pressed={concern === null} onClick={() => setConcern(null)}>
            all
          </button>
          {concerns.map((c) => (
            <button key={c} className="chip" aria-pressed={concern === c} onClick={() => setConcern(c)}>
              {c}
            </button>
          ))}
        </div>
        <a href={href({ name: "timeline" })}>See the whole course as one path</a>
      </div>

      {tracks.map((t) => {
        const ids = t.ids.filter(show);
        if (ids.length === 0) return null;
        const count = t.ids.filter((id) => seen.has(id)).length;
        return (
          <section key={t.n} className="glass track-card" aria-labelledby={`track-${t.n}`}>
            <h2 id={`track-${t.n}`}>
              <span>{t.n}. {t.title}</span>
              <span className="mono muted">{count}/{t.ids.length} visited</span>
            </h2>
            <p>{t.motto}</p>
            <ul className="path">
              {ids.map((id) => (
                <li key={id} className={seen.has(id) ? "seen" : undefined}>
                  <a href={lessonHref(id)}>
                    <span className="mark mono">{seen.has(id) ? "✓ " : ""}{id}</span>
                    <span>{chapters[id].title}</span>
                    <span className="sub">{chapters[id].subtitle}</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        );
      })}
    </div>
  );
}
