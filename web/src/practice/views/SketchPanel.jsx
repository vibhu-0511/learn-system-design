import { lazy, Suspense, useCallback, useRef, useState } from "react";
import { ChevronDown, ChevronRight, PenTool } from "lucide-react";

const Excalidraw = lazy(() =>
  import("@excalidraw/excalidraw").then(async (m) => {
    await import("@excalidraw/excalidraw/index.css");
    return { default: m.Excalidraw };
  }),
);

export function SketchPanel({ sketch, onSave, theme }) {
  const [open, setOpen] = useState(false);
  const timer = useRef(null);

  const handleChange = useCallback(
    (elements) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(() => {
        onSave({ elements: elements.filter((el) => !el.isDeleted) });
      }, 800);
    },
    [onSave],
  );

  return (
    <div className="sketch-panel">
      <button className="drill-scaffold-toggle" onClick={() => setOpen((v) => !v)}>
        {open ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
        <PenTool size={14} />
        <strong>Sketch the architecture</strong>
        <span className="muted">{open ? "(hide)" : "(freehand canvas)"}</span>
      </button>
      {open && (
        <div className="sketch-canvas">
          <Suspense fallback={<div className="empty-state">Loading canvas…</div>}>
            <Excalidraw
              theme={theme === "dark" ? "dark" : "light"}
              initialData={{ elements: sketch?.elements || [] }}
              onChange={handleChange}
            />
          </Suspense>
        </div>
      )}
    </div>
  );
}
