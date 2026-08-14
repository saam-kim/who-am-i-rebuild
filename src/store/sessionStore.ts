import { useCallback, useSyncExternalStore } from "react";
import { get, onValue, ref, runTransaction, set } from "firebase/database";
import { db } from "./firebase";
import type { SessionState, Stage, Team } from "../types";
import { STAGE_META } from "../types";

// Firebase Realtime Database 기반 동기화 계층. 세션 문서는 /sessions/{code},
// 팀 접속 여부(presence)는 /presence/{code}/{teamId} 에 별도로 저장한다 —
// presence는 몇 초마다 쓰는 고빈도 쓰기라, 세션 문서 안에 두면 단계 전환 같은
// 다른 쓰기와 충돌할 여지가 커진다.

const MY_TEAM_PREFIX = "wai-my-team:";

function sessionRef(code: string) {
  return ref(db, `sessions/${code}`);
}

function presenceRef(code: string, teamId: string) {
  return ref(db, `presence/${code}/${teamId}`);
}

// ---- 세션 문서 구독 (useSyncExternalStore) ----
// undefined = 아직 로딩 중, null = 확인 결과 존재하지 않음. 로딩 중을 "없음"과
// 구분해야 새로고침 직후 "세션을 찾을 수 없어요" 화면이 잠깐 잘못 뜨지 않는다.

const cache = new Map<string, SessionState | null | undefined>();
const listeners = new Map<string, Set<() => void>>();
const dbUnsubs = new Map<string, () => void>();

// Realtime Database는 빈 객체/배열({}나 [])을 자식이 없는 노드로 취급해 쓰기
// 시점에 조용히 지워버린다 — createSession이 넣은 teams:{}, stageHistory:[]가
// 그대로 사라져서 읽으면 undefined로 돌아온다. 읽는 지점에서 한 번에 정규화한다.
function normalizeSession(val: SessionState): SessionState {
  return { ...val, teams: val.teams ?? {}, stageHistory: val.stageHistory ?? [] };
}

function subscribe(code: string, callback: () => void) {
  if (!listeners.has(code)) listeners.set(code, new Set());
  listeners.get(code)!.add(callback);

  if (!dbUnsubs.has(code)) {
    const unsub = onValue(sessionRef(code), (snap) => {
      cache.set(code, snap.exists() ? normalizeSession(snap.val() as SessionState) : null);
      for (const cb of listeners.get(code) ?? []) cb();
    });
    dbUnsubs.set(code, unsub);
  }

  return () => {
    listeners.get(code)?.delete(callback);
    if (listeners.get(code)?.size === 0) {
      dbUnsubs.get(code)?.();
      dbUnsubs.delete(code);
      listeners.delete(code);
      cache.delete(code);
    }
  };
}

