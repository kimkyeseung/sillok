import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { generalLimiter } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── POST /api/view-logs — Log view (public, IP dedup) ───

const ViewLogSchema = z.object({
  target_type: z.enum(['PERSON', 'NODE', 'THREAD', 'ARTICLE']),
  target_id: z.string().uuid(),
});

async function targetExists(targetType: z.infer<typeof ViewLogSchema>['target_type'], targetId: string) {
  switch (targetType) {
    case 'PERSON': {
      const { data } = await supabaseAdmin
        .from('persons')
        .select('id')
        .eq('id', targetId)
        .eq('is_deleted', false)
        .single();
      return !!data;
    }
    case 'NODE': {
      const { data } = await supabaseAdmin
        .from('nodes')
        .select('id')
        .eq('id', targetId)
        .eq('is_deleted', false)
        .single();
      return !!data;
    }
    case 'THREAD': {
      const { data } = await supabaseAdmin
        .from('threads')
        .select('id')
        .eq('id', targetId)
        .eq('is_deleted', false)
        .single();
      return !!data;
    }
    case 'ARTICLE': {
      const { data } = await supabaseAdmin
        .from('articles')
        .select('id')
        .eq('id', targetId)
        .eq('is_deleted', false)
        .single();
      return !!data;
    }
  }
}

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

  const rate = await generalLimiter.check(`view:${viewerIp}`);
  if (!rate.success)
    return apiError('RATE_LIMIT_EXCEEDED', 'Too many requests.', 429);

  const exists = await targetExists(target_type, target_id);
  if (!exists) return apiSuccess({ logged: false });

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

  const { error } = await supabaseAdmin.from('view_logs').insert({
    target_type,
    target_id,
    viewer_ip: viewerIp,
  });

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({ logged: true });
}
