'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { fetcher, apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface Relation {
  id: string;
  person_a_id: string;
  person_b_id: string;
  relation_type: string;
  description: string | null;
  is_approved: boolean;
  created_at: string;
  person_a: { name_ko: string; slug: string } | null;
  person_b: { name_ko: string; slug: string } | null;
}

interface RelationsResponse {
  items: Relation[];
  has_next: boolean;
  next_cursor: string | null;
}

const RELATION_LABELS: Record<string, string> = {
  FAMILY: '가족',
  TEACHER: '스승/제자',
  ALLY: '동맹',
  RIVAL: '라이벌',
  LORD_VASSAL: '군신',
  INFLUENCE: '영향',
};

const RELATION_COLORS: Record<string, string> = {
  FAMILY: 'bg-rose-50 text-rose-700',
  TEACHER: 'bg-blue-50 text-blue-700',
  ALLY: 'bg-green-50 text-green-700',
  RIVAL: 'bg-red-50 text-red-700',
  LORD_VASSAL: 'bg-purple-50 text-purple-700',
  INFLUENCE: 'bg-amber-50 text-amber-700',
};

export default function AdminRelationsPage() {
  const [status, setStatus] = useState<'pending' | 'approved' | 'all'>(
    'pending'
  );
  const { toast } = useToast();

  const { data, isLoading, mutate } = useSWR<RelationsResponse>(
    `/api/admin/relations?status=${status}&limit=20`,
    fetcher
  );

  const handleApprove = async (id: string) => {
    try {
      await apiFetch(`/api/relations/${id}/approve`, { method: 'PUT' });
      toast('승인되었습니다');
      mutate();
    } catch {
      toast('오류가 발생했습니다', 'error');
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('이 관계 제안을 거부(삭제)하시겠습니까?')) return;
    try {
      await apiFetch(`/api/relations/${id}/reject`, { method: 'DELETE' });
      toast('거부되었습니다');
      mutate();
    } catch {
      toast('오류가 발생했습니다', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">관계 제안 관리</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          유저가 제안한 인물 관계를 승인하거나 거부합니다
        </p>
      </div>

      {/* 필터 */}
      <div className="flex gap-2">
        {(['pending', 'approved', 'all'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setStatus(s)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              status === s
                ? 'bg-brand-600 text-white'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            {s === 'pending'
              ? '대기 중'
              : s === 'approved'
                ? '승인됨'
                : '전체'}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
          <span className="text-sm">로딩 중...</span>
        </div>
      ) : (
        <div className="space-y-3">
          {(data?.items ?? []).map((rel) => (
            <div key={rel.id} className="card-flat p-4">
              <div className="flex items-center gap-3">
                {/* Person A */}
                <Link
                  href={`/persons/${rel.person_a?.slug ?? ''}`}
                  className="text-sm font-medium text-brand-700 hover:underline"
                >
                  {rel.person_a?.name_ko ?? '알 수 없음'}
                </Link>

                {/* Relation badge */}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                    RELATION_COLORS[rel.relation_type] ??
                    'bg-gray-100 text-gray-600'
                  }`}
                >
                  {RELATION_LABELS[rel.relation_type] ?? rel.relation_type}
                </span>

                {/* Arrow */}
                <svg
                  className="h-4 w-4 text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>

                {/* Person B */}
                <Link
                  href={`/persons/${rel.person_b?.slug ?? ''}`}
                  className="text-sm font-medium text-brand-700 hover:underline"
                >
                  {rel.person_b?.name_ko ?? '알 수 없음'}
                </Link>

                <div className="flex-1" />

                {/* Actions */}
                {!rel.is_approved && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleApprove(rel.id)}
                      className="rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 transition-colors hover:bg-green-100"
                    >
                      승인
                    </button>
                    <button
                      onClick={() => handleReject(rel.id)}
                      className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 transition-colors hover:bg-gray-50"
                    >
                      거부
                    </button>
                  </div>
                )}
                {rel.is_approved && (
                  <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-700">
                    승인됨
                  </span>
                )}
              </div>
              {rel.description && (
                <p className="mt-2 text-xs text-gray-500">{rel.description}</p>
              )}
            </div>
          ))}
          {(data?.items ?? []).length === 0 && (
            <div className="card-flat py-12 text-center text-gray-400">
              <p className="text-sm">
                {status === 'pending'
                  ? '대기 중인 관계 제안이 없습니다'
                  : '관계가 없습니다'}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
