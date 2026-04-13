'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { NodeItem } from '@/app/(public)/nodes/page';

/* ── Type config ── */

const NODE_TYPES = [
  { key: 'all', label: 'All', icon: '🔍', color: 'bg-gray-100 text-gray-700' },
  { key: 'ARTIFACT', label: 'Artifacts', icon: '🏺', color: 'bg-amber-50 text-amber-700' },
  { key: 'EVENT', label: 'Events', icon: '⚔', color: 'bg-red-50 text-red-700' },
  { key: 'MEDIA', label: 'Media', icon: '🎬', color: 'bg-blue-50 text-blue-700' },
  { key: 'GROUP', label: 'Groups', icon: '👥', color: 'bg-purple-50 text-purple-700' },
] as const;

const TYPE_MAP: Record<string, (typeof NODE_TYPES)[number]> = {};
for (const t of NODE_TYPES) {
  TYPE_MAP[t.key] = t;
}

function getTypeConfig(type: string) {
  return TYPE_MAP[type] ?? TYPE_MAP['all'];
}

/* ── Artifact sub-categories ── */

const ARTIFACT_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'architecture', label: 'Architecture' },
  { key: 'sculpture', label: 'Sculpture' },
  { key: 'craft', label: 'Craft' },
  { key: 'book', label: 'Book' },
  { key: 'calligraphy', label: 'Calligraphy' },
  { key: 'other', label: 'Other' },
] as const;

/* ── Period color ── */

function getPeriodColor(period?: string): string {
  if (!period) return 'text-gray-400';
  if (period.includes('Silla')) return 'text-yellow-600';
  if (period.includes('Goryeo')) return 'text-teal-600';
  if (period.includes('Joseon')) return 'text-indigo-600';
  if (period.includes('Baekje')) return 'text-sky-600';
  if (period.includes('Goguryeo')) return 'text-red-600';
  return 'text-gray-500';
}

/* ── Section limits ── */

const SECTION_INITIAL = 6;
const FEATURED_COUNT = 6;

/* ── Component ── */

