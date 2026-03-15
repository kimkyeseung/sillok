import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/replies/:id — Update reply [OWNER] ───

const UpdateReplySchema = z.object({
  content: z.string().min(1).max(5000),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  const { data: reply } = await supabaseAdmin
    .from('thread_replies')
    .select('id, author_id')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single();

  if (!reply)
    return apiError('THREAD_NOT_FOUND', 'Reply not found.', 404);
  if (reply.author_id !== user.id)
    return apiError('FORBIDDEN', 'No permission to edit.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = UpdateReplySchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { data: updated, error } = await supabaseAdmin
    .from('thread_replies')
    .update({ content: result.data.content })
    .eq('id', params.id)
    .select()
    .single();

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess(updated);
}

// ─── DELETE /api/replies/:id — Soft delete reply [OWNER|ADMIN] ───

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  const { data: reply } = await supabaseAdmin
    .from('thread_replies')
    .select('id, author_id')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single();

  if (!reply)
    return apiError('THREAD_NOT_FOUND', 'Reply not found.', 404);

  if (reply.author_id !== user.id) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN')
      return apiError('FORBIDDEN', 'No permission to delete.', 403);
  }

  const { error } = await supabaseAdmin
    .from('thread_replies')
    .update({ is_deleted: true })
    .eq('id', params.id);

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({ deleted: true });
}
