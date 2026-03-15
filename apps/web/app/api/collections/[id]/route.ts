import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/collections/:id — Collection detail (public: anyone, private: OWNER) ───

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const { data: collection, error } = await supabaseAdmin
    .from('collections')
    .select(
      `
      id, title, description, is_public, item_count, created_at, user_id,
      profiles!collections_user_id_fkey ( nickname, avatar_url ),
      collection_items (
        id, person_id, added_at,
        persons!collection_items_person_id_fkey ( slug, name_ko, thumbnail )
      )
    `
    )
    .eq('id', params.id)
    .single();

  if (error || !collection)
    return apiError('NODE_NOT_FOUND', 'Collection not found.', 404);

  if (!collection.is_public) {
    const user = await requireUser(request);
    if (!user || user.id !== collection.user_id)
      return apiError('FORBIDDEN', 'This collection is private.', 403);
  }

  return apiSuccess(collection);
}

// ─── PUT /api/collections/:id — Update collection [OWNER] ───

const UpdateSchema = z.object({
  title: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  is_public: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  const { data: collection } = await supabaseAdmin
    .from('collections')
    .select('id, user_id')
    .eq('id', params.id)
    .single();

  if (!collection)
    return apiError('NODE_NOT_FOUND', 'Collection not found.', 404);
  if (collection.user_id !== user.id)
    return apiError('FORBIDDEN', 'No permission to edit.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = UpdateSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { data, error } = await supabaseAdmin
    .from('collections')
    .update(result.data)
    .eq('id', params.id)
    .select()
    .single();

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess(data);
}

// ─── DELETE /api/collections/:id — Delete collection [OWNER] ───

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  const { data: collection } = await supabaseAdmin
    .from('collections')
    .select('id, user_id')
    .eq('id', params.id)
    .single();

  if (!collection)
    return apiError('NODE_NOT_FOUND', 'Collection not found.', 404);
  if (collection.user_id !== user.id)
    return apiError('FORBIDDEN', 'No permission to delete.', 403);

  await supabaseAdmin
    .from('collection_items')
    .delete()
    .eq('collection_id', params.id);

  const { error } = await supabaseAdmin
    .from('collections')
    .delete()
    .eq('id', params.id);

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({ deleted: true });
}
