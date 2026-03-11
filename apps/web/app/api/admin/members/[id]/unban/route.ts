import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/admin/members/:id/unban — 회원 정지 해제 [ADMIN] ───

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_banned: false, banned_until: null })
    .eq('id', params.id);

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  await supabaseAdmin.from('warning_logs').insert({
    user_id: params.id,
    admin_id: admin.id,
    action: 'UNBAN',
    reason: '정지 해제',
  });

  return apiSuccess({ unbanned: true });
}
