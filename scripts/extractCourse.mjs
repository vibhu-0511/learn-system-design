#!/usr/bin/env node
// Turns course/<n>_<track>/<id>_<slug>/ folders into (all gitignored):
//   web/src/data/generated/course.json          light index: tracks, chapter meta, prev/next, stats
//   web/src/data/generated/chapters/<id>.json   heavy body: { readme, simSource }, loaded per lesson
// and copies chapter images to web/public/course-assets/<id>/. Run: npm run extract
//
// The split keeps the initial bundle small: 67 READMEs inline would blow the
// 250 KB budget. Folders are the only registry: order, prev/next, track stats
// and the concern index are all derived. Unlike a regex parse, sims are
// imported, so PARAMS and the frame count are real values.

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, rmSync, cpSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { CHAPTER_DIR_RE, TRACK_DIR_RE, validateMeta } from "./courseContract.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COURSE_DIR = join(ROOT, "course");
const OUT_DIR = join(ROOT, "web", "src", "data", "generated");
const BODIES_DIR = join(OUT_DIR, "chapters");
const ASSETS_DIR = join(ROOT, "web", "public", "course-assets");

// Practice links: meta field -> the tool the site opens. Titles come from the ported gym data.
const PRACTICE_FIELDS = [
  ["outageRefs", "outage"],
  ["bugScenarioIds", "bugs"],
  ["drillCaseIds", "drill"],
  ["terms", "vocab"],
];
let practiceTitles = null;

async function loadPracticeTitles() {
  const dir = join(ROOT, "web", "src", "practice", "data");
  if (!existsSync(dir)) return null;
  const load = (file) => import(pathToFileURL(join(dir, file)).href);
  const [o, b, d, t] = await Promise.all([load("outageReplays.js"), load("bugScenarios.js"), load("drillCases.js"), load("terms.js")]);
  return {
    outage: new Map(o.OUTAGE_REPLAYS.map((x) => [x.id, x.title])),
    bugs: new Map(b.BUG_SCENARIOS.map((x) => [x.id, x.title])),
    drill: new Map(d.DRILL_CASES.map((x) => [x.id, x.title])),
    vocab: new Map(t.ALL_TERMS.map((x) => [x.term, x.term])),
  };
}

const errors = [];
const fail = (where, message) => errors.push(`[extract] ${where}: ${message}`);

const readText = (p) => readFileSync(p, "utf8").replace(/\r\n/g, "\n");
const subdirs = (dir) => readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();

// Non-blank, non-comment lines: the same LOC idea learn-claude-code shows per lesson.
const countLoc = (source) => source.split("\n").filter((l) => l.trim() !== "" && !l.trim().startsWith("//")).length;

const titleCase = (slug) => {
  const words = slug.replace(/_/g, " ");
  return words.charAt(0).toUpperCase() + words.slice(1);
};

const safeEncode = (p) => {
  try {
    return encodeURI(decodeURI(p));
  } catch {
    return p;
  }
};

