import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/admin/timelines/:id — Update timeline entry [ADMIN] ───

const UpdateTimelineSchema = z.object({
  year: z.number().int().optional(),
  month: z.number().int().min(1).max(12).optional().nullable(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(5000).optional().nullable(),
  sort_order: z.number().int().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'JSON 형식이 올바르지 않습니다.', 422);
  }

  const result = UpdateTimelineSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해 주세요.', 422);

  const { data, error } = await supabaseAdmin
    .from('person_timeline')
    .update(result.data)
    .eq('id', params.id)
    .select()
    .single();

  if (error || !data)
    return apiError('NODE_NOT_FOUND', '타임라인 항목을 찾을 수 없습니다.', 404);

  return apiSuccess(data);
}

// ─── DELETE /api/admin/timelines/:id — Delete timeline entry [ADMIN] ───

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  const { error } = await supabaseAdmin
    .from('person_timeline')
    .delete()
    .eq('id', params.id);

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess({ deleted: true });
}
