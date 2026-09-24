// Workspaces — the persistence layer for analyses.
//
// A Workspace is one piece of work: a drill case, a review of a real system,
// or a free-form study. Drills auto-create workspaces; review tab can save to
// workspaces; future phases (P5–P10) will save their own kinds.
//
// Shape:
//   {
//     id, name, kind, caseId?, drill?, review?, notes, tags,
//     createdAt, updatedAt, completedAt
//   }
//
// Storage: a single localStorage entry "hld-workspaces" holding an array.
// Legacy migration: prior `hld-drill-${caseId}` keys are converted to drill
// workspaces on first read, then removed.
//
// API is sync because backed by localStorage. Components subscribe via the
// `useWorkspaces` hook — re-reads on storage events from other tabs.

import { useEffect, useState } from "react";
import { getCase } from "./drillCases.js";

const STORAGE_KEY = "hld-workspaces";
const MIGRATION_FLAG = "hld-workspaces-migrated-v1";

let migrated = false;

function readRaw() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeRaw(list) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* quota errors ignored */
  }
}

function makeId(prefix = "ws") {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

function nowISO() {
  return new Date().toISOString();
}

function migrateLegacyDrillKeys() {
  if (migrated) return;
  if (typeof localStorage === "undefined") return;
  if (localStorage.getItem(MIGRATION_FLAG)) {
    migrated = true;
    return;
  }

  const existing = readRaw();
  const existingByCaseId = new Set(
    existing.filter((w) => w.kind === "drill").map((w) => w.caseId),
  );
  const newOnes = [];

  // Collect legacy keys (length is dynamic — copy first)
  const legacyKeys = [];
  for (let i = 0; i < localStorage.length; i += 1) {
    const key = localStorage.key(i);
    if (key && key.startsWith("hld-drill-") && key !== "hld-drill-undefined") {
      legacyKeys.push(key);
    }
  }

  for (const key of legacyKeys) {
    try {
      const caseId = key.substring("hld-drill-".length);
      if (!caseId || existingByCaseId.has(caseId)) {
        localStorage.removeItem(key);
        continue;
      }
      const old = JSON.parse(localStorage.getItem(key) || "{}");
      const hasContent =
        Object.values(old.constraints || {}).some(Boolean) ||
        (old.components || []).length > 0;
      if (!hasContent) {
        localStorage.removeItem(key);
        continue;
      }
      const drillCase = getCase(caseId);
      newOnes.push({
        id: makeId("ws"),
        name: drillCase ? `${drillCase.title} (drill)` : `Drill: ${caseId}`,
        kind: "drill",
        caseId,
        drill: {
          constraints: old.constraints || {},
          components: old.components || [],
          rubric: old.rubric || {},
          step: typeof old.step === "number" ? old.step : 0,
        },
        notes: "",
        tags: [],
        createdAt: nowISO(),
        updatedAt: nowISO(),
        completedAt: old.completedAt || null,
      });
      localStorage.removeItem(key);
    } catch {
      /* skip bad entry */
    }
  }

  if (newOnes.length > 0) {
    writeRaw([...newOnes, ...existing]);
  }
  localStorage.setItem(MIGRATION_FLAG, "1");
  migrated = true;
}

function readAll() {
  migrateLegacyDrillKeys();
  return readRaw();
}

export function listWorkspaces() {
  return readAll().sort(
    (a, b) =>
      new Date(b.updatedAt || 0).getTime() -
      new Date(a.updatedAt || 0).getTime(),
  );
}

export function getWorkspace(id) {
  if (!id) return null;
  return readAll().find((w) => w.id === id) || null;
}

export function findDrillWorkspace(caseId) {
  if (!caseId) return null;
  return (
    readAll().find((w) => w.kind === "drill" && w.caseId === caseId) || null
  );
}

export function findOutageWorkspace(outageId) {
  if (!outageId) return null;
  return (
    readAll().find((w) => w.kind === "outage" && w.outageId === outageId) ||
    null
  );
}

export function findBugFinderWorkspace(scenarioId) {
  if (!scenarioId) return null;
  return (
    readAll().find(
      (w) => w.kind === "bugfinder" && w.scenarioId === scenarioId,
    ) || null
  );
}

export function findFailureWorkspace(drillWorkspaceId) {
  if (!drillWorkspaceId) return null;
  return (
    readAll().find(
      (w) => w.kind === "failure" && w.failureRef === drillWorkspaceId,
    ) || null
  );
}

export function createWorkspace(partial) {
  const ws = {
    id: makeId("ws"),
    name: partial.name || "Untitled workspace",
    kind: partial.kind || "review",
    notes: "",
    tags: [],
    createdAt: nowISO(),
    updatedAt: nowISO(),
    completedAt: null,
    ...partial,
  };
  const all = readAll();
  writeRaw([ws, ...all]);
  notify();
  return ws;
}

export function updateWorkspace(id, patch) {
  if (!id) return null;
  const all = readAll();
  const idx = all.findIndex((w) => w.id === id);
  if (idx === -1) return null;
  const existing = all[idx];
  // Allow nested patch via patch.drill / patch.review (shallow merge per kind)
  const merged = {
    ...existing,
    ...patch,
    drill: patch.drill ? { ...existing.drill, ...patch.drill } : existing.drill,
    review: patch.review
      ? { ...existing.review, ...patch.review }
      : existing.review,
    outage: patch.outage
      ? { ...existing.outage, ...patch.outage }
      : existing.outage,
    bugfinder: patch.bugfinder
      ? { ...existing.bugfinder, ...patch.bugfinder }
      : existing.bugfinder,
    updatedAt: nowISO(),
  };
  all[idx] = merged;
  writeRaw(all);
  notify();
  return merged;
}

export function deleteWorkspace(id) {
  if (!id) return;
  const all = readAll();
  writeRaw(all.filter((w) => w.id !== id));
  notify();
}

export function ensureDrillWorkspace(caseId) {
  const drillCase = getCase(caseId);
  if (!drillCase) return null;
  const existing = findDrillWorkspace(caseId);
  if (existing) return existing;
  return createWorkspace({
    name: `${drillCase.title} (drill)`,
    kind: "drill",
    caseId,
    drill: {
      constraints: {},
      components: [],
      rubric: {},
      step: 0,
    },
  });
}

export function ensureOutageWorkspace(outageId, outageTitle) {
  if (!outageId) return null;
  const existing = findOutageWorkspace(outageId);
  if (existing) return existing;
  return createWorkspace({
    name: `${outageTitle || outageId} (replay)`,
    kind: "outage",
    outageId,
    outage: {
      step: 0,
      currentAttempt: null,
      attempts: [],
    },
  });
}

export function ensureBugFinderWorkspace(scenarioId, scenarioTitle) {
  if (!scenarioId) return null;
  const existing = findBugFinderWorkspace(scenarioId);
  if (existing) return existing;
  return createWorkspace({
    name: `${scenarioTitle || scenarioId} (bug hunt)`,
    kind: "bugfinder",
    scenarioId,
    bugfinder: {
      step: 0,
      currentAttempt: null,
      attempts: [],
    },
  });
}

export function ensureFailureWorkspace(drillWorkspaceId, name) {
  if (!drillWorkspaceId) return null;
  const existing = findFailureWorkspace(drillWorkspaceId);
  if (existing) return existing;
  return createWorkspace({
    name: `${name || drillWorkspaceId} (failure drill)`,
    kind: "failure",
    failureRef: drillWorkspaceId,
    failure: {
      step: 0,
      currentAttempt: null,
      attempts: [],
    },
  });
}

export function statusOf(workspace) {
  if (!workspace) return null;
  if (workspace.completedAt) return "completed";
  if (
    workspace.kind === "outage" &&
    (workspace.outage?.attempts?.length || 0) > 0
  ) {
    const latest = workspace.outage.attempts[workspace.outage.attempts.length - 1];
    if (latest?.reflectedAt && !workspace.outage.currentAttempt) {
      return "completed";
    }
  }
  if (
    workspace.kind === "bugfinder" &&
    (workspace.bugfinder?.attempts?.length || 0) > 0
  ) {
    const latest =
      workspace.bugfinder.attempts[workspace.bugfinder.attempts.length - 1];
    if (latest?.completedAt && !workspace.bugfinder.currentAttempt) {
      return "completed";
    }
  }
  if (
    workspace.kind === "failure" &&
    (workspace.failure?.attempts?.length || 0) > 0
  ) {
    const latest =
      workspace.failure.attempts[workspace.failure.attempts.length - 1];
    if (latest?.score && !workspace.failure.currentAttempt) {
      return "completed";
    }
  }
  return "in-progress";
}

// ---- pubsub for in-page updates -------------------------------------------

const listeners = new Set();

function notify() {
  for (const fn of listeners) {
    try {
      fn();
    } catch {
      /* ignore listener errors */
    }
  }
}

if (typeof window !== "undefined") {
  window.addEventListener("storage", (event) => {
    if (event.key === STORAGE_KEY) notify();
  });
}

export function subscribe(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function useWorkspaces() {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);
  return { workspaces: listWorkspaces(), refresh: () => setVersion((v) => v + 1) };
}

export function useWorkspace(id) {
  const [version, setVersion] = useState(0);
  useEffect(() => subscribe(() => setVersion((v) => v + 1)), []);
  return getWorkspace(id);
}
