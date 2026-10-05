import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSession, sessionExists } from "../../store/sessionStore";
import { PrimaryButton } from "../../components/ui";
import { safeLocalStorage } from "../../utils/storage";

const LAST_CODE_KEY = "wai-teacher-last-code";

export function TeacherHome() {
  const [studentCount, setStudentCount] = useState(24);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCodeStillValid, setLastCodeStillValid] = useState(false);
  const navigate = useNavigate();
  const lastCode = safeLocalStorage.getItem(LAST_CODE_KEY);

  useEffect(() => {
    if (!lastCode) return;
    sessionExists(lastCode).then(setLastCodeStillValid).catch(() => setLastCodeStillValid(false));
  }, [lastCode]);

  async function handleCreate(e?: React.FormEvent) {
    if (e) e.preventDefault();
    if (creating) return;
    if (!Number.isFinite(studentCount) || studentCount <= 0) {
      setError("참여 학생 수를 1명 이상 입력해 주세요.");
      return;
    }
    setError(null);
    setCreating(true);
    try {
      const code = await createSession(studentCount);
      safeLocalStorage.setItem(LAST_CODE_KEY, code);
      navigate(`/teacher/${code}`);
    } catch (err) {
      console.error("세션 생성 실패:", err);
      setError("세션을 생성하지 못했습니다. 네트워크 상태 또는 Firebase 연결을 확인해주세요.");
    } finally {
      setCreating(false);
    }
  }

  const teamCount = Math.min(20, Math.max(5, Math.round(studentCount / 2)));

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="glass-card w-full max-w-md rounded-[14px] p-6">
        <span className="font-mono-label inline-block rounded-full bg-brand-dim px-3.5 py-1.5 text-[11px] text-brand-ink">교사 대시보드</span>
        <h1 className="mt-4 text-xl font-extrabold tracking-tight text-ink">새 세션 만들기</h1>

        <form onSubmit={handleCreate} className="mt-5">
          <label className="block">
            <span className="font-mono-label text-[10px] uppercase text-ink-faint">참여 학생 수</span>
            <input
              value={studentCount}
              onChange={(e) => setStudentCount(Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0))}
              inputMode="numeric"
              className="font-display mt-1 w-full rounded-[10px] border border-line bg-surface-0 px-3 py-3 text-[14px] font-semibold text-ink outline-none focus:border-brand"
            />
            <span className="mt-1 block text-[11.5px] text-ink-dim">2인 1팀 기준 약 {teamCount}팀이 자동으로 구성됩니다 (5~20팀).</span>
          </label>

          {error && (
            <div className="mt-3 rounded-[10px] border border-crit/30 bg-crit-bg/40 p-3 text-[12.5px] text-crit leading-relaxed">
              <p className="font-semibold">{error}</p>
              <p className="mt-1 text-[11.5px] text-ink-dim">
                💡 브라우저의 광고 차단기(AdBlock, uBlock 등)가 켜져 있거나 사이트 데이터 저장이 차단되어 있는지 확인해 보세요.
              </p>
            </div>
          )}

          <div className="mt-5">
            <PrimaryButton type="submit" disabled={creating}>
              {creating ? "만드는 중…" : "세션 시작"}
            </PrimaryButton>
          </div>
        </form>

        {lastCodeStillValid && (
          <button
            onClick={() => navigate(`/teacher/${lastCode}`)}
            className="mt-3 w-full rounded-full border border-line py-2.5 text-[12.5px] text-ink-dim transition-all hover:-translate-y-0.5"
          >
            이전 세션 이어서 진행하기 (코드 {lastCode})
          </button>
        )}
      </div>
    </div>
  );
}
