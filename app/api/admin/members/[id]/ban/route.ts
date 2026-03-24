import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/admin/members/:id/ban — Ban member [ADMIN] ───

const BanSchema = z.object({
  duration_hours: z.number().min(1).max(8760).optional(), // max 365 days
  reason: z.string().min(1).max(500),
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

  const result = BanSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { duration_hours, reason } = result.data;

  const bannedUntil = duration_hours
    ? new Date(Date.now() + duration_hours * 60 * 60 * 1000).toISOString()
    : null; // null = permanent ban

  const { error: updateError } = await supabaseAdmin
    .from('profiles')
    .update({ is_banned: true, banned_until: bannedUntil })
    .eq('id', params.id);

  if (updateError)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  // Record warning log
  await supabaseAdmin.from('warning_logs').insert({
    user_id: params.id,
    admin_id: admin.id,
    action: 'BAN',
    reason,
    detail: bannedUntil
      ? `Suspended for ${duration_hours} hours`
      : 'Permanently suspended',
  });

  return apiSuccess({ banned: true, banned_until: bannedUntil });
}
