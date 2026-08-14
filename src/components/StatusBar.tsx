import { formatClock, useCountdown } from "./useCountdown";
import type { Stage } from "../types";
import { STAGE_META } from "../types";

const TOTAL_STAGES = Object.keys(STAGE_META).length;

export function StatusBar({
  stage,
  stageStartedAt,
  cta,
}: {
  stage: Stage;
  stageStartedAt: number | null;
  cta: string;
}) {
  const remaining = useCountdown(stageStartedAt, STAGE_META[stage].durationSec);
  return (
    <div className="font-mono-label flex items-center justify-between gap-2 border-b border-line bg-surface-2 px-4 py-2.5 text-[11px] text-brand-ink">
      <span>
        {stage}/{TOTAL_STAGES} · {STAGE_META[stage].name}
      </span>
      <span className="font-semibold text-ink">
        <span className={`font-display ${remaining <= 60 ? "text-crit" : ""}`}>{formatClock(remaining)}</span> · {cta}
      </span>
    </div>
  );
}
