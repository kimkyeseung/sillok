// ─── Copyright takedown helpers (pure) ───
// Thread images live in the public 'threads' bucket at {author_id}/{thread_id}/...
// A soft delete hides the thread but leaves the files reachable at their URLs,
// so a takedown also removes the files. Only URLs that point at our own bucket
// can be removed — external URLs are just unlinked.

export const THREADS_BUCKET = 'threads';

/** Public URL prefix of the threads bucket, e.g. https://x.supabase.co/storage/v1/object/public/threads/ */
export function threadsBucketPrefix(supabaseUrl: string): string {
  return `${supabaseUrl.replace(/\/+$/, '')}/storage/v1/object/public/${THREADS_BUCKET}/`;
}

/**
 * Storage path of a threads-bucket public URL, or null when the URL is not ours
 * (other host, other bucket, empty path, path traversal).
 */
export function threadsBucketPath(url: string, supabaseUrl: string | undefined): string | null {
  if (!supabaseUrl || !url) return null;
  const prefix = threadsBucketPrefix(supabaseUrl);
  if (!url.startsWith(prefix)) return null;
  // Drop ?query / #hash (cache busters, transforms)
  const raw = url.slice(prefix.length).split(/[?#]/)[0];
  let path: string;
  try {
    path = decodeURIComponent(raw);
  } catch {
    return null;
  }
  path = path.replace(/^\/+/, '');
  if (!path || path.endsWith('/')) return null;
  if (path.split('/').some((seg) => seg === '..' || seg === '.' || seg === '')) return null;
  return path;
}

export interface TakedownPlan {
  /** Storage paths to remove from the threads bucket (deduped) */
  paths: string[];
  /** URLs we can't remove (not in our bucket) — only the DB row is deleted */
  external: string[];
}

/** Split image URLs into removable bucket paths and external URLs */
export function planTakedown(urls: string[], supabaseUrl: string | undefined): TakedownPlan {
  const paths = new Set<string>();
  const external: string[] = [];
  for (const url of urls) {
    const path = threadsBucketPath(url, supabaseUrl);
    if (path) paths.add(path);
    else external.push(url);
  }
  return { paths: Array.from(paths), external };
}

/** Folder that holds a thread's uploads (also catches files no longer linked from thread_images) */
export function threadFolder(authorId: string | null, threadId: string): string | null {
  if (!authorId) return null;
  return `${authorId}/${threadId}`;
}
