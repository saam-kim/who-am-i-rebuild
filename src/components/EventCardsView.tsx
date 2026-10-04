import type { EventCard } from "../data/events";
import { Chip } from "./ui";
import { optionLabel, POLICY_CATEGORIES } from "../data/policies";
import { useTeamActions } from "./teamActionsContext";

const SHAPE: Record<EventCard["status"], string> = { good: "●", warn: "▲", mixed: "■" };
const TONE: Record<EventCard["status"], "good" | "warn" | "crit"> = { good: "good", warn: "warn", mixed: "crit" };
const SHAPE_COLOR: Record<EventCard["status"], string> = { good: "text-good", warn: "text-warn", mixed: "text-crit" };
const LABEL: Record<EventCard["status"], string> = { good: "긍정", warn: "경고", mixed: "혼합" };

export function EventCardsView({ cards }: { cards: EventCard[] }) {
  const { previewViewport } = useTeamActions();
  const desktopPreview = previewViewport === "desktop";
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {cards.map((card) => (
        <div key={card.id} className={`flex ${desktopPreview ? "min-w-44 flex-1" : "w-40 flex-none"} flex-col gap-1.5 rounded-xl border border-line bg-surface-1 p-2.5`}>
          <span className={`font-mono-label text-sm ${SHAPE_COLOR[card.status]}`}>{SHAPE[card.status]}</span>
          <span className={`${desktopPreview ? "text-[12px]" : "text-[10px]"} text-brand-ink`}>{POLICY_CATEGORIES.find((category) => category.id === card.category)?.title} · {optionLabel(card.category, card.optionId)}</span>
          <span className={`${desktopPreview ? "text-sm" : "text-[11.5px]"} font-semibold text-ink`}>{card.headline}</span>
          <span className={`${desktopPreview ? "text-[13px]" : "text-[10.5px]"} text-ink-dim`}>{card.body}</span>
          <Chip tone={TONE[card.status]}>{LABEL[card.status]}</Chip>
        </div>
      ))}
    </div>
  );
}
