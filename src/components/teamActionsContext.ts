import { createContext, useContext } from "react";
import { updateTeam, revealRoleForTeam } from "../store/sessionStore";

export interface TeamActions {
  updateTeam: typeof updateTeam;
  revealRoleForTeam: typeof revealRoleForTeam;
  isPreview: boolean;
  previewViewport?: "desktop" | "tablet";
}

export const TeamActionsContext = createContext<TeamActions>({ updateTeam, revealRoleForTeam, isPreview: false });

export function useTeamActions() {
  return useContext(TeamActionsContext);
}
