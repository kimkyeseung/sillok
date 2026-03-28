import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generalLimiter } from '@/lib/rate-limit';
import { createNotification, getUserNickname } from '@/lib/notifications';

// ─── POST /api/threads/:id/like — Toggle like [USER] ───

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

  // Check thread exists
  const { data: thread } = await supabaseAdmin
    .from('threads')
    .select('id, like_count, author_id, title, person_id, persons!threads_person_id_fkey ( slug )')
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

    // Notify thread author (fire-and-forget)
    if (thread.author_id && thread.author_id !== user.id) {
      const personSlug = (thread as Record<string, unknown>).persons
        ? ((thread as Record<string, unknown>).persons as Record<string, string>).slug
        : '';
      getUserNickname(user.id).then((nickname) => {
        createNotification({
          userId: thread.author_id,
          type: 'THREAD_LIKED',
          title: `${nickname} liked your thread`,
          body: thread.title,
          link: personSlug ? `/persons/${personSlug}?thread=${params.id}` : undefined,
          sourceId: params.id,
        });
      });
    }

    return apiSuccess({
      liked: true,
      like_count: (thread.like_count ?? 0) + 1,
    });
  }
}
