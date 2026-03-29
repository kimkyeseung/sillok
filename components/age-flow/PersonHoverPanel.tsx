'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import type { AgeFlowPersonDetail } from './useAgeFlow';
import { formatCount, getAge } from './useAgeFlow';

interface PersonHoverPanelProps {
  personSlug: string | null;
  anchorRect: DOMRect | null;
}

const cache = new Map<string, AgeFlowPersonDetail>();

export default function PersonHoverPanel({
  personSlug,
  anchorRect,
}: PersonHoverPanelProps) {
  const [detail, setDetail] = useState<AgeFlowPersonDetail | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const currentSlugRef = useRef<string | null>(null);

  const fetchDetail = useCallback(async (slug: string) => {
    if (cache.has(slug)) {
      setDetail(cache.get(slug)!);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch(`/api/persons/${slug}`);
      const json = await res.json();
      if (json.success) {
        const raw = json.data as Record<string, any>;
        // Transform tags from nested format
        const tags = raw.person_tags
          ? (raw.person_tags as Array<{
              tags: { id: string; name_en: string; type: string } | null;
            }>)
              .filter((pt) => pt.tags)
              .map((pt) => ({
                id: pt.tags!.id,
                name_en: pt.tags!.name_en,
                type: pt.tags!.type as 'ERA' | 'FIELD',
              }))
          : [];

        const detail: AgeFlowPersonDetail = {
          id: raw.id,
          slug: raw.slug,
          name_en: raw.name_en,
          name_ko: raw.name_ko,
          birth_year: raw.birth_year,
          death_year: raw.death_year,
          is_alive: raw.is_alive,
          thumbnail: raw.thumbnail,
          thread_count: raw.thread_count ?? 0,
          relation_count: raw.relation_count ?? 0,
          view_count: raw.view_count ?? 0,
          follow_count: raw.follow_count ?? 0,
          tags,
        };
        cache.set(slug, detail);
        // Only set if still the current slug
        if (currentSlugRef.current === slug) {
          setDetail(detail);
        }
      }
    } catch {
      // Silently fail — panel just won't show data
    } finally {
      if (currentSlugRef.current === slug) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }

    if (!personSlug || !anchorRect) {
      setIsVisible(false);
      setDetail(null);
      currentSlugRef.current = null;
      return;
    }

    currentSlugRef.current = personSlug;

    // 300ms delay before showing
    timerRef.current = setTimeout(() => {
      setIsVisible(true);
      fetchDetail(personSlug);
    }, 300);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [personSlug, anchorRect, fetchDetail]);

  if (!isVisible || !anchorRect) return null;

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

  const currentYear = new Date().getFullYear();

  return (
    <div style={style} className="w-64 rounded-xl border border-gray-200 bg-white p-4 shadow-xl">
      {isLoading ? (
        <div className="space-y-2">
          <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-gray-200" />
          <div className="my-2 border-t border-gray-100" />
          <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
          <div className="h-3 w-full animate-pulse rounded bg-gray-200" />
        </div>
      ) : detail ? (
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

          <Link
            href={`/person/${detail.slug}`}
            className="mt-3 block text-xs font-medium text-brand-600 hover:text-brand-700"
          >
            View Profile &rarr;
          </Link>
        </>
      ) : null}
    </div>
  );
}
