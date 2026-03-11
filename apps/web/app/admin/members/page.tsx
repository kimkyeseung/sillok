'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/fetcher';

interface Member {
  id: string;
  nickname: string;
  avatar_url: string | null;
  role: string;
  is_banned: boolean;
  banned_until: string | null;
  created_at: string;
}

interface MembersResponse {
  items: Member[];
  has_next: boolean;
  next_cursor: string | null;
}

export default function AdminMembersPage() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('');

  const params = new URLSearchParams({ limit: '20' });
  if (search) params.set('q', search);
  if (filter === 'banned') params.set('banned', 'true');

  const { data, isLoading, mutate } = useSWR<MembersResponse>(
    `/api/admin/members?${params}`,
    fetcher
  );

  const handleBan = useCallback(
    async (id: string) => {
      const reason = prompt('정지 사유를 입력하세요:');
      if (!reason) return;
      const hours = prompt('정지 시간 (시간 단위, 빈칸=영구):');

      await apiFetch(`/api/admin/members/${id}/ban`, {
        method: 'PUT',
        body: JSON.stringify({
          reason,
          ...(hours ? { duration_hours: Number(hours) } : {}),
        }),
      });
      mutate();
    },
    [mutate]
  );

  const handleUnban = useCallback(
    async (id: string) => {
      await apiFetch(`/api/admin/members/${id}/unban`, { method: 'PUT' });
      mutate();
    },
    [mutate]
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">회원 관리</h1>
        <p className="mt-0.5 text-sm text-gray-500">회원 목록을 확인하고 관리하세요</p>
      </div>

      {/* 필터 */}
      <div className="flex gap-2">
        <div className="relative flex-1 max-w-xs">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="닉네임 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="input pl-9"
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="input w-auto"
        >
          <option value="">전체</option>
          <option value="banned">정지된 회원</option>
        </select>
      </div>

      {/* 테이블 */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-8 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
          <span className="text-sm">로딩 중...</span>
        </div>
      ) : (
        <div className="card-flat overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">회원</th>
                <th className="px-4 py-3">역할</th>
                <th className="px-4 py-3">상태</th>
                <th className="px-4 py-3">가입일</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.items ?? []).map((m) => (
                <tr key={m.id} className="transition-colors hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                        {(m.nickname ?? 'U').charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-gray-900">
                        {m.nickname ?? m.id.slice(0, 8)}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge text-[10px] ${
                      m.role === 'ADMIN' ? 'bg-brand-50 text-brand-700' : 'bg-gray-100 text-gray-600'
                    }`}>
                      {m.role}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {m.is_banned ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-medium text-red-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        정지
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-medium text-green-600">
                        <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
                        정상
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-400">
                    {new Date(m.created_at).toLocaleDateString('ko-KR')}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {m.is_banned ? (
                      <button
                        onClick={() => handleUnban(m.id)}
                        className="btn-ghost text-xs text-blue-600"
                      >
                        해제
                      </button>
                    ) : (
                      <button
                        onClick={() => handleBan(m.id)}
                        className="btn-ghost text-xs text-red-600"
                      >
                        정지
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {(data?.items ?? []).length === 0 && (
            <div className="py-12 text-center text-sm text-gray-400">
              해당하는 회원이 없습니다
            </div>
          )}
        </div>
      )}
    </div>
  );
}
