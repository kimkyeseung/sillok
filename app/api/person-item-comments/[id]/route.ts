import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin, requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── DELETE /api/person-item-comments/:id — Soft delete (author or admin) [USER] ───

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const user = await requireUser(request);
  if (!user) return apiError('UNAUTHORIZED', 'Login required.', 401);
  if (!z.string().uuid().safeParse(params.id).success)
    return apiError('VALIDATION_ERROR', 'Invalid comment id.', 422);

  const { data: comment } = await supabaseAdmin
    .from('person_item_comments')
    .select('id, user_id')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .maybeSingle();
  if (!comment) return apiError('NOT_FOUND', 'Comment not found.', 404);

  if (comment.user_id !== user.id && !(await requireAdmin(request)))
    return apiError('FORBIDDEN', 'You can only delete your own comments.', 403);

  const { error } = await supabaseAdmin
    .from('person_item_comments')
    .update({ is_deleted: true })
    .eq('id', params.id);
  if (error) return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({ deleted: true });
}
