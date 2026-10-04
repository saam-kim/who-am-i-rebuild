// @vitest-environment jsdom
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebouncedField } from "../src/components/useDebouncedField";

describe("입력 자동 저장", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("서버 응답이 오기 전에는 저장됨을 표시하지 않는다", async () => {
    let finish!: () => void;
    const save = vi.fn(() => new Promise<void>((resolve) => { finish = resolve; }));
    const { result, unmount } = renderHook(() => useDebouncedField("", save));
    act(() => result.current.onChange("입력"));
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(save).toHaveBeenCalledWith("입력");
    expect(result.current.saved).toBe(false);
    await act(async () => { finish(); });
    expect(result.current.saved).toBe(true);
    unmount();
  });

  it("실패를 표시하고 새 입력으로 다시 저장할 수 있다", async () => {
    const save = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() => useDebouncedField("", save));
    act(() => result.current.onChange("첫 입력"));
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(result.current.saved).toBe(false);
    expect(result.current.error).toBe(true);
    act(() => result.current.onChange("재시도"));
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(result.current.saved).toBe(true);
    expect(result.current.error).toBe(false);
    unmount();
  });

  it("단계 전환 시 대기 중인 마지막 입력을 한 번 저장한다", async () => {
    const save = vi.fn().mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() => useDebouncedField("", save));
    act(() => { result.current.onChange("이전 입력"); result.current.onChange("마지막 입력"); });
    await act(async () => { unmount(); });
    expect(save).toHaveBeenCalledTimes(1);
    expect(save).toHaveBeenCalledWith("마지막 입력");
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(save).toHaveBeenCalledTimes(1);
  });

  it("느린 저장을 순서대로 처리하고 이전 응답으로 새 입력을 저장됨 표시하지 않는다", async () => {
    let finish!: () => void;
    const save = vi.fn().mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }))
      .mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() => useDebouncedField("", save));
    act(() => result.current.onChange("이전 입력"));
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    act(() => result.current.onChange("새 입력"));
    await act(async () => { finish(); });
    expect(result.current.saved).toBe(false);
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(save.mock.calls.map(([value]) => value)).toEqual(["이전 입력", "새 입력"]);
    expect(result.current.saved).toBe(true);
    unmount();
  });

  it("새 입력의 대기 시간이 끝나도 이전 서버 저장이 끝날 때까지 순서를 지킨다", async () => {
    let finish!: () => void;
    const save = vi.fn().mockImplementationOnce(() => new Promise<void>((resolve) => { finish = resolve; }))
      .mockResolvedValue(undefined);
    const { result, unmount } = renderHook(() => useDebouncedField("", save));
    act(() => result.current.onChange("첫 입력"));
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    act(() => result.current.onChange("둘째 입력"));
    await act(async () => { await vi.advanceTimersByTimeAsync(500); });
    expect(save).toHaveBeenCalledTimes(1);
    expect(result.current.saved).toBe(false);
    await act(async () => { finish(); });
    expect(save.mock.calls.map(([value]) => value)).toEqual(["첫 입력", "둘째 입력"]);
    expect(result.current.saved).toBe(true);
    unmount();
  });
});
