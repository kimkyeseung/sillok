import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sharedCache } from '@/lib/shared-cache';

// ─── GET /api/persons/:slug/relations — Person relations (public) ───

const QuerySchema = z.object({
  relation_type: z
    .enum(['FAMILY', 'TEACHER', 'ALLY', 'RIVAL', 'LORD_VASSAL', 'INFLUENCE'])
    .optional(),
});

// Never prerender at build time — caching is handled by sharedCache
export const dynamic = 'force-dynamic';

interface RelationRow {
  relation_id: string;
  other_person_id: string;
  rel_type: string;
  direction: string;
  rel_description: string;
}

// Shared across requests (three queries per call otherwise); revalidateAgeFlow()
// clears it on person edits, relation approvals show up within the TTL
const getPersonRelations = sharedCache(
  'person-relations',
  async (slug: string) => {
    const { data: person, error: personError } = await supabaseAdmin
      .from('persons')
      .select('id')
      .eq('slug', slug)
      .eq('is_deleted', false)
      .maybeSingle();
    if (personError) throw new Error(`[person-relations] person: ${personError.message}`);
    if (!person) return null;

    // Call get_person_relations DB function
    const { data, error } = await supabaseAdmin.rpc('get_person_relations', {
      p_id: person.id,
    });
    if (error) throw new Error(`[person-relations] rpc: ${error.message}`);

    const relations = (data ?? []) as RelationRow[];
    if (relations.length === 0) return [];

    // Fetch related person info
    const { data: persons, error: othersError } = await supabaseAdmin
      .from('persons')
      .select('id, slug, name_ko, name_en, thumbnail, birth_year, death_year')
      .in('id', relations.map((r) => r.other_person_id))
      .eq('is_deleted', false)
      .eq('is_published', true);
    if (othersError) throw new Error(`[person-relations] others: ${othersError.message}`);

    const personMap = new Map((persons ?? []).map((p) => [p.id as string, p]));
    return relations.map((r) => ({ ...r, other_person: personMap.get(r.other_person_id) ?? null }));
  },
  { revalidate: 300, tags: ['age-flow'] },
  () => {
    throw new Error('[person-relations] data unavailable');
  }
);

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  let relations;
  try {
    relations = await getPersonRelations(params.slug);
  } catch {
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
  }
  if (!relations) return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  // Filter by relation_type
  const type = parsed.data.relation_type;
  return apiSuccess(type ? relations.filter((r) => r.rel_type === type) : relations);
}
