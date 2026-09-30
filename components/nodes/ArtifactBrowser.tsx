'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import type { NodeItem } from '@/app/(public)/nodes/page';
import NodeCard from '@/components/nodes/NodeCard';
import PeriodHistogram from '@/components/nodes/PeriodHistogram';
import CollectionFilter from '@/components/nodes/CollectionFilter';
import type { ArtifactPoints } from '@/components/nodes/ArtifactMap';
import ArtifactChronology from '@/components/nodes/ArtifactChronology';
import Sheet from '@/components/age-flow/Sheet';

// MapLibre is ~800KB — only loaded when the map view is opened
const ArtifactMap = dynamic(() => import('@/components/nodes/ArtifactMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[70vh] min-h-[420px] animate-pulse rounded-xl bg-gray-50" />
  ),
});
import {
  ARTIFACT_CATEGORIES,
  ARTIFACT_PAGE_SIZE,
  ARTIFACT_PERIODS,
  ARTIFACT_REGIONS,
  ARTIFACT_SORTS,
  type ArtifactPeriod,
  centuryLabel,
  centuryOf,
  centuryStartYear,
  HERITAGE_KINDS,
} from '@/lib/artifacts';

const VIEWS = [
  { key: 'list', label: 'List' },
  { key: 'timeline', label: 'Timeline' },
  { key: 'map', label: 'Map' },
] as const;
// Timeline cards are compact — load more per page
const TIMELINE_PAGE_SIZE = 48;

interface ArtifactPage {
  items: NodeItem[];
  total: number | null;
  has_next: boolean;
  next_cursor: string | null;
}

const FILTER_KEYS = [
  'sort',
  'category',
  'kind',
  'period',
  'region',
  'collection',
  'q',
  'view',
  'from',
] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

interface Facets {
  periods: { period: ArtifactPeriod; count: number }[];
  collections: { collection: string; count: number }[];
  centuries: { century: number; count: number }[];
}

async function fetchData<T>(url: string): Promise<T> {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json.success)
    throw new Error(json.error?.message ?? 'Failed to load artifacts');
  return json.data;
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={`whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
        active
          ? 'bg-amber-100 text-amber-800'
          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
      }`}
    >
      {children}
    </button>
  );
}

function FilterIcon({ size = 12 }: { size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      aria-hidden
    >
      <path d="M4 6h16M7 12h10M10 18h4" />
    </svg>
  );
}

type SelectFilterKey = 'kind' | 'category' | 'period' | 'collection' | 'region';

/** Timeline filters as dropdowns — one row in the sticky bar, stacked in the mobile sheet */
function FilterSelects({
  values,
  collections,
  onChange,
  stacked = false,
}: {
  values: Record<SelectFilterKey, string>;
  collections: Facets['collections'] | undefined;
  onChange: (key: SelectFilterKey, value: string) => void;
  stacked?: boolean;
}) {
  const collectionOptions = (collections ?? []).map((c) => ({
    key: c.collection,
    label: `${c.collection} (${c.count})`,
  }));
  // Keep a selected collection listed even when the other filters leave it empty
  if (
    values.collection &&
    !collectionOptions.some((o) => o.key === values.collection)
  )
    collectionOptions.unshift({
      key: values.collection,
      label: values.collection,
    });

  const fields: Array<{
    key: SelectFilterKey;
    label: string;
    all: string;
    options: Array<{ key: string; label: string }>;
  }> = [
    {
      key: 'kind',
      label: 'Designation',
      all: 'All designations',
      options: [...HERITAGE_KINDS],
    },
    {
      key: 'category',
      label: 'Type',
      all: 'All types',
      options: [...ARTIFACT_CATEGORIES],
    },
    {
      key: 'period',
      label: 'Period',
      all: 'All periods',
      options: ARTIFACT_PERIODS.map((p) => ({ key: p, label: p })),
    },
    {
      key: 'collection',
      label: 'Collection',
      all: 'All collections',
      options: collectionOptions,
    },
    {
      key: 'region',
      label: 'Location',
      all: 'All regions',
      options: [...ARTIFACT_REGIONS],
    },
  ];

  return (
    <div
      className={
        stacked ? 'space-y-3' : 'flex min-w-0 flex-1 items-center gap-2'
      }
    >
      {fields.map((f) => {
        const active = !!values[f.key];
        const select = (
          <select
            value={values[f.key]}
            onChange={(e) => onChange(f.key, e.target.value)}
            aria-label={`Filter by ${f.label.toLowerCase()}`}
            className={`w-full min-w-0 truncate rounded-full border py-1.5 pl-3 pr-8 text-sm focus:border-brand-300 focus:outline-none ${
              active
                ? 'border-amber-300 bg-amber-50 font-medium text-amber-800'
                : 'border-gray-200 bg-white text-gray-700'
            } ${stacked ? 'py-2' : ''}`}
          >
            <option value="">{f.all}</option>
            {f.options.map((o) => (
              <option key={o.key} value={o.key}>
                {o.label}
              </option>
            ))}
          </select>
        );
        return stacked ? (
          <label key={f.key} className="block">
            <span className="mb-1 block text-xs font-medium text-gray-500">
              {f.label}
            </span>
            {select}
          </label>
        ) : (
          <div key={f.key} className="min-w-0 flex-1">
            {select}
          </div>
        );
      })}
    </div>
  );
}

