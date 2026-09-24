import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireActiveUser } from '@/lib/auth';
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
    'MEMBER_OF',
    'FOUNDED',
    'AFFILIATED',
  ]),
  description: z.string().max(500).optional(),
  // FAMILY only — relative to from_person: CHILD is stored as PARENT with ends swapped
  family_role: z.enum(['PARENT', 'CHILD', 'SPOUSE', 'SIBLING']).optional(),
});

export async function POST(request: Request) {
  const { user, error: authError } = await requireActiveUser(request);
  if (authError) return authError;

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

  const { relation_type, description, family_role } = result.data;
  let { from_person_id, to_person_id } = result.data;

  if (from_person_id === to_person_id)
    return apiError('VALIDATION_ERROR', 'Cannot specify the same person.', 422);

  if (family_role && relation_type !== 'FAMILY')
    return apiError('VALIDATION_ERROR', 'family_role is only allowed for FAMILY.', 422);

  // Normalize "child of" into a PARENT row (from = parent)
  if (family_role === 'CHILD')
    [from_person_id, to_person_id] = [to_person_id, from_person_id];
  const storedFamilyRole = family_role === 'CHILD' ? 'PARENT' : family_role ?? null;

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
      family_role: storedFamilyRole,
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
