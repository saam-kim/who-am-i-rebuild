import { useEffect, useRef, useState } from "react";
import { ROLE_CARDS, roleById, REFLECTION_PROMPT } from "../data/roles";
import { computeGap, computeOrientation, computeStability, GAP_DESC, GAP_LABEL, STABILITY_DESC, STABILITY_LABEL } from "../data/logic";
import { POLICY_CATEGORIES, optionLabel } from "../data/policies";
import type { PolicyChoice } from "../types";
import { Card, PrimaryButton } from "./ui";

// 6개 역할 = 6개 조각. 실제 당첨은 pickWeightedRole()의 가중치 무작위이고
// 화면의 룰렛은 연출용이라 물리적으로 정확히 그 조각에 "멈추는" 건 아니지만,
// 적어도 룰렛 안에 어떤 역할들이 있는지는 학생이 읽을 수 있어야 한다.
const WHEEL_COLORS = ["#2563eb", "#60a5fa", "#f2c14e", "#059669", "#ef4444", "#1e3a8a"];
const WHEEL_TEXT_COLORS = ["#fff", "#0f172a", "#1a2233", "#fff", "#fff", "#fff"];
const WHEEL_GEOMETRY = [
  { path: "M100,100 L100,10 A90,90 0 0,1 177.9,55 Z", label: { x: 130, y: 48 } },
  { path: "M100,100 L177.9,55 A90,90 0 0,1 177.9,145 Z", label: { x: 160, y: 100 } },
  { path: "M100,100 L177.9,145 A90,90 0 0,1 100,190 Z", label: { x: 130, y: 152 } },
  { path: "M100,100 L100,190 A90,90 0 0,1 22.1,145 Z", label: { x: 70, y: 152 } },
  { path: "M100,100 L22.1,145 A90,90 0 0,1 22.1,55 Z", label: { x: 40, y: 100 } },
  { path: "M100,100 L22.1,55 A90,90 0 0,1 100,10 Z", label: { x: 70, y: 48 } },
].map((g, i) => ({ ...g, color: WHEEL_COLORS[i], textColor: WHEEL_TEXT_COLORS[i] }));

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
  const wedges = ROLE_CARDS.slice(0, WHEEL_COLORS.length).map((r, i) => ({ role: r, ...WHEEL_GEOMETRY[i] }));
  const orientation = design1 ? computeOrientation(design1) : undefined;
  const stability = role && orientation ? computeStability(orientation, role.tier) : undefined;
  const gap = orientation ? computeGap(orientation) : undefined;

  return (
    <div className="grid gap-8 sm:grid-cols-2 sm:items-center">
      <div className="flex flex-col items-center justify-center gap-4">
        <svg
          viewBox="0 0 200 200"
          className={`h-56 w-56 rounded-full border-4 border-white shadow-[0_0_0_1px_rgba(37,99,235,0.15),0_10px_40px_rgba(37,99,235,0.2)] ${justSpun || spinning ? "animate-[wai-spin_1.8s_cubic-bezier(0.2,0.8,0.2,1)]" : "pulse-glow"}`}
        >
          {wedges.map((w) => (
            <g key={w.role.id}>
              <path d={w.path} fill={w.color} />
              <text
                x={w.label.x}
                y={w.label.y}
                fill={w.textColor}
                fontSize="13"
                fontWeight="700"
                textAnchor="middle"
                dominantBaseline="middle"
              >
                {w.role.short}
              </text>
            </g>
          ))}
        </svg>
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
