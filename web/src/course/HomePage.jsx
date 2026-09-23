import { useState } from "react";
import { Search } from "lucide-react";
import { href } from "../router.js";
import { useProgress } from "../store.js";
import { tracks, order, getChapter, getTrack, search } from "./courseData.js";

const lessonHref = (id) => href({ name: "lesson", params: { id } });

export default function HomePage() {
  const progress = useProgress();
  const resumeId = getChapter(progress.last) ? progress.last : order[0];
  const resume = getChapter(resumeId);
  const firstFundamental = getTrack(1)?.ids[0] ?? order[0];

  const [trackN, setTrackN] = useState(() => resume?.track ?? tracks[0].n);
  const [query, setQuery] = useState("");
  const results = search(query);
  const track = getTrack(trackN);

  return (
    <div className="hero">
      <h1 className="h1">
        Learn system design
        <br />
        by breaking it
      </h1>

      <div className="glass intro">
        <p>
          One loop every time: <b style={{ color: "var(--ink)" }}>constraints → component → failure → trade-off</b>. Every chapter
          ships a simulator you can run.
        </p>

        <div>
          <label className="field">
            <Search size={16} aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search chapters and concerns"
              aria-label="Search chapters"
            />
          </label>
          {query.trim() !== "" && (
            <ul className="results">
              {results.map((c) => (
                <li key={c.id}>
                  <a href={lessonHref(c.id)}>
                    <span className="mono">{c.id}</span> {c.title}
                  </a>
                </li>
              ))}
              {results.length === 0 && <li className="muted" style={{ padding: "7px 8px", fontSize: 14 }}>No chapters match "{query.trim()}".</li>}
            </ul>
          )}
        </div>

        <a className="pbtn" href={lessonHref(resumeId)}>
          {progress.last ? "Continue" : "Start"}: {resume.id} {resume.title}
        </a>
        <div style={{ fontSize: 14 }}>
          New here? <a href={lessonHref(firstFundamental)}>Start with fundamentals</a>
        </div>
      </div>

      <div className="chips" role="group" aria-label="Tracks">
        {tracks.map((t) => (
          <button key={t.n} className="chip" aria-pressed={t.n === trackN} onClick={() => setTrackN(t.n)}>
            {t.title} <span className="mono">{t.ids.length}</span>
          </button>
        ))}
      </div>

      {track && (
        <div className="chips small">
          {track.ids.map((id) => (
            <a key={id} className="chip" href={lessonHref(id)}>
              <span className="mono">{id}</span> {getChapter(id).title}
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
