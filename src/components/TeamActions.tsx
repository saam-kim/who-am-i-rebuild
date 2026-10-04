import type { ReactNode } from "react";
import { TeamActionsContext, type TeamActions } from "./teamActionsContext";

export function TeamActionsProvider({ value, children }: { value: TeamActions; children: ReactNode }) {
  return <TeamActionsContext.Provider value={value}>{children}</TeamActionsContext.Provider>;
}
