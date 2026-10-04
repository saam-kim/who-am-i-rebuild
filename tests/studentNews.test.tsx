// @vitest-environment jsdom
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const { updateTeam } = vi.hoisted(() => ({ updateTeam: vi.fn() }));
vi.mock("../src/store/sessionStore", () => ({
  updateTeam, getMyTeamId: vi.fn(), revealRoleForTeam: vi.fn(), touchTeam: vi.fn(), useSession: vi.fn(),
}));
import { SecondRoundScreen, PresentationScreen } from "../src/routes/student/StudentPlay";
import { resolveEventCards } from "../src/data/events";
import type { SessionState, Team } from "../src/types";

const session: SessionState = {
  code: "1234", className: "테스트", stage: 4, stageStartedAt: null,
  stageHistory: [], teams: {}, expectedTeamCount: 5, createdAt: 1, updatedAt: 1,
};
const makeTeam = (): Team => ({
  id: "t1", name: "테스트 팀", joinedAt: 1,
  design1: { tax: "shared", budget: "basic", wage: "living" },
  eventCardIds: ["sec-1", "sec-4", "sec-2", "sec-3", "sec-6"],
});

describe("학생 뉴스 화면", () => {
  beforeEach(() => { updateTeam.mockReset().mockResolvedValue(undefined); });
  afterEach(cleanup);

  it("옛 세션도 관련 정책을 표시하고 교체 카드를 저장한다", async () => {
    const team = makeTeam();
    render(<SecondRoundScreen code="1234" teamId="t1" team={team} session={session} />);
    expect(screen.queryByText("고소득층 세부담 확대에 반발 여론")).toBeNull();
    expect(screen.getAllByText("세금 정책 · 공동 부담형")).toHaveLength(2);
    expect(screen.getByText(/가상 뉴스입니다/)).toBeTruthy();
    await waitFor(() => expect(updateTeam).toHaveBeenCalledTimes(1));
    const mutate = updateTeam.mock.calls[0][2];
    const latestTeam = { ...team, design1: { ...team.design1, tax: "ability" } };
    mutate(latestTeam);
    expect(latestTeam.eventCardIds).toEqual(resolveEventCards(latestTeam.design1).map((card) => card.id));
    expect(latestTeam.eventCardIds).toContain("tax-ability-warn");
  });

  it("유효한 저장 카드에서는 순서를 유지하고 저장을 반복하지 않는다", () => {
    const team = makeTeam();
    const cards = resolveEventCards(team.design1);
    team.eventCardIds = cards.map((card) => card.id).reverse();
    render(<SecondRoundScreen code="1234" teamId="t1" team={team} session={session} />);
    const headlines = screen.getAllByText((text) => cards.some((card) => card.headline === text));
    expect(headlines.map((element) => element.textContent)).toEqual(cards.map((card) => card.headline).reverse());
    expect(updateTeam).not.toHaveBeenCalled();
  });

  it("발표에서도 예전 뉴스가 남지 않는다", async () => {
    const team = makeTeam();
    render(<PresentationScreen code="1234" teamId="t1" team={team} session={{ ...session, stage: 5 }} onGoWrapUp={() => {}} />);
    const text = screen.getByText(/• 같은 비율/).textContent;
    expect(text).not.toContain("고소득층 세부담 확대");
    for (const card of resolveEventCards(team.design1)) expect(text).toContain(card.headline);
    await waitFor(() => expect(updateTeam).toHaveBeenCalledTimes(1));
  });

  it("1차 정책이 불완전하면 안내를 표시하고 뉴스를 생성하지 않는다", () => {
    const team = makeTeam();
    team.design1 = { tax: "shared" };
    render(<SecondRoundScreen code="1234" teamId="t1" team={team} session={session} />);
    expect(screen.getByText(/모두 선택해야/)).toBeTruthy();
    expect(updateTeam).not.toHaveBeenCalled();
  });

  it("뉴스를 본 적 없는 팀은 발표에서 확인함으로 표시하지 않는다", () => {
    const team = makeTeam();
    delete team.eventCardIds;
    render(<PresentationScreen code="1234" teamId="t1" team={team} session={{ ...session, stage: 5 }} onGoWrapUp={() => {}} />);
    expect(screen.queryByText("5개 확인함")).toBeNull();
    expect(updateTeam).not.toHaveBeenCalled();
  });
});
