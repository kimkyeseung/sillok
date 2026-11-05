import { describe, it, expect, vi } from 'vitest';

// All mock cache stores, so a test can expire them (TTL passed / tag revalidated)
const stores = vi.hoisted(() => [] as Map<string, unknown>[]);

// Pass-through stand-in for the Next data cache: stores only resolved results, like unstable_cache
vi.mock('next/cache', () => ({
  unstable_cache: <A extends unknown[], T>(fn: (...args: A) => Promise<T>) => {
    const store = new Map<string, T>();
    stores.push(store as Map<string, unknown>);
    return async (...args: A) => {
      const key = JSON.stringify(args);
      if (store.has(key)) return store.get(key)!;
      const value = await fn(...args);
      store.set(key, value);
      return value;
    };
  },
}));

import { sharedCache, orThrow } from '@/lib/shared-cache';

describe('sharedCache', () => {
  it('returns the loaded value and reuses it', async () => {
    const load = vi.fn(async (n: number) => n * 2);
    const get = sharedCache('t-ok', load, { revalidate: 60 }, () => -1);
    expect(await get(2)).toBe(4);
    expect(await get(2)).toBe(4);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('falls back on a DB error and retries on the next call', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const load = vi
      .fn<() => Promise<string[]>>()
      .mockRejectedValueOnce(new Error('timeout'))
      .mockResolvedValueOnce(['a']);
    const get = sharedCache('t-fail', load, { revalidate: 60, cooldownMs: 0 }, () => []);
    expect(await get()).toEqual([]);
    expect(await get()).toEqual(['a']);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('does not query again during the cooldown after a failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const load = vi.fn<() => Promise<string[]>>().mockRejectedValue(new Error('timeout'));
    const get = sharedCache('t-cooldown', load, { revalidate: 60, cooldownMs: 60_000 }, () => []);
    expect(await get()).toEqual([]);
    expect(await get()).toEqual([]);
    expect(await get()).toEqual([]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('retries once the cooldown has passed', async () => {
    vi.useFakeTimers();
    try {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const load = vi
        .fn<() => Promise<string[]>>()
        .mockRejectedValueOnce(new Error('timeout'))
        .mockResolvedValueOnce(['a']);
      const get = sharedCache('t-cooldown-end', load, { revalidate: 60, cooldownMs: 1_000 }, () => []);
      expect(await get()).toEqual([]);
      vi.advanceTimersByTime(1_001);
      expect(await get()).toEqual(['a']);
      expect(load).toHaveBeenCalledTimes(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it('serves the last good value instead of the fallback on a later failure', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const load = vi
      .fn<() => Promise<string[]>>()
      .mockResolvedValueOnce(['good'])
      .mockRejectedValue(new Error('timeout'));
    const get = sharedCache('t-stale', load, { revalidate: 60 }, () => []);
    expect(await get()).toEqual(['good']);
    stores.forEach((s) => s.clear()); // cache entry expired → next call hits the DB
    expect(await get()).toEqual(['good']);
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('shares one load between concurrent misses', async () => {
    let resolve!: (v: number) => void;
    const load = vi.fn(() => new Promise<number>((r) => (resolve = r)));
    const get = sharedCache('t-inflight', load, { revalidate: 60 }, () => -1);
    const a = get();
    const b = get();
    resolve(7);
    expect(await Promise.all([a, b])).toEqual([7, 7]);
    expect(load).toHaveBeenCalledTimes(1);
  });

  it('rethrows from a throwing fallback when there is nothing to serve', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const load = vi.fn<() => Promise<number>>().mockRejectedValue(new Error('timeout'));
    const get = sharedCache('t-throw', load, { revalidate: 60 }, () => {
      throw new Error('unavailable');
    });
    await expect(get()).rejects.toThrow('unavailable');
    await expect(get()).rejects.toThrow('unavailable'); // cooldown: still no DB call
    expect(load).toHaveBeenCalledTimes(1);
  });
});

describe('orThrow', () => {
  it('passes data through and throws on error', () => {
    expect(orThrow('x', { data: [1], error: null })).toEqual([1]);
    expect(() => orThrow('x', { data: null, error: { message: 'boom' } })).toThrow('x: boom');
  });
});
