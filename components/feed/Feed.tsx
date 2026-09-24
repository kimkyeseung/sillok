'use client';

import { Fragment, useCallback, useEffect, useRef, useState } from 'react';
import FeedCard from '@/components/feed/FeedCard';
import { apiFetch } from '@/lib/fetcher';
import type { FeedItem } from '@/lib/feed-data';
import type { FeedSort, TopWindow } from '@/lib/feed';

interface Props {
  initialItems: FeedItem[];
  initialCursor: string | null;
  sort: FeedSort;
  t: TopWindow;
  board?: string;
  topic?: string;
  /** Editorial modules inserted after the Nth post (1-based), Reddit-style */
  modules?: { after: number; node: React.ReactNode }[];
  emptyState?: React.ReactNode;
}

/** Infinite thread feed with interleaved modules */
export default function Feed({ initialItems, initialCursor, sort, t, board, topic, modules = [], emptyState }: Props) {
  const [items, setItems] = useState(initialItems);
  const [cursor, setCursor] = useState(initialCursor);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const sentinel = useRef<HTMLDivElement>(null);

  // New sort/filter from the server → reset
  useEffect(() => {
    setItems(initialItems);
    setCursor(initialCursor);
  }, [initialItems, initialCursor]);

  const loadMore = useCallback(async () => {
    if (!cursor || loading) return;
    setLoading(true);
    setFailed(false);
    try {
      const params = new URLSearchParams({ sort, t, cursor });
      if (board) params.set('board', board);
      if (topic) params.set('topic', topic);
      const page = await apiFetch<{ items: FeedItem[]; next_cursor: string | null }>(`/api/feed?${params}`);
      setItems((prev) => [...prev, ...page.items.filter((i) => !prev.some((p) => p.id === i.id))]);
      setCursor(page.next_cursor);
    } catch {
      setFailed(true);
    } finally {
      setLoading(false);
    }
  }, [cursor, loading, sort, t, board, topic]);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || !cursor) return;
    const io = new IntersectionObserver((entries) => entries[0].isIntersecting && loadMore(), {
      rootMargin: '600px',
    });
    io.observe(el);
    return () => io.disconnect();
  }, [cursor, loadMore]);

  if (!items.length) return <>{emptyState}</>;

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <Fragment key={item.id}>
          <FeedCard item={item} />
          {modules
            .filter((m) => m.after === i + 1)
            .map((m, j) => (
              <Fragment key={`module-${i}-${j}`}>{m.node}</Fragment>
            ))}
        </Fragment>
      ))}
      <div ref={sentinel} />
      {cursor && (
        <button
          type="button"
          onClick={loadMore}
          disabled={loading}
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-60"
        >
          {loading ? 'Loading…' : failed ? 'Retry' : 'Load more'}
        </button>
      )}
      {!cursor && items.length > 5 && (
        <p className="py-4 text-center text-xs text-gray-400">You&apos;ve reached the end.</p>
      )}
    </div>
  );
}
