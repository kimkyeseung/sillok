import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── DELETE /api/persons/:slug/hard — 인물 hard delete [ADMIN] ───

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  const { data: existing } = await supabaseAdmin
    .from('persons')
    .select('id')
    .eq('slug', params.slug)
    .single();

  if (!existing)
    return apiError('PERSON_NOT_FOUND', '인물을 찾을 수 없습니다.', 404);

  const { error } = await supabaseAdmin
    .from('persons')
    .delete()
    .eq('id', existing.id);

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess({ hard_deleted: true });
}
