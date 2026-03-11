import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

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

// ─── GET /api/threads — 전체 스레드 피드 (공개) ───

const FeedQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(100).default(20),
  cursor: z.string().optional(),
  person_id: z.string().uuid().optional(),
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = FeedQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

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
      persons!threads_person_id_fkey ( slug, name_ko, thumbnail ),
      thread_images ( id, url, sort_order )
    `
    )
    .eq('is_deleted', false)
    .order('created_at', { ascending: false });

  if (person_id) query = query.eq('person_id', person_id);
  if (cursor) query = query.lt('created_at', cursor);

  query = query.limit(limit + 1);

  const { data, error } = await query;
  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  const hasNext = (data?.length ?? 0) > limit;
  const items = hasNext ? data!.slice(0, limit) : (data ?? []);
  const lastItem = items[items.length - 1];

  return apiSuccess({
    items,
    has_next: hasNext,
    next_cursor: hasNext && lastItem ? lastItem.created_at : null,
  });
}

// ─── POST /api/threads — 스레드 작성 [USER] ───

const CreateThreadSchema = z.object({
  person_id: z.string().uuid(),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  video_url: z.string().url().optional(),
  image_ids: z.array(z.string().uuid()).max(3).optional(),
});

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', '유효한 JSON이 아닙니다.', 422);
  }

  const result = CreateThreadSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422, result.error.issues);

  const { image_ids, ...threadData } = result.data;

  // video_url 유효성 검증
  if (threadData.video_url && !validateVideoUrl(threadData.video_url)) {
    return apiError(
      'VALIDATION_ERROR',
      'YouTube 또는 네이버TV URL만 허용됩니다.',
      422
    );
  }

  // 인물 존재 확인
  const { data: person } = await supabaseAdmin
    .from('persons')
    .select('id')
    .eq('id', threadData.person_id)
    .eq('is_deleted', false)
    .single();

  if (!person)
    return apiError('PERSON_NOT_FOUND', '인물을 찾을 수 없습니다.', 404);

  const { data: thread, error } = await supabaseAdmin
    .from('threads')
    .insert({ ...threadData, author_id: user.id })
    .select()
    .single();

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  // 이미지 연결
  if (image_ids && image_ids.length > 0) {
    await supabaseAdmin
      .from('thread_images')
      .update({ thread_id: thread.id })
      .in('id', image_ids)
      .is('thread_id', null);
  }

  return apiSuccess(thread);
}
