import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/threads/:id — Thread detail (public) ───

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
    return apiError('THREAD_NOT_FOUND', 'Thread not found.', 404);

  return apiSuccess(thread);
}

// ─── PUT /api/threads/:id — Update thread [OWNER] ───

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
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  const { data: thread } = await supabaseAdmin
    .from('threads')
    .select('id, author_id')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single();

  if (!thread)
    return apiError('THREAD_NOT_FOUND', 'Thread not found.', 404);
  if (thread.author_id !== user.id)
    return apiError('FORBIDDEN', 'No permission to edit.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = UpdateThreadSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { image_ids, ...updateData } = result.data;

  if (Object.keys(updateData).length > 0) {
    const { error } = await supabaseAdmin
      .from('threads')
      .update(updateData)
      .eq('id', params.id);

    if (error)
      return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
  }

  // Replace images
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

// ─── DELETE /api/threads/:id — Soft delete thread [OWNER|ADMIN] ───

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  const { data: thread } = await supabaseAdmin
    .from('threads')
    .select('id, author_id')
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single();

  if (!thread)
    return apiError('THREAD_NOT_FOUND', 'Thread not found.', 404);

  // Check OWNER or ADMIN
  if (thread.author_id !== user.id) {
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'ADMIN')
      return apiError('FORBIDDEN', 'No permission to delete.', 403);
  }

  const { error } = await supabaseAdmin
    .from('threads')
    .update({ is_deleted: true })
    .eq('id', params.id);

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({ deleted: true });
}
