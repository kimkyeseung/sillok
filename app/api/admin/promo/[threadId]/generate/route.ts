import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { AiError } from '@/lib/claude';
import { generatePromo } from '@/lib/promo-ai';
import { loadPromoPosts, loadPromoThread } from '@/lib/promo-data';

const IdSchema = z.string().uuid();

export const maxDuration = 60;

// ─── POST /api/admin/promo/:threadId/generate — Write social copy with Claude [ADMIN] ───
// Replaces this thread's unposted drafts; posted rows are kept as history.

export async function POST(request: Request, { params }: { params: { threadId: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);
  if (!IdSchema.safeParse(params.threadId).success) return apiError('VALIDATION_ERROR', '스레드 ID가 올바르지 않습니다.', 422);

  const thread = await loadPromoThread(params.threadId);
  if (!thread || thread.is_deleted) return apiError('THREAD_NOT_FOUND', '스레드를 찾을 수 없습니다.', 404);

  let generated;
  try {
    generated = await generatePromo(thread);
  } catch (err) {
    if (err instanceof AiError) {
      if (err.code === 'NOT_CONFIGURED')
        return apiError('AI_NOT_CONFIGURED', '서버에 ANTHROPIC_API_KEY가 설정되지 않았습니다.', 503);
      if (err.code === 'REFUSED') return apiError('AI_REFUSED', 'AI가 요청을 거절했습니다.', 422);
      return apiError('AI_ERROR', err.message, 502);
    }
    console.error('[promo/generate]', err);
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);
  }

  const { error: delError } = await supabaseAdmin
    .from('promo_posts')
    .update({ is_deleted: true })
    .eq('thread_id', thread.id)
    .eq('status', 'draft')
    .eq('is_deleted', false);
  if (delError) return apiError('SERVER_ERROR', '초안을 교체하지 못했습니다 (promo_posts 마이그레이션을 실행했는지 확인하세요).', 500);

  const { error } = await supabaseAdmin
    .from('promo_posts')
    .insert(generated.map((g) => ({ ...g, thread_id: thread.id, is_ai_generated: true, created_by: admin.id })));
  if (error) return apiError('SERVER_ERROR', '저장 중 오류가 발생했습니다.', 500);

  return apiSuccess({ posts: await loadPromoPosts(thread.id) });
}
