import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireActiveUser, requireUser } from '@/lib/auth';
import { generalLimiter } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { findPublishedPerson } from '@/lib/person-api';
import { PERSON_STATUS_VALUES, type PersonStatus } from '@/lib/community';

// ─── GET  /api/persons/:slug/status — Status counts (+ mine if logged in) [PUBLIC] ───
// ─── POST /api/persons/:slug/status — Toggle one of my statuses { status } [USER] ───

async function statusCounts(personId: string) {
  const { data } = await supabaseAdmin.from('person_user_status').select('status').eq('person_id', personId);
  const counts = Object.fromEntries(PERSON_STATUS_VALUES.map((s) => [s, 0])) as Record<PersonStatus, number>;
  (data ?? []).forEach((r) => (counts[r.status as PersonStatus] += 1));
  return counts;
}

async function myStatuses(personId: string, userId: string) {
  const { data } = await supabaseAdmin
    .from('person_user_status')
    .select('status')
    .eq('person_id', personId)
    .eq('user_id', userId);
  return (data ?? []).map((r) => r.status as PersonStatus);
}

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const person = await findPublishedPerson(params.slug);
  if (!person) return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  const user = await requireUser(request);
  const [counts, mine] = await Promise.all([
    statusCounts(person.id),
    user ? myStatuses(person.id, user.id) : Promise.resolve([]),
  ]);
  return apiSuccess({ counts, mine });
}

const ToggleSchema = z.object({ status: z.enum(PERSON_STATUS_VALUES) });

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const { user, error: authError } = await requireActiveUser(request);
  if (authError) return authError;

  const { success } = await generalLimiter.check(`status:${user.id}`);
  if (!success) return apiError('RATE_LIMIT_EXCEEDED', 'Too many requests.', 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }
  const parsed = ToggleSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const person = await findPublishedPerson(params.slug);
  if (!person) return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  const { status } = parsed.data;
  const { data: existing } = await supabaseAdmin
    .from('person_user_status')
    .select('id')
    .eq('person_id', person.id)
    .eq('user_id', user.id)
    .eq('status', status)
    .maybeSingle();

  // Personal bookmark-style state: removing it is a plain delete
  const { error } = existing
    ? await supabaseAdmin.from('person_user_status').delete().eq('id', existing.id)
    : await supabaseAdmin.from('person_user_status').insert({ person_id: person.id, user_id: user.id, status });
  if (error) return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  const [counts, mine] = await Promise.all([statusCounts(person.id), myStatuses(person.id, user.id)]);
  return apiSuccess({ counts, mine });
}
