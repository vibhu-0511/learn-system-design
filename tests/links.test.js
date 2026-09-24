// P5.4: every relative link in a chapter README must resolve on disk (so the
// extractor's #/<id> and #/library/<path> rewrites land on something real),
// and the "Track · prev -> **id** -> next" breadcrumb must match chapter order.
import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { CHAPTER_DIR_RE, TRACK_DIR_RE } from "../scripts/courseContract.mjs";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const COURSE = join(ROOT, "course");
const dirs = (d) => readdirSync(d, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name).sort();

const chapters = [];
for (const t of dirs(COURSE).filter((n) => TRACK_DIR_RE.test(n))) {
  for (const d of dirs(join(COURSE, t))) {
    const m = d.match(CHAPTER_DIR_RE);
    if (m) chapters.push({ id: m[1], dir: join(COURSE, t, d) });
  }
}
const ids = chapters.map((c) => c.id);
const readme = (c) => readFileSync(join(c.dir, "README.md"), "utf8").replace(/\r\n/g, "\n");

describe("README links", () => {
  it("every relative link resolves to a chapter or vault note that exists", () => {
    const bad = [];
    for (const c of chapters) {
      for (const [, raw] of readme(c).matchAll(/\]\((\.\.\/[^)\s]*)\)/g)) {
        const path = decodeURI(raw.split("#")[0]);
        const target = resolve(c.dir, path);
        const chapterLink = path.match(/([a-z]\d{2})_[^/]+\/?(README\.md)?$/);
        if (!existsSync(target)) bad.push(`${c.id}: ${raw} does not exist`);
        else if (chapterLink && !ids.includes(chapterLink[1])) bad.push(`${c.id}: ${raw} is not a chapter`);
        else if (!chapterLink && !path.includes("vault/system_design/")) bad.push(`${c.id}: ${raw} is not a chapter or vault link`);
      }
    }
    expect(bad).toEqual([]);
  });

  it("breadcrumb neighbours are the real previous and next chapters", () => {
    const bad = [];
    chapters.forEach((c, i) => {
      const line = readme(c).split("\n")[2] ?? "";
      const m = line.match(/^.* · (?:([a-z]\d{2}) → )?\*\*([a-z]\d{2})\*\*(?: → ([a-z]\d{2}))?$/);
      if (!m) return bad.push(`${c.id}: breadcrumb not parseable: ${line}`);
      const [, prev, self, next] = m;
      // A track's first/last chapter may omit the neighbour that lives in another track.
      if (self !== c.id) bad.push(`${c.id}: breadcrumb names ${self}`);
      if (prev && prev !== ids[i - 1]) bad.push(`${c.id}: prev ${prev}, expected ${ids[i - 1]}`);
      if (next && next !== ids[i + 1]) bad.push(`${c.id}: next ${next}, expected ${ids[i + 1]}`);
    });
    expect(bad).toEqual([]);
  });
});
