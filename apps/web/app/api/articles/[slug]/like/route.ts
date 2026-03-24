import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── POST /api/articles/:slug/like — Toggle like [USER] ───

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  // Check article exists
  const { data: article } = await supabaseAdmin
    .from('articles')
    .select('id, like_count')
    .eq('slug', params.slug)
    .eq('is_published', true)
    .single();

  if (!article)
    return apiError('ARTICLE_NOT_FOUND', 'Article not found.', 404);

  // Check existing like
  const { data: existing } = await supabaseAdmin
    .from('likes')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', 'article')
    .eq('target_id', article.id)
    .maybeSingle();

  if (existing) {
    // Remove like
    await supabaseAdmin.from('likes').delete().eq('id', existing.id);

    return apiSuccess({
      liked: false,
      like_count: Math.max((article.like_count ?? 0) - 1, 0),
    });
  } else {
    // Add like
    await supabaseAdmin.from('likes').insert({
      user_id: user.id,
      target_type: 'article',
      target_id: article.id,
    });

    return apiSuccess({
      liked: true,
      like_count: (article.like_count ?? 0) + 1,
    });
  }
}
