import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/reports/:id/resolve — 신고 처리 [ADMIN] ───

const ResolveSchema = z.object({
  action: z.enum(['warn', 'delete', 'ban']),
  ban_duration: z.number().min(1).max(8760).optional(),
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

  const result = ResolveSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  const { data: report, error: fetchError } = await supabaseAdmin
    .from('reports')
    .select('*')
    .eq('id', params.id)
    .eq('status', 'PENDING')
    .single();

  if (fetchError || !report)
    return apiError('NODE_NOT_FOUND', '신고를 찾을 수 없습니다.', 404);

  const { action, ban_duration } = result.data;

  // 신고 대상 콘텐츠 soft delete
  if (action === 'delete' || action === 'ban') {
    const tableMap: Record<string, string> = {
      thread: 'threads',
      reply: 'thread_replies',
      node_comment: 'node_comments',
    };
    const table = tableMap[report.target_type];
    if (table) {
      await supabaseAdmin
        .from(table)
        .update({ is_deleted: true })
        .eq('id', report.target_id);
    }
  }

  // 신고 상태 업데이트
  const { error: updateError } = await supabaseAdmin
    .from('reports')
    .update({ status: 'RESOLVED', resolved_action: action })
    .eq('id', params.id);

  if (updateError)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess({ resolved: true, action });
}
