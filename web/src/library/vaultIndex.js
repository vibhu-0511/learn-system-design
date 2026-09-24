// Vault index: merges the generated index (folder counts, note metadata, backlinks)
// with curated section descriptions. Run `npm run index:vault` to refresh.

import generated from "../data/generated/vaultIndex.generated.json";

export const VAULT_ROOT = generated.vaultRoot;
export const VAULT_INDEX = generated;
export const VAULT_NOTES = generated.notes;
export const VAULT_BACKLINKS = generated.backlinks;
export const VAULT_TOTALS = generated.totals;

// Hand-curated descriptions for each top-level folder. Counts are derived from
// the generated index, not hard-coded. Folders not in this manifest are still
// indexed and queryable, but won't appear in the Vault Map UI.
const SECTION_MANIFEST = {
  "01_fundamentals": {
    title: "Fundamentals",
    priority: "Start here",
    summary:
      "Client-server, networking, APIs, scalability, CAP, ACID/BASE, latency, throughput, consistency.",
    role: "Builds the beginner mental model.",
  },
  "02_building_blocks": {
    title: "Building Blocks",
    priority: "Core",
    summary:
      "Load balancers, databases, caches, queues, CDN, API gateways, rate limiting, search, monitoring.",
    role: "Gives you the components used in real HLD proposals.",
  },
  "03_design_patterns": {
    title: "Design Patterns",
    priority: "Core",
    summary:
      "Sharding, replication, pub/sub, saga, circuit breaker, idempotency, back pressure, indexing, locks.",
    role: "Teaches reusable solutions and the trade-offs behind them.",
  },
  "04_system_evolutions": {
    title: "System Evolutions",
    priority: "High leverage",
    summary: "How systems grow from simple app to scaled architecture.",
    role: "Prevents premature overengineering by showing when complexity becomes justified.",
  },
  "05_case_studies": {
    title: "Case Studies",
    priority: "Apply",
    summary:
      "URL shortener, chat, ride-sharing, video streaming, search, payments, file storage, etc.",
    role: "End-to-end design templates with intuition, failure-first, and trade-offs.",
  },
  "06_trade_offs": {
    title: "Trade-offs",
    priority: "High leverage",
    summary:
      "Consistency vs availability, latency vs throughput, SQL vs NoSQL, read vs write, cost vs performance.",
    role: "Turns memorized terms into decision-making ability.",
  },
  "07_interview_framework": {
    title: "Interview Framework",
    priority: "Apply",
    summary:
      "Four-step framework, requirements gathering, estimation cheat sheet, signal moments, red flags.",
    role: "Structures answer flow under time pressure.",
  },
  "09_real_outages": {
    title: "Real Outages",
    priority: "After basics",
    summary: "Postmortem-style notes for real production failure patterns.",
    role: "Trains failure-first thinking with grounded, real-world consequences.",
  },
  "10_hld": {
    title: "HLD Thinking System",
    priority: "Use daily",
    summary:
      "Constraints-first method, review checklist, ADRs, capacity planning, interaction patterns.",
    role: "The backbone for the architecture review and proposal workflows.",
  },
  "13_interview_prep": {
    title: "Interview Prep",
    priority: "When ready",
    summary: "Targeted prep for HLD interview rounds.",
    role: "Bridges practice and live performance.",
  },
  "18_real_world_architecture": {
    title: "Real-World Architecture",
    priority: "Reference",
    summary:
      "How companies like Google, Netflix, Uber, Stripe, Shopify, Slack, and Razorpay use patterns.",
    role: "Gives examples for founder discussions and interviews.",
  },
};

const FOLDER_COUNTS = generated.totals.byFolder || {};

export const VAULT_SECTIONS = Object.entries(SECTION_MANIFEST)
  .filter(([folder]) => FOLDER_COUNTS[folder] != null)
  .map(([folder, info]) => ({
    folder,
    ...info,
    count: FOLDER_COUNTS[folder],
  }));

// Convenience helpers for downstream phases.
export function notesByFolder(folder) {
  return Object.values(generated.notes).filter((n) => n.folder === folder);
}

export function notesByType(type) {
  return Object.values(generated.notes).filter((n) => n.type === type);
}

export function notesByTag(tag) {
  const t = tag.toLowerCase();
  return Object.values(generated.notes).filter((n) => n.tags.includes(t));
}

export function getNote(path) {
  return generated.notes[path] ?? null;
}

export function backlinksFor(path) {
  return generated.backlinks[path] ?? [];
}
