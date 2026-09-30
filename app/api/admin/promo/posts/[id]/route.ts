import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { PromoPostEditSchema } from '@/lib/promo';
import { PROMO_POST_COLUMNS } from '@/lib/promo-data';

const IdSchema = z.string().uuid();

// ─── PATCH /api/admin/promo/posts/:id — Edit copy, mark posted (posted_url) or back to draft [ADMIN] ───

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);
  if (!IdSchema.safeParse(params.id).success) return apiError('VALIDATION_ERROR', 'ID가 올바르지 않습니다.', 422);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'JSON 형식이 올바르지 않습니다.', 422);
  }
  const parsed = PromoPostEditSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION_ERROR', '입력값을 확인해 주세요.', 422, parsed.error.issues);
  const { posted_url, target, ...fields } = parsed.data;

  const update: Record<string, unknown> = { ...fields };
  if (target !== undefined) update.target = target ? target.replace(/^r\//i, '') : null;
  if (posted_url !== undefined) {
    update.posted_url = posted_url;
    update.status = posted_url ? 'posted' : 'draft';
    update.posted_at = posted_url ? new Date().toISOString() : null;
  }

  const { data, error } = await supabaseAdmin
    .from('promo_posts')
    .update(update)
    .eq('id', params.id)
    .eq('is_deleted', false)
    .select(PROMO_POST_COLUMNS)
    .maybeSingle();
  if (error) return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);
  if (!data) return apiError('NOT_FOUND', '게시물을 찾을 수 없습니다.', 404);
  return apiSuccess(data);
}

// ─── DELETE /api/admin/promo/posts/:id — Soft delete [ADMIN] ───

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);
  if (!IdSchema.safeParse(params.id).success) return apiError('VALIDATION_ERROR', 'ID가 올바르지 않습니다.', 422);

  const { error } = await supabaseAdmin.from('promo_posts').update({ is_deleted: true }).eq('id', params.id);
  if (error) return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);
  return apiSuccess({ id: params.id });
}
