import type { Tier } from "../types";

export interface RoleCard {
  id: string;
  headline: string;
  situation: string;
  priorities: string[];
  tier: Tier;
  weight: number;
}

export const REFLECTION_PROMPT = "이 사회 설계가 나를 존중하는가?";

export const ROLE_CARDS: RoleCard[] = [
  {
    id: "low-income-teen",
    headline: "형편이 어려운 가정의 고등학생",
    situation: "급식비, 교통비 같은 작은 지출도 부담스럽고, 대학 등록금은 상상하기 어렵습니다.",
    priorities: ["기초 생활 보장", "교육 기회 접근성"],
    tier: "vulnerable",
    weight: 3,
  },
  {
    id: "first-job-youth",
    headline: "첫 직장을 구하는 청년",
    situation: "졸업 후 몇 달째 구직 중이고, 최저임금 수준의 일자리도 감사한 상황입니다.",
    priorities: ["안정적인 일자리", "최저 생계비 보장"],
    tier: "vulnerable",
    weight: 3,
  },
  {
    id: "underfunded-elder",
    headline: "노후 준비가 부족한 노인",
    situation: "연금만으로는 생활비가 빠듯하고, 병원비 지출이 늘 걱정입니다.",
    priorities: ["의료비 지원", "기초연금"],
    tier: "vulnerable",
    weight: 3,
  },
  {
    id: "small-business-owner",
    headline: "작은 가게를 운영하는 자영업자",
    situation: "매출이 들쭉날쭉하고, 세금과 직원 임금을 동시에 신경 써야 합니다.",
    priorities: ["세금 부담 완화", "경기 안정"],
    tier: "moderate",
    weight: 2,
  },
  {
    id: "working-parent",
    headline: "아이를 키우는 맞벌이 직장인",
    situation: "월급은 안정적이지만 보육비와 사교육비 지출이 커서 저축이 쉽지 않습니다.",
    priorities: ["보육 지원", "교육비 부담 완화"],
    tier: "moderate",
    weight: 2,
  },
  {
    id: "high-income-professional",
    headline: "고소득 전문직 종사자",
    situation: "경제적으로 여유롭지만, 세금 부담이 커질수록 예민해집니다.",
    priorities: ["자산 형성", "세율 안정"],
    tier: "comfortable",
    weight: 1,
  },
];

export function pickWeightedRole(rng: () => number = Math.random): RoleCard {
  const totalWeight = ROLE_CARDS.reduce((sum, r) => sum + r.weight, 0);
  let roll = rng() * totalWeight;
  for (const role of ROLE_CARDS) {
    roll -= role.weight;
    if (roll <= 0) return role;
  }
  return ROLE_CARDS[ROLE_CARDS.length - 1];
}

export function roleById(id?: string): RoleCard | undefined {
  return ROLE_CARDS.find((r) => r.id === id);
}
