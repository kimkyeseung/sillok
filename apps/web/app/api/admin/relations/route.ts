import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/admin/relations — 관계 제안 목록 [ADMIN] ───

const QuerySchema = z.object({
  status: z.enum(['pending', 'approved', 'all']).default('pending'),
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  const { status, limit, cursor } = parsed.data;

  let query = supabaseAdmin
    .from('person_relations')
    .select(
      `id, person_a_id, person_b_id, relation_type, description, is_approved, created_at, suggested_by`
    )
    .order('created_at', { ascending: false });

  if (status === 'pending') query = query.eq('is_approved', false);
  else if (status === 'approved') query = query.eq('is_approved', true);

  if (cursor) query = query.lt('created_at', cursor);
  query = query.limit(limit + 1);

  const { data, error } = await query;
  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  const hasNext = (data?.length ?? 0) > limit;
  const items = hasNext ? data!.slice(0, limit) : (data ?? []);

  // Enrich with person names
  const personIds = new Set<string>();
  items.forEach((r) => {
    personIds.add(r.person_a_id);
    personIds.add(r.person_b_id);
  });

  let personMap: Record<string, { name_ko: string; slug: string }> = {};
  if (personIds.size > 0) {
    const { data: persons } = await supabaseAdmin
      .from('persons')
      .select('id, name_ko, slug')
      .in('id', Array.from(personIds));

    personMap = Object.fromEntries(
      (persons ?? []).map((p) => [p.id, { name_ko: p.name_ko, slug: p.slug }])
    );
  }

  const enriched = items.map((r) => ({
    ...r,
    person_a: personMap[r.person_a_id] ?? null,
    person_b: personMap[r.person_b_id] ?? null,
  }));

  const lastItem = items[items.length - 1];
  return apiSuccess({
    items: enriched,
    has_next: hasNext,
    next_cursor: hasNext && lastItem ? lastItem.created_at : null,
  });
}
