/**
 * next/image custom loader — resizing is delegated to the image host instead of
 * Vercel image optimization (Hobby quota exhausted → 402).
 *
 * - Supabase Storage public objects → the WebP thumbnail pre-generated at upload
 *   (`lib/thumbnails.ts`). Not Storage image transformations: those are billed per
 *   origin image. A missing thumbnail falls back to the original in the browser
 *   (`components/common/ThumbnailFallback`).
 * - Wikimedia Commons originals → Wikimedia thumbnails, small sizes only (see below).
 * - Anything else (YouTube, Google avatars, heritage hosts, local files) → unchanged.
 */

import { THUMB_BUCKET, hasThumbnails, thumbObjectPath, thumbStep } from './thumbnail-paths';

interface LoaderArgs {
  src: string;
  width: number;
  quality?: number;
}

const SUPABASE_OBJECT = /^(https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1)\/object\/public\/(.+)$/;

const WIKIMEDIA_ORIGINAL = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/[a-z]+)\/([0-9a-f]\/[0-9a-f]{2})\/([^/?#]+\.(?:jpe?g|png))$/i;
/**
 * Wikimedia only serves these thumbnail widths (others → 400) and refuses a
 * thumbnail wider than the original. Originals narrower than 250px are rare, so
 * thumbnails are used up to that step; larger requests keep the original.
 */
const WIKIMEDIA_STEPS = [20, 40, 60, 120, 250];
/** next/image asks for 256 for a 128px slot on a 2x screen — close enough to the 250 step */
const WIKIMEDIA_MAX_REQUEST = 256;

export default function imageLoader({ src, width }: LoaderArgs): string {
  const supabase = SUPABASE_OBJECT.exec(src);
  if (supabase) {
    const [object, query] = supabase[2].split('?');
    const slash = object.indexOf('/');
    const bucket = object.slice(0, slash);
    const path = object.slice(slash + 1);
    if (slash < 0 || !hasThumbnails(bucket, path)) return src;
    // An existing query (cache-buster) is kept so a replaced image is refetched
    const thumb = thumbObjectPath(bucket, path, thumbStep(width));
    return `${supabase[1]}/object/public/${THUMB_BUCKET}/${thumb}${query ? `?${query}` : ''}`;
  }

  const wikimedia = WIKIMEDIA_ORIGINAL.exec(src);
  if (wikimedia && width <= WIKIMEDIA_MAX_REQUEST) {
    const [, base, hash, file] = wikimedia;
    const step = WIKIMEDIA_STEPS.find((s) => s >= width) ?? WIKIMEDIA_STEPS[WIKIMEDIA_STEPS.length - 1];
    return `${base}/thumb/${hash}/${file}/${step}px-${file}`;
  }

  return src;
}
