'use client';

import Link from 'next/link';
import { useState } from 'react';
import useSWR from 'swr';
import { apiFetch, fetcher } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';
import { SUGGESTION_KINDS } from '@/lib/community';

type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

interface Suggestion {
  id: string;
  kind: string;
  content: string;
  source_url: string | null;
  status: Status;
  admin_note: string | null;
  created_at: string;
  author: string | null;
  persons: { slug: string; name_en: string } | null;
}

const kindLabel = (k: string) => SUGGESTION_KINDS.find((s) => s.value === k)?.label.split(' (')[0] ?? k;

export default function AdminSuggestionsPage() {
  const [status, setStatus] = useState<Status>('PENDING');
  const key = `/api/admin/suggestions?status=${status}`;
  const { data, mutate, isLoading } = useSWR<{ items: Suggestion[] }>(key, fetcher);
  const { toast } = useToast();

  const review = async (id: string, next: 'APPROVED' | 'REJECTED') => {
    const admin_note = next === 'REJECTED' ? prompt('Reason (optional)') ?? undefined : undefined;
    try {
      await apiFetch(`/api/admin/suggestions/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status: next, ...(admin_note ? { admin_note } : {}) }),
      });
      await mutate();
      toast(next === 'APPROVED' ? 'Approved — add it in the page content editor' : 'Rejected');
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Something went wrong', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Suggestions</h1>
        <p className="text-sm text-gray-500">Facts, sources and corrections suggested by members.</p>
      </div>

      <div className="flex gap-1.5">
        {(['PENDING', 'APPROVED', 'REJECTED'] as Status[]).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              status === s ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {s.charAt(0) + s.slice(1).toLowerCase()}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading...</p>
      ) : !data?.items.length ? (
        <div className="card-flat py-10 text-center text-sm text-gray-400">Nothing here.</div>
      ) : (
        <div className="card-flat divide-y divide-gray-100">
          {data.items.map((s) => (
            <div key={s.id} className="space-y-2 px-4 py-4">
              <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500">
                <span className="rounded bg-gray-100 px-1.5 py-0.5 font-medium text-gray-700">{kindLabel(s.kind)}</span>
                {s.persons && (
                  <Link href={`/persons/${s.persons.slug}`} target="_blank" className="font-medium text-brand-700 hover:underline">
                    {s.persons.name_en} ↗
                  </Link>
                )}
                <span>by {s.author ?? 'Unknown'}</span>
                <span>{new Date(s.created_at).toLocaleDateString()}</span>
              </div>
              <p className="whitespace-pre-wrap text-sm text-gray-800">{s.content}</p>
              {s.source_url && (
                <a href={s.source_url} target="_blank" rel="noopener noreferrer" className="block truncate text-xs text-brand-600 hover:underline">
                  {s.source_url}
                </a>
              )}
              {s.admin_note && <p className="text-xs text-gray-500">Note: {s.admin_note}</p>}
              {status === 'PENDING' && (
                <div className="flex flex-wrap gap-2 pt-1">
                  <button className="btn-primary text-xs" onClick={() => review(s.id, 'APPROVED')}>
                    Approve
                  </button>
                  <button className="btn-ghost text-xs text-red-600" onClick={() => review(s.id, 'REJECTED')}>
                    Reject
                  </button>
                  {s.persons && (
                    <Link href={`/admin/persons/${s.persons.slug}/content`} className="btn-ghost text-xs">
                      Open content editor →
                    </Link>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
