'use client';

import { useState, useTransition } from 'react';
import { apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface LikeButtonProps {
  targetType: 'thread' | 'reply' | 'node_comment';
  targetId: string;
  initialCount: number;
  size?: 'sm' | 'md';
}

function getLikeUrl(type: string, id: string) {
  switch (type) {
    case 'thread':
      return `/api/threads/${id}/like`;
    case 'reply':
      return `/api/replies/${id}/like`;
    case 'node_comment':
      return `/api/comments/${id}/like`;
    default:
      return '';
  }
}

export default function LikeButton({
  targetType,
  targetId,
  initialCount,
  size = 'sm',
}: LikeButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const res = await apiFetch<{ liked: boolean }>(getLikeUrl(targetType, targetId), {
          method: 'POST',
        });
        setLiked(res.liked);
        setCount((prev) => (res.liked ? prev + 1 : prev - 1));
      } catch {
        toast('Login required', 'error');
      }
    });
  };

  const iconSize = size === 'sm' ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const textSize = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 ${textSize} transition-colors ${
        liked
          ? 'text-red-500 hover:bg-red-50'
          : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
      }`}
    >
      <svg
        className={iconSize}
        fill={liked ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
      {count}
    </button>
  );
}
