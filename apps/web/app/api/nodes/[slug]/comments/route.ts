import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/nodes/:slug/comments — Node comment list (public) ───

const ListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { searchParams } = new URL(request.url);
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { data: node } = await supabaseAdmin
    .from('nodes')
    .select('id')
    .eq('slug', params.slug)
    .eq('is_deleted', false)
    .single();

  if (!node)
    return apiError('NODE_NOT_FOUND', 'Node not found.', 404);

  const { limit, cursor } = parsed.data;

  let query = supabaseAdmin
    .from('node_comments')
    .select(
      `
      id, content, like_count, created_at, updated_at,
      author_id,
      profiles!node_comments_author_id_fkey ( nickname, avatar_url )
    `
    )
    .eq('node_id', node.id)
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

// ─── POST /api/nodes/:slug/comments — Create node comment [USER] ───

const CreateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  const { data: node } = await supabaseAdmin
    .from('nodes')
    .select('id')
    .eq('slug', params.slug)
    .eq('is_deleted', false)
    .single();

  if (!node)
    return apiError('NODE_NOT_FOUND', 'Node not found.', 404);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = CreateCommentSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { data: comment, error } = await supabaseAdmin
    .from('node_comments')
    .insert({
      node_id: node.id,
      author_id: user.id,
      content: result.data.content,
    })
    .select()
    .single();

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess(comment);
}
