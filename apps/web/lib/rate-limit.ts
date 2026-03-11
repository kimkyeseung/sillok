/**
 * In-memory Rate Limiter (MVP)
 * Milestone 2에서 Upstash Redis로 전환 예정
 *
 * 사용법:
 *   const limiter = rateLimit({ interval: 60_000, limit: 100 });
 *   const { success } = await limiter.check(identifier);
 */

interface RateLimitOptions {
  /** 시간 창 (ms) */
  interval: number;
  /** 최대 요청 수 */
  limit: number;
}

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

export function rateLimit({ interval, limit }: RateLimitOptions) {
  const store = new Map<string, RateLimitEntry>();

  // 오래된 항목 정리 (5분마다)
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

// 사전 정의된 Rate Limiter 인스턴스 (CLAUDE.md 규격)
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
