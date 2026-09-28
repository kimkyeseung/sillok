// 유물(ARTIFACT) 목록 순수 로직 — 필터 옵션, 정렬, 커서 (GET /api/artifacts · ArtifactBrowser 공유)

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
