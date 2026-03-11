import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/nodes/:slug — 노드 상세 (공개) ───

export async function GET(
  _request: Request,
  { params }: { params: { slug: string } }
) {
  const { data: node, error } = await supabaseAdmin
    .from('nodes')
    .select('*')
    .eq('slug', params.slug)
    .eq('is_deleted', false)
    .single();

  if (error || !node)
    return apiError('NODE_NOT_FOUND', '노드를 찾을 수 없습니다.', 404);

  return apiSuccess(node);
}

// ─── PUT /api/nodes/:slug — 노드 수정 [ADMIN] ───

const UpdateNodeSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9-]+$/).optional(),
  title: z.string().min(1).max(300).optional(),
  description: z.string().max(10000).optional().nullable(),
  thumbnail: z.string().url().optional().nullable(),
  metadata: z.record(z.unknown()).optional().nullable(),
  is_published: z.boolean().optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', '유효한 JSON이 아닙니다.', 422);
  }

  const result = UpdateNodeSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422);

  const { data: updated, error } = await supabaseAdmin
    .from('nodes')
    .update(result.data)
    .eq('slug', params.slug)
    .eq('is_deleted', false)
    .select()
    .single();

  if (error || !updated)
    return apiError('NODE_NOT_FOUND', '노드를 찾을 수 없습니다.', 404);

  return apiSuccess(updated);
}

// ─── DELETE /api/nodes/:slug — 노드 soft delete [ADMIN] ───

export async function DELETE(
  request: Request,
  { params }: { params: { slug: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  const { error } = await supabaseAdmin
    .from('nodes')
    .update({ is_deleted: true })
    .eq('slug', params.slug)
    .eq('is_deleted', false);

  if (error)
    return apiError('SERVER_ERROR', '처리 중 오류가 발생했습니다.', 500);

  return apiSuccess({ deleted: true });
}
