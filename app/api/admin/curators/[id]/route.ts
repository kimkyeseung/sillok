import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/admin/curators/:id — Update curator role [ADMIN] ───

const UpdateCuratorSchema = z.object({
  is_active: z.boolean().optional(),
  role_type: z.enum(['era', 'field', 'global']).optional(),
  role_value: z.string().min(1).max(100).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
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

  const result = UpdateCuratorSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { data, error } = await supabaseAdmin
    .from('curator_roles')
    .update(result.data)
    .eq('id', params.id)
    .select()
    .single();

  if (error || !data)
    return apiError('NODE_NOT_FOUND', 'Curator role not found.', 404);

  return apiSuccess(data);
}

// ─── DELETE /api/admin/curators/:id — Remove curator role [ADMIN] ───

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { error } = await supabaseAdmin
    .from('curator_roles')
    .delete()
    .eq('id', params.id);

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({ deleted: true });
}
