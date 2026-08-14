import type { ReactNode } from "react";

export function Card({
  label,
  children,
  className = "",
}: {
  label?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`glass-card relative rounded-[14px] border border-line p-4 ${className}`}>
      {label && (
        <span className="font-mono-label absolute -top-2.5 left-3 bg-surface-1 px-1.5 text-[10px] uppercase text-ink-faint">
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

const CHIP_STYLES: Record<"good" | "warn" | "crit" | "brand", string> = {
  good: "bg-good-bg text-good border-good/40",
  warn: "bg-warn-bg text-warn border-warn/40",
  crit: "bg-crit-bg text-crit border-crit/40",
  brand: "bg-brand-dim text-brand-ink border-brand/25",
};

export function Chip({ tone = "brand", children }: { tone?: "good" | "warn" | "crit" | "brand"; children: ReactNode }) {
  return (
    <span
      className={`font-mono-label inline-flex w-fit items-center gap-1 rounded-full border px-2.5 py-1 text-[10px] uppercase ${CHIP_STYLES[tone]}`}
    >
      {children}
    </span>
  );
}

export function PrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="font-mono-label rounded-[10px] border border-brand-ink/40 bg-linear-to-br from-brand to-brand-ink px-5 py-3 text-center text-sm font-bold uppercase text-white shadow-[0_4px_10px_rgba(37,99,235,0.25)] transition-all duration-250 ease-[cubic-bezier(0.175,0.885,0.32,1.15)] hover:-translate-y-0.5 hover:shadow-[0_6px_16px_rgba(37,99,235,0.4)] active:translate-y-0 disabled:translate-y-0 disabled:cursor-not-allowed disabled:border-line disabled:bg-none disabled:bg-surface-2 disabled:text-ink-faint disabled:shadow-none"
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  tone = "ink",
  disabled = false,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "ink" | "warn" | "brand";
  disabled?: boolean;
}) {
  const toneClass =
    tone === "warn"
      ? "border-warn/30 text-warn bg-warn-bg"
      : tone === "brand"
        ? "border-brand/25 text-brand-ink bg-brand-dim"
        : "border-line text-ink-dim bg-surface-1";
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`font-mono-label rounded-full border px-3.5 py-1.5 text-[11px] shadow-[0_2px_8px_rgba(15,23,42,0.04)] transition-all duration-200 hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40 disabled:shadow-none disabled:hover:translate-y-0 ${toneClass}`}
    >
      {children}
    </button>
  );
}