export default function ArtifactBrowser() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const get = (k: FilterKey) => searchParams.get(k) ?? '';

  const sort = get('sort') || 'featured';
  const category = get('category');
  const kind = get('kind');
  const period = get('period');
  const region = get('region');
  const collection = get('collection');
  const q = get('q');
  const view =
    get('view') === 'map'
      ? 'map'
      : get('view') === 'timeline'
        ? 'timeline'
        : 'list';
  const isMap = view === 'map';
  const isTimeline = view === 'timeline';
  // Timeline jump point: first year of a century (?from=1401)
  const fromParam = parseInt(get('from'), 10);
  const fromYear = isTimeline && Number.isFinite(fromParam) ? fromParam : null;

  // Search box is local state, pushed to the URL after typing pauses
  const [searchInput, setSearchInput] = useState(q);
  useEffect(() => setSearchInput(q), [q]);

  // Latest params, updated synchronously — router.replace lands a render later,
  // so two quick clicks would otherwise both start from the same stale URL
  const latestParams = useRef(searchParams.toString());
  useEffect(() => {
    latestParams.current = searchParams.toString();
  }, [searchParams]);

  function replaceParams(params: URLSearchParams) {
    latestParams.current = params.toString();
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  function setFilter(key: FilterKey, value: string) {
    const params = new URLSearchParams(latestParams.current);
    if (value && !(key === 'sort' && value === 'featured'))
      params.set(key, value);
    else params.delete(key);
    replaceParams(params);
  }

  function clearFilters() {
    const params = new URLSearchParams(latestParams.current);
    for (const k of [
      'category',
      'kind',
      'period',
      'region',
      'collection',
      'q',
      'from',
    ] as const)
      params.delete(k);
    setSearchInput('');
    replaceParams(params);
  }

  useEffect(() => {
    if (searchInput.trim() === q) return;
    const t = setTimeout(() => setFilter('q', searchInput.trim()), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Timeline is always oldest first
  const query = new URLSearchParams({
    limit: String(isTimeline ? TIMELINE_PAGE_SIZE : ARTIFACT_PAGE_SIZE),
    sort: isTimeline ? 'oldest' : sort,
  });
  if (category) query.set('category', category);
  if (kind) query.set('kind', kind);
  if (period) query.set('period', period);
  if (region) query.set('region', region);
  if (collection) query.set('collection', collection);
  if (q) query.set('q', q);

  // Period chart + collection filter counts (each ignores its own selection server-side)
  const facetsQuery = new URLSearchParams(query);
  facetsQuery.delete('limit');
  facetsQuery.delete('sort');
  if (fromYear != null) query.set('from_year', String(fromYear));
  const { data: facets, isValidating: facetsLoading } = useSWR<Facets>(
    `/api/artifacts/facets?${facetsQuery.toString()}`,
    fetchData,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  // Map view: every located artifact matching the filters (sets not collapsed)
  const { data: points } = useSWR<ArtifactPoints>(
    isMap ? `/api/artifacts/map?${facetsQuery.toString()}` : null,
    fetchData,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const { data, error, size, setSize, isValidating } =
    useSWRInfinite<ArtifactPage>(
      (index, prev) => {
        if (isMap || (prev && !prev.has_next)) return null;
        const params = new URLSearchParams(query);
        if (index > 0 && prev?.next_cursor)
          params.set('cursor', prev.next_cursor);
        return `/api/artifacts?${params.toString()}`;
      },
      fetchData<ArtifactPage>,
      { revalidateFirstPage: false, revalidateOnFocus: false }
    );

  const items = data?.flatMap((p) => p.items) ?? [];
  const total = data?.[0]?.total ?? null;
  const hasNext = data?.[data.length - 1]?.has_next ?? false;
  const isLoadingMore = isValidating && (!data || data.length < size);
  function setView(v: (typeof VIEWS)[number]['key']) {
    const params = new URLSearchParams(latestParams.current);
    if (v === 'list') params.delete('view');
    else params.set('view', v);
    params.delete('from');
    replaceParams(params);
  }

  function jumpToCentury(century: number | null) {
    const start = century == null ? null : centuryStartYear(century);
    setFilter('from', start == null ? '' : String(start));
    window.scrollTo({ top: 0 });
  }

  // Timeline: a filter change reloads from the century in view (or the next one that has matches)
  const activeCentury = useRef<number | null>(null);
  const resultsTop = useRef<HTMLDivElement>(null);
  const [filtersOpen, setFiltersOpen] = useState(false);

  // Floating filter button once the filter controls have scrolled up out of view
  const filtersEnd = useRef<HTMLDivElement>(null);
  const [filtersHidden, setFiltersHidden] = useState(false);
  useEffect(() => {
    // One rect read per scroll event — updates in step with the scroll itself
    const update = () => {
      const el = filtersEnd.current;
      // Below the sticky site header (h-14)
      setFiltersHidden(!!el && el.getBoundingClientRect().top < 56);
    };
    update();
    window.addEventListener('scroll', update, { passive: true });
    return () => window.removeEventListener('scroll', update);
  }, [view]);

  function setTimelineFilter(key: SelectFilterKey, value: string) {
    const params = new URLSearchParams(latestParams.current);
    if (value) params.set(key, value);
    else params.delete(key);
    const start =
      activeCentury.current == null
        ? null
        : centuryStartYear(activeCentury.current);
    if (start == null) params.delete('from');
    else params.set('from', String(start));
    replaceParams(params);
    scrollToResults();
  }

  /** Back to the top of the results so the reloaded list starts in view */
  function scrollToResults() {
    const el = resultsTop.current;
    if (el && el.getBoundingClientRect().top < 0)
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - 120,
      });
  }

  /** Filter sheet: the timeline keeps its century; the list starts over from the top */
  function applySheetFilter(key: SelectFilterKey | 'sort', value: string) {
    if (isTimeline && key !== 'sort') return setTimelineFilter(key, value);
    setFilter(key, value);
    scrollToResults();
  }

  const filterValues = { kind, category, period, collection, region };
  const activeFilterCount = [
    kind,
    category,
    period,
    collection,
    region,
    q,
  ].filter(Boolean).length;
  const hasFilters = activeFilterCount > 0;

  // Infinite scroll
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = sentinel.current;
    if (!el || !hasNext) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) setSize((s) => s + 1);
      },
      { rootMargin: '600px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNext, isLoadingMore, setSize]);

  // Error / empty / load-more — shared by the list and the timeline
  const listStates = (
    <>
      {error && (
        <div className="py-10 text-center text-sm text-gray-500">
          Couldn&apos;t load artifacts.{' '}
          <button
            onClick={() => setSize(size)}
            className="text-brand-600 hover:text-brand-700"
          >
            Retry
          </button>
        </div>
      )}

      {data && items.length === 0 && (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <span className="text-4xl">🏺</span>
          <p className="mt-3 text-sm font-medium">No artifacts found</p>
          <p className="text-xs">Try a different filter or search term</p>
        </div>
      )}

      {hasNext && (
        <div ref={sentinel} className="mt-6 flex justify-center">
          <button
            onClick={() => setSize(size + 1)}
            disabled={isLoadingMore}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50 disabled:opacity-50"
          >
            {isLoadingMore ? 'Loading…' : 'Load more'}
          </button>
        </div>
      )}
    </>
  );

  return (
    <div>
      {/* Search + sort */}
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-0 flex-1 sm:max-w-md">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="search"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search artifacts..."
            aria-label="Search artifacts"
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-300"
          />
        </div>
        {!isTimeline && (
          <select
            value={region}
            onChange={(e) => setFilter('region', e.target.value)}
            aria-label="Filter by region"
            className="rounded-full border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-brand-300 focus:outline-none"
          >
            <option value="">All regions</option>
            {ARTIFACT_REGIONS.map((r) => (
              <option key={r.key} value={r.key}>
                {r.label}
              </option>
            ))}
          </select>
        )}
        {view === 'list' && (
          <select
            value={sort}
            onChange={(e) => setFilter('sort', e.target.value)}
            aria-label="Sort artifacts"
            className="rounded-full border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-brand-300 focus:outline-none"
          >
            {ARTIFACT_SORTS.map((s) => (
              <option key={s.key} value={s.key}>
                {s.label}
              </option>
            ))}
          </select>
        )}
        {isTimeline && (
          <button
            onClick={() => setFiltersOpen(true)}
            className={`flex items-center gap-1.5 rounded-full border px-3 py-2 text-sm font-medium lg:hidden ${
              hasFilters
                ? 'border-amber-300 bg-amber-50 text-amber-800'
                : 'border-gray-200 bg-white text-gray-700'
            }`}
          >
            <FilterIcon />
            Filters{hasFilters ? ` ${activeFilterCount}` : ''}
          </button>
        )}
        <div
          className="flex rounded-full border border-gray-200 bg-white p-0.5"
          role="group"
          aria-label="View"
        >
          {VIEWS.map(({ key: v, label }) => {
            const active = v === view;
            return (
              <button
                key={v}
                onClick={() => setView(v)}
                aria-pressed={active}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${
                  active
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Timeline: one compact row of dropdowns, pinned under the site header on desktop.
          Mobile opens the same dropdowns in the filter sheet. */}
      {isTimeline && (
        <div className="z-30 -mx-4 mb-4 hidden h-[52px] items-center gap-2 border-b border-gray-200 bg-gray-50/95 px-4 backdrop-blur lg:sticky lg:top-14 lg:flex">
          <FilterSelects
            values={filterValues}
            collections={facets?.collections}
            onChange={setTimelineFilter}
          />
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="shrink-0 whitespace-nowrap text-xs font-medium text-brand-600 hover:text-brand-700"
            >
              Clear ({activeFilterCount})
            </button>
          )}
        </div>
      )}
      {/* Filter sheet — mobile timeline button, and the floating button in list/timeline */}
      {!isMap && (
        <Sheet
          open={filtersOpen}
          onClose={() => setFiltersOpen(false)}
          title="Filters"
        >
          <div className="space-y-5 p-4">
            <FilterSelects
              stacked
              values={filterValues}
              collections={facets?.collections}
              onChange={applySheetFilter}
            />
            {view === 'list' && (
              <label className="block">
                <span className="mb-1 block text-xs font-medium text-gray-500">
                  Sort
                </span>
                <select
                  value={sort}
                  onChange={(e) => applySheetFilter('sort', e.target.value)}
                  aria-label="Sort artifacts"
                  className="w-full rounded-full border border-gray-200 bg-white py-2 pl-3 pr-8 text-sm text-gray-700 focus:border-brand-300 focus:outline-none"
                >
                  {ARTIFACT_SORTS.map((o) => (
                    <option key={o.key} value={o.key}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <div className="flex gap-2">
              {hasFilters && (
                <button
                  onClick={clearFilters}
                  className="flex-1 rounded-lg border border-gray-200 py-2.5 text-sm font-medium text-gray-600"
                >
                  Clear all
                </button>
              )}
              <button
                onClick={() => setFiltersOpen(false)}
                className="flex-1 rounded-lg bg-gray-900 py-2.5 text-sm font-medium text-white"
              >
                {total != null
                  ? `Show ${total.toLocaleString()} artifacts`
                  : 'Show results'}
              </button>
            </div>
          </div>
        </Sheet>
      )}

      {/* Filters */}
      <div className={`mb-6 space-y-2 ${isTimeline ? 'hidden' : ''}`}>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={!kind} onClick={() => setFilter('kind', '')}>
            All designations
          </Chip>
          {HERITAGE_KINDS.map((k) => (
            <Chip
              key={k.key}
              active={kind === k.key}
              onClick={() => setFilter('kind', k.key)}
            >
              {k.label}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Chip active={!category} onClick={() => setFilter('category', '')}>
            All types
          </Chip>
          {ARTIFACT_CATEGORIES.map((c) => (
            <Chip
              key={c.key}
              active={category === c.key}
              onClick={() => setFilter('category', c.key)}
            >
              {c.label}
            </Chip>
          ))}
        </div>
        <CollectionFilter
          collections={facets?.collections}
          selected={collection}
          onSelect={(c) => setFilter('collection', c)}
        />
        <PeriodHistogram
          periods={facets?.periods}
          selected={period}
          onSelect={(p) => setFilter('period', p)}
          loading={facetsLoading}
        />
      </div>

      {/* End of the filter controls — the floating button shows once this scrolls past */}
      <div ref={filtersEnd} aria-hidden />

      <div
        ref={resultsTop}
        className="mb-3 flex items-center justify-between text-xs text-gray-500"
      >
        <span aria-live="polite">
          {isMap
            ? points
              ? `${points.features.length.toLocaleString()} artifacts on the map · museum pieces without a site aren't shown`
              : 'Loading…'
            : total != null
              ? isTimeline
                ? fromYear != null
                  ? `${total.toLocaleString()} artifacts from the ${centuryLabel(centuryOf(fromYear))} on · oldest first`
                  : `${total.toLocaleString()} artifacts · oldest first`
                : `${total.toLocaleString()} artifacts`
              : data
                ? ''
                : 'Loading…'}
        </span>
        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-brand-600 hover:text-brand-700"
          >
            Clear filters
          </button>
        )}
      </div>

      {isMap ? (
        <ArtifactMap points={points} />
      ) : isTimeline ? (
        <ArtifactChronology
          items={items}
          centuries={facets?.centuries}
          fromCentury={fromYear != null ? centuryOf(fromYear) : null}
          onJump={jumpToCentury}
          onActiveChange={(c) => {
            activeCentury.current = c;
          }}
        >
          {!data && !error && (
            <div className="space-y-3 pl-8">
              {Array.from({ length: 4 }, (_, i) => (
                <div
                  key={i}
                  className="h-28 animate-pulse rounded-xl border border-gray-100 bg-gray-50"
                />
              ))}
            </div>
          )}
          {listStates}
        </ArtifactChronology>
      ) : (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((node) => (
              <NodeCard key={node.id} node={node} />
            ))}
            {!data &&
              !error &&
              Array.from({ length: 6 }, (_, i) => (
                <div
                  key={i}
                  className="h-72 animate-pulse rounded-xl border border-gray-100 bg-gray-50"
                />
              ))}
          </div>
          {listStates}
        </>
      )}

      {/* Floating filter button (list / timeline) — desktop timeline keeps its sticky bar instead */}
      {!isMap && filtersHidden && !filtersOpen && (
        <button
          onClick={() => setFiltersOpen(true)}
          aria-label={`Filters${hasFilters ? ` (${activeFilterCount} active)` : ''}`}
          className={`animate-toast-in fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-gray-900 px-4 py-3 text-sm font-semibold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 ${
            isTimeline ? 'lg:hidden' : ''
          }`}
        >
          <FilterIcon size={14} />
          Filters
          {hasFilters && (
            <span className="flex h-5 min-w-[20px] items-center justify-center rounded-full bg-amber-400 px-1.5 text-[11px] font-bold text-gray-900">
              {activeFilterCount}
            </span>
          )}
        </button>
      )}
    </div>
  );
}
