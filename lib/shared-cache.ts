/**
 * Cross-request cache (Next data cache) for site-wide lists that every render
 * of a page needs — React cache() only dedupes within one request, so crawler
 * traffic over many person/thread URLs re-ran the same full-table queries.
 *
 * The loader must throw on a DB error: unstable_cache does not store a thrown
 * result, so an outage is not cached for the TTL.
 *
 * On a DB error the wrapper protects the DB from a retry stampede (every miss
 * re-running the heavy query while the DB is already slow):
 * - concurrent misses in one instance share a single in-flight load
 * - the last good value (per instance) is served instead of the fallback
 * - for `cooldownMs` after a failure the DB is not queried at all
 * `fallback` may throw to keep "no data" distinguishable from "empty data".
 */
import { unstable_cache } from 'next/cache';

const DEFAULT_COOLDOWN_MS = 30_000;
/** Distinct argument sets remembered per cache (args can include dates) */
const MAX_REMEMBERED = 32;

export function sharedCache<A extends unknown[], T>(
  key: string,
  load: (...args: A) => Promise<T>,
  options: { revalidate: number; tags?: string[]; cooldownMs?: number },
  fallback: (...args: A) => T
): (...args: A) => Promise<T> {
  const { cooldownMs = DEFAULT_COOLDOWN_MS, ...cacheOptions } = options;
  const cached = unstable_cache(load, [key], cacheOptions);
  const inflight = new Map<string, Promise<T>>();
  const lastGood = new Map<string, T>();
  const failedAt = new Map<string, number>();

  const remember = (argKey: string, value: T) => {
    lastGood.delete(argKey); // re-insert → most recent last
    lastGood.set(argKey, value);
    if (lastGood.size > MAX_REMEMBERED) lastGood.delete(lastGood.keys().next().value as string);
  };

  const degraded = (argKey: string, args: A): T =>
    lastGood.has(argKey) ? (lastGood.get(argKey) as T) : fallback(...args);

  return async (...args: A) => {
    const argKey = JSON.stringify(args);

    const failed = failedAt.get(argKey);
    if (failed !== undefined) {
      if (Date.now() - failed < cooldownMs) return degraded(argKey, args);
      failedAt.delete(argKey);
    }

    let pending = inflight.get(argKey);
    if (!pending) {
      pending = cached(...args).finally(() => inflight.delete(argKey));
      inflight.set(argKey, pending);
    }

    try {
      const value = await pending;
      remember(argKey, value);
      return value;
    } catch (e) {
      if (!failedAt.has(argKey)) {
        console.error(`[cache:${key}]`, e instanceof Error ? e.message : e);
        failedAt.set(argKey, Date.now());
        if (failedAt.size > MAX_REMEMBERED) failedAt.delete(failedAt.keys().next().value as string);
      }
      return degraded(argKey, args);
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
