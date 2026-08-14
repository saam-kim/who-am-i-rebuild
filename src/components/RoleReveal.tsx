import { useEffect, useRef, useState } from "react";
import { roleById, REFLECTION_PROMPT } from "../data/roles";
import { computeGap, computeOrientation, computeStability, GAP_DESC, GAP_LABEL, STABILITY_DESC, STABILITY_LABEL } from "../data/logic";
import type { PolicyChoice } from "../types";
import { Card } from "./ui";

export function RoleReveal({ roleId, design1 }: { roleId?: string; design1?: PolicyChoice }) {
  const [justSpun, setJustSpun] = useState(false);
  const sawRoleId = useRef<string | undefined>(undefined);

  useEffect(() => {
    if (roleId && sawRoleId.current !== roleId) {
      setJustSpun(true);
      const timeout = window.setTimeout(() => setJustSpun(false), 1800);
      sawRoleId.current = roleId;
      return () => window.clearTimeout(timeout);
    }
  }, [roleId]);

  const role = roleById(roleId);
  const orientation = design1 ? computeOrientation(design1) : undefined;
  const stability = role && orientation ? computeStability(orientation, role.tier) : undefined;
  const gap = orientation ? computeGap(orientation) : undefined;

  return (
    <div className="grid gap-8 sm:grid-cols-2 sm:items-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <div
          className={`h-48 w-48 rounded-full border-4 border-white shadow-[0_0_0_1px_rgba(37,99,235,0.15),0_10px_40px_rgba(37,99,235,0.2)] ${justSpun ? "animate-[wai-spin_1.8s_cubic-bezier(0.2,0.8,0.2,1)]" : "pulse-glow"}`}
          style={{
            background:
              "conic-gradient(#2563eb 0deg 60deg, #60a5fa 60deg 120deg, #f2c14e 120deg 180deg, #059669 180deg 240deg, #ef4444 240deg 300deg, #1e3a8a 300deg 360deg)",
          }}
        />
        <p className="font-mono-label text-[12px] text-ink-faint">
          {role ? "결과가 공개됐습니다" : "교사가 룰렛을 실행하면 자동 시작"}
        </p>
      </div>

      <div className="flex flex-col gap-4">
        {role ? (
          <>
            <Card label="미래의 나">
              <p className="text-xl italic text-ink">"{role.headline}"</p>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-dim">{role.situation}</p>
              <p className="mt-2 text-[12px] text-ink-faint">우선순위: {role.priorities.join(", ")}</p>
            </Card>
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
          <Card>
            <p className="text-[13px] text-ink-faint">아직 역할이 공개되지 않았습니다.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
