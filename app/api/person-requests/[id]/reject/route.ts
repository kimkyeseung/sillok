import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/person-requests/:id/reject — Reject person addition request [ADMIN] ───

const RejectSchema = z.object({
  admin_note: z.string().max(500).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  let body = {};
  try {
    body = await request.json();
  } catch {
    // rejection can proceed without a body
  }

  const result = RejectSchema.safeParse(body);
  const adminNote = result.success ? result.data.admin_note : undefined;

  const { data, error } = await supabaseAdmin
    .from('person_requests')
    .update({
      status: 'REJECTED',
      ...(adminNote && { admin_note: adminNote }),
    })
    .eq('id', params.id)
    .eq('status', 'PENDING')
    .select()
    .single();

  if (error || !data)
    return apiError('NODE_NOT_FOUND', 'Request not found.', 404);

  await supabaseAdmin.from('notifications').insert({
    user_id: data.requester_id,
    type: 'REQUEST_REJECTED',
    title: 'Your person addition request has been rejected',
    body: adminNote || `Your request for "${data.name_ko}" has been rejected.`,
    link: null,
  });

  return apiSuccess(data);
}
