import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/nodes/:slug — Node detail (public) ───

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const { data: node, error } = await supabaseAdmin
    .from('nodes')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_deleted', false)
    .single();

  if (error || !node)
    return apiError('NODE_NOT_FOUND', 'Node not found.', 404);

  return apiSuccess(node);
}

// ─── PUT /api/nodes/:slug — Update node [ADMIN] ───

const UpdateNodeSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(10000).optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  is_published: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = UpdateNodeSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { data: updated, error } = await supabaseAdmin
    .from('nodes')
    .update(result.data)
    .eq('slug', params.slug)
    .eq('is_deleted', false)
    .select()
    .single();

  if (error || !updated)
    return apiError('NODE_NOT_FOUND', 'Node not found.', 404);

  return apiSuccess(updated);
}

// ─── DELETE /api/nodes/:slug — Node soft delete [ADMIN] ───

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { error } = await supabaseAdmin
    .from('nodes')
    .update({ is_deleted: true })
    .eq('slug', params.slug)
    .eq('is_deleted', false);

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({ deleted: true });
}
