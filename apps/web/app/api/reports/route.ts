import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { reportLimiter } from '@/lib/rate-limit';

// ─── POST /api/reports — Submit report [USER] ───

const ReportSchema = z.object({
  target_type: z.enum(['thread', 'reply', 'node_comment']),
  target_id: z.string().uuid(),
  reason: z.enum([
    'SPAM',
    'ABUSE',
    'HATE_SPEECH',
    'MISINFORMATION',
    'OFF_TOPIC',
    'OTHER',
  ]),
  detail: z.string().max(1000).optional(),
});

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  const { success } = await reportLimiter.check(user.id);
  if (!success)
    return apiError('RATE_LIMIT_EXCEEDED', 'Too many requests.', 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = ReportSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { target_type, target_id, reason, detail } = result.data;

  // Check duplicate report
  const { data: existing } = await supabaseAdmin
    .from('reports')
    .select('id')
    .eq('reporter_id', user.id)
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .maybeSingle();

  if (existing)
    return apiError('ALREADY_REPORTED', 'Already reported.', 409);

  const { data, error } = await supabaseAdmin
    .from('reports')
    .insert({
      reporter_id: user.id,
      target_type,
      target_id,
      reason,
      detail,
      status: 'PENDING',
    })
    .select()
    .single();

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess(data);
}
