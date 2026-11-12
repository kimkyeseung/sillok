/**
 * Pre-generated thumbnails — where they live and which one answers a request.
 *
 * Every image uploaded to a source bucket gets a WebP copy per width in the
 * public `thumbs` bucket (`lib/thumbnails.ts`), so pages never ask Supabase to
 * resize on the fly (image transformations are billed per origin image).
 *
 *   persons/<id>/<file>.jpg  →  thumbs/persons/<width>/<id>/<file>.jpg.webp
 *
 * Pure and dependency-free: the next/image loader bundles this for the browser.
 */

export const THUMB_BUCKET = 'thumbs';

/** Widths generated per image. Requests above the largest get the largest. */
export const THUMB_WIDTHS = [96, 256, 640, 1080, 1920] as const;

/** Buckets whose images get thumbnails (`memes` holds admin-only source images) */
export const THUMB_SOURCE_BUCKETS = ['persons', 'articles', 'threads', 'avatars', 'nodes'] as const;

export type ThumbSourceBucket = (typeof THUMB_SOURCE_BUCKETS)[number];

/** Formats that are resized (gif/svg are served as they are) */
const RESIZABLE = /\.(jpe?g|png|webp)$/i;

export function hasThumbnails(bucket: string, path: string): bucket is ThumbSourceBucket {
  return (THUMB_SOURCE_BUCKETS as readonly string[]).includes(bucket) && RESIZABLE.test(path);
}

/** Smallest generated width that covers the requested one */
export function thumbStep(width: number): number {
  return THUMB_WIDTHS.find((w) => w >= width) ?? THUMB_WIDTHS[THUMB_WIDTHS.length - 1];
}

/** Object path inside the `thumbs` bucket */
export function thumbObjectPath(bucket: string, path: string, width: number): string {
  return `${bucket}/${width}/${path}.webp`;
}

const THUMB_URL = new RegExp(
  `^(https://[a-z0-9-]+\\.supabase\\.co/storage/v1/object/public)/${THUMB_BUCKET}/([^/]+)/\\d+/([^?#]+)\\.webp(\\?[^#]*)?$`
);

/** The original image a thumbnail URL was derived from, or null if it isn't one */
export function originalFromThumbUrl(url: string): string | null {
  const m = THUMB_URL.exec(url);
  return m ? `${m[1]}/${m[2]}/${m[3]}${m[4] ?? ''}` : null;
}
