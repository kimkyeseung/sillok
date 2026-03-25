import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/admin/members/:id/unban — Unban member [ADMIN] ───

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { error } = await supabaseAdmin
    .from('profiles')
    .update({ is_banned: false, ban_until: null })
    .eq('id', params.id);

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  await supabaseAdmin.from('warning_logs').insert({
    user_id: params.id,
    admin_id: admin.id,
    reason: '[UNBAN] Ban lifted',
  });

  return apiSuccess({ unbanned: true });
}
