import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── POST /api/collections/:id/items — 컬렉션에 인물 추가 [OWNER] ───

const AddItemSchema = z.object({
  person_id: z.string().uuid(),
});

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

  const { data: collection } = await supabaseAdmin
    .from('collections')
    .select('id, user_id')
    .eq('id', params.id)
    .single();

  if (!collection)
    return apiError('NODE_NOT_FOUND', '컬렉션을 찾을 수 없습니다.', 404);
  if (collection.user_id !== user.id)
    return apiError('FORBIDDEN', '권한이 없습니다.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', '유효한 JSON이 아닙니다.', 422);
  }

  const result = AddItemSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  // 인물 존재 확인
  const { data: person } = await supabaseAdmin
    .from('persons')
    .select('id')
    .eq('id', result.data.person_id)
    .eq('is_deleted', false)
    .single();

  if (!person)
    return apiError('PERSON_NOT_FOUND', '인물을 찾을 수 없습니다.', 404);

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
      return apiError('VALIDATION_ERROR', '이미 추가된 인물입니다.', 409);
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);
  }

  return apiSuccess(data);
}

// ─── DELETE /api/collections/:id/items — 컬렉션에서 인물 제거 [OWNER] ───

const RemoveItemSchema = z.object({
  person_id: z.string().uuid(),
});

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

  const { data: collection } = await supabaseAdmin
    .from('collections')
    .select('id, user_id')
    .eq('id', params.id)
    .single();

  if (!collection)
    return apiError('NODE_NOT_FOUND', '컬렉션을 찾을 수 없습니다.', 404);
  if (collection.user_id !== user.id)
    return apiError('FORBIDDEN', '권한이 없습니다.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', '유효한 JSON이 아닙니다.', 422);
  }

  const result = RemoveItemSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  const { error } = await supabaseAdmin
    .from('collection_items')
    .delete()
    .eq('collection_id', params.id)
    .eq('person_id', result.data.person_id);

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess({ removed: true });
}
