import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  AgeFlowPerson,
  AgeFlowTag,
  AgeFlowEvent,
  AgeFlowArtifact,
  JOSEON_START,
  JOSEON_END,
} from '@/components/age-flow/useAgeFlow';
import AgeFlowClient from './AgeFlowClient';

// Revalidate every 5 minutes — data rarely changes
export const revalidate = 300;

function transformPerson(raw: Record<string, unknown>): AgeFlowPerson | null {
  const birthYear = raw.birth_year as number | null;
  const deathYear = raw.death_year as number | null;
  const isAlive = raw.is_alive as boolean;

  if (birthYear === null || birthYear === undefined) return null;
  if (deathYear === null && !isAlive) return null;

  const personTags = raw.person_tags as Array<{
    tag_id: string;
    tags: { id: string; name_en: string; type: string } | null;
  }> | null;

  const tags: AgeFlowTag[] = (personTags ?? [])
    .filter((pt) => pt.tags !== null)
    .map((pt) => ({
      id: pt.tags!.id,
      name_en: pt.tags!.name_en,
      type: pt.tags!.type as 'ERA' | 'FIELD',
    }));

  return {
    id: raw.id as string,
    slug: raw.slug as string,
    name_en: raw.name_en as string | null,
    name_ko: raw.name_ko as string,
    birth_year: birthYear,
    death_year: deathYear,
    is_alive: isAlive,
    thumbnail: raw.thumbnail as string | null,
    view_count: (raw.view_count as number) ?? 0,
    follow_count: (raw.follow_count as number) ?? 0,
    tags,
  };
}

async function fetchAgeFlowData() {
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
      .order('birth_year', { ascending: true })
      .limit(1000),

    supabaseAdmin
      .from('nodes')
      .select(
        `id, slug, title, metadata,
         person_node_links ( persons:person_id ( id, slug, name_ko, name_en, thumbnail ) )`
      )
      .eq('is_deleted', false)
      .eq('is_published', true)
      .eq('node_type', 'EVENT')
      .order('created_at', { ascending: false })
      .limit(100),

    supabaseAdmin
      .from('nodes')
      .select('id, slug, title, thumbnail, metadata')
      .eq('is_deleted', false)
      .eq('is_published', true)
      .eq('node_type', 'ARTIFACT')
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const persons = (personsResult.data ?? [])
    .map((r) => transformPerson(r as unknown as Record<string, unknown>))
    .filter((p): p is AgeFlowPerson => p !== null)
    .filter((p) => {
      const deathYear = p.is_alive ? JOSEON_END : (p.death_year ?? p.birth_year);
      return p.birth_year <= JOSEON_END && deathYear >= JOSEON_START;
    });

  const events = (eventsResult.data ?? []) as unknown as AgeFlowEvent[];

  const artifacts = ((artifactsResult.data ?? []) as unknown as AgeFlowArtifact[]).filter(
    (a) => a.metadata?.created_year != null
  );

  return { persons, events, artifacts };
}

export default async function AgeFlowPage() {
  const initialData = await fetchAgeFlowData();
  return <AgeFlowClient initialData={initialData} />;
}
