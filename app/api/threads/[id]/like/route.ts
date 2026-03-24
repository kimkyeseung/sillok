import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── POST /api/threads/:id/like — Toggle like [USER] ───

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  // Check thread exists
  const { data: thread } = await supabaseAdmin
    .from('threads')
    .select('id, like_count')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single();

  if (!thread)
    return apiError('THREAD_NOT_FOUND', 'Thread not found.', 404);

  // Check existing like
  const { data: existing } = await supabaseAdmin
    .from('likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', 'thread')
    .eq('target_id', params.id)
    .maybeSingle();

  if (existing) {
    // Remove like
    await supabaseAdmin.from('likes').delete().eq('id', existing.id);

    return apiSuccess({
      liked: false,
      like_count: Math.max((thread.like_count ?? 0) - 1, 0),
    });
  } else {
    // Add like
    await supabaseAdmin.from('likes').insert({
      user_id: user.id,
      target_type: 'thread',
      target_id: params.id,
    });

    return apiSuccess({
      liked: true,
      like_count: (thread.like_count ?? 0) + 1,
    });
  }
}
