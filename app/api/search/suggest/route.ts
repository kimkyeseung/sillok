import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { searchLimiter } from '@/lib/rate-limit';

// ─── GET /api/search/suggest — Autocomplete suggestions (public) ───

const SuggestSchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(10).default(5),
});

export async function GET(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success } = await searchLimiter.check(ip);
  if (!success)
    return apiError('RATE_LIMIT_EXCEEDED', 'Too many requests.', 429);

  const { searchParams } = new URL(request.url);
  const parsed = SuggestSchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { q, limit } = parsed.data;

  const { data: persons } = await supabaseAdmin
    .from('persons')
    .select('id, slug, name_en, thumbnail')
    .eq('is_deleted', false)
    .or(`name_en.ilike.%${q}%,name_ko.ilike.%${q}%`)
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
