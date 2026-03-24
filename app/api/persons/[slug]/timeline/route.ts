import { apiError, apiSuccess } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/persons/:slug/timeline — Person timeline (public) ───

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const { data: person } = await supabaseAdmin
    .from('persons')
    .select('id')
    .eq('slug', params.slug)
    .eq('is_deleted', false)
    .single();

  if (!person)
    return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  const { data, error } = await supabaseAdmin
    .from('person_timeline')
    .select('id, year, month, title, description, sort_order')
    .eq('person_id', person.id)
    .order('year', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess(data);
}
