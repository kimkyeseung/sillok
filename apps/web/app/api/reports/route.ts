import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { reportLimiter } from '@/lib/rate-limit';

// ─── POST /api/reports — 신고 [USER] ───

const ReportSchema = z.object({
  target_type: z.enum(['thread', 'reply', 'node_comment']),
  target_id: z.string().uuid(),
  reason: z.enum([
    'SPAM',
    'ABUSE',
    'HATE_SPEECH',
    'MISINFORMATION',
    'OFF_TOPIC',
    'OTHER',
  ]),
  detail: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

  const { success } = await reportLimiter.check(user.id);
  if (!success)
    return apiError('RATE_LIMIT_EXCEEDED', '요청이 너무 많습니다.', 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', '유효한 JSON이 아닙니다.', 422);
  }

  const result = ReportSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  const { target_type, target_id, reason, detail } = result.data;

  // 중복 신고 확인
  const { data: existing } = await supabaseAdmin
    .from('reports')
    .select('id')
    .eq('reporter_id', user.id)
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .maybeSingle();

  if (existing)
    return apiError('ALREADY_REPORTED', '이미 신고한 항목입니다.', 409);

  const { data, error } = await supabaseAdmin
    .from('reports')
    .insert({
      reporter_id: user.id,
      target_type,
      target_id,
      reason,
      detail,
      status: 'PENDING',
    })
    .select()
    .single();

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess(data);
}
