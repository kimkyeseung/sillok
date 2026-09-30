import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PromoListSchema, parseScoreCursor } from '@/lib/promo';
import { loadPostedSummary } from '@/lib/promo-data';

// ─── GET /api/admin/promo — Promotion candidates: threads by engagement [ADMIN] ───
// Ordered by top_score (likes + replies), then id; ?window=30|90|all days.

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  const { searchParams } = new URL(request.url);
  const parsed = PromoListSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) return apiError('VALIDATION_ERROR', '입력값을 확인해 주세요.', 422);
  const { window, cursor, limit } = parsed.data;

  let query = supabaseAdmin
    .from('threads')
    .select(
      `id, title, created_at, like_count, reply_count, view_count, top_score,
       thread_images ( url, sort_order ),
       persons!threads_person_id_fkey ( slug, name_en, name_ko )`,
    )
    .eq('is_deleted', false)
    .order('top_score', { ascending: false })
    .order('id', { ascending: false })
    .limit(limit + 1);
  if (window !== 'all') {
    query = query.gte('created_at', new Date(Date.now() - Number(window) * 86_400_000).toISOString());
  }
  if (cursor) {
    const c = parseScoreCursor(cursor);
    if (!c) return apiError('VALIDATION_ERROR', '커서 값이 올바르지 않습니다.', 422);
    query = query.or(`top_score.lt.${c.score},and(top_score.eq.${c.score},id.lt.${c.id})`);
  }

  const { data, error } = await query;
  if (error) return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  const rows = data ?? [];
  const has_next = rows.length > limit;
  const items = has_next ? rows.slice(0, limit) : rows;
  const posted = await loadPostedSummary(items.map((t) => t.id));
  const last = items[items.length - 1];

  return apiSuccess({
    items: items.map((t) => ({
      ...t,
      image: [...((t.thread_images as { url: string; sort_order: number }[] | null) ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]?.url ?? null,
      thread_images: undefined,
      posted: posted.get(t.id) ?? [],
    })),
    has_next,
    next_cursor: has_next && last ? `${last.top_score ?? 0}_${last.id}` : null,
  });
}
