import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireActiveUser } from '@/lib/auth';
import { replyCreateLimiter } from '@/lib/rate-limit';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { ItemTargetSchema, findReactablePerson, targetExists } from '@/lib/person-reactions';

// ─── GET  /api/persons/:slug/comments?target_type&target_key&cursor — Item comments (oldest first) [PUBLIC] ───
// ─── POST /api/persons/:slug/comments — Comment on an item { target_type, target_key, content } [USER] ───
// Text only (no image attachments), single level (no replies).

const ListSchema = ItemTargetSchema.extend({
  limit: z.coerce.number().int().min(1).max(50).default(20),
  cursor: z.string().datetime().optional(),
});

const CreateSchema = ItemTargetSchema.extend({
  content: z.string().trim().min(1).max(1000),
});

export async function GET(request: Request, { params }: { params: { slug: string } }) {
  const parsed = ListSchema.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Please check your input.', 422);
  const { target_type, target_key, limit, cursor } = parsed.data;

  const person = await findReactablePerson(params.slug);
  if (!person) return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  let query = supabaseAdmin
    .from('person_item_comments')
    .select('id, content, created_at, user_id')
    .eq('person_id', person.id)
    .eq('target_type', target_type)
    .eq('target_key', target_key)
    .eq('is_deleted', false)
    .order('created_at', { ascending: true })
    .limit(limit + 1);
  if (cursor) query = query.gt('created_at', cursor);

  const { data, error } = await query;
  if (error) return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  const rows = (data ?? []).slice(0, limit);
  const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
  const { data: profiles } = userIds.length
    ? await supabaseAdmin.from('profiles').select('id, nickname, avatar_url').in('id', userIds)
    : { data: [] };
  const byId = new Map((profiles ?? []).map((p) => [p.id, p]));

  return apiSuccess({
    items: rows.map((r) => ({
      id: r.id,
      content: r.content,
      created_at: r.created_at,
      author: {
        id: r.user_id,
        nickname: byId.get(r.user_id)?.nickname ?? null,
        avatar_url: byId.get(r.user_id)?.avatar_url ?? null,
      },
    })),
    has_next: (data?.length ?? 0) > limit,
    next_cursor: rows.at(-1)?.created_at ?? null,
  });
}

export async function POST(request: Request, { params }: { params: { slug: string } }) {
  const { user, error: authError } = await requireActiveUser(request);
  if (authError) return authError;

  const { success } = await replyCreateLimiter.check(user.id);
  if (!success) return apiError('RATE_LIMIT_EXCEEDED', 'Too many requests.', 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }
  const parsed = CreateSchema.safeParse(body);
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422, parsed.error.issues);
  const { target_type, target_key, content } = parsed.data;

  const person = await findReactablePerson(params.slug);
  if (!person) return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);
  if (!(await targetExists(person, target_type, target_key)))
    return apiError('NOT_FOUND', 'Item not found.', 404);

  const { data, error } = await supabaseAdmin
    .from('person_item_comments')
    .insert({ person_id: person.id, target_type, target_key, user_id: user.id, content })
    .select('id, content, created_at')
    .single();
  if (error) return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess(data, 201);
}
