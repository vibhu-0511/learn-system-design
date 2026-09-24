import { navigate } from "../router.js";
import { LibraryView } from "./LibraryView.jsx";
import "../practice/practice.css";

// The old app kept the open note in localStorage; here the URL is the state.
export default function LibraryPage({ route, theme }) {
  return (
    <div className="legacy">
      <LibraryView
        activeNotePath={route.params.path ?? null}
        onOpenNote={(path) => navigate({ name: "library", params: { path } })}
        theme={theme === "dusk" ? "dark" : "light"}
      />
    </div>
  );
}
