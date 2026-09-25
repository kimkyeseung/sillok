// ──────────────────────────────────────────────────────────────
// [SCALABILITY NOTE] age-flow 데이터 페칭 전략
//
// 현재 (~1,000명): 전체 인물 한 번에 fetch — 문제없음
//
// 2,000~3,000명 구간이 되면 아래 방식으로 전환 필요:
//   - 뷰포트 기반 구간 로드: 현재 연도 ±50년 인물만 fetch
//   - 스크롤 방향 감지 후 다음 구간 prefetch
//   - API: GET /api/persons/age-flow?year_from=1550&year_to=1650
// ──────────────────────────────────────────────────────────────

'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  useAgeFlow,
  ERA_BG_COLORS,
  AgeFlowPerson,
  AgeFlowTag,
  AgeFlowInitialData,
} from '@/components/age-flow/useAgeFlow';
import PersonCard from '@/components/age-flow/PersonCard';
import TimelinePanel from '@/components/age-flow/TimelinePanel';
import EraFilter from '@/components/age-flow/EraFilter';
import PersonHoverPanel from '@/components/age-flow/PersonHoverPanel';
import RelationLines from '@/components/age-flow/RelationLines';
import EventMarker from '@/components/age-flow/EventMarker';
import DensityBar from '@/components/age-flow/DensityBar';
import ArtifactTimeline from '@/components/age-flow/ArtifactTimeline';
import PersonSheet from '@/components/age-flow/PersonSheet';
import FigureListSheet, { type FigureListTab } from '@/components/age-flow/FigureListSheet';
import FocusBanner from '@/components/age-flow/FocusBanner';
import { useGridCap } from '@/components/age-flow/useGridCap';
import { sortByImportance } from '@/lib/age-flow';
import { useToast } from '@/components/common/Toast';

/** Touch-only devices (no hover) — tap opens the person sheet instead of hover UI */
function isTouchOnly() {
  return typeof window !== 'undefined' && window.matchMedia('(hover: none)').matches;
}

interface AgeFlowClientProps {
  initialData?: AgeFlowInitialData;
  initialYear?: number;
  initialFocus?: string | null;
}

