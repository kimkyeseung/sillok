import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { relationSuggestLimiter } from '@/lib/rate-limit';

// ─── POST /api/relations/suggest — Suggest relation [USER] ───

const SuggestRelationSchema = z.object({
  from_person_id: z.string().uuid(),
  to_person_id: z.string().uuid(),
  relation_type: z.enum([
    'FAMILY',
    'TEACHER',
    'ALLY',
    'RIVAL',
    'LORD_VASSAL',
    'INFLUENCE',
  ]),
  description: z.string().max(500).optional(),
});

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  const { success } = await relationSuggestLimiter.check(user.id);
  if (!success)
    return apiError('RATE_LIMIT_EXCEEDED', 'Too many requests.', 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = SuggestRelationSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { from_person_id, to_person_id, relation_type, description } = result.data;

  if (from_person_id === to_person_id)
    return apiError('VALIDATION_ERROR', 'Cannot specify the same person.', 422);

  // Check duplicate relation
  const { data: existing } = await supabaseAdmin
    .from('person_relations')
    .select('id')
    .or(
      `and(from_person_id.eq.${from_person_id},to_person_id.eq.${to_person_id}),and(from_person_id.eq.${to_person_id},to_person_id.eq.${from_person_id})`
    )
    .eq('relation_type', relation_type)
    .maybeSingle();

  if (existing)
    return apiError('DUPLICATE_RELATION', 'Relation already exists.', 409);

  const { data, error } = await supabaseAdmin
    .from('person_relations')
    .insert({
      from_person_id,
      to_person_id,
      relation_type,
      description,
      is_approved: false,
      suggested_by: user.id,
    })
    .select()
    .single();

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess(data);
}
