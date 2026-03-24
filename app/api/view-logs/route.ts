import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── POST /api/view-logs — Log view (public, IP dedup) ───

const ViewLogSchema = z.object({
  target_type: z.enum(['PERSON', 'NODE', 'THREAD']),
  target_id: z.string().uuid(),
});

export async function POST(request: Request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = ViewLogSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { target_type, target_id } = result.data;
  const viewerIp =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';

  // Prevent duplicate from same IP within 24 hours
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabaseAdmin
    .from('view_logs')
    .select('id')
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .eq('viewer_ip', viewerIp)
    .gte('viewed_at', oneDayAgo)
    .maybeSingle();

  if (existing) return apiSuccess({ logged: false });

  await supabaseAdmin.from('view_logs').insert({
    target_type,
    target_id,
    viewer_ip: viewerIp,
  });

  return apiSuccess({ logged: true });
}
