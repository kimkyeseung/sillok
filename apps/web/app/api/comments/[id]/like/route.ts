import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── POST /api/comments/:id/like — Toggle node comment like [USER] ───

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  const { data: comment } = await supabaseAdmin
    .from('node_comments')
    .select('id, like_count')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single();

  if (!comment)
    return apiError('NODE_NOT_FOUND', 'Reply not found.', 404);

  const { data: existing } = await supabaseAdmin
    .from('likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', 'node_comment')
    .eq('target_id', params.id)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from('likes').delete().eq('id', existing.id);
    return apiSuccess({
      liked: false,
      like_count: Math.max((comment.like_count ?? 0) - 1, 0),
    });
  } else {
    await supabaseAdmin.from('likes').insert({
      user_id: user.id,
      target_type: 'node_comment',
      target_id: params.id,
    });
    return apiSuccess({
      liked: true,
      like_count: (comment.like_count ?? 0) + 1,
    });
  }
}
