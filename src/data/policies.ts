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
      { id: "low", label: "낮은 세금형", description: "세금을 적게 걷고 개인이 알아서 쓰게 합니다.", tilt: 1 },
      { id: "shared", label: "공동 부담형", description: "모두가 비슷한 비율로 나눠 부담합니다.", tilt: 2 },
      { id: "ability", label: "능력 부담형", description: "더 버는 사람이 더 많이 부담합니다.", tilt: 3 },
    ],
  },
  {
    id: "budget",
    title: "국가 예산 방향",
    options: [
      { id: "growth", label: "성장 우선형", description: "경제 성장과 산업 투자에 예산을 집중합니다.", tilt: 1 },
      { id: "opportunity", label: "기회 투자형", description: "교육과 재도전 기회에 예산을 투자합니다.", tilt: 2 },
      { id: "basic", label: "기본 보장형", description: "모두에게 기본적인 생활 안전망을 제공합니다.", tilt: 3 },
    ],
  },
  {
    id: "wage",
    title: "최저임금 방향",
    options: [
      { id: "market", label: "시장 자율형", description: "정부 개입 없이 시장이 임금을 정하게 합니다.", tilt: 1 },
      { id: "gradual", label: "점진 인상형", description: "물가와 경기를 보며 조금씩 올립니다.", tilt: 2 },
      { id: "living", label: "생활 보장형", description: "실제 생활이 가능한 수준까지 올립니다.", tilt: 3 },
    ],
  },
];

export function optionLabel(categoryId: PolicyCategoryId, optionId?: string): string {
  if (!optionId) return "미선택";
  const category = POLICY_CATEGORIES.find((c) => c.id === categoryId);
  return category?.options.find((o) => o.id === optionId)?.label ?? "미선택";
}
