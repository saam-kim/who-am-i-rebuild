import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createSession, sessionExists } from "../../store/sessionStore";
import { PrimaryButton } from "../../components/ui";

const LAST_CODE_KEY = "wai-teacher-last-code";

export function TeacherHome() {
  const [className, setClassName] = useState("");
  const [studentCount, setStudentCount] = useState(24);
  const navigate = useNavigate();
  const lastCode = localStorage.getItem(LAST_CODE_KEY);
  const lastCodeStillValid = lastCode && sessionExists(lastCode);

  function handleCreate() {
    const code = createSession(className.trim() || "무지의 베일 수업", studentCount);
    localStorage.setItem(LAST_CODE_KEY, code);
    navigate(`/teacher/${code}`);
  }

  const teamCount = Math.min(20, Math.max(5, Math.round(studentCount / 2)));

  return (
    <div className="flex min-h-screen items-center justify-center p-6">
      <div className="glass-card w-full max-w-md rounded-[14px] p-6">
        <span className="font-mono-label inline-block rounded-full bg-brand-dim px-3.5 py-1.5 text-[11px] text-brand-ink">교사 대시보드</span>
        <h1 className="mt-4 text-xl font-extrabold tracking-tight text-ink">새 세션 만들기</h1>

        <label className="mt-5 block">
          <span className="font-mono-label text-[10px] uppercase text-ink-faint">수업명</span>
          <input
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="예: 2학년 3반 사회"
            className="mt-1 w-full rounded-[10px] border border-line bg-surface-0 px-3 py-3 text-[14px] text-ink outline-none focus:border-brand"
          />
        </label>

        <label className="mt-4 block">
          <span className="font-mono-label text-[10px] uppercase text-ink-faint">참여 학생 수</span>
          <input
            value={studentCount}
            onChange={(e) => setStudentCount(Math.max(0, Number(e.target.value.replace(/\D/g, "")) || 0))}
            inputMode="numeric"
            className="font-display mt-1 w-full rounded-[10px] border border-line bg-surface-0 px-3 py-3 text-[14px] font-semibold text-ink outline-none focus:border-brand"
          />
          <span className="mt-1 block text-[11.5px] text-ink-dim">2인 1팀 기준 약 {teamCount}팀이 자동으로 구성됩니다 (5~20팀).</span>
        </label>

        <div className="mt-5">
          <PrimaryButton onClick={handleCreate}>세션 시작</PrimaryButton>
        </div>

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
