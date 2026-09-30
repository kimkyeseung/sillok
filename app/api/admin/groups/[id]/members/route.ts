import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/admin/groups/:id/members — List linked persons [ADMIN] ───

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  const { data, error } = await supabaseAdmin
    .from('person_node_links')
    .select('id, link_type, persons ( id, slug, name_en, thumbnail )')
    .eq('node_id', params.id);

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess(data ?? []);
}

// ─── POST /api/admin/groups/:id/members — Add person link [ADMIN] ───

const AddMemberSchema = z.object({
  person_id: z.string().uuid(),
  link_type: z.string().max(50).optional(),
});

export async function POST(
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

  const result = AddMemberSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해 주세요.', 422);

  const { data, error } = await supabaseAdmin
    .from('person_node_links')
    .insert({
      person_id: result.data.person_id,
      node_id: params.id,
      link_type: result.data.link_type ?? null,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505')
      return apiError('VALIDATION_ERROR', '이미 연결된 인물입니다.', 409);
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);
  }

  return apiSuccess(data);
}

// ─── DELETE /api/admin/groups/:id/members — Remove person link [ADMIN] ───

const RemoveMemberSchema = z.object({
  person_id: z.string().uuid(),
});

export async function DELETE(
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

  const result = RemoveMemberSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해 주세요.', 422);

  const { error } = await supabaseAdmin
    .from('person_node_links')
    .delete()
    .eq('node_id', params.id)
    .eq('person_id', result.data.person_id);

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess({ deleted: true });
}
