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
  thread: '스레드',
  reply: '댓글',
  node_comment: '노드 댓글',
};

const typeColor: Record<string, string> = {
  thread: 'bg-blue-50 text-blue-700',
  reply: 'bg-gray-100 text-gray-600',
  node_comment: 'bg-purple-50 text-purple-700',
};

const reasonLabel: Record<string, string> = {
  SPAM: '스팸',
  ABUSE: '욕설/비방',
  HATE_SPEECH: '혐오 표현',
  MISINFORMATION: '허위 정보',
  OFF_TOPIC: '주제 무관',
  OTHER: '기타',
};

export default function AdminReportsPage() {
  const { data, isLoading, mutate } = useSWR<Response>(
    '/api/reports?status=PENDING&limit=50',
    fetcher
  );

  const handleResolve = useCallback(
    async (id: string) => {
      const action = prompt('처리 방법 (warn / delete / ban):');
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
        <h1 className="text-2xl font-bold text-gray-900">신고 관리</h1>
        <p className="mt-0.5 text-sm text-gray-500">신고된 콘텐츠를 검토하고 처리하세요</p>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
          <span className="text-sm">로딩 중...</span>
        </div>
      ) : (data?.items ?? []).length === 0 ? (
        <div className="card-flat flex flex-col items-center py-16">
          <svg className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-3 text-sm font-medium text-gray-500">대기 중인 신고가 없습니다</p>
          <p className="text-xs text-gray-400">모든 신고가 처리되었습니다</p>
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
                    대상 ID: {report.target_id.slice(0, 8)}... &middot;{' '}
                    {new Date(report.created_at).toLocaleDateString('ko-KR')}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => handleResolve(report.id)}
                    className="inline-flex items-center rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-red-700"
                  >
                    처리
                  </button>
                  <button
                    onClick={() => handleDismiss(report.id)}
                    className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
                  >
                    기각
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
