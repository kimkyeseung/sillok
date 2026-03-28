import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock supabaseAdmin ──

let mockQueryResult: { count: number | null; error: unknown } = {
  count: 0,
  error: null,
};

function createChainableQuery() {
  const chain: Record<string, unknown> = {};
  const methods = ['select', 'eq'];
  for (const m of methods) {
    chain[m] = vi.fn().mockImplementation(() => chain);
  }
  chain.then = (resolve: (val: unknown) => void) => {
    resolve(mockQueryResult);
    return Promise.resolve(mockQueryResult);
  };
  return chain;
}

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: vi.fn().mockImplementation(() => createChainableQuery()),
  },
}));

vi.mock('@/lib/auth', () => ({
  requireUser: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@test.com' }),
}));

vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    set: () => {},
  }),
}));

import { GET } from '@/app/api/notifications/unread-count/route';

beforeEach(() => {
  vi.clearAllMocks();
  mockQueryResult = { count: 0, error: null };
});

describe('GET /api/notifications/unread-count', () => {
  it('should return unread count', async () => {
    mockQueryResult = { count: 5, error: null };

    const request = new Request(
      'http://localhost:3000/api/notifications/unread-count'
    );
    const response = await GET(request);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.count).toBe(5);
  });

  it('should return 0 when no unread notifications', async () => {
    mockQueryResult = { count: 0, error: null };

    const request = new Request(
      'http://localhost:3000/api/notifications/unread-count'
    );
    const response = await GET(request);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.count).toBe(0);
  });

  it('should return error on DB failure', async () => {
    mockQueryResult = { count: null, error: { message: 'DB error' } };

    const request = new Request(
      'http://localhost:3000/api/notifications/unread-count'
    );
    const response = await GET(request);
    const json = await response.json();

    expect(json.success).toBe(false);
    expect(json.error.code).toBe('SERVER_ERROR');
  });
});
