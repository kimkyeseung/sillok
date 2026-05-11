import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { threadCreateLimiter } from '@/lib/rate-limit';
import { notifyFollowers } from '@/lib/notifications';
import { normalizeThreadList, uniqueFigureIds } from '@/lib/thread-figures';

const ALLOWED_VIDEO_HOSTS = ['youtube.com', 'youtu.be', 'tv.naver.com'];

function validateVideoUrl(url: string): boolean {
  try {
    const host = new URL(url).hostname.replace('www.', '');
    return ALLOWED_VIDEO_HOSTS.some(
      (h) => host === h || host.endsWith('.' + h)
    );
  } catch {
    return false;
  }
}

// ─── GET /api/threads — Thread feed (public) ───

const FeedQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  person_id: z.string().uuid().optional(),
});

async function getThreadIdsByFigure(personId: string): Promise<string[]> {
  const { data } = await supabaseAdmin
    .from('thread_persons')
    .select('thread_id')
    .eq('person_id', personId);

  return (data ?? []).map((row) => row.thread_id);
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = FeedQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { limit, cursor, person_id } = parsed.data;

  let query = supabaseAdmin
    .from('threads')
    .select(
      `
      id, title, content, video_url,
      person_id, is_pinned, view_count, reply_count, like_count,
      created_at, updated_at,
      author_id,
      profiles!threads_author_id_fkey ( nickname, avatar_url ),
      persons!threads_person_id_fkey ( id, slug, name_en, name_ko, thumbnail ),
      thread_images ( id, url, sort_order ),
      thread_persons ( person_id, is_primary, sort_order, persons ( id, slug, name_en, name_ko, thumbnail ) )
    `
    )
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (person_id) {
    const relatedThreadIds = await getThreadIdsByFigure(person_id);
    const filter = `person_id.eq.${person_id}${
      relatedThreadIds.length > 0 ? `,id.in.(${relatedThreadIds.join(',')})` : ''
    }`;
    query = query.or(filter);
  }
  if (cursor) query = query.lt('created_at', cursor);

  query = query.limit(limit + 1);

  const { data, error } = await query;
  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  const normalized = normalizeThreadList(data);
  const hasNext = normalized.length > limit;
  const items = hasNext ? normalized.slice(0, limit) : normalized;
  const lastItem = items[items.length - 1];

  return apiSuccess({
    items,
    has_next: hasNext,
    next_cursor: hasNext && lastItem ? lastItem.created_at : null,
  });
}

// ─── POST /api/threads — Create thread [USER] ───

const CreateThreadSchema = z.object({
  figures: z.array(z.string().uuid()).min(1).max(6).optional(),
  person_id: z.string().uuid().optional(),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  video_url: z.string().url().optional(),
  image_ids: z.array(z.string().uuid()).max(3).optional(),
  related_person_ids: z.array(z.string().uuid()).max(5).optional(),
}).refine((value) => (value.figures?.length ?? 0) > 0 || !!value.person_id, {
  message: 'At least one figure is required.',
  path: ['figures'],
});

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  const { success } = await threadCreateLimiter.check(user.id);
  if (!success)
    return apiError('RATE_LIMIT_EXCEEDED', 'Too many threads. Please try again later.', 429);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = CreateThreadSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422, result.error.issues);

  const {
    figures,
    image_ids,
    related_person_ids,
    person_id,
    ...threadData
  } = result.data;
  const figureIds = uniqueFigureIds(
    figures ?? [person_id!, ...(related_person_ids ?? [])]
  );
  const primaryPersonId = figureIds[0];
  const relatedFigureIds = figureIds.slice(1);

  // Validate video_url
  if (threadData.video_url && !validateVideoUrl(threadData.video_url)) {
    return apiError(
      'VALIDATION_ERROR',
      'Only YouTube or Naver TV URLs are allowed.',
      422
    );
  }

  // Check figures exist
  const { data: people } = await supabaseAdmin
    .from('persons')
    .select('id, slug')
    .in('id', figureIds)
    .eq('is_deleted', false);

  if ((people?.length ?? 0) !== figureIds.length)
    return apiError('PERSON_NOT_FOUND', 'Figure not found.', 404);

  const primaryPerson = people!.find((person) => person.id === primaryPersonId)!;

  const { data: thread, error } = await supabaseAdmin
    .from('threads')
    .insert({ ...threadData, person_id: primaryPersonId, author_id: user.id })
    .select()
    .single();

  if (error) {
    console.error('[POST /api/threads] insert error:', error);
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
  }

  // Link images
  if (image_ids && image_ids.length > 0) {
    await supabaseAdmin
      .from('thread_images')
      .update({ thread_id: thread.id })
      .in('id', image_ids)
      .is('thread_id', null);
  }

  await supabaseAdmin.from('thread_persons').insert(
    figureIds.map((pid, index) => ({
      thread_id: thread.id,
      person_id: pid,
      is_primary: index === 0,
      sort_order: index,
    }))
  );

  // Notify followers of this person (fire-and-forget)
  notifyFollowers({
    personId: primaryPersonId,
    threadAuthorId: user.id,
    threadTitle: threadData.title,
    personSlug: primaryPerson.slug,
    threadId: thread.id,
  });

  return apiSuccess(thread);
}
