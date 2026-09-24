import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireActiveUser, requireUser } from '@/lib/auth';
import { generalLimiter } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findPublishedPerson } from '@/lib/person-api';

// ─── GET  /api/persons/:slug/poll — Active poll with results (+ my vote if logged in) [PUBLIC] ───
// ─── POST /api/persons/:slug/poll — Vote or change vote { option_id } [USER] ───
// Choice polls only — no ratings or up/down votes on people.

async function loadPoll(personId: string) {
  const { data: poll } = await supabaseAdmin
    .from('person_polls')
    .select('id, question, person_poll_options ( id, label, sort_order )')
    .eq('person_id', personId)
    .eq('is_active', true)
    .eq('is_deleted', false)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return poll as {
    id: string;
    question: string;
    person_poll_options: { id: string; label: string; sort_order: number }[];
  } | null;
}

async function pollResults(pollId: string) {
  const { data } = await supabaseAdmin.from('person_poll_votes').select('option_id').eq('poll_id', pollId);
  const counts: Record<string, number> = {};
  (data ?? []).forEach((v) => (counts[v.option_id] = (counts[v.option_id] ?? 0) + 1));
  return { counts, total: data?.length ?? 0 };
}

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const person = await findPublishedPerson(params.slug);
  if (!person) return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);
  if (person.is_controversial) return apiSuccess({ poll: null });

  const poll = await loadPoll(person.id);
  if (!poll) return apiSuccess({ poll: null });

  const [{ counts, total }, user] = await Promise.all([pollResults(poll.id), requireUser(request)]);
  const { data: mine } = user
    ? await supabaseAdmin
        .from('person_poll_votes')
        .select('option_id')
        .eq('poll_id', poll.id)
        .eq('user_id', user.id)
        .maybeSingle()
    : { data: null };

  return apiSuccess({
    poll: {
      id: poll.id,
      question: poll.question,
      total,
      my_option_id: mine?.option_id ?? null,
      options: [...poll.person_poll_options]
        .sort((a, b) => a.sort_order - b.sort_order)
        .map((o) => ({ id: o.id, label: o.label, votes: counts[o.id] ?? 0 })),
    },
  });
}

const VoteSchema = z.object({ option_id: z.string().uuid() });

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const { user, error: authError } = await requireActiveUser(request);
  if (authError) return authError;

  const { success } = await generalLimiter.check(`poll:${user.id}`);
  if (!success) return apiError('RATE_LIMIT_EXCEEDED', 'Too many requests.', 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }
  const parsed = VoteSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const person = await findPublishedPerson(params.slug);
  if (!person || person.is_controversial) return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);
  const poll = await loadPoll(person.id);
  if (!poll || !poll.person_poll_options.some((o) => o.id === parsed.data.option_id))
    return apiError('VALIDATION_ERROR', 'Invalid option.', 422);

  // One vote per user per poll — voting again changes the choice
  const { error } = await supabaseAdmin
    .from('person_poll_votes')
    .upsert(
      { poll_id: poll.id, option_id: parsed.data.option_id, user_id: user.id },
      { onConflict: 'poll_id,user_id' }
    );
  if (error) return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  const { counts, total } = await pollResults(poll.id);
  return apiSuccess({ total, counts, my_option_id: parsed.data.option_id });
}
