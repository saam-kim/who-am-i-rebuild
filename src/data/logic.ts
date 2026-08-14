import { POLICY_CATEGORIES } from "./policies";
import type { Gap, Orientation, PolicyChoice, Stability, Tier } from "../types";

// SHEET 02 · 정책 → 결과 로직. 숫자 지표 가중 계산 대신 규칙표 2개로 단순화.

export function orientationScore(choice: PolicyChoice): number {
  let score = 0;
  for (const category of POLICY_CATEGORIES) {
    const selectedId = choice[category.id];
    const option = category.options.find((o) => o.id === selectedId);
    score += option?.tilt ?? 2; // 미선택 시 중립값
  }
  return score;
}

export function scoreToOrientation(score: number): Orientation {
  if (score <= 4) return "efficiency";
  if (score <= 7) return "balance";
  return "security";
}

export function computeOrientation(choice: PolicyChoice): Orientation {
  return scoreToOrientation(orientationScore(choice));
}

const STABILITY_TABLE: Record<Tier, Record<Orientation, Stability>> = {
  vulnerable: { efficiency: "crisis", balance: "ok", security: "stable" },
  moderate: { efficiency: "ok", balance: "stable", security: "stable" },
  comfortable: { efficiency: "stable", balance: "stable", security: "stable" },
};

const GAP_TABLE: Record<Orientation, Gap> = {
  efficiency: "wide",
  balance: "moderate",
  security: "narrow",
};

export function computeStability(orientation: Orientation, tier: Tier): Stability {
  return STABILITY_TABLE[tier][orientation];
}

export function computeGap(orientation: Orientation): Gap {
  return GAP_TABLE[orientation];
}

export const ORIENTATION_LABEL: Record<Orientation, string> = {
  efficiency: "효율지향",
  balance: "균형",
  security: "보장지향",
};

// 효율↔보장 축에서 위치를 비교하기 위한 순서(발표 단계에서 1차→2차 이동 방향을 보여줄 때 씀)
export const ORIENTATION_RANK: Record<Orientation, number> = {
  efficiency: 0,
  balance: 1,
  security: 2,
};

export const STABILITY_LABEL: Record<Stability, string> = {
  crisis: "위기",
  ok: "보통",
  stable: "안정",
};

// "보통"이라는 단어 하나만 보면 좋은 건지 나쁜 건지 학생이 판단할 수 없다 —
// 무슨 뜻인지 한 줄로 바로 풀어준다.
export const STABILITY_DESC: Record<Stability, string> = {
  crisis: "당장 생계가 흔들릴 만큼 불안정해요. 최소한의 안전망도 기대하기 어려워요.",
  ok: "간신히 버틸 수는 있지만 여유는 없어요. 작은 위기에도 쉽게 흔들릴 수 있어요.",
  stable: "큰 걱정 없이 안정적으로 살아갈 수 있어요.",
};

export const GAP_LABEL: Record<Gap, string> = {
  wide: "큼",
  moderate: "보통",
  narrow: "작음",
};

export const GAP_DESC: Record<Gap, string> = {
  wide: "이 사회는 계층 간 격차가 크게 벌어져 있어요. 누가 어디서 태어나느냐가 삶을 크게 좌우해요.",
  moderate: "이 사회는 격차가 있지만 극단적이지는 않아요.",
  narrow: "이 사회는 계층에 따른 격차가 작아서, 어디서 태어나든 삶이 크게 다르지 않아요.",
};

export const TIER_LABEL: Record<Tier, string> = {
  vulnerable: "취약",
  moderate: "보통",
  comfortable: "여유",
};
