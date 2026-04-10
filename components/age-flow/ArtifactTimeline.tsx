'use client';

import { useMemo, useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

// ── Types ──

export interface AgeFlowArtifact {
  id: string;
  slug: string;
  title: string;
  thumbnail: string | null;
  metadata: {
    designation?: string;
    designation_ko?: string;
    created_year?: number;
    created_period?: string;
    category?: string;
    material?: string;
  } | null;
}

interface ArtifactTimelineProps {
  artifacts: AgeFlowArtifact[];
  currentYear: number;
  minYear: number;
  maxYear: number;
  onYearClick: (year: number) => void;
}

// ── Constants ──

const PX_PER_YEAR = 14;
const CARD_WIDTH = 160;
const CARD_CULL_MARGIN = 200;
const CLUSTER_RANGE = 12; // years within ±12 get clustered

const CAT_ICONS: Record<string, string> = {
  architecture: '🏯',
  sculpture: '🗿',
  craft: '🏺',
  book: '📜',
  calligraphy: '✍️',
  other: '🔮',
};

function getCatIcon(cat?: string) {
  return CAT_ICONS[cat ?? 'other'] ?? '🔮';
}

// ── Cluster type ──

interface ArtifactCluster {
  centerYear: number; // weighted center year
  minYear: number;
  maxYear: number;
  artifacts: Array<{ year: number; artifact: AgeFlowArtifact }>;
}

function buildClusters(
  artifactsByYear: Map<number, AgeFlowArtifact[]>
): ArtifactCluster[] {
  // Flatten and sort
  const flat: Array<{ year: number; artifact: AgeFlowArtifact }> = [];
  artifactsByYear.forEach((arts, year) => {
    arts.forEach((a) => flat.push({ year, artifact: a }));
  });
  flat.sort((a, b) => a.year - b.year);

  if (flat.length === 0) return [];

  // Greedy clustering: if next item is within CLUSTER_RANGE of cluster's last year, merge
  const clusters: ArtifactCluster[] = [];
  let current: ArtifactCluster = {
    centerYear: flat[0].year,
    minYear: flat[0].year,
    maxYear: flat[0].year,
    artifacts: [flat[0]],
  };

  for (let i = 1; i < flat.length; i++) {
    const item = flat[i];
    if (item.year - current.maxYear <= CLUSTER_RANGE) {
      // Merge into current cluster
      current.artifacts.push(item);
      current.maxYear = item.year;
    } else {
      // Finalize current, start new
      clusters.push(current);
      current = {
        centerYear: item.year,
        minYear: item.year,
        maxYear: item.year,
        artifacts: [item],
      };
    }
  }
  clusters.push(current);

  // Set centerYear to the median year of the cluster
  clusters.forEach((c) => {
    const mid = Math.floor(c.artifacts.length / 2);
    c.centerYear = c.artifacts[mid].year;
  });

  return clusters;
}

// ── Component ──

export default function ArtifactTimeline({
  artifacts,
  currentYear,
  minYear,
  maxYear,
  onYearClick,
}: ArtifactTimelineProps) {
  const [hoveredArtifact, setHoveredArtifact] = useState<string | null>(null);
  const [expandedCluster, setExpandedCluster] = useState<number | null>(null); // centerYear
  const [centerX, setCenterX] = useState(0);

  useEffect(() => {
    const update = () => setCenterX(window.innerWidth / 2);
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // year → artifacts map
  const artifactsByYear = useMemo(() => {
    const map = new Map<number, AgeFlowArtifact[]>();
    artifacts.forEach((a) => {
      const year = a.metadata?.created_year;
      if (year == null) return;
      const list = map.get(year) ?? [];
      list.push(a);
      map.set(year, list);
    });
    return map;
  }, [artifacts]);

  const artifactYears = useMemo(
    () => Array.from(artifactsByYear.keys()).sort((a, b) => a - b),
    [artifactsByYear]
  );

  // Build clusters + cluster year set for dial bar
  const clusters = useMemo(
    () => buildClusters(artifactsByYear),
    [artifactsByYear]
  );

  const clusterRanges = useMemo(
    () =>
      clusters
        .filter((c) => c.artifacts.length > 1)
        .map((c) => ({ min: c.minYear, max: c.maxYear })),
    [clusters]
  );

  // Dial click handler
  const handleDialClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const dialOffset = centerX - (currentYear - minYear) * PX_PER_YEAR;
      const year = Math.round(minYear + (clickX - dialOffset) / PX_PER_YEAR);
      const clamped = Math.max(minYear, Math.min(maxYear, year));
      onYearClick(clamped);
    },
    [centerX, currentYear, minYear, maxYear, onYearClick]
  );

  // Close expanded cluster on scroll (year change)
  useEffect(() => {
    setExpandedCluster(null);
  }, [currentYear]);

  if (artifactYears.length === 0) return null;

  const totalYears = maxYear - minYear + 1;
  const dialOffset = centerX - (currentYear - minYear) * PX_PER_YEAR;

  // Tick culling range
  const viewportYears = Math.ceil((centerX * 2) / PX_PER_YEAR) + 10;
  const tickStart = Math.max(0, currentYear - minYear - viewportYears / 2);
  const tickEnd = Math.min(totalYears - 1, currentYear - minYear + viewportYears / 2);

  return (
    // Hidden on mobile — TimelinePanel mobile bar already occupies the bottom
    <div className="fixed bottom-0 left-0 right-0 z-40 pointer-events-none hidden md:block">
      {/* ── Artifact cards ── */}
      <div
        className="relative h-44 pointer-events-auto transition-transform duration-[400ms] ease-out"
        style={{ transform: `translateX(${dialOffset}px)` }}
      >
        {clusters.map((cluster) => {
          const isSingle = cluster.artifacts.length === 1;

          // Sticky positioning for clusters:
          // - Before range: pin to minYear (approaching from right)
          // - Inside range: pin to currentYear (stays at center)
          // - After range: pin to maxYear (scrolls left)
          const pinnedYear = isSingle
            ? cluster.centerYear
            : currentYear < cluster.minYear
              ? cluster.minYear
              : currentYear > cluster.maxYear
                ? cluster.maxYear
                : currentYear;

          const x = (pinnedYear - minYear) * PX_PER_YEAR;
          const screenX = x + dialOffset;

          // Viewport culling
          if (
            screenX < -CARD_WIDTH - CARD_CULL_MARGIN ||
            screenX > centerX * 2 + CARD_CULL_MARGIN
          ) {
            return null;
          }

          const isExpanded = expandedCluster === cluster.centerYear;
          const isInRange = !isSingle && currentYear >= cluster.minYear && currentYear <= cluster.maxYear;
          const dist = isSingle
            ? Math.abs(cluster.centerYear - currentYear)
            : isInRange
              ? 0
              : Math.min(
                  Math.abs(cluster.minYear - currentYear),
                  Math.abs(cluster.maxYear - currentYear)
                );
          const isCenter = dist <= 2;
          const lead = cluster.artifacts[0];

          // ── Single artifact: render card directly ──
          if (isSingle) {
            const { year, artifact } = lead;
            const isHovered = hoveredArtifact === artifact.id;

            return (
              <Link
                key={artifact.id}
                href={`/nodes/${artifact.slug}`}
                className="absolute bottom-0 transition-all duration-[400ms] ease-out"
                style={{
                  left: 0,
                  opacity: isHovered ? 1 : isCenter ? 0.95 : Math.max(0.5, 1 - dist * 0.03),
                  transform: `translateX(${x}px) translateX(-50%)`,
                  zIndex: isHovered ? 20 : isCenter ? 10 : 1,
                }}
                onMouseEnter={() => setHoveredArtifact(artifact.id)}
                onMouseLeave={() => setHoveredArtifact(null)}
              >
                <ArtifactCard
                  artifact={artifact}
                  year={year}
                  isHovered={isHovered}
                  isCenter={isCenter}
                />
                <div
                  className={`mx-auto h-3 w-px transition-colors duration-300 ${
                    isCenter ? 'bg-amber-400' : 'bg-gray-300/60'
                  }`}
                />
              </Link>
            );
          }

          // ── Cluster: stacked preview or expanded ──
          const stackCount = cluster.artifacts.length;

          return (
            <div
              key={`cluster-${cluster.centerYear}`}
              className="absolute bottom-0 transition-transform duration-[400ms] ease-out"
              style={{
                left: 0,
                transform: `translateX(${x}px) translateX(-50%)`,
                zIndex: isExpanded ? 30 : isCenter ? 10 : 1,
              }}
            >
              {isExpanded ? (
                // ── Expanded: fan out cards horizontally ──
                <div className="relative flex gap-1.5 pb-3">
                  {cluster.artifacts.map(({ year, artifact }, i) => {
                    const isHovered = hoveredArtifact === artifact.id;
                    return (
                      <Link
                        key={artifact.id}
                        href={`/nodes/${artifact.slug}`}
                        className="transition-all duration-300 ease-out"
                        style={{
                          opacity: 1,
                          zIndex: isHovered ? 20 : 10,
                          animationDelay: `${i * 30}ms`,
                        }}
                        onMouseEnter={() => setHoveredArtifact(artifact.id)}
                        onMouseLeave={() => setHoveredArtifact(null)}
                      >
                        <ArtifactCard
                          artifact={artifact}
                          year={year}
                          isHovered={isHovered}
                          isCenter={true}
                        />
                      </Link>
                    );
                  })}
                  {/* Close button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setExpandedCluster(null);
                    }}
                    className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-gray-900/80 text-[10px] text-white backdrop-blur-sm hover:bg-gray-700 z-30"
                  >
                    ×
                  </button>
                </div>
              ) : (
                // ── Collapsed: stacked thumbnail card ──
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setExpandedCluster(cluster.centerYear);
                  }}
                  className="group relative cursor-pointer"
                  style={{
                    opacity: isCenter ? 0.95 : Math.max(0.5, 1 - dist * 0.03),
                  }}
                >
                  <div
                    className={`w-40 overflow-hidden rounded-lg border backdrop-blur-md transition-all duration-200 ${
                      isCenter
                        ? 'border-gray-300 bg-white/90 shadow-md'
                        : 'border-gray-200/50 bg-white/70'
                    } group-hover:border-amber-400 group-hover:shadow-lg`}
                  >
                    {/* Stacked thumbnails — vertical strips */}
                    <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
                      {(() => {
                        const visible = cluster.artifacts.slice(0, 4);
                        const stripCount = visible.length;
                        const stripWidth = 100 / stripCount;
                        return visible.map(({ artifact: a }, i) => (
                          <div
                            key={a.id}
                            className="absolute inset-y-0 overflow-hidden"
                            style={{
                              left: `${i * stripWidth}%`,
                              width: `${stripWidth}%`,
                              borderRight:
                                i < stripCount - 1 ? '1.5px solid rgba(255,255,255,0.7)' : 'none',
                            }}
                          >
                            {a.thumbnail ? (
                              <Image
                                src={a.thumbnail}
                                alt=""
                                fill
                                sizes="40px"
                                className="object-cover"
                                loading="lazy"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center bg-gray-200 text-base">
                                {getCatIcon(a.metadata?.category)}
                              </div>
                            )}
                          </div>
                        ));
                      })()}
                      {/* Subtle dark overlay for legibility */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent z-10" />
                    </div>

                    {/* Info — same structure as ArtifactCard for height parity */}
                    <div className="px-2 py-1.5">
                      <p className="truncate text-sm font-medium text-gray-900">
                        {stackCount} Artifacts
                      </p>
                      <p className="mt-0.5 truncate text-[10px] font-medium text-gray-500">
                        Click to expand
                      </p>
                      <p className="mt-0.5 text-[10px] font-medium text-amber-600">
                        {cluster.minYear === cluster.maxYear
                          ? cluster.minYear
                          : `${cluster.minYear} – ${cluster.maxYear}`}
                      </p>
                    </div>
                  </div>

                  {/* Count badge */}
                  <div className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-white shadow-md ring-2 ring-white/80 z-10 group-hover:bg-amber-400 transition-colors">
                    {stackCount}
                  </div>
                </button>
              )}

              {/* Connector line (only when collapsed) */}
              {!isExpanded && (
                <div
                  className={`mx-auto h-3 w-px transition-colors duration-300 ${
                    isCenter ? 'bg-amber-400' : 'bg-gray-300/60'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* ── Dial bar (clickable) ── */}
      <div
        className="pointer-events-auto relative h-8 bg-gray-900/80 backdrop-blur-md border-t border-gray-700/50 overflow-hidden cursor-pointer"
        onClick={handleDialClick}
      >
        <div
          className="absolute top-0 h-full transition-transform duration-[400ms] ease-out pointer-events-none"
          style={{
            width: totalYears * PX_PER_YEAR,
            transform: `translateX(${dialOffset}px)`,
          }}
        >
          {/* Cluster range bars — amber highlight behind ticks */}
          {clusterRanges.map((range) => {
            const rx = (range.min - minYear) * PX_PER_YEAR;
            const rw = (range.max - range.min + 1) * PX_PER_YEAR;
            return (
              <div
                key={`range-${range.min}`}
                className="absolute bottom-0 h-3 rounded-sm bg-amber-400/15"
                style={{ left: rx, width: Math.max(rw, 4) }}
              />
            );
          })}

          {/* Tick marks */}
          {Array.from({ length: Math.floor(tickEnd - tickStart) + 1 }, (_, i) => {
            const idx = Math.floor(tickStart) + i;
            const year = minYear + idx;
            const x = idx * PX_PER_YEAR;
            const isMajor = year % 50 === 0;
            const isHalf = year % 25 === 0;
            const isMid = year % 10 === 0;
            const hasArtifact = artifactsByYear.has(year);

            return (
              <div
                key={year}
                className="absolute bottom-0 -translate-x-1/2"
                style={{ left: x }}
              >
                <div
                  className={`mx-auto ${
                    hasArtifact
                      ? 'w-[1.5px] bg-amber-400/90'
                      : isMajor
                        ? 'w-px bg-gray-400/50'
                        : isHalf
                          ? 'w-px bg-gray-400/35'
                          : isMid
                            ? 'w-px bg-gray-500/25'
                            : 'w-px bg-gray-600/15'
                  }`}
                  style={{
                    height: hasArtifact ? 20 : isMajor ? 16 : isHalf ? 13 : isMid ? 10 : 5,
                  }}
                />
                {hasArtifact && (
                  <div className="absolute bottom-[20px] left-1/2 -translate-x-1/2 h-1 w-1 rounded-full bg-amber-400 shadow-[0_0_4px_rgba(251,191,36,0.5)]" />
                )}
                {(isMajor || isHalf) && (
                  <p
                    className={`absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap font-mono tracking-wider ${
                      isMajor
                        ? 'text-[9px] font-medium text-gray-400'
                        : 'text-[8px] text-gray-600'
                    }`}
                  >
                    {year}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Center indicator + current year badge */}
        <div
          className="absolute top-0 bottom-0 z-20 -translate-x-1/2 pointer-events-none"
          style={{ left: centerX }}
        >
          <div className="h-full w-px bg-amber-400/80 shadow-[0_0_4px_rgba(251,191,36,0.3)]" />
          {/* Current year badge above the dial */}
          <div className="absolute -top-5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded bg-amber-400 px-1.5 py-0.5 font-mono text-[10px] font-bold text-gray-900 shadow-md">
            {currentYear}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared card component ──

function ArtifactCard({
  artifact,
  year,
  isHovered,
  isCenter,
}: {
  artifact: AgeFlowArtifact;
  year: number;
  isHovered: boolean;
  isCenter: boolean;
}) {
  return (
    <div
      className={`w-40 overflow-hidden rounded-lg border backdrop-blur-md transition-all duration-200 ${
        isHovered
          ? 'border-amber-400 bg-white/95 shadow-lg shadow-amber-100/50'
          : isCenter
            ? 'border-gray-300 bg-white/90 shadow-md'
            : 'border-gray-200/50 bg-white/70'
      }`}
    >
      {artifact.thumbnail ? (
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-gray-100">
          <Image
            src={artifact.thumbnail}
            alt={artifact.title}
            fill
            sizes="160px"
            className="object-cover"
            loading="lazy"
          />
        </div>
      ) : (
        <div className="flex aspect-[4/3] w-full items-center justify-center bg-gray-100 text-2xl">
          {getCatIcon(artifact.metadata?.category)}
        </div>
      )}
      <div className="px-2 py-1.5">
        <p className="truncate text-sm font-medium text-gray-900">
          {artifact.title}
        </p>
        {artifact.metadata?.designation && (
          <p className="mt-0.5 truncate text-[10px] font-medium text-gray-500">
            {artifact.metadata.designation}
          </p>
        )}
        <p className="mt-0.5 text-[10px] font-medium text-amber-600">{year}</p>
      </div>
    </div>
  );
}
