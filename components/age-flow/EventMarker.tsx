'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { AgeFlowEvent } from './useAgeFlow';

interface EventMarkerProps {
  events: AgeFlowEvent[];
  currentYear: number;
}

type EventType = 'war' | 'purge' | 'revolt' | 'politics' | 'diplomacy' | 'culture' | 'dynasty';

const EVENT_STYLES: Record<EventType, { icon: string; bg: string; border: string; text: string }> = {
  war:       { icon: '\u2694\uFE0F', bg: 'bg-red-50',     border: 'border-red-200',     text: 'text-red-700' },
  purge:     { icon: '\u2620\uFE0F', bg: 'bg-purple-50',  border: 'border-purple-200',  text: 'text-purple-700' },
  revolt:    { icon: '\uD83D\uDD25', bg: 'bg-orange-50',  border: 'border-orange-200',  text: 'text-orange-700' },
  politics:  { icon: '\uD83C\uDFDB\uFE0F', bg: 'bg-slate-50',   border: 'border-slate-200',   text: 'text-slate-700' },
  diplomacy: { icon: '\uD83D\uDCDC', bg: 'bg-blue-50',    border: 'border-blue-200',    text: 'text-blue-700' },
  culture:   { icon: '\u2728',       bg: 'bg-amber-50',   border: 'border-amber-200',   text: 'text-amber-700' },
  dynasty:   { icon: '\uD83D\uDC51', bg: 'bg-yellow-50',  border: 'border-yellow-300',  text: 'text-yellow-700' },
};

const DEFAULT_STYLE = EVENT_STYLES.politics;

const YEAR_RANGE = 3;
const MAX_TOASTS = 5;

export default function EventMarker({ events, currentYear }: EventMarkerProps) {
  const inRangeEvents = useMemo(
    () =>
      events.filter((e) => {
        const year = e.metadata?.start_year;
        return typeof year === 'number' && Math.abs(year - currentYear) <= YEAR_RANGE;
      }),
    [events, currentYear]
  );

  // Toasts persist until manually dismissed via X button
  const [toasts, setToasts] = useState<Map<string, AgeFlowEvent>>(new Map());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const inRangeIds = new Set(inRangeEvents.map((e) => e.id));

    setToasts((prev) => {
      let changed = false;
      const next = new Map(prev);

      inRangeEvents.forEach((e) => {
        if (!next.has(e.id) && !dismissedIds.has(e.id)) {
          next.set(e.id, e);
          changed = true;
        }
      });

      return changed ? next : prev;
    });
  }, [inRangeEvents, dismissedIds]);

  const dismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
    setToasts((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const toastList = Array.from(toasts.values())
    .sort((a, b) => (a.metadata?.start_year ?? 0) - (b.metadata?.start_year ?? 0))
    .slice(-MAX_TOASTS);

  if (toastList.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-3 z-50 flex flex-col gap-2 md:bottom-6 md:left-6">
      {toastList.map((event) => {
        const eventType = (event.metadata?.event_type as EventType) || 'politics';
        const style = EVENT_STYLES[eventType] || DEFAULT_STYLE;

        return (
          <div
            key={event.id}
            className={`
              flex items-center gap-2.5 rounded-lg border px-3 py-2.5
              shadow-lg backdrop-blur-sm animate-toast-in
              ${style.bg} ${style.border}
            `}
          >
            <Link
              href={`/nodes/${event.slug}`}
              className="flex min-w-0 flex-1 items-center gap-2.5 hover:opacity-80"
            >
              <span className="shrink-0 text-lg leading-none">{style.icon}</span>
              <div className="min-w-0">
                <p className={`text-xs font-semibold leading-tight ${style.text} md:text-sm`}>
                  {event.title}
                </p>
                <p className="mt-0.5 text-[10px] text-gray-400">
                  {event.metadata?.start_year}
                  {event.metadata?.title_ko ? ` · ${event.metadata.title_ko}` : ''}
                </p>
              </div>
            </Link>
            <button
              onClick={() => dismiss(event.id)}
              className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-600"
              aria-label="Dismiss"
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
              </svg>
            </button>
          </div>
        );
      })}
    </div>
  );
}
