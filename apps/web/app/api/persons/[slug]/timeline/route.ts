import { apiError, apiSuccess } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/persons/:slug/timeline — 인물 타임라인 (공개) ───

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
    return apiError('PERSON_NOT_FOUND', '인물을 찾을 수 없습니다.', 404);

  const { data, error } = await supabaseAdmin
    .from('person_timeline')
    .select('id, year, month, title, description, sort_order')
    .eq('person_id', person.id)
    .order('year', { ascending: true })
    .order('sort_order', { ascending: true });

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess(data);
}
