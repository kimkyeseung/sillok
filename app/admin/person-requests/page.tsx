'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/fetcher';

interface PersonRequest {
  id: string;
  name_ko: string;
  name_hanja: string | null;
  reason: string;
  status: string;
  created_at: string;
  profiles: { nickname: string; avatar_url: string | null } | null;
}

interface Response {
  items: PersonRequest[];
  has_next: boolean;
}

export default function AdminPersonRequestsPage() {
  const { data, isLoading, mutate } = useSWR<Response>(
    '/api/person-requests?status=PENDING&limit=50',
    fetcher
  );

  const handleApprove = useCallback(
    async (id: string) => {
      await apiFetch(`/api/person-requests/${id}/approve`, { method: 'PUT' });
      mutate();
    },
    [mutate]
  );

  const handleReject = useCallback(
    async (id: string) => {
      const note = prompt('Rejection note (optional):') ?? undefined;
      await apiFetch(`/api/person-requests/${id}/reject`, {
        method: 'PUT',
        body: JSON.stringify({ admin_note: note }),
      });
      mutate();
    },
    [mutate]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Figure Requests</h1>
        <p className="mt-0.5 text-sm text-gray-500">Review figures requested by users</p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
          <span className="text-sm">Loading...</span>
        </div>
      ) : (data?.items ?? []).length === 0 ? (
        <div className="card-flat flex flex-col items-center py-16">
          <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-500">No pending requests</p>
          <p className="text-xs text-gray-400">All requests have been processed</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data!.items.map((req) => (
            <div key={req.id} className="card-flat p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">
                      {req.name_ko}
                    </p>
                    {req.name_hanja && (
                      <span className="text-xs text-gray-400">
                        ({req.name_hanja})
                      </span>
                    )}
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-600">
                    {req.reason}
                  </p>
                  <div className="mt-2 flex items-center gap-2 text-xs text-gray-400">
                    <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold text-gray-500">
                      {(req.profiles?.nickname ?? '?').charAt(0)}
                    </div>
                    <span>{req.profiles?.nickname ?? 'Unknown'}</span>
                    <span>&middot;</span>
                    <span>
                      {new Date(req.created_at).toLocaleDateString('en-US')}
                    </span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleApprove(req.id)}
                    className="inline-flex items-center rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(req.id)}
                    className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
