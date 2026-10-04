import { useMemo, useRef, useState } from "react";
import {
  DesignScreen, LobbyScreen, PresentationScreen, RoleRevealScreen, SecondRoundScreen, WrapUpScreen,
} from "../student/StudentPlay";
import { TeamActionsProvider } from "../../components/TeamActions";
import type { TeamActions } from "../../components/teamActionsContext";
import { STAGE_META, type SessionState, type Stage, type Team } from "../../types";

// 실제 학생 화면을 독립적인 로컬 팀 상태로 리허설한다.
const PREVIEW_CODE = "__preview__";
const PREVIEW_TEAM_ID = "preview-team";
type PreviewStep = Stage | 6;

function createDemoTeam(): Team {
  return {
    id: PREVIEW_TEAM_ID,
    name: "예시 팀",
    joinedAt: Date.now(),
    stage1Response: "누구나 최소한의 삶을 보장받는 사회",
    design1: { tax: "shared", budget: "opportunity", wage: "gradual", reason: "예시 근거입니다." },
  };
}

export function PreviewModal({ session, onClose }: { session: SessionState; onClose: () => void }) {
  const [step, setStep] = useState<PreviewStep>(session.stage);
  const [startedAt, setStartedAt] = useState(Date.now);
  const [demoTeam, setDemoTeam] = useState(createDemoTeam);
  const [runId, setRunId] = useState(0);
  const [viewport, setViewport] = useState<"desktop" | "tablet">("desktop");
  const [fullScreen, setFullScreen] = useState(false);
  const generation = useRef(0);

  const actions = useMemo<TeamActions>(() => {
    const updatePreviewTeam: TeamActions["updateTeam"] = async (_code, _teamId, mutator) => {
      setDemoTeam((current) => {
        // 초기화 전의 지연 저장이 새 리허설을 덮어쓰지 않도록 한다.
        if (generation.current !== runId) return current;
        const draft = structuredClone(current);
        mutator(draft);
        return draft;
      });
    };
    return {
      isPreview: true,
      previewViewport: viewport,
      updateTeam: updatePreviewTeam,
      revealRoleForTeam: async (code, teamId, roleId) => {
        await updatePreviewTeam(code, teamId, (team) => {
          if (!team.roleId) {
            team.roleId = roleId;
            team.roleRevealedAt = Date.now();
          }
        });
      },
    };
  }, [runId, viewport]);

  function goTo(next: PreviewStep) {
    setStep(next);
    setStartedAt(Date.now());
  }

  function restart() {
    generation.current += 1;
    setRunId(generation.current);
    setDemoTeam(createDemoTeam());
    goTo(1);
  }

  const demoSession: SessionState = {
    ...session, code: PREVIEW_CODE, stage: step === 6 ? 5 : step,
    stageStartedAt: startedAt, teams: { [PREVIEW_TEAM_ID]: demoTeam },
  };
  const screenProps = { code: PREVIEW_CODE, teamId: PREVIEW_TEAM_ID, session: demoSession, team: demoTeam };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center bg-ink/70 ${fullScreen ? "p-0" : "p-3 sm:p-6"}`} onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="학생 화면 리허설" className={`flex w-full flex-col gap-3 ${fullScreen ? "h-screen max-w-none p-3 sm:p-4" : "h-[94vh] max-w-6xl"}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between gap-3 text-white">
          <span className="font-mono-label text-[13px]">학생 화면 리허설 · {step === 6 ? "성찰" : `${step} ${STAGE_META[step].name}`}</span>
          <div className="flex gap-2">
            <button onClick={() => setFullScreen((current) => !current)} className="rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-[12px]">{fullScreen ? "창 크기로" : "전체 화면"}</button>
            <button onClick={restart} className="rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-[12px]">처음부터 다시</button>
            <button onClick={onClose} className="rounded-lg border border-white/30 bg-white/10 px-3 py-1.5 text-[12px]">닫기</button>
          </div>
        </div>
        <div className="flex flex-col gap-2 rounded-xl bg-white p-3">
          <p className="text-[12px] text-ink-dim">기다리지 않고 단계 버튼이나 이전·다음으로 이동하세요. 입력과 선택은 리허설 안에서만 적용됩니다.</p>
          <nav aria-label="리허설 단계" className="flex flex-wrap gap-2">
            {([1, 2, 3, 4, 5, 6] as PreviewStep[]).map((next) => (
              <button key={next} aria-pressed={step === next} onClick={() => goTo(next)} className={`rounded-lg border px-3 py-2 text-[12px] ${step === next ? "border-brand bg-brand text-white" : "border-line text-ink"}`}>
                {next === 6 ? "성찰" : `${next} ${STAGE_META[next].name}`}
              </button>
            ))}
          </nav>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              <button aria-pressed={viewport === "desktop"} onClick={() => setViewport("desktop")} className={`rounded-lg border px-3 py-2 text-[12px] ${viewport === "desktop" ? "border-brand bg-brand-dim text-brand-ink" : "border-line text-ink"}`}>PC 화면</button>
              <button aria-pressed={viewport === "tablet"} onClick={() => setViewport("tablet")} className={`rounded-lg border px-3 py-2 text-[12px] ${viewport === "tablet" ? "border-brand bg-brand-dim text-brand-ink" : "border-line text-ink"}`}>태블릿 폭</button>
              <span className="text-[11px] text-ink-faint">실제 수업에는 반영되지 않습니다.</span>
            </div>
            <div className="flex shrink-0 gap-2">
              <button disabled={step === 1} onClick={() => goTo((step - 1) as PreviewStep)} className="rounded-lg border border-line px-3 py-2 text-[12px] disabled:opacity-40">이전 단계</button>
              <button disabled={step === 6} onClick={() => goTo((step + 1) as PreviewStep)} className="rounded-lg bg-brand px-3 py-2 text-[12px] text-white disabled:opacity-40">다음 단계</button>
            </div>
          </div>
        </div>
        <TeamActionsProvider value={actions}>
          <div key={`${runId}-${step}`} className={`relative isolate mx-auto min-h-0 w-full flex-1 overflow-y-auto rounded-2xl border border-line bg-surface-0 shadow-2xl ${viewport === "tablet" ? "max-w-5xl" : "max-w-none"}`}>
            {step === 1 && <LobbyScreen {...screenProps} />}
            {step === 2 && <DesignScreen {...screenProps} />}
            {step === 3 && <RoleRevealScreen {...screenProps} />}
            {step === 4 && <SecondRoundScreen {...screenProps} />}
            {step === 5 && <PresentationScreen {...screenProps} onGoWrapUp={() => goTo(6)} />}
            {step === 6 && <WrapUpScreen {...screenProps} onBack={() => goTo(5)} />}
          </div>
        </TeamActionsProvider>
      </div>
    </div>
  );
}
