import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/collections — 공개 컬렉션 목록 (공개) ───

const ListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  const { limit, cursor } = parsed.data;

  let query = supabaseAdmin
    .from('collections')
    .select(
      `
      id, title, description, is_public, item_count, created_at,
      user_id,
      profiles!collections_user_id_fkey ( nickname, avatar_url )
    `
    )
    .eq('is_public', true)
    .order('created_at', { ascending: false });

  if (cursor) query = query.lt('created_at', cursor);
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

// ─── POST /api/collections — 컬렉션 생성 [USER] ───

const CreateSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  is_public: z.boolean().default(false),
});

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', '유효한 JSON이 아닙니다.', 422);
  }

  const result = CreateSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  const { data, error } = await supabaseAdmin
    .from('collections')
    .insert({ ...result.data, user_id: user.id })
    .select()
    .single();

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess(data);
}
