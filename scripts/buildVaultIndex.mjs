#!/usr/bin/env node
// Walks the system_design vault and produces a structured JSON index.
// Output: web/src/data/generated/vaultIndex.generated.json (gitignored).
// Run: npm run index:vault
//
// Per-note extraction:
//   - title (first H1, fallback to filename)
//   - tags (Obsidian-style #tag tokens, ignoring headings)
//   - headings (H2/H3 list)
//   - intuition (body of "## Intuition*" section, truncated)
//   - failureFirst (body of "## Failure-First*" section, truncated)
//   - wikilinks (resolved into a backlink graph)
//   - hasMermaid, wordCount, byteSize
//   - reliability flags (absolute language / vendor-heavy / long-unverified)
//
// Folder type mapping is below; folders not in the map default to 'reference'.

import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, relative, dirname, sep } from "node:path";
import { fileURLToPath } from "node:url";
import { VAULT_ROOT } from "../vault.config.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, "..");
const GENERATED_DIR = join(PROJECT_ROOT, "web", "src", "data", "generated");
const OUTPUT_PATH = join(GENERATED_DIR, "vaultIndex.generated.json");
const VAULT_CONTENT_DIR = join(GENERATED_DIR, "vault");

function safeFolderName(folder) {
  return folder.replace(/[^a-zA-Z0-9_-]/g, "_");
}

const SKIP_DIRS = new Set([
  "Extras",
  "canvas",
  "excalidraw",
  "awesome-low-level-design",
  "docs",
  ".obsidian",
  ".git",
  ".trash",
]);

const FOLDER_TYPES = {
  "01_fundamentals": "concept",
  "02_building_blocks": "building-block",
  "03_design_patterns": "pattern",
  "04_system_evolutions": "evolution",
  "05_case_studies": "case-study",
  "06_trade_offs": "trade-off",
  "07_interview_framework": "framework",
  "08_reference": "reference",
  "09_real_outages": "outage",
  "10_hld": "hld-meta",
  "11_lld": "lld",
  "12_hld_lld_bridge": "bridge",
  "13_interview_prep": "interview-prep",
  "14_real_projects": "real-project",
  "15_intermediate_topics": "intermediate",
  "16_java_deep_dive": "language",
  "17_company_interview_guide": "company-guide",
  "18_real_world_architecture": "real-world",
};

const ABSOLUTE_TERMS = [
  "always",
  "never",
  "must",
  "cannot",
  "will not",
  "no system",
  "every system",
  "all systems",
  "the only way",
  "guaranteed",
];

const VENDOR_TERMS = [
  "kafka",
  "redis",
  "postgres",
  "postgresql",
  "mysql",
  "mongodb",
  "dynamodb",
  "aws",
  "gcp",
  "azure",
  "nginx",
  "kubernetes",
  "k8s",
  "elasticsearch",
  "rabbitmq",
  "sqs",
  "kinesis",
  "snowflake",
  "datadog",
  "prometheus",
  "grafana",
  "cassandra",
  "memcached",
  "envoy",
  "consul",
  "etcd",
  "zookeeper",
  "spark",
  "flink",
  "hadoop",
  "presto",
  "clickhouse",
];

async function walk(dir, base = dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name.startsWith(".")) continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      const sub = await walk(full, base);
      files.push(...sub);
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      files.push(relative(base, full).split(sep).join("/"));
    }
  }
  return files;
}

