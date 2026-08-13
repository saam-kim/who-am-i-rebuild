import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMyTeamId, touchTeam, updateTeam, useSession } from "../../store/sessionStore";
import { StatusBar } from "../../components/StatusBar";
import { PolicyPicker } from "../../components/PolicyPicker";
import { RoleReveal } from "../../components/RoleReveal";
import { EventCardsView } from "../../components/EventCardsView";
import { Card, Chip, PrimaryButton } from "../../components/ui";
import { useDebouncedField } from "../../components/useDebouncedField";
import { EVENT_CARDS, pickEventCards } from "../../data/events";
import { computeOrientation } from "../../data/logic";
import { REFLECTION_PROMPT, roleById } from "../../data/roles";
import { optionLabel } from "../../data/policies";
import type { PolicyChoice, SessionState, Team } from "../../types";

export function StudentPlay() {
  const { code = "" } = useParams();
  const navigate = useNavigate();
  const session = useSession(code);
  const teamId = getMyTeamId(code);
  const [wrapUp, setWrapUp] = useState(false);

  useEffect(() => {
    if (!session) return;
    if (!teamId || !session.teams[teamId]) navigate("/join");
  }, [session, teamId, navigate]);

  useEffect(() => {
    if (!teamId) return;
    touchTeam(code, teamId);
    const id = window.setInterval(() => touchTeam(code, teamId), 5000);
    return () => window.clearInterval(id);
  }, [code, teamId]);

  if (!session) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 p-6 text-center">
        <p className="text-lg font-bold text-ink">세션을 찾을 수 없어요.</p>
        <PrimaryButton onClick={() => navigate("/join")}>참여 코드 다시 입력하기</PrimaryButton>
      </div>
    );
  }
  if (!teamId || !session.teams[teamId]) return null;
  const team = session.teams[teamId];

  if (wrapUp) {
    return <WrapUpScreen code={code} teamId={teamId} reflection={team.reflection} onBack={() => setWrapUp(false)} />;
  }

  switch (session.stage) {
    case 1:
      return <LobbyScreen code={code} teamId={teamId} session={session} team={team} />;
    case 2:
      return <DesignScreen code={code} teamId={teamId} session={session} team={team} round={1} />;
    case 3:
      return <RoleRevealScreen session={session} team={team} />;
    case 4:
      return <EventCardsScreen code={code} teamId={teamId} session={session} team={team} />;
    case 5:
      return <DesignScreen code={code} teamId={teamId} session={session} team={team} round={2} />;
    case 6:
      return <PresentationScreen code={code} teamId={teamId} session={session} team={team} onGoWrapUp={() => setWrapUp(true)} />;
    default:
      return null;
  }
}

function Screen({
  stage,
  stageStartedAt,
  cta,
  teamName,
  children,
}: {
  stage: 1 | 2 | 4 | 5 | 6;
  stageStartedAt: number | null;
  cta: string;
  teamName: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-0">
      <StatusBar stage={stage} stageStartedAt={stageStartedAt} cta={cta} />
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 p-4">
        <div className="flex items-center justify-between">
          <Chip tone="brand">{teamName}</Chip>
        </div>
        {children}
      </div>
    </div>
  );
}

function LobbyScreen({
  code,
  teamId,
  session,
  team,
}: {
  code: string;
  teamId: string;
  session: SessionState;
  team: Team;
}) {
  const { value: response, onChange: handleInput, saved } = useDebouncedField(team.stage1Response ?? "", (next) =>
    updateTeam(code, teamId, (t) => (t.stage1Response = next)),
  );

  return (
    <Screen stage={1} stageStartedAt={session.stageStartedAt} cta="짝과 이야기하고 한 문장 적기" teamName={team.name}>
      <Card label="오늘 우리가 할 일">
        <ol className="flex flex-col gap-1.5 text-[12.5px] text-ink">
          <li>1. 짝과 함께 정책(세금·예산·최저임금)을 설계합니다.</li>
          <li>2. 무작위로 정해진 "미래의 나"가 되어, 그 사람에게 일어난 뉴스를 확인합니다.</li>
          <li>3. 그 관점으로 정책을 다시 설계합니다.</li>
          <li>4. 여정을 한 장의 카드로 정리해 발표합니다.</li>
        </ol>
      </Card>

      <Card label="왜 '미래의 나'를 모른 채 시작하나요?">
        <p className="text-[13px] italic text-ink">"당신은 자신이 어떤 계층으로 태어날지 모릅니다."</p>
        <p className="mt-2 text-[12px] text-ink-dim">
          이걸 <b className="text-ink">무지의 베일</b>이라고 불러요. 내가 부자일지 가난할지 모른 채 규칙을 정하면, 오히려 더
          공정한 규칙을 만들게 된다는 철학자 롤스의 생각입니다.
        </p>
      </Card>

      <Card label="지금 할 일 · 5분">
        <p className="text-[13px] italic text-ink">"내가 가장 불리한 자리에서 태어나도 이 규칙을 받아들일 수 있을까?"</p>
        <p className="mt-2 mb-2 text-[12px] text-ink-dim">
          짝과 이야기 나눠보고, 우리 팀이 생각하는 <b className="text-ink">정의로운 사회</b>를 한 문장으로 적어주세요. 정답은
          없어요 — 다른 팀들의 생각과 함께 교사 화면에 모여 표시됩니다.
        </p>
        <textarea
          value={response}
          onChange={(e) => handleInput(e.target.value)}
          placeholder="예: 누구나 최소한의 삶을 보장받는 사회"
          rows={2}
          className="w-full resize-none rounded-lg border border-line bg-surface-0 p-2 text-[12.5px] text-ink outline-none focus:border-brand"
        />
        <div className="mt-1.5 flex justify-end">
          <Chip tone={saved ? "good" : "warn"}>{saved ? "저장됨" : "저장 중…"}</Chip>
        </div>
      </Card>

      <p className="font-mono-label text-center text-[11px] text-ink-faint">
        교사가 다음 단계로 넘기면 정책 설계 화면이 자동으로 열립니다.
      </p>
    </Screen>
  );
}

