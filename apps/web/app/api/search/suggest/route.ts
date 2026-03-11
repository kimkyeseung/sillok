import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { searchLimiter } from '@/lib/rate-limit';

// ─── GET /api/search/suggest — 자동완성 제안 (공개) ───

const SuggestSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(10).default(5),
});

export async function GET(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success } = await searchLimiter.check(ip);
  if (!success)
    return apiError('RATE_LIMIT_EXCEEDED', '요청이 너무 많습니다.', 429);

  const { searchParams } = new URL(request.url);
  const parsed = SuggestSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  const { q, limit } = parsed.data;

  const { data: persons } = await supabaseAdmin
    .from('persons')
    .select('id, slug, name_ko, thumbnail')
    .eq('is_deleted', false)
    .ilike('name_ko', `%${q}%`)
    .limit(limit);

  const { data: nodes } = await supabaseAdmin
    .from('nodes')
    .select('id, slug, node_type, title')
    .eq('is_deleted', false)
    .eq('is_published', true)
    .ilike('title', `%${q}%`)
    .limit(limit);

  return apiSuccess({
    persons: persons ?? [],
    nodes: nodes ?? [],
  });
}
