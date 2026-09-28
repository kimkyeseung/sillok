'use client';

import { useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import useSWR from 'swr';
import useSWRInfinite from 'swr/infinite';
import type { NodeItem } from '@/app/(public)/nodes/page';
import NodeCard from '@/components/nodes/NodeCard';
import PeriodHistogram from '@/components/nodes/PeriodHistogram';
import {
  ARTIFACT_CATEGORIES,
  ARTIFACT_PAGE_SIZE,
  ARTIFACT_REGIONS,
  ARTIFACT_SORTS,
  type ArtifactPeriod,
  HERITAGE_KINDS,
} from '@/lib/artifacts';

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
  'q',
] as const;
type FilterKey = (typeof FILTER_KEYS)[number];

interface PeriodStats {
  periods: { period: ArtifactPeriod; count: number }[];
  total: number;
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
  const q = get('q');

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
    for (const k of ['category', 'kind', 'period', 'region', 'q'] as const)
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

  const query = new URLSearchParams({
    limit: String(ARTIFACT_PAGE_SIZE),
    sort,
  });
  if (category) query.set('category', category);
  if (kind) query.set('kind', kind);
  if (period) query.set('period', period);
  if (region) query.set('region', region);
  if (q) query.set('q', q);

  // Period counts follow every filter except the period itself
  const statsQuery = new URLSearchParams(query);
  statsQuery.delete('limit');
  statsQuery.delete('sort');
  statsQuery.delete('period');
  const { data: stats, isValidating: statsLoading } = useSWR<PeriodStats>(
    `/api/artifacts/periods?${statsQuery.toString()}`,
    fetchData,
    { revalidateOnFocus: false, keepPreviousData: true }
  );

  const { data, error, size, setSize, isValidating } =
    useSWRInfinite<ArtifactPage>(
      (index, prev) => {
        if (prev && !prev.has_next) return null;
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
  const hasFilters = !!(category || kind || period || region || q);

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
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-2">
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
        <PeriodHistogram
          periods={stats?.periods}
          selected={period}
          onSelect={(p) => setFilter('period', p)}
          loading={statsLoading}
        />
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
        <span aria-live="polite">
          {total != null
            ? `${total.toLocaleString()} artifacts`
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
    </div>
  );
}
