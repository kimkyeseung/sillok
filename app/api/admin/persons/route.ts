import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/admin/persons — Person list (admin, including unpublished) ───

const ListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(1).default(1),
  q: z.string().optional(),
  missing_year: z.enum(['true', 'false']).optional(),
});

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { searchParams } = new URL(request.url);
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { limit, page, q, missing_year } = parsed.data;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('persons')
    .select(
      `
      id, slug, name_ko, name_hanja, name_en,
      birth_year, death_year, summary, thumbnail,
      is_published, is_controversial, is_alive,
      view_count, follow_count, created_at,
      person_node_links ( nodes ( id, title, node_type ) )
    `,
      { count: 'exact' }
    )
    .eq('is_deleted', false);

  if (q) {
    query = query.or(
      `name_ko.ilike.%${q}%,name_hanja.ilike.%${q}%,name_en.ilike.%${q}%`
    );
  }

  if (missing_year === 'true') {
    query = query.or('birth_year.is.null,death_year.is.null');
  }

  query = query
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, count, error } = await query;
  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  const total = count ?? 0;
  const totalPages = Math.ceil(total / limit);

  return apiSuccess({
    items: data ?? [],
    pagination: { page, limit, total, total_pages: totalPages },
  });
}
