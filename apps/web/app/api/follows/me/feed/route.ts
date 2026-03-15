import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/follows/me/feed — Follow feed (threads of followed persons) [USER] ───

const QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { limit, cursor } = parsed.data;

  // Get followed person IDs
  const { data: follows } = await supabaseAdmin
    .from('follows')
    .select('target_id')
    .eq('user_id', user.id)
    .eq('target_type', 'person');

  if (!follows || follows.length === 0)
    return apiSuccess({ items: [], has_next: false, next_cursor: null });

  const personIds = follows.map((f) => f.target_id);

  let query = supabaseAdmin
    .from('threads')
    .select(
      `
      id, person_id, title, content, video_url, like_count, reply_count, view_count,
      is_pinned, created_at, updated_at, author_id,
      profiles!threads_author_id_fkey ( nickname, avatar_url ),
      persons!threads_person_id_fkey ( slug, name_ko )
    `
    )
    .in('person_id', personIds)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (cursor) query = query.lt('created_at', cursor);
  query = query.limit(limit + 1);

  const { data, error } = await query;
  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  const hasNext = (data?.length ?? 0) > limit;
  const items = hasNext ? data!.slice(0, limit) : (data ?? []);
  const lastItem = items[items.length - 1];

  return apiSuccess({
    items,
    has_next: hasNext,
    next_cursor: hasNext && lastItem ? lastItem.created_at : null,
  });
}
