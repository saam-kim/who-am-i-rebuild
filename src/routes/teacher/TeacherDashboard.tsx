import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  adjustStageTime,
  isTeamConnected,
  revealAllRoles,
  revealRoleForTeam,
  setRouletteMode,
  setStage,
  undoStage,
  useSession,
} from "../../store/sessionStore";
import { formatClock, useCountdown } from "../../components/useCountdown";
import { Chip, GhostButton, PrimaryButton } from "../../components/ui";
import { WordCloud } from "../../components/WordCloud";
import { PostItWall } from "../../components/PostItWall";
import { countWords } from "../../data/wordcloud";
import { POLICY_CATEGORIES, optionLabel } from "../../data/policies";
import { pickWeightedRole, roleById } from "../../data/roles";
import { computeOrientation, ORIENTATION_LABEL, ORIENTATION_RANK } from "../../data/logic";
import { downloadSessionCsv } from "../../data/csv";
import { STAGE_META, type SessionState, type Stage, type Team } from "../../types";
import { PreviewModal } from "./PreviewModal";

export function TeacherDashboard() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const session = useSession(code);
  const [previewOpen, setPreviewOpen] = useState(false);

  if (session === undefined) return null; // 연결 확인 중
  if (session === null) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-bold text-ink">세션을 찾을 수 없어요.</p>
        <PrimaryButton onClick={() => navigate("/teacher")}>새 세션 만들기</PrimaryButton>
      </div>
    );
  }

  const teams = Object.values(session.teams).sort((a, b) => a.joinedAt - b.joinedAt);

  return (
    <div className="min-h-screen p-4">
      <div className="glass-card mx-auto max-w-6xl overflow-hidden rounded-[14px]">
        <ShellTop
          code={code}
          session={session}
          onOpenPreview={() => setPreviewOpen(true)}
          onExportCsv={() => downloadSessionCsv(session)}
        />
        <div className="flex flex-col md:flex-row">
          <Sidebar code={code} teams={teams} expectedTeamCount={session.expectedTeamCount} />
          <main className="min-w-0 flex-1 overflow-x-auto p-4">
            <StagePanel code={code} session={session} teams={teams} />
          </main>
        </div>
      </div>

      {previewOpen && <PreviewModal session={session} onClose={() => setPreviewOpen(false)} />}
    </div>
  );
}

function ShellTop({
  code,
  session,
  onOpenPreview,
  onExportCsv,
}: {
  code: string;
  session: SessionState;
  onOpenPreview: () => void;
  onExportCsv: () => void;
}) {
  const remaining = useCountdown(session.stageStartedAt, STAGE_META[session.stage].durationSec);
  const timeLow = remaining <= 60;
  return (
    <div className="flex flex-wrap items-center gap-3 border-b border-line bg-surface-1 px-4 py-3">
      <div className="flex flex-col items-start gap-0.5">
        <span className="font-mono-label text-[8.5px] uppercase text-ink-faint">참여 코드</span>
        <span className="font-display pulse-glow rounded-lg border-2 border-brand/15 bg-brand-dim px-3 py-0.5 text-lg font-extrabold tracking-[0.08em] text-brand-ink">
          {code}
        </span>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {([1, 2, 3, 4, 5] as Stage[]).map((stage) => (
          <button
            key={stage}
            onClick={() => setStage(code, stage)}
            className={`font-mono-label rounded-full border px-2.5 py-1 text-[10.5px] transition-all duration-200 ${
              session.stage === stage
                ? "border-brand bg-linear-to-br from-brand to-brand-ink text-white font-bold shadow-[0_4px_10px_rgba(37,99,235,0.25)]"
                : "border-line text-ink-dim hover:-translate-y-0.5 hover:border-brand"
            }`}
          >
            {stage} {STAGE_META[stage].name}
          </button>
        ))}
      </div>
      <div
        className={`font-mono-label ml-auto flex items-center gap-1 rounded-lg border px-1.5 py-1 ${timeLow ? "border-crit/30 bg-crit-bg" : "border-line bg-surface-2"}`}
      >
        <button
          onClick={() => adjustStageTime(code, -60)}
          aria-label="1분 줄이기"
          className="rounded px-1.5 text-[13px] text-ink-dim hover:text-ink"
        >
          −
        </button>
        <span className={`font-display px-1 text-[13px] font-semibold ${timeLow ? "text-crit" : "text-ink"}`}>{formatClock(remaining)}</span>
        <button
          onClick={() => adjustStageTime(code, 60)}
          aria-label="1분 늘리기"
          className="rounded px-1.5 text-[13px] text-ink-dim hover:text-ink"
        >
          +
        </button>
      </div>
      <GhostButton tone="warn" onClick={() => undoStage(code)} disabled={session.stageHistory.length === 0}>
        ◂ 단계 되돌리기
      </GhostButton>
      <GhostButton tone="brand" onClick={() => setStage(code, (session.stage + 1) as Stage)} disabled={session.stage === 5}>
        다음 단계로 ▸
      </GhostButton>
      <GhostButton tone="brand" onClick={onOpenPreview}>
        학생 화면 미리보기
      </GhostButton>
      <GhostButton onClick={onExportCsv}>CSV 다운로드</GhostButton>
    </div>
  );
}

