import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── POST /api/view-logs — 조회 로그 기록 (공개, IP 기반 중복 방지) ───

const ViewLogSchema = z.object({
  target_type: z.enum(['PERSON', 'NODE', 'THREAD']),
  target_id: z.string().uuid(),
});

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', '유효한 JSON이 아닙니다.', 422);
  }

  const result = ViewLogSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  const { target_type, target_id } = result.data;
  const viewerIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // 24시간 내 동일 IP 중복 방지
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabaseAdmin
    .from('view_logs')
    .select('id')
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .eq('viewer_ip', viewerIp)
    .gte('viewed_at', oneDayAgo)
    .maybeSingle();

  if (existing) return apiSuccess({ logged: false });

  await supabaseAdmin.from('view_logs').insert({
    target_type,
    target_id,
    viewer_ip: viewerIp,
  });

  return apiSuccess({ logged: true });
}