function DesignScreen({
  code,
  teamId,
  session,
  team,
  round,
}: {
  code: string;
  teamId: string;
  session: SessionState;
  team: Team;
  round: 1 | 2;
}) {
  const stage = round === 1 ? 2 : 5;
  // 2차 설계는 빈 화면이 아니라 1차 선택을 출발점으로 준다 — "재검토"는
  // 백지에서 다시 고르는 게 아니라 바꿀 것만 바꾸는 작업이라서다. 이유(reason)는
  // "왜 바뀌었는지"를 새로 묻는 것이므로 비워서 시작한다.
  const initialValue: PolicyChoice =
    round === 1
      ? (team.design1 ?? {})
      : (team.design2 ?? (team.design1 ? { tax: team.design1.tax, budget: team.design1.budget, wage: team.design1.wage } : {}));
  // 세션 스토어는 최대 1초 지연으로 반영되기 때문에, 편집 중인 값은
  // 로컬 state를 기준으로 삼고 스토어에는 저장만 fire-and-forget으로 보낸다.
  // (스토어 프롭을 그대로 controlled value로 쓰면 빠른 연속 선택 시 값이 씹힌다.)
  const [value, setValue] = useState<PolicyChoice>(initialValue);

  function persist(next: PolicyChoice) {
    updateTeam(code, teamId, (t) => {
      if (round === 1) t.design1 = next;
      else t.design2 = next;
    });
  }

  return (
    <Screen
      stage={stage}
      stageStartedAt={session.stageStartedAt}
      cta={round === 1 ? "상의해서 함께 제출" : "재검토 후 최종 제출"}
      teamName={team.name}
    >
      <PolicyPicker
        value={value}
        previousChoice={round === 2 ? team.design1 : undefined}
        onChange={(next) => {
          setValue(next);
          persist(next);
        }}
        onSubmit={() => {
          const submitted = { ...value, submittedAt: Date.now() };
          setValue(submitted);
          persist(submitted);
        }}
        submitLabel={round === 1 ? "팀 제출" : "최종 제출"}
      />
    </Screen>
  );
}

function RoleRevealScreen({ session, team }: { session: SessionState; team: Team }) {
  return (
    <div className="flex min-h-screen flex-col bg-impact-bg">
      <StatusBar stage={3} stageStartedAt={session.stageStartedAt} cta="진행 중" dark />
      <div className="mx-auto flex w-full max-w-2xl flex-1 items-center p-4">
        <RoleReveal roleId={team.roleId} design1={team.design1} />
      </div>
    </div>
  );
}

