import type { Team } from "../types";

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

// 의미를 담은 색이 아니라 순전히 코르크보드 느낌을 위한 장식용 팔레트.
const NOTE_COLORS = [
  { bg: "#fff7d6", edge: "#eddd8e" },
  { bg: "#ffe3ec", edge: "#f3b8cd" },
  { bg: "#dff3ff", edge: "#a9d8f0" },
  { bg: "#e6f7e0", edge: "#b6e0a6" },
];

export function PostItWall({ teams }: { teams: Team[] }) {
  const withResponse = teams.filter((t) => t.stage1Response?.trim());

  if (withResponse.length === 0) {
    return <p className="py-6 text-center text-[12.5px] text-ink-faint">아직 입력된 답이 없어요.</p>;
  }

  return (
    <div className="flex flex-wrap justify-center gap-3 px-2 py-3">
      {withResponse.map((team) => {
        const h = hash(team.id);
        const color = NOTE_COLORS[h % NOTE_COLORS.length];
        const rotate = (h % 7) - 3;
        return (
          <div
            key={team.id}
            className="w-40 rounded-sm p-3 text-[12px] text-[#3a3320] shadow-[0_6px_14px_rgba(0,0,0,0.12)]"
            style={{ background: color.bg, border: `1px solid ${color.edge}`, transform: `rotate(${rotate}deg)` }}
          >
            <p className="font-mono-label mb-1 text-[9.5px] uppercase text-[#7a7048]">{team.name}</p>
            <p className="leading-snug">{team.stage1Response}</p>
          </div>
        );
      })}
    </div>
  );
}
