/**
 * In-memory Rate Limiter (MVP)
 * Will migrate to Upstash Redis in Milestone 2
 *
 * Usage:
 *   const limiter = rateLimit({ interval: 60_000, limit: 100 });
 *   const { success } = await limiter.check(identifier);
 */

interface RateLimitOptions {
  /** Time window (ms) */
  interval: number;
  /** Max requests */
  limit: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function rateLimit({ interval, limit }: RateLimitOptions) {
  const store = new Map<string, RateLimitEntry>();

  // Clean up stale entries (every 5 minutes)
  setInterval(() => {
    const now = Date.now();
    store.forEach((entry, key) => {
      if (entry.resetAt < now) {
        store.delete(key);
      }
    });
  }, 5 * 60 * 1000);

  return {
    async check(identifier: string): Promise<{
      success: boolean;
      remaining: number;
      resetAt: number;
    }> {
      const now = Date.now();
      const entry = store.get(identifier);

      if (!entry || entry.resetAt < now) {
        const resetAt = now + interval;
        store.set(identifier, { count: 1, resetAt });
        return { success: true, remaining: limit - 1, resetAt };
      }

      if (entry.count >= limit) {
        return { success: false, remaining: 0, resetAt: entry.resetAt };
      }

      entry.count++;
      return {
        success: true,
        remaining: limit - entry.count,
        resetAt: entry.resetAt,
      };
    },
  };
}

// Pre-defined Rate Limiter instances (per CLAUDE.md spec)
export const generalLimiter = rateLimit({ interval: 60_000, limit: 100 });
export const searchLimiter = rateLimit({ interval: 60_000, limit: 30 });
export const threadCreateLimiter = rateLimit({
  interval: 60 * 60_000,
  limit: 10,
});
export const replyCreateLimiter = rateLimit({
  interval: 60 * 60_000,
  limit: 30,
});
export const personRequestLimiter = rateLimit({
  interval: 60 * 60_000,
  limit: 5,
});
export const relationSuggestLimiter = rateLimit({
  interval: 60 * 60_000,
  limit: 10,
});
export const reportLimiter = rateLimit({ interval: 60 * 60_000, limit: 10 });
export const translateLimiter = rateLimit({ interval: 60_000, limit: 10 });
