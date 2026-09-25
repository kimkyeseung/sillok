import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidateAgeFlow } from '@/lib/age-flow-data';
import { ReignSchema, findPersonId } from '@/lib/reigns';

// ─── PUT /api/admin/reigns/:id — Update reign [ADMIN] ───

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

  const result = ReignSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422, result.error.issues);

  const personId = await findPersonId(result.data.person_slug);
  if (!personId) return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  const { data, error } = await supabaseAdmin
    .from('reigns')
    .update({ person_id: personId, reign_start: result.data.reign_start, reign_end: result.data.reign_end })
    .eq('id', params.id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505')
      return apiError('VALIDATION_ERROR', 'This reign already exists.', 409);
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
  }

  revalidateAgeFlow();
  return apiSuccess(data);
}

// ─── DELETE /api/admin/reigns/:id — Delete reign [ADMIN] ───

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { error } = await supabaseAdmin.from('reigns').delete().eq('id', params.id);

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  revalidateAgeFlow();
  return apiSuccess({ deleted: true });
}
