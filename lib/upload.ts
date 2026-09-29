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

/**
 * Upload a meme source image (admin) to the public 'memes' bucket.
 * Returns the public URL.
 */
export async function uploadMemeImage(file: Blob): Promise<string> {
  const presignedRes = await fetch('/api/upload/presigned-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ bucket: 'memes', content_type: file.type, file_size: file.size }),
  });
  const presignedJson = await presignedRes.json();
  if (!presignedJson.success) {
    throw new Error(presignedJson.error?.message || 'Failed to get upload URL');
  }

  const { upload_url, path } = presignedJson.data;
  const uploadRes = await fetch(upload_url, {
    method: 'PUT',
    headers: { 'Content-Type': file.type },
    body: file,
  });
  if (!uploadRes.ok) throw new Error('Failed to upload file');

  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/memes/${path}`;
}

/**
 * Re-encode an image as JPEG (≤ maxSide px) in the browser.
 * Meme sources can be webp/huge screenshots; the OG renderer needs jpeg/png.
 */
export async function toJpeg(
  file: File,
  maxSide = 1600
): Promise<{ blob: Blob; width: number; height: number }> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = () => reject(new Error('Could not read the image'));
      el.src = url;
    });
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    const width = Math.round(img.naturalWidth * scale);
    const height = Math.round(img.naturalHeight * scale);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas unavailable');
    ctx.fillStyle = '#ffffff'; // transparent PNGs → white, not black
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);
    const blob = await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Encoding failed'))), 'image/jpeg', 0.9)
    );
    return { blob, width, height };
  } finally {
    URL.revokeObjectURL(url);
  }
}
