export type Stage = 1 | 2 | 3 | 4 | 5 | 6;

export const STAGE_META: Record<Stage, { name: string; durationSec: number }> = {
  1: { name: "토론", durationSec: 5 * 60 },
  2: { name: "1차 설계", durationSec: 5 * 60 },
  3: { name: "역할 공개", durationSec: 5 * 60 },
  4: { name: "2차 토론", durationSec: 5 * 60 },
  5: { name: "2차 설계", durationSec: 4 * 60 },
  6: { name: "발표", durationSec: 15 * 60 },
};

export type PolicyCategoryId = "tax" | "budget" | "wage";

export interface PolicyChoice {
  tax?: string;
  budget?: string;
  wage?: string;
  reason?: string;
  submittedAt?: number;
}

export type Tier = "vulnerable" | "moderate" | "comfortable";
export type Orientation = "efficiency" | "balance" | "security";
export type Stability = "crisis" | "ok" | "stable";
export type Gap = "wide" | "moderate" | "narrow";
export type EventStatus = "good" | "warn" | "mixed";

export interface Team {
  id: string;
  name: string;
  joinedAt: number;
  stage1Response?: string;
  design1?: PolicyChoice;
  design2?: PolicyChoice;
  roleId?: string;
  roleRevealedAt?: number;
  eventCardIds?: string[];
  presentationComment?: string;
  reflection?: string;
}

export interface SessionState {
  code: string;
  className: string;
  stage: Stage;
  stageStartedAt: number | null;
  stageHistory: Stage[];
  rouletteMode: "all" | "perTeam";
  teams: Record<string, Team>;
  expectedTeamCount: number;
  createdAt: number;
  updatedAt: number;
}
