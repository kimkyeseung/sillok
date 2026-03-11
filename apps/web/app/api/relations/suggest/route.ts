import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { relationSuggestLimiter } from '@/lib/rate-limit';

// ─── POST /api/relations/suggest — 관계 제안 [USER] ───

const SuggestRelationSchema = z.object({
  person_a_id: z.string().uuid(),
  person_b_id: z.string().uuid(),
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
    return apiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

  const { success } = await relationSuggestLimiter.check(user.id);
  if (!success)
    return apiError('RATE_LIMIT_EXCEEDED', '요청이 너무 많습니다.', 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', '유효한 JSON이 아닙니다.', 422);
  }

  const result = SuggestRelationSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  const { person_a_id, person_b_id, relation_type, description } = result.data;

  if (person_a_id === person_b_id)
    return apiError('VALIDATION_ERROR', '같은 인물을 지정할 수 없습니다.', 422);

  // 중복 관계 확인
  const { data: existing } = await supabaseAdmin
    .from('person_relations')
    .select('id')
    .or(
      `and(person_a_id.eq.${person_a_id},person_b_id.eq.${person_b_id}),and(person_a_id.eq.${person_b_id},person_b_id.eq.${person_a_id})`
    )
    .eq('relation_type', relation_type)
    .maybeSingle();

  if (existing)
    return apiError('DUPLICATE_RELATION', '이미 등록된 관계입니다.', 409);

  const { data, error } = await supabaseAdmin
    .from('person_relations')
    .insert({
      person_a_id,
      person_b_id,
      relation_type,
      description,
      is_approved: false,
      suggested_by: user.id,
    })
    .select()
    .single();

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess(data);
}
