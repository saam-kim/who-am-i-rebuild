import type { WordCount } from "../data/wordcloud";

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

const TONES = ["text-brand-ink", "text-ink", "text-good", "text-warn"];

export function WordCloud({ words }: { words: WordCount[] }) {
  if (words.length === 0) {
    return <p className="py-6 text-center text-[12.5px] text-ink-faint">아직 입력된 답이 없어요.</p>;
  }
  const max = Math.max(...words.map((w) => w.count));
  const min = Math.min(...words.map((w) => w.count));

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 px-2 py-4">
      {words.map((w) => {
        const t = max === min ? 1 : (w.count - min) / (max - min);
        const size = 13 + t * 26; // 13px ~ 39px
        const rotate = (hash(w.word) % 7) - 3; // -3deg ~ 3deg, 단어마다 고정
        const tone = TONES[hash(w.word) % TONES.length];
        return (
          <span
            key={w.word}
            className={`font-semibold leading-none ${tone}`}
            style={{ fontSize: `${size}px`, transform: `rotate(${rotate}deg)` }}
            title={`${w.count}번 등장`}
          >
            {w.word}
          </span>
        );
      })}
    </div>
  );
}
