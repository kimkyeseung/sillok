import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { UpdateMemeSchema, parseMemeContent } from '@/lib/meme';
import { loadFiguresBySlugs } from '@/lib/meme-data';
import { MemePublishError, hideMemeThread, syncMemeThread } from '@/lib/meme-publish';
import { MEME_COLUMNS, withFigures, type MemeRow } from '@/lib/meme-server';

const IdSchema = z.string().uuid();

// Rendering + storage upload on publish
export const maxDuration = 60;

// ─── PATCH /api/admin/memes/:id — Edit, publish (= post as a thread), unpublish [ADMIN] ───

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);
  if (!IdSchema.safeParse(params.id).success) return apiError('VALIDATION_ERROR', 'Invalid meme id.', 422);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }
  const parsed = UpdateMemeSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Please check your input.', 422, parsed.error.issues);
  const input = parsed.data;

  const { data: row } = await supabaseAdmin
    .from('memes')
    .select(MEME_COLUMNS)
    .eq('id', params.id)
    .eq('is_deleted', false)
    .maybeSingle();
  if (!row) return apiError('MEME_NOT_FOUND', 'Meme not found.', 404);
  const current = row as unknown as MemeRow;

  const update: Partial<MemeRow> = {};
  if (input.title !== undefined) update.title = input.title;
  if (input.content !== undefined) {
    const content = parseMemeContent(current.kind, current.format, input.content);
    if (!content) return apiError('VALIDATION_ERROR', 'Captions are empty or too long.', 422);
    update.content = content;
  }
  if (input.fact !== undefined) update.fact = input.fact || null;
  if (input.source_url !== undefined) update.source_url = input.source_url;
  if (input.source_credit !== undefined) update.source_credit = input.source_credit || null;
  if (input.person_slugs !== undefined) {
    // Template figures are fixed by the format; only translated memes pick their figures
    if (current.kind !== 'translated')
      return apiError('VALIDATION_ERROR', 'Figures of a template meme cannot be changed.', 422);
    const found = await loadFiguresBySlugs(input.person_slugs);
    const missing = input.person_slugs.filter((_, i) => !found[i]);
    if (missing.length) return apiError('PERSON_NOT_FOUND', `Figure not found: ${missing.join(', ')}`, 404);
    update.person_ids = found.map((f) => f!.id);
  }
  if (input.status !== undefined) update.status = input.status;

  const next: MemeRow = { ...current, ...update };
  const wasPublished = current.status === 'published';
  const isPublished = next.status === 'published';

  // Publishing (or editing a published meme) posts/updates its thread first,
  // so a failed render/upload leaves the meme unchanged
  if (isPublished) {
    try {
      update.thread_id = await syncMemeThread(next, admin.id);
    } catch (err) {
      if (err instanceof MemePublishError) return apiError('VALIDATION_ERROR', err.message, 422);
      console.error('[PATCH /api/admin/memes] publish failed:', err);
      return apiError('SERVER_ERROR', 'Could not post the meme thread.', 500);
    }
    if (!current.published_at) update.published_at = new Date().toISOString();
  } else if (wasPublished) {
    await hideMemeThread(current.thread_id);
  }

  const { data, error } = await supabaseAdmin
    .from('memes')
    .update(update)
    .eq('id', params.id)
    .select(MEME_COLUMNS)
    .single();
  if (error) return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  const [meme] = await withFigures([data as unknown as MemeRow]);
  return apiSuccess(meme);
}

// ─── DELETE /api/admin/memes/:id — Soft delete (and hide its thread) [ADMIN] ───

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);
  if (!IdSchema.safeParse(params.id).success) return apiError('VALIDATION_ERROR', 'Invalid meme id.', 422);

  const { data, error } = await supabaseAdmin
    .from('memes')
    .update({ is_deleted: true })
    .eq('id', params.id)
    .select('thread_id')
    .maybeSingle();
  if (error) return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
  await hideMemeThread(data?.thread_id ?? null);
  return apiSuccess({ id: params.id });
}
