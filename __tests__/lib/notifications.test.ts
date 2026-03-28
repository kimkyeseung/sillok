import { describe, it, expect, vi, beforeEach } from 'vitest';

// ── Mock supabaseAdmin ──

const mockInsert = vi.fn().mockResolvedValue({ error: null });
const mockSelect = vi.fn();
const mockEq = vi.fn();
const mockSingle = vi.fn();

const mockFrom = vi.fn().mockReturnValue({
  insert: mockInsert,
  select: (...args: unknown[]) => {
    mockSelect(...args);
    return {
      eq: (...eqArgs: unknown[]) => {
        mockEq(...eqArgs);
        return {
          eq: (...eqArgs2: unknown[]) => {
            mockEq(...eqArgs2);
            return { single: mockSingle };
          },
          single: mockSingle,
        };
      },
    };
  },
});

vi.mock('@/lib/supabase-admin', () => ({
  supabaseAdmin: {
    from: (...args: unknown[]) => mockFrom(...args),
  },
}));

// Import after mocks
import {
  createNotification,
  notifyFollowers,
  getUserNickname,
} from '@/lib/notifications';

beforeEach(() => {
  vi.clearAllMocks();
  mockInsert.mockResolvedValue({ error: null });
});

describe('createNotification', () => {
  it('should insert a notification into the notifications table', async () => {
    await createNotification({
      userId: 'user-1',
      type: 'THREAD_REPLY',
      title: 'Someone replied to your thread',
      body: 'Thread title',
      link: '/persons/sejong?thread=t1',
      sourceId: 'reply-1',
    });

    expect(mockFrom).toHaveBeenCalledWith('notifications');
    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-1',
      type: 'THREAD_REPLY',
      title: 'Someone replied to your thread',
      body: 'Thread title',
      link: '/persons/sejong?thread=t1',
      source_id: 'reply-1',
    });
  });

  it('should handle optional fields as null', async () => {
    await createNotification({
      userId: 'user-2',
      type: 'THREAD_LIKED',
      title: 'Someone liked your thread',
    });

    expect(mockInsert).toHaveBeenCalledWith({
      user_id: 'user-2',
      type: 'THREAD_LIKED',
      title: 'Someone liked your thread',
      body: null,
      link: null,
      source_id: null,
    });
  });

  it('should not throw on insert error', async () => {
    mockInsert.mockRejectedValueOnce(new Error('DB error'));

    // Should not throw
    await expect(
      createNotification({
        userId: 'user-3',
        type: 'WARNING',
        title: 'Test',
      })
    ).resolves.toBeUndefined();
  });
});

describe('getUserNickname', () => {
  it('should return the nickname from profiles', async () => {
    mockSingle.mockResolvedValueOnce({
      data: { nickname: 'HistoryFan' },
    });

    const nickname = await getUserNickname('user-1');
    expect(nickname).toBe('HistoryFan');
    expect(mockFrom).toHaveBeenCalledWith('profiles');
  });

  it('should return "Someone" if profile not found', async () => {
    mockSingle.mockResolvedValueOnce({ data: null });

    const nickname = await getUserNickname('user-unknown');
    expect(nickname).toBe('Someone');
  });
});

describe('notifyFollowers', () => {
  it('should insert notifications for all followers except thread author', async () => {
    // Mock follows query: return 3 followers
    const mockFollowsSelect = vi.fn().mockReturnValue({
      eq: vi.fn().mockReturnValue({
        eq: vi.fn().mockResolvedValue({
          data: [
            { user_id: 'follower-1' },
            { user_id: 'follower-2' },
            { user_id: 'author-1' }, // thread author — should be excluded
          ],
        }),
      }),
    });

    // Override from for this test
    mockFrom.mockImplementation((table: string) => {
      if (table === 'follows') {
        return { select: mockFollowsSelect };
      }
      return { insert: mockInsert };
    });

    await notifyFollowers({
      personId: 'person-1',
      threadAuthorId: 'author-1',
      threadTitle: 'King Sejong Analysis',
      personSlug: 'sejong-daewang',
      threadId: 'thread-1',
    });

    // Should insert notifications only for follower-1 and follower-2
    expect(mockInsert).toHaveBeenCalledWith([
      {
        user_id: 'follower-1',
        type: 'FOLLOW_UPDATE',
        title: 'New thread on a figure you follow',
        body: 'King Sejong Analysis',
        link: '/persons/sejong-daewang?thread=thread-1',
        source_id: 'thread-1',
      },
      {
        user_id: 'follower-2',
        type: 'FOLLOW_UPDATE',
        title: 'New thread on a figure you follow',
        body: 'King Sejong Analysis',
        link: '/persons/sejong-daewang?thread=thread-1',
        source_id: 'thread-1',
      },
    ]);
  });

  it('should do nothing if no followers', async () => {
    mockFrom.mockImplementation((table: string) => {
      if (table === 'follows') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ data: [] }),
            }),
          }),
        };
      }
      return { insert: mockInsert };
    });

    await notifyFollowers({
      personId: 'person-1',
      threadAuthorId: 'author-1',
      threadTitle: 'Test',
      personSlug: 'test',
      threadId: 'thread-1',
    });

    // insert should NOT have been called for notifications
    expect(mockInsert).not.toHaveBeenCalled();
  });

  it('should not throw on error', async () => {
    mockFrom.mockImplementation(() => {
      throw new Error('DB error');
    });

    await expect(
      notifyFollowers({
        personId: 'person-1',
        threadAuthorId: 'author-1',
        threadTitle: 'Test',
        personSlug: 'test',
        threadId: 'thread-1',
      })
    ).resolves.toBeUndefined();
  });
});
