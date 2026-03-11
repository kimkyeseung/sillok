import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/person-requests/:id/approve — 인물 추가 요청 승인 [ADMIN] ───

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  const { data, error } = await supabaseAdmin
    .from('person_requests')
    .update({ status: 'APPROVED' })
    .eq('id', params.id)
    .eq('status', 'PENDING')
    .select()
    .single();

  if (error || !data)
    return apiError('NODE_NOT_FOUND', '요청을 찾을 수 없습니다.', 404);

  // 요청자에게 알림
  await supabaseAdmin.from('notifications').insert({
    user_id: data.requested_by,
    type: 'REQUEST_APPROVED',
    title: '인물 추가 요청이 승인되었습니다',
    body: `"${data.name_ko}" 인물이 곧 등록됩니다.`,
    link: null,
  });

  return apiSuccess(data);
}
