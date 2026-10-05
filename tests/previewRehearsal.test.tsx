// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const live = vi.hoisted(() => ({ updateTeam: vi.fn(), revealRoleForTeam: vi.fn() }));
vi.mock("../src/store/sessionStore", () => ({
  ...live, getMyTeamId: vi.fn(), touchTeam: vi.fn(), useSession: vi.fn(),
}));
import { PreviewModal } from "../src/routes/teacher/PreviewModal";
import type { SessionState } from "../src/types";

const session: SessionState = {
  code: "1234", stage: 1, stageStartedAt: 1,
  stageHistory: [], expectedTeamCount: 5, createdAt: 1, updatedAt: 1,
  teams: { real: { id: "real", name: "실제 팀", joinedAt: 1, stage1Response: "실제 응답" } },
};

function click(name: string | RegExp) {
  fireEvent.click(screen.getByRole("button", { name, exact: typeof name === "string" }));
}

describe("교사 독립 리허설", () => {
  beforeEach(() => { vi.clearAllMocks(); localStorage.clear(); });
  afterEach(() => {
    cleanup();
    vi.useRealTimers();
    expect(live.updateTeam).not.toHaveBeenCalled();
    expect(live.revealRoleForTeam).not.toHaveBeenCalled();
  });

  it("안내 팝업 중에도 기다리지 않고 모든 단계와 성찰로 이동한다", () => {
    render(<PreviewModal session={session} onClose={() => {}} />);
    expect(screen.getByRole("heading", { name: "이 활동은 왜 하는 걸까요?" })).toBeTruthy();
    click("다음 단계");
    expect(screen.getByRole("button", { name: "팀 제출" })).toBeTruthy();
    click("3 역할 공개");
    expect(screen.getByRole("button", { name: "룰렛 돌리기" })).toBeTruthy();
    click("4 2차 토론·설계");
    expect(screen.getByText(/가상 뉴스입니다/)).toBeTruthy();
    click("5 발표");
    click("성찰 기록하러 가기");
    expect(screen.getByText("수업 마무리")).toBeTruthy();
    click("◂ 발표로 돌아가기");
    expect(screen.getByRole("button", { name: "성찰 기록하러 가기" })).toBeTruthy();
    click("이전 단계");
    expect(screen.getByRole("button", { name: "최종 제출" })).toBeTruthy();
  });

  it("실제 수업을 변경하지 않고 수업 단계 갱신에도 리허설 위치를 유지한다", () => {
    const before = structuredClone(session);
    const { rerender } = render(<PreviewModal session={session} onClose={() => {}} />);
    click("2 1차 설계");
    rerender(<PreviewModal session={{ ...session, stage: 5 }} onClose={() => {}} />);
    expect(screen.getByRole("button", { name: "2 1차 설계" }).getAttribute("aria-pressed")).toBe("true");
    expect(session).toEqual(before);
  });

  it("정책 변경·제출과 역할 룰렛이 로컬 상태에 반영되고 뉴스·발표에 이어진다", async () => {
    render(<PreviewModal session={session} onClose={() => {}} />);
    click("2 1차 설계");
    click(/^능력 부담형/);
    click(/^기본 보장형/);
    click(/^생활 보장형/);
    fireEvent.change(screen.getByPlaceholderText("왜 이 조합을 골랐나요?"), { target: { value: "리허설에서 바꾼 근거" } });
    click("팀 제출");
    click("3 역할 공개");
    click("룰렛 돌리기");
    await waitFor(() => expect(screen.queryByText("아직 역할이 공개되지 않았습니다")).toBeNull());
    click("4 2차 토론·설계");
    expect(screen.getByText("고소득층 세부담 확대에 반발 여론")).toBeTruthy();
    fireEvent.change(screen.getByPlaceholderText("왜 이 조합을 골랐나요?"), { target: { value: "2차 근거" } });
    click("최종 제출");
    click("5 발표");
    expect(screen.getByText('"리허설에서 바꾼 근거"')).toBeTruthy();
    await waitFor(() => expect(screen.getByText('"2차 근거"')).toBeTruthy());
    expect(screen.getByText("뉴스 5개 확인")).toBeTruthy();
    click("2 1차 설계");
    expect(screen.getByText(/제출 완료!/)).toBeTruthy();
    expect((screen.getByPlaceholderText("왜 이 조합을 골랐나요?") as HTMLTextAreaElement).value).toBe("리허설에서 바꾼 근거");
  });

  it("성찰 입력이 화면 이동 후에도 리허설 안에 남는다", async () => {
    render(<PreviewModal session={session} onClose={() => {}} />);
    click("성찰");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "리허설 성찰" } });
    click("5 발표");
    await act(async () => {});
    click("성찰");
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("리허설 성찰");
  });

  it("초기화할 때 이전 입력의 지연 저장이 새 리허설에 섞이지 않는다", async () => {
    vi.useFakeTimers();
    render(<PreviewModal session={session} onClose={() => {}} />);
    click("다음");
    click("시작하기");
    fireEvent.change(screen.getByRole("textbox"), { target: { value: "초기화 전에 입력" } });
    click("처음부터 다시");
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    click("다음");
    click("시작하기");
    expect((screen.getByRole("textbox") as HTMLTextAreaElement).value).toBe("누구나 최소한의 삶을 보장받는 사회");
    expect(localStorage.getItem("wai-intro-seen:__preview__:preview-team")).toBeNull();
    click("3 역할 공개");
    expect(screen.getByRole("button", { name: "룰렛 돌리기" })).toBeTruthy();
  });

  it("PC·태블릿 폭과 전체 화면을 전환해도 선택한 정책을 유지한다", async () => {
    render(<PreviewModal session={session} onClose={() => {}} />);
    expect(screen.getByRole("button", { name: "PC 화면" }).getAttribute("aria-pressed")).toBe("true");
    click("2 1차 설계");
    click(/^낮은 세금형/);
    click("태블릿 폭");
    expect(screen.getByRole("button", { name: "태블릿 폭" }).getAttribute("aria-pressed")).toBe("true");
    click("전체 화면");
    expect(screen.getByRole("button", { name: "창 크기로" })).toBeTruthy();
    click("4 2차 토론·설계");
    await waitFor(() => expect(screen.getByText("세금 부담 줄어, 투자 여력에 기대")).toBeTruthy());
    expect(screen.queryByText("같은 비율의 세금, 부담 기준이 명확해져")).toBeNull();
  });
});
