'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import useSWR from 'swr';
import type { NodeItem } from '@/app/(public)/nodes/page';
import PersonAvatar from '@/components/common/PersonAvatar';
import { reigningAt, type ReignInfo } from '@/lib/monarchs';
import {
  centuryLabel,
  centuryRange,
  EARLIEST_CENTURY,
  eraOf,
  groupByCentury,
} from '@/lib/artifacts';
import {
  formatEraYears,
  formatYear,
  type YearPrecision,
} from '@/lib/heritage-era';

/** null = undated (sorted last by the API) */
type CenturyKey = number | null;

const SECTION_ID = (c: CenturyKey) => `century-${c ?? 'undated'}`;

/** Where a section's sticky header pins (site header + chip bar on mobile, + filter bar on desktop) */
function stickyTop(section: HTMLElement): number {
  const header = section.querySelector('header');
  return header ? parseFloat(getComputedStyle(header).top) || 0 : 56;
}

async function fetchReigns(url: string): Promise<ReignInfo[]> {
  const res = await fetch(url);
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error('Failed to load reigns');
  return json.data.items;
}

const ERA_STYLES: Record<string, string> = {
  ancient: 'bg-stone-100 text-stone-700',
  'three-kingdoms': 'bg-sky-50 text-sky-700',
  'unified-silla': 'bg-yellow-50 text-yellow-700',
  goryeo: 'bg-teal-50 text-teal-700',
  joseon: 'bg-indigo-50 text-indigo-700',
  'korean-empire': 'bg-rose-50 text-rose-700',
  colonial: 'bg-gray-100 text-gray-600',
  modern: 'bg-gray-100 text-gray-600',
};

/** Era · year · ruler(s) on the throne at the scrolled year — shown in the pinned header */
function NowBar({ year, reigns }: { year: number; reigns: ReignInfo[] }) {
  const era = eraOf(year);
  const rulers = reigningAt(reigns, year);
  return (
    // Mobile: its own row under the title; sm+: right side of the title row
    <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto sm:shrink-0">
      <div className="flex shrink-0 items-center gap-2">
        <span
          className={`whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold ${ERA_STYLES[era.key] ?? ERA_STYLES.modern}`}
        >
          {era.label}
        </span>
        <span className="text-xs font-semibold tabular-nums text-gray-500">
          {formatYear(year)}
        </span>
      </div>
      {rulers.map((r) => (
        <Link
          key={r.slug}
          href={`/persons/${r.slug}`}
          title={`${r.name_en} (r. ${formatYear(r.reign_start)}–${formatYear(r.reign_end)})`}
          className="group/king flex min-w-0 items-center gap-1.5 rounded-full border border-amber-200 bg-white py-0.5 pl-0.5 pr-2.5 shadow-sm transition-colors hover:border-amber-400"
        >
          <span className="relative block h-7 w-7 shrink-0 overflow-hidden rounded-full ring-1 ring-amber-300">
            {r.thumbnail ? (
              <Image
                src={r.thumbnail}
                alt={r.name_en}
                fill
                sizes="28px"
                className="object-cover"
              />
            ) : (
              <PersonAvatar name={r.name_ko} fieldTag="king" size="xs" />
            )}
          </span>
          <span className="min-w-0 max-w-[160px] truncate text-xs font-medium text-gray-700 group-hover/king:text-amber-800">
            {r.short_en}
          </span>
        </Link>
      ))}
    </div>
  );
}

function yearOf(node: NodeItem): number | null {
  const y = node.metadata?.created_year;
  return typeof y === 'number' ? y : null;
}

/** "1398", "c. 1448", "12th century" … falling back to the single estimated year */
function dateLabel(node: NodeItem): string | null {
  const m = node.metadata ?? {};
  const era = formatEraYears({
    year_start: typeof m.year_start === 'number' ? m.year_start : undefined,
    year_end: typeof m.year_end === 'number' ? m.year_end : undefined,
    year_precision:
      (m.year_precision as YearPrecision | undefined) ?? undefined,
  });
  if (era) return era;
  const y = yearOf(node);
  return y == null ? null : `c. ${formatYear(y)}`;
}

/** Short rail label: "15th c.", "2nd c. BCE", "< 1000 BCE" */
function railLabel(c: number): string {
  if (c <= EARLIEST_CENTURY) return '< 1000 BCE';
  return centuryLabel(c).replace(' century', ' c.');
}

