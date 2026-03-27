import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { randomUUID } from 'crypto';

// ─── POST /api/upload/presigned-url — Issue presigned URL [USER] ───

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const PresignedSchema = z.object({
  bucket: z.enum(['avatars', 'threads', 'persons', 'articles']),
  content_type: z.string().refine((v) => ALLOWED_TYPES.includes(v), {
    message: 'Unsupported file type.',
  }),
  file_size: z.number().max(MAX_SIZE, 'File size must be 5MB or less.'),
  thread_id: z.string().uuid().optional(),
  person_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', 'Login required.', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }

  const result = PresignedSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', 'Please check your input.', 422, result.error.issues);

  const { bucket, content_type, thread_id, person_id } = result.data;
  const ext = content_type === 'image/webp' ? 'webp' : content_type === 'image/png' ? 'png' : 'jpg';
  const fileId = randomUUID();

  let path: string;
  switch (bucket) {
    case 'avatars':
      path = `${user.id}/${fileId}.${ext}`;
      break;
    case 'threads':
      if (!thread_id)
        return apiError('VALIDATION_ERROR', 'thread_id is required.', 422);
      path = `${user.id}/${thread_id}/${fileId}.${ext}`;
      break;
    case 'persons':
      if (!person_id)
        return apiError('VALIDATION_ERROR', 'person_id is required.', 422);
      path = `${person_id}/${fileId}.${ext}`;
      break;
    case 'articles':
      path = `${user.id}/${fileId}.${ext}`;
      break;
  }

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error)
    return apiError('SERVER_ERROR', 'Failed to generate URL.', 500);

  return apiSuccess({
    upload_url: data.signedUrl,
    path,
    file_id: fileId,
  });
}
