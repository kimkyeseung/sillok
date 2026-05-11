import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { normalizeThreadFigures, uniqueFigureIds } from '@/lib/thread-figures';

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
      persons!threads_person_id_fkey ( id, slug, name_en, name_ko, thumbnail ),
      thread_images ( id, url, sort_order ),
      thread_persons ( person_id, is_primary, sort_order, persons ( id, slug, name_en, name_ko, thumbnail ) )
    `
    )
    .eq('id', params.id)
    .eq('is_deleted', false)
    .single();

  if (error || !thread)
    return apiError('THREAD_NOT_FOUND', 'Thread not found.', 404);

  return apiSuccess(normalizeThreadFigures(thread));
}

// ─── PUT /api/threads/:id — Update thread [OWNER] ───

const UpdateThreadSchema = z.object({
  figures: z.array(z.string().uuid()).min(1).max(6).optional(),
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

  const { figures, image_ids, ...updateData } = result.data;

  if (figures !== undefined) {
    const figureIds = uniqueFigureIds(figures);
    const primaryPersonId = figureIds[0];

    const { data: people } = await supabaseAdmin
      .from('persons')
      .select('id')
      .in('id', figureIds)
      .eq('is_deleted', false);

    if ((people?.length ?? 0) !== figureIds.length)
      return apiError('PERSON_NOT_FOUND', 'Figure not found.', 404);

    await supabaseAdmin
      .from('threads')
      .update({ person_id: primaryPersonId })
      .eq('id', params.id);

    await supabaseAdmin
      .from('thread_persons')
      .delete()
      .eq('thread_id', params.id);

    await supabaseAdmin.from('thread_persons').insert(
      figureIds.map((pid, index) => ({
        thread_id: params.id,
        person_id: pid,
        is_primary: index === 0,
        sort_order: index,
      }))
    );
  }

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
    .select(
      `*,
       persons!threads_person_id_fkey ( id, slug, name_en, name_ko, thumbnail ),
       thread_persons ( person_id, is_primary, sort_order, persons ( id, slug, name_en, name_ko, thumbnail ) )`
    )
    .eq('id', params.id)
    .single();

  return apiSuccess(updated ? normalizeThreadFigures(updated) : updated);
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
