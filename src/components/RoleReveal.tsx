import { useEffect, useRef, useState } from "react";
import { roleById, REFLECTION_PROMPT } from "../data/roles";
import { computeGap, computeOrientation, computeStability, GAP_DESC, GAP_LABEL, STABILITY_DESC, STABILITY_LABEL } from "../data/logic";
import { POLICY_CATEGORIES, optionLabel } from "../data/policies";
import type { PolicyChoice } from "../types";
import { Card, PrimaryButton } from "./ui";

export function RoleReveal({
  roleId,
  design1,
  onSpin,
}: {
  roleId?: string;
  design1?: PolicyChoice;
  onSpin?: () => void;
}) {
  const [justSpun, setJustSpun] = useState(false);
  const [spinning, setSpinning] = useState(false);
  const sawRoleId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (roleId && sawRoleId.current !== roleId) {
      setJustSpun(true);
      setSpinning(false);
      const timeout = window.setTimeout(() => setJustSpun(false), 1800);
      sawRoleId.current = roleId;
      return () => window.clearTimeout(timeout);
    }
  }, [roleId]);

  function handleSpin() {
    setSpinning(true);
    onSpin?.();
  }

  const role = roleById(roleId);
  const orientation = design1 ? computeOrientation(design1) : undefined;
  const stability = role && orientation ? computeStability(orientation, role.tier) : undefined;
  const gap = orientation ? computeGap(orientation) : undefined;

  return (
    <div className="grid gap-8 sm:grid-cols-2 sm:items-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <div
          className={`h-56 w-56 rounded-full border-4 border-white shadow-[0_0_0_1px_rgba(37,99,235,0.15),0_10px_40px_rgba(37,99,235,0.2)] ${justSpun || spinning ? "animate-[wai-spin_1.8s_cubic-bezier(0.2,0.8,0.2,1)]" : "pulse-glow"}`}
          style={{
            background:
              "conic-gradient(#2563eb 0deg 60deg, #60a5fa 60deg 120deg, #f2c14e 120deg 180deg, #059669 180deg 240deg, #ef4444 240deg 300deg, #1e3a8a 300deg 360deg)",
          }}
        />
        {role ? (
          <p className="font-mono-label text-[12px] text-ink-faint">결과가 공개됐습니다</p>
        ) : onSpin ? (
          <PrimaryButton onClick={handleSpin} disabled={spinning}>
            {spinning ? "돌리는 중…" : "룰렛 돌리기"}
          </PrimaryButton>
        ) : (
          <p className="font-mono-label text-[12px] text-ink-faint">아직 역할이 공개되지 않았습니다</p>
        )}
      </div>

      <div className="flex flex-col gap-4">
        {role ? (
          <>
            <Card label="미래의 나">
              <p className="text-xl italic text-ink">"{role.headline}"</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-dim">{role.situation}</p>
              <p className="mt-2 text-[12px] text-ink-faint">우선순위: {role.priorities.join(", ")}</p>
            </Card>
            {design1 && (
              <Card label="우리 팀의 1차 설계 · 이 결과의 원인">
                <div className="flex flex-wrap gap-1.5">
                  {POLICY_CATEGORIES.map((c) => (
                    <span
                      key={c.id}
                      className="font-mono-label rounded-full border border-line bg-surface-2 px-2.5 py-1 text-[10.5px] text-ink-dim"
                    >
                      {optionLabel(c.id, design1[c.id])}
                    </span>
                  ))}
                </div>
              </Card>
            )}
            {stability && gap && (
              <div className="flex gap-3">
                <div className="flex-1 rounded-xl border border-line bg-surface-2 px-4 py-3">
                  <div className="font-mono-label text-[10px] uppercase text-ink-faint">내 삶의 안정도</div>
                  <div className="mt-1 text-base font-bold text-brand-ink">{STABILITY_LABEL[stability]}</div>
                  <div className="mt-1.5 text-[11.5px] leading-snug text-ink-dim">{STABILITY_DESC[stability]}</div>
                </div>
                <div className="flex-1 rounded-xl border border-line bg-surface-2 px-4 py-3">
                  <div className="font-mono-label text-[10px] uppercase text-ink-faint">사회 격차</div>
                  <div className="mt-1 text-base font-bold text-brand-ink">{GAP_LABEL[gap]}</div>
                  <div className="mt-1.5 text-[11.5px] leading-snug text-ink-dim">{GAP_DESC[gap]}</div>
                </div>
              </div>
            )}
            <Card label="성찰">
              <p className="text-[15px] italic text-ink">"{REFLECTION_PROMPT}"</p>
            </Card>
          </>
        ) : (
          <Card label="곧 확인하게 될 것들">
            <p className="text-[13px] leading-relaxed text-ink-dim">
              룰렛을 돌리면 이 사회 속에서 당신이 살아갈 역할, <b className="text-ink">"미래의 나"</b>가 공개됩니다. 부자일 수도,
              형편이 어려운 사람일 수도 있어요.
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              {[
                ["미래의 나", "배정된 역할과 그 사람의 우선순위"],
                ["우리 팀의 1차 설계", "이 결과로 이어진 우리 팀의 선택"],
                ["내 삶의 안정도 · 사회 격차", "그 선택이 이 역할에게 남긴 결과"],
                ["성찰 질문", "이 역할이 되어 다시 생각해볼 질문"],
              ].map(([title, desc], i) => (
                <div key={title} className="flex gap-2.5">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-dim text-[11px] font-black text-brand-ink">
                    {i + 1}
                  </span>
                  <p className="text-[12.5px] leading-snug text-ink-dim">
                    <b className="text-ink">{title}</b> — {desc}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