function TimelineCard({ node }: { node: NodeItem }) {
  const date = dateLabel(node);
  const designation = node.metadata?.designation as string | undefined;
  const period = node.metadata?.created_period as string | undefined;
  return (
    <Link
      href={`/nodes/${node.slug}`}
      data-year={yearOf(node) ?? undefined}
      className="group flex overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-square w-24 shrink-0 bg-amber-50 sm:w-28">
        {node.thumbnail ? (
          <Image
            src={node.thumbnail}
            alt={node.title}
            fill
            sizes="112px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="absolute inset-0 flex items-center justify-center text-2xl opacity-60">
            🏺
          </span>
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col justify-center gap-1 px-3 py-2">
        {date && (
          <span className="w-fit rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-semibold text-amber-800">
            {date}
          </span>
        )}
        <p className="line-clamp-2 text-sm font-semibold leading-snug text-gray-900 group-hover:text-brand-700">
          {node.title}
        </p>
        <p className="truncate text-[11px] text-gray-500">
          {[period, designation].filter(Boolean).join(' · ')}
        </p>
      </div>
    </Link>
  );
}

export default function ArtifactChronology({
  items,
  centuries,
  fromCentury,
  onJump,
  onActiveChange,
  children,
}: {
  /** Oldest first, as loaded so far */
  items: NodeItem[];
  /** Section counts for the current filters (facets) */
  centuries: { century: number; count: number }[] | undefined;
  /** Century the list starts at (jumped to), or null from the start */
  fromCentury: number | null;
  /** Restart the list at a century that isn't loaded yet (null = from the start) */
  onJump: (century: number | null) => void;
  /** Called when the century in view changes */
  onActiveChange?: (century: number | null) => void;
  /** Load-more sentinel / states, rendered after the last section */
  children?: React.ReactNode;
}) {
  const sections = useMemo(() => groupByCentury(items, yearOf), [items]);
  const counts = useMemo(
    () => new Map((centuries ?? []).map((c) => [c.century, c.count])),
    [centuries]
  );

  const { data: reigns } = useSWR('/api/reigns', fetchReigns, {
    revalidateOnFocus: false,
  });

  // Century in view — the last section that has reached its pin line —
  // and the year of the first card below its pinned header
  const [active, setActive] = useState<CenturyKey>(
    sections[0]?.century ?? null
  );
  const [year, setYear] = useState<number | null>(null);
  const sectionsRef = useRef(sections);
  sectionsRef.current = sections;
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current: CenturyKey = sectionsRef.current[0]?.century ?? null;
      let currentEl: HTMLElement | null = null;
      for (const s of sectionsRef.current) {
        const el = document.getElementById(SECTION_ID(s.century));
        if (!el) continue;
        if (!currentEl || el.getBoundingClientRect().top <= stickyTop(el) + 8) {
          current = s.century;
          currentEl = el;
        }
      }
      setActive(current);

      let y: number | null = null;
      const headerBottom =
        currentEl?.querySelector('header')?.getBoundingClientRect().bottom ?? 0;
      for (const card of currentEl?.querySelectorAll<HTMLElement>(
        '[data-year]'
      ) ?? []) {
        if (card.getBoundingClientRect().bottom > headerBottom + 8) {
          y = Number(card.dataset.year);
          break;
        }
      }
      setYear(y);
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [sections.length]);

  useEffect(() => {
    onActiveChange?.(active);
  }, [active, onActiveChange]);

  // Keep the active chip visible in the mobile rail (horizontal only — no page jump)
  const chipBar = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const bar = chipBar.current;
    const chip = bar?.querySelector<HTMLElement>('[data-active="true"]');
    if (!bar || !chip || !bar.clientWidth) return;
    const offset =
      chip.getBoundingClientRect().left - bar.getBoundingClientRect().left;
    bar.scrollTo({
      left:
        bar.scrollLeft + offset - bar.clientWidth / 2 + chip.clientWidth / 2,
      behavior: 'smooth',
    });
    // Chips arrive with the facets, possibly after `active` is set
  }, [active, centuries]);

  function goTo(century: number) {
    const el = document.getElementById(SECTION_ID(century));
    if (el) {
      window.scrollTo({
        top: el.getBoundingClientRect().top + window.scrollY - stickyTop(el),
        behavior: 'smooth',
      });
      return;
    }
    // Not loaded yet (further down, or before a jump point) → restart the list there
    onJump(century);
  }

  const railItems = centuries ?? [];
  const earlier =
    fromCentury != null
      ? railItems.filter((c) => c.century < fromCentury).at(-1)
      : undefined;

  return (
    <div className="lg:grid lg:grid-cols-[150px_1fr] lg:gap-8">
      {/* Century rail — desktop: sticky column */}
      <nav aria-label="Centuries" className="hidden lg:block">
        <ol className="sticky top-[124px] max-h-[calc(100vh-8.5rem)] space-y-0.5 overflow-y-auto border-l border-gray-200 pb-4">
          {railItems.map(({ century, count }) => {
            const isActive = century === active;
            return (
              <li key={century}>
                <button
                  onClick={() => goTo(century)}
                  aria-current={isActive ? 'true' : undefined}
                  className={`-ml-px flex w-full items-center justify-between gap-2 border-l-2 py-1 pl-3 pr-1 text-left text-xs transition-colors ${
                    isActive
                      ? 'border-amber-500 font-semibold text-amber-800'
                      : 'border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-900'
                  }`}
                >
                  <span className="truncate">{railLabel(century)}</span>
                  <span className="shrink-0 text-[10px] tabular-nums text-gray-400">
                    {count}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      <div className="min-w-0">
        {/* Century rail — mobile: sticky chip bar under the site header */}
        <div className="sticky top-14 z-20 -mx-4 mb-4 flex items-center gap-1.5 border-b border-gray-100 bg-white/90 px-4 py-2 backdrop-blur lg:hidden">
          <div
            ref={chipBar}
            className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto [scrollbar-width:none]"
          >
            {railItems.map(({ century }) => {
              const isActive = century === active;
              return (
                <button
                  key={century}
                  data-active={isActive}
                  onClick={() => goTo(century)}
                  className={`shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
                    isActive
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-gray-100 text-gray-500'
                  }`}
                >
                  {railLabel(century)}
                </button>
              );
            })}
          </div>
        </div>

        {earlier && (
          <button
            onClick={() => onJump(earlier.century)}
            className="mb-6 w-full rounded-lg border border-dashed border-gray-300 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-amber-400 hover:text-amber-700"
          >
            ↑ Earlier: {centuryLabel(earlier.century)}
          </button>
        )}

        <div className="relative">
          {/* The flow line */}
          <div
            aria-hidden
            className="absolute bottom-0 left-[7px] top-2 w-0.5 bg-gradient-to-b from-amber-300 via-amber-200 to-gray-200"
          />

          {sections.map((section) => {
            const range =
              section.century != null ? centuryRange(section.century) : null;
            const count =
              section.century != null ? counts.get(section.century) : undefined;
            const isActive = section.century === active;
            return (
              <section
                key={SECTION_ID(section.century)}
                id={SECTION_ID(section.century)}
                className="relative pb-10 pl-8"
                aria-label={
                  section.century != null
                    ? centuryLabel(section.century)
                    : 'Undated'
                }
              >
                {/* Pins under the site header (+ mobile chip bar) while its century scrolls by */}
                <header className="sticky top-[97px] z-10 -ml-8 mb-3 flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 bg-gray-50/95 py-2.5 pl-8 backdrop-blur lg:top-[108px]">
                  <span
                    aria-hidden
                    className="absolute left-0 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-[3px] border-white bg-amber-500 shadow ring-1 ring-amber-300"
                  />
                  <div className="flex min-w-0 flex-wrap items-baseline gap-x-3 gap-y-0.5">
                    <h2 className="whitespace-nowrap text-lg font-bold text-gray-900 sm:text-2xl">
                      {section.century != null
                        ? centuryLabel(section.century)
                        : 'Undated'}
                    </h2>
                    {range && (
                      <span className="text-sm text-gray-400">{range}</span>
                    )}
                    {count != null && (
                      <span className="text-xs font-medium text-amber-700">
                        {count.toLocaleString()}{' '}
                        {count === 1 ? 'artifact' : 'artifacts'}
                      </span>
                    )}
                  </div>
                  {isActive && year != null && (
                    <NowBar year={year} reigns={reigns ?? []} />
                  )}
                </header>
                <div className="grid gap-3 sm:grid-cols-2">
                  {section.items.map((node) => (
                    <TimelineCard key={node.id} node={node} />
                  ))}
                </div>
              </section>
            );
          })}
        </div>

        {children}
      </div>
    </div>
  );
}
