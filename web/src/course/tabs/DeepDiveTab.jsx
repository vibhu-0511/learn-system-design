import { href } from "../../router.js";
import { getChapter } from "../courseData.js";

// Design decisions with the alternative that was rejected, plus where to read further.
export default function DeepDiveTab({ chapter }) {
  return (
    <div className="deep">
      <h3>Design decisions</h3>
      <div className="decisions">
        {chapter.decisions.map((d) => (
          <article key={d.title} className="glass decision">
            <h4>{d.title}</h4>
            <p>{d.description}</p>
            <p className="alt">
              <b>Rejected alternative:</b> {d.alternatives}
            </p>
          </article>
        ))}
      </div>

      {chapter.uses.length > 0 && (
        <>
          <h3>Builds on</h3>
          <div className="chips small left">
            {chapter.uses.map((id) => (
              <a key={id} className="chip" href={href({ name: "lesson", params: { id } })}>
                <span className="mono">{id}</span> {getChapter(id)?.title}
              </a>
            ))}
          </div>
        </>
      )}

      <h3>Go deeper in the vault</h3>
      <div className="chips small left">
        {chapter.sourceNotes.map((path) => (
          <a key={path} className="chip" href={href({ name: "library", params: { path } })}>
            <span className="mono">{path}</span>
          </a>
        ))}
      </div>
    </div>
  );
}