export default function ExploreNodesClient({ nodes }: { nodes: NodeItem[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialType = searchParams.get('type') ?? 'all';

  const [activeType, setActiveType] = useState(initialType);
  const [artifactCategory, setArtifactCategory] = useState('all');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({});
  const [searchQuery, setSearchQuery] = useState('');

  function handleTypeChange(type: string) {
    setActiveType(type);
    setArtifactCategory('all');
    setExpandedSections({});
    const url = type === 'all' ? '/nodes' : `/nodes?type=${type}`;
    router.replace(url, { scroll: false });
  }

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  /* ── Derived data ── */

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = { all: nodes.length };
    for (const n of nodes) {
      counts[n.node_type] = (counts[n.node_type] ?? 0) + 1;
    }
    return counts;
  }, [nodes]);

  const featured = useMemo(
    () => [...nodes].sort((a, b) => b.view_count - a.view_count).slice(0, FEATURED_COUNT),
    [nodes]
  );

  const filtered = useMemo(() => {
    let result = nodes;

    if (activeType !== 'all') {
      result = result.filter((n) => n.node_type === activeType);
    }

    if (activeType === 'ARTIFACT' && artifactCategory !== 'all') {
      result = result.filter(
        (n) => ((n.metadata as Record<string, unknown>)?.category ?? 'other') === artifactCategory
      );
    }

    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.description?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [nodes, activeType, artifactCategory, searchQuery]);

  const groupedByType = useMemo(() => {
    const groups: Record<string, NodeItem[]> = {};
    for (const n of nodes) {
      if (!groups[n.node_type]) groups[n.node_type] = [];
      groups[n.node_type].push(n);
    }
    return groups;
  }, [nodes]);

  /* ── "All" mode renders sections; filtered mode renders grid ── */

  const isAllMode = activeType === 'all' && !searchQuery.trim();

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Explore</h1>
        <p className="mt-1 text-sm text-gray-500">
          Discover Korean historical artifacts, events, media, and groups — {nodes.length} items
        </p>
      </div>

      {/* Type Tabs */}
      <div className="mb-4 flex flex-wrap gap-2">
        {NODE_TYPES.map((t) => {
          const count = typeCounts[t.key] ?? 0;
          if (t.key !== 'all' && count === 0) return null;
          const isActive = activeType === t.key;
          return (
            <button
              key={t.key}
              onClick={() => handleTypeChange(t.key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                isActive
                  ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-sm">{t.icon}</span>
              <span>{t.label}</span>
              <span className={`ml-0.5 text-xs ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <svg
            className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search nodes..."
            className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-300"
          />
        </div>
      </div>

      {/* Artifact sub-category filter */}
      {activeType === 'ARTIFACT' && (
        <div className="mb-6 flex flex-wrap gap-1.5">
          {ARTIFACT_CATEGORIES.map((cat) => {
            const isActive = artifactCategory === cat.key;
            return (
              <button
                key={cat.key}
                onClick={() => setArtifactCategory(cat.key)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Content */}
      {isAllMode ? (
        <div className="space-y-10">
          {/* Featured Section */}
          {featured.length > 0 && (
            <section>
              <h2 className="mb-4 flex items-center gap-2 text-base font-bold text-gray-900">
                <span className="text-lg">⭐</span> Featured
              </h2>
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((node) => (
                  <NodeCard key={node.id} node={node} />
                ))}
              </div>
            </section>
          )}

          {/* Type Sections */}
          {(['ARTIFACT', 'EVENT', 'MEDIA', 'GROUP'] as const).map((type) => {
            const items = groupedByType[type];
            if (!items || items.length === 0) return null;
            const config = getTypeConfig(type);
            const isExpanded = expandedSections[type];
            const displayItems = isExpanded ? items : items.slice(0, SECTION_INITIAL);

            return (
              <section key={type}>
                <div className="mb-4 flex items-center justify-between">
                  <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                    <span className="text-lg">{config.icon}</span> {config.label}
                    <span className="text-sm font-normal text-gray-400">{items.length}</span>
                  </h2>
                  <button
                    onClick={() => handleTypeChange(type)}
                    className="text-xs text-brand-600 hover:text-brand-700"
                  >
                    View All &rarr;
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {displayItems.map((node) => (
                    <NodeCard key={node.id} node={node} />
                  ))}
                </div>
                {items.length > SECTION_INITIAL && !isExpanded && (
                  <button
                    onClick={() => toggleSection(type)}
                    className="mt-3 flex w-full items-center justify-center gap-1 rounded-lg border border-gray-200 bg-white py-2 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-50"
                  >
                    Show more
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                )}
              </section>
            );
          })}
        </div>
      ) : (
        <>
          {/* Filtered Grid */}
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((node) => (
              <NodeCard key={node.id} node={node} />
            ))}
          </div>

          {filtered.length === 0 && (
            <div className="flex flex-col items-center py-20 text-gray-400">
              <span className="text-4xl">🔍</span>
              <p className="mt-3 text-sm font-medium">No nodes found</p>
              <p className="text-xs">Try a different filter or search term</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ── Node Card ── */

function NodeCard({ node }: { node: NodeItem }) {
  const typeConfig = getTypeConfig(node.node_type);
  const meta = node.metadata as Record<string, unknown> | null;
  const period = meta?.created_period as string | undefined;
  const designation = meta?.designation as string | undefined;
  const designationNum = designation?.match(/No\.\s*(\d+)/)?.[1] ?? null;
  const linkedPersons = (node.person_node_links ?? [])
    .map((l) => l.persons)
    .filter((p): p is NonNullable<typeof p> => p !== null);

  return (
    <Link
      href={`/nodes/${node.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-gray-300 hover:shadow-md"
    >
      {/* Thumbnail */}
      {node.thumbnail ? (
        <div className="relative h-40 w-full overflow-hidden bg-gray-100">
          <Image
            src={node.thumbnail}
            alt={node.title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          {designationNum && (
            <span className="absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-lg bg-black/60 px-1.5 text-xs font-bold text-white backdrop-blur-sm">
              #{designationNum}
            </span>
          )}
          <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm ${typeConfig.color}`}>
            {typeConfig.icon} {typeConfig.label}
          </span>
        </div>
      ) : (
        <div className={`h-1 w-full ${typeConfig.color.split(' ')[0]}`} />
      )}

      <div className="flex flex-1 flex-col p-4">
        {/* Badge row (no thumbnail) */}
        {!node.thumbnail && (
          <div className="mb-2.5 flex items-center gap-2">
            {designationNum && (
              <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-amber-100 px-1.5 text-xs font-bold text-amber-800">
                #{designationNum}
              </span>
            )}
            <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${typeConfig.color}`}>
              {typeConfig.icon} {typeConfig.label}
            </span>
          </div>
        )}

        {/* Title */}
        <h3 className="text-sm font-semibold leading-snug text-gray-900 transition-colors group-hover:text-brand-600">
          {node.title}
        </h3>

        {/* Korean subtitle */}
        {!!meta?.designation_ko && (
          <p className="mt-0.5 text-xs text-gray-400">{String(meta.designation_ko)}</p>
        )}
        {!!meta?.title_ko && !meta?.designation_ko && (
          <p className="mt-0.5 text-xs text-gray-400">{String(meta.title_ko)}</p>
        )}

        {/* Description */}
        {node.description && (
          <p className="mt-2 text-xs leading-relaxed text-gray-500 line-clamp-2">
            {node.description}
          </p>
        )}

        {/* Meta info */}
        <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-[11px] text-gray-400">
          {period && (
            <span className={`font-medium ${getPeriodColor(period)}`}>
              {period}
              {meta?.created_year ? ` (${String(meta.created_year)})` : ''}
            </span>
          )}
          {!!meta?.start_year && !period && (
            <span className="font-medium text-gray-500">{String(meta.start_year)}</span>
          )}
          {node.view_count > 0 && (
            <span className="flex items-center gap-0.5">
              <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {node.view_count.toLocaleString()}
            </span>
          )}
        </div>

        {/* Linked persons */}
        {linkedPersons.length > 0 && (
          <div className="mt-2 flex items-center gap-1 border-t border-gray-100 pt-2">
            <div className="flex -space-x-1.5">
              {linkedPersons.slice(0, 4).map((p) => (
                <div
                  key={p.id}
                  className="flex h-5 w-5 items-center justify-center overflow-hidden rounded-full border border-white bg-gray-100 text-[8px] font-bold text-gray-500"
                  title={p.name_en || p.name_ko}
                >
                  {p.thumbnail ? (
                    <Image
                      src={p.thumbnail}
                      alt={p.name_en || p.name_ko}
                      width={20}
                      height={20}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    (p.name_ko || p.name_en || '?').charAt(0)
                  )}
                </div>
              ))}
            </div>
            <span className="ml-1 text-[11px] text-gray-400">
              {linkedPersons.length === 1
                ? linkedPersons[0].name_en || linkedPersons[0].name_ko
                : `${linkedPersons[0].name_en || linkedPersons[0].name_ko} +${linkedPersons.length - 1}`}
            </span>
          </div>
        )}
      </div>
    </Link>
  );
}
