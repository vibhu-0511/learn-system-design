// The chapter contract, in one place. Imported by scripts/extractCourse.mjs
// (fails the build on violations it can see) and tests/course.test.js.
// Node-only: never import this from browser code.

export const CHAPTER_DIR_RE = /^([a-z]\d{2})_(.+)$/;
export const TRACK_DIR_RE = /^(\d)_(.+)$/;

// The five axes from the old drillScore.js; chapters tag themselves with these.
export const CONCERNS = ["scalability", "availability", "latency", "cost", "consistency"];

// The architect's loop: every sim walks these four beats, in this order.
export const BEATS = ["constraints", "component", "failure", "tradeoff"];

// Required README sections, in order (PLAN section 3.3).
export const README_SECTIONS = [
  "The Problem",
  "The Idea",
  "How It Works",
  "When It Breaks",
  "The Trade-off",
  "In The Wild",
  "Try It",
  "Say It In The Interview",
  "Boundary",
  "What's Next",
  "Source notes",
];

// Planned chapter count per track letter (PLAN section 2). 67 in total.
export const TRACK_COUNTS = { f: 8, e: 4, b: 12, p: 19, t: 7, m: 6, c: 11 };

const STRING_FIELDS = ["title", "subtitle", "motto", "coreAddition", "keyInsight"];
const REF_FIELDS = ["uses", "sourceNotes", "outageRefs", "bugScenarioIds", "drillCaseIds", "terms"];

// Returns a list of human-readable problems; empty means valid.
export function validateMeta(meta, id) {
  const errors = [];
  if (meta === null || typeof meta !== "object" || Array.isArray(meta)) {
    return ["meta.json must be a JSON object"];
  }
  if (meta.id !== id) errors.push(`id is ${JSON.stringify(meta.id)} but the folder id is "${id}"`);
  for (const key of STRING_FIELDS) {
    if (typeof meta[key] !== "string" || meta[key].trim() === "") {
      errors.push(`"${key}" must be a non-empty string`);
    }
  }
  if (!Array.isArray(meta.concerns) || meta.concerns.length === 0) {
    errors.push(`"concerns" must be a non-empty array`);
  } else {
    for (const c of meta.concerns) {
      if (!CONCERNS.includes(c)) errors.push(`unknown concern "${c}" (allowed: ${CONCERNS.join(", ")})`);
    }
  }
  for (const key of REF_FIELDS) {
    if (!Array.isArray(meta[key]) || meta[key].some((v) => typeof v !== "string" || v === "")) {
      errors.push(`"${key}" must be an array of non-empty strings (may be empty)`);
    }
  }
  if (!Array.isArray(meta.sourceNotes) || meta.sourceNotes.length === 0) {
    errors.push(`"sourceNotes" needs at least one vault note path`);
  }
  if (!Array.isArray(meta.decisions) || meta.decisions.length === 0) {
    errors.push(`"decisions" needs at least one entry (each with a rejected alternative)`);
  } else {
    meta.decisions.forEach((d, i) => {
      for (const key of ["title", "description", "alternatives"]) {
        if (typeof d?.[key] !== "string" || d[key].trim() === "") {
          errors.push(`decisions[${i}].${key} must be a non-empty string`);
        }
      }
    });
  }
  return errors;
}
