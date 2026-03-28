import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock supabaseAdmin with chainable builder ──

let mockQueryResult: { data: unknown; error: unknown; count?: number } = {
  data: [],
  error: null,
};

function createChainableQuery() {
  const chain: Record<string, unknown> = {};
  const methods = [
    'select',
    'eq',
    'in',
    'lt',
    'order',
    'limit',
    'update',
    'insert',
  ];
  for (const m of methods) {
    chain[m] = vi.fn().mockImplementation((..._args: unknown[]) => {
      // 'select' with { count: 'exact', head: true } resolves differently
      return chain;
    });
  }
  // Terminal — resolves the chain
  chain.then = (resolve: (val: unknown) => void) => {
    resolve(mockQueryResult);
    return Promise.resolve(mockQueryResult);
  };
  return chain;
}

const mockFrom = vi.fn().mockImplementation(() => createChainableQuery());

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

vi.mock('@/lib/auth', () => ({
  requireUser: vi.fn().mockResolvedValue({ id: 'user-1', email: 'test@test.com' }),
}));

// Need to mock cookies for auth.ts
vi.mock('next/headers', () => ({
  cookies: () => ({
    getAll: () => [],
    set: () => {},
  }),
}));

import { GET, PUT } from '@/app/api/notifications/route';

beforeEach(() => {
  vi.clearAllMocks();
  mockQueryResult = { data: [], error: null };
});

describe('GET /api/notifications', () => {
  it('should return notifications list', async () => {
    const mockNotifications = [
      {
        id: 'n1',
        type: 'THREAD_REPLY',
        title: 'Someone replied',
        body: null,
        link: '/persons/sejong?thread=t1',
        is_read: false,
        created_at: '2026-03-28T10:00:00Z',
      },
    ];
    mockQueryResult = { data: mockNotifications, error: null };

    const request = new Request('http://localhost:3000/api/notifications?limit=20');
    const response = await GET(request);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.items).toHaveLength(1);
    expect(json.data.items[0].type).toBe('THREAD_REPLY');
    expect(json.data.has_next).toBe(false);
  });

  it('should support cursor pagination', async () => {
    // Return limit+1 items to indicate has_next
    const items = Array.from({ length: 6 }, (_, i) => ({
      id: `n${i}`,
      type: 'THREAD_LIKED',
      title: `Notification ${i}`,
      body: null,
      link: null,
      is_read: false,
      created_at: `2026-03-28T${10 + i}:00:00Z`,
    }));
    mockQueryResult = { data: items, error: null };

    const request = new Request('http://localhost:3000/api/notifications?limit=5');
    const response = await GET(request);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.items).toHaveLength(5);
    expect(json.data.has_next).toBe(true);
    expect(json.data.next_cursor).toBeDefined();
  });

  it('should return error on DB failure', async () => {
    mockQueryResult = { data: null, error: { message: 'DB error' } };

    const request = new Request('http://localhost:3000/api/notifications?limit=20');
    const response = await GET(request);
    const json = await response.json();

    expect(json.success).toBe(false);
    expect(json.error.code).toBe('SERVER_ERROR');
  });

  it('should reject invalid limit', async () => {
    const request = new Request(
      'http://localhost:3000/api/notifications?limit=999'
    );
    const response = await GET(request);
    const json = await response.json();

    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });
});

describe('PUT /api/notifications', () => {
  it('should mark specific notifications as read', async () => {
    mockQueryResult = { data: null, error: null };

    const request = new Request('http://localhost:3000/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        notification_ids: [
          'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
          'b2c3d4e5-f6a7-8901-bcde-f12345678901',
        ],
      }),
    });
    const response = await PUT(request);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.updated).toBe(true);
  });

  it('should mark all notifications as read', async () => {
    mockQueryResult = { data: null, error: null };

    const request = new Request('http://localhost:3000/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mark_all_read: true }),
    });
    const response = await PUT(request);
    const json = await response.json();

    expect(json.success).toBe(true);
    expect(json.data.updated).toBe(true);
  });

  it('should reject empty body', async () => {
    const request = new Request('http://localhost:3000/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const response = await PUT(request);
    const json = await response.json();

    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });

  it('should reject invalid JSON', async () => {
    const request = new Request('http://localhost:3000/api/notifications', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: 'not json',
    });
    const response = await PUT(request);
    const json = await response.json();

    expect(json.success).toBe(false);
    expect(json.error.code).toBe('VALIDATION_ERROR');
  });
});
