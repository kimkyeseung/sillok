import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/threads/:id/replies — 댓글 목록 (공개) ───

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
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

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
    .order('created_at', { ascending: true });

  if (cursor) query = query.gt('created_at', cursor);
  query = query.limit(limit + 1);

  const { data, error } = await query;
  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  const hasNext = (data?.length ?? 0) > limit;
  const items = hasNext ? data!.slice(0, limit) : (data ?? []);
  const lastItem = items[items.length - 1];

  return apiSuccess({
    items,
    has_next: hasNext,
    next_cursor: hasNext && lastItem ? lastItem.created_at : null,
  });
}

// ─── POST /api/threads/:id/replies — 댓글 작성 [USER] ───

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
    return apiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

  // 스레드 존재 확인
  const { data: thread } = await supabaseAdmin
    .from('threads')
    .select('id')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single();

  if (!thread)
    return apiError('THREAD_NOT_FOUND', '스레드를 찾을 수 없습니다.', 404);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', '유효한 JSON이 아닙니다.', 422);
  }

  const result = CreateReplySchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  // depth는 트리거(calc_reply_depth)에서 자동 계산
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
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess(reply);
}
