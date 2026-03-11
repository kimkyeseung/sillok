import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── PUT /api/person-requests/:id/reject — 인물 추가 요청 거절 [ADMIN] ───

const RejectSchema = z.object({
  admin_note: z.string().max(500).optional(),
});

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', '관리자 권한이 필요합니다.', 403);

  let body = {};
  try {
    body = await request.json();
  } catch {
    // body 없이도 거절 가능
  }

  const result = RejectSchema.safeParse(body);
  const adminNote = result.success ? result.data.admin_note : undefined;

  const { data, error } = await supabaseAdmin
    .from('person_requests')
    .update({
      status: 'REJECTED',
      ...(adminNote && { admin_note: adminNote }),
    })
    .eq('id', params.id)
    .eq('status', 'PENDING')
    .select()
    .single();

  if (error || !data)
    return apiError('NODE_NOT_FOUND', '요청을 찾을 수 없습니다.', 404);

  await supabaseAdmin.from('notifications').insert({
    user_id: data.requested_by,
    type: 'REQUEST_REJECTED',
    title: '인물 추가 요청이 반려되었습니다',
    body: adminNote || `"${data.name_ko}" 요청이 반려되었습니다.`,
    link: null,
  });

  return apiSuccess(data);
}
