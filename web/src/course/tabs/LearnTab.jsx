import { useEffect, useRef } from "react";
import { renderMarkdown, postProcess } from "../../library/markdown.js";

// The page header already shows the title, claim, motto and concerns, so the
// tab starts at the first section heading. Image paths are base-relative in
// the generated README; prefix the site base so they resolve under /<repo>/.
export default function LearnTab({ readme, theme }) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const start = readme.indexOf("\n## ");
    const body = (start === -1 ? readme : readme.slice(start + 1)).replace(/(\]\(|src=")course-assets\//g, `$1${import.meta.env.BASE_URL}course-assets/`);
    el.innerHTML = renderMarkdown(body);
    postProcess(el, theme);
  }, [readme, theme]);

  return <article className="prose" ref={ref} />;
}
