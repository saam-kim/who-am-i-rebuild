import { beforeEach, describe, expect, it, vi } from "vitest";
const { transaction } = vi.hoisted(() => ({ transaction: vi.fn() }));
vi.mock("../src/store/firebase", () => ({ db: {} }));
vi.mock("firebase/database", () => ({
  ref: (_db: unknown, path: string) => path,
  runTransaction: transaction,
  get: vi.fn(), onValue: vi.fn(), set: vi.fn(),
}));
import { updateSession } from "../src/store/sessionStore";
import type { SessionState } from "../src/types";

describe("세션 트랜잭션", () => {
  beforeEach(() => vi.clearAllMocks());
  it("미리보기에서는 DB 쓰기를 시도하지 않는다", async () => {
    const mutate = vi.fn();
    await updateSession("__preview__", mutate);
    expect(transaction).not.toHaveBeenCalled();
    expect(mutate).not.toHaveBeenCalled();
  });
  it("초기 빈 캐시에서는 가짜 문서를 만들지 않고 서버 값으로 재시도한다", async () => {
    const mutate = vi.fn((draft: SessionState) => { draft.teams.t1 = { id: "t1", name: "팀", joinedAt: 1 }; });
    transaction.mockImplementation(async (_ref, callback, options) => {
      expect(callback(null)).toBeNull();
      expect(mutate).not.toHaveBeenCalled();
      const result = callback({ code: "1234", stage: 1 });
      expect(result.teams.t1.id).toBe("t1");
      expect(result.stageHistory).toEqual([]);
      expect(result.updatedAt).toBeTypeOf("number");
      expect(options).toEqual({ applyLocally: false });
      return { committed: true, snapshot: { exists: () => true } };
    });
    await updateSession("1234", mutate);
    expect(mutate).toHaveBeenCalledTimes(1);
  });
  it("없는 세션을 변경하려 해도 문서를 새로 만들지 않는다", async () => {
    const mutate = vi.fn();
    transaction.mockImplementation(async (_ref, callback) => {
      expect(callback(null)).toBeNull();
      return { committed: true, snapshot: { exists: () => false } };
    });
    await expect(updateSession("9999", mutate)).rejects.toThrow("세션을 찾을 수 없거나");
    expect(mutate).not.toHaveBeenCalled();
  });
});
