import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/threads/:id — 스레드 상세 (공개) ───

export async function GET(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const { data: thread, error } = await supabaseAdmin
    .from('threads')
    .select(
      `
      *,
      profiles!threads_author_id_fkey ( nickname, avatar_url ),
      persons!threads_person_id_fkey ( slug, name_ko, thumbnail ),
      thread_images ( id, url, sort_order )
    `
    )
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single();

  if (error || !thread)
    return apiError('THREAD_NOT_FOUND', '스레드를 찾을 수 없습니다.', 404);

  return apiSuccess(thread);
}

// ─── PUT /api/threads/:id — 스레드 수정 [OWNER] ───

const UpdateThreadSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  video_url: z.string().url().optional().nullable(),
  image_ids: z.array(z.string().uuid()).max(3).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

  const { data: thread } = await supabaseAdmin
    .from('threads')
    .select('id, author_id')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single();

  if (!thread)
    return apiError('THREAD_NOT_FOUND', '스레드를 찾을 수 없습니다.', 404);
  if (thread.author_id !== user.id)
    return apiError('FORBIDDEN', '수정 권한이 없습니다.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', '유효한 JSON이 아닙니다.', 422);
  }

  const result = UpdateThreadSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  const { image_ids, ...updateData } = result.data;

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabaseAdmin
      .from('threads')
      .update(updateData)
      .eq('id', params.id);

    if (error)
      return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);
  }

  // 이미지 교체
  if (image_ids !== undefined) {
    await supabaseAdmin
      .from('thread_images')
      .delete()
      .eq('thread_id', params.id);

    if (image_ids.length > 0) {
      await supabaseAdmin
        .from('thread_images')
        .update({ thread_id: params.id })
        .in('id', image_ids);
    }
  }

  const { data: updated } = await supabaseAdmin
    .from('threads')
    .select('*')
    .eq('id', params.id)
    .single();

  return apiSuccess(updated);
}

// ─── DELETE /api/threads/:id — 스레드 soft delete [OWNER|ADMIN] ───

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

  const { data: thread } = await supabaseAdmin
    .from('threads')
    .select('id, author_id')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single();

  if (!thread)
    return apiError('THREAD_NOT_FOUND', '스레드를 찾을 수 없습니다.', 404);

  // OWNER 또는 ADMIN 확인
  if (thread.author_id !== user.id) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN')
      return apiError('FORBIDDEN', '삭제 권한이 없습니다.', 403);
  }

  const { error } = await supabaseAdmin
    .from('threads')
    .update({ is_deleted: true })
    .eq('id', params.id);

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess({ deleted: true });
}
