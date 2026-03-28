import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/admin/curators — List curator roles [ADMIN] ───

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { searchParams } = new URL(request.url);
  const activeOnly = searchParams.get('active_only') === 'true';

  let query = supabaseAdmin
    .from('curator_roles')
    .select('id, user_id, role_type, role_value, granted_by, granted_at, is_active, profiles!curator_roles_user_id_fkey ( nickname, avatar_url )')
    .order('granted_at', { ascending: false });

  if (activeOnly) query = query.eq('is_active', true);

  const { data, error } = await query;
  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess(data ?? []);
}

// ─── POST /api/admin/curators — Grant curator role [ADMIN] ───

const GrantCuratorSchema = z.object({
  user_id: z.string().uuid(),
  role_type: z.enum(['era', 'field', 'global']),
  role_value: z.string().min(1).max(100),
});

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = GrantCuratorSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422, result.error.issues);

  const { data, error } = await supabaseAdmin
    .from('curator_roles')
    .insert({
      ...result.data,
      granted_by: admin.id,
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505')
      return apiError('VALIDATION_ERROR', 'Curator role already exists for this user.', 409);
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
  }

  return apiSuccess(data);
}
