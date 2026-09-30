'use client';

/* eslint-disable @next/next/no-img-element */
import { useState } from 'react';
import Link from 'next/link';
import useSWR from 'swr';
import { fetcher, apiFetch } from '@/lib/fetcher';
import { useToast } from '@/components/common/Toast';
import { PLATFORM_INFO, PROMO_PLATFORMS, PROMO_SLIDES, type PromoPlatform } from '@/lib/promo';
import type { PromoThread } from '@/lib/promo-data';
import PromoPostCard, { type PromoPost } from '@/components/admin/PromoPostCard';

interface Kit {
  thread: PromoThread;
  posts: PromoPost[];
  links: Record<PromoPlatform, string>;
}

const SLIDE_LABELS = { cover: '1 · 표지', history: '2 · 역사', cta: '3 · 안내' } as const;

export default function ShareKitPage({ params }: { params: { threadId: string } }) {
  const { toast } = useToast();
  const { data, error, isLoading, mutate } = useSWR<Kit>(`/api/admin/promo/${params.threadId}`, fetcher);
  const [generating, setGenerating] = useState(false);
  // Bust the slide cache after edits elsewhere (slides read the live thread)
  const [slideKey] = useState(() => Date.now());

  if (isLoading) return <p className="py-12 text-sm text-gray-400">불러오는 중…</p>;
  if (error || !data)
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
        {error instanceof Error ? error.message : '불러오지 못했습니다.'}
      </div>
    );

  const { thread, posts } = data;
  const drafts = posts.filter((p) => p.status === 'draft');
  const postedTo = posts.filter((p) => p.status === 'posted');

  const generate = async () => {
    if (drafts.length && !confirm('현재 초안을 새 AI 초안으로 바꿀까요? 게시함으로 기록한 항목은 유지됩니다.')) return;
    setGenerating(true);
    try {
      await apiFetch(`/api/admin/promo/${thread.id}/generate`, { method: 'POST' });
      toast('초안을 작성했습니다');
      mutate();
    } catch (err) {
      toast(err instanceof Error ? err.message : '생성하지 못했습니다', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const add = async (platform: PromoPlatform) => {
    try {
      await apiFetch(`/api/admin/promo/${thread.id}/posts`, { method: 'POST', body: JSON.stringify({ platform }) });
      mutate();
    } catch (err) {
      toast(err instanceof Error ? err.message : '실패했습니다', 'error');
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <Link href="/admin/promo" className="text-xs text-gray-500 hover:text-gray-800">
          ← 홍보
        </Link>
        <h1 className="mt-1 text-2xl font-bold text-gray-900">공유 키트</h1>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-gray-600">
          <a href={`/threads/${thread.id}`} target="_blank" rel="noreferrer" className="font-medium text-gray-900 hover:underline">
            {thread.title}
          </a>
          <span className="text-xs text-gray-400">
            좋아요 {thread.like_count} · 댓글 {thread.reply_count} · 조회 {thread.view_count}
          </span>
          {thread.figures.length > 0 && <span className="text-xs text-gray-500">{thread.figures.map((f) => f.name).join(' · ')}</span>}
        </div>
        {postedTo.length > 0 && (
          <p className="mt-2 text-xs text-emerald-700">
            이미 게시한 곳: {postedTo.map((p) => (p.platform === 'reddit' && p.target ? `r/${p.target}` : PLATFORM_INFO[p.platform].label)).join(', ')}
          </p>
        )}
      </div>

      {/* ─── Instagram carousel ─── */}
      <section>
        <h2 className="mb-1 text-sm font-semibold text-gray-900">인스타그램 캐러셀 (1080×1350)</h2>
        <p className="mb-3 text-xs text-gray-500">세 장을 모두 받아 캐러셀 하나로 올리세요. X와 Threads에도 쓸 수 있습니다.</p>
        <div className="grid grid-cols-3 gap-3 sm:max-w-3xl">
          {PROMO_SLIDES.map((slide) => (
            <div key={slide} className="flex flex-col gap-1.5">
              <img
                src={`/api/og/promo/${thread.id}?slide=${slide}&v=${slideKey}`}
                alt={SLIDE_LABELS[slide]}
                loading="lazy"
                className="aspect-[4/5] w-full rounded-lg border border-gray-200 bg-gray-50 object-cover"
              />
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">{SLIDE_LABELS[slide]}</span>
                <a href={`/api/og/promo/${thread.id}?slide=${slide}&download=1`} download className="font-medium text-brand-700 hover:underline">
                  다운로드
                </a>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Copy ─── */}
      <section>
        <div className="mb-3 flex flex-wrap items-center gap-2">
          <h2 className="text-sm font-semibold text-gray-900">게시물</h2>
          <button type="button" className="btn-primary ml-auto text-sm" disabled={generating} onClick={generate}>
            {generating ? '작성 중…' : drafts.length ? 'AI로 초안 다시 쓰기' : 'AI로 초안 쓰기'}
          </button>
        </div>
        <p className="mb-4 text-xs text-gray-500">
          직접 게시한 뒤 게시물 URL을 붙여 넣어 기록하세요. 링크에는 플랫폼별 UTM 태그(utm_source)가 붙어 방문 경로가 분석에 잡힙니다.
          서브레딧 규칙은 바뀌니 게시 전에 사이드바를 확인하세요.
        </p>

        {PROMO_PLATFORMS.map((platform) => {
          const items = posts.filter((p) => p.platform === platform);
          return (
            <div key={platform} className="mb-6">
              <div className="mb-2 flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">{PLATFORM_INFO[platform].label}</h3>
                <button type="button" className="text-xs text-brand-700 hover:underline" onClick={() => add(platform)}>
                  + 추가
                </button>
              </div>
              <p className="mb-2 text-xs text-gray-400">{PLATFORM_INFO[platform].note}</p>
              {items.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-200 px-4 py-3 text-xs text-gray-400">아직 초안이 없습니다.</p>
              ) : (
                <div className="grid gap-3 lg:grid-cols-2">
                  {items.map((p) => (
                    <PromoPostCard key={`${p.id}-${p.updated_at ?? ''}`} post={p} onChanged={() => mutate()} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </section>
    </div>
  );
}
