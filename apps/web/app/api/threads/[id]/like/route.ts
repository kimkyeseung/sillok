import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── POST /api/threads/:id/like — 좋아요 토글 [USER] ───

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

  // 스레드 존재 확인
  const { data: thread } = await supabaseAdmin
    .from('threads')
    .select('id, like_count')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single();

  if (!thread)
    return apiError('THREAD_NOT_FOUND', '스레드를 찾을 수 없습니다.', 404);

  // 기존 좋아요 확인
  const { data: existing } = await supabaseAdmin
    .from('likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', 'thread')
    .eq('target_id', params.id)
    .maybeSingle();

  if (existing) {
    // 좋아요 취소
    await supabaseAdmin.from('likes').delete().eq('id', existing.id);

    return apiSuccess({
      liked: false,
      like_count: Math.max((thread.like_count ?? 0) - 1, 0),
    });
  } else {
    // 좋아요 추가
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
