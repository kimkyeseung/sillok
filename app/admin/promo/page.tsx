'use client';

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import Link from 'next/link';
import useSWRInfinite from 'swr/infinite';
import { fetcher } from '@/lib/fetcher';

interface Candidate {
  id: string;
  title: string;
  created_at: string;
  like_count: number;
  reply_count: number;
  view_count: number;
  top_score: number;
  image: string | null;
  persons: { slug: string; name_en: string | null; name_ko: string } | null;
  posted: string[];
}

interface Page {
  items: Candidate[];
  has_next: boolean;
  next_cursor: string | null;
}

const WINDOWS = [
  { value: '30', label: '최근 30일' },
  { value: '90', label: '최근 90일' },
  { value: 'all', label: '전체 기간' },
] as const;

export default function PromotionPage() {
  const [window, setWindow] = useState<(typeof WINDOWS)[number]['value']>('90');
  const [hidePosted, setHidePosted] = useState(true);
  const { data: pages, isLoading, size, setSize } = useSWRInfinite<Page>(
    (i, prev: Page | null) => {
      if (prev && !prev.has_next) return null;
      const cursor = prev?.next_cursor ? `&cursor=${encodeURIComponent(prev.next_cursor)}` : '';
      return `/api/admin/promo?window=${window}&limit=30${cursor}`;
    },
    fetcher,
  );
  const all = pages?.flatMap((p) => p.items) ?? [];
  const items = hidePosted ? all.filter((t) => t.posted.length === 0) : all;
  const hasMore = pages?.[pages.length - 1]?.has_next ?? false;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">홍보</h1>
        <p className="mt-0.5 text-sm text-gray-500">
          참여도 순 스레드 목록입니다. 공유 키트에서 인스타 슬라이드·플랫폼별 문구·추적 링크를 받아 직접 게시하세요.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1">
          {WINDOWS.map((w) => (
            <button
              key={w.value}
              type="button"
              onClick={() => setWindow(w.value)}
              className={`rounded-lg px-3 py-1.5 text-sm ${window === w.value ? 'bg-brand-50 font-medium text-brand-700' : 'text-gray-600 hover:bg-gray-100'}`}
            >
              {w.label}
            </button>
          ))}
        </div>
        <label className="ml-auto flex items-center gap-2 text-sm text-gray-600">
          <input type="checkbox" checked={hidePosted} onChange={(e) => setHidePosted(e.target.checked)} />
          이미 게시한 스레드 숨기기
        </label>
      </div>

      {isLoading ? (
        <p className="py-12 text-sm text-gray-400">불러오는 중…</p>
      ) : items.length === 0 ? (
        <p className="py-12 text-center text-sm text-gray-400">스레드가 없습니다.</p>
      ) : (
        <div className="card-flat divide-y divide-gray-100">
          {items.map((t, i) => (
            <div key={t.id} className="flex items-center gap-4 px-4 py-3">
              <span className="w-6 shrink-0 text-right text-xs text-gray-400">{i + 1}</span>
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {t.image ? (
                  <img src={t.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] text-gray-400">글</div>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <a href={`/threads/${t.id}`} target="_blank" rel="noreferrer" className="line-clamp-1 text-sm font-medium text-gray-900 hover:underline">
                  {t.title}
                </a>
                <p className="mt-0.5 text-xs text-gray-500">
                  {t.persons ? `${t.persons.name_en || t.persons.name_ko} · ` : ''}
                  좋아요 {t.like_count} · 댓글 {t.reply_count} · 조회 {t.view_count} ·{' '}
                  {new Date(t.created_at).toLocaleDateString('ko-KR')}
                </p>
                {t.posted.length > 0 && (
                  <p className="mt-1 flex flex-wrap gap-1">
                    {t.posted.map((p) => (
                      <span key={p} className="rounded bg-emerald-50 px-1.5 py-0.5 text-[11px] text-emerald-700">
                        {p}
                      </span>
                    ))}
                  </p>
                )}
              </div>
              <Link href={`/admin/promo/${t.id}`} className="btn-secondary shrink-0 px-3 py-1.5 text-xs">
                공유 키트
              </Link>
            </div>
          ))}
        </div>
      )}

      {hasMore && (
        <div className="text-center">
          <button type="button" className="btn-secondary text-sm" onClick={() => setSize(size + 1)}>
            더 보기
          </button>
        </div>
      )}
    </div>
  );
}
