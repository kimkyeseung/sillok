'use client';

import { useState, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import type { NodeItem } from '@/app/(public)/nodes/page';
import NodeCard, {
  NODE_TYPES,
  getTypeConfig,
} from '@/components/nodes/NodeCard';
import ArtifactBrowser from '@/components/nodes/ArtifactBrowser';

/* ── Section limits ── */

const SECTION_INITIAL = 6;
const FEATURED_COUNT = 6;

/* ── Component ── */

export default function ExploreNodesClient({
  nodes,
  artifactTotal,
}: {
  /** Curated nodes of every type (bulk-imported heritage artifacts are browsed via ArtifactBrowser) */
  nodes: NodeItem[];
  /** All published artifacts, including bulk-imported heritage */
  artifactTotal: number;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const initialType = searchParams.get('type') ?? 'all';

  const [activeType, setActiveType] = useState(initialType);
  const [expandedSections, setExpandedSections] = useState<
    Record<string, boolean>
  >({});
  const [searchQuery, setSearchQuery] = useState('');

  function handleTypeChange(type: string) {
    setActiveType(type);
    setExpandedSections({});
    const url = type === 'all' ? '/nodes' : `/nodes?type=${type}`;
    router.replace(url, { scroll: false });
  }

  function toggleSection(key: string) {
    setExpandedSections((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  /* ── Derived data ── */

  const typeCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const n of nodes) {
      counts[n.node_type] = (counts[n.node_type] ?? 0) + 1;
    }
    counts.all = nodes.length - (counts.ARTIFACT ?? 0) + artifactTotal;
    counts.ARTIFACT = artifactTotal;
    return counts;
  }, [nodes, artifactTotal]);

  const featured = useMemo(
    () =>
      [...nodes]
        .sort((a, b) => b.view_count - a.view_count)
        .slice(0, FEATURED_COUNT),
    [nodes]
  );

  const filtered = useMemo(() => {
    let result = nodes;

    if (activeType !== 'all') {
      result = result.filter((n) => n.node_type === activeType);
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
  }, [nodes, activeType, searchQuery]);

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
          Discover Korean historical artifacts, events, media, and groups —{' '}
          {typeCounts.all.toLocaleString()} items
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
              <span
                className={`ml-0.5 text-xs ${isActive ? 'text-gray-300' : 'text-gray-400'}`}
              >
                {count.toLocaleString()}
              </span>
            </button>
          );
        })}
      </div>

      {activeType === 'ARTIFACT' ? (
        <ArtifactBrowser />
      ) : (
        <>
          {/* Search */}
          <div className="mb-6">
            <div className="relative max-w-md">
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
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search nodes..."
                className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-9 pr-3 text-sm text-gray-900 placeholder-gray-400 focus:border-brand-300 focus:bg-white focus:outline-none focus:ring-1 focus:ring-brand-300"
              />
            </div>
          </div>

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
              {(['ARTIFACT', 'EVENT', 'MEDIA', 'GROUP'] as const).map(
                (type) => {
                  const items = groupedByType[type];
                  if (!items || items.length === 0) return null;
                  const config = getTypeConfig(type);
                  const isExpanded = expandedSections[type];
                  const displayItems = isExpanded
                    ? items
                    : items.slice(0, SECTION_INITIAL);

                  return (
                    <section key={type}>
                      <div className="mb-4 flex items-center justify-between">
                        <h2 className="flex items-center gap-2 text-base font-bold text-gray-900">
                          <span className="text-lg">{config.icon}</span>{' '}
                          {config.label}
                          <span className="text-sm font-normal text-gray-400">
                            {(
                              typeCounts[type] ?? items.length
                            ).toLocaleString()}
                          </span>
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
                          <svg
                            className="h-4 w-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M19 9l-7 7-7-7"
                            />
                          </svg>
                        </button>
                      )}
                    </section>
                  );
                }
              )}
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
                  <p className="text-xs">
                    Try a different filter or search term
                  </p>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
