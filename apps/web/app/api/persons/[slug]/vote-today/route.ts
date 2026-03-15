import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── POST /api/persons/:slug/vote-today — Vote person of the day [USER] ───

export async function POST(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  const { data: person } = await supabaseAdmin
    .from('persons')
    .select('id')
    .eq('slug', params.slug)
    .eq('is_deleted', false)
    .single();

  if (!person)
    return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  const today = new Date().toISOString().split('T')[0];

  // Check if already voted today (1 vote per day)
  const { data: existing } = await supabaseAdmin
    .from('person_of_day_votes')
    .select('id, person_id')
    .eq('user_id', user.id)
    .eq('vote_date', today)
    .maybeSingle();

  if (existing) {
    if (existing.person_id === person.id) {
      // Clicking same person again cancels vote
      await supabaseAdmin
        .from('person_of_day_votes')
        .delete()
        .eq('id', existing.id);
      return apiSuccess({ voted: false });
    }
    // Already voted for another person
    return apiError(
      'VALIDATION_ERROR',
      'You have already voted for another person today.',
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
