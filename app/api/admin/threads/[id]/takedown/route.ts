import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { TakedownError, takedownThread, takedownThreadImage } from '@/lib/thread-takedown-server';

// ─── POST /api/admin/threads/:id/takedown — Copyright takedown (admin) ───
// body {}            → remove all image files + rows, soft-delete the thread
// body { image_id }  → remove one image file + row, keep the thread
// Unlike DELETE (soft delete), removed files can't be restored.

const ParamsSchema = z.object({ id: z.string().uuid() });
const BodySchema = z.object({ image_id: z.string().uuid().optional() }).strict();

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  const parsedParams = ParamsSchema.safeParse(params);
  if (!parsedParams.success) return apiError('VALIDATION_ERROR', '잘못된 스레드 ID입니다.', 422);

  let raw: unknown = {};
  const text = await request.text();
  if (text.trim()) {
    try {
      raw = JSON.parse(text);
    } catch {
      return apiError('VALIDATION_ERROR', '요청 본문이 올바른 JSON이 아닙니다.', 422);
    }
  }
  const body = BodySchema.safeParse(raw);
  if (!body.success) return apiError('VALIDATION_ERROR', '입력값을 확인해 주세요.', 422, body.error.flatten());

  const threadId = parsedParams.data.id;
  try {
    const result = body.data.image_id
      ? await takedownThreadImage(threadId, body.data.image_id)
      : await takedownThread(threadId);
    console.info('[takedown]', { admin: admin.id, threadId, imageId: body.data.image_id ?? null, removed: result.removed_files.length });
    return apiSuccess(result);
  } catch (e) {
    if (e instanceof TakedownError) return apiError(e.code, e.message, e.status);
    console.error('[takedown] failed', e);
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);
  }
}