function Sidebar({ code, teams, expectedTeamCount }: { code: string; teams: Team[]; expectedTeamCount: number }) {
  // isTeamConnected는 세션 문서 밖(별도 presence 키)을 읽으므로, 세션이 안 바뀌어도
  // 접속 상태를 최신으로 보여주려면 이 컴포넌트가 스스로 주기적으로 다시 그려야 한다.
  const [, forceTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => forceTick((n) => n + 1), 2000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <aside className="flex flex-col gap-2 border-b border-line bg-surface-0 p-4 md:w-56 md:flex-none md:border-b-0 md:border-r">
      <span className="font-mono-label text-[10px] uppercase text-ink-faint">
        팀 현황 · {teams.length}/{expectedTeamCount}
      </span>
      {teams.length === 0 && <p className="text-[12px] text-ink-faint">아직 입장한 팀이 없어요.</p>}
      {teams.map((team) => {
        const online = isTeamConnected(code, team.id);
        return (
          <div key={team.id} className="flex items-center justify-between gap-2 rounded-lg border border-line bg-surface-1 px-2.5 py-1.5 text-[11px]">
            <span className="truncate text-ink">{team.name}</span>
            <Chip tone={online ? "good" : "crit"}>{online ? "온라인" : "오프라인"}</Chip>
          </div>
        );
      })}
    </aside>
  );
}

function StagePanel({ code, session, teams }: { code: string; session: SessionState; teams: Team[] }) {
  switch (session.stage) {
    case 1:
      return <Stage1Panel teams={teams} expectedTeamCount={session.expectedTeamCount} />;
    case 2:
      return <DesignTablePanel teams={teams} round={1} />;
    case 3:
      return <Stage3Panel code={code} session={session} teams={teams} />;
    case 4:
      return <SecondRoundPanel teams={teams} />;
    case 5:
      return <PresentationPanel teams={teams} />;
    default:
      return null;
  }
}

function PanelCard({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="relative rounded-xl border border-line bg-surface-1 p-4">
      <span className="font-mono-label absolute -top-2.5 left-3 bg-surface-1 px-1.5 text-[10px] uppercase text-ink-faint">{label}</span>
      {children}
    </div>
  );
}

function Stage1Panel({ teams, expectedTeamCount }: { teams: Team[]; expectedTeamCount: number }) {
  const [view, setView] = useState<"cloud" | "postit">("cloud");
  const words = useMemo(() => countWords(teams.map((t) => t.stage1Response ?? "")), [teams]);

  return (
    <div className="flex flex-col gap-3">
      <PanelCard label="학급 접속 현황">
        <p className="text-[13px] text-ink">
          {teams.length}/{expectedTeamCount}팀 접속 중
        </p>
      </PanelCard>
      <PanelCard label="발문 가이드">
        <p className="text-[13px] italic text-ink">"무지의 베일 상태에서, 어떤 규칙이 공정하다고 생각하나요?"</p>
      </PanelCard>
      <PanelCard label="정의로운 사회란? · 실시간">
        <div className="mb-3 flex gap-1.5">
          <button
            onClick={() => setView("cloud")}
            className={`font-mono-label rounded-full border px-2.5 py-1 text-[10.5px] ${view === "cloud" ? "border-brand bg-brand text-white" : "border-line text-ink-dim"}`}
          >
            워드클라우드
          </button>
          <button
            onClick={() => setView("postit")}
            className={`font-mono-label rounded-full border px-2.5 py-1 text-[10.5px] ${view === "postit" ? "border-brand bg-brand text-white" : "border-line text-ink-dim"}`}
          >
            포스트잇
          </button>
        </div>
        {view === "cloud" ? <WordCloud words={words} /> : <PostItWall teams={teams} />}
      </PanelCard>
    </div>
  );
}

