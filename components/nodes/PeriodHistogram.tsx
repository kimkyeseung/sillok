'use client';

import type { ArtifactPeriod } from '@/lib/artifacts';

interface PeriodCount {
  period: ArtifactPeriod;
  count: number;
}

/**
 * Artifact count per period, in chronological order — each bar is a period filter.
 * Square-root scale: Joseon alone is ~60% of all artifacts, so a linear scale would flatten the rest.
 */
export default function PeriodHistogram({
  periods,
  selected,
  onSelect,
  loading,
}: {
  periods: PeriodCount[] | undefined;
  selected: string;
  onSelect: (period: string) => void;
  loading?: boolean;
}) {
  // Hide empty periods (unless selected) so the chart stays readable
  const shown = (periods ?? []).filter(
    (p) => p.count > 0 || p.period === selected
  );
  const max = Math.max(1, ...shown.map((p) => p.count));

  if (!periods) {
    return (
      <div
        className="h-[118px] animate-pulse rounded-xl bg-gray-50"
        aria-hidden
      />
    );
  }

  return (
    <div
      className="rounded-xl border border-gray-100 bg-white p-3"
      aria-busy={loading}
    >
      <div className="mb-2 flex items-center justify-between">
        <span className="text-xs font-medium text-gray-500">By period</span>
        {selected && (
          <button
            onClick={() => onSelect('')}
            className="text-xs text-brand-600 hover:text-brand-700"
          >
            All periods
          </button>
        )}
      </div>
      <div className="-mx-3 overflow-x-auto px-3">
        <div
          className={`flex min-w-[520px] items-end gap-1 transition-opacity ${loading ? 'opacity-50' : ''}`}
          role="group"
          aria-label="Filter by period"
        >
          {shown.map(({ period, count }) => {
            const active = selected === period;
            const height =
              count === 0
                ? 2
                : Math.max(4, Math.round(Math.sqrt(count / max) * 64));
            return (
              <button
                key={period}
                type="button"
                onClick={() => onSelect(active ? '' : period)}
                aria-pressed={active}
                aria-label={`${period}: ${count.toLocaleString()} artifacts`}
                title={`${period} · ${count.toLocaleString()}`}
                className="group flex min-w-0 flex-1 flex-col items-center gap-1"
              >
                <span
                  className={`text-[10px] tabular-nums ${active ? 'font-semibold text-amber-700' : 'text-gray-400'}`}
                >
                  {count.toLocaleString()}
                </span>
                <span
                  className={`w-full rounded-t transition-colors ${
                    active
                      ? 'bg-amber-500'
                      : selected
                        ? 'bg-stone-200 group-hover:bg-amber-300'
                        : 'bg-amber-200 group-hover:bg-amber-400'
                  }`}
                  style={{ height }}
                />
                <span
                  className={`w-full truncate text-center text-[10px] leading-tight ${
                    active ? 'font-semibold text-gray-900' : 'text-gray-500'
                  }`}
                >
                  {period}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
