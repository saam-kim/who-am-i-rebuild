import { useEffect, useMemo } from "react";
import { resolveEventCards } from "../data/events";
import { updateTeam } from "../store/sessionStore";
import type { Team } from "../types";

export function useTeamEventCards(code: string, teamId: string, team: Team, enabled = true) {
  const cards = useMemo(
    () => enabled ? resolveEventCards(team.design1, team.eventCardIds) : [],
    [enabled, team.design1, team.eventCardIds],
  );

  useEffect(() => {
    if (!cards.length || (cards.every((card, i) => card.id === team.eventCardIds?.[i]) && team.eventCardIds?.length === cards.length)) return;
    // 트랜잭션 재시도 때도 최신 1차 정책을 기준으로 판단한다.
    updateTeam(code, teamId, (draft) => {
      const currentCards = resolveEventCards(draft.design1, draft.eventCardIds);
      if (currentCards.length) draft.eventCardIds = currentCards.map((card) => card.id);
    }).catch((error) => console.error("사건카드 저장 실패:", error));
  }, [code, teamId, team.eventCardIds, cards]);

  return cards;
}
