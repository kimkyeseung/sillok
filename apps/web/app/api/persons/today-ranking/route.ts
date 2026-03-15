import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/persons/today-ranking — Person of the day ranking (public) ───

const QuerySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  limit: z.coerce.number().min(1).max(20).default(10),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const today = parsed.data.date ?? new Date().toISOString().split('T')[0];
  const limit = parsed.data.limit;

  // Aggregate today votes by person_id
  const { data: votes, error } = await supabaseAdmin
    .from('person_of_day_votes')
    .select('person_id')
    .eq('vote_date', today);

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  // Vote aggregation
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
