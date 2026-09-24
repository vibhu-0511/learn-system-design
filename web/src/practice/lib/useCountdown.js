import { useEffect, useState } from "react";

// Remaining ms is derived at render time so it is right on the very first render after a
// deadline appears (a state copy would read 0 for one render and end the interview at once).
export function useCountdown(deadlineMs) {
  const [, tick] = useState(0);
  useEffect(() => {
    if (!deadlineMs) return undefined;
    const id = setInterval(() => tick((n) => n + 1), 1000);
    return () => clearInterval(id);
  }, [deadlineMs]);
  return deadlineMs ? Math.max(0, deadlineMs - Date.now()) : 0;
}

export function formatRemaining(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
