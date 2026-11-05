// age-flow 데이터 로더 (서버 전용) — page SSR과 /api/persons/age-flow가 공유

import { revalidateTag, revalidatePath } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { buildAgeFlowData, JOSEON_START, JOSEON_END, type RawReign } from '@/lib/age-flow';
import { CURATED_NODES_FILTER } from '@/lib/heritage';
import { sharedCache } from '@/lib/shared-cache';
import type {
  AgeFlowEvent,
  AgeFlowArtifact,
  AgeFlowInitialData,
} from '@/components/age-flow/useAgeFlow';

// SCALABILITY NOTE: 범위 내 인물이 이 값에 닿으면 구간 로드로 전환 (useAgeFlow.ts 참조)
const PERSON_LIMIT = 1000;
const EVENT_LIMIT = 500;
const ARTIFACT_LIMIT = 100;

// AgeFlowArtifact.metadata keys, selected one by one instead of the whole jsonb
const ARTIFACT_META_KEYS = [
  'designation',
  'designation_ko',
  'created_year',
  'created_period',
  'category',
  'material',
] as const;
type ArtifactMetaKey = (typeof ARTIFACT_META_KEYS)[number];

const ARTIFACT_SELECT = [
  'id, slug, title, thumbnail',
  ...ARTIFACT_META_KEYS.map((k) => `meta_${k}:metadata->${k}`),
].join(', ');

type RawArtifactRow = Omit<AgeFlowArtifact, 'metadata'> & {
  [K in ArtifactMetaKey as `meta_${K}`]?: unknown;
};

/** Reassemble the flat `meta_*` columns into the metadata object the client expects */
export function toAgeFlowArtifacts(rows: RawArtifactRow[]): AgeFlowArtifact[] {
  return rows.map((row) => {
    const metadata: Record<string, unknown> = {};
    for (const k of ARTIFACT_META_KEYS) {
      const v = row[`meta_${k}`];
      if (v !== null && v !== undefined) metadata[k] = v;
    }
    return {
      id: row.id,
      slug: row.slug,
      title: row.title,
      thumbnail: row.thumbnail,
      metadata: metadata as AgeFlowArtifact['metadata'],
    };
  });
}

async function loadAgeFlowData(): Promise<AgeFlowInitialData> {
  const [personsResult, eventsResult, artifactsResult, reignsResult] = await Promise.all([
    supabaseAdmin
      .from('persons')
      .select(
        `id, slug, name_en, name_ko, birth_year, death_year, is_alive,
         thumbnail, view_count, follow_count,
         person_tags ( tag_id, tags ( id, name_en, type ) )`
      )
      .eq('is_deleted', false)
      .eq('is_published', true)
      .not('birth_year', 'is', null)
      .lte('birth_year', JOSEON_END)
      .or(`is_alive.eq.true,death_year.gte.${JOSEON_START}`)
      .order('birth_year', { ascending: true })
      .limit(PERSON_LIMIT),

    supabaseAdmin
      .from('nodes')
      .select(
        `id, slug, title, metadata,
         person_node_links ( persons:person_id ( id, slug, name_ko, name_en, thumbnail ) )`
      )
      .eq('is_deleted', false)
      .eq('is_published', true)
      .eq('node_type', 'EVENT')
      // Range in the query — otherwise events from other eras use up the limit
      .gte('metadata->start_year', JOSEON_START)
      .lte('metadata->start_year', JOSEON_END)
      .order('metadata->start_year', { ascending: true })
      .limit(EVENT_LIMIT),

    supabaseAdmin
      .from('nodes')
      // Only the keys the timeline reads — artifact metadata jsonb is large
      .select(ARTIFACT_SELECT)
      .eq('is_deleted', false)
      .eq('is_published', true)
      .eq('node_type', 'ARTIFACT')
      // Bulk-imported heritage (~2,800) would push the curated artifacts past the limit
      .or(CURATED_NODES_FILTER)
      .not('metadata->created_year', 'is', null)
      .order('created_at', { ascending: false })
      .limit(ARTIFACT_LIMIT),

    supabaseAdmin
      .from('reigns')
      .select('reign_start, reign_end, persons:person_id ( slug )')
      .order('reign_start', { ascending: true }),
  ]);

  // throw → unstable_cache가 실패 결과를 캐시하지 않음 (빈 데이터 캐시 방지)
  const error = personsResult.error ?? eventsResult.error ?? artifactsResult.error;
  if (error) throw new Error(`[age-flow] fetch failed: ${error.message}`);

  // Non-fatal: the page still works (without the king HUD) if reigns is unavailable
  if (reignsResult.error) {
    console.error('[age-flow] reigns fetch failed:', reignsResult.error.message);
  }

  const rawPersons = personsResult.data ?? [];
  if (rawPersons.length >= PERSON_LIMIT) {
    console.warn(`[age-flow] person limit (${PERSON_LIMIT}) reached — later figures are cut off`);
  }

  return buildAgeFlowData({
    persons: rawPersons as Record<string, unknown>[],
    events: (eventsResult.data ?? []) as unknown as AgeFlowEvent[],
    artifacts: toAgeFlowArtifacts((artifactsResult.data ?? []) as unknown as RawArtifactRow[]),
    reigns: (reignsResult.data ?? []) as unknown as RawReign[],
  });
}

// sharedCache: on a DB error serve the last good data and back off instead of
// re-running these four queries on every request (stampede while the DB is slow).
// With nothing to serve it still throws, so callers never cache empty data.
export const getAgeFlowData = sharedCache(
  'age-flow-data',
  loadAgeFlowData,
  { revalidate: 300, tags: ['age-flow'] },
  () => {
    throw new Error('[age-flow] data unavailable');
  }
);

/** Call after admin writes to persons / nodes / tags / links so age-flow and the ISR person/node pages update now, not in 5 min */
export function revalidateAgeFlow() {
  revalidateTag('age-flow');
  revalidatePath('/persons/[slug]', 'layout');
  revalidatePath('/nodes/[slug]', 'page');
}
