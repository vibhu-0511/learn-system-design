// Content contract for every chapter (PLAN sections 3.3 and 4.6).
//
// Practice-reference checks read the ported gym data. Exports in the old app:
//   web/src/practice/data/outageReplays.js  OUTAGE_REPLAYS[].id   e.g. "fastly_2021"
//   web/src/practice/data/bugScenarios.js   BUG_SCENARIOS[].id    e.g. "checkout-double-charge"
//   web/src/practice/data/drillCases.js     DRILL_CASES[].id      e.g. "url-shortener"
//   web/src/practice/data/terms.js          ALL_TERMS[].term      e.g. "Latency"
// Those checks skip (loudly, in the test name) until P3 ports that folder.

import { describe, it, expect, beforeAll } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import {
  CHAPTER_DIR_RE,
  TRACK_DIR_RE,
  BEATS,
  README_SECTIONS,
  TRACK_COUNTS,
  validateMeta,
} from "../scripts/courseContract.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COURSE = join(ROOT, "course");
const VAULT = join(ROOT, "vault", "system_design");
const PRACTICE_DATA = join(ROOT, "web", "src", "practice", "data");

const readText = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const subdirs = (dir) => readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();

// Global order = track folders (1_..7_) then chapter folders, the same order the site uses.
function discover() {
  const found = [];
  for (const trackName of existsSync(COURSE) ? subdirs(COURSE) : []) {
    const tm = trackName.match(TRACK_DIR_RE);
    if (!tm) continue;
    for (const dirName of subdirs(join(COURSE, trackName))) {
      const cm = dirName.match(CHAPTER_DIR_RE);
      if (cm) found.push({ id: cm[1], trackN: Number(tm[1]), trackName, dirName, dir: join(COURSE, trackName, dirName) });
    }
  }
  return found;
}

const chapters = discover();
const orderOf = new Map(chapters.map((c, i) => [c.id, i]));
const trackLetters = Object.keys(TRACK_COUNTS);

describe("course structure", () => {
  it("has at least one chapter", () => {
    expect(chapters.length).toBeGreaterThan(0);
  });

  it("chapter ids are unique", () => {
    const seen = new Map();
    for (const c of chapters) {
      expect(seen.has(c.id), `duplicate id ${c.id}: ${seen.get(c.id)} and ${c.trackName}/${c.dirName}`).toBe(false);
      seen.set(c.id, `${c.trackName}/${c.dirName}`);
    }
  });

  it("each chapter sits in the track its letter belongs to", () => {
    for (const c of chapters) {
      expect(c.id[0], `${c.trackName}/${c.dirName} is filed in track ${c.trackN}`).toBe(trackLetters[c.trackN - 1]);
    }
  });

  it("chapter numbers stay within the planned count per track", () => {
    for (const c of chapters) {
      const n = Number(c.id.slice(1));
      expect(n, `${c.id} is outside 1..${TRACK_COUNTS[c.id[0]]}`).toBeGreaterThanOrEqual(1);
      expect(n, `${c.id} is outside 1..${TRACK_COUNTS[c.id[0]]}`).toBeLessThanOrEqual(TRACK_COUNTS[c.id[0]]);
    }
  });

  // Enabled with COURSE_COMPLETE=1; CI turns it on once all 67 chapters exist (P5).
  it.runIf(process.env.COURSE_COMPLETE === "1")("course is complete: every planned chapter exists (67)", () => {
    for (const [letter, count] of Object.entries(TRACK_COUNTS)) {
      for (let i = 1; i <= count; i += 1) {
        const id = `${letter}${String(i).padStart(2, "0")}`;
        expect(orderOf.has(id), `missing chapter ${id}`).toBe(true);
      }
    }
  });
});

