import { useCallback, useSyncExternalStore } from "react";
import type { SessionState, Stage, Team } from "../types";
import { STAGE_META } from "../types";

// 로컬 데모용 동기화 계층. localStorage에 세션을 저장하고, 다른 탭에는
// `storage` 이벤트로 변경이 전파됩니다. 나중에 Firebase로 옮길 때는
// getSnapshot/persist 부분만 실시간 DB 구독으로 바꾸면 됩니다.

const SESSION_PREFIX = "wai-session:";
const MY_TEAM_PREFIX = "wai-my-team:";
const PRESENCE_PREFIX = "wai-presence:";

function sessionKey(code: string) {
  return SESSION_PREFIX + code;
}

function presenceKey(code: string, teamId: string) {
  return `${PRESENCE_PREFIX}${code}:${teamId}`;
}

function readRaw(code: string): string | null {
  try {
    return localStorage.getItem(sessionKey(code));
  } catch {
    return null;
  }
}

function persist(state: SessionState) {
  const next = { ...state, updatedAt: Date.now() };
  localStorage.setItem(sessionKey(state.code), JSON.stringify(next));
}

const cache = new Map<string, { raw: string | null; state: SessionState | null }>();

function getSnapshot(code: string): SessionState | null {
  const raw = readRaw(code);
  const cached = cache.get(code);
  if (cached && cached.raw === raw) return cached.state;
  const state = raw ? (JSON.parse(raw) as SessionState) : null;
  cache.set(code, { raw, state });
  return state;
}

// storage 이벤트는 "다른" 탭에서만 발생하므로, 이 탭 자신의 쓰기는 최대 1초짜리
// 폴백 폴링에 의존했었다 — 교사가 스스로 누른 버튼 결과가 화면에 늦게 반영되는
// 원인이었다. 같은 탭 리스너는 즉시 직접 깨운다.
const localListeners = new Map<string, Set<() => void>>();

function notifyLocal(code: string) {
  for (const cb of localListeners.get(code) ?? []) cb();
}

function subscribe(code: string, callback: () => void) {
  const handler = (e: StorageEvent) => {
    if (e.key === sessionKey(code)) callback();
  };
  window.addEventListener("storage", handler);

  if (!localListeners.has(code)) localListeners.set(code, new Set());
  localListeners.get(code)!.add(callback);

  // 다른 탭이 localStorage를 만졌지만 이 브라우저가 어떤 이유로 storage
  // 이벤트를 놓치는 드문 경우를 위한 안전망(느슨한 주기면 충분하다)
  const interval = window.setInterval(callback, 2000);
  return () => {
    window.removeEventListener("storage", handler);
    localListeners.get(code)?.delete(callback);
    window.clearInterval(interval);
  };
}

export function useSession(code: string | null) {
  const subscribeFn = useCallback(
    (cb: () => void) => (code ? subscribe(code, cb) : () => {}),
    [code],
  );
  const getSnap = useCallback(() => (code ? getSnapshot(code) : null), [code]);
  return useSyncExternalStore(subscribeFn, getSnap, getSnap);
}

function randomPin(): string {
  return String(Math.floor(1000 + Math.random() * 9000));
}

export function createSession(className: string, studentCount: number): string {
  let code = randomPin();
  while (readRaw(code)) code = randomPin();
  const teamCount = Math.min(20, Math.max(5, Math.round(studentCount / 2)));
  const now = Date.now();
  const state: SessionState = {
    code,
    className,
    stage: 1,
    stageStartedAt: now,
    stageHistory: [],
    rouletteMode: "all",
    teams: {},
    expectedTeamCount: teamCount,
    createdAt: now,
    updatedAt: now,
  };
  persist(state);
  return code;
}

export function sessionExists(code: string): boolean {
  return readRaw(code) !== null;
}

// 같은 브라우저의 여러 탭(교사+학생 리허설)이 동시에 같은 세션 문서를 쓸 수 있어
// read-modify-write 사이에 다른 탭이 끼어들면 업데이트가 유실될 수 있다.
// 쓰기 직전에 raw가 그대로인지 다시 확인하고, 바뀌었으면 재시도한다.
export function updateSession(code: string, mutator: (draft: SessionState) => void) {
  for (let attempt = 0; attempt < 5; attempt++) {
    const rawBefore = readRaw(code);
    if (!rawBefore) return;
    const draft: SessionState = JSON.parse(rawBefore);
    mutator(draft);
    draft.updatedAt = Date.now();

    const rawNow = readRaw(code);
    if (rawNow !== rawBefore) continue; // 다른 탭이 그 사이에 썼다 — 최신값으로 재시도

    const next = JSON.stringify(draft);
    localStorage.setItem(sessionKey(code), next);
    cache.set(code, { raw: next, state: draft });
    notifyLocal(code);
    return;
  }
}

