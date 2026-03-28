import { supabaseAdmin } from '@/lib/supabase-admin';

type NotificationType =
  | 'THREAD_REPLY'
  | 'REPLY_REPLY'
  | 'THREAD_LIKED'
  | 'FOLLOW_UPDATE'
  | 'REQUEST_APPROVED'
  | 'REQUEST_REJECTED'
  | 'RELATION_APPROVED'
  | 'RELATION_REJECTED'
  | 'WARNING';

interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  sourceId?: string;
}

/**
 * Create a notification for a user.
 * Silently fails — notification creation should never block the main action.
 */
export async function createNotification({
  userId,
  type,
  title,
  body,
  link,
  sourceId,
}: CreateNotificationParams): Promise<void> {
  try {
    await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body: body ?? null,
      link: link ?? null,
      source_id: sourceId ?? null,
    });
  } catch {
    // Notification failure should not affect main operation
  }
}

/**
 * Notify all followers of a person that a new thread was posted.
 * Batches inserts to avoid N+1 queries.
 */
export async function notifyFollowers({
  personId,
  threadAuthorId,
  threadTitle,
  personSlug,
  threadId,
}: {
  personId: string;
  threadAuthorId: string;
  threadTitle: string;
  personSlug: string;
  threadId: string;
}): Promise<void> {
  try {
    const { data: followers } = await supabaseAdmin
      .from('follows')
      .select('user_id')
      .eq('target_type', 'person')
      .eq('target_id', personId);

    if (!followers || followers.length === 0) return;

    // Exclude the thread author from receiving their own notification
    const recipientIds = followers
      .map((f) => f.user_id)
      .filter((id) => id !== threadAuthorId);

    if (recipientIds.length === 0) return;

    const notifications = recipientIds.map((userId) => ({
      user_id: userId,
      type: 'FOLLOW_UPDATE' as const,
      title: 'New thread on a figure you follow',
      body: threadTitle,
      link: `/persons/${personSlug}?thread=${threadId}`,
      source_id: threadId,
    }));

    await supabaseAdmin.from('notifications').insert(notifications);
  } catch {
    // Silent fail
  }
}

/**
 * Get nickname for a user from profiles table.
 */
export async function getUserNickname(userId: string): Promise<string> {
  const { data } = await supabaseAdmin
    .from('profiles')
    .select('nickname')
    .eq('id', userId)
    .single();
  return data?.nickname ?? 'Someone';
}
