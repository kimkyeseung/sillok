'use client';

import Link from 'next/link';
import { useAuth } from '@/lib/hooks/use-auth';

/** "Start a discussion" bar at the top of the feed */
export default function FeedComposer({ hint = 'Start a discussion about a historical figure…' }: { hint?: string }) {
  const { user } = useAuth();
  const href = user ? '/threads/new' : '/login';
  return (
    <div className="card-flat flex items-center gap-3 p-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
        {user?.email?.charAt(0).toUpperCase() ?? '✎'}
      </div>
      <Link
        href={href}
        className="flex-1 rounded-full border border-gray-200 bg-gray-50 px-4 py-2 text-sm text-gray-400 transition-colors hover:border-brand-300 hover:bg-white"
      >
        {hint}
      </Link>
      <Link href={href} className="btn-primary hidden text-sm sm:inline-flex">
        + Create
      </Link>
    </div>
  );
}
