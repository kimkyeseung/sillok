import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/persons/today-ranking — 오늘의 인물 투표 랭킹 (공개) ───

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().min(1).max(20).default(10),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  const today = parsed.data.date ?? new Date().toISOString().split('T')[0];
  const limit = parsed.data.limit;

  // 오늘 날짜 투표를 person_id 별로 집계
  const { data: votes, error } = await supabaseAdmin
    .from('person_of_day_votes')
    .select('person_id')
    .eq('vote_date', today);

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  // 투표 집계
  const countMap = new Map<string, number>();
  (votes ?? []).forEach((v) => {
    countMap.set(v.person_id, (countMap.get(v.person_id) ?? 0) + 1);
  });

  const sorted = Array.from(countMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);

  if (sorted.length === 0)
    return apiSuccess({ date: today, items: [] });

  const personIds = sorted.map(([id]) => id);
  const { data: persons } = await supabaseAdmin
    .from('persons')
    .select('id, slug, name_ko, thumbnail')
    .in('id', personIds)
    .eq('is_deleted', false);

  const personMap = new Map(
    (persons ?? []).map((p) => [p.id, p])
  );

  const items = sorted
    .map(([id, count]) => ({
      person: personMap.get(id) ?? null,
      vote_count: count,
    }))
    .filter((item) => item.person !== null);

  return apiSuccess({ date: today, items });
}
