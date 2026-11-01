/**
 * Cross-request cache (Next data cache) for site-wide lists that every render
 * of a page needs — React cache() only dedupes within one request, so crawler
 * traffic over many person/thread URLs re-ran the same full-table queries.
 *
 * The loader must throw on a DB error: unstable_cache does not store a thrown
 * result, so an outage is not cached for the TTL. The caller gets `fallback`
 * for that request only.
 */
import { unstable_cache } from 'next/cache';

export function sharedCache<A extends unknown[], T>(
  key: string,
  load: (...args: A) => Promise<T>,
  options: { revalidate: number; tags?: string[] },
  fallback: (...args: A) => T
): (...args: A) => Promise<T> {
  const cached = unstable_cache(load, [key], options);
  return async (...args: A) => {
    try {
      return await cached(...args);
    } catch (e) {
      console.error(`[cache:${key}]`, e instanceof Error ? e.message : e);
      return fallback(...args);
    }
  };
}

/** Throw a Supabase error so sharedCache skips storing it */
export function orThrow<T>(
  label: string,
  result: { data: T | null; error: { message: string } | null }
): T {
  if (result.error) throw new Error(`${label}: ${result.error.message}`);
  return result.data as T;
}