function EventCardsScreen({
  code,
  teamId,
  session,
  team,
}: {
  code: string;
  teamId: string;
  session: SessionState;
  team: Team;
}) {
  const design1 = team.design1;
  const existingIds = team.eventCardIds;

  const cards = useMemo(() => {
    if (existingIds && existingIds.length) {
      return EVENT_CARDS.filter((e) => existingIds.includes(e.id));
    }
    if (!design1) return [];
    const orientation = computeOrientation(design1);
    return pickEventCards(orientation);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [existingIds, design1]);

  useEffect(() => {
    if (!existingIds?.length && cards.length) {
      updateTeam(code, teamId, (t) => (t.eventCardIds = cards.map((c) => c.id)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards]);

  return (
    <Screen stage={4} stageStartedAt={session.stageStartedAt} cta="다른 시민의 처지 생각해보기" teamName={team.name}>
      <Card label="사건 · 뉴스 카드">
        <p className="mb-2 text-[12px] text-ink-dim">우리 팀이 1차로 설계한 사회에서, 실제로 이런 일들이 벌어졌어요.</p>
        <EventCardsView cards={cards} />
      </Card>
      <Card label="토론 질문">
        <p className="text-[13px] italic text-ink">"다른 시민이라면 이 소식을 어떻게 받아들일까?"</p>
      </Card>
    </Screen>
  );
}

function PresentationScreen({
  code,
  teamId,
  session,
  team,
  onGoWrapUp,
}: {
  code: string;
  teamId: string;
  session: SessionState;
  team: Team;
  onGoWrapUp: () => void;
}) {
  const { value: comment, onChange: handleComment } = useDebouncedField(team.presentationComment ?? "", (next) =>
    updateTeam(code, teamId, (t) => (t.presentationComment = next)),
  );

  return (
    <Screen stage={6} stageStartedAt={session.stageStartedAt} cta="여정을 정리해서 발표" teamName={team.name}>
      <Card label="우리 팀의 여정">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <PolicyStoryCard n="1차" design={team.design1} />
          <StoryCard n="역할" text={roleById(team.roleId)?.headline ?? "-"} />
          <StoryCard n="사건" text={team.eventCardIds?.length ? "확인함" : "-"} />
          <PolicyStoryCard n="2차" design={team.design2} />
        </div>
      </Card>
      <Card label="한줄 코멘트">
        <textarea
          value={comment}
          onChange={(e) => handleComment(e.target.value)}
          rows={2}
          className="w-full resize-none rounded-lg border border-line bg-surface-0 p-2 text-[12.5px] text-ink outline-none focus:border-brand"
          placeholder="발표에서 강조하고 싶은 한 줄"
        />
      </Card>
      <div className="flex justify-end gap-2">
        <PrimaryButton onClick={onGoWrapUp}>성찰 기록하러 가기</PrimaryButton>
      </div>
    </Screen>
  );
}

function StoryCard({ n, text }: { n: string; text: string }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface-1 p-2.5 text-[10px]">
      <span className="font-mono-label text-brand">{n}</span>
      <span className="text-ink-dim">{text}</span>
    </div>
  );
}

function PolicyStoryCard({ n, design }: { n: string; design?: PolicyChoice }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-lg border border-line bg-surface-1 p-2.5 text-[10px]">
      <span className="font-mono-label text-brand">{n}</span>
      {design ? (
        <div className="flex flex-col gap-0.5 text-ink-dim">
          <span>{optionLabel("tax", design.tax)}</span>
          <span>{optionLabel("budget", design.budget)}</span>
          <span>{optionLabel("wage", design.wage)}</span>
        </div>
      ) : (
        <span className="text-ink-faint">-</span>
      )}
    </div>
  );
}

function WrapUpScreen({
  code,
  teamId,
  reflection,
  onBack,
}: {
  code: string;
  teamId: string;
  reflection?: string;
  onBack: () => void;
}) {
  const { value: reflectionValue, onChange: handleReflection } = useDebouncedField(reflection ?? "", (next) =>
    updateTeam(code, teamId, (t) => (t.reflection = next)),
  );

  return (
    <div className="flex min-h-screen flex-col bg-surface-0">
      <div className="font-mono-label flex items-center justify-between border-b border-line bg-surface-2 px-4 py-2.5 text-[11px] text-brand-ink">
        <span>수업 마무리</span>
        <button className="text-ink-dim" onClick={onBack}>
          ◂ 발표로 돌아가기
        </button>
      </div>
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-3 p-4">
        <Card label="핵심 개념">
          <div className="flex flex-wrap gap-1.5">
            <Chip tone="good">무지의 베일</Chip>
            <Chip tone="good">차등의 원칙</Chip>
            <Chip tone="good">절차적 정의</Chip>
          </div>
          <p className="mt-3 text-[13px] italic text-ink">
            "정의로운 사회는, 그 규칙을 자신이 어떤 위치에 놓일지 모른 채로도 받아들일 수 있는 사회다."
          </p>
        </Card>
        <Card label="성찰">
          <p className="mb-1 text-[11px] text-ink-faint">"{REFLECTION_PROMPT}" — 오늘 바뀐 생각을 한 줄로 남겨보세요.</p>
          <textarea
            value={reflectionValue}
            onChange={(e) => handleReflection(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-lg border border-line bg-surface-0 p-2 text-[12.5px] text-ink outline-none focus:border-brand"
          />
        </Card>
        <p className="text-center text-[11px] text-ink-faint">이 기록은 평가 대상이 아니라 자유로운 성찰입니다.</p>
      </div>
    </div>
  );
}
