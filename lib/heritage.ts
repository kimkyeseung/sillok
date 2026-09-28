// 국가유산청 API로 일괄 등록한 국보·보물 노드 (metadata.source = 'khs', scripts/import-heritage.mjs)
// AI 번역 초안이라 검수 전까지 큐레이션 목록(age-flow·/nodes·sitemap)에서 빼고 noindex

import {
  formatEraYears,
  formatYear,
  type YearPrecision,
} from '@/lib/heritage-era';

export const HERITAGE_SOURCE = 'khs';

/** PostgREST `.or()` filter — nodes not bulk-imported from the heritage API */
export const CURATED_NODES_FILTER = `metadata->>source.is.null,metadata->>source.neq.${HERITAGE_SOURCE}`;

export function isUnreviewedHeritage(
  metadata: Record<string, unknown> | null | undefined
): boolean {
  return metadata?.source === HERITAGE_SOURCE && metadata?.reviewed !== true;
}

export interface ArtifactFact {
  label: string;
  value: string;
}

/** Artifact detail rows (English only — Korean source fields stay out of the UI) */
export function getArtifactFacts(
  metadata: Record<string, unknown> | null | undefined
): ArtifactFact[] {
  if (!metadata) return [];
  const str = (k: string) =>
    typeof metadata[k] === 'string' && metadata[k]
      ? (metadata[k] as string)
      : null;
  const num = (k: string) =>
    typeof metadata[k] === 'number' ? (metadata[k] as number) : null;

  const years =
    formatEraYears({
      year_start: num('year_start') ?? undefined,
      year_end: num('year_end') ?? undefined,
      year_precision: str('year_precision') as YearPrecision | undefined,
    }) ??
    (num('created_year') != null
      ? `c. ${formatYear(num('created_year')!)}`
      : null);
  const period = [str('created_period'), years].filter(Boolean).join(', ');
  const category = str('category');

  const facts: Array<[string, string | null]> = [
    ['Designation', str('designation')],
    ['Period', period || null],
    [
      'Type',
      category ? category.charAt(0).toUpperCase() + category.slice(1) : null,
    ],
    ['Material', str('material')],
    ['Location', str('location')],
    ['Collection', str('collection')],
  ];
  return facts
    .filter((f): f is [string, string] => !!f[1])
    .map(([label, value]) => ({ label, value }));
}

/* ── Featured order & designation groups (scripts/heritage-ranks.mts) ── */

export interface RankInput {
  id: string;
  thumbnail: string | null;
  metadata: Record<string, unknown>;
}

/**
 * /nodes Artifacts default order (ascending):
 * with photo < without → curated < bulk-imported → National Treasure < Treasure < other → designation number
 */
export function featuredRank({ thumbnail, metadata }: RankInput): number {
  const num = Number(
    String(metadata.designation ?? '').match(/No\.\s*(\d+)/)?.[1] ?? 9999
  );
  const kind =
    metadata.heritage_kind === 'national_treasure'
      ? 0
      : metadata.heritage_kind === 'treasure'
        ? 10000
        : 20000;
  return (
    (thumbnail ? 0 : 200000) +
    (metadata.source === HERITAGE_SOURCE ? 100000 : 0) +
    kind +
    num
  );
}

export interface GroupInfo {
  designation_group_size: number;
  group_primary: boolean;
}

/**
 * Items sharing a designation (e.g. the six Joseon Sillok archive editions) collapse into one card.
 * The primary is the best-ranked member (photo, curated first); ties break on id.
 */
export function assignGroups(nodes: RankInput[]): Map<string, GroupInfo> {
  const groups = new Map<string, RankInput[]>();
  for (const n of nodes) {
    const key = n.metadata.designation_group as string | undefined;
    if (!key) continue;
    groups.set(key, [...(groups.get(key) ?? []), n]);
  }
  const out = new Map<string, GroupInfo>();
  for (const members of groups.values()) {
    const sorted = [...members].sort(
      (a, b) => featuredRank(a) - featuredRank(b) || a.id.localeCompare(b.id)
    );
    sorted.forEach((n, i) =>
      out.set(n.id, {
        designation_group_size: members.length,
        group_primary: i === 0,
      })
    );
  }
  return out;
}
