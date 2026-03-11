'use client';

import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationsResponse {
  items: Notification[];
  has_next: boolean;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export default function NotificationsClient() {
  const { data, isLoading, mutate } = useSWR<NotificationsResponse>(
    '/api/notifications?limit=30',
    fetcher
  );
  const { toast } = useToast();

  const handleMarkAllRead = async () => {
    try {
      await apiFetch('/api/notifications', {
        method: 'PUT',
        body: JSON.stringify({ mark_all_read: true }),
      });
      mutate();
      toast('모두 읽음 처리되었습니다');
    } catch {
      toast('오류가 발생했습니다', 'error');
    }
  };

  const unreadCount = (data?.items ?? []).filter((n) => !n.is_read).length;

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">알림</h1>
          {unreadCount > 0 && (
            <p className="mt-0.5 text-sm text-gray-500">
              읽지 않은 알림 {unreadCount}개
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <button onClick={handleMarkAllRead} className="btn-ghost text-xs">
            모두 읽음
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
          <span className="text-sm">로딩 중...</span>
        </div>
      ) : (
        <div className="card-flat divide-y divide-gray-50">
          {(data?.items ?? []).map((notif) => (
            <a
              key={notif.id}
              href={notif.link ?? '#'}
              className={`block px-5 py-3.5 transition-colors hover:bg-gray-50 ${
                !notif.is_read ? 'bg-brand-50/30' : ''
              }`}
            >
              <div className="flex items-start gap-3">
                {!notif.is_read && (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                )}
                <div className="min-w-0 flex-1">
                  <p className={`text-sm ${!notif.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                    {notif.title}
                  </p>
                  {notif.body && (
                    <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                      {notif.body}
                    </p>
                  )}
                  <p className="mt-1 text-xs text-gray-400">
                    {timeAgo(notif.created_at)}
                  </p>
                </div>
              </div>
            </a>
          ))}
          {(data?.items ?? []).length === 0 && (
            <div className="flex flex-col items-center py-16 text-gray-400">
              <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
              </svg>
              <p className="mt-3 text-sm">알림이 없습니다</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
