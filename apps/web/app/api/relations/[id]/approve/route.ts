import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/relations/:id/approve — 관계 승인 [ADMIN] ───

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  const { data, error } = await supabaseAdmin
    .from('person_relations')
    .update({ is_approved: true })
    .eq('id', params.id)
    .eq('is_approved', false)
    .select()
    .single();

  if (error || !data)
    return apiError('NODE_NOT_FOUND', '관계를 찾을 수 없습니다.', 404);

  return apiSuccess(data);
}
