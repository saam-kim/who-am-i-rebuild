import { describe, expect, it } from "vitest";
import { EVENT_CARDS, pickEventCards, resolveEventCards } from "../src/data/events";
import { POLICY_CATEGORIES } from "../src/data/policies";
import { buildSessionCsv } from "../src/data/csv";
import type { PolicyChoice, SessionState } from "../src/types";

const choices: PolicyChoice[] = POLICY_CATEGORIES[0].options.flatMap((tax) =>
  POLICY_CATEGORIES[1].options.flatMap((budget) =>
    POLICY_CATEGORIES[2].options.map((wage) => ({ tax: tax.id, budget: budget.id, wage: wage.id })),
  ),
);

describe("선택한 정책에 맞는 뉴스", () => {
  it.each(choices)("27가지 조합: $tax / $budget / $wage", (choice) => {
    // 혼합 카드가 어느 분야에서 선택되든 같은 계약을 만족해야 한다.
    for (const randomValue of [0, 0.34, 0.67, 0.999]) {
      const cards = pickEventCards(choice, () => randomValue);
      expect(cards).toHaveLength(5);
      expect(new Set(cards.map((card) => card.id)).size).toBe(5);
      expect(new Set(cards.map((card) => card.category))).toEqual(new Set(["tax", "budget", "wage"]));
      expect(cards.filter((card) => card.status === "good")).toHaveLength(2);
      expect(cards.filter((card) => card.status === "warn")).toHaveLength(2);
      expect(cards.filter((card) => card.status === "mixed")).toHaveLength(1);
      for (const card of cards) expect(card.optionId).toBe(choice[card.category]);
    }
  });

  it("공동 부담형 + 기본 보장형 + 생활 보장형에서 고소득층 세부담 확대를 가정하지 않는다", () => {
    const choice = { tax: "shared", budget: "basic", wage: "living" };
    for (const randomValue of [0, 0.34, 0.67]) {
      const text = pickEventCards(choice, () => randomValue).map((card) => `${card.headline} ${card.body}`).join(" ");
      expect(text).not.toContain("고소득층 세부담 확대");
      expect(text).not.toContain("능력 부담형");
      expect(text).not.toContain("기회 투자형");
      expect(text).not.toContain("점진 인상형");
    }
    expect(pickEventCards({ ...choice, tax: "ability" }, () => 0.5).map((card) => card.headline))
      .toContain("고소득층 세부담 확대에 반발 여론");
  });

  it("선택이 없거나 불완전·잘못된 경우 정책을 임의로 가정하지 않는다", () => {
    for (const choice of [{}, { tax: "shared" }, { tax: "invalid", budget: "basic", wage: "living" }]) {
      expect(pickEventCards(choice)).toEqual([]);
      expect(resolveEventCards(choice, ["sec-3"])).toEqual([]);
    }
    expect(resolveEventCards(undefined, ["sec-3"])).toEqual([]);
  });

  it("모든 정책에 고유한 긍정·경고·혼합 카드가 있다", () => {
    expect(EVENT_CARDS).toHaveLength(27);
    expect(new Set(EVENT_CARDS.map((card) => card.id)).size).toBe(27);
    for (const category of POLICY_CATEGORIES) for (const option of category.options) {
      expect(EVENT_CARDS.filter((card) => card.category === category.id && card.optionId === option.id)
        .map((card) => card.status).sort()).toEqual(["good", "mixed", "warn"]);
    }
  });
});

describe("기존 세션과 내보내기", () => {
  const choice = { tax: "shared", budget: "basic", wage: "living" };
  it("저장된 유효 카드 순서를 그대로 유지한다", () => {
    const cards = pickEventCards(choice, () => 0.1);
    expect(resolveEventCards(choice, cards.map((card) => card.id))).toEqual(cards);
  });

  it("예전 카드·중복·누락·다른 정책의 카드를 안정적으로 교체한다", () => {
    const expected = resolveEventCards(choice);
    const wrongChoice = { ...choice, tax: "ability" };
    for (const ids of [
      ["sec-1", "sec-4", "sec-2", "sec-3", "sec-6"],
      ["tax-shared-good", "tax-shared-good"],
      expected.slice(1).map((card) => card.id),
      pickEventCards(wrongChoice, () => 0.5).map((card) => card.id),
      ["unknown"],
    ]) expect(resolveEventCards(choice, ids)).toEqual(expected);
  });

  it("CSV의 뉴스도 화면과 같은 교체 규칙으로 제목을 내보낸다", () => {
    const session: SessionState = {
      code: "1234", className: "테스트", stage: 5, stageStartedAt: 1,
      stageHistory: [], expectedTeamCount: 5, createdAt: 1, updatedAt: 1,
      teams: { t1: { id: "t1", name: "팀", joinedAt: 1, design1: choice, eventCardIds: ["sec-3"] } },
    };
    const csv = buildSessionCsv(session);
    for (const card of resolveEventCards(choice)) expect(csv).toContain(card.headline);
    expect(csv).not.toContain("고소득층 세부담 확대");
    expect(csv).not.toContain("sec-3");
    delete session.teams.t1.eventCardIds;
    expect(buildSessionCsv(session)).not.toContain(resolveEventCards(choice)[0].headline);
  });
});
