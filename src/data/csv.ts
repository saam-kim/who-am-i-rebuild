import type { SessionState } from "../types";
import { optionLabel } from "./policies";
import { roleById } from "./roles";
import { computeGap, computeOrientation, computeStability, GAP_LABEL, ORIENTATION_LABEL, STABILITY_LABEL, TIER_LABEL } from "./logic";

function csvCell(value: string | number | undefined): string {
  const s = String(value ?? "");
  if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function buildSessionCsv(session: SessionState): string {
  const headers = [
    "팀",
    "역할",
    "취약도",
    "1차_세금",
    "1차_예산",
    "1차_최저임금",
    "1차_이유",
    "1차_성향",
    "2차_세금",
    "2차_예산",
    "2차_최저임금",
    "2차_이유",
    "2차_성향",
    "내_삶의_안정도",
    "사회_격차",
    "사건카드",
    "발표_코멘트",
    "성찰",
  ];

  const rows = Object.values(session.teams)
    .sort((a, b) => a.joinedAt - b.joinedAt)
    .map((team) => {
      const role = roleById(team.roleId);
      const orientation1 = team.design1 ? computeOrientation(team.design1) : undefined;
      const orientation2 = team.design2 ? computeOrientation(team.design2) : undefined;
      const stability = role && orientation2 ? computeStability(orientation2, role.tier) : role && orientation1 ? computeStability(orientation1, role.tier) : undefined;
      const gap = orientation2 ?? orientation1;

      return [
        team.name,
        role?.headline ?? "",
        role ? TIER_LABEL[role.tier] : "",
        optionLabel("tax", team.design1?.tax),
        optionLabel("budget", team.design1?.budget),
        optionLabel("wage", team.design1?.wage),
        team.design1?.reason ?? "",
        orientation1 ? ORIENTATION_LABEL[orientation1] : "",
        optionLabel("tax", team.design2?.tax),
        optionLabel("budget", team.design2?.budget),
        optionLabel("wage", team.design2?.wage),
        team.design2?.reason ?? "",
        orientation2 ? ORIENTATION_LABEL[orientation2] : "",
        stability ? STABILITY_LABEL[stability] : "",
        gap ? GAP_LABEL[computeGap(gap)] : "",
        (team.eventCardIds ?? []).join(" / "),
        team.presentationComment ?? "",
        team.reflection ?? "",
      ]
        .map(csvCell)
        .join(",");
    });

  return [headers.join(","), ...rows].join("\n");
}

export function downloadSessionCsv(session: SessionState) {
  const csv = "﻿" + buildSessionCsv(session);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `who-am-i_${session.className || session.code}_${session.code}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
