import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PATCH /api/admin/suggestions/:id — Approve / reject { status, admin_note? } [ADMIN] ───
// Approving only marks the suggestion; the editor adds the content via the page content editor.

const ReviewSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED']),
  admin_note: z.string().trim().max(500).optional(),
});

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);
  if (!z.string().uuid().safeParse(params.id).success)
    return apiError('VALIDATION_ERROR', '제안 ID가 올바르지 않습니다.', 422);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'JSON 형식이 올바르지 않습니다.', 422);
  }
  const parsed = ReviewSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION_ERROR', '입력값을 확인해 주세요.', 422);

  const { data, error } = await supabaseAdmin
    .from('person_suggestions')
    .update({
      status: parsed.data.status,
      admin_note: parsed.data.admin_note ?? null,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', params.id)
    .select('id, status')
    .maybeSingle();
  if (error) return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);
  if (!data) return apiError('NOT_FOUND', '제안을 찾을 수 없습니다.', 404);

  return apiSuccess(data);
}
