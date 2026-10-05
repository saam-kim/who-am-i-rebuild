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
    <div className="flex w-full gap-3 overflow-x-auto pb-1">
      {cards.map((card) => (
        <div key={card.id} className="flex min-w-44 flex-1 flex-col gap-1.5 rounded-xl border border-line bg-surface-1 px-3 py-2.5">
          <div className="flex items-center justify-between gap-2">
            <span aria-hidden="true" className={`font-mono-label text-base ${SHAPE_COLOR[card.status]}`}>{SHAPE[card.status]}</span>
            <Chip tone={TONE[card.status]}>{LABEL[card.status]}</Chip>
          </div>
          <span className="break-keep text-xs leading-relaxed text-brand-ink">{POLICY_CATEGORIES.find((category) => category.id === card.category)?.title} · {optionLabel(card.category, card.optionId)}</span>
          <span className={`${desktopPreview ? "text-[15px]" : "text-sm"} break-keep font-semibold leading-snug text-ink`}>{card.headline}</span>
          <span className={`${desktopPreview ? "text-sm" : "text-[13px]"} flex-1 break-keep leading-relaxed text-ink-dim`}>{card.body}</span>
        </div>
      ))}
    </div>
  );
}