function DesignTablePanel({ teams, round }: { teams: Team[]; round: 1 | 2 }) {
  return (
    <PanelCard label={round === 1 ? "팀별 1차 제출 현황" : "팀별 2차 제출 현황"}>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] border-collapse text-[12px]">
          <thead>
            <tr>
              {["팀", "세금", "예산", "최저임금", "상태"].map((h) => (
                <th key={h} className="font-mono-label border border-line bg-brand-dim px-2.5 py-1.5 text-left text-[10.5px] uppercase text-brand-ink">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => {
              const design = round === 1 ? team.design1 : team.design2;
              const prev = round === 2 ? team.design1 : undefined;
              const submitted = Boolean(design?.submittedAt);
              const changed = prev && design ? POLICY_CATEGORIES.some((c) => prev[c.id] && prev[c.id] !== design[c.id]) : false;
              return (
                <tr key={team.id}>
                  <td className="border border-line px-2.5 py-1.5">{team.name}</td>
                  <td className="border border-line px-2.5 py-1.5">{optionLabel("tax", design?.tax)}</td>
                  <td className="border border-line px-2.5 py-1.5">{optionLabel("budget", design?.budget)}</td>
                  <td className="border border-line px-2.5 py-1.5">{optionLabel("wage", design?.wage)}</td>
                  <td className="border border-line px-2.5 py-1.5">
                    {submitted ? <Chip tone={changed ? "warn" : "good"}>{changed ? "변경됨" : "완료"}</Chip> : <Chip tone="warn">작성중</Chip>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </PanelCard>
  );
}

function Stage3Panel({ code, session, teams }: { code: string; session: SessionState; teams: Team[] }) {
  return (
    <div className="flex flex-col gap-3">
      <PanelCard label="룰렛 실행 컨트롤">
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setRouletteMode(code, "all")}
            className={`font-mono-label rounded-lg border px-3 py-1.5 text-[11px] ${session.rouletteMode === "all" ? "border-brand bg-brand-dim text-brand-ink" : "border-line text-ink-dim"}`}
          >
            전체 동시 실행 모드
          </button>
          <button
            onClick={() => setRouletteMode(code, "perTeam")}
            className={`font-mono-label rounded-lg border px-3 py-1.5 text-[11px] ${session.rouletteMode === "perTeam" ? "border-brand bg-brand-dim text-brand-ink" : "border-line text-ink-dim"}`}
          >
            팀별 개별 실행 모드
          </button>
        </div>
        {session.rouletteMode === "all" && (
          <div className="mt-3">
            <PrimaryButton onClick={() => revealAllRoles(code, () => pickWeightedRole().id)}>지금 전체 공개</PrimaryButton>
          </div>
        )}
      </PanelCard>
      <PanelCard label="공개된 역할">
        <div className="flex flex-col gap-1.5">
          {teams.map((team) => {
            const role = roleById(team.roleId);
            return (
              <div key={team.id} className="flex items-center justify-between gap-2 text-[12px]">
                <span className="text-ink">{team.name}</span>
                {role ? (
                  <Chip tone="good">{role.headline}</Chip>
                ) : session.rouletteMode === "perTeam" ? (
                  <GhostButton tone="brand" onClick={() => revealRoleForTeam(code, team.id, pickWeightedRole().id)}>
                    공개
                  </GhostButton>
                ) : (
                  <Chip tone="warn">대기중</Chip>
                )}
              </div>
            );
          })}
        </div>
      </PanelCard>
    </div>
  );
}

// 2차 토론(사건카드)과 2차 설계가 학생 화면에서 한 단계로 합쳐졌으니,
// 교사 화면에서도 "뉴스 확인했는지"와 "2차 제출 현황"을 한 패널에서 같이 본다.
function SecondRoundPanel({ teams }: { teams: Team[] }) {
  return (
    <div className="flex flex-col gap-3">
      <PanelCard label="사건카드 확인 현황">
        <div className="flex flex-wrap gap-2">
          {teams.map((team) => (
            <Chip key={team.id} tone={team.eventCardIds?.length ? "good" : "warn"}>
              {team.name} {team.eventCardIds?.length ? "확인함" : "대기중"}
            </Chip>
          ))}
        </div>
      </PanelCard>
      <DesignTablePanel teams={teams} round={2} />
    </div>
  );
}

// 팀별로 설계가 어떤 옵션에 얼마나 몰렸는지(학급 전체 분포) — 1차/2차 모두에 재사용
function DesignDistributionPanel({ teams, round }: { teams: Team[]; round: 1 | 2 }) {
  const getDesign = (t: Team) => (round === 1 ? t.design1 : t.design2);
  const submittedTeams = teams.filter((t) => getDesign(t)?.submittedAt);
  return (
    <PanelCard label={round === 1 ? "학급 전체 1차 설계 분포 · 역할 공개 전" : "학급 전체 2차 설계 분포 · 역할 공개 후"}>
      {submittedTeams.length === 0 ? (
        <p className="text-[12px] text-ink-faint">아직 제출한 팀이 없어요.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {POLICY_CATEGORIES.map((category) => (
            <div key={category.id}>
              <p className="font-mono-label mb-1 text-[10px] uppercase text-ink-faint">{category.title}</p>
              <div className="flex flex-col gap-1">
                {category.options.map((option) => {
                  const count = submittedTeams.filter((t) => getDesign(t)?.[category.id] === option.id).length;
                  const pct = Math.round((count / submittedTeams.length) * 100);
                  return (
                    <div key={option.id} className="flex items-center gap-2 text-[11px]">
                      <span className="w-20 flex-none text-ink-dim">{option.label}</span>
                      <div className="h-3 flex-1 overflow-hidden rounded-full bg-surface-2">
                        <div className="h-full rounded-full bg-brand" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="font-mono-label w-14 flex-none text-right text-ink-faint">
                        {count}팀 · {pct}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </PanelCard>
  );
}

// 역할을 겪은 뒤 각 팀의 정책 성향이 효율↔보장 축에서 어느 쪽으로 옮겨갔는지
function RoleShiftPanel({ teams }: { teams: Team[] }) {
  const rows = teams
    .filter((t) => t.design1?.submittedAt && t.design2?.submittedAt && t.roleId)
    .map((team) => {
      const role = roleById(team.roleId);
      const o1 = computeOrientation(team.design1!);
      const o2 = computeOrientation(team.design2!);
      const delta = ORIENTATION_RANK[o2] - ORIENTATION_RANK[o1];
      return { team, role, o1, o2, delta };
    });
  const movedTowardSecurity = rows.filter((r) => r.delta > 0).length;

  return (
    <PanelCard label="역할 공개 후 설계 변화 · 1차 → 2차">
      {rows.length === 0 ? (
        <p className="text-[12px] text-ink-faint">아직 2차 제출과 역할 공개가 모두 끝난 팀이 없어요.</p>
      ) : (
        <div className="flex flex-col gap-3">
          <p className="text-[12.5px] text-ink">
            {rows.length}팀 중 <b className="text-brand-ink">{movedTowardSecurity}팀</b>이 역할을 겪은 뒤 더 보장 쪽으로 정책을
            옮겼어요.
          </p>
          <div className="flex flex-col gap-1.5">
            {rows.map(({ team, role, o1, o2, delta }) => (
              <div key={team.id} className="flex items-center justify-between gap-2 text-[12px]">
                <span className="text-ink">
                  {team.name} <span className="text-ink-faint">· {role?.headline}</span>
                </span>
                <span className="font-mono-label flex items-center gap-1 text-[10.5px]">
                  <span className="text-ink-dim">{ORIENTATION_LABEL[o1]}</span>
                  <span className="text-ink-faint">→</span>
                  <Chip tone={delta > 0 ? "good" : delta < 0 ? "crit" : "warn"}>{ORIENTATION_LABEL[o2]}</Chip>
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </PanelCard>
  );
}

function PresentationPanel({ teams }: { teams: Team[] }) {
  return (
    <div className="flex flex-col gap-3">
      <DesignDistributionPanel teams={teams} round={1} />
      <DesignDistributionPanel teams={teams} round={2} />
      <RoleShiftPanel teams={teams} />
      <PanelCard label="팀별 발표 카드">
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => (
            <div key={team.id} className="rounded-lg border border-line bg-surface-0 p-3 text-[12px]">
              <p className="font-semibold text-ink">{team.name}</p>
              <p className="mt-1 text-ink-dim">{roleById(team.roleId)?.headline ?? "역할 미공개"}</p>
              <p className="mt-1 italic text-ink-dim">{team.presentationComment || "코멘트 없음"}</p>
            </div>
          ))}
        </div>
      </PanelCard>
    </div>
  );
}
