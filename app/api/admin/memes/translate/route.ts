import { apiError, apiSuccess } from '@/lib/api-helpers';
import { requireAdmin } from '@/lib/auth';
import { TranslateMemeSchema, isMemeBucketUrl } from '@/lib/meme';
import { translateMemeImage } from '@/lib/meme-ai';
import { loadFiguresBySlugs } from '@/lib/meme-data';
import { insertMeme, memeAiErrorResponse, withFigures } from '@/lib/meme-server';

export const maxDuration = 120;

// ─── POST /api/admin/memes/translate — Translate an uploaded Korean meme [ADMIN] ───
// The image must already be in the public 'memes' bucket (presigned upload).
// Creates a 'translated' draft whose boxes the admin can adjust before publishing.

export async function POST(request: Request) {
  const admin = await requireAdmin(request);
  if (!admin) return apiError('ADMIN_REQUIRED', 'Admin access required.', 403);

  let body;
  try {
    body = await request.json();
  } catch {
    return apiError('VALIDATION_ERROR', 'Invalid JSON.', 422);
  }
  const parsed = TranslateMemeSchema.safeParse(body);
  if (!parsed.success) return apiError('VALIDATION_ERROR', 'Please check your input.', 422, parsed.error.issues);
  const input = parsed.data;

  if (!isMemeBucketUrl(input.image_url, process.env.NEXT_PUBLIC_SUPABASE_URL))
    return apiError('VALIDATION_ERROR', 'Upload the image to the memes bucket first.', 422);

  // Figures the thread will be posted under (can also be set later in the editor)
  const found = input.person_slugs?.length ? await loadFiguresBySlugs(input.person_slugs) : [];
  const missing = (input.person_slugs ?? []).filter((_, i) => !found[i]);
  if (missing.length) return apiError('PERSON_NOT_FOUND', `Figure not found: ${missing.join(', ')}`, 404);

  try {
    const { boxes, title, summary, creditHint } = await translateMemeImage(input.image_url);
    const meme = await insertMeme({
      kind: 'translated',
      format: 'translated',
      title: title || null,
      person_ids: found.map((f) => f!.id),
      content: { boxes },
      fact: summary || null,
      source_image_url: input.image_url,
      source_width: input.width,
      source_height: input.height,
      source_url: input.source_url ?? null,
      source_credit: input.source_credit || creditHint || null,
      created_by: admin.id,
    });
    return apiSuccess({ created: await withFigures([meme]), skipped: 0 });
  } catch (err) {
    return memeAiErrorResponse(err);
  }
}
