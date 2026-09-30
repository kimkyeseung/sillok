import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { PROMO_PLATFORMS, buildUtmUrl } from '@/lib/promo';
import { loadPromoPosts, loadPromoThread } from '@/lib/promo-data';

const IdSchema = z.string().uuid();

// ─── GET /api/admin/promo/:threadId — Share kit: thread, drafts/posted copy, links [ADMIN] ───

export async function GET(request: Request, { params }: { params: { threadId: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);
  if (!IdSchema.safeParse(params.threadId).success) return apiError('VALIDATION_ERROR', '스레드 ID가 올바르지 않습니다.', 422);

  const thread = await loadPromoThread(params.threadId);
  if (!thread) return apiError('THREAD_NOT_FOUND', '스레드를 찾을 수 없습니다.', 404);

  let posts;
  try {
    posts = await loadPromoPosts(params.threadId);
  } catch (err) {
    console.error('[GET /api/admin/promo/:id]', err);
    return apiError('SERVER_ERROR', '게시물을 불러오지 못했습니다 (promo_posts 마이그레이션을 실행했는지 확인하세요).', 500);
  }

  return apiSuccess({
    thread,
    posts: posts.map((p) => ({ ...p, utm_url: buildUtmUrl(thread.id, p.platform, p.target) })),
    links: Object.fromEntries(PROMO_PLATFORMS.map((p) => [p, buildUtmUrl(thread.id, p)])),
  });
}
