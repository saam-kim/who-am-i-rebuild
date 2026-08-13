// 아주 단순한 한국어 단어 빈도 집계. 형태소 분석기가 아니라 조사/흔한 접미사를
// 규칙 기반으로 잘라내는 근사치라, 완벽하진 않지만 교실용 워드클라우드로는 충분하다.

const STOPWORDS = new Set([
  "은",
  "는",
  "이",
  "가",
  "을",
  "를",
  "의",
  "에",
  "에서",
  "에게",
  "도",
  "만",
  "와",
  "과",
  "로",
  "으로",
  "다",
  "것",
  "수",
  "등",
  "그리고",
  "하지만",
  "그래서",
  "위해",
  "위한",
  "때",
  "때문에",
  "우리",
  "저는",
  "나는",
  "모두",
  "같이",
  "때문",
  "좀",
  "잘",
  "사회",
  "사회는",
  "사회가",
  "사회를",
  "사회의",
  "사회에서",
  "정의로운",
  "정의로운사회",
]);

const SUFFIXES = ["습니다", "합니다", "받는", "하는", "되는", "이다", "입니다", "이에요", "예요", "해야", "되어야", "하고", "해서", "한", "할", "된"];

function normalize(token: string): string {
  let t = token.replace(/[.,!?"'…()[\]{}]/g, "").trim();
  for (const suf of SUFFIXES) {
    if (t.length - suf.length >= 2 && t.endsWith(suf)) {
      t = t.slice(0, -suf.length);
      break;
    }
  }
  return t;
}

export interface WordCount {
  word: string;
  count: number;
}

export function countWords(texts: string[], limit = 30): WordCount[] {
  const freq = new Map<string, number>();
  for (const text of texts) {
    if (!text) continue;
    for (const raw of text.split(/\s+/)) {
      const word = normalize(raw);
      if (word.length < 2 || STOPWORDS.has(word)) continue;
      freq.set(word, (freq.get(word) ?? 0) + 1);
    }
  }
  return [...freq.entries()]
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}
