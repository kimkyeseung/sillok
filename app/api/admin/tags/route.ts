import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/admin/tags — All tags list [ADMIN] ───

export async function GET(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin)
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  const { data, error } = await supabaseAdmin
    .from('tags')
    .select('id, name_ko, name_en, type')
    .order('type')
    .order('name_ko');

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

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
    return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = CreateTagSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422);

  const { data, error } = await supabaseAdmin
    .from('tags')
    .insert(result.data)
    .select()
    .single();

  if (error) {
    if (error.code === '23505')
      return apiError('VALIDATION_ERROR', 'Tag already exists.', 409);
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
  }

  return apiSuccess(data);
}
