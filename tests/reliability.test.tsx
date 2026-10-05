// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, renderHook, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const dbMock = vi.hoisted(() => ({ onValue: vi.fn(), transaction: vi.fn(), set: vi.fn() }));
vi.mock("../src/store/firebase", () => ({ db: {} }));
vi.mock("firebase/database", () => ({
  ref: (_db: unknown, path: string) => path, onValue: dbMock.onValue,
  runTransaction: dbMock.transaction, get: vi.fn(), set: dbMock.set,
}));
import { useSession, subscribePresence, touchTeam } from "../src/store/sessionStore";
import { ConnectionNotice } from "../src/components/ConnectionNotice";
import { RoleReveal } from "../src/components/RoleReveal";
import { DesignScreen, PresentationScreen } from "../src/routes/student/StudentPlay";
import { TeamActionsProvider } from "../src/components/TeamActions";
import { safeSessionStorage } from "../src/utils/storage";
import { buildSessionCsv } from "../src/data/csv";
import { ROLE_CARDS } from "../src/data/roles";
import type { SessionState, Team } from "../src/types";
const team: Team = { id: "t1", name: "팀", joinedAt: 1,
  design1: { tax: "shared", budget: "opportunity", wage: "gradual", reason: "근거" } };
const session: SessionState = { code: "1234", stage: 2, stageStartedAt: null,
  createdAt: 1, updatedAt: 1, stageHistory: [], expectedTeamCount: 5, teams: { t1: team } };

beforeEach(() => { vi.clearAllMocks(); dbMock.onValue.mockReturnValue(vi.fn()); });
afterEach(() => { cleanup(); vi.restoreAllMocks(); vi.useRealTimers(); });

describe("연결과 저장 회귀", () => {
  it("연결 지연 중 접속 상태 쓰기를 무한히 쌓지 않는다", async () => {
    let finish!: () => void;
    dbMock.set.mockReturnValue(new Promise<void>((resolve) => { finish = resolve; }));
    touchTeam("1234", "t1");
    touchTeam("1234", "t1");
    expect(dbMock.set).toHaveBeenCalledTimes(1);
    await act(async () => { finish(); });
    touchTeam("1234", "t1");
    expect(dbMock.set).toHaveBeenCalledTimes(2);
    await act(async () => {});
  });
  it("잘못된 참여 코드 경로는 DB를 구독하지 않는다", () => {
    const { result } = renderHook(() => useSession("invalid#code"));
    expect(result.current).toBeNull();
    expect(dbMock.onValue).not.toHaveBeenCalled();
  });
  it("구독 권한 오류는 로딩 상태로 남지 않고 오류로 전달된다", () => {
    const unsubscribe = vi.fn();
    dbMock.onValue.mockReturnValue(unsubscribe);
    const { result, unmount } = renderHook(() => useSession("1234"));
    const failure = new Error("permission_denied");
    act(() => dbMock.onValue.mock.calls[0][2](failure));
    expect(result.current).toBe(failure);
    unmount();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
  it("접속 상태 구독은 화면을 떠날 때 해제된다", () => {
    const unsubscribe = vi.fn();
    dbMock.onValue.mockReturnValue(unsubscribe);
    const stop = subscribePresence("1234");
    stop();
    expect(unsubscribe).toHaveBeenCalledTimes(1);
  });
  it("연결 지연을 안내하고 서버에 재연결되면 안내를 없앤다", async () => {
    vi.useFakeTimers();
    render(<ConnectionNotice />);
    expect(screen.queryByRole("status")).toBeNull();
    await act(async () => { await vi.advanceTimersByTimeAsync(6000); });
    expect(screen.getByRole("status")).toBeTruthy();
    act(() => dbMock.onValue.mock.calls[0][1]({ val: () => true }));
    expect(screen.queryByRole("status")).toBeNull();
  });
  it("제출 저장 실패를 완료로 표시하지 않고 재시도할 수 있다", async () => {
    let reject!: (error: Error) => void;
    const updateTeam = vi.fn().mockImplementationOnce(() => new Promise<void>((_resolve, fail) => { reject = fail; })).mockResolvedValue(undefined);
    render(<TeamActionsProvider value={{ isPreview: true, updateTeam, revealRoleForTeam: vi.fn() }}>
      <DesignScreen code="1234" teamId="t1" session={session} team={team} />
    </TeamActionsProvider>);
    fireEvent.click(screen.getByRole("button", { name: "팀 제출" }));
    await waitFor(() => expect(updateTeam).toHaveBeenCalledTimes(1));
    expect(screen.queryByText(/제출 완료!/)).toBeNull();
    await act(async () => { reject(new Error("denied")); });
    expect(screen.getByRole("alert")).toBeTruthy();
    fireEvent.click(screen.getByRole("button", { name: "팀 제출" }));
    await waitFor(() => expect(screen.getByText(/제출 완료!/)).toBeTruthy());
  });
  it("룰렛 저장 실패 후 다시 돌릴 수 있다", async () => {
    render(<RoleReveal onSpin={vi.fn().mockRejectedValue(new Error("denied"))} />);
    fireEvent.click(screen.getByRole("button", { name: "룰렛 돌리기" }));
    await waitFor(() => expect(screen.getByRole("alert")).toBeTruthy());
    expect((screen.getByRole("button", { name: "룰렛 돌리기" }) as HTMLButtonElement).disabled).toBe(false);
  });
  it("쓰기만 차단된 저장소에서도 팀 ID를 메모리에서 복원한다", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => { throw new Error("quota"); });
    vi.spyOn(console, "warn").mockImplementation(() => {});
    safeSessionStorage.setItem("reliability-team", "t1");
    expect(safeSessionStorage.getItem("reliability-team")).toBe("t1");
    safeSessionStorage.removeItem("reliability-team");
    expect(safeSessionStorage.getItem("reliability-team")).toBeNull();
  });
  it("CSV는 학생 입력을 수식이 아닌 텍스트로 내보낸다", () => {
    const csv = buildSessionCsv({ ...session, teams: { t1: { ...team, reflection: '=HYPERLINK("example")' } } });
    expect(csv).toContain("'=HYPERLINK");
  });
  it("발표의 사회 격차는 최종 2차 설계로 계산한다", () => {
    render(<PresentationScreen code="1234" teamId="t1" session={session}
      team={{ ...team, roleId: ROLE_CARDS[0].id, design2: { tax: "ability", budget: "basic", wage: "living" } }} onGoWrapUp={() => {}} />);
    expect(screen.getByText("사회 격차").parentElement?.textContent).toContain("작음");
  });
});
