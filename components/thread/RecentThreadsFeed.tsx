'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Thread {
  id: string;
  title: string;
  video_url: string | null;
  like_count: number;
  reply_count: number;
  created_at: string;
  profiles: { nickname: string; avatar_url: string | null } | null;
  persons: { slug: string; name_en: string } | null;
  figures?: Array<{
    id: string;
    slug: string;
    name_en: string | null;
    name_ko?: string | null;
    is_primary: boolean;
  }>;
  thread_images: { url: string; sort_order: number }[];
}

function getYouTubeThumbnail(url: string): string | null {
  try {
    const u = new URL(url);
    let id: string | null = null;
    if (u.hostname === 'youtu.be') id = u.pathname.slice(1);
    else if (u.hostname.includes('youtube.com')) id = u.searchParams.get('v');
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  } catch { return null; }
}

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US');
}

export default function RecentThreadsFeed() {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/threads?limit=10')
      .then((r) => r.json())
      .then((json) => {
        if (json.success) setThreads(json.data.items);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
          Recent Threads
        </h2>
        <Link href="/threads/new" className="btn-primary text-xs">
          Write
        </Link>
      </div>

      {loading ? (
        <div className="card-flat flex justify-center py-12">
          <div className="h-7 w-7 animate-spin rounded-full border-2 border-gray-300 border-t-brand-600" />
        </div>
      ) : threads.length === 0 ? (
        <div className="card-flat flex flex-col items-center py-12 text-gray-400">
          <svg className="h-10 w-10 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" />
          </svg>
          <p className="mt-2 text-sm">No threads yet</p>
          <p className="text-xs">Be the first to start a thread!</p>
        </div>
      ) : (
        <div className="card-flat divide-y divide-gray-100">
          {threads.map((thread) => {
            const profile = thread.profiles;
            const person = thread.persons;
            const figures = thread.figures ?? (
              person
                ? [{ id: person.slug, slug: person.slug, name_en: person.name_en, is_primary: true }]
                : []
            );
            const images = (thread.thread_images ?? []).sort(
              (a, b) => a.sort_order - b.sort_order
            );
            const firstImage = images[0];
            const videoThumb = !firstImage && thread.video_url
              ? getYouTubeThumbnail(thread.video_url)
              : null;
            const hasMedia = !!firstImage || !!videoThumb;

            return (
              <Link
                key={thread.id}
                href={`/threads/${thread.id}`}
                className={`block transition-colors hover:bg-gray-50 ${hasMedia ? 'px-4 py-4' : 'flex gap-3 px-4 py-3.5'}`}
              >
                {hasMedia && (
                  <div className="relative mb-3 overflow-hidden rounded-lg">
                    <img
                      src={firstImage?.url ?? videoThumb!}
                      alt=""
                      className="h-40 w-full object-cover"
                    />
                    {videoThumb && !firstImage && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-black/60 text-white">
                          <svg className="ml-0.5 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z" />
                          </svg>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                <div className={hasMedia ? '' : 'flex gap-3'}>
                  {!hasMedia && (
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-xs font-bold text-brand-600">
                      {profile?.avatar_url ? (
                        <Image src={profile.avatar_url} alt="" width={36} height={36} className="h-full w-full object-cover" />
                      ) : (
                        (profile?.nickname ?? '?').charAt(0)
                      )}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {figures.slice(0, 3).map((figure) => (
                        <span
                          key={figure.id}
                          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold ${
                            figure.is_primary
                              ? 'bg-brand-50 text-brand-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {figure.name_en ?? figure.name_ko}
                        </span>
                      ))}
                      {figures.length > 3 && (
                        <span className="text-[10px] font-medium text-gray-400">
                          +{figures.length - 3}
                        </span>
                      )}
                      <p className={`font-medium text-gray-900 line-clamp-1 ${hasMedia ? 'text-base' : 'text-sm'}`}>
                        {thread.title}
                      </p>
                    </div>
                    <div className="mt-1 flex items-center gap-3 text-xs text-gray-400">
                      {hasMedia && (
                        <div className="mr-0.5 flex h-5 w-5 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-50 text-[9px] font-bold text-brand-600">
                          {profile?.avatar_url ? (
                            <Image src={profile.avatar_url} alt="" width={36} height={36} className="h-full w-full object-cover" />
                          ) : (
                            (profile?.nickname ?? '?').charAt(0)
                          )}
                        </div>
                      )}
                      <span>{profile?.nickname ?? 'Anonymous'}</span>
                      <span className="flex items-center gap-0.5">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                        </svg>
                        {thread.like_count}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        {thread.reply_count}
                      </span>
                      <span>{timeAgo(thread.created_at)}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
