// 국가유산청 시대 문자열(ccceName, 예: "조선 태조 7년(1398)", "고려시대 12세기", "통일신라") → 연도 범위
// 규칙 기반: 명시 연도 > 세기 > 시대명 순으로 해석. scripts/enrich-heritage.ts 에서 사용

export type YearPrecision =
  | 'exact'
  | 'approximate'
  | 'range'
  | 'century'
  | 'period';

export interface EraYears {
  year_start: number;
  year_end: number;
  year_precision: YearPrecision;
}

// 통일신라 → 신라처럼 긴 이름을 먼저 검사
// 4th element: fixed range — not split into 초/중/후 (전환기 이름 자체에 '말'·'초'가 들어 있음)
const PERIODS: Array<[RegExp, number, number, boolean?]> = [
  // 전환기 — "고려 말 ~ 조선 초"
  [/[여려]말\s*선초/, 1350, 1420, true],
  [/나말\s*여초/, 880, 960, true],
  [/일제강점기|일제시대/, 1910, 1945],
  [/대한제국/, 1897, 1910],
  [/통일신라/, 676, 935],
  [/고려/, 918, 1392],
  [/조선/, 1392, 1897],
  [/발해/, 698, 926],
  [/고구려/, -37, 668],
  [/백제/, -18, 660],
  [/가야/, 42, 562],
  [/신라/, -57, 676],
  [/삼국/, -57, 668],
  [/원삼국/, -100, 300],
  [/고조선/, -700, -108],
  [/철기/, -300, 1],
  [/청동기|청동시대/, -1500, -300],
  [/신석기|선사/, -8000, -1500],
  [/근대/, 1876, 1945],
];

/** Split [start, end] into thirds for 초기/전기, 중기, 후기/말 */
function subdivide(start: number, end: number, text: string): [number, number] {
  const third = Math.round((end - start) / 3);
  if (/(초기|전기|초|전반)(?!\S*세기)/.test(text))
    return [start, start + third];
  if (/중기|중엽/.test(text)) return [start + third, end - third];
  if (/(후기|말기|말|후반)(?!\S*세기)/.test(text)) return [end - third, end];
  return [start, end];
}

/** 12 → [1101, 1200]; BCE 3 → [-300, -201] */
function centuryRange(c: number, bce = false): [number, number] {
  return bce ? [-c * 100, -(c - 1) * 100 - 1] : [(c - 1) * 100 + 1, c * 100];
}

/** Period name → range. Several segments ("고려 말기/조선 초기", "조선 전기 및 후기") → their union */
function parsePeriods(text: string): [number, number] | null {
  let start = Infinity;
  let end = -Infinity;
  for (const segment of text.split(/[/~∼,]|및/)) {
    const hit = PERIODS.find(([re]) => re.test(segment));
    if (!hit) continue;
    const [s, e] = hit[3]
      ? [hit[1], hit[2]]
      : subdivide(hit[1], hit[2], segment);
    start = Math.min(start, s);
    end = Math.max(end, e);
  }
  return Number.isFinite(start) ? [start, end] : null;
}

export function parseEraYears(era: string | null | undefined): EraYears | null {
  if (!era) return null;
  const text = era.replace(/\s+/g, ' ').trim();

  // 1) 명시 연도 — 3~4자리 (재위 연차 "7년", "22"는 1~2자리라 제외)
  const years = [...text.matchAll(/(?<!\d)(\d{3,4})(?!\d)(?!\s*세기)/g)]
    .map((m) => Number(m[1]))
    .filter((y) => y >= 100 && y <= 2030);
  if (years.length > 0) {
    const first = years[0];
    // "1455~1494년", "1237∼1248년" — 범위
    const range = text.match(/(\d{3,4})\s*년?\s*[~∼\-–]\s*(\d{3,4})/);
    if (range) {
      const [a, b] = [Number(range[1]), Number(range[2])];
      if (b > a) return { year_start: a, year_end: b, year_precision: 'range' };
    }
    const approximate = /경|추정|무렵|전후|이전|이후/.test(text);
    return {
      year_start: first,
      year_end: first,
      year_precision: approximate ? 'approximate' : 'exact',
    };
  }

  // 2) 세기 — "12세기", "10∼11세기", "15세기 후반", "기원전 3세기"
  const bce = /기원전|B\.?C/i.test(text);
  const centuries = text.match(
    /(\d{1,2})\s*(?:세기)?\s*[~∼\-–]\s*(\d{1,2})\s*세기/
  );
  if (centuries) {
    const [a, b] = [Number(centuries[1]), Number(centuries[2])];
    const [ra, rb] = [centuryRange(a, bce), centuryRange(b, bce)];
    return {
      year_start: Math.min(ra[0], rb[0]),
      year_end: Math.max(ra[1], rb[1]),
      year_precision: 'century',
    };
  }
  const century = text.match(/(\d{1,2})\s*세기\s*(초|전반|중엽|중반|후반|말)?/);
  if (century) {
    let [start, end] = centuryRange(Number(century[1]), bce);
    const part = century[2];
    if (part === '초' || part === '전반') end = start + 49;
    else if (part === '중엽' || part === '중반')
      [start, end] = [start + 25, start + 74];
    else if (part === '후반' || part === '말') start = start + 50;
    return { year_start: start, year_end: end, year_precision: 'century' };
  }

  // 3) 시대명
  const period = parsePeriods(text);
  return period
    ? { year_start: period[0], year_end: period[1], year_precision: 'period' }
    : null;
}

export function formatYear(y: number): string {
  return y < 0 ? `${-y} BCE` : String(y);
}

export function ordinal(n: number): string {
  const s =
    n % 100 >= 11 && n % 100 <= 13
      ? 'th'
      : (({ 1: 'st', 2: 'nd', 3: 'rd' } as Record<number, string>)[n % 10] ??
        'th');
  return `${n}${s}`;
}

/** EraYears → display text: "1398", "c. 1448", "1237–1248", "12th century", "c. 918–1076" */
export function formatEraYears(
  e: Partial<EraYears> | null | undefined
): string | null {
  if (e?.year_start == null || e.year_end == null) return null;
  const { year_start: s, year_end: t, year_precision: p } = e;
  if (p === 'approximate') return `c. ${formatYear(s)}`;
  if (p === 'exact' || s === t) return formatYear(s);
  if (p === 'century' && s > 0 && s % 100 === 1 && t % 100 === 0) {
    const [a, b] = [(s - 1) / 100 + 1, t / 100];
    return a === b
      ? `${ordinal(a)} century`
      : `${ordinal(a)}–${ordinal(b)} centuries`;
  }
  const range = `${formatYear(s)}–${formatYear(t)}`;
  return p === 'range' ? range : `c. ${range}`;
}
