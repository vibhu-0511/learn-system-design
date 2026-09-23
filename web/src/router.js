// Hash routing, so GitHub Pages needs no 404 tricks (PLAN section 4.3).
//   #/                          home
//   #/tracks  #/timeline        overview pages
//   #/<id>?tab=simulate         lesson (id looks like b04)
//   #/practice/<tool>/<item?>   ported gym
//   #/library/<note/path.md>    vault note
import { useEffect, useState } from "react";

const CHAPTER_ID = /^[a-z]\d{2}$/;

const decode = (s) => {
  try {
    return decodeURIComponent(s);
  } catch {
    return s;
  }
};
const encodePath = (p) => p.split("/").map(encodeURIComponent).join("/");

export function parseHash(hash = "") {
  const [pathPart, queryPart = ""] = hash.replace(/^#\/?/, "").split("?");
  const query = Object.fromEntries(new URLSearchParams(queryPart));
  const segs = pathPart.split("/").filter(Boolean).map(decode);
  const [head, ...rest] = segs;

  if (!head) return { name: "home", params: {}, query };
  if (head === "tracks" || head === "timeline") return { name: head, params: {}, query };
  if (head === "practice") return { name: "practice", params: { tool: rest[0], itemId: rest.slice(1).join("/") || undefined }, query };
  if (head === "library") return { name: "library", params: { path: rest.join("/") || undefined }, query };
  if (CHAPTER_ID.test(head) && rest.length === 0) return { name: "lesson", params: { id: head }, query };
  return { name: "notfound", params: {}, query };
}

export function href({ name, params = {}, query = {} }) {
  const q = new URLSearchParams(query).toString();
  switch (name) {
    case "tracks":
    case "timeline":
      return `#/${name}`;
    case "lesson":
      return `#/${params.id}${q ? `?${q}` : ""}`;
    case "practice":
      return "#/practice" + (params.tool ? `/${encodeURIComponent(params.tool)}` + (params.itemId ? `/${encodePath(params.itemId)}` : "") : "");
    case "library":
      return "#/library" + (params.path ? `/${encodePath(params.path)}` : "");
    default:
      return "#/";
  }
}

export function navigate(route) {
  window.location.hash = href(route);
}

export function useHashRoute() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}