function getSnapshot(code: string) {
  return cache.get(code);
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

export async function createSession(className: string, studentCount: number): Promise<string> {
  let code = randomPin();
  while (await sessionExists(code)) code = randomPin();
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
  await set(sessionRef(code), state);
  return code;
}

export async function sessionExists(code: string): Promise<boolean> {
  const snap = await get(sessionRef(code));
  return snap.exists();
}

// Realtime Database의 트랜잭션은 서버가 충돌을 감지하면 최신 값으로 자동
// 재시도해준다 — 예전 localStorage 버전의 수동 CAS 재시도 루프를 대체한다.
//
// 주의: 이 브라우저 탭이 해당 경로를 한 번도 구독한 적이 없으면(예: 방금
// /join에서 넘어온 학생 탭) 로컬 캐시가 비어 있어서 콜백의 첫 호출은 무조건
// current===null로 들어온다 — 이건 "세션이 없다"는 뜻이 아니라 "아직 서버
// 값을 확인 못 했다"는 뜻이다. 여기서 undefined를 반환해 중단해버리면 SDK가
// 서버의 진짜 값과 대조해 재시도할 기회 자체를 뺏는다(실제로 이렇게 팀 참여가
// 통째로 사라지는 버그였다). 그래서 null이어도 항상 mutator를 실행해서 낙관적
// 쓰기를 시도하고, 서버에 진짜 값이 있으면 SDK가 알아서 그 값으로 재시도한다.
export async function updateSession(code: string, mutator: (draft: SessionState) => void) {
  await runTransaction(sessionRef(code), (current: SessionState | null) => {
    const draft = normalizeSession(current ?? ({} as SessionState));
    mutator(draft);
    draft.updatedAt = Date.now();
    return draft;
  });
}

export async function setStage(code: string, stage: Stage) {
  await updateSession(code, (s) => {
    s.stageHistory = [...(s.stageHistory ?? []), s.stage];
    s.stage = stage;
    s.stageStartedAt = Date.now();
  });
}

export async function undoStage(code: string) {
  await updateSession(code, (s) => {
    const history = s.stageHistory ?? [];
    const prev = history[history.length - 1];
    if (prev !== undefined) {
      s.stageHistory = history.slice(0, -1);
      s.stage = prev;
      s.stageStartedAt = Date.now();
    }
  });
}

// 남은 시간을 deltaSec만큼 늘리거나 줄인다(음수 가능). stageStartedAt을
// 옮기는 방식이라 별도 상태 없이도 카운트다운 로직과 그대로 맞물리고,
// 원래 배정 시간을 넘어서는 연장도 자연스럽게 허용된다.
export async function adjustStageTime(code: string, deltaSec: number) {
  await updateSession(code, (s) => {
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
// (기기 간 동기화와는 무관 — 이건 의도적으로 기기/탭 로컬로 남긴다.)
export function getMyTeamId(code: string): string | null {
  return sessionStorage.getItem(myTeamKey(code));
}

export async function joinTeam(code: string, teamName: string): Promise<{ teamId: string } | { error: string }> {
  const existingId = getMyTeamId(code);
  if (existingId) {
    const snap = await get(sessionRef(code));
    const existing = snap.val() as SessionState | null;
    if (existing?.teams?.[existingId]) return { teamId: existingId };
  }

  if (!(await sessionExists(code))) return { error: "존재하지 않는 참여 코드예요." };

  const teamId = `t_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
  const now = Date.now();
  const team: Team = {
    id: teamId,
    name: teamName.trim() || "이름 없는 팀",
    joinedAt: now,
  };
  await updateSession(code, (s) => {
    s.teams[teamId] = team;
  });
  sessionStorage.setItem(myTeamKey(code), teamId);
  touchTeam(code, teamId);
  return { teamId };
}

// ---- 접속 여부(presence) ----
// 세션 문서 밖, 팀별 독립된 경로에 저장한다. 고빈도 하트비트 쓰기라 세션 문서와
// 분리해야 단계 전환 등 다른 쓰기와 충돌하지 않는다. 교사 사이드바가 매 팀마다
// 동기적으로 읽을 수 있도록, 구독은 한 번만 붙이고 로컬 캐시로 서빙한다.

const presenceCache = new Map<string, Record<string, number>>();
const presenceUnsubs = new Map<string, () => void>();

function ensurePresenceSubscription(code: string) {
  if (presenceUnsubs.has(code)) return;
  const unsub = onValue(ref(db, `presence/${code}`), (snap) => {
    presenceCache.set(code, (snap.val() as Record<string, number>) ?? {});
  });
  presenceUnsubs.set(code, unsub);
}

export function touchTeam(code: string, teamId: string) {
  set(presenceRef(code, teamId), Date.now()).catch(() => {
    // 오프라인 등으로 쓰기 실패 — 접속 상태 표시만 영향받고 앱은 계속 동작
  });
}

export function isTeamConnected(code: string, teamId: string): boolean {
  ensurePresenceSubscription(code);
  const ts = presenceCache.get(code)?.[teamId];
  if (!ts) return false;
  return Date.now() - ts < 12000;
}

export async function updateTeam(code: string, teamId: string, mutator: (team: Team) => void) {
  await updateSession(code, (s) => {
    const team = s.teams[teamId];
    if (team) mutator(team);
  });
}

export async function setRouletteMode(code: string, mode: SessionState["rouletteMode"]) {
  await updateSession(code, (s) => {
    s.rouletteMode = mode;
  });
}

export async function revealRoleForTeam(code: string, teamId: string, roleId: string) {
  await updateSession(code, (s) => {
    const team = s.teams[teamId];
    if (team && !team.roleId) {
      team.roleId = roleId;
      team.roleRevealedAt = Date.now();
    }
  });
}

export async function revealAllRoles(code: string, pickRoleId: () => string) {
  await updateSession(code, (s) => {
    for (const team of Object.values(s.teams)) {
      if (!team.roleId) {
        team.roleId = pickRoleId();
        team.roleRevealedAt = Date.now();
      }
    }
  });
}
