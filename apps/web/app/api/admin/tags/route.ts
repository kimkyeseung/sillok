import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/admin/tags — 전체 태그 목록 [ADMIN] ───

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  const { data, error } = await supabaseAdmin
    .from('tags')
    .select('id, name, type')
    .order('type')
    .order('name');

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess(data ?? []);
}