export function setStage(code: string, stage: Stage) {
  updateSession(code, (s) => {
    s.stageHistory.push(s.stage);
    s.stage = stage;
    s.stageStartedAt = Date.now();
  });
}

export function undoStage(code: string) {
  updateSession(code, (s) => {
    const prev = s.stageHistory.pop();
    if (prev !== undefined) {
      s.stage = prev;
      s.stageStartedAt = Date.now();
    }
  });
}

// 남은 시간을 deltaSec만큼 늘리거나 줄인다(음수 가능). stageStartedAt을
// 옮기는 방식이라 별도 상태 없이도 카운트다운 로직과 그대로 맞물리고,
// 원래 배정 시간을 넘어서는 연장도 자연스럽게 허용된다.
export function adjustStageTime(code: string, deltaSec: number) {
  updateSession(code, (s) => {
    if (!s.stageStartedAt) return;
    s.stageStartedAt += deltaSec * 1000;
  });
}

export function stageRemainingSec(state: SessionState): number {
  if (!state.stageStartedAt) return STAGE_META[state.stage].durationSec;
  const elapsed = Math.floor((Date.now() - state.stageStartedAt) / 1000);
  return Math.max(0, STAGE_META[state.stage].durationSec - elapsed);
}

export function myTeamKey(code: string) {
  return MY_TEAM_PREFIX + code;
}

// sessionStorage는 탭 단위로 분리된다 — localStorage를 쓰면 같은 브라우저에서
// 학생 탭을 두 개 열었을 때(리허설 중 흔한 상황) 두 번째 탭이 "이미 참여한 팀"으로
// 오인해 첫 번째 탭의 팀을 가로채 버린다. "이 탭 = 이 팀" 매핑에는 탭 스코프가 맞다.
export function getMyTeamId(code: string): string | null {
  return sessionStorage.getItem(myTeamKey(code));
}

export function joinTeam(code: string, teamName: string): { teamId: string } | { error: string } {
  if (!sessionExists(code)) return { error: "존재하지 않는 참여 코드예요." };

  const existingId = getMyTeamId(code);
  const existing = getSnapshot(code);
  if (existingId && existing?.teams[existingId]) {
    return { teamId: existingId };
  }

  const teamId = `t_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const now = Date.now();
  const team: Team = {
    id: teamId,
    name: teamName.trim() || "이름 없는 팀",
    joinedAt: now,
  };
  updateSession(code, (s) => {
    s.teams[teamId] = team;
  });
  sessionStorage.setItem(myTeamKey(code), teamId);
  touchTeam(code, teamId);
  return { teamId };
}

// 접속 여부(presence)는 세션 문서 밖, 팀별 독립된 키에 저장한다.
// 하트비트는 몇 초마다 반복되는 고빈도 쓰기라, 세션 문서 안에 두면
// 다른 탭의 쓰기(단계 전환 등)와 충돌할 여지가 커진다.
export function touchTeam(code: string, teamId: string) {
  try {
    localStorage.setItem(presenceKey(code, teamId), String(Date.now()));
  } catch {
    // 저장 공간이 없거나 접근 불가한 환경 — 접속 상태 표시만 영향받고 앱은 계속 동작
  }
}

export function isTeamConnected(code: string, teamId: string): boolean {
  const raw = localStorage.getItem(presenceKey(code, teamId));
  if (!raw) return false;
  return Date.now() - Number(raw) < 12000;
}

export function updateTeam(code: string, teamId: string, mutator: (team: Team) => void) {
  updateSession(code, (s) => {
    const team = s.teams[teamId];
    if (team) mutator(team);
  });
}

export function setRouletteMode(code: string, mode: SessionState["rouletteMode"]) {
  updateSession(code, (s) => {
    s.rouletteMode = mode;
  });
}

export function revealRoleForTeam(code: string, teamId: string, roleId: string) {
  updateSession(code, (s) => {
    const team = s.teams[teamId];
    if (team && !team.roleId) {
      team.roleId = roleId;
      team.roleRevealedAt = Date.now();
    }
  });
}

export function revealAllRoles(code: string, pickRoleId: () => string) {
  updateSession(code, (s) => {
    for (const team of Object.values(s.teams)) {
      if (!team.roleId) {
        team.roleId = pickRoleId();
        team.roleRevealedAt = Date.now();
      }
    }
  });
}
