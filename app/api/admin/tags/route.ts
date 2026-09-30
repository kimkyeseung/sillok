import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/admin/tags — All tags list [ADMIN] ───

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  const { data, error } = await supabaseAdmin
    .from('tags')
    .select('id, name_ko, name_en, type')
    .order('type')
    .order('name_ko');

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess(data ?? []);
}

// ─── POST /api/admin/tags — Create tag [ADMIN] ───

const CreateTagSchema = z.object({
  name_ko: z.string().min(1).max(50),
  name_en: z.string().max(50).optional(),
  type: z.enum(['ERA', 'FIELD', 'CUSTOM']),
});

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'JSON 형식이 올바르지 않습니다.', 422);
  }

  const result = CreateTagSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해 주세요.', 422);

  const { data, error } = await supabaseAdmin
    .from('tags')
    .insert(result.data)
    .select()
    .single();

  if (error) {
    if (error.code === '23505')
      return apiError('VALIDATION_ERROR', '이미 있는 태그입니다.', 409);
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);
  }

  return apiSuccess(data);
}
