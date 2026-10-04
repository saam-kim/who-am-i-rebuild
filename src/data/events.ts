import type { EventStatus, PolicyCategoryId, PolicyChoice } from "../types";
import { POLICY_CATEGORIES } from "./policies";

export interface EventCard {
  id: string;
  category: PolicyCategoryId;
  optionId: string;
  status: EventStatus;
  headline: string;
  body: string;
}

// 뉴스는 실제 선택한 정책에만 연결한다. 전체 성향 점수로 다른 정책을
// 선택했다고 가정하지 않으며, 각 정책에 긍정·경고·혼합 상황을 준비한다.
type NewsText = [headline: string, body: string];
type PolicyNews = Record<EventStatus, NewsText>;
const NEWS: Record<PolicyCategoryId, Record<string, PolicyNews>> = {
  tax: {
    low: {
      good: ["세금 부담 줄어, 투자 여력에 기대", "낮은 세금형을 선택한 이 사회에서 일부 기업과 가계는 남는 돈을 투자와 소비에 쓸 수 있다며 기대합니다."],
      warn: ["적은 세수, 공공서비스 재원 확보 고민", "세금을 적게 걷기로 하면서 공공서비스를 유지할 재원을 어떻게 마련할지 논의가 필요해졌습니다."],
      mixed: ["세금은 줄었지만, 혜택 체감은 제각각", "일부 가계는 줄어든 세금 부담을 반기지만, 원래 납부하던 세금이 적은 가계는 혜택을 크게 체감하지 못한다고 말합니다."],
    },
    shared: {
      good: ["같은 비율의 세금, 부담 기준이 명확해져", "공동 부담형을 선택한 이 사회에서는 소득이 얼마든 같은 비율로 세금을 내는 기준이 이해하기 쉽다는 반응이 나옵니다."],
      warn: ["같은 비율이어도, 저소득 가계는 빠듯", "같은 비율로 세금을 내더라도 생활에 꼭 필요한 지출이 큰 저소득 가계는 세금 납부 후의 생활비가 빠듯하다고 말합니다."],
      mixed: ["같은 비율이 공정할까? 의견 엇갈려", "소득의 같은 비율을 세금으로 내는 것이 공정하다는 의견과, 납부 후 남는 생활 여력까지 고려해야 한다는 의견이 맞섭니다."],
    },
    ability: {
      good: ["능력에 따른 부담, 저소득 가계 부담 완화 기대", "소득이 높을수록 더 높은 세율을 적용하는 능력 부담형에 대해, 형편이 어려운 가계의 부담을 덜 수 있다는 기대가 나옵니다."],
      warn: ["고소득층 세부담 확대에 반발 여론", "능력 부담형으로 더 높은 세율을 적용받는 일부 고소득층은 자신의 세금 부담이 크다며 반발합니다."],
      mixed: ["능력에 따른 세금, 연대와 부담 사이 논쟁", "형편에 맞춰 부담하자는 의견과 높은 소득에 더 큰 부담을 맡기는 것이 과도하다는 의견이 맞섭니다."],
    },
  },
  budget: {
    growth: {
      good: ["산업 투자 확대, 새 일자리에 기대", "성장 우선형 예산으로 산업과 기반 시설에 투자가 집중되면서 기업들은 새로운 사업과 채용 기회를 기대합니다."],
      warn: ["성장 투자에 집중, 당장의 생활 지원은 고민", "예산을 성장 투자에 집중하면서 당장 의료비와 주거비 지원이 필요한 가계는 생활 지원도 충분한지 묻습니다."],
      mixed: ["성장 투자의 혜택, 누구에게 언제 돌아갈까?", "새 사업과 일자리를 기대하는 사람이 있는 반면, 성장의 혜택이 자신의 생활에 닿기까지 시간이 걸릴 수 있다는 우려도 나옵니다."],
    },
    opportunity: {
      good: ["교육·재교육 기회 확대", "기회 투자형 예산이 교육과 재도전 프로그램에 쓰이면서 학생과 구직자들이 새로운 기회를 기대합니다."],
      warn: ["교육 기회 늘어도, 당장의 생계는 빠듯", "재교육을 받고 싶어도 당장 생활비를 벌어야 하는 사람들은 프로그램에 참여할 시간과 여유가 부족하다고 말합니다."],
      mixed: ["재도전 지원 확대, 참여 여건은 제각각", "교육과 재도전 기회를 반기는 사람이 있는 반면, 돌봄이나 생계 때문에 지원을 이용하기 어렵다는 사람도 있습니다."],
    },
    basic: {
      good: ["생활 안전망 확대, 의료비·주거비 걱정 완화 기대", "기본 보장형 예산으로 식비·치료비·주거비 지원이 늘면서 형편이 어려운 가계는 생활의 안정을 기대합니다."],
      warn: ["생활 보장 예산 확대, 다른 투자와 우선순위 논쟁", "식비·치료비·주거비 지원을 우선하는 예산에 대해 산업 투자와 교육 기회에도 충분한 재원을 배분해야 한다는 요구가 나옵니다."],
      mixed: ["안전망은 든든해졌지만, 예산 배분은 논쟁", "기본 생활 지원을 반기는 사람이 있는 반면, 한정된 예산을 다른 분야와 어떻게 나눌지 추가 논의가 필요하다는 의견도 있습니다."],
    },
  },
  wage: {
    market: {
      good: ["시장 자율 임금, 고용의 유연성에 기대", "시장 자율형 임금을 선택한 이 사회에서 일부 사업주는 사업 여건에 맞춰 임금과 채용을 정할 수 있다는 점을 반깁니다."],
      warn: ["협상력 약한 노동자, 생계 유지 걱정", "정부가 임금에 개입하지 않는 상황에서 협상력이 약한 노동자는 생활에 필요한 임금을 받을 수 있을지 걱정합니다."],
      mixed: ["자율 임금, 사업주와 노동자의 기대 엇갈려", "사업주는 채용의 유연성을 기대하지만, 일부 노동자는 협상력 차이 때문에 생계를 유지할 임금을 확보하기 어렵다고 우려합니다."],
    },
    gradual: {
      good: ["점진적 임금 인상, 생활비 부담 완화 기대", "물가와 경기를 보며 임금을 조금씩 올리는 정책에 대해 저임금 노동자들은 생활비 부담이 완화되길 기대합니다."],
      warn: ["조금씩 오르는 임금, 생계 개선 속도에 아쉬움", "점진 인상형 임금에 대해 일부 노동자는 당장의 생활비 부족을 해결하기에는 인상 속도가 느리다고 말합니다."],
      mixed: ["점진적 임금 인상, 반응은 엇갈려", "노동자는 임금 인상을 반기면서도 속도가 아쉽다고 말하고, 소상공인은 조금씩 늘어나는 인건비에 대비해야 한다고 말합니다."],
    },
    living: {
      good: ["생활 가능한 임금, 저임금 노동자 숨통 기대", "생활 보장형 임금을 선택한 이 사회에서 저임금 노동자들은 식비·주거비·교통비 등 기본 생활비를 마련하기 쉬워지길 기대합니다."],
      warn: ["생활임금 도입, 소상공인 인건비 부담 우려", "노동자가 기본 생활비를 마련할 수 있도록 최저임금을 올리는 정책에 대해 일부 소상공인은 늘어날 인건비를 어떻게 감당할지 고민합니다."],
      mixed: ["생활임금, 노동자 안도와 사업주 부담 함께", "노동자는 생활 안정에 대한 기대를 나타내지만, 일부 사업주는 인건비 부담을 걱정하며 지원 방안을 요구합니다."],
    },
  },
};

