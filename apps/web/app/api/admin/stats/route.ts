import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/admin/stats — 어드민 대시보드 통계 [ADMIN] ───

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  const now = new Date();
  const today = now.toISOString().split('T')[0];
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    .toISOString();

  const [
    { count: todayViews },
    { count: newUsers7d },
    { count: newThreads7d },
    { count: pendingRequests },
    { count: pendingReports },
  ] = await Promise.all([
    supabaseAdmin
      .from('view_logs')
      .select('*', { count: 'exact', head: true })
      .gte('viewed_at', today),
    supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', sevenDaysAgo),
    supabaseAdmin
      .from('threads')
      .select('*', { count: 'exact', head: true })
      .eq('is_deleted', false)
      .gte('created_at', sevenDaysAgo),
    supabaseAdmin
      .from('person_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING'),
    supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'PENDING'),
  ]);

  // 최근 7일 인기 인물 Top 5
  const { data: topPersons } = await supabaseAdmin
    .from('persons')
    .select('id, slug, name_ko, view_count')
    .eq('is_deleted', false)
    .order('view_count', { ascending: false })
    .limit(5);

  return apiSuccess({
    today_views: todayViews ?? 0,
    new_users_7d: newUsers7d ?? 0,
    new_threads_7d: newThreads7d ?? 0,
    pending_requests: pendingRequests ?? 0,
    pending_reports: pendingReports ?? 0,
    top_persons_7d: topPersons ?? [],
  });
}
