import { ImageResponse } from 'next/og';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { PROMO_SLIDES, SLIDE_SIZE, type PromoSlide } from '@/lib/promo';
import { loadPromoThread } from '@/lib/promo-data';
import { renderPromoSlide } from '@/components/promo/PromoSlides';

// ─── GET /api/og/promo/:threadId?slide=cover|history|cta — Instagram slide PNG [ADMIN] ───
// ?download=1 → attachment (sillok-<slide>.png)

const IdSchema = z.string().uuid();
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;

/**
 * Fetch the thread image as a data URI so a slow/broken/unsupported image
 * (external URLs, webp) falls back to a text cover instead of failing the render.
 */
async function imageDataUri(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(6000) });
    const type = res.headers.get('content-type')?.split(';')[0] ?? '';
    if (!res.ok || !['image/png', 'image/jpeg'].includes(type)) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > MAX_IMAGE_BYTES) return null;
    return `data:${type};base64,${buf.toString('base64')}`;
  } catch {
    return null;
  }
}

export async function GET(request: Request, { params }: { params: { threadId: string } }) {
  if (!IdSchema.safeParse(params.threadId).success) return new Response('Not found', { status: 404 });
  if (!(await requireAdmin(request))) return new Response('Not found', { status: 404 });

  const url = new URL(request.url);
  const slide = (url.searchParams.get('slide') ?? 'cover') as PromoSlide;
  if (!PROMO_SLIDES.includes(slide)) return new Response('Unknown slide', { status: 422 });

  const thread = await loadPromoThread(params.threadId);
  if (!thread) return new Response('Not found', { status: 404 });

  const image = slide === 'cover' && thread.image ? await imageDataUri(thread.image.url) : null;
  return new ImageResponse(renderPromoSlide(slide, thread, image), {
    ...SLIDE_SIZE,
    headers: {
      'Cache-Control': 'private, no-store',
      ...(url.searchParams.get('download') && { 'Content-Disposition': `attachment; filename="sillok-${slide}.png"` }),
    },
  });
}
