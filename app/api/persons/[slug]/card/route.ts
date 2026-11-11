import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sharedCache } from '@/lib/shared-cache';

// ─── GET /api/persons/:slug/card — Hover panel / person sheet summary [PUBLIC] ───
// Hovering a timeline card used to call GET /api/persons/:slug (the full row + two
// counts, uncached) for every visitor. This returns only what the card shows and is
// shared across requests; revalidateAgeFlow() clears it on person edits.

const SlugSchema = z.string().min(1).max(200).regex(/^[a-z0-9-]+$/);

// Never prerender at build time — caching is handled by sharedCache
export const dynamic = 'force-dynamic';

const getPersonCard = sharedCache(
  'person-card',
  async (slug: string) => {
    const { data: person, error } = await supabaseAdmin
      .from('persons')
      .select(
        `id, slug, name_en, name_ko, birth_year, death_year, is_alive, thumbnail, view_count, follow_count,
         person_tags ( tag_id, tags ( id, name_ko, name_en, type ) )`
      )
      .eq('slug', slug)
      .eq('is_deleted', false)
      .eq('is_published', true)
      .maybeSingle();
    if (error) throw new Error(`[person-card] person: ${error.message}`);
    if (!person) return null;

    const [relations, threads] = await Promise.all([
      supabaseAdmin
        .from('person_relations')
        .select('id', { count: 'exact', head: true })
        .or(`from_person_id.eq.${person.id},to_person_id.eq.${person.id}`),
      supabaseAdmin
        .from('threads')
        .select('id', { count: 'exact', head: true })
        .eq('person_id', person.id)
        .eq('is_deleted', false),
    ]);
    // Throw so a failed count is not cached as 0
    const countError = relations.error ?? threads.error;
    if (countError) throw new Error(`[person-card] counts: ${countError.message}`);

    return { ...person, relation_count: relations.count ?? 0, thread_count: threads.count ?? 0 };
  },
  { revalidate: 300, tags: ['age-flow'] },
  () => {
    throw new Error('[person-card] data unavailable');
  }
);

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  if (!SlugSchema.safeParse(params.slug).success)
    return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  try {
    const card = await getPersonCard(params.slug);
    if (!card) return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);
    return apiSuccess(card);
  } catch {
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
  }
}
