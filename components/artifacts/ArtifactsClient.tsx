'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { ArtifactItem } from '@/app/(public)/artifacts/page';

/* ── Category config ── */

const CATEGORIES = [
  { key: 'all', label: 'All', icon: '🏛', color: 'bg-gray-100 text-gray-700' },
  { key: 'architecture', label: 'Architecture', icon: '🏯', color: 'bg-amber-50 text-amber-700' },
  { key: 'sculpture', label: 'Sculpture', icon: '🗿', color: 'bg-orange-50 text-orange-700' },
  { key: 'craft', label: 'Craft', icon: '🏺', color: 'bg-emerald-50 text-emerald-700' },
  { key: 'book', label: 'Book', icon: '📜', color: 'bg-blue-50 text-blue-700' },
  { key: 'calligraphy', label: 'Calligraphy', icon: '✍️', color: 'bg-violet-50 text-violet-700' },
  { key: 'other', label: 'Other', icon: '🔮', color: 'bg-rose-50 text-rose-700' },
] as const;

const CATEGORY_MAP: Record<string, (typeof CATEGORIES)[number]> = {};
for (const cat of CATEGORIES) {
  CATEGORY_MAP[cat.key] = cat;
}

function getCategoryConfig(key: string | undefined) {
  return CATEGORY_MAP[key ?? 'other'] ?? CATEGORY_MAP['other'];
}

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

/* ── Designation number extractor ── */

function getDesignationNumber(designation?: string): string | null {
  if (!designation) return null;
  const match = designation.match(/No\.\s*(\d+)/);
  return match ? match[1] : null;
}

/* ── Component ── */

export default function ArtifactsClient({ artifacts }: { artifacts: ArtifactItem[] }) {
  const [activeCategory, setActiveCategory] = useState('all');

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = { all: artifacts.length };
    for (const a of artifacts) {
      const cat = a.metadata?.category ?? 'other';
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
  }, [artifacts]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return artifacts;
    return artifacts.filter((a) => (a.metadata?.category ?? 'other') === activeCategory);
  }, [artifacts, activeCategory]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Artifacts
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Korean national treasures and cultural heritage — {artifacts.length} items
        </p>
      </div>

      {/* Category Filter */}
      <div className="mb-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => {
          const count = categoryCounts[cat.key] ?? 0;
          if (cat.key !== 'all' && count === 0) return null;
          const isActive = activeCategory === cat.key;
          return (
            <button
              key={cat.key}
              onClick={() => setActiveCategory(cat.key)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all ${
                isActive
                  ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                  : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
              }`}
            >
              <span className="text-sm">{cat.icon}</span>
              <span>{cat.label}</span>
              <span className={`ml-0.5 text-xs ${isActive ? 'text-gray-300' : 'text-gray-400'}`}>
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Grid */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((artifact) => {
          const meta = artifact.metadata;
          const catConfig = getCategoryConfig(meta?.category);
          const num = getDesignationNumber(meta?.designation);
          const linkedPersons = (artifact.person_node_links ?? [])
            .map((l) => l.persons)
            .filter((p): p is NonNullable<typeof p> => p !== null);

          return (
            <Link
              key={artifact.id}
              href={`/nodes/${artifact.slug}`}
              className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-all hover:border-gray-300 hover:shadow-md"
            >
              {/* Thumbnail */}
              {artifact.thumbnail ? (
                <div className="relative h-40 w-full overflow-hidden bg-gray-100">
                  <Image
                    src={artifact.thumbnail}
                    alt={artifact.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                  {num && (
                    <span className="absolute left-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-lg bg-black/60 px-1.5 text-xs font-bold text-white backdrop-blur-sm">
                      #{num}
                    </span>
                  )}
                  <span className={`absolute right-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium backdrop-blur-sm ${catConfig.color}`}>
                    {catConfig.icon} {catConfig.label}
                  </span>
                </div>
              ) : (
                <>
                  <div className={`h-1 w-full ${catConfig.color.split(' ')[0]}`} />
                </>
              )}

              <div className="flex flex-1 flex-col p-4">
                {/* Badge row (only when no thumbnail) */}
                {!artifact.thumbnail && (
                  <div className="mb-2.5 flex items-center gap-2">
                    {num && (
                      <span className="flex h-7 min-w-7 items-center justify-center rounded-lg bg-amber-100 px-1.5 text-xs font-bold text-amber-800">
                        #{num}
                      </span>
                    )}
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${catConfig.color}`}>
                      {catConfig.icon} {catConfig.label}
                    </span>
                  </div>
                )}

                {/* Title */}
                <h3 className="text-sm font-semibold leading-snug text-gray-900 group-hover:text-brand-600 transition-colors">
                  {artifact.title}
                </h3>

                {/* Korean designation */}
                {meta?.designation_ko && (
                  <p className="mt-0.5 text-xs text-gray-400">{meta.designation_ko}</p>
                )}

                {/* Description */}
                {artifact.description && (
                  <p className="mt-2 text-xs leading-relaxed text-gray-500 line-clamp-2">
                    {artifact.description}
                  </p>
                )}

                {/* Meta info */}
                <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-1 pt-3 text-[11px] text-gray-400">
                  {meta?.created_period && (
                    <span className={`font-medium ${getPeriodColor(meta.created_period)}`}>
                      {meta.created_period}
                      {meta.created_year ? ` (${meta.created_year})` : ''}
                    </span>
                  )}
                  {meta?.material && (
                    <span>{meta.material}</span>
                  )}
                  {meta?.location && (
                    <span>{meta.location}</span>
                  )}
                </div>

                {/* Linked persons */}
                {linkedPersons.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1 border-t border-gray-100 pt-2">
                    {linkedPersons.slice(0, 3).map((p) => (
                      <span
                        key={p.id}
                        className="rounded-full bg-gray-50 px-2 py-0.5 text-[11px] font-medium text-gray-600"
                      >
                        {p.name_en || p.name_ko}
                      </span>
                    ))}
                    {linkedPersons.length > 3 && (
                      <span className="text-[11px] text-gray-400">
                        +{linkedPersons.length - 3}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Empty */}
      {filtered.length === 0 && (
        <div className="flex flex-col items-center py-20 text-gray-400">
          <span className="text-4xl">🏛</span>
          <p className="mt-3 text-sm font-medium">No artifacts found</p>
        </div>
      )}
    </div>
  );
}
