import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser, requireActiveUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';

// ─── GET /api/profile — My profile [USER] ───
// ─── PUT /api/profile — Update my nickname / avatar [USER] ───
// Only nickname and avatar_url are writable here. role / is_banned are admin-only.

const UpdateProfileSchema = z
  .object({
    nickname: z.string().trim().min(1).max(30).optional(),
    avatar_url: z.string().url().max(500).optional(),
  })
  .refine((v) => v.nickname !== undefined || v.avatar_url !== undefined, {
    message: 'Nothing to update.',
  });

export async function GET(request: Request) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .select('nickname, avatar_url')
    .eq('id', user.id)
    .maybeSingle();

  if (error)
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);

  return apiSuccess({
    nickname: data?.nickname ?? null,
    avatar_url: data?.avatar_url ?? null,
  });
}

export async function PUT(request: Request) {
  const { user, error: authError } = await requireActiveUser(request);
  if (authError) return authError;

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = UpdateProfileSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422, result.error.issues);

  const { nickname, avatar_url } = result.data;

  // Avatar must point to this user's own folder in the avatars bucket
  if (avatar_url !== undefined) {
    const allowedPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/avatars/${user.id}/`;
    if (!avatar_url.startsWith(allowedPrefix))
      return apiError('VALIDATION_ERROR', 'Invalid avatar URL.', 422);
  }

  const { data, error } = await supabaseAdmin
    .from('profiles')
    .update({
      ...(nickname !== undefined && { nickname }),
      ...(avatar_url !== undefined && { avatar_url }),
    })
    .eq('id', user.id)
    .select('nickname, avatar_url')
    .single();

  if (error) {
    if (error.code === '23505')
      return apiError('DUPLICATE_NICKNAME', 'This nickname is already taken.', 409);
    return apiError('SERVER_ERROR', 'An error occurred while processing.', 500);
  }

  return apiSuccess(data);
}
