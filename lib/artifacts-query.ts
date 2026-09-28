// 유물 목록 필터 — GET /api/artifacts 와 /api/artifacts/periods 가 공유 (서버 전용)

import { z } from 'zod';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sanitizeSearchTerm } from '@/lib/search';
import {
  ARTIFACT_CATEGORIES,
  ARTIFACT_PERIODS,
  ARTIFACT_REGIONS,
  GROUP_PRIMARY_FILTER,
  HERITAGE_KINDS,
} from '@/lib/artifacts';

const keys = <T extends { key: string }>(xs: readonly T[]) =>
  xs.map((x) => x.key) as [T['key'], ...T['key'][]];

export { keys as filterKeys };

export const ArtifactFilterSchema = z.object({
  category: z.enum(keys(ARTIFACT_CATEGORIES)).optional(),
  kind: z.enum(keys(HERITAGE_KINDS)).optional(),
  period: z.enum(ARTIFACT_PERIODS).optional(),
  region: z.enum(keys(ARTIFACT_REGIONS)).optional(),
  // English collection name (metadata.collection) — exact match
  collection: z.string().trim().min(1).max(200).optional(),
  q: z.string().max(100).transform(sanitizeSearchTerm).optional(),
});

export type ArtifactFilters = z.infer<typeof ArtifactFilterSchema>;

/** Published, non-deleted artifacts matching the filters (groups collapsed unless searching) */
export function artifactQuery(
  select: string,
  filters: ArtifactFilters,
  options?: { count?: 'exact'; ignoreFacets?: boolean; expandGroups?: boolean }
) {
  let query = supabaseAdmin
    .from('nodes')
    .select(select, options?.count ? { count: options.count } : undefined)
    .eq('node_type', 'ARTIFACT')
    .eq('is_deleted', false)
    .eq('is_published', true);

  const { category, kind, period, region, collection, q } = filters;
  if (category) query = query.eq('metadata->>category', category);
  if (kind) query = query.eq('metadata->>heritage_kind', kind);
  // Facet counts (period chart, collection filter) apply their selections themselves
  if (period && !options?.ignoreFacets)
    query = query.eq('metadata->>created_period', period);
  if (collection && !options?.ignoreFacets)
    query = query.eq('metadata->>collection', collection);
  if (region) query = query.eq('metadata->>region_key', region);
  if (q)
    query = query.or(`title.ilike.*${q}*,metadata->>title_ko.ilike.*${q}*`);
  else if (!options?.expandGroups) query = query.or(GROUP_PRIMARY_FILTER);
  return query;
}
