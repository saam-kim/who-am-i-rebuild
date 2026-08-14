import { useEffect, useMemo, useState, type ReactNode } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getMyTeamId, touchTeam, updateTeam, useSession } from "../../store/sessionStore";
import { StatusBar } from "../../components/StatusBar";
import { PolicyPicker } from "../../components/PolicyPicker";
import { RoleReveal } from "../../components/RoleReveal";
import { EventCardsView } from "../../components/EventCardsView";
import { Card, Chip, PrimaryButton } from "../../components/ui";
import { useDebouncedField } from "../../components/useDebouncedField";
import { IntroFlow } from "../../components/IntroModals";
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

  if (session === undefined) return null; // 연결 확인 중
  if (session === null) {
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
      return <DesignScreen code={code} teamId={teamId} session={session} team={team} />;
    case 3:
      return <RoleRevealScreen session={session} team={team} />;
    case 4:
      return <SecondRoundScreen code={code} teamId={teamId} session={session} team={team} />;
    case 5:
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
  stage: 1 | 2 | 3 | 4 | 5;
  stageStartedAt: number | null;
  cta: string;
  teamName: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-surface-0">
      <StatusBar stage={stage} stageStartedAt={stageStartedAt} cta={cta} />
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-3 p-6">
        <div className="flex items-center justify-between">
          <Chip tone="brand">{teamName}</Chip>
        </div>
        {children}
      </div>
    </div>
  );
}

export function LobbyScreen({
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
      <IntroFlow code={code} teamId={teamId} />

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2 lg:items-start">
        <Card label="무지의 베일이란?" className="lg:h-full">
          <p className="text-[14px] italic text-ink">"당신은 자신이 어떤 계층으로 태어날지 모릅니다."</p>
          <p className="mt-3 text-[13px] leading-relaxed text-ink-dim">
            내가 부자일지 가난할지 모른 채 규칙을 정하면, 오히려 더 공정한 규칙을 만들게 된다는 철학자 롤스의 생각입니다.
          </p>
        </Card>

        <Card label="지금 할 일 · 5분">
          <p className="text-[14px] italic text-ink">"내가 가장 불리한 자리에서 태어나도 이 규칙을 받아들일 수 있을까?"</p>
          <p className="mt-3 mb-2 text-[13px] leading-relaxed text-ink-dim">
            짝과 이야기 나눠보고, 우리 팀이 생각하는 <b className="text-ink">정의로운 사회</b>를 한 문장으로 적어주세요. 정답은
            없어요 — 다른 팀들의 생각과 함께 교사 화면에 모여 표시됩니다.
          </p>
          <textarea
            value={response}
            onChange={(e) => handleInput(e.target.value)}
            placeholder="예: 누구나 최소한의 삶을 보장받는 사회"
            rows={2}
            className="w-full resize-none rounded-lg border border-line bg-surface-0 p-2.5 text-[13px] text-ink outline-none focus:border-brand"
          />
          <div className="mt-1.5 flex justify-end">
            <Chip tone={saved ? "good" : "warn"}>{saved ? "저장됨" : "저장 중…"}</Chip>
          </div>
        </Card>
      </div>

      <p className="font-mono-label text-center text-[11px] text-ink-faint">
        교사가 다음 단계로 넘기면 정책 설계 화면이 자동으로 열립니다.
      </p>
    </Screen>
  );
}