// Rewrites links so the README reads on GitHub and on the site:
//   ../b05_queues/ or ../../3_building_blocks/b05_queues/ -> #/b05
//   ../../../vault/system_design/<path>.md                -> #/library/<path>.md
//   images/x.svg                                          -> course-assets/<id>/x.svg (base-relative)
function rewriteReadme(md, id) {
  return md
    .replace(/\]\((?:\.\.\/)+(?:\d_[^)/]+\/)?([a-z]\d{2})_[^)/]+\/?(?:README\.md)?(?:#[^)]*)?\)/g, (_m, cid) => `](#/${cid})`)
    .replace(/\]\((?:\.\.\/)+vault\/system_design\/([^)#]+\.md)(?:#[^)]*)?\)/g, (_m, p) => `](#/library/${safeEncode(p)})`)
    .replace(/(\]\()images\//g, `$1course-assets/${id}/`)
    .replace(/(src=")images\//g, `$1course-assets/${id}/`);
}

async function readChapter(trackN, trackName, dirName) {
  const [, id] = dirName.match(CHAPTER_DIR_RE);
  const dir = join(COURSE_DIR, trackName, dirName);
  const where = `${trackName}/${dirName}`;

  const files = { meta: join(dir, "meta.json"), readme: join(dir, "README.md"), sim: join(dir, "sim.mjs") };
  for (const file of Object.values(files)) {
    if (!existsSync(file)) return void fail(where, `missing ${file.split(/[\\/]/).pop()}`);
  }

  let meta;
  try {
    meta = JSON.parse(readText(files.meta));
  } catch (err) {
    return void fail(where, `meta.json is not valid JSON (${err.message})`);
  }
  const metaErrors = validateMeta(meta, id);
  if (metaErrors.length) {
    metaErrors.forEach((m) => fail(where, `meta.json: ${m}`));
    return;
  }

  const practice = [];
  for (const [field, kind] of PRACTICE_FIELDS) {
    for (const ref of meta[field]) {
      const title = practiceTitles?.[kind].get(ref);
      if (practiceTitles && title === undefined) fail(where, `meta.json: ${field} has unknown id "${ref}"`);
      practice.push({ kind, id: ref, title: title ?? ref });
    }
  }

  const simSource = readText(files.sim);
  let paramKeys;
  let frameCount;
  try {
    const sim = await import(pathToFileURL(files.sim).href);
    if (typeof sim.run !== "function" || sim.PARAMS === null || typeof sim.PARAMS !== "object") {
      return void fail(where, "sim.mjs must export PARAMS and run()");
    }
    paramKeys = Object.keys(sim.PARAMS);
    const defaults = Object.fromEntries(paramKeys.map((k) => [k, sim.PARAMS[k].default]));
    frameCount = sim.run(defaults).frames.length;
  } catch (err) {
    return void fail(where, `sim.mjs failed to load or run (${err.message})`);
  }

  const images = [];
  const imagesDir = join(dir, "images");
  if (existsSync(imagesDir)) {
    cpSync(imagesDir, join(ASSETS_DIR, id), { recursive: true });
    for (const name of readdirSync(imagesDir).sort()) images.push(`course-assets/${id}/${name}`);
  }

  return {
    entry: {
      ...meta,
      track: trackN,
      dir: `course/${trackName}/${dirName}`,
      loc: countLoc(simSource),
      paramKeys,
      frameCount,
      images,
      practice,
    },
    body: { readme: rewriteReadme(readText(files.readme), id), simSource },
  };
}

async function main() {
  if (!existsSync(COURSE_DIR)) {
    console.error("[extract] course/ folder not found");
    process.exit(1);
  }

  practiceTitles = await loadPracticeTitles();
  rmSync(ASSETS_DIR, { recursive: true, force: true });
  mkdirSync(ASSETS_DIR, { recursive: true });

  const tracks = [];
  const chapters = {};
  const bodies = {};

  for (const trackName of subdirs(COURSE_DIR)) {
    const tm = trackName.match(TRACK_DIR_RE);
    if (!tm) {
      console.warn(`[extract] ignoring course/${trackName} (track folders look like 1_fundamentals)`);
      continue;
    }
    const n = Number(tm[1]);
    const trackDir = join(COURSE_DIR, trackName);

    // Optional track.json supplies a display title and motto; otherwise derive from the folder name.
    let trackInfo = {};
    const trackJson = join(trackDir, "track.json");
    if (existsSync(trackJson)) {
      try {
        trackInfo = JSON.parse(readText(trackJson));
      } catch (err) {
        fail(trackName, `track.json is not valid JSON (${err.message})`);
      }
    }
    const track = { n, slug: tm[2], title: trackInfo.title || titleCase(tm[2]), motto: trackInfo.motto || "", ids: [] };

    for (const dirName of subdirs(trackDir)) {
      if (!CHAPTER_DIR_RE.test(dirName)) {
        console.warn(`[extract] ignoring course/${trackName}/${dirName} (chapter folders look like f04_latency)`);
        continue;
      }
      const id = dirName.match(CHAPTER_DIR_RE)[1];
      if (chapters[id] || track.ids.includes(id)) {
        fail(`${trackName}/${dirName}`, `duplicate chapter id "${id}"`);
        continue;
      }
      const chapter = await readChapter(n, trackName, dirName);
      if (!chapter) continue;
      chapters[id] = chapter.entry;
      bodies[id] = chapter.body;
      track.ids.push(id);
    }
    tracks.push(track);
  }

  // A duplicate id in a *different* track is caught above via the shared `chapters` map.
  if (errors.length) {
    errors.forEach((e) => console.error(e));
    console.error(`[extract] ${errors.length} problem(s); course.json not written`);
    process.exit(1);
  }
  if (Object.keys(chapters).length === 0) {
    console.error("[extract] no chapters found under course/");
    process.exit(1);
  }

  tracks.sort((a, b) => a.n - b.n);
  const order = tracks.flatMap((t) => t.ids);
  order.forEach((id, i) => {
    chapters[id].prev = order[i - 1] ?? null;
    chapters[id].next = order[i + 1] ?? null;
  });

  const concerns = {};
  for (const id of order) {
    for (const c of chapters[id].concerns) (concerns[c] ??= []).push(id);
  }

  rmSync(BODIES_DIR, { recursive: true, force: true });
  mkdirSync(BODIES_DIR, { recursive: true });
  for (const id of order) writeFileSync(join(BODIES_DIR, `${id}.json`), JSON.stringify(bodies[id]));
  writeFileSync(join(OUT_DIR, "course.json"), JSON.stringify({ generatedAt: new Date().toISOString(), tracks, chapters, concerns }, null, 2));
  console.log(`[extract] ${order.length} chapters across ${tracks.length} tracks -> web/src/data/generated/{course.json, chapters/}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
