'use client';

import Link from 'next/link';
import useSWR from 'swr';
import { fetcher } from '@/lib/fetcher';

interface PendingPerson {
  id: string;
  slug: string;
  name_en: string;
  name_ko: string;
  birth_year: number | null;
  pending: number;
}

export default function AdminContentReviewPage() {
  const { data, isLoading } = useSWR<{ persons: PendingPerson[] }>(
    '/api/admin/person-content/pending',
    fetcher
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Content Review</h1>
        <p className="text-sm text-gray-500">
          AI-drafted facts, highlights and sources are public with an &quot;AI draft&quot; label until reviewed.
        </p>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : !data?.persons.length ? (
        <div className="card-flat py-10 text-center text-sm text-gray-400">Nothing to review.</div>
      ) : (
        <div className="card-flat divide-y divide-gray-100">
          {data.persons.map((p) => (
            <Link
              key={p.id}
              href={`/admin/persons/${p.slug}/content`}
              className="flex items-center justify-between px-4 py-3 hover:bg-gray-50"
            >
              <span className="text-sm font-medium text-gray-900">
                {p.name_en} <span className="text-gray-400">{p.name_ko}</span>
              </span>
              <span className="rounded-full bg-violet-50 px-2 py-0.5 text-xs font-medium text-violet-700">
                {p.pending} to review
              </span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