export function DesignScreen({
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
  // 세션 스토어는 최대 1초 지연으로 반영되기 때문에, 편집 중인 값은
  // 로컬 state를 기준으로 삼고 스토어에는 저장만 fire-and-forget으로 보낸다.
  // (스토어 프롭을 그대로 controlled value로 쓰면 빠른 연속 선택 시 값이 씹힌다.)
  const [value, setValue] = useState<PolicyChoice>(team.design1 ?? {});

  function persist(next: PolicyChoice) {
    updateTeam(code, teamId, (t) => (t.design1 = next));
  }

  return (
    <Screen stage={2} stageStartedAt={session.stageStartedAt} cta="상의해서 함께 제출" teamName={team.name}>
      <PolicyPicker
        value={value}
        onChange={(next) => {
          setValue(next);
          persist(next);
        }}
        onSubmit={() => {
          const submitted = { ...value, submittedAt: Date.now() };
          setValue(submitted);
          persist(submitted);
        }}
        submitLabel="팀 제출"
      />
    </Screen>
  );
}

export function RoleRevealScreen({ session, team }: { session: SessionState; team: Team }) {
  return (
    <Screen stage={3} stageStartedAt={session.stageStartedAt} cta="진행 중" teamName={team.name}>
      <div className="flex flex-1 items-center py-4">
        <RoleReveal roleId={team.roleId} design1={team.design1} />
      </div>
    </Screen>
  );
}

// 2차 토론(사건카드)과 2차 설계를 한 화면으로 합쳤다 — 뉴스를 보고 → 그 자리에서
// 바로 정책을 다시 설계하는 하나의 흐름이라서다.
export function SecondRoundScreen({
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

  // 2차 설계도 백지가 아니라 1차 선택을 출발점으로 준다 — "재검토"는 처음부터
  // 다시 고르는 게 아니라 바꿀 것만 바꾸는 작업이라서다. 이유(reason)는 "왜
  // 바뀌었는지"를 새로 묻는 것이므로 비워서 시작한다.
  const initialValue: PolicyChoice =
    team.design2 ?? (design1 ? { tax: design1.tax, budget: design1.budget, wage: design1.wage } : {});
  const [value, setValue] = useState<PolicyChoice>(initialValue);

  function persist(next: PolicyChoice) {
    updateTeam(code, teamId, (t) => (t.design2 = next));
  }

  return (
    <Screen stage={4} stageStartedAt={session.stageStartedAt} cta="뉴스를 보고 정책 다시 설계하기" teamName={team.name}>
      <Card label="사건 · 뉴스 카드">
        <p className="mb-2 text-[12px] text-ink-dim">우리 팀이 1차로 설계한 사회에서, 실제로 이런 일들이 벌어졌어요.</p>
        <EventCardsView cards={cards} />
      </Card>
      <PolicyPicker
        value={value}
        previousChoice={design1}
        onChange={(next) => {
          setValue(next);
          persist(next);
        }}
        onSubmit={() => {
          const submitted = { ...value, submittedAt: Date.now() };
          setValue(submitted);
          persist(submitted);
        }}
        submitLabel="최종 제출"
      />
    </Screen>
  );
}

export function PresentationScreen({
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
    <Screen stage={5} stageStartedAt={session.stageStartedAt} cta="여정을 정리해서 발표" teamName={team.name}>
      <Card label="우리 팀의 여정">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <PolicyStoryCard n="1차 설계" design={team.design1} tone="brand" />
          <StoryCard n="미래의 나" text={roleById(team.roleId)?.headline ?? "-"} tone="good" />
          <StoryCard n="사건 카드" text={team.eventCardIds?.length ? "확인함" : "-"} tone="warn" />
          <PolicyStoryCard n="2차 설계" design={team.design2} tone="crit" />
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

type StoryTone = "brand" | "good" | "warn" | "crit";
const STORY_BORDER: Record<StoryTone, string> = {
  brand: "border-t-brand",
  good: "border-t-good",
  warn: "border-t-warn",
  crit: "border-t-crit",
};
const STORY_LABEL: Record<StoryTone, string> = {
  brand: "text-brand-ink",
  good: "text-good",
  warn: "text-warn",
  crit: "text-crit",
};

function StoryCard({ n, text, tone }: { n: string; text: string; tone: StoryTone }) {
  return (
    <div className={`flex flex-col gap-2 rounded-xl border border-line ${STORY_BORDER[tone]} border-t-[3px] bg-surface-1 p-3.5`}>
      <span className={`font-mono-label text-[10px] ${STORY_LABEL[tone]}`}>{n}</span>
      <span className="text-[13px] font-semibold leading-snug text-ink">{text}</span>
    </div>
  );
}

function PolicyStoryCard({ n, design, tone }: { n: string; design?: PolicyChoice; tone: StoryTone }) {
  return (
    <div className={`flex flex-col gap-2 rounded-xl border border-line ${STORY_BORDER[tone]} border-t-[3px] bg-surface-1 p-3.5`}>
      <span className={`font-mono-label text-[10px] ${STORY_LABEL[tone]}`}>{n}</span>
      {design ? (
        <div className="flex flex-col gap-1 text-[12.5px] font-semibold text-ink">
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
