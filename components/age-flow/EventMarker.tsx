'use client';

import { useMemo, useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { AgeFlowEvent, AgeFlowEventPerson } from './useAgeFlow';
import PersonAvatar from '@/components/common/PersonAvatar';

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

// ── Toast Card ──

function EventToastCard({
  event,
  onDismiss,
}: {
  event: AgeFlowEvent;
  onDismiss: (id: string) => void;
}) {
  const eventType = (event.metadata?.event_type as EventType) || 'politics';
  const style = EVENT_STYLES[eventType] || DEFAULT_STYLE;
  const linkedPersons = (event.person_node_links ?? [])
    .map((l) => l.persons)
    .filter((p): p is AgeFlowEventPerson => p !== null);

  return (
    <div
      className={`
        rounded-lg border shadow-lg backdrop-blur-sm animate-toast-in
        ${style.bg} ${style.border}
      `}
    >
      <div className="flex items-center gap-2.5 px-3 py-2.5">
        <Link
          href={`/nodes/${event.slug}`}
          className="flex min-w-0 flex-1 items-center gap-2.5 hover:opacity-80"
        >
          <span className="shrink-0 text-lg leading-none">{style.icon}</span>
          <div className="min-w-0">
            <p className={`text-xs font-semibold leading-tight ${style.text} md:text-sm`}>
              {event.title}
            </p>
            <p className="mt-0.5 text-xs text-gray-400">
              <span className="font-medium text-gray-500">{event.metadata?.start_year}</span>
            </p>
          </div>
        </Link>
        <button
          onClick={() => onDismiss(event.id)}
          className="shrink-0 rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-600"
          aria-label="Dismiss"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3.5 3.5l7 7M10.5 3.5l-7 7" />
          </svg>
        </button>
      </div>
      {linkedPersons.length > 0 && (
        <div className="flex items-center gap-1 border-t border-inherit px-3 py-1.5">
          <div className="flex -space-x-1.5">
            {linkedPersons.slice(0, 5).map((person) => (
              <Link
                key={person.id}
                href={`/persons/${person.slug}`}
                title={person.name_en || person.name_ko}
                className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full ring-1.5 ring-white hover:z-10 hover:ring-brand-300 transition-all"
              >
                {person.thumbnail ? (
                  <Image
                    src={person.thumbnail}
                    alt={person.name_ko}
                    fill
                    sizes="24px"
                    className="object-cover"
                  />
                ) : (
                  <PersonAvatar name={person.name_ko} size="xs" />
                )}
              </Link>
            ))}
          </div>
          <span className="ml-1 truncate text-[10px] text-gray-400">
            {linkedPersons.map((p) => p.name_en || p.name_ko).join(', ')}
          </span>
        </div>
      )}
    </div>
  );
}

// ── Main ──

export default function EventMarker({ events, currentYear }: EventMarkerProps) {
  const inRangeEvents = useMemo(
    () =>
      events.filter((e) => {
        const year = e.metadata?.start_year;
        return typeof year === 'number' && Math.abs(year - currentYear) <= YEAR_RANGE;
      }),
    [events, currentYear]
  );

  const [toasts, setToasts] = useState<Map<string, AgeFlowEvent>>(new Map());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());
  const [mobileOpen, setMobileOpen] = useState(false);

  // Auto-open mobile panel when new events arrive
  const prevToastCountRef = useState(() => ({ current: 0 }))[0];

  useEffect(() => {
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

  // Auto-open when new toasts appear
  useEffect(() => {
    if (toasts.size > prevToastCountRef.current && toasts.size > 0) {
      setMobileOpen(true);
    }
    prevToastCountRef.current = toasts.size;
  }, [toasts.size, prevToastCountRef]);

  const dismiss = useCallback((id: string) => {
    setDismissedIds((prev) => new Set(prev).add(id));
    setToasts((prev) => {
      const next = new Map(prev);
      next.delete(id);
      return next;
    });
  }, []);

  const dismissAll = useCallback(() => {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      toasts.forEach((_, id) => next.add(id));
      return next;
    });
    setToasts(new Map());
    setMobileOpen(false);
  }, [toasts]);

  const toastList = Array.from(toasts.values())
    .sort((a, b) => (a.metadata?.start_year ?? 0) - (b.metadata?.start_year ?? 0))
    .slice(-MAX_TOASTS);

  if (toastList.length === 0) return null;

  // Latest event for FAB icon
  const latestEvent = toastList[toastList.length - 1];
  const latestType = (latestEvent.metadata?.event_type as EventType) || 'politics';
  const latestStyle = EVENT_STYLES[latestType] || DEFAULT_STYLE;

  return (
    <>
      {/* ── Desktop: always-visible toasts ── */}
      <div className="fixed bottom-6 left-6 z-50 hidden max-w-[320px] flex-col gap-2 md:flex">
        {toastList.map((event) => (
          <EventToastCard key={event.id} event={event} onDismiss={dismiss} />
        ))}
      </div>

      {/* ── Mobile: FAB + expandable panel ── */}
      <div className="fixed bottom-4 left-3 right-3 z-50 md:hidden">
        {/* Expanded panel */}
        {mobileOpen && (
          <div className="mb-2 max-h-[50vh] space-y-2 overflow-y-auto rounded-xl bg-white/80 p-2 shadow-xl backdrop-blur-md border border-gray-200">
            <div className="flex items-center justify-between px-2 py-1">
              <p className="text-xs font-semibold text-gray-700">
                Events ({toastList.length})
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={dismissAll}
                  className="text-[10px] font-medium text-gray-400 transition-colors hover:text-gray-600"
                >
                  Dismiss all
                </button>
                <button
                  onClick={() => setMobileOpen(false)}
                  className="rounded p-0.5 text-gray-400 transition-colors hover:bg-gray-200/60 hover:text-gray-600"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                    <path d="M4 12l8-8M12 12L4 4" />
                  </svg>
                </button>
              </div>
            </div>
            {toastList.map((event) => (
              <EventToastCard key={event.id} event={event} onDismiss={dismiss} />
            ))}
          </div>
        )}

        {/* FAB button */}
        {!mobileOpen && (
          <button
            onClick={() => setMobileOpen(true)}
            className={`
              flex items-center gap-2 rounded-full border px-3.5 py-2.5
              shadow-lg backdrop-blur-sm transition-all active:scale-95
              ${latestStyle.bg} ${latestStyle.border}
            `}
          >
            <span className="text-base leading-none">{latestStyle.icon}</span>
            <span className={`text-xs font-semibold ${latestStyle.text}`}>
              {toastList.length === 1
                ? latestEvent.title
                : `${toastList.length} Events`}
            </span>
            {toastList.length > 1 && (
              <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gray-900/80 px-1.5 text-[10px] font-bold text-white">
                {toastList.length}
              </span>
            )}
          </button>
        )}
      </div>
    </>
  );
}