function parseTags(content) {
  const tags = new Set();
  const lines = content.split(/\r?\n/);
  for (const line of lines.slice(0, 50)) {
    if (/^#{1,6}\s/.test(line)) continue;
    const matches = line.matchAll(/(?:^|\s)#([a-z][a-z0-9_/-]*)/gi);
    for (const m of matches) tags.add(m[1].toLowerCase());
  }
  return [...tags];
}

function parseTitle(content, fallback) {
  const m = content.match(/^#\s+(.+)$/m);
  return m ? m[1].trim() : fallback;
}

function parseSections(content) {
  const lines = content.split(/\r?\n/);
  const sections = [];
  let current = { heading: null, level: 0, body: [] };
  for (const line of lines) {
    const m = line.match(/^(#{2,3})\s+(.+)$/);
    if (m) {
      if (current.heading || current.body.length) sections.push(current);
      current = { heading: m[2].trim(), level: m[1].length, body: [] };
    } else {
      current.body.push(line);
    }
  }
  if (current.heading || current.body.length) sections.push(current);
  return sections.map((s) => ({ ...s, body: s.body.join("\n").trim() }));
}

function findSection(sections, regex) {
  for (const s of sections) {
    if (s.heading && regex.test(s.heading)) return s.body;
  }
  return null;
}

function parseWikilinks(content) {
  const links = new Set();
  const matches = content.matchAll(/\[\[([^\]|#]+)(?:[#|][^\]]*)?\]\]/g);
  for (const m of matches) links.add(m[1].trim());
  return [...links];
}

function countOccurrences(content, terms) {
  const lower = content.toLowerCase();
  let count = 0;
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "gi");
    count += (lower.match(re) || []).length;
  }
  return count;
}

function reliabilityFlags(content, wordCount) {
  const flags = [];
  const absoluteCount = countOccurrences(content, ABSOLUTE_TERMS);
  const vendorCount = countOccurrences(content, VENDOR_TERMS);
  const vendorDensity = wordCount > 0 ? vendorCount / wordCount : 0;
  if (absoluteCount > 6) flags.push("absolute-language");
  if (vendorDensity > 0.02) flags.push("vendor-heavy");
  if (wordCount > 4000) flags.push("long-unverified");
  return {
    absoluteCount,
    vendorCount,
    vendorDensity: +vendorDensity.toFixed(4),
    wordCount,
    flags,
  };
}

async function parseNote(vaultRoot, relPath) {
  const fullPath = join(vaultRoot, relPath);
  const raw = await readFile(fullPath, "utf8");
  const stats = await stat(fullPath);
  const parts = relPath.split("/");
  const folder = parts.length > 1 ? parts[0] : "_root";
  const filename = parts[parts.length - 1].replace(/\.md$/, "");
  const title = parseTitle(raw, filename.replace(/_/g, " "));
  const tags = parseTags(raw);
  const sections = parseSections(raw);
  const intuition = findSection(sections, /^Intuition/i);
  const failureFirst = findSection(sections, /^Failure[- ]?First/i);
  const wikilinks = parseWikilinks(raw);
  const hasMermaid = /```mermaid/.test(raw);
  const wordCount = raw.split(/\s+/).filter(Boolean).length;
  const reliability = reliabilityFlags(raw, wordCount);
  const headings = sections
    .filter((s) => s.heading)
    .map((s) => ({ level: s.level, text: s.heading }));
  const type = FOLDER_TYPES[folder] || "reference";

  const note = {
    id: relPath,
    path: relPath,
    folder,
    filename,
    title,
    tags,
    type,
    intuition: intuition ? intuition.slice(0, 600) : null,
    failureFirst: failureFirst ? failureFirst.slice(0, 600) : null,
    headings,
    wikilinks,
    hasMermaid,
    wordCount,
    byteSize: stats.size,
    reliability,
  };

  return { note, raw };
}

async function main() {
  if (!existsSync(VAULT_ROOT)) {
    console.error(`[indexer] Vault not found: ${VAULT_ROOT}`);
    console.error("Set VAULT_PATH env var or update vault.config.mjs.");
    process.exit(1);
  }

  console.log(`[indexer] Vault: ${VAULT_ROOT}`);
  const files = await walk(VAULT_ROOT);
  console.log(`[indexer] Markdown files: ${files.length}`);

  const notes = {};
  const rawContent = {};
  let parseFailures = 0;
  for (const rel of files) {
    try {
      const { note, raw } = await parseNote(VAULT_ROOT, rel);
      notes[note.id] = note;
      rawContent[note.id] = raw.replace(/\r\n/g, "\n");
    } catch (err) {
      parseFailures++;
      console.warn(`[indexer] Skip ${rel}: ${err.message}`);
    }
  }

  // Folder aggregation
  const folderMap = {};
  for (const note of Object.values(notes)) {
    if (!folderMap[note.folder]) {
      folderMap[note.folder] = {
        folder: note.folder,
        type: note.type,
        noteCount: 0,
        notes: [],
      };
    }
    folderMap[note.folder].noteCount++;
    folderMap[note.folder].notes.push(note.id);
  }

  // Backlink resolution: match wikilink target to note title or filename.
  const titleIndex = {};
  for (const note of Object.values(notes)) {
    titleIndex[note.title.toLowerCase()] = note.id;
    titleIndex[note.filename.toLowerCase()] = note.id;
  }
  const backlinks = {};
  for (const note of Object.values(notes)) {
    for (const link of note.wikilinks) {
      const target = titleIndex[link.toLowerCase()];
      if (target && target !== note.id) {
        if (!backlinks[target]) backlinks[target] = [];
        if (!backlinks[target].includes(note.id)) backlinks[target].push(note.id);
      }
    }
  }

  // Totals
  const totals = {
    noteCount: Object.keys(notes).length,
    parseFailures,
    flagged: 0,
    byFolder: {},
    byType: {},
  };
  for (const [folder, info] of Object.entries(folderMap)) {
    totals.byFolder[folder] = info.noteCount;
  }
  for (const note of Object.values(notes)) {
    totals.byType[note.type] = (totals.byType[note.type] || 0) + 1;
    if (note.reliability.flags.length) totals.flagged++;
  }

  const output = {
    vaultRoot: relative(PROJECT_ROOT, VAULT_ROOT) || VAULT_ROOT,
    generatedAt: new Date().toISOString(),
    folders: Object.values(folderMap).sort((a, b) =>
      a.folder.localeCompare(b.folder),
    ),
    notes,
    backlinks,
    totals,
  };

  await mkdir(dirname(OUTPUT_PATH), { recursive: true });
  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2), "utf8");

  // Split full markdown content into per-folder files so Vite can code-split
  // the reader by folder. Each chunk loads only when the user opens that
  // folder's notes.
  await mkdir(VAULT_CONTENT_DIR, { recursive: true });
  const byFolder = {};
  for (const [id, raw] of Object.entries(rawContent)) {
    const note = notes[id];
    if (!byFolder[note.folder]) byFolder[note.folder] = {};
    byFolder[note.folder][id] = raw;
  }
  let totalContentBytes = 0;
  for (const [folder, contents] of Object.entries(byFolder)) {
    const target = join(VAULT_CONTENT_DIR, `${safeFolderName(folder)}.generated.json`);
    const json = JSON.stringify(contents);
    totalContentBytes += Buffer.byteLength(json);
    await writeFile(target, json, "utf8");
  }

  const indexKb = (Buffer.byteLength(JSON.stringify(output)) / 1024).toFixed(1);
  const contentKb = (totalContentBytes / 1024).toFixed(1);
  console.log(
    `[indexer] Wrote ${relative(PROJECT_ROOT, OUTPUT_PATH)} (${indexKb} KB)`,
  );
  console.log(
    `[indexer] Wrote ${Object.keys(byFolder).length} folder chunks under ${relative(PROJECT_ROOT, VAULT_CONTENT_DIR)} (${contentKb} KB total)`,
  );
  console.log(
    `[indexer] ${totals.noteCount} notes, ${totals.flagged} flagged, ${parseFailures} skipped`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
