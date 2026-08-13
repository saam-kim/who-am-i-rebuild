import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { joinTeam } from "../../store/sessionStore";
import { PrimaryButton } from "../../components/ui";

export function JoinScreen() {
  const [pin, setPin] = useState("");
  const [teamName, setTeamName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  function handleJoin() {
    setError(null);
    if (pin.trim().length !== 4) {
      setError("참여 코드 4자리를 입력해 주세요.");
      return;
    }
    if (!teamName.trim()) {
      setError("팀 이름을 입력해 주세요.");
      return;
    }
    const result = joinTeam(pin.trim(), teamName);
    if ("error" in result) {
      setError(result.error);
      return;
    }
    navigate(`/play/${pin.trim()}`);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface-0 p-6">
      <div className="w-full max-w-sm rounded-2xl border border-line bg-surface-1 p-6 shadow-[0_24px_60px_-32px_rgba(31,35,51,0.25)]">
        <p className="font-mono-label text-[11px] uppercase text-brand">Who Am I</p>
        <h1 className="mt-1 text-xl font-extrabold text-ink">참여 코드를 입력하세요</h1>

        <label className="mt-5 block">
          <span className="font-mono-label text-[10px] uppercase text-ink-faint">참여 코드 (PIN)</span>
          <input
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 4))}
            inputMode="numeric"
            placeholder="0000"
            className="mt-1 w-full rounded-xl border border-line bg-surface-0 px-3 py-3 text-center text-2xl font-bold tracking-[0.3em] text-ink outline-none focus:border-brand"
          />
        </label>

        <label className="mt-4 block">
          <span className="font-mono-label text-[10px] uppercase text-ink-faint">우리 팀 이름</span>
          <input
            value={teamName}
            onChange={(e) => setTeamName(e.target.value)}
            placeholder="예: 하늘 & 별빛"
            className="mt-1 w-full rounded-xl border border-line bg-surface-0 px-3 py-3 text-[14px] text-ink outline-none focus:border-brand"
          />
        </label>

        {error && <p className="mt-3 text-[12.5px] text-crit">{error}</p>}

        <div className="mt-5">
          <PrimaryButton onClick={handleJoin}>입장하기</PrimaryButton>
        </div>
        <p className="mt-4 text-center text-[11px] text-ink-faint">새로고침해도 같은 팀으로 자동 복구됩니다.</p>
      </div>
    </div>
  );
}
