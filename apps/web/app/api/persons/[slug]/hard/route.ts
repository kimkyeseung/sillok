import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── DELETE /api/persons/:slug/hard — Hard delete person [ADMIN] ───

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { data: existing } = await supabaseAdmin
    .from('persons')
    .select('id')
    .eq('slug', params.slug)
    .single();

  if (!existing)
    return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  const { error } = await supabaseAdmin
    .from('persons')
    .delete()
    .eq('id', existing.id);

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({ hard_deleted: true });
}
