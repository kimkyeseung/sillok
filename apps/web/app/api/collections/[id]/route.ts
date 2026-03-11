import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/collections/:id — 컬렉션 상세 (공개이면 누구나, 비공개면 OWNER) ───

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
    return apiError('NODE_NOT_FOUND', '컬렉션을 찾을 수 없습니다.', 404);

  if (!collection.is_public) {
    const user = await requireUser(request);
    if (!user || user.id !== collection.user_id)
      return apiError('FORBIDDEN', '비공개 컬렉션입니다.', 403);
  }

  return apiSuccess(collection);
}

// ─── PUT /api/collections/:id — 컬렉션 수정 [OWNER] ───

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
    return apiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

  const { data: collection } = await supabaseAdmin
    .from('collections')
    .select('id, user_id')
    .eq('id', params.id)
    .single();

  if (!collection)
    return apiError('NODE_NOT_FOUND', '컬렉션을 찾을 수 없습니다.', 404);
  if (collection.user_id !== user.id)
    return apiError('FORBIDDEN', '수정 권한이 없습니다.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', '유효한 JSON이 아닙니다.', 422);
  }

  const result = UpdateSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  const { data, error } = await supabaseAdmin
    .from('collections')
    .update(result.data)
    .eq('id', params.id)
    .select()
    .single();

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess(data);
}

// ─── DELETE /api/collections/:id — 컬렉션 삭제 [OWNER] ───

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
    return apiError('FORBIDDEN', '삭제 권한이 없습니다.', 403);

  await supabaseAdmin
    .from('collection_items')
    .delete()
    .eq('collection_id', params.id);

  const { error } = await supabaseAdmin
    .from('collections')
    .delete()
    .eq('id', params.id);

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess({ deleted: true });
}
