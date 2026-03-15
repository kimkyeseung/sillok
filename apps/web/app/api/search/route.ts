import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { searchLimiter } from '@/lib/rate-limit';

// ─── GET /api/search — Unified search (public) ───

const SearchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  type: z.enum(['person', 'node', 'thread', 'all']).default('all'),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export async function GET(request: Request) {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const { success } = await searchLimiter.check(ip);
  if (!success)
    return apiError('RATE_LIMIT_EXCEEDED', 'Too many requests.', 429);

  const { searchParams } = new URL(request.url);
  const parsed = SearchQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { q, type, limit } = parsed.data;
  const results: Record<string, unknown[]> = {};

  if (type === 'all' || type === 'person') {
    const { data } = await supabaseAdmin
      .from('persons')
      .select('id, slug, name_en, name_hanja, birth_year, death_year, thumbnail')
      .eq('is_deleted', false)
      .or(`name_en.ilike.%${q}%,name_ko.ilike.%${q}%,name_hanja.ilike.%${q}%`)
      .limit(limit);
    results.persons = data ?? [];
  }

  if (type === 'all' || type === 'node') {
    const { data } = await supabaseAdmin
      .from('nodes')
      .select('id, slug, node_type, title, thumbnail')
      .eq('is_deleted', false)
      .eq('is_published', true)
      .ilike('title', `%${q}%`)
      .limit(limit);
    results.nodes = data ?? [];
  }

  if (type === 'all' || type === 'thread') {
    const { data } = await supabaseAdmin
      .from('threads')
      .select('id, title, person_id, created_at, author_id')
      .eq('is_deleted', false)
      .ilike('title', `%${q}%`)
      .order('created_at', { ascending: false })
      .limit(limit);
    results.threads = data ?? [];
  }

  return apiSuccess(results);
}
