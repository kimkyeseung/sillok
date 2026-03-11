import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser, requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { personRequestLimiter } from '@/lib/rate-limit';

// ─── POST /api/person-requests — 인물 추가 요청 [USER] ───

const PersonRequestSchema = z.object({
  name_ko: z.string().min(1).max(100),
  name_hanja: z.string().max(100).optional(),
  reason: z.string().min(10).max(2000),
});

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

  const { success } = await personRequestLimiter.check(user.id);
  if (!success)
    return apiError('RATE_LIMIT_EXCEEDED', '요청이 너무 많습니다.', 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', '유효한 JSON이 아닙니다.', 422);
  }

  const result = PersonRequestSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  const { data, error } = await supabaseAdmin
    .from('person_requests')
    .insert({
      ...result.data,
      requested_by: user.id,
      status: 'PENDING',
    })
    .select()
    .single();

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess(data);
}

// ─── GET /api/person-requests — 인물 추가 요청 목록 [ADMIN] ───

const ListQuerySchema = z.object({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  const { searchParams } = new URL(request.url);
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  const { status, limit, cursor } = parsed.data;

  let query = supabaseAdmin
    .from('person_requests')
    .select(
      `
      id, name_ko, name_hanja, reason, status, created_at,
      requested_by,
      profiles!person_requests_requested_by_fkey ( nickname, avatar_url )
    `
    )
    .order('created_at', { ascending: false });

  if (status) query = query.eq('status', status);
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
