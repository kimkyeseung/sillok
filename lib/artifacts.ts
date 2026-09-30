// 유물(ARTIFACT) 목록 순수 로직 — 필터 옵션, 정렬, 커서 (GET /api/artifacts · ArtifactBrowser 공유)

import { formatYear, ordinal } from '@/lib/heritage-era';

export const ARTIFACT_CATEGORIES = [
  { key: 'architecture', label: 'Architecture' },
  { key: 'sculpture', label: 'Sculpture' },
  { key: 'painting', label: 'Painting' },
  { key: 'craft', label: 'Craft' },
  { key: 'book', label: 'Book' },
  { key: 'calligraphy', label: 'Calligraphy' },
  { key: 'other', label: 'Other' },
] as const;

export const HERITAGE_KINDS = [
  { key: 'national_treasure', label: 'National Treasure' },
  { key: 'treasure', label: 'Treasure' },
] as const;

// Chronological — values match metadata.created_period (scripts/translate-heritage.mjs)
export const ARTIFACT_PERIODS = [
  'Prehistoric',
  'Gojoseon',
  'Three Kingdoms',
  'Goguryeo',
  'Baekje',
  'Silla',
  'Gaya',
  'Unified Silla',
  'Balhae',
  'Goryeo',
  'Joseon',
  'Korean Empire',
  'Modern',
] as const;

export const ARTIFACT_SORTS = [
  { key: 'featured', label: 'Featured' },
  { key: 'popular', label: 'Popular' },
  { key: 'oldest', label: 'Oldest' },
  { key: 'newest', label: 'Newest' },
] as const;

export type ArtifactCategory = (typeof ARTIFACT_CATEGORIES)[number]['key'];
export type HeritageKind = (typeof HERITAGE_KINDS)[number]['key'];
export type ArtifactPeriod = (typeof ARTIFACT_PERIODS)[number];
export type ArtifactSort = (typeof ARTIFACT_SORTS)[number]['key'];

export const ARTIFACT_PAGE_SIZE = 24;

/* ── Cursor: (sort value, id) keyset ── */

export interface ArtifactCursor {
  v: number | null;
  id: string;
}

export function encodeArtifactCursor(c: ArtifactCursor): string {
  return Buffer.from(JSON.stringify(c)).toString('base64url');
}

export function decodeArtifactCursor(s: string): ArtifactCursor | null {
  try {
    const c = JSON.parse(Buffer.from(s, 'base64url').toString('utf8'));
    if (typeof c?.id !== 'string' || !/^[0-9a-f-]{36}$/i.test(c.id))
      return null;
    if (c.v !== null && !Number.isFinite(c.v)) return null;
    return { v: c.v, id: c.id };
  } catch {
    return null;
  }
}

// featured_rank: curated < National Treasure < Treasure, then designation number (scripts/import-heritage.mjs)
const SORT_COLUMNS = {
  featured: 'metadata->featured_rank',
  popular: 'view_count',
  oldest: 'metadata->created_year',
  newest: 'metadata->created_year',
} as const;

/** Column each sort orders by (id asc is always the tie-breaker) */
export function sortColumn(
  sort: ArtifactSort
): (typeof SORT_COLUMNS)[ArtifactSort] {
  return SORT_COLUMNS[sort];
}

/** Descending sorts: popular (views), newest (year). Metadata columns put missing values last. */
export function isDescending(sort: ArtifactSort): boolean {
  return sort === 'popular' || sort === 'newest';
}

/**
 * PostgREST `.or()` filter for rows after the cursor, matching
 * ORDER BY <col> <dir> NULLS LAST, id ASC
 */
export function cursorFilter(sort: ArtifactSort, c: ArtifactCursor): string {
  const col = sortColumn(sort);
  if (c.v === null) return `and(${col}.is.null,id.gt.${c.id})`;
  const op = isDescending(sort) ? 'lt' : 'gt';
  const parts = [`${col}.${op}.${c.v}`, `and(${col}.eq.${c.v},id.gt.${c.id})`];
  if (col !== 'view_count') parts.push(`${col}.is.null`);
  return parts.join(',');
}

/** Sort value of a row, for building the next cursor */
export function sortValue(
  sort: ArtifactSort,
  row: { view_count: number | null; year: number | null; rank: number | null }
): number | null {
  if (sort === 'popular') return row.view_count ?? 0;
  if (sort === 'featured') return row.rank;
  return row.year;
}

// metadata.region_key (scripts/enrich-heritage.mts)
export const ARTIFACT_REGIONS = [
  { key: 'seoul', label: 'Seoul' },
  { key: 'busan', label: 'Busan' },
  { key: 'daegu', label: 'Daegu' },
  { key: 'incheon', label: 'Incheon' },
  { key: 'gwangju', label: 'Gwangju' },
  { key: 'daejeon', label: 'Daejeon' },
  { key: 'ulsan', label: 'Ulsan' },
  { key: 'sejong', label: 'Sejong' },
  { key: 'gyeonggi', label: 'Gyeonggi' },
  { key: 'gangwon', label: 'Gangwon' },
  { key: 'chungbuk', label: 'North Chungcheong' },
  { key: 'chungnam', label: 'South Chungcheong' },
  { key: 'jeonbuk', label: 'North Jeolla' },
  { key: 'jeonnam', label: 'South Jeolla' },
  { key: 'gyeongbuk', label: 'North Gyeongsang' },
  { key: 'gyeongnam', label: 'South Gyeongsang' },
  { key: 'jeju', label: 'Jeju' },
] as const;

export type ArtifactRegion = (typeof ARTIFACT_REGIONS)[number]['key'];

