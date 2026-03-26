import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generalLimiter } from '@/lib/rate-limit';

// ─── POST /api/replies/:id/like — Toggle reply like [USER] ───

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  const { success } = await generalLimiter.check(user.id);
  if (!success)
    return apiError('RATE_LIMIT_EXCEEDED', 'Too many requests. Please try again later.', 429);

  const { data: reply } = await supabaseAdmin
    .from('thread_replies')
    .select('id, like_count')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single();

  if (!reply)
    return apiError('THREAD_NOT_FOUND', 'Reply not found.', 404);

  const { data: existing } = await supabaseAdmin
    .from('likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', 'reply')
    .eq('target_id', params.id)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from('likes').delete().eq('id', existing.id);
    return apiSuccess({
      liked: false,
      like_count: Math.max((reply.like_count ?? 0) - 1, 0),
    });
  } else {
    await supabaseAdmin.from('likes').insert({
      user_id: user.id,
      target_type: 'reply',
      target_id: params.id,
    });
    return apiSuccess({
      liked: true,
      like_count: (reply.like_count ?? 0) + 1,
    });
  }
}
