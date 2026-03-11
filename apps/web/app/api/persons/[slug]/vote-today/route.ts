import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── POST /api/persons/:slug/vote-today — 오늘의 인물 투표 [USER] ───

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

  const { data: person } = await supabaseAdmin
    .from('persons')
    .select('id')
    .eq('slug', params.slug)
    .eq('is_deleted', false)
    .single();

  if (!person)
    return apiError('PERSON_NOT_FOUND', '인물을 찾을 수 없습니다.', 404);

  const today = new Date().toISOString().split('T')[0];

  // 오늘 이미 투표했는지 확인 (1일 1투표)
  const { data: existing } = await supabaseAdmin
    .from('person_of_day_votes')
    .select('id, person_id')
    .eq('user_id', user.id)
    .eq('vote_date', today)
    .maybeSingle();

  if (existing) {
    if (existing.person_id === person.id) {
      // 같은 인물 다시 클릭 → 투표 취소
      await supabaseAdmin
        .from('person_of_day_votes')
        .delete()
        .eq('id', existing.id);
      return apiSuccess({ voted: false });
    }
    // 다른 인물에게 이미 투표
    return apiError(
      'VALIDATION_ERROR',
      '오늘 이미 다른 인물에게 투표했습니다.',
      409
    );
  }

  await supabaseAdmin.from('person_of_day_votes').insert({
    user_id: user.id,
    person_id: person.id,
    vote_date: today,
  });

  return apiSuccess({ voted: true });
}
