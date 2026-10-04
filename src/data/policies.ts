import type { PolicyCategoryId } from "../types";

// tilt(1~3)은 학생에게 노출하지 않는 내부 점수입니다. SHEET 02 로직 참고.
export interface PolicyOption {
  id: string;
  label: string;
  description: string;
  tilt: 1 | 2 | 3;
}

export interface PolicyCategory {
  id: PolicyCategoryId;
  title: string;
  options: PolicyOption[];
}

export const POLICY_CATEGORIES: PolicyCategory[] = [
  {
    id: "tax",
    title: "세금 정책",
    options: [
      { id: "low", label: "낮은 세금형", description: "세금을 적게 걷고, 개인이 남은 돈을 소비·저축 등에 자유롭게 쓰게 합니다.", tilt: 1 },
      { id: "shared", label: "공동 부담형", description: "소득이 얼마든 같은 비율로 세금을 내고, 소득이 많으면 내는 금액도 늘어납니다.", tilt: 2 },
      { id: "ability", label: "능력 부담형", description: "소득이 많은 사람에게 더 높은 세율을 적용해, 세금 부담을 더 많이 맡깁니다.", tilt: 3 },
    ],
  },
  {
    id: "budget",
    title: "국가 예산 방향",
    options: [
      { id: "growth", label: "성장 우선형", description: "기술 개발과 산업 투자 등 경제 성장을 돕는 데 국가 예산을 우선 씁니다.", tilt: 1 },
      { id: "opportunity", label: "기회 투자형", description: "교육·직업 훈련·재취업 지원 등 다시 도전할 기회를 넓히는 데 예산을 씁니다.", tilt: 2 },
      { id: "basic", label: "기본 보장형", description: "생활이 어려운 사람의 식비·치료비·주거비 지원에 국가 예산을 우선 씁니다.", tilt: 3 },
    ],
  },
  {
    id: "wage",
    title: "최저임금 방향",
    options: [
      { id: "market", label: "시장 자율형", description: "정부가 임금에 개입하지 않고, 기업과 노동자가 임금을 정하도록 합니다.", tilt: 1 },
      { id: "gradual", label: "점진 인상형", description: "물가 상승과 경제 상황을 살피며, 최저임금을 조금씩 단계적으로 올립니다.", tilt: 2 },
      { id: "living", label: "생활 보장형", description: "주 40시간 일해 식비·주거비·교통비를 마련하도록 최저임금을 올립니다.", tilt: 3 },
    ],
  },
];

export function optionLabel(categoryId: PolicyCategoryId, optionId?: string): string {
  if (!optionId) return "미선택";
  const category = POLICY_CATEGORIES.find((c) => c.id === categoryId);
  return category?.options.find((o) => o.id === optionId)?.label ?? "미선택";
}
