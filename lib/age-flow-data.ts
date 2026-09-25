// age-flow 데이터 로더 (서버 전용) — page SSR과 /api/persons/age-flow가 공유

import { unstable_cache } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { buildAgeFlowData, JOSEON_START, JOSEON_END } from '@/lib/age-flow';
import type {
  AgeFlowEvent,
  AgeFlowArtifact,
  AgeFlowInitialData,
} from '@/components/age-flow/useAgeFlow';

// SCALABILITY NOTE: 범위 내 인물이 이 값에 닿으면 구간 로드로 전환 (useAgeFlow.ts 참조)
const PERSON_LIMIT = 1000;
const EVENT_LIMIT = 500;
const ARTIFACT_LIMIT = 100;

async function loadAgeFlowData(): Promise<AgeFlowInitialData> {
  const [personsResult, eventsResult, artifactsResult] = await Promise.all([
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
      .not('metadata->start_year', 'is', null)
      .order('metadata->start_year', { ascending: true })
      .limit(EVENT_LIMIT),

    supabaseAdmin
      .from('nodes')
      .select('id, slug, title, thumbnail, metadata')
      .eq('is_deleted', false)
      .eq('is_published', true)
      .eq('node_type', 'ARTIFACT')
      .not('metadata->created_year', 'is', null)
      .order('created_at', { ascending: false })
      .limit(ARTIFACT_LIMIT),
  ]);

  // throw → unstable_cache가 실패 결과를 캐시하지 않음 (빈 데이터 캐시 방지)
  const error = personsResult.error ?? eventsResult.error ?? artifactsResult.error;
  if (error) throw new Error(`[age-flow] fetch failed: ${error.message}`);

  const rawPersons = personsResult.data ?? [];
  if (rawPersons.length >= PERSON_LIMIT) {
    console.warn(`[age-flow] person limit (${PERSON_LIMIT}) reached — later figures are cut off`);
  }

  return buildAgeFlowData({
    persons: rawPersons as Record<string, unknown>[],
    events: (eventsResult.data ?? []) as unknown as AgeFlowEvent[],
    artifacts: (artifactsResult.data ?? []) as unknown as AgeFlowArtifact[],
  });
}

export const getAgeFlowData = unstable_cache(loadAgeFlowData, ['age-flow-data'], {
  revalidate: 300,
  tags: ['age-flow'],
});
