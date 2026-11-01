import { describe, it, expect, vi } from 'vitest';

// Pass-through stand-in for the Next data cache: stores only resolved results, like unstable_cache
vi.mock('next/cache', () => ({
  unstable_cache: <A extends unknown[], T>(fn: (...args: A) => Promise<T>) => {
    const store = new Map<string, T>();
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
    const get = sharedCache('t-fail', load, { revalidate: 60 }, () => []);
    expect(await get()).toEqual([]);
    expect(await get()).toEqual(['a']);
    expect(load).toHaveBeenCalledTimes(2);
  });
});

describe('orThrow', () => {
  it('passes data through and throws on error', () => {
    expect(orThrow('x', { data: [1], error: null })).toEqual([1]);
    expect(() => orThrow('x', { data: null, error: { message: 'boom' } })).toThrow('x: boom');
  });
});
