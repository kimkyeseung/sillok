import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/notifications/unread-count — Unread notification count [USER] ───

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  const { count, error } = await supabaseAdmin
    .from('notifications')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_read', false);

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({ count: count ?? 0 });
}
