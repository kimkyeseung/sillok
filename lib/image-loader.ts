/**
 * next/image custom loader — resizing is delegated to the image host instead of
 * Vercel image optimization (Hobby quota exhausted → 402).
 *
 * - Supabase Storage public objects → Storage image transformation (`render/image`).
 *   Only `width` is sent, so the aspect ratio is kept and nothing is cropped.
 * - Wikimedia Commons originals → Wikimedia thumbnails, small sizes only (see below).
 * - Anything else (YouTube, Google avatars, heritage hosts, local files) → unchanged.
 */

interface LoaderArgs {
  src: string;
  width: number;
  quality?: number;
}

const SUPABASE_OBJECT = /^(https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1)\/object\/public\/(.+)$/;
/** Formats the Supabase transformer accepts (gif/svg are served as they are) */
const TRANSFORMABLE = /\.(jpe?g|png|webp)$/i;
/** Supabase rejects widths above 2500 */
const SUPABASE_MAX_WIDTH = 2500;

const WIKIMEDIA_ORIGINAL = /^(https:\/\/upload\.wikimedia\.org\/wikipedia\/[a-z]+)\/([0-9a-f]\/[0-9a-f]{2})\/([^/?#]+\.(?:jpe?g|png))$/i;
/**
 * Wikimedia only serves these thumbnail widths (others → 400) and refuses a
 * thumbnail wider than the original. Originals narrower than 250px are rare, so
 * thumbnails are used up to that step; larger requests keep the original.
 */
const WIKIMEDIA_STEPS = [20, 40, 60, 120, 250];
/** next/image asks for 256 for a 128px slot on a 2x screen — close enough to the 250 step */
const WIKIMEDIA_MAX_REQUEST = 256;

export default function imageLoader({ src, width, quality }: LoaderArgs): string {
  const supabase = SUPABASE_OBJECT.exec(src);
  if (supabase) {
    const [path, query] = supabase[2].split('?');
    if (!TRANSFORMABLE.test(path)) return src;
    const params = new URLSearchParams(query ?? '');
    params.set('width', String(Math.min(width, SUPABASE_MAX_WIDTH)));
    params.set('quality', String(quality ?? 75));
    return `${supabase[1]}/render/image/public/${path}?${params}`;
  }

  const wikimedia = WIKIMEDIA_ORIGINAL.exec(src);
  if (wikimedia && width <= WIKIMEDIA_MAX_REQUEST) {
    const [, base, hash, file] = wikimedia;
    const step = WIKIMEDIA_STEPS.find((s) => s >= width) ?? WIKIMEDIA_STEPS[WIKIMEDIA_STEPS.length - 1];
    return `${base}/thumb/${hash}/${file}/${step}px-${file}`;
  }

  return src;
}
