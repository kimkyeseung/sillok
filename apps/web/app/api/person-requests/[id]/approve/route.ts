import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/person-requests/:id/approve — Approve person addition request [ADMIN] ───

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { data, error } = await supabaseAdmin
    .from('person_requests')
    .update({ status: 'APPROVED' })
    .eq('id', params.id)
    .eq('status', 'PENDING')
    .select()
    .single();

  if (error || !data)
    return apiError('NODE_NOT_FOUND', 'Request not found.', 404);

  // Notify the requester
  await supabaseAdmin.from('notifications').insert({
    user_id: data.requested_by,
    type: 'REQUEST_APPROVED',
    title: 'Your person addition request has been approved',
    body: `"${data.name_ko}" will be registered soon.`,
    link: null,
  });

  return apiSuccess(data);
}
