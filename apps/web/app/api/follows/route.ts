import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── POST /api/follows — 팔로우 토글 [USER] ───

const FollowSchema = z.object({
  target_type: z.enum(['person', 'node']),
  target_id: z.string().uuid(),
});

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', '유효한 JSON이 아닙니다.', 422);
  }

  const result = FollowSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  const { target_type, target_id } = result.data;

  // 대상 존재 확인
  if (target_type === 'person') {
    const { data } = await supabaseAdmin
      .from('persons')
      .select('id')
      .eq('id', target_id)
      .eq('is_deleted', false)
      .single();
    if (!data)
      return apiError('PERSON_NOT_FOUND', '인물을 찾을 수 없습니다.', 404);
  } else {
    const { data } = await supabaseAdmin
      .from('nodes')
      .select('id')
      .eq('id', target_id)
      .eq('is_deleted', false)
      .single();
    if (!data)
      return apiError('NODE_NOT_FOUND', '노드를 찾을 수 없습니다.', 404);
  }

  const { data: existing } = await supabaseAdmin
    .from('follows')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from('follows').delete().eq('id', existing.id);
    return apiSuccess({ followed: false });
  } else {
    await supabaseAdmin.from('follows').insert({
      user_id: user.id,
      target_type,
      target_id,
    });
    return apiSuccess({ followed: true });
  }
}
