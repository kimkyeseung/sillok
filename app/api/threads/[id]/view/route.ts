import { apiSuccess } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── POST /api/threads/:id/view — Log thread view ───

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { data: thread } = await supabaseAdmin
    .from('threads')
    .select('id')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single();

  if (!thread) return apiSuccess({ logged: false });

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // 같은 IP가 5분 이내 재조회면 무시
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: recent } = await supabaseAdmin
    .from('view_logs')
    .select('id')
    .eq('target_type', 'THREAD')
    .eq('target_id', params.id)
    .eq('viewer_ip', ip)
    .gte('viewed_at', fiveMinAgo)
    .limit(1);

  if (recent && recent.length > 0) {
    return apiSuccess({ logged: false });
  }

  await supabaseAdmin.from('view_logs').insert({
    target_type: 'THREAD',
    target_id: params.id,
    viewer_ip: ip,
  });

  return apiSuccess({ logged: true });
}
