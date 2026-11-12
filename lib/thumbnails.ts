/**
 * Thumbnail generation (server only — uses sharp).
 *
 * Called right after an image lands in Storage: the upload-complete API for
 * browser uploads, `meme-publish` for rendered memes, and
 * `scripts/backfill-thumbnails.ts` for anything uploaded by a script.
 * Paths and widths: `lib/thumbnail-paths.ts`.
 */
import sharp from 'sharp';
import type { SupabaseClient } from '@supabase/supabase-js';
import { THUMB_BUCKET, THUMB_WIDTHS, hasThumbnails, thumbObjectPath } from './thumbnail-paths';

const WEBP_QUALITY = 78;
/** Thumbnails are replaced in place when the original changes, so not "immutable" */
const CACHE_SECONDS = '2592000'; // 30 days

/**
 * Create every thumbnail width for one stored image. Never upscales: an original
 * narrower than a step is re-encoded at its own size.
 * Returns the number of thumbnails written (0 when the file isn't resizable).
 */
export async function generateThumbnails(
  db: SupabaseClient,
  bucket: string,
  path: string,
  source?: Buffer
): Promise<number> {
  if (!hasThumbnails(bucket, path)) return 0;

  let input = source;
  if (!input) {
    const { data, error } = await db.storage.from(bucket).download(path);
    if (error || !data) throw new Error(`[thumbs] download failed: ${bucket}/${path} — ${error?.message}`);
    input = Buffer.from(await data.arrayBuffer());
  }

  // rotate() applies the EXIF orientation before the metadata is dropped
  const image = sharp(input, { failOn: 'none' }).rotate();

  await Promise.all(
    THUMB_WIDTHS.map(async (width) => {
      const out = await image
        .clone()
        .resize({ width, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY })
        .toBuffer();
      const { error } = await db.storage
        .from(THUMB_BUCKET)
        .upload(thumbObjectPath(bucket, path, width), out, {
          contentType: 'image/webp',
          cacheControl: CACHE_SECONDS,
          upsert: true,
        });
      if (error) throw new Error(`[thumbs] upload failed: ${bucket}/${path} @${width} — ${error.message}`);
    })
  );

  return THUMB_WIDTHS.length;
}

/** Remove the thumbnails of deleted originals (best effort) */
export async function removeThumbnails(db: SupabaseClient, bucket: string, paths: string[]): Promise<void> {
  const targets = paths
    .filter((p) => hasThumbnails(bucket, p))
    .flatMap((p) => THUMB_WIDTHS.map((w) => thumbObjectPath(bucket, p, w)));
  if (targets.length) await db.storage.from(THUMB_BUCKET).remove(targets);
}
