import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PromoPostCreateSchema, findSubreddit } from '@/lib/promo';
import { PROMO_POST_COLUMNS } from '@/lib/promo-data';

const IdSchema = z.string().uuid();

// ─── POST /api/admin/promo/:threadId/posts — Add an empty draft to write by hand [ADMIN] ───

export async function POST(request: Request, { params }: { params: { threadId: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);
  if (!IdSchema.safeParse(params.threadId).success) return apiError('VALIDATION_ERROR', '스레드 ID가 올바르지 않습니다.', 422);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'JSON 형식이 올바르지 않습니다.', 422);
  }
  const parsed = PromoPostCreateSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION_ERROR', '입력값을 확인해 주세요.', 422, parsed.error.issues);
  const { platform, target } = parsed.data;

  const { data: thread } = await supabaseAdmin.from('threads').select('id').eq('id', params.threadId).eq('is_deleted', false).maybeSingle();
  if (!thread) return apiError('THREAD_NOT_FOUND', '스레드를 찾을 수 없습니다.', 404);

  const { data, error } = await supabaseAdmin
    .from('promo_posts')
    .insert({
      thread_id: params.threadId,
      platform,
      // Known subreddits keep their canonical casing; others are stored as typed (without "r/")
      target: platform === 'reddit' ? findSubreddit(target)?.name ?? target?.replace(/^r\//i, '') ?? null : null,
      created_by: admin.id,
    })
    .select(PROMO_POST_COLUMNS)
    .single();
  if (error) return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);
  return apiSuccess(data);
}
