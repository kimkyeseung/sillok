'use client';

import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
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

// Show events within ±3 years to survive fast scrolling
const YEAR_RANGE = 3;
// Keep toast visible for 4 seconds after leaving range
const LINGER_MS = 4000;
// Max toasts shown at once
const MAX_TOASTS = 5;

interface ToastEvent {
  event: AgeFlowEvent;
  phase: 'entering' | 'visible' | 'exiting';
}

export default function EventMarker({ events, currentYear }: EventMarkerProps) {
  const inRangeEvents = useMemo(
    () =>
      events.filter((e) => {
        const year = e.metadata?.start_year;
        return typeof year === 'number' && Math.abs(year - currentYear) <= YEAR_RANGE;
      }),
    [events, currentYear]
  );

  const [toasts, setToasts] = useState<Map<string, ToastEvent>>(new Map());
  const lingerTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const exitTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const startExit = useCallback((id: string) => {
    // Mark as exiting, then remove after animation
    setToasts((prev) => {
      const existing = prev.get(id);
      if (!existing) return prev;
      const next = new Map(prev);
      next.set(id, { ...existing, phase: 'exiting' });
      return next;
    });
    const timer = setTimeout(() => {
      removeToast(id);
      exitTimersRef.current.delete(id);
    }, 300); // matches CSS exit animation
    exitTimersRef.current.set(id, timer);
  }, [removeToast]);

  useEffect(() => {
    const inRangeIds = new Set(inRangeEvents.map((e) => e.id));

    setToasts((prev) => {
      const next = new Map(prev);

      // Add new events as entering, then transition to visible
      inRangeEvents.forEach((e) => {
        if (!next.has(e.id)) {
          next.set(e.id, { event: e, phase: 'entering' });
          // Transition to visible after enter animation
          requestAnimationFrame(() => {
            setToasts((curr) => {
              const item = curr.get(e.id);
              if (!item || item.phase !== 'entering') return curr;
              const updated = new Map(curr);
              updated.set(e.id, { ...item, phase: 'visible' });
              return updated;
            });
          });
        }

        // Cancel any pending exit/linger
        const lingerTimer = lingerTimersRef.current.get(e.id);
        if (lingerTimer) {
          clearTimeout(lingerTimer);
          lingerTimersRef.current.delete(e.id);
        }
        const exitTimer = exitTimersRef.current.get(e.id);
        if (exitTimer) {
          clearTimeout(exitTimer);
          exitTimersRef.current.delete(e.id);
          // Restore to visible if it was exiting
          const existing = next.get(e.id);
          if (existing?.phase === 'exiting') {
            next.set(e.id, { ...existing, phase: 'visible' });
          }
        }
      });

      // Schedule linger → exit for events that left range
      prev.forEach((toast, id) => {
        if (
          !inRangeIds.has(id) &&
          toast.phase !== 'exiting' &&
          !lingerTimersRef.current.has(id)
        ) {
          const timer = setTimeout(() => {
            startExit(id);
            lingerTimersRef.current.delete(id);
          }, LINGER_MS);
          lingerTimersRef.current.set(id, timer);
        }
      });

      return next;
    });
  }, [inRangeEvents, startExit]);

  // Cleanup on unmount
  useEffect(() => {
    const lTimers = lingerTimersRef.current;
    const eTimers = exitTimersRef.current;
    return () => {
      lTimers.forEach((t) => clearTimeout(t));
      eTimers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const toastList = Array.from(toasts.values())
    .sort(
      (a, b) =>
        (a.event.metadata?.start_year ?? 0) - (b.event.metadata?.start_year ?? 0)
    )
    .slice(-MAX_TOASTS);

  if (toastList.length === 0) return null;

  return (
    <div className="fixed bottom-4 left-3 z-50 flex flex-col gap-2 md:bottom-6 md:left-6">
      {toastList.map(({ event, phase }) => {
        const eventType = (event.metadata?.event_type as EventType) || 'politics';
        const style = EVENT_STYLES[eventType] || DEFAULT_STYLE;

        return (
          <Link
            key={event.id}
            href={`/nodes/${event.slug}`}
            className={`
              flex items-center gap-2.5 rounded-lg border px-3 py-2.5
              shadow-lg backdrop-blur-sm
              transition-all duration-300
              ${style.bg} ${style.border}
              ${phase === 'entering' ? 'translate-y-2 opacity-0' : ''}
              ${phase === 'visible' ? 'translate-y-0 opacity-100' : ''}
              ${phase === 'exiting' ? '-translate-y-1 opacity-0' : ''}
              hover:shadow-xl
            `}
          >
            <span className="shrink-0 text-lg leading-none">{style.icon}</span>
            <div className="min-w-0">
              <p className={`text-xs font-semibold leading-tight ${style.text} md:text-sm`}>
                {event.title}
              </p>
              <p className="mt-0.5 text-[10px] text-gray-400">
                {event.metadata?.start_year}
              </p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
