import { useEffect, useRef } from "react";
import { renderMarkdown, postProcess } from "../../library/markdown.js";

// The whole sim.mjs, syntax highlighted. It is the exact file the simulator runs.
export default function CodeTab({ source, chapter, theme }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.innerHTML = renderMarkdown("```js\n" + source + "\n```");
    postProcess(el, theme);
  }, [source, theme]);

  return (
    <div>
      <p className="muted">
        <span className="mono">{chapter.dir}/sim.mjs</span> · {chapter.loc} lines of code
      </p>
      <div className="prose" ref={ref} />
    </div>
  );
}
