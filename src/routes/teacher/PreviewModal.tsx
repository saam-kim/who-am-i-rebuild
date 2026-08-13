import { useState } from "react";
import { StatusBar } from "../../components/StatusBar";
import { PolicyPicker } from "../../components/PolicyPicker";
import { RoleReveal } from "../../components/RoleReveal";
import { EventCardsView } from "../../components/EventCardsView";
import { Card, Chip } from "../../components/ui";
import { pickEventCards } from "../../data/events";
import { computeOrientation } from "../../data/logic";
import { pickWeightedRole } from "../../data/roles";
import type { PolicyChoice, SessionState } from "../../types";

// 교사가 혼자 리허설할 때 쓰는 학생 화면 미리보기. 실제 팀 데이터를 쓰지 않고
// 예시 데이터로 지금 단계의 학생 화면이 어떻게 보이는지만 보여준다.

export function PreviewModal({ session, onClose }: { session: SessionState; onClose: () => void }) {
  const [demoChoice, setDemoChoice] = useState<PolicyChoice>({ tax: "shared", budget: "opportunity", wage: "gradual", reason: "예시 근거입니다." });
  const [demoRoleId] = useState(() => pickWeightedRole().id);
  const orientation = computeOrientation(demoChoice);
  const demoCards = pickEventCards(orientation);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-impact-bg/70 p-6" onClick={onClose}>
      <div className="flex w-full max-w-lg flex-col gap-3" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <span className="font-mono-label text-[12px] text-white">학생 화면 미리보기 · STAGE {session.stage}</span>
          <button onClick={onClose} className="font-mono-label rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-[11px] text-white">
            닫기
          </button>
        </div>
        <div className="max-h-[80vh] overflow-y-auto rounded-2xl border border-line bg-surface-0 shadow-2xl">
          {session.stage === 1 && (
            <>
              <StatusBar stage={1} stageStartedAt={session.stageStartedAt} cta="곧 시작합니다" />
              <div className="flex flex-col gap-3 p-4">
                <Card label="무지의 베일">
                  <p className="text-[13px] italic text-ink">"당신은 자신이 어떤 계층으로 태어날지 모릅니다."</p>
                </Card>
              </div>
            </>
          )}
          {session.stage === 2 && (
            <>
              <StatusBar stage={2} stageStartedAt={session.stageStartedAt} cta="상의해서 함께 제출" />
              <div className="p-4">
                <PolicyPicker value={demoChoice} onChange={setDemoChoice} onSubmit={() => {}} submitLabel="팀 제출 (미리보기)" />
              </div>
            </>
          )}
          {session.stage === 3 && (
            <div className="bg-impact-bg p-4">
              <RoleReveal roleId={demoRoleId} design1={demoChoice} />
            </div>
          )}
          {session.stage === 4 && (
            <>
              <StatusBar stage={4} stageStartedAt={session.stageStartedAt} cta="다른 시민의 처지 생각해보기" />
              <div className="flex flex-col gap-3 p-4">
                <Card label="사건 · 뉴스 카드">
                  <EventCardsView cards={demoCards} />
                </Card>
              </div>
            </>
          )}
          {session.stage === 5 && (
            <>
              <StatusBar stage={5} stageStartedAt={session.stageStartedAt} cta="재검토 후 최종 제출" />
              <div className="p-4">
                <PolicyPicker
                  value={demoChoice}
                  previousChoice={{ tax: "low", budget: "growth", wage: "market" }}
                  onChange={setDemoChoice}
                  onSubmit={() => {}}
                  submitLabel="최종 제출 (미리보기)"
                />
              </div>
            </>
          )}
          {session.stage === 6 && (
            <>
              <StatusBar stage={6} stageStartedAt={session.stageStartedAt} cta="여정을 정리해서 발표" />
              <div className="flex flex-col gap-3 p-4">
                <Card label="우리 팀의 여정">
                  <Chip tone="brand">예시 팀</Chip>
                </Card>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
