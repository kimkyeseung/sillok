import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { replyCreateLimiter } from '@/lib/rate-limit';

// ─── GET /api/threads/:id/replies — List replies (public) ───

const ListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { searchParams } = new URL(request.url);
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { limit, cursor } = parsed.data;

  let query = supabaseAdmin
    .from('thread_replies')
    .select(
      `
      id, content, depth, like_count, parent_id,
      created_at, updated_at, is_deleted,
      author_id,
      profiles!thread_replies_author_id_fkey ( nickname, avatar_url )
    `
    )
    .eq('thread_id', params.id)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true });

  if (cursor) query = query.gt('created_at', cursor);
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

// ─── POST /api/threads/:id/replies — Create reply [USER] ───

const CreateReplySchema = z.object({
  parent_id: z.string().uuid().optional(),
  content: z.string().min(1).max(5000),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  const { success } = await replyCreateLimiter.check(user.id);
  if (!success)
    return apiError('RATE_LIMIT_EXCEEDED', 'Too many replies. Please try again later.', 429);

  // Check thread exists
  const { data: thread } = await supabaseAdmin
    .from('threads')
    .select('id')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single();

  if (!thread)
    return apiError('THREAD_NOT_FOUND', 'Thread not found.', 404);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = CreateReplySchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  // depth is auto-calculated by trigger (calc_reply_depth)
  const { data: reply, error } = await supabaseAdmin
    .from('thread_replies')
    .insert({
      thread_id: params.id,
      author_id: user.id,
      parent_id: result.data.parent_id ?? null,
      content: result.data.content,
    })
    .select()
    .single();

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess(reply);
}
