import { useState, type ReactNode } from "react";

// saam-kim/sejong-gerrymandering-rebuild의 "이 활동은 왜 하는 걸까요?" → "지켜야 할 규칙"
// 2단 팝업 패턴을 그대로 가져왔다. 그라데이션 헤더 + 아이콘, 색 배지가 있는 목록,
// 전체 폭 그라데이션 CTA — 우리 화면의 밋밋한 "카드만 쌓기"보다 훨씬 눈에 들어온다.

function ModalShell({
  eyebrow,
  icon,
  title,
  ctaLabel,
  onClose,
  children,
}: {
  eyebrow: string;
  icon: string;
  title: string;
  ctaLabel: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl">
        <div className="flex items-center gap-3 bg-linear-to-br from-brand to-brand-ink px-5 py-4 text-white">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-xl">{icon}</div>
          <div className="min-w-0">
            <p className="text-[10px] font-black uppercase tracking-[0.14em] text-white/70">{eyebrow}</p>
            <h2 className="text-lg font-black leading-tight">{title}</h2>
          </div>
        </div>
        <div className="flex flex-col gap-2.5 px-5 py-4">{children}</div>
        <div className="px-5 pb-5">
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-full items-center justify-center rounded-2xl bg-linear-to-br from-brand to-brand-ink text-base font-black text-white shadow-[0_8px_24px_rgba(37,99,235,0.35)] transition-all duration-250 ease-[cubic-bezier(0.175,0.885,0.32,1.15)] hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(37,99,235,0.45)]"
          >
            {ctaLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

const WHY_REASONS = [
  "지금부터 여러분은 사회를 설계하는 입장이 됩니다. 세금, 예산, 최저임금처럼 실제로 존재하는 정책을 직접 정해요.",
  '그런데 그 사회에서 "내가 누구일지"는 아직 모릅니다 — 부자일지, 형편이 어려울지 모른 채 규칙부터 정하는 거예요.',
  '곧 무작위로 "미래의 나"가 정해지고, 그 사람의 눈으로 우리가 만든 사회가 정말 공정했는지 다시 봅니다.',
  "정답을 맞히는 활동이 아니에요. 왜 그렇게 생각했는지 서로 설명할 수 있으면 충분합니다.",
];

function WhyModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell eyebrow="무지의 베일" icon="⚖️" title="이 활동은 왜 하는 걸까요?" ctaLabel="다음" onClose={onClose}>
      {WHY_REASONS.map((reason, i) => (
        <div key={reason} className="flex gap-2.5">
          <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-dim text-[11px] font-black text-brand-ink">
            {i + 1}
          </span>
          <p className="text-sm font-bold leading-6 text-ink-dim">{reason}</p>
        </div>
      ))}
    </ModalShell>
  );
}

type StepColor = "brand" | "good" | "warn" | "crit";
const STEP_BG: Record<StepColor, string> = { brand: "bg-brand-dim", good: "bg-good-bg", warn: "bg-warn-bg", crit: "bg-crit-bg" };
const STEP_TEXT: Record<StepColor, string> = { brand: "text-brand-ink", good: "text-good", warn: "text-warn", crit: "text-crit" };

const TODAY_STEPS: { icon: string; color: StepColor; title: string; desc: string }[] = [
  { icon: "📜", color: "brand", title: "정책 설계", desc: "짝과 함께 세금·예산·최저임금 방향을 정합니다." },
  { icon: "🎲", color: "good", title: "미래의 나 공개", desc: "무작위로 정해진 역할이 되어, 그 사람에게 일어난 뉴스를 확인합니다." },
  { icon: "🔁", color: "warn", title: "다시 설계", desc: "그 관점으로 정책을 한 번 더 다듬습니다." },
  { icon: "📣", color: "crit", title: "발표", desc: "우리 팀의 여정을 카드로 정리해 나눕니다." },
];

function TodayModal({ onClose }: { onClose: () => void }) {
  return (
    <ModalShell eyebrow="5단계로 진행돼요" icon="🧭" title="오늘의 흐름" ctaLabel="시작하기" onClose={onClose}>
      {TODAY_STEPS.map((step) => (
        <div key={step.title} className="flex gap-3 rounded-2xl border border-line bg-surface-0 p-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-lg ${STEP_BG[step.color]}`}>{step.icon}</div>
          <div className="min-w-0">
            <p className={`text-sm font-black ${STEP_TEXT[step.color]}`}>{step.title}</p>
            <p className="mt-0.5 text-xs font-bold leading-5 text-ink-dim">{step.desc}</p>
          </div>
        </div>
      ))}
      <p className="px-1 text-xs font-bold text-ink-faint">지금처럼 화면 위에 남은 시간과 할 일이 항상 표시돼요.</p>
    </ModalShell>
  );
}

// 팀당 한 번만 — 새로고침해도 다시 뜨지 않도록 로컬에 표시해둔다.
function introSeenKey(code: string, teamId: string) {
  return `wai-intro-seen:${code}:${teamId}`;
}

export function IntroFlow({ code, teamId }: { code: string; teamId: string }) {
  const [phase, setPhase] = useState<"why" | "today" | "done">(() =>
    localStorage.getItem(introSeenKey(code, teamId)) ? "done" : "why",
  );

  if (phase === "why") return <WhyModal onClose={() => setPhase("today")} />;
  if (phase === "today")
    return (
      <TodayModal
        onClose={() => {
          localStorage.setItem(introSeenKey(code, teamId), "1");
          setPhase("done");
        }}
      />
    );
  return null;
}
