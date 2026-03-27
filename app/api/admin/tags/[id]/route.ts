import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/admin/tags/:id — Update tag [ADMIN] ───

const UpdateTagSchema = z.object({
  name_ko: z.string().min(1).max(50).optional(),
  name_en: z.string().max(50).optional(),
  type: z.enum(['ERA', 'FIELD', 'CUSTOM']).optional(),
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

  const result = UpdateTagSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { data, error } = await supabaseAdmin
    .from('tags')
    .update(result.data)
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505')
      return apiError('VALIDATION_ERROR', 'Tag already exists.', 409);
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
  }

  return apiSuccess(data);
}

// ─── DELETE /api/admin/tags/:id — Delete tag [ADMIN] ───

export async function DELETE(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(_request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { error } = await supabaseAdmin
    .from('tags')
    .delete()
    .eq('id', params.id);

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({ deleted: true });
}