export const EVENT_CARDS: EventCard[] = POLICY_CATEGORIES.flatMap((category) =>
  category.options.flatMap((option) =>
    (["good", "warn", "mixed"] as const).map((status) => {
      const [headline, body] = NEWS[category.id][option.id][status];
      return { id: `${category.id}-${option.id}-${status}`, category: category.id, optionId: option.id, status, headline, body };
    }),
  ),
);

function isCompleteChoice(choice: PolicyChoice): boolean {
  return POLICY_CATEGORIES.every((category) => category.options.some((option) => option.id === choice[category.id]));
}

function matchesChoice(card: EventCard, choice: PolicyChoice): boolean {
  return choice[card.category] === card.optionId;
}

export function pickEventCards(choice: PolicyChoice, rng: () => number = Math.random): EventCard[] {
  if (!isCompleteChoice(choice)) return [];
  const mixedCategory = POLICY_CATEGORIES[Math.floor(rng() * POLICY_CATEGORIES.length)].id;
  const cards = EVENT_CARDS.filter((card) =>
    matchesChoice(card, choice) && (card.category === mixedCategory ? card.status === "mixed" : card.status !== "mixed"),
  );
  // Fisher–Yates로 긍정 2·경고 2·혼합 1을 섞는다. 세 정책 모두 포함한다.
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function eventById(id: string): EventCard | undefined {
  return EVENT_CARDS.find((card) => card.id === id);
}

// 유효한 저장 순서는 유지한다. 옛 카드·누락·중복·정책 불일치는 안정적인
// 순서로 재생성해 화면과 CSV가 같게 보이게 한다.
export function resolveEventCards(choice: PolicyChoice | undefined, ids?: string[]): EventCard[] {
  if (!choice || !isCompleteChoice(choice)) return [];
  const cards = (ids ?? []).map(eventById);
  if (
    cards.length === 5 && new Set(ids).size === 5 &&
    cards.every((card): card is EventCard => Boolean(card && matchesChoice(card, choice))) &&
    new Set(cards.map((card) => card.category)).size === 3 &&
    cards.filter((card) => card.status === "good").length === 2 &&
    cards.filter((card) => card.status === "warn").length === 2 &&
    cards.filter((card) => card.status === "mixed").length === 1
  ) return cards;
  return pickEventCards(choice, () => 0.5);
}
