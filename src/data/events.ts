import type { EventStatus, Orientation } from "../types";

export interface EventCard {
  id: string;
  band: Orientation;
  status: EventStatus;
  headline: string;
  body: string;
}

export const EVENT_CARDS: EventCard[] = [
  // 효율지향
  { id: "eff-1", band: "efficiency", status: "good", headline: "기업 투자 활발, 일자리 증가", body: "낮은 세금 덕분에 기업 투자가 늘고 채용이 활발해졌습니다." },
  { id: "eff-2", band: "efficiency", status: "warn", headline: "최저임금 동결, 저임금 노동자 생계 압박", body: "시장 자율에 맡긴 최저임금이 몇 년째 그대로라 저임금 노동자의 생활비 부담이 커졌습니다." },
  { id: "eff-3", band: "efficiency", status: "mixed", headline: "자산 격차 역대 최고", body: "성장은 이어졌지만, 상위 계층과 하위 계층의 자산 격차가 통계 작성 이래 최대로 벌어졌습니다." },
  { id: "eff-4", band: "efficiency", status: "warn", headline: "의료비·주거비 지원 축소", body: "예산이 성장 투자에 집중되며 의료비·주거비 지원이 줄었습니다." },
  { id: "eff-5", band: "efficiency", status: "warn", headline: "청년 첫 취업 문턱 여전히 높아", body: "일자리는 늘었지만 경력직 채용이 우선이라, 첫 직장을 구하는 청년은 여전히 문턱을 느낍니다." },
  { id: "eff-6", band: "efficiency", status: "mixed", headline: "자산 있는 사람은 순자산 급증, 없는 사람은 제자리", body: "세금 부담이 준 만큼 주식·부동산을 가진 사람들의 순자산은 빠르게 불어났지만, 자산이 없는 사람들의 형편은 크게 달라지지 않았습니다." },

  // 균형
  { id: "bal-1", band: "balance", status: "good", headline: "직업 재교육 프로그램 확대", body: "기회 투자형 예산 덕분에 실직자를 위한 재교육 프로그램이 늘었습니다." },
  { id: "bal-2", band: "balance", status: "mixed", headline: "최저임금 소폭 인상, 반응은 엇갈려", body: "최저임금이 점진적으로 올라 저임금 노동자의 형편이 조금 나아졌지만 인상 폭이 크지 않아 아쉽다는 목소리도 있고, 소상공인은 늘어난 인건비를 부담스러워합니다." },
  { id: "bal-3", band: "balance", status: "warn", headline: "중산층 세부담 체감 증가", body: "모두가 비슷한 비율로 세금을 부담하다 보니, 중산층이 체감하는 부담이 커졌습니다." },
  { id: "bal-4", band: "balance", status: "mixed", headline: "청년 취업 지원 성과, 대기자는 여전히 많아", body: "취업 지원 프로그램으로 취업자가 늘었지만, 아직 순서를 기다리는 청년이 많습니다." },
  { id: "bal-5", band: "balance", status: "good", headline: "보육 지원 확대, 맞벌이 가정 숨통", body: "기회 투자형 예산 일부가 보육 지원으로 이어지며 맞벌이 가정의 부담이 줄었습니다." },
  { id: "bal-6", band: "balance", status: "warn", headline: "소상공인 \"체감은 여전히 빠듯\"", body: "정책은 균형을 잡으려 했지만, 작은 가게를 운영하는 자영업자들은 여전히 여유가 없다고 말합니다." },

  // 보장지향
  { id: "sec-1", band: "security", status: "good", headline: "의료비 걱정 크게 줄어", body: "기본 보장형 예산 덕분에 저소득층의 의료비 부담이 크게 줄었습니다." },
  { id: "sec-2", band: "security", status: "warn", headline: "생활임금 도입, 자영업자 인건비 부담 커져", body: "최저임금이 생활 가능한 수준으로 오르며 소상공인의 인건비 부담이 커졌습니다." },
  { id: "sec-3", band: "security", status: "warn", headline: "고소득층 세부담 확대에 반발 여론", body: "능력에 따라 세금을 더 내는 고소득층 사이에서 불만이 커지고 있습니다." },
  { id: "sec-4", band: "security", status: "good", headline: "저소득층 자립 지표 개선", body: "안전망이 두터워지며 저소득 가정의 생활 안정 지표가 개선됐습니다." },
  { id: "sec-5", band: "security", status: "good", headline: "기초연금 인상, 노후 생활 안정 체감", body: "기본 보장형 예산으로 기초연금이 올라 노후 준비가 부족했던 어르신들의 생활이 한결 나아졌습니다." },
  { id: "sec-6", band: "security", status: "mixed", headline: "세부담 커진 고소득층 반발, 서민층은 안도", body: "능력에 따른 세부담이 커지자 일부 기업은 투자·채용 축소를 우려하지만, 그 재원으로 지원받는 서민층은 안전망이 두터워졌다며 반깁니다." },
];

export function pickEventCards(band: Orientation, count = 3, rng: () => number = Math.random): EventCard[] {
  const pool = EVENT_CARDS.filter((e) => e.band === band);
  const shuffled = [...pool].sort(() => rng() - 0.5);
  return shuffled.slice(0, count);
}

export function eventById(id: string): EventCard | undefined {
  return EVENT_CARDS.find((e) => e.id === id);
}
