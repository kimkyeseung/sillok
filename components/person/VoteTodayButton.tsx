'use client';

import { useState, useTransition } from 'react';
import { apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface VoteTodayButtonProps {
  personSlug: string;
}

export default function VoteTodayButton({ personSlug }: VoteTodayButtonProps) {
  const [voted, setVoted] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const handleVote = () => {
    startTransition(async () => {
      try {
        const res = await apiFetch<{ voted: boolean }>(
          `/api/persons/${personSlug}/vote-today`,
          { method: 'POST' }
        );
        setVoted(res.voted);
        toast(res.voted ? 'Voted!' : 'Vote cancelled');
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : 'Login required';
        toast(msg, 'error');
      }
    });
  };

  return (
    <button
      onClick={handleVote}
      disabled={isPending}
      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
        voted
          ? 'bg-amber-50 text-amber-700 border border-amber-200'
          : 'bg-white text-gray-600 border border-gray-300 hover:bg-gray-50'
      }`}
    >
      <svg
        className="h-3.5 w-3.5"
        fill={voted ? 'currentColor' : 'none'}
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
        />
      </svg>
      {voted ? 'Voted Today' : 'Vote Person of the Day'}
    </button>
  );
}
