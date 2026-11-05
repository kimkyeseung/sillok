'use client';

import { useState } from 'react';
import useSWR from 'swr';
import Link from 'next/link';
import { fetcher, apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';
import Modal from '@/components/common/Modal';

interface Thread {
  id: string;
  title: string;
  content: string;
  is_deleted: boolean;
  view_count: number;
  reply_count: number;
  like_count: number;
  created_at: string;
  author_id: string;
  profiles: { nickname: string } | null;
  persons: { slug: string; name_ko: string; name_en: string } | null;
  thread_images: { id: string; url: string; sort_order: number }[] | null;
}

interface TakedownResult {
  thread_deleted: boolean;
  removed_files: string[];
  external_urls: string[];
}

const RESTORE_NOTE = '복구해도 삭제된 이미지 파일은 되돌릴 수 없습니다.';

function takedownSummary(r: TakedownResult) {
  const parts = [`파일 ${r.removed_files.length}개 삭제`];
  if (r.external_urls.length) parts.push(`외부 이미지 ${r.external_urls.length}개는 연결만 해제`);
  return parts.join(' · ');
}

interface ThreadsResponse {
  items: Thread[];
  has_next: boolean;
  next_cursor: string | null;
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return '방금 전';
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  return new Date(dateStr).toLocaleDateString('ko-KR');
}

export default function AdminThreadsPage() {
  const [search, setSearch] = useState('');
  const [cursor, setCursor] = useState<string | null>(null);
  const { toast } = useToast();
  const [takedownTarget, setTakedownTarget] = useState<Thread | null>(null);
  const [busy, setBusy] = useState(false);

  const url = `/api/admin/threads?limit=20${search ? `&q=${encodeURIComponent(search)}` : ''}${cursor ? `&cursor=${cursor}` : ''}`;
  const { data, isLoading, mutate } = useSWR<ThreadsResponse>(url, fetcher);

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`스레드 "${title}"을(를) 삭제(숨김)할까요?\n\n이미지 파일은 그대로 남아 URL로 접근할 수 있습니다. 저작권 신고 건은 '게시 중단'을 사용하세요.`)) return;
    try {
      await apiFetch(`/api/admin/threads/${id}`, { method: 'DELETE' });
      toast('삭제됨');
      mutate();
    } catch {
      toast('삭제하지 못했습니다', 'error');
    }
  };

  const runTakedown = async (thread: Thread, imageId?: string) => {
    const message = imageId
      ? `이 이미지를 게시 중단할까요?\n\n스토리지에서 파일을 영구 삭제합니다 (URL이 404가 됨). 스레드는 유지됩니다.\n${RESTORE_NOTE}`
      : `스레드 "${thread.title}"을(를) 게시 중단할까요?\n\n스레드를 삭제하고 이미지 파일을 스토리지에서 영구 삭제합니다 (URL이 404가 됨).\n${RESTORE_NOTE}`;
    if (!confirm(message)) return;
    setBusy(true);
    try {
      const result = await apiFetch<TakedownResult>(`/api/admin/threads/${thread.id}/takedown`, {
        method: 'POST',
        body: JSON.stringify(imageId ? { image_id: imageId } : {}),
      });
      toast(`게시 중단 완료 — ${takedownSummary(result)}`);
      const fresh = await mutate();
      if (result.thread_deleted) setTakedownTarget(null);
      else setTakedownTarget(fresh?.items.find((t) => t.id === thread.id) ?? null);
    } catch (e) {
      toast(e instanceof Error ? e.message : '게시 중단하지 못했습니다', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRestore = async (id: string) => {
    if (!confirm(`스레드를 복구할까요?\n${RESTORE_NOTE}`)) return;
    try {
      await apiFetch(`/api/admin/threads/${id}`, { method: 'PATCH' });
      toast('복구했습니다');
      mutate();
    } catch {
      toast('복구하지 못했습니다', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">스레드 관리</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          커뮤니티 스레드를 관리합니다
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="제목으로 검색..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCursor(null);
          }}
          className="input pl-10"
        />
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center gap-2 py-12 text-gray-400">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-brand-600" />
          <span className="text-sm">불러오는 중...</span>
        </div>
      ) : (
        <div className="card-flat overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 bg-gray-50/50 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <th className="px-4 py-3">스레드</th>
                <th className="px-4 py-3">인물</th>
                <th className="px-4 py-3">작성자</th>
                <th className="px-4 py-3 text-center">상태</th>
                <th className="px-4 py-3 text-right">댓글</th>
                <th className="px-4 py-3 text-right">좋아요</th>
                <th className="px-4 py-3 text-right">작성일</th>
                <th className="px-4 py-3 text-right">작업</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {(data?.items ?? []).map((thread) => (
                <tr
                  key={thread.id}
                  className={`transition-colors hover:bg-gray-50 ${thread.is_deleted ? 'opacity-50' : ''}`}
                >
                  <td className="max-w-[240px] px-4 py-3">
                    <Link
                      href={`/threads/${thread.id}`}
                      className="font-medium text-gray-900 hover:text-brand-600 line-clamp-1"
                    >
                      {thread.title}
                    </Link>
                  </td>
                  <td className="px-4 py-3">
                    {thread.persons ? (
                      <Link
                        href={`/persons/${thread.persons.slug}`}
                        className="text-brand-600 hover:text-brand-700"
                      >
                        {thread.persons.name_ko}
                      </Link>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
                    {thread.profiles?.nickname ?? '익명'}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        thread.is_deleted
                          ? 'bg-red-50 text-red-600'
                          : 'bg-green-50 text-green-700'
                      }`}
                    >
                      {thread.is_deleted ? '삭제됨' : '게시됨'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {thread.reply_count}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-500">
                    {thread.like_count}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-400 text-xs">
                    {timeAgo(thread.created_at)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      {!thread.is_deleted && (
                        <Link
                          href={`/admin/promo/${thread.id}`}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600"
                          title="공유 키트"
                          aria-label="공유 키트"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                          </svg>
                        </Link>
                      )}
                      <button
                        onClick={() => setTakedownTarget(thread)}
                        className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-amber-50 hover:text-amber-700"
                        title="게시 중단 (저작권 신고)"
                        aria-label="게시 중단 (저작권 신고)"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                      </button>
                      {thread.is_deleted ? (
                        <button
                          onClick={() => handleRestore(thread.id)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-green-50 hover:text-green-600"
                          title="복구"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      ) : (
                        <button
                          onClick={() => handleDelete(thread.id, thread.title)}
                          className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600"
                          title="삭제"
                        >
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {(data?.items ?? []).length === 0 && (
                <tr>
                  <td
                    colSpan={8}
                    className="px-4 py-12 text-center text-gray-400"
                  >
                    스레드가 없습니다
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!takedownTarget} onClose={() => !busy && setTakedownTarget(null)} title="게시 중단 (저작권 신고)">
        {takedownTarget && (
          <div className="space-y-4 text-sm">
            <p className="text-gray-600">
              <span className="font-medium text-gray-900">{takedownTarget.title}</span>
              <br />
              게시 중단은 스토리지의 이미지 파일을 <b>영구 삭제</b>합니다. 일반 삭제와 달리 복구해도 파일은 돌아오지 않습니다.
              외부 URL 이미지는 파일을 지울 수 없어 스레드와의 연결만 해제합니다.
            </p>
            {(takedownTarget.thread_images ?? []).length > 0 ? (
              <ul className="space-y-2">
                {[...(takedownTarget.thread_images ?? [])]
                  .sort((a, b) => a.sort_order - b.sort_order)
                  .map((img) => (
                    <li key={img.id} className="flex items-center gap-3 rounded-lg border border-gray-100 p-2">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={img.url} alt="" className="h-12 w-12 rounded object-cover" />
                      <a href={img.url} target="_blank" rel="noreferrer" className="min-w-0 flex-1 truncate text-xs text-gray-500 hover:text-brand-600">
                        {img.url}
                      </a>
                      <button
                        onClick={() => runTakedown(takedownTarget, img.id)}
                        disabled={busy}
                        className="shrink-0 rounded-lg border border-red-200 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        이 이미지만 삭제
                      </button>
                    </li>
                  ))}
              </ul>
            ) : (
              <p className="text-gray-400">연결된 이미지가 없습니다 (폴더에 남은 업로드 파일은 전체 게시 중단 시 함께 삭제됩니다).</p>
            )}
            <div className="flex justify-end gap-2 pt-2">
              <button onClick={() => setTakedownTarget(null)} disabled={busy} className="btn-ghost text-sm">
                취소
              </button>
              <button
                onClick={() => runTakedown(takedownTarget)}
                disabled={busy}
                className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
              >
                {busy ? '처리 중...' : '스레드 전체 게시 중단'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Pagination */}
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
