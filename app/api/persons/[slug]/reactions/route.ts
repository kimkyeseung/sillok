import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireActiveUser, requireUser } from '@/lib/auth';
import { generalLimiter } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase-admin';
import {
  ItemTargetSchema,
  findReactablePerson,
  targetExists,
  targetId,
} from '@/lib/person-reactions';

// ─── GET  /api/persons/:slug/reactions — Heart & comment counts for every item on the page [PUBLIC] ───
// ─── POST /api/persons/:slug/reactions — Toggle my heart { target_type, target_key } [USER] ───

interface ItemSummary {
  likes: number;
  comments: number;
  liked: boolean;
}

async function likeCount(personId: string, type: string, key: string) {
  const { count } = await supabaseAdmin
    .from('person_item_likes')
    .select('id', { count: 'exact', head: true })
    .eq('person_id', personId)
    .eq('target_type', type)
    .eq('target_key', key);
  return count ?? 0;
}

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const person = await findReactablePerson(params.slug);
  if (!person) return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  const [likes, comments, user] = await Promise.all([
    supabaseAdmin.from('person_item_likes').select('target_type, target_key, user_id').eq('person_id', person.id).limit(10000),
    supabaseAdmin
      .from('person_item_comments')
      .select('target_type, target_key')
      .eq('person_id', person.id)
      .eq('is_deleted', false)
      .limit(10000),
    requireUser(request),
  ]);

  const items: Record<string, ItemSummary> = {};
  const item = (type: string, key: string) =>
    (items[targetId(type, key)] ??= { likes: 0, comments: 0, liked: false });
  (likes.data ?? []).forEach((l) => {
    const it = item(l.target_type, l.target_key);
    it.likes += 1;
    if (user && l.user_id === user.id) it.liked = true;
  });
  (comments.data ?? []).forEach((c) => (item(c.target_type, c.target_key).comments += 1));

  return apiSuccess({ items });
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const { user, error: authError } = await requireActiveUser(request);
  if (authError) return authError;

  const { success } = await generalLimiter.check(`heart:${user.id}`);
  if (!success) return apiError('RATE_LIMIT_EXCEEDED', 'Too many requests.', 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }
  const parsed = ItemTargetSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Please check your input.', 422);
  const { target_type, target_key } = parsed.data;

  const person = await findReactablePerson(params.slug);
  if (!person) return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);
  if (!(await targetExists(person, target_type, target_key)))
    return apiError('NOT_FOUND', 'Item not found.', 404);

  const match = { person_id: person.id, target_type, target_key, user_id: user.id };
  const { data: existing } = await supabaseAdmin
    .from('person_item_likes')
    .select('id')
    .match(match)
    .maybeSingle();

  // A heart is a personal toggle (no dislikes) — removing it deletes the row
  const { error } = existing
    ? await supabaseAdmin.from('person_item_likes').delete().eq('id', existing.id)
    : await supabaseAdmin.from('person_item_likes').insert(match);
  if (error) return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({
    liked: !existing,
    likes: await likeCount(person.id, target_type, target_key),
  });
}
