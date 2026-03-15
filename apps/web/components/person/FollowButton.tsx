'use client';

import { useState, useTransition } from 'react';
import { apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface FollowButtonProps {
  targetType: 'person' | 'node';
  targetId: string;
  initialCount: number;
}

export default function FollowButton({
  targetType,
  targetId,
  initialCount,
}: FollowButtonProps) {
  const [following, setFollowing] = useState(false);
  const [count, setCount] = useState(initialCount);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleClick = () => {
    startTransition(async () => {
      try {
        const res = await apiFetch<{ followed: boolean }>('/api/follows', {
          method: 'POST',
          body: JSON.stringify({
            target_type: targetType,
            target_id: targetId,
          }),
        });
        setFollowing(res.followed);
        setCount((prev) => (res.followed ? prev + 1 : prev - 1));
      } catch {
        toast('Login required', 'error');
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        following
          ? 'border border-brand-200 bg-brand-50 text-brand-700 hover:bg-brand-100'
          : 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50'
      }`}
    >
      {following ? (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
          </svg>
          Following {count}
        </>
      ) : (
        <>
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Follow {count}
        </>
      )}
    </button>
  );
}
