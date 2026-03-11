import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/admin/members/:id/ban — 회원 정지 [ADMIN] ───

const BanSchema = z.object({
  duration_hours: z.number().min(1).max(8760).optional(), // 최대 365일
  reason: z.string().min(1).max(500),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', '유효한 JSON이 아닙니다.', 422);
  }

  const result = BanSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  const { duration_hours, reason } = result.data;

  const bannedUntil = duration_hours
    ? new Date(Date.now() + duration_hours * 60 * 60 * 1000).toISOString()
    : null; // null = 영구 정지

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ is_banned: true, banned_until: bannedUntil })
    .eq('id', params.id);

  if (updateError)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  // 경고 이력 기록
  await supabaseAdmin.from('warning_logs').insert({
    user_id: params.id,
    admin_id: admin.id,
    action: 'BAN',
    reason,
    detail: bannedUntil
      ? `${duration_hours}시간 정지`
      : '영구 정지',
  });

  return apiSuccess({ banned: true, banned_until: bannedUntil });
}
