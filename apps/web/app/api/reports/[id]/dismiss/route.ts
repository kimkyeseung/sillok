import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/reports/:id/dismiss — 신고 기각 [ADMIN] ───

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  const { data, error } = await supabaseAdmin
    .from('reports')
    .update({ status: 'DISMISSED' })
    .eq('id', params.id)
    .eq('status', 'PENDING')
    .select()
    .single();

  if (error || !data)
    return apiError('NODE_NOT_FOUND', '신고를 찾을 수 없습니다.', 404);

  return apiSuccess(data);
}
