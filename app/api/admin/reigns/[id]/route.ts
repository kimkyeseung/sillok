import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { revalidateAgeFlow } from '@/lib/age-flow-data';
import { ReignSchema, ReignIdSchema, findPersonId } from '@/lib/reigns';

// ─── PUT /api/admin/reigns/:id — Update reign [ADMIN] ───

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  if (!ReignIdSchema.safeParse(params.id).success)
    return apiError('VALIDATION_ERROR', '재위 ID가 올바르지 않습니다.', 422);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'JSON 형식이 올바르지 않습니다.', 422);
  }

  const result = ReignSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해 주세요.', 422, result.error.issues);

  const personId = await findPersonId(result.data.person_slug);
  if (!personId) return apiError('PERSON_NOT_FOUND', '인물을 찾을 수 없습니다.', 404);

  const { data, error } = await supabaseAdmin
    .from('reigns')
    .update({ person_id: personId, reign_start: result.data.reign_start, reign_end: result.data.reign_end })
    .eq('id', params.id)
    .select()
    .maybeSingle();

  if (error) {
    if (error.code === '23505')
      return apiError('VALIDATION_ERROR', '이미 등록된 재위입니다.', 409);
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);
  }
  if (!data) return apiError('NOT_FOUND', '재위를 찾을 수 없습니다.', 404);

  revalidateAgeFlow();
  return apiSuccess(data);
}

// ─── DELETE /api/admin/reigns/:id — Delete reign [ADMIN] ───

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  if (!ReignIdSchema.safeParse(params.id).success)
    return apiError('VALIDATION_ERROR', '재위 ID가 올바르지 않습니다.', 422);

  const { data, error } = await supabaseAdmin
    .from('reigns')
    .delete()
    .eq('id', params.id)
    .select('id');

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);
  if (!data || data.length === 0) return apiError('NOT_FOUND', '재위를 찾을 수 없습니다.', 404);

  revalidateAgeFlow();
  return apiSuccess({ deleted: true });
}
