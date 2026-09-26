'use client';

import { useState, useEffect } from 'react';
import type { AgeFlowPersonDetail } from './useAgeFlow';
import { formatCount, getAge } from './useAgeFlow';
import { usePersonDetail } from './usePersonDetail';

interface PersonHoverPanelProps {
  personSlug: string | null;
  anchorRect: DOMRect | null;
}

/** Stats + tags block — shared with the mobile PersonSheet */
export function PersonDetailBody({ detail }: { detail: AgeFlowPersonDetail }) {
  const currentYear = new Date().getFullYear();
  return (
    <>
      <p className="font-medium text-gray-900">
        {detail.name_en || detail.name_ko}
      </p>
      <p className="mt-0.5 text-xs text-gray-500">
        {detail.birth_year} — {detail.is_alive ? 'Present' : detail.death_year}
        {' '}
        ({detail.is_alive
          ? getAge(detail.birth_year, currentYear)
          : detail.death_year
            ? detail.death_year - detail.birth_year
            : '?'
        })
      </p>

      <div className="my-2 border-t border-gray-100" />

      <div className="space-y-1 text-xs text-gray-600">
        <div className="flex justify-between">
          <span>Threads</span>
          <span className="font-medium">{formatCount(detail.thread_count)}</span>
        </div>
        <div className="flex justify-between">
          <span>Relations</span>
          <span className="font-medium">{formatCount(detail.relation_count)}</span>
        </div>
        <div className="flex justify-between">
          <span>Views</span>
          <span className="font-medium">{formatCount(detail.view_count)}</span>
        </div>
        <div className="flex justify-between">
          <span>Follows</span>
          <span className="font-medium">{formatCount(detail.follow_count)}</span>
        </div>
      </div>

      <div className="my-2 border-t border-gray-100" />

      <div className="flex flex-wrap gap-1">
        {detail.tags.map((tag) => (
          <span
            key={tag.id}
            className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-600"
          >
            {tag.name_en}
          </span>
        ))}
      </div>
    </>
  );
}

export function PersonDetailSkeleton() {
  return (
    <div className="space-y-2">
      <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
      <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
      <div className="my-2 border-t border-gray-100" />
      <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
      <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
      <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
      <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
    </div>
  );
}

export default function PersonHoverPanel({
  personSlug,
  anchorRect,
}: PersonHoverPanelProps) {
  // 300ms delay before showing (and fetching) so quick mouse passes don't fire requests
  const [shownSlug, setShownSlug] = useState<string | null>(null);

  useEffect(() => {
    if (!personSlug || !anchorRect) {
      setShownSlug(null);
      return;
    }
    const timer = setTimeout(() => setShownSlug(personSlug), 300);
    return () => clearTimeout(timer);
  }, [personSlug, anchorRect]);

  const { data: detail, error } = usePersonDetail(shownSlug);

  if (error || !shownSlug || shownSlug !== personSlug || !anchorRect) return null;

  // Position: prefer right of card, flip to left if near viewport edge
  const panelWidth = 256;
  const gap = 8;
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
  const spaceRight = viewportWidth - anchorRect.right;
  const showOnLeft = spaceRight < panelWidth + gap;

  const style: React.CSSProperties = {
    position: 'fixed',
    top: Math.max(8, anchorRect.top),
    left: showOnLeft
      ? anchorRect.left - panelWidth - gap
      : anchorRect.right + gap,
    zIndex: 50,
  };

  return (
    <div style={style} className="w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
      {detail ? <PersonDetailBody detail={detail} /> : <PersonDetailSkeleton />}
    </div>
  );
}
