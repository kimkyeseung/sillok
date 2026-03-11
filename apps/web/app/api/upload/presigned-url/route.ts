import { z } from 'zod';
import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireUser } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { randomUUID } from 'crypto';

// ─── POST /api/upload/presigned-url — Presigned URL 발급 [USER] ───

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 5 * 1024 * 1024; // 5MB

const PresignedSchema = z.object({
  bucket: z.enum(['avatars', 'threads', 'persons']),
  content_type: z.string().refine((v) => ALLOWED_TYPES.includes(v), {
    message: '허용되지 않는 파일 형식입니다.',
  }),
  file_size: z.number().max(MAX_SIZE, '파일 크기는 5MB 이하여야 합니다.'),
  thread_id: z.string().uuid().optional(),
  person_id: z.string().uuid().optional(),
});

export async function POST(request: Request) {
  const user = await requireUser(request);
  if (!user)
    return apiError('UNAUTHORIZED', '로그인이 필요합니다.', 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', '유효한 JSON이 아닙니다.', 422);
  }

  const result = PresignedSchema.safeParse(body);
  if (!result.success)
    return apiError('VALIDATION_ERROR', '입력값을 확인해주세요.', 422, result.error.issues);

  const { bucket, content_type, thread_id, person_id } = result.data;
  const ext = content_type === 'image/webp' ? 'webp' : content_type === 'image/png' ? 'png' : 'jpg';
  const fileId = randomUUID();

  let path: string;
  switch (bucket) {
    case 'avatars':
      path = `avatars/${user.id}/${fileId}.${ext}`;
      break;
    case 'threads':
      if (!thread_id)
        return apiError('VALIDATION_ERROR', 'thread_id가 필요합니다.', 422);
      path = `threads/${user.id}/${thread_id}/${fileId}.${ext}`;
      break;
    case 'persons':
      if (!person_id)
        return apiError('VALIDATION_ERROR', 'person_id가 필요합니다.', 422);
      path = `persons/${person_id}/${fileId}.${ext}`;
      break;
  }

  const { data, error } = await supabaseAdmin.storage
    .from(bucket)
    .createSignedUploadUrl(path);

  if (error)
    return apiError('SERVER_ERROR', 'URL 생성에 실패했습니다.', 500);

  return apiSuccess({
    upload_url: data.signedUrl,
    path,
    file_id: fileId,
  });
}
