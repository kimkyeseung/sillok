import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireActiveUser, requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { generateThumbnails } from '@/lib/thumbnails';

// ─── POST /api/upload/complete — Generate thumbnails for an uploaded image [USER] ───
// Called by the browser right after the PUT to the presigned URL.

export const maxDuration = 60;

const ADMIN_BUCKETS: string[] = ['persons', 'articles'];

const CompleteSchema = z.object({
  bucket: z.enum(['avatars', 'threads', 'persons', 'articles']),
  // The path issued by /api/upload/presigned-url: uuid folders + "<uuid>.<ext>"
  path: z
    .string()
    .max(300)
    .regex(/^[A-Za-z0-9-]+(\/[A-Za-z0-9-]+)*\/[A-Za-z0-9-]+\.(jpg|png|webp)$/),
});

export async function POST(request: Request) {
  const { user, error: authError } = await requireActiveUser(request);
  if (authError) return authError;

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = CompleteSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422, result.error.issues);

  const { bucket, path } = result.data;

  if (ADMIN_BUCKETS.includes(bucket)) {
    if (!(await requireAdmin(request)))
      return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);
  }
  // Outside the persons bucket every upload lives in the uploader's own folder
  if (bucket !== 'persons' && !path.startsWith(`${user.id}/`))
    return apiError('FORBIDDEN', 'You can only process your own uploads.', 403);

  try {
    const count = await generateThumbnails(supabaseAdmin, bucket, path);
    return apiSuccess({ thumbnails: count });
  } catch (e) {
    console.error(e);
    return apiError('SERVER_ERROR', 'Failed to generate thumbnails.', 500);
  }
}
