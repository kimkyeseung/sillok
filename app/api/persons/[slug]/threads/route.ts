import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizeThreadList } from '@/lib/thread-figures';

// ─── GET /api/persons/:slug/threads — Person threads (public) ───

const QuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
});

export async function GET(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const { searchParams } = new URL(request.url);
  const parsed = QuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { limit, cursor } = parsed.data;

  const { data: person } = await supabaseAdmin
    .from('persons')
    .select('id')
    .eq('slug', params.slug)
    .eq('is_deleted', false)
    .single();

  if (!person)
    return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  // Threads where person is primary OR referenced as related
  const { data: relatedThreadIds } = await supabaseAdmin
    .from('thread_persons')
    .select('thread_id')
    .eq('person_id', person.id);

  const relatedIds = (relatedThreadIds ?? []).map((r) => r.thread_id);

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
    .or(`person_id.eq.${person.id}${relatedIds.length > 0 ? `,id.in.(${relatedIds.join(',')})` : ''}`)
    .order('is_pinned', { ascending: false })
    .order('created_at', { ascending: false });

  if (cursor) {
    query = query.lt('created_at', cursor);
  }

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
    pagination: { limit },
  });
}
