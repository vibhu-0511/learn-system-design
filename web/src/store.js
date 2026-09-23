// localStorage helpers. Every storage call is wrapped in try/catch: private
// windows and blocked storage must never crash the site. Old-app keys ("hld-*")
// are owned by the ported modules; new keys here all start with "lsd-".
import { useEffect, useState } from "react";

const resolve = (initial) => (typeof initial === "function" ? initial() : initial);

function read(key, initial) {
  try {
    const stored = localStorage.getItem(key);
    return stored === null ? resolve(initial) : JSON.parse(stored);
  } catch {
    return resolve(initial);
  }
}

function write(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable or full: keep working in memory */
  }
}

export function useLocal(key, initial) {
  const [value, setValue] = useState(() => read(key, initial));
  useEffect(() => write(key, value), [key, value]);
  return [value, setValue];
}

// ---- theme: "light" | "dusk" ------------------------------------------------

const systemTheme = () => (window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dusk" : "light");

export function useTheme() {
  const [theme, setTheme] = useLocal("lsd-theme", systemTheme);
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
  }, [theme]);
  return [theme, () => setTheme((t) => (t === "dusk" ? "light" : "dusk"))];
}

// ---- progress: { done: [ids], last: id|null, visitedAt: { id: iso } } --------

const PROGRESS_KEY = "lsd-progress";
const listeners = new Set();

export function readProgress() {
  const p = read(PROGRESS_KEY, {});
  return { done: p.done ?? [], last: p.last ?? null, visitedAt: p.visitedAt ?? {} };
}

function saveProgress(next) {
  write(PROGRESS_KEY, next);
  listeners.forEach((fn) => fn());
}

export function markVisited(id) {
  const p = readProgress();
  saveProgress({ ...p, last: id, visitedAt: { ...p.visitedAt, [id]: new Date().toISOString() } });
}

export function toggleDone(id) {
  const p = readProgress();
  saveProgress({ ...p, done: p.done.includes(id) ? p.done.filter((d) => d !== id) : [...p.done, id] });
}

export function useProgress() {
  const [, bump] = useState(0);
  useEffect(() => {
    const refresh = () => bump((n) => n + 1);
    const onStorage = (e) => e.key === PROGRESS_KEY && refresh();
    listeners.add(refresh);
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(refresh);
      window.removeEventListener("storage", onStorage);
    };
  }, []);
  return readProgress();
}
