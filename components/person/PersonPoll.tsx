'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { useState } from 'react';
import { apiFetch, fetcher } from '@/lib/fetcher';
import { useAuth } from '@/lib/hooks/use-auth';
import { useToast } from '@/components/common/Toast';

interface Poll {
  id: string;
  question: string;
  total: number;
  my_option_id: string | null;
  options: { id: string; label: string; votes: number }[];
}

/** Single-choice community poll — results are shown after voting */
export default function PersonPoll({
  slug,
  label = 'Community Poll',
  moreLink,
}: {
  slug: string;
  label?: string;
  /** Optional link under the poll (e.g. to the figure page from the home feed) */
  moreLink?: { href: string; text: string };
}) {
  const key = `/api/persons/${slug}/poll`;
  const { data, mutate } = useSWR<{ poll: Poll | null }>(key, fetcher);
  const { user } = useAuth();
  const { toast } = useToast();
  const [saving, setSaving] = useState<string | null>(null);

  const poll = data?.poll;
  if (!poll) return null;
  const showResults = !!poll.my_option_id;

  const vote = async (optionId: string) => {
    setSaving(optionId);
    try {
      const res = await apiFetch<{ total: number; counts: Record<string, number>; my_option_id: string }>(key, {
        method: 'POST',
        body: JSON.stringify({ option_id: optionId }),
      });
      await mutate(
        {
          poll: {
            ...poll,
            total: res.total,
            my_option_id: res.my_option_id,
            options: poll.options.map((o) => ({ ...o, votes: res.counts[o.id] ?? 0 })),
          },
        },
        { revalidate: false }
      );
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Could not save your vote', 'error');
    } finally {
      setSaving(null);
    }
  };

  return (
    <section className="card-flat p-5">
      <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      <h2 className="mt-1 text-sm font-semibold text-gray-900">{poll.question}</h2>
      <ul className="mt-3 space-y-2">
        {poll.options.map((o) => {
          const pct = poll.total ? Math.round((o.votes / poll.total) * 100) : 0;
          const mine = poll.my_option_id === o.id;
          return (
            <li key={o.id}>
              <button
                type="button"
                disabled={!user || saving !== null}
                onClick={() => vote(o.id)}
                className={`relative w-full overflow-hidden rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                  mine ? 'border-brand-400' : 'border-gray-200 hover:border-brand-300'
                } disabled:cursor-default`}
              >
                {showResults && (
                  <span
                    className={`absolute inset-y-0 left-0 ${mine ? 'bg-brand-100' : 'bg-gray-100'}`}
                    style={{ width: `${pct}%` }}
                    aria-hidden="true"
                  />
                )}
                <span className="relative flex items-center justify-between gap-3">
                  <span className={mine ? 'font-medium text-brand-800' : 'text-gray-800'}>
                    {o.label}
                    {mine && ' ✓'}
                  </span>
                  {showResults && <span className="text-xs text-gray-500">{pct}%</span>}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-gray-400">
        {poll.total.toLocaleString()} {poll.total === 1 ? 'vote' : 'votes'}
        {!user && (
          <>
            {' · '}
            <Link href="/login" className="text-brand-600 hover:underline">
              Log in to vote
            </Link>
          </>
        )}
        {showResults && ' · You can change your vote'}
        {moreLink && (
          <>
            {' · '}
            <Link href={moreLink.href} className="text-brand-600 hover:underline">
              {moreLink.text}
            </Link>
          </>
        )}
      </p>
    </section>
  );
}
