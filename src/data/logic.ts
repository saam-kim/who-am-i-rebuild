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

export const STABILITY_LABEL: Record<Stability, string> = {
  crisis: "위기",
  ok: "보통",
  stable: "안정",
};

export const GAP_LABEL: Record<Gap, string> = {
  wide: "큼",
  moderate: "보통",
  narrow: "작음",
};

export const TIER_LABEL: Record<Tier, string> = {
  vulnerable: "취약",
  moderate: "보통",
  comfortable: "여유",
};
