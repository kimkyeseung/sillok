'use client';

import { useCallback } from 'react';
import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/fetcher';

interface Report {
  id: string;
  target_type: string;
  target_id: string;
  reason: string;
  detail: string | null;
  status: string;
  created_at: string;
  reporter_id: string;
}

interface Response {
  items: Report[];
  has_next: boolean;
}

const typeLabel: Record<string, string> = {
  thread: 'Thread',
  reply: 'Reply',
  node_comment: 'Node comment',
};

const typeColor: Record<string, string> = {
  thread: 'bg-blue-50 text-blue-700',
  reply: 'bg-gray-100 text-gray-600',
  node_comment: 'bg-purple-50 text-purple-700',
};

const reasonLabel: Record<string, string> = {
  SPAM: 'Spam',
  ABUSE: 'Abuse',
  HATE_SPEECH: 'Hate speech',
  MISINFORMATION: 'Misinformation',
  OFF_TOPIC: 'Off topic',
  OTHER: 'Other',
};

export default function AdminReportsPage() {
  const { data, isLoading, mutate } = useSWR<Response>(
    '/api/reports?status=PENDING&limit=50',
    fetcher
  );

  const handleResolve = useCallback(
    async (id: string) => {
      const action = prompt('Resolution action (warn / delete / ban):');
      if (!action || !['warn', 'delete', 'ban'].includes(action)) return;
      await apiFetch(`/api/reports/${id}/resolve`, {
        method: 'PUT',
        body: JSON.stringify({ action }),
      });
      mutate();
    },
    [mutate]
  );

  const handleDismiss = useCallback(
    async (id: string) => {
      await apiFetch(`/api/reports/${id}/dismiss`, { method: 'PUT' });
      mutate();
    },
    [mutate]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Report Management</h1>
        <p className="mt-0.5 text-sm text-gray-500">Review and moderate reported content</p>
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
          <p className="mt-3 text-sm font-medium text-gray-500">No pending reports</p>
          <p className="text-xs text-gray-400">All reports have been processed</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data!.items.map((report) => (
            <div key={report.id} className="card-flat p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${typeColor[report.target_type] ?? 'badge-gray'}`}>
                      {typeLabel[report.target_type] ?? report.target_type}
                    </span>
                    <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[10px] font-medium text-orange-600">
                      {reasonLabel[report.reason] ?? report.reason}
                    </span>
                  </div>
                  {report.detail && (
                    <p className="mt-2 text-sm leading-relaxed text-gray-600">
                      {report.detail}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-gray-400">
                    Target ID: {report.target_id.slice(0, 8)}... &middot;{' '}
                    {new Date(report.created_at).toLocaleDateString('en-US')}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleResolve(report.id)}
                    className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                  >
                    Resolve
                  </button>
                  <button
                    onClick={() => handleDismiss(report.id)}
                    className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    Dismiss
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
