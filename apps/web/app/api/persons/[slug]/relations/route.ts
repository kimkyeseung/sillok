import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/persons/:slug/relations — Person relations (public) ───

const QuerySchema = z.object({
  relation_type: z
    .enum(['FAMILY', 'TEACHER', 'ALLY', 'RIVAL', 'LORD_VASSAL', 'INFLUENCE'])
    .optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { data: person } = await supabaseAdmin
    .from('persons')
    .select('id')
    .eq('slug', params.slug)
    .eq('is_deleted', false)
    .single();

  if (!person)
    return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  // Call get_person_relations DB function
  const { data, error } = await supabaseAdmin.rpc('get_person_relations', {
    p_id: person.id,
  });

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  let relations = data ?? [];

  // Filter by relation_type
  if (parsed.data.relation_type) {
    relations = relations.filter(
      (r: { rel_type: string }) => r.rel_type === parsed.data.relation_type
    );
  }

  // Fetch related person info
  const otherIds = relations.map(
    (r: { other_person_id: string }) => r.other_person_id
  );

  if (otherIds.length === 0) return apiSuccess([]);

  const { data: persons } = await supabaseAdmin
    .from('persons')
    .select('id, slug, name_ko, name_en, thumbnail, birth_year, death_year')
    .in('id', otherIds)
    .eq('is_deleted', false);

  const personMap = new Map(
    (persons ?? []).map((p: { id: string }) => [p.id, p])
  );

  const enriched = relations.map(
    (r: {
      relation_id: string;
      other_person_id: string;
      rel_type: string;
      direction: string;
      rel_description: string;
    }) => ({
      ...r,
      other_person: personMap.get(r.other_person_id) ?? null,
    })
  );

  return apiSuccess(enriched);
}
