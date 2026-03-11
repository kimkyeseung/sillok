import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/comments/:id — 노드 댓글 수정 [OWNER] ───

const UpdateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

  const { data: comment } = await supabaseAdmin
    .from('node_comments')
    .select('id, author_id')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single();

  if (!comment)
    return apiError('NODE_NOT_FOUND', '댓글을 찾을 수 없습니다.', 404);
  if (comment.author_id !== user.id)
    return apiError('FORBIDDEN', '수정 권한이 없습니다.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', '유효한 JSON이 아닙니다.', 422);
  }

  const result = UpdateCommentSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  const { data: updated, error } = await supabaseAdmin
    .from('node_comments')
    .update({ content: result.data.content })
    .eq('id', params.id)
    .select()
    .single();

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess(updated);
}

// ─── DELETE /api/comments/:id — 노드 댓글 soft delete [OWNER|ADMIN] ───

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

  const { data: comment } = await supabaseAdmin
    .from('node_comments')
    .select('id, author_id')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single();

  if (!comment)
    return apiError('NODE_NOT_FOUND', '댓글을 찾을 수 없습니다.', 404);

  if (comment.author_id !== user.id) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN')
      return apiError('FORBIDDEN', '삭제 권한이 없습니다.', 403);
  }

  const { error } = await supabaseAdmin
    .from('node_comments')
    .update({ is_deleted: true })
    .eq('id', params.id);

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess({ deleted: true });
}
