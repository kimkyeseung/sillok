import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/admin/nodes — List non-GROUP nodes (admin, includes unpublished) ───

const ListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  page: z.coerce.number().min(1).default(1),
  type: z.enum(['ARTIFACT', 'MEDIA', 'EVENT']).optional(),
  q: z.string().optional(),
});

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { searchParams } = new URL(request.url);
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { limit, page, type, q } = parsed.data;
  const offset = (page - 1) * limit;

  let query = supabaseAdmin
    .from('nodes')
    .select(
      `id, slug, node_type, title, description, thumbnail, metadata, is_published, is_deleted, view_count, follow_count, created_at,
       person_node_links ( person_id, persons:person_id ( id, name_ko, name_en, slug ) )`,
      { count: 'exact' }
    )
    .in('node_type', type ? [type] : ['ARTIFACT', 'MEDIA', 'EVENT'])
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (q) query = query.ilike('title', `%${q}%`);
  query = query.range(offset, offset + limit - 1);

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
