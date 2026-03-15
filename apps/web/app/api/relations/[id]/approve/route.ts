import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/relations/:id/approve — Approve relation [ADMIN] ───

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { data, error } = await supabaseAdmin
    .from('person_relations')
    .update({ is_approved: true })
    .eq('id', params.id)
    .eq('is_approved', false)
    .select()
    .single();

  if (error || !data)
    return apiError('NODE_NOT_FOUND', 'Relation not found.', 404);

  return apiSuccess(data);
}
