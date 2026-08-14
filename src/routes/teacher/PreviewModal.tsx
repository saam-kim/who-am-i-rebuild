import { useState } from "react";
import {
  DesignScreen,
  LobbyScreen,
  PresentationScreen,
  RoleRevealScreen,
  SecondRoundScreen,
} from "../student/StudentPlay";
import { pickEventCards } from "../../data/events";
import { computeOrientation } from "../../data/logic";
import { pickWeightedRole } from "../../data/roles";
import type { SessionState, Team } from "../../types";

// 교사가 혼자 리허설할 때 쓰는 학생 화면 미리보기. 학생 화면 컴포넌트를 그대로
// 재사용해서, 학생 화면이 바뀌면 미리보기도 자동으로 같이 바뀌게 한다 —
// 예전엔 여기 따로 목업을 만들어뒀다가 실제 화면과 조용히 어긋난 적이 있었다.
// code/teamId는 실제 세션에 존재하지 않는 값이라 여기서 발생하는 저장 시도는
// 조용히 무시된다(스토어가 없는 세션 코드에 대한 쓰기는 no-op).

const PREVIEW_CODE = "__preview__";
const PREVIEW_TEAM_ID = "preview-team";

export function PreviewModal({ session, onClose }: { session: SessionState; onClose: () => void }) {
  const [demoTeam] = useState<Team>(() => {
    const design1 = { tax: "shared", budget: "opportunity", wage: "gradual", reason: "예시 근거입니다.", submittedAt: Date.now() };
    const design2 = { tax: "ability", budget: "basic", wage: "living", reason: "예시로 바꿔본 이유입니다.", submittedAt: Date.now() };
    return {
      id: PREVIEW_TEAM_ID,
      name: "예시 팀",
      joinedAt: Date.now(),
      stage1Response: "누구나 최소한의 삶을 보장받는 사회",
      design1,
      design2,
      roleId: pickWeightedRole().id,
      roleRevealedAt: Date.now(),
      eventCardIds: pickEventCards(computeOrientation(design1)).map((c) => c.id),
      presentationComment: "우리는 성장과 안전망 사이에서 균형을 찾으려 했습니다.",
    };
  });

  const demoSession: SessionState = {
    ...session,
    code: PREVIEW_CODE,
    teams: { [PREVIEW_TEAM_ID]: demoTeam },
  };

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
          {demoSession.stage === 1 && <LobbyScreen code={PREVIEW_CODE} teamId={PREVIEW_TEAM_ID} session={demoSession} team={demoTeam} />}
          {demoSession.stage === 2 && (
            <DesignScreen code={PREVIEW_CODE} teamId={PREVIEW_TEAM_ID} session={demoSession} team={demoTeam} />
          )}
          {demoSession.stage === 3 && <RoleRevealScreen session={demoSession} team={demoTeam} />}
          {demoSession.stage === 4 && (
            <SecondRoundScreen code={PREVIEW_CODE} teamId={PREVIEW_TEAM_ID} session={demoSession} team={demoTeam} />
          )}
          {demoSession.stage === 5 && (
            <PresentationScreen
              code={PREVIEW_CODE}
              teamId={PREVIEW_TEAM_ID}
              session={demoSession}
              team={demoTeam}
              onGoWrapUp={() => {}}
            />
          )}
        </div>
      </div>
    </div>
  );
}
