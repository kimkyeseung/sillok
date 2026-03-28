import { apiSuccess } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── POST /api/articles/:slug/view — Log article view + increment count ───

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  // Resolve article ID from slug
  const { data: article } = await supabaseAdmin
    .from('articles')
    .select('id')
    .eq('slug', params.slug)
    .eq('is_deleted', false)
    .single();

  if (!article) return apiSuccess({ logged: false });

  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  // Dedupe: same IP within 5 minutes
  const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data: recent } = await supabaseAdmin
    .from('view_logs')
    .select('id')
    .eq('target_type', 'ARTICLE')
    .eq('target_id', article.id)
    .eq('viewer_ip', ip)
    .gte('viewed_at', fiveMinAgo)
    .limit(1);

  if (recent && recent.length > 0) {
    return apiSuccess({ logged: false });
  }

  // Insert view log + increment counter
  await Promise.all([
    supabaseAdmin.from('view_logs').insert({
      target_type: 'ARTICLE',
      target_id: article.id,
      viewer_ip: ip,
    }),
    supabaseAdmin.rpc('increment_counter', {
      table_name: 'articles',
      column_name: 'view_count',
      row_id: article.id,
    }),
  ]);

  return apiSuccess({ logged: true });
}
