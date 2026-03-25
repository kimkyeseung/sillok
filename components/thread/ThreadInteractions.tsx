'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/hooks/use-auth';
import { apiFetch } from '@/lib/fetcher';
import LikeButton from '@/components/thread/LikeButton';
import ReportButton from '@/components/thread/ReportButton';
import ReplyForm from '@/components/thread/ReplyForm';

interface ThreadActionsProps {
  threadId: string;
  authorId: string;
  likeCount: number;
  replyCount: number;
  viewCount: number;
}

export function ThreadActions({
  threadId,
  authorId,
  likeCount,
  replyCount,
  viewCount,
}: ThreadActionsProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const isOwner = user?.id === authorId;

  const handleDelete = async () => {
    if (!confirm('정말 삭제하시겠습니까?')) return;
    setDeleting(true);
    try {
      await apiFetch(`/api/threads/${threadId}`, { method: 'DELETE' });
      router.push('/');
    } catch {
      alert('삭제에 실패했습니다.');
      setDeleting(false);
    }
  };

  return (
    <div className="mt-5 flex items-center gap-3 border-t border-gray-100 pt-4">
      <LikeButton targetType="thread" targetId={threadId} initialCount={likeCount} size="md" />
      <span className="flex items-center gap-1.5 text-sm text-gray-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
        {replyCount}
      </span>
      <span className="flex items-center gap-1.5 text-sm text-gray-400">
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
        </svg>
        {viewCount}
      </span>
      <div className="flex-1" />
      {isOwner && (
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="text-xs text-gray-400 hover:text-red-500 disabled:opacity-50"
        >
          {deleting ? '삭제 중...' : '삭제'}
        </button>
      )}
      <ReportButton targetType="thread" targetId={threadId} />
    </div>
  );
}

interface ReplyActionsProps {
  replyId: string;
  likeCount: number;
}

export function ReplyActions({ replyId, likeCount }: ReplyActionsProps) {
  return (
    <div className="mt-1 flex items-center gap-1 pl-[38px]">
      <LikeButton targetType="reply" targetId={replyId} initialCount={likeCount} />
      <ReportButton targetType="reply" targetId={replyId} />
    </div>
  );
}

interface ReplyFormWrapperProps {
  threadId: string;
}

export function ReplyFormWrapper({ threadId }: ReplyFormWrapperProps) {
  return (
    <div className="border-t border-gray-100 px-5 py-4">
      <ReplyForm threadId={threadId} />
    </div>
  );
}
