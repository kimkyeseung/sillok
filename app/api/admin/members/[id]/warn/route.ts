import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/admin/members/:id/warn — Warn member [ADMIN] ───

const WarnSchema = z.object({
  reason: z.string().min(1).max(500),
  target_type: z.string().optional(),
  target_id: z.string().uuid().optional(),
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

  const result = WarnSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { data, error } = await supabaseAdmin
    .from('warning_logs')
    .insert({
      user_id: params.id,
      admin_id: admin.id,
      reason: result.data.reason,
      target_type: result.data.target_type,
      target_id: result.data.target_id,
    })
    .select()
    .single();

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  // Send warning notification
  await supabaseAdmin.from('notifications').insert({
    user_id: params.id,
    type: 'WARNING',
    title: 'You have received a warning',
    body: result.data.reason,
    link: null,
  });

  return apiSuccess(data);
}
