'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { AgeFlowEvent } from './useAgeFlow';

interface EventMarkerProps {
  events: AgeFlowEvent[];
  currentYear: number;
}

export default function EventMarker({ events, currentYear }: EventMarkerProps) {
  const currentEvents = useMemo(
    () =>
      events.filter(
        (e) => e.metadata?.start_year === currentYear
      ),
    [events, currentYear]
  );

  if (currentEvents.length === 0) return null;

  return (
    <div className="fixed right-3 top-44 z-40 space-y-1 md:right-6 md:top-52">
      {currentEvents.map((event) => (
        <Link
          key={event.id}
          href={`/node/${event.slug}`}
          className="block rounded bg-gray-800/60 px-2 py-1 text-[10px] text-gray-300 backdrop-blur-sm transition-colors hover:bg-gray-700/80 hover:text-white md:text-xs"
          title={event.title}
        >
          <span className="mr-1">&#9876;</span>
          {event.title.length > 20
            ? event.title.slice(0, 20) + '...'
            : event.title}
        </Link>
      ))}
    </div>
  );
}
