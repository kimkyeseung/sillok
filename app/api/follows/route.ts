import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── POST /api/follows — Toggle follow [USER] ───

const FollowSchema = z.object({
  target_type: z.enum(['person', 'node']),
  target_id: z.string().uuid(),
});

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = FollowSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { target_type, target_id } = result.data;

  // Check target exists
  if (target_type === 'person') {
    const { data } = await supabaseAdmin
      .from('persons')
      .select('id')
      .eq('id', target_id)
      .eq('is_deleted', false)
      .single();
    if (!data)
      return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);
  } else {
    const { data } = await supabaseAdmin
      .from('nodes')
      .select('id')
      .eq('id', target_id)
      .eq('is_deleted', false)
      .single();
    if (!data)
      return apiError('NODE_NOT_FOUND', 'Node not found.', 404);
  }

  const { data: existing } = await supabaseAdmin
    .from('follows')
    .select('id')
    .eq('user_id', user.id)
    .eq('target_type', target_type)
    .eq('target_id', target_id)
    .maybeSingle();

  if (existing) {
    await supabaseAdmin.from('follows').delete().eq('id', existing.id);
    return apiSuccess({ followed: false });
  } else {
    await supabaseAdmin.from('follows').insert({
      user_id: user.id,
      target_type,
      target_id,
    });
    return apiSuccess({ followed: true });
  }
}
