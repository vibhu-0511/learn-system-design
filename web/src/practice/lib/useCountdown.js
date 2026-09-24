import { useEffect, useRef, useState } from "react";

export function useCountdown(deadlineMs) {
  const [remaining, setRemaining] = useState(() =>
    deadlineMs ? Math.max(0, deadlineMs - Date.now()) : 0,
  );
  const ref = useRef(null);
  useEffect(() => {
    if (!deadlineMs) return undefined;
    const tick = () => setRemaining(Math.max(0, deadlineMs - Date.now()));
    tick();
    ref.current = setInterval(tick, 1000);
    return () => clearInterval(ref.current);
  }, [deadlineMs]);
  return remaining;
}

export function formatRemaining(ms) {
  const total = Math.ceil(ms / 1000);
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
