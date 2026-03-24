'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { fetcher, apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';

interface Article {
  id: string;
  slug: string;
  title: string;
  tag: string;
  is_notice: boolean;
  is_published: boolean;
  view_count: number;
  created_at: string;
}

interface ArticlesResponse {
  items: Article[];
  has_next: boolean;
  next_cursor: string | null;
}

const TAG_COLORS: Record<string, string> = {
  기획: 'bg-blue-50 text-blue-700',
  특집: 'bg-purple-50 text-purple-700',
  인물탐구: 'bg-green-50 text-green-700',
  현대: 'bg-amber-50 text-amber-700',
  공지: 'bg-red-50 text-red-700',
  안내: 'bg-gray-100 text-gray-600',
};

export default function AdminArticlesPage() {
  const [cursor, setCursor] = useState<string | null>(null);
  const { toast } = useToast();

  const url = `/api/articles?limit=20&include_unpublished=true${cursor ? `&cursor=${cursor}` : ''}`;
  const { data, isLoading, mutate } = useSWR<ArticlesResponse>(url, fetcher);

  const handleDelete = async (slug: string, title: string) => {
    if (!confirm(`"${title}"을(를) 삭제하시겠습니까?`)) return;
    try {
      await apiFetch(`/api/articles/${slug}`, { method: 'DELETE' });
      toast('삭제되었습니다');
      mutate();
    } catch {
      toast('삭제에 실패했습니다', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">아티클 관리</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            아티클과 공지를 관리합니다
          </p>
        </div>
        <Link href="/admin/articles/new" className="btn-primary text-sm">
          <svg
            className="mr-1.5 inline h-4 w-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4v16m8-8H4"
            />
          </svg>
          아티클 작성
        </Link>
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
          <span className="text-sm">로딩 중...</span>
        </div>
      ) : (
        <div className="card-flat overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">제목</th>
                <th className="px-4 py-3">태그</th>
                <th className="px-4 py-3 text-center">상태</th>
                <th className="px-4 py-3 text-right">조회</th>
                <th className="px-4 py-3 text-right">관리</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.items ?? []).map((article) => (
                <tr
                  key={article.id}
                  className="transition-colors hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {article.is_notice && (
                        <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] font-medium text-red-600">
                          공지
                        </span>
                      )}
                      <span className="font-medium text-gray-900">
                        {article.title}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        TAG_COLORS[article.tag] ?? 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {article.tag}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        article.is_published
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-100 text-gray-500'
                      }`}
                    >
                      {article.is_published ? '공개' : '비공개'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {article.view_count.toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        href={`/admin/articles/${article.slug}/edit`}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </Link>
                      <button
                        onClick={() =>
                          handleDelete(article.slug, article.title)
                        }
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                      >
                        <svg
                          className="h-4 w-4"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={2}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(data?.items ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    아티클이 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {data?.has_next && (
        <div className="flex justify-center">
          <button
            onClick={() => setCursor(data.next_cursor)}
            className="btn-ghost text-sm"
          >
            더 보기
          </button>
        </div>
      )}
    </div>
  );
}
