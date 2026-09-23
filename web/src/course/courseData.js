// Read-only access to the generated course index (scripts/extractCourse.mjs).
// The index is small; chapter bodies (README, sim source) load per lesson in P2.
import course from "../data/generated/course.json";

export const tracks = course.tracks;
export const chapters = course.chapters;
export const order = tracks.flatMap((t) => t.ids);

export const getChapter = (id) => chapters[id] ?? null;
export const getTrack = (n) => tracks.find((t) => t.n === n) ?? null;

export function neighbors(id) {
  const c = chapters[id];
  return { prev: c?.prev ? chapters[c.prev] : null, next: c?.next ? chapters[c.next] : null };
}

// Chapter bodies (README and sim source) are separate lazy chunks, loaded per lesson.
const bodies = import.meta.glob("../data/generated/chapters/*.json");

export async function loadBody(id) {
  const load = bodies[`../data/generated/chapters/${id}.json`];
  return load ? (await load()).default : null;
}

// Plain substring match over the fields a learner would type from.
export function search(query, limit = 6) {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return order
    .map((id) => chapters[id])
    .filter((c) => [c.id, c.title, c.subtitle, c.motto, ...c.concerns].some((v) => v.toLowerCase().includes(q)))
    .slice(0, limit);
}