/** Other members of a designation group stay hidden in the list — except while searching by name */
export const GROUP_PRIMARY_FILTER =
  'metadata->>group_primary.is.null,metadata->>group_primary.eq.true';

/** Count rows per period (chronological order, zero-filled); unknown periods are dropped */
export function countByPeriod(
  periods: Array<string | null>
): Array<{ period: ArtifactPeriod; count: number }> {
  const counts = new Map<string, number>();
  for (const p of periods) if (p) counts.set(p, (counts.get(p) ?? 0) + 1);
  return ARTIFACT_PERIODS.map((period) => ({
    period,
    count: counts.get(period) ?? 0,
  }));
}

/* ── Centuries (Timeline view) ── */

/** Everything before 1000 BCE shares one bucket — a few prehistoric pieces, thousands of years apart */
export const EARLIEST_CENTURY = -11;

/**
 * Century key of a year: 1448 → 15, 1 → 1, -57 → -1 (1st century BCE), -3000 → EARLIEST_CENTURY.
 * There is no year 0 in the data, but 0 → -1 keeps it defined.
 */
export function centuryOf(year: number): number {
  if (year > 0) return Math.ceil(year / 100);
  return Math.max(EARLIEST_CENTURY, -Math.max(1, Math.ceil(-year / 100)));
}

/** 15 → "15th century", -2 → "2nd century BCE" */
export function centuryLabel(c: number): string {
  if (c <= EARLIEST_CENTURY) return 'Before 1000 BCE';
  return c > 0 ? `${ordinal(c)} century` : `${ordinal(-c)} century BCE`;
}

/** 15 → "1401–1500"; the earliest bucket has no range */
export function centuryRange(c: number): string | null {
  if (c <= EARLIEST_CENTURY) return null;
  const start = centuryStartYear(c)!;
  return `${formatYear(start)}–${formatYear(start + 99)}`;
}

/** First year of a century (the list's `from_year` when jumping to it); null = from the very start */
export function centuryStartYear(c: number): number | null {
  if (c <= EARLIEST_CENTURY) return null;
  return c > 0 ? (c - 1) * 100 + 1 : c * 100;
}

/** Korean historical eras by year — the Timeline's "now" badge. Starts are inclusive. */
export const KOREAN_ERAS = [
  { key: 'ancient', label: 'Ancient', start: -Infinity },
  { key: 'three-kingdoms', label: 'Three Kingdoms', start: -57 },
  { key: 'unified-silla', label: 'Unified Silla', start: 668 },
  { key: 'goryeo', label: 'Goryeo', start: 918 },
  { key: 'joseon', label: 'Joseon', start: 1392 },
  { key: 'korean-empire', label: 'Korean Empire', start: 1897 },
  { key: 'colonial', label: 'Japanese Occupation', start: 1910 },
  { key: 'modern', label: 'Modern', start: 1945 },
] as const;

export type KoreanEra = (typeof KOREAN_ERAS)[number];

/** 1448 → Joseon, 700 → Unified Silla, -100 → Ancient */
export function eraOf(year: number): KoreanEra {
  let era: KoreanEra = KOREAN_ERAS[0];
  for (const e of KOREAN_ERAS) if (year >= e.start) era = e;
  return era;
}

/**
 * Consecutive items of the same century → one section (the list arrives oldest first).
 * Undated items (sorted last) get century null.
 */
export function groupByCentury<T>(
  items: T[],
  yearOf: (item: T) => number | null
): Array<{ century: number | null; items: T[] }> {
  const sections: Array<{ century: number | null; items: T[] }> = [];
  for (const item of items) {
    const y = yearOf(item);
    const c = y == null ? null : centuryOf(y);
    const last = sections[sections.length - 1];
    if (last && last.century === c) last.items.push(item);
    else sections.push({ century: c, items: [item] });
  }
  return sections;
}

export interface FacetRow {
  period: string | null;
  collection: string | null;
  year?: number | null;
}

export interface ArtifactFacets {
  periods: Array<{ period: ArtifactPeriod; count: number }>;
  /** Most-held first; ties alphabetical */
  collections: Array<{ collection: string; count: number }>;
  /** Oldest first; undated rows are left out */
  centuries: Array<{ century: number; count: number }>;
}

/**
 * Counts for the period chart and the collection filter from one scan.
 * Rows match every filter except period and collection — each facet then applies
 * the *other* selection, so its own options stay clickable.
 */
export function countFacets(
  rows: FacetRow[],
  selected: { period?: string; collection?: string }
): ArtifactFacets {
  const periods = countByPeriod(
    rows
      .filter(
        (r) => !selected.collection || r.collection === selected.collection
      )
      .map((r) => r.period)
  );
  const counts = new Map<string, number>();
  for (const r of rows) {
    if (!r.collection || (selected.period && r.period !== selected.period))
      continue;
    counts.set(r.collection, (counts.get(r.collection) ?? 0) + 1);
  }
  const collections = [...counts]
    .map(([collection, count]) => ({ collection, count }))
    .sort(
      (a, b) => b.count - a.count || a.collection.localeCompare(b.collection)
    );
  // Timeline sections list what is on screen, so both selections apply
  const byCentury = new Map<number, number>();
  for (const r of rows) {
    if (r.year == null) continue;
    if (selected.period && r.period !== selected.period) continue;
    if (selected.collection && r.collection !== selected.collection) continue;
    const c = centuryOf(r.year);
    byCentury.set(c, (byCentury.get(c) ?? 0) + 1);
  }
  const centuries = [...byCentury]
    .map(([century, count]) => ({ century, count }))
    .sort((a, b) => a.century - b.century);
  return { periods, collections, centuries };
}
