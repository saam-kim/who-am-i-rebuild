import type { ReactNode } from "react";

export function Card({
  label,
  children,
  className = "",
  dark = false,
}: {
  label?: string;
  children: ReactNode;
  className?: string;
  dark?: boolean;
}) {
  // dark로 전체 클래스 세트를 통째로 분기한다 — bg-surface-1과 bg-impact-surface를
  // 문자열로 같이 넘기면 Tailwind 캐스케이드 순서상 어느 게 이길지 보장이 안 된다.
  return (
    <div
      className={`relative rounded-2xl border p-4 ${dark ? "border-impact-line bg-impact-surface" : "border-line bg-surface-1"} ${className}`}
    >
      {label && (
        <span
          className={`font-mono-label absolute -top-2.5 left-3 px-1.5 text-[10px] uppercase ${dark ? "bg-impact-surface text-impact-ink-dim" : "bg-surface-1 text-ink-faint"}`}
        >
          {label}
        </span>
      )}
      {children}
    </div>
  );
}

const CHIP_STYLES: Record<"good" | "warn" | "crit" | "brand", string> = {
  good: "bg-good-bg text-good border-good",
  warn: "bg-warn-bg text-warn border-warn",
  crit: "bg-crit-bg text-crit border-crit",
  brand: "bg-brand-dim text-brand-ink border-brand",
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
      className="font-mono-label rounded-xl bg-brand px-5 py-3 text-center text-sm font-bold uppercase text-white shadow-[0_10px_24px_-8px_rgba(79,70,229,0.55)] transition active:scale-[0.98] disabled:cursor-not-allowed disabled:bg-line-strong disabled:text-ink-faint disabled:shadow-none"
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  onClick,
  tone = "ink",
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "ink" | "warn" | "brand";
}) {
  const toneClass =
    tone === "warn"
      ? "border-warn text-warn bg-warn-bg"
      : tone === "brand"
        ? "border-brand text-brand-ink bg-brand-dim"
        : "border-line text-ink-dim bg-transparent";
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-mono-label rounded-lg border px-3 py-1.5 text-[11px] ${toneClass}`}
    >
      {children}
    </button>
  );
}
