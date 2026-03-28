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
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { data, error } = await supabaseAdmin
    .from('person_node_links')
    .select('id, link_type, persons ( id, slug, name_en, thumbnail )')
    .eq('node_id', params.id);

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

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
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = AddMemberSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

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
      return apiError('VALIDATION_ERROR', 'Person already linked.', 409);
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
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
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = RemoveMemberSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { error } = await supabaseAdmin
    .from('person_node_links')
    .delete()
    .eq('node_id', params.id)
    .eq('person_id', result.data.person_id);

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({ deleted: true });
}