describe.each(chapters)("chapter $id ($dirName)", (ch) => {
  const paths = { readme: join(ch.dir, "README.md"), meta: join(ch.dir, "meta.json"), sim: join(ch.dir, "sim.mjs") };
  const read = (p) => (existsSync(p) ? readText(p) : null);

  it("has README.md, sim.mjs and meta.json", () => {
    for (const [label, p] of Object.entries(paths)) expect(existsSync(p), `${ch.id}: missing ${label} file`).toBe(true);
  });

  describe("README", () => {
    const readme = read(paths.readme);
    const lines = (readme ?? "").split("\n");

    it("starts with '# <id>: <Title> — <claim>'", () => {
      expect(readme, `${ch.id}: README.md missing`).not.toBeNull();
      expect(lines[0], `${ch.id}: first line`).toMatch(new RegExp(`^# ${ch.id}: .+ — .+$`));
    });

    it("has the breadcrumb on line 3, marking this chapter", () => {
      expect(lines[2] ?? "", `${ch.id}: line 3 should be the breadcrumb containing **${ch.id}**`).toContain(`**${ch.id}**`);
    });

    it("has the required sections, in order", () => {
      expect(readme, `${ch.id}: README.md missing`).not.toBeNull();
      const withoutCode = (readme ?? "").replace(/```[\s\S]*?```/g, "");
      const headings = [...withoutCode.matchAll(/^## (.+)$/gm)].map((m) => m[1].trim());
      let from = 0;
      for (const section of README_SECTIONS) {
        const at = headings.indexOf(section, from);
        expect(at, `${ch.id}: README is missing "## ${section}" (or it is out of order). Found: ${headings.join(" | ")}`).toBeGreaterThanOrEqual(0);
        from = at + 1;
      }
    });

    it("quotes sim.mjs verbatim in every '// sim.mjs' block", () => {
      const sim = read(paths.sim);
      expect(sim, `${ch.id}: sim.mjs missing`).not.toBeNull();
      for (const m of (readme ?? "").matchAll(/```[^\n]*\n([\s\S]*?)```/g)) {
        const [marker, ...rest] = m[1].split("\n");
        if (marker.trim() !== "// sim.mjs") continue;
        const excerpt = rest.join("\n").trimEnd();
        expect(excerpt.length, `${ch.id}: an empty '// sim.mjs' block`).toBeGreaterThan(0);
        expect(sim.includes(excerpt), `${ch.id}: README excerpt is not in sim.mjs:\n${excerpt}`).toBe(true);
      }
    });
  });

  describe("meta.json", () => {
    let meta = null;
    let parseError = null;
    try {
      meta = JSON.parse(read(paths.meta) ?? "null");
    } catch (err) {
      parseError = err.message;
    }

    it("is valid", () => {
      expect(parseError, `${ch.id}: meta.json is not valid JSON`).toBeNull();
      expect(validateMeta(meta, ch.id), `${ch.id}: meta.json problems`).toEqual([]);
    });

    it("cites vault notes that exist", () => {
      for (const note of meta?.sourceNotes ?? []) {
        expect(existsSync(join(VAULT, note)), `${ch.id}: sourceNote not found in vault: ${note}`).toBe(true);
      }
    });

    it("only builds on chapters that exist and come earlier", () => {
      for (const dep of meta?.uses ?? []) {
        expect(orderOf.has(dep), `${ch.id}: uses unknown chapter ${dep}`).toBe(true);
        expect(orderOf.get(dep), `${ch.id}: uses ${dep}, which does not come earlier`).toBeLessThan(orderOf.get(ch.id));
      }
    });

    describe.skipIf(!existsSync(PRACTICE_DATA))("practice references (skipped until P3 ports web/src/practice/data)", () => {
      let known;
      beforeAll(async () => {
        const load = (f) => import(pathToFileURL(join(PRACTICE_DATA, f)).href);
        const [o, b, d, t] = await Promise.all([load("outageReplays.js"), load("bugScenarios.js"), load("drillCases.js"), load("terms.js")]);
        known = {
          outageRefs: new Set(o.OUTAGE_REPLAYS.map((x) => x.id)),
          bugScenarioIds: new Set(b.BUG_SCENARIOS.map((x) => x.id)),
          drillCaseIds: new Set(d.DRILL_CASES.map((x) => x.id)),
          terms: new Set(t.ALL_TERMS.map((x) => x.term)),
        };
      });
      it("all resolve to real ids", () => {
        for (const [field, ids] of Object.entries(known)) {
          for (const ref of meta?.[field] ?? []) {
            expect(ids.has(ref), `${ch.id}: ${field} has unknown id "${ref}"`).toBe(true);
          }
        }
      });
    });
  });

  describe("sim.mjs", () => {
    const source = read(paths.sim);
    let sim;
    let defaults;

    beforeAll(async () => {
      if (source === null) return;
      sim = await import(pathToFileURL(paths.sim).href);
      defaults = Object.fromEntries(Object.entries(sim.PARAMS ?? {}).map(([k, p]) => [k, p.default]));
    });

    it("has no Node-only imports, so it also runs in the browser", () => {
      expect(source, `${ch.id}: sim.mjs missing`).not.toBeNull();
      expect(source, `${ch.id}: sim.mjs must not import from node:`).not.toMatch(/from\s+["']node:|require\(/);
    });

    it("exports PARAMS and run()", () => {
      expect(typeof sim?.run, `${ch.id}: run() not exported`).toBe("function");
      expect(Object.keys(sim?.PARAMS ?? {}).length, `${ch.id}: PARAMS empty or missing`).toBeGreaterThan(0);
    });

    it("declares sliders with label, min, max, step and an in-range default", () => {
      for (const [key, p] of Object.entries(sim?.PARAMS ?? {})) {
        const where = `${ch.id}: PARAMS.${key}`;
        expect(typeof p.label, `${where}.label`).toBe("string");
        for (const field of ["min", "max", "step", "default"]) expect(Number.isFinite(p[field]), `${where}.${field} must be a number`).toBe(true);
        expect(p.step, `${where}.step`).toBeGreaterThan(0);
        expect(p.default, `${where}.default is outside min..max`).toBeGreaterThanOrEqual(p.min);
        expect(p.default, `${where}.default is outside min..max`).toBeLessThanOrEqual(p.max);
      }
    });

    it("is deterministic", () => {
      expect(JSON.stringify(sim.run(defaults))).toBe(JSON.stringify(sim.run(defaults)));
    });

    it("walks the four beats in order", () => {
      const beats = sim.run(defaults).frames.map((f) => f.beat);
      const idx = beats.map((b) => BEATS.indexOf(b));
      expect(idx.includes(-1), `${ch.id}: unknown beat in [${beats}] (allowed: ${BEATS})`).toBe(false);
      expect(idx, `${ch.id}: beats must not go backwards: [${beats}]`).toEqual([...idx].sort((a, b) => a - b));
      for (const beat of BEATS) expect(beats, `${ch.id}: no "${beat}" frame`).toContain(beat);
    });

    it("reports the same metric keys in every frame, so the comparison table has no gaps", () => {
      const keySets = sim.run(defaults).frames.map((f) => Object.keys(f.metrics).sort().join(","));
      expect(new Set(keySets).size, `${ch.id}: frames report different metrics: ${keySets.join(" | ")}`).toBe(1);
    });

    it("gives every frame a title, a note and finite numeric metrics, at the defaults and at every slider end", () => {
      const cases = [{ label: "defaults", params: defaults }];
      for (const [key, p] of Object.entries(sim.PARAMS)) {
        cases.push({ label: `${key}=min`, params: { ...defaults, [key]: p.min } });
        cases.push({ label: `${key}=max`, params: { ...defaults, [key]: p.max } });
      }
      for (const { label, params } of cases) {
        for (const [i, f] of sim.run(params).frames.entries()) {
          const where = `${ch.id} frame ${i + 1} (${label})`;
          expect(typeof f.title === "string" && f.title !== "", `${where}: title`).toBe(true);
          expect(typeof f.note === "string" && f.note !== "", `${where}: note`).toBe(true);
          const values = Object.values(f.metrics ?? {});
          expect(values.length, `${where}: metrics empty`).toBeGreaterThan(0);
          for (const [k, v] of Object.entries(f.metrics)) {
            expect(typeof v === "number" && Number.isFinite(v), `${where}: metric ${k} = ${v} is not a finite number`).toBe(true);
          }
        }
      }
    });
  });
});
