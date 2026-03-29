import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/nodes — Node list (public) ───

const ListQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  type: z.enum(['ARTIFACT', 'MEDIA', 'EVENT', 'GROUP']).optional(),
  q: z.string().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = ListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { limit, cursor, type, q } = parsed.data;

  let query = supabaseAdmin
    .from('nodes')
    .select(`id, slug, node_type, title, description, thumbnail, metadata, view_count, follow_count, created_at,
       person_node_links ( persons:person_id ( id, slug, name_ko, name_en, thumbnail ) )`)
    .eq('is_deleted', false)
    .eq('is_published', true)
    .order('created_at', { ascending: false });

  if (type) query = query.eq('node_type', type);
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

// ─── POST /api/nodes — Create node [ADMIN] ───

const CreateNodeSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/),
  node_type: z.enum(['ARTIFACT', 'MEDIA', 'EVENT', 'GROUP']),
  title: z.string().min(1).max(300),
  description: z.string().max(10000).optional(),
  thumbnail: z.string().url().optional(),
  metadata: z.record(z.unknown()).optional(),
  is_published: z.boolean().default(false),
  person_ids: z.array(z.string().uuid()).optional(),
});

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = CreateNodeSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422, result.error.issues);

  const { person_ids, ...nodeData } = result.data;

  const { data: node, error } = await supabaseAdmin
    .from('nodes')
    .insert(nodeData)
    .select()
    .single();

  if (error) {
    if (error.code === '23505')
      return apiError('VALIDATION_ERROR', 'Slug already exists.', 409);
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
  }

  if (person_ids && person_ids.length > 0) {
    const links = person_ids.map((pid) => ({
      person_id: pid,
      node_id: node.id,
    }));
    await supabaseAdmin.from('person_node_links').insert(links);
  }

  return apiSuccess(node);
}
