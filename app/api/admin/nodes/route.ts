import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/admin/nodes — List non-GROUP nodes (admin, includes unpublished) ───

const ListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
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

  const { limit, cursor, type, q } = parsed.data;

  let query = supabaseAdmin
    .from('nodes')
    .select('id, slug, node_type, title, description, thumbnail, metadata, is_published, is_deleted, view_count, follow_count, created_at')
    .in('node_type', type ? [type] : ['ARTIFACT', 'MEDIA', 'EVENT'])
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (q) query = query.ilike('title', `%${q}%`);
  if (cursor) query = query.lt('created_at', cursor);
  query = query.limit(limit + 1);

  const { data, error } = await query;
  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  const hasNext = (data?.length ?? 0) > limit;
  const items = hasNext ? data!.slice(0, limit) : (data ?? []);
  const lastItem = items[items.length - 1];

  return apiSuccess({
    items,
    has_next: hasNext,
    next_cursor: hasNext && lastItem ? lastItem.created_at : null,
  });
}
