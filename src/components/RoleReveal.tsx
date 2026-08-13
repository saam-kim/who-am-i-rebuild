import { useEffect, useRef, useState } from "react";
import { roleById, REFLECTION_PROMPT } from "../data/roles";
import { computeGap, computeOrientation, computeStability, GAP_LABEL, STABILITY_LABEL } from "../data/logic";
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
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col items-center justify-center gap-3">
        <div
          className={`h-36 w-36 rounded-full border-4 border-impact-surface shadow-[0_10px_30px_rgba(0,0,0,0.4)] ${justSpun ? "animate-[wai-spin_1.8s_cubic-bezier(0.2,0.8,0.2,1)]" : ""}`}
          style={{
            background:
              "conic-gradient(#4f46e5 0deg 60deg, #059669 60deg 120deg, #d97706 120deg 180deg, #8b7cf6 180deg 240deg, #dc2626 240deg 300deg, #34395c 300deg 360deg)",
          }}
        />
        <p className="font-mono-label text-[11px] text-impact-ink-dim">
          {role ? "결과가 공개됐습니다" : "교사가 룰렛을 실행하면 자동 시작"}
        </p>
      </div>

      <div className="flex flex-col gap-3">
        {role ? (
          <>
            <Card label="미래의 나" dark>
              <p className="text-[13px] italic text-impact-ink">"{role.headline}"</p>
              <p className="mt-1.5 text-[12px] text-impact-ink-dim">{role.situation}</p>
              <p className="mt-1.5 text-[11px] text-impact-ink-dim">우선순위: {role.priorities.join(", ")}</p>
            </Card>
            {stability && gap && (
              <div className="flex gap-2">
                <div className="flex-1 rounded-xl border border-impact-line bg-impact-surface px-3 py-2.5">
                  <div className="font-mono-label text-[9.5px] uppercase text-impact-ink-dim">내 삶의 안정도</div>
                  <div className="mt-1 text-sm font-bold text-impact-ink">{STABILITY_LABEL[stability]}</div>
                </div>
                <div className="flex-1 rounded-xl border border-impact-line bg-impact-surface px-3 py-2.5">
                  <div className="font-mono-label text-[9.5px] uppercase text-impact-ink-dim">사회 격차</div>
                  <div className="mt-1 text-sm font-bold text-impact-ink">{GAP_LABEL[gap]}</div>
                </div>
              </div>
            )}
            <Card label="성찰" dark>
              <p className="text-[13px] italic text-impact-ink">"{REFLECTION_PROMPT}"</p>
            </Card>
          </>
        ) : (
          <Card dark>
            <p className="text-[12px] text-impact-ink-dim">아직 역할이 공개되지 않았습니다.</p>
          </Card>
        )}
      </div>
    </div>
  );
}
