import { fsrs, generatorParameters, createEmptyCard, Rating } from "ts-fsrs";
import { ALL_TERMS } from "../data/terms.js";
import { OUTAGE_REPLAYS } from "../data/outageReplays.js";

const STORAGE_KEY = "hld-fsrs";
const f = fsrs(generatorParameters({ enable_fuzz: false }));

const RATING = { again: Rating.Again, hard: Rating.Hard, good: Rating.Good, easy: Rating.Easy };

let cache = null;
export function _resetForTest() { cache = null; }

function readStates() {
  if (cache) return cache;
  try {
    cache = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    cache = {};
  }
  return cache;
}

function writeStates(states) {
  cache = states;
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(states)); } catch { /* quota */ }
}

export function buildDeck() {
  const termCards = ALL_TERMS.map((t) => ({
    id: `term:${t.term}`,
    kind: "term",
    front: t.term,
    back: `${t.beginner}\n\nWhen: ${t.when}`,
    sourceNotes: t.sourceNotes || [],
  }));
  const outageCards = OUTAGE_REPLAYS.map((r) => ({
    id: `outage:${r.id}`,
    kind: "outage",
    front: `${r.title} (${r.year}) — what were the key lessons?`,
    back: r.keyLessons.map((l) => `• ${l}`).join("\n"),
    sourceNotes: [r.path],
  }));
  return [...termCards, ...outageCards];
}

function cardStateFor(id, states) {
  const raw = states[id];
  if (!raw) return createEmptyCard(new Date(0));
  return { ...raw, due: new Date(raw.due), last_review: raw.last_review ? new Date(raw.last_review) : undefined };
}

export function getDueItems(now = new Date()) {
  const states = readStates();
  return buildDeck().filter((card) => cardStateFor(card.id, states).due <= now);
}

export function recordReview(cardId, rating, now = new Date()) {
  const states = readStates();
  const current = cardStateFor(cardId, states);
  const result = f.next(current, now, RATING[rating]);
  writeStates({ ...states, [cardId]: result.card });
  return result.card;
}

export function dueCount(now = new Date()) {
  return getDueItems(now).length;
}