export default function AgeFlowClient({ initialData, initialYear, initialFocus = null }: AgeFlowClientProps) {
  const {
    currentYear,
    currentEra,
    visiblePersons,
    allPersons,
    events,
    artifacts,
    currentKing,
    currentWars,
    warParticipantSlugs,
    isLoading,
    totalHeight,
    minYear,
    maxYear,
    aliveCount,
    densityMap,
    scrollToYear,
    scrollToEra,
    containerRef,
  } = useAgeFlow(initialData, initialYear);

  const [focusSlug, setFocusSlug] = useState<string | null>(initialFocus);
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null);
  const [figureListTab, setFigureListTab] = useState<FigureListTab | null>(null);
  const [hiddenFieldTags, setHiddenFieldTags] = useState<Set<string>>(new Set());
  const [hoveredPersonId, setHoveredPersonId] = useState<string | null>(null);
  const [hoveredCardRect, setHoveredCardRect] = useState<DOMRect | null>(null);
  const cardRefs = useRef<Map<string, HTMLElement>>(new Map());
  const gridRef = useRef<HTMLDivElement>(null);

  // Extract unique FIELD tags from all persons
  const fieldTags = useMemo(() => {
    const tagMap = new Map<string, AgeFlowTag>();
    allPersons.forEach((p) => {
      p.tags.filter((t) => t.type === 'FIELD').forEach((t) => {
        if (!tagMap.has(t.id)) tagMap.set(t.id, t);
      });
    });
    return Array.from(tagMap.values()).sort((a, b) =>
      a.name_en.localeCompare(b.name_en)
    );
  }, [allPersons]);

  // Filter out persons whose field tags are all hidden
  const filteredPersons = useMemo(() => {
    if (hiddenFieldTags.size === 0) return visiblePersons;
    return visiblePersons.filter((p) => {
      const personFieldTags = p.tags.filter((t) => t.type === 'FIELD');
      if (personFieldTags.length === 0) return true;
      return personFieldTags.some((t) => !hiddenFieldTags.has(t.id));
    });
  }, [visiblePersons, hiddenFieldTags]);

  const focusPerson = useMemo(
    () => (focusSlug ? allPersons.find((p) => p.slug === focusSlug) ?? null : null),
    [allPersons, focusSlug]
  );

  // Most important first — in dense years only the first rows fit on screen
  const sortedPersons = useMemo(
    () =>
      sortByImportance(filteredPersons, {
        focusId: focusPerson?.id,
        kingId: currentKing?.id,
        warSlugs: warParticipantSlugs,
      }),
    [filteredPersons, focusPerson, currentKing, warParticipantSlugs]
  );

  // Cap to what fits in the sticky viewport; the rest go behind a "+N more" tile
  const gridCap = useGridCap(
    gridRef,
    sortedPersons.length > 0,
    `${currentYear}|${focusPerson?.id ?? ''}`
  );
  const isOverflowing = sortedPersons.length > gridCap;
  const shownPersons = useMemo(
    () => (isOverflowing ? sortedPersons.slice(0, Math.max(1, gridCap - 1)) : sortedPersons),
    [sortedPersons, isOverflowing, gridCap]
  );
  const moreCount = sortedPersons.length - shownPersons.length;

  // Track newborn/dying with state for re-renders, but gate the
  // effect on a stable ID key so it doesn't fire every lerp frame.
  // Skip animation entirely when many cards change at once (fast scroll).
  const prevFilteredIdsRef = useRef<Set<string> | null>(null);
  const [newbornIds, setNewbornIds] = useState<Set<string>>(new Set());
  const [dyingIds, setDyingIds] = useState<Set<string>>(new Set());
  const newbornTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  const ANIMATION_THRESHOLD = 6; // skip animation if more cards changed

  // Stable key: only changes when the actual set of visible IDs changes
  const shownIdKey = useMemo(
    () => shownPersons.map((p) => p.id).join(','),
    [shownPersons]
  );

  useEffect(() => {
    const prevIds = prevFilteredIdsRef.current;
    const currentIds = new Set(shownPersons.map((p) => p.id));

    if (prevIds !== null) {
      // Count how many cards entered
      const entered: string[] = [];
      shownPersons.forEach((p) => {
        if (!prevIds.has(p.id)) entered.push(p.id);
      });

      // Only animate when a small batch enters (slow scroll)
      if (entered.length > 0 && entered.length <= ANIMATION_THRESHOLD) {
        const fresh = entered.filter((id) => !newbornTimersRef.current.has(id));
        if (fresh.length > 0) {
          setNewbornIds((prev) => {
            const next = new Set(prev);
            fresh.forEach((id) => next.add(id));
            return next;
          });
          fresh.forEach((id) => {
            const timer = setTimeout(() => {
              setNewbornIds((prev) => {
                const next = new Set(prev);
                next.delete(id);
                return next;
              });
              newbornTimersRef.current.delete(id);
            }, 400);
            newbornTimersRef.current.set(id, timer);
          });
        }
      }
    }

    prevFilteredIdsRef.current = currentIds;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownIdKey]);

  // Cleanup timers on unmount
  useEffect(() => {
    const timers = newbornTimersRef.current;
    return () => { timers.forEach((t) => clearTimeout(t)); };
  }, []);

  // Find hovered person's slug for hover panel
  const hoveredPerson = useMemo(
    () => allPersons.find((p) => p.id === hoveredPersonId) ?? null,
    [allPersons, hoveredPersonId]
  );

  const handleHover = useCallback((personId: string | null) => {
    // Emulated mouseenter on tap would dim cards and pop the hover panel
    if (isTouchOnly()) return;
    setHoveredPersonId(personId);
    if (personId) {
      const el = cardRefs.current.get(personId);
      if (el) {
        setHoveredCardRect(el.getBoundingClientRect());
      }
    } else {
      setHoveredCardRect(null);
    }
  }, []);

  const handleSelect = useCallback((personId: string, e: React.MouseEvent) => {
    if (!isTouchOnly()) return; // desktop: normal link navigation
    e.preventDefault();
    setSelectedPersonId(personId);
  }, []);

  const selectedPerson = useMemo(
    () => allPersons.find((p) => p.id === selectedPersonId) ?? null,
    [allPersons, selectedPersonId]
  );

  const handleFocus = useCallback(
    (slug: string | null) => {
      setFocusSlug(slug);
      const url = new URL(window.location.href);
      if (slug) url.searchParams.set('focus', slug);
      else url.searchParams.delete('focus');
      window.history.replaceState(window.history.state, '', url);

      // Jump to the figure's lifetime if they aren't alive in the current year
      const person = slug ? allPersons.find((p) => p.slug === slug) : null;
      if (person) {
        const alive =
          person.birth_year <= currentYear &&
          (person.is_alive || (person.death_year !== null && person.death_year >= currentYear));
        if (!alive) scrollToYear(person.birth_year);
      }
    },
    [allPersons, currentYear, scrollToYear]
  );

  const clearFocus = useCallback(() => handleFocus(null), [handleFocus]);
  const closePersonSheet = useCallback(() => setSelectedPersonId(null), []);
  const closeFigureList = useCallback(() => setFigureListTab(null), []);
  const openFigureSearch = useCallback(() => setFigureListTab('all'), []);

  const { toast } = useToast();
  const handleShare = useCallback(async () => {
    const url = window.location.href; // carries ?year= (and ?focus=) → year share card
    if (navigator.share) {
      try {
        await navigator.share({ title: `Korea in ${currentYear} — Age Flow`, url });
      } catch {
        // cancelled
      }
      return;
    }
    try {
      await navigator.clipboard.writeText(url);
      toast('Link copied');
    } catch {
      toast('Could not copy the link', 'error');
    }
  }, [currentYear, toast]);

  const handleFieldTagToggle = useCallback((tagId: string) => {
    setHiddenFieldTags((prev) => {
      const next = new Set(prev);
      if (next.has(tagId)) {
        next.delete(tagId);
      } else {
        next.add(tagId);
      }
      return next;
    });
  }, []);

  const setCardRef = useCallback(
    (personId: string) => (el: HTMLElement | null) => {
      if (el) {
        cardRefs.current.set(personId, el);
      } else {
        cardRefs.current.delete(personId);
      }
    },
    []
  );

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
          <p className="mt-3 text-sm text-gray-500">Loading historical figures...</p>
        </div>
      </div>
    );
  }

  if (allPersons.length === 0) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-medium text-gray-600">No figures available</p>
          <p className="mt-1 text-sm text-gray-400">
            Historical figures with birth year data will appear here.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="-mx-4 -mt-4">
      {/* Era filter */}
      <EraFilter
        currentEra={currentEra}
        onEraSelect={scrollToEra}
        onOpenFigures={openFigureSearch}
        onShare={handleShare}
      />

      {/* Scroll container — total height for all years */}
      <div
        ref={containerRef as React.RefObject<HTMLDivElement>}
        style={{ height: totalHeight }}
        className="relative"
      >
        {/* Sticky viewport — cards stay fixed while scrolling */}
        {/* top-[96px] = Header(56px) + EraFilter(~40px) */}
        <div
          className={`sticky top-[96px] min-h-[calc(100vh-96px)] transition-colors duration-1000 ${ERA_BG_COLORS[currentEra]}`}
        >
          {/* Card grid */}
          {/* pb-60 (240px) clears ArtifactTimeline (h-44 cards 176px + h-8 dial 32px + 32px buffer). md only — mobile uses TimelinePanel bar */}
          {/* md:pl-52 clears the fixed TimelinePanel (left-6 + w-44) until the centered column is wide enough */}
          <div className="mx-auto max-w-5xl px-4 pb-24 pt-6 md:pb-60 md:pl-52 min-[1480px]:pl-4">
            {focusPerson && (
              <FocusBanner
                person={focusPerson}
                currentYear={currentYear}
                onJump={scrollToYear}
                onClear={clearFocus}
              />
            )}
            {sortedPersons.length === 0 ? (
              <div className="flex min-h-[50vh] items-center justify-center">
                <p className="text-sm text-gray-400">
                  {hiddenFieldTags.size > 0
                    ? 'No matching figures in this year'
                    : `No figures alive in ${currentYear}`}
                </p>
              </div>
            ) : (
              <div
                ref={gridRef}
                className="relative grid grid-cols-1 gap-2 md:grid-cols-4 md:gap-3 lg:grid-cols-5"
              >
                {shownPersons.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    currentYear={currentYear}
                    isNewborn={newbornIds.has(person.id)}
                    isDying={false}
                    isDimmed={
                      hoveredPersonId !== null &&
                      hoveredPersonId !== person.id
                    }
                    isHighlighted={person.id === focusPerson?.id}
                    isKing={currentKing?.id === person.id}
                    isAtWar={warParticipantSlugs.has(person.slug)}
                    onHover={handleHover}
                    onSelect={handleSelect}
                    cardRef={setCardRef(person.id)}
                  />
                ))}

                {moreCount > 0 && (
                  <button
                    onClick={() => setFigureListTab('alive')}
                    className="flex min-h-[5rem] items-center justify-center rounded-lg border border-dashed border-gray-300 bg-white/60 text-sm font-medium text-gray-600 transition-colors hover:border-brand-300 hover:text-brand-600"
                  >
                    +{moreCount} more
                  </button>
                )}

                {/* Relation lines SVG overlay — hovered card, else the focused figure */}
                <RelationLines
                  hoveredPersonId={hoveredPersonId ?? focusPerson?.id ?? null}
                  hoveredPersonSlug={hoveredPerson?.slug ?? focusPerson?.slug ?? null}
                  visiblePersons={shownPersons}
                  cardRefs={cardRefs.current}
                  gridRef={gridRef}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Timeline panel (sidebar HUD) */}
      <TimelinePanel
        currentYear={currentYear}
        currentEra={currentEra}
        aliveCount={aliveCount}
        currentKing={currentKing}
        currentWars={currentWars}
        fieldTags={fieldTags}
        hiddenFieldTags={hiddenFieldTags}
        onFieldTagToggle={handleFieldTagToggle}
        onYearChange={scrollToYear}
      />

      {/* Density bar */}
      <DensityBar
        densityMap={densityMap}
        currentYear={currentYear}
        minYear={minYear}
        totalYears={densityMap.length}
        onYearClick={scrollToYear}
      />

      {/* Hover panel */}
      <PersonHoverPanel
        personSlug={hoveredPerson?.slug ?? null}
        anchorRect={hoveredCardRect}
      />

      {/* Mobile tap → person sheet */}
      <PersonSheet
        person={selectedPerson}
        currentYear={currentYear}
        isFocused={!!selectedPerson && selectedPerson.slug === focusSlug}
        onFocus={handleFocus}
        onClose={closePersonSheet}
      />

      {/* "+N more" / Figures search */}
      <FigureListSheet
        open={figureListTab !== null}
        initialTab={figureListTab ?? 'alive'}
        alivePersons={sortedPersons}
        allPersons={allPersons}
        currentYear={currentYear}
        focusSlug={focusSlug}
        onFocus={handleFocus}
        onClose={closeFigureList}
      />

      {/* Event toasts — fixed bottom-left */}
      <EventMarker events={events} currentYear={currentYear} />

      {/* Artifact timeline — radio tuner at bottom */}
      <ArtifactTimeline
        artifacts={artifacts}
        events={events}
        currentYear={currentYear}
        minYear={minYear}
        maxYear={maxYear}
        onYearClick={scrollToYear}
      />
    </div>
  );
}
