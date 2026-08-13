import { useEffect, useState } from "react";

export function useCountdown(stageStartedAt: number | null, durationSec: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);

  if (!stageStartedAt) return durationSec;
  const elapsed = Math.floor((now - stageStartedAt) / 1000);
  return Math.max(0, durationSec - elapsed);
}

export function formatClock(totalSec: number): string {
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
