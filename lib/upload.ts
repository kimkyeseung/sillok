/**
 * Upload an image file to Supabase Storage via presigned URL.
 * Returns the public URL of the uploaded file.
 */
export async function uploadPersonImage(
  file: File,
  personId: string
): Promise<string> {
  // 1. Get presigned URL
  const presignedRes = await fetch('/api/upload/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bucket: 'persons',
      content_type: file.type,
      file_size: file.size,
      person_id: personId,
    }),
  });
  const presignedJson = await presignedRes.json();
  if (!presignedJson.success) {
    throw new Error(presignedJson.error?.message || 'Failed to get upload URL');
  }

  const { upload_url, path } = presignedJson.data;

  // 2. Upload file to Supabase Storage
  const uploadRes = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!uploadRes.ok) {
    throw new Error('Failed to upload file');
  }

  // 3. Construct public URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  return `${supabaseUrl}/storage/v1/object/public/persons/${path}`;
}
