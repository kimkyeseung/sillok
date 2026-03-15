import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── POST /api/collections/:id/items — Add person to collection [OWNER] ───

const AddItemSchema = z.object({
  person_id: z.string().uuid(),
});

export async function POST(
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
    return apiError('FORBIDDEN', 'Unauthorized.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = AddItemSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  // Verify person exists
  const { data: person } = await supabaseAdmin
    .from('persons')
    .select('id')
    .eq('id', result.data.person_id)
    .eq('is_deleted', false)
    .single();

  if (!person)
    return apiError('PERSON_NOT_FOUND', 'Person not found.', 404);

  const { data, error } = await supabaseAdmin
    .from('collection_items')
    .insert({
      collection_id: params.id,
      person_id: result.data.person_id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505')
      return apiError('VALIDATION_ERROR', 'Person already added.', 409);
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
  }

  return apiSuccess(data);
}

// ─── DELETE /api/collections/:id/items — Remove person from collection [OWNER] ───

const RemoveItemSchema = z.object({
  person_id: z.string().uuid(),
});

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
    return apiError('FORBIDDEN', 'Unauthorized.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = RemoveItemSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { error } = await supabaseAdmin
    .from('collection_items')
    .delete()
    .eq('collection_id', params.id)
    .eq('person_id', result.data.person_id);

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({ removed: true });
}
