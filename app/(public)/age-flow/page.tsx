// ──────────────────────────────────────────────────────────────
// [SCALABILITY NOTE] age-flow 데이터 페칭 전략
//
// 현재 (~1,000명): 전체 인물 한 번에 fetch — 문제없음
//
// 2,000~3,000명 구간이 되면 아래 방식으로 전환 필요:
//   - 뷰포트 기반 구간 로드: 현재 연도 ±50년 인물만 fetch
//   - 스크롤 방향 감지 후 다음 구간 prefetch
//   - API: GET /api/persons/age-flow?year_from=1550&year_to=1650
//
// 전용 엔드포인트 분리 예정:
//   GET /api/persons/age-flow
//     year_from, year_to, era, limit, sort
// ──────────────────────────────────────────────────────────────

'use client';

import { useState, useCallback, useRef, useMemo, useEffect } from 'react';
import {
  useAgeFlow,
  Era,
  ERA_RANGES,
  ERA_BG_COLORS,
  AgeFlowPerson,
  AgeFlowTag,
} from '@/components/age-flow/useAgeFlow';
import { useToast } from '@/components/common/Toast';
import PersonCard from '@/components/age-flow/PersonCard';
import YearCounter from '@/components/age-flow/YearCounter';
import EraFilter from '@/components/age-flow/EraFilter';
import PersonHoverPanel from '@/components/age-flow/PersonHoverPanel';
import RelationLines from '@/components/age-flow/RelationLines';
import EventMarker from '@/components/age-flow/EventMarker';
import DensityBar from '@/components/age-flow/DensityBar';

export default function AgeFlowPage() {
  const {
    currentYear,
    currentEra,
    visiblePersons,
    allPersons,
    events,
    currentKing,
    isLoading,
    totalHeight,
    minYear,
    aliveCount,
    densityMap,
    scrollToYear,
    scrollToEra,
    containerRef,
  } = useAgeFlow();

  const { toast } = useToast();
  const [selectedEra, setSelectedEra] = useState<Era | 'All'>('All');
  const [selectedFieldTags, setSelectedFieldTags] = useState<Set<string>>(new Set());
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

  // Filter visible persons by selected field tags
  const filteredPersons = useMemo(() => {
    if (selectedFieldTags.size === 0) return visiblePersons;
    return visiblePersons.filter((p) =>
      p.tags.some((t) => t.type === 'FIELD' && selectedFieldTags.has(t.id))
    );
  }, [visiblePersons, selectedFieldTags]);

  // Track newborn/dying with timer-based persistence so animations
  // aren't cancelled by rapid re-renders during fast scrolling.
  const prevFilteredIdsRef = useRef<Set<string> | null>(null); // null = first render
  const prevYearRef = useRef(currentYear);
  const [stickyNewbornIds, setStickyNewbornIds] = useState<Set<string>>(new Set());
  const [stickyDyingIds, setStickyDyingIds] = useState<Set<string>>(new Set());
  const newbornTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const dyingTimersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());

  useEffect(() => {
    const prevIds = prevFilteredIdsRef.current;
    const currentIds = new Set(filteredPersons.map((p) => p.id));
    const prevYear = prevYearRef.current;

    // Skip first render — don't animate all initially visible persons
    if (prevIds !== null) {
      // Newborns: appeared in this render
      const freshNewborns: string[] = [];
      filteredPersons.forEach((p) => {
        if (!prevIds.has(p.id) && !newbornTimersRef.current.has(p.id)) {
          freshNewborns.push(p.id);
        }
      });

      // Dying: still visible but will die within the year-jump range
      const freshDying: string[] = [];
      if (prevYear !== currentYear) {
        const jump = Math.max(1, Math.abs(currentYear - prevYear));
        filteredPersons.forEach((p) => {
          if (
            p.death_year !== null &&
            p.death_year > currentYear &&
            p.death_year <= currentYear + jump &&
            !dyingTimersRef.current.has(p.id)
          ) {
            freshDying.push(p.id);
          }
        });
      }

      // Add newborns with auto-clear after animation duration (400ms)
      if (freshNewborns.length > 0) {
        setStickyNewbornIds((prev) => {
          const next = new Set(prev);
          freshNewborns.forEach((id) => next.add(id));
          return next;
        });
        freshNewborns.forEach((id) => {
          const timer = setTimeout(() => {
            setStickyNewbornIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
            newbornTimersRef.current.delete(id);
          }, 400);
          newbornTimersRef.current.set(id, timer);
        });
      }

      // Add dying with auto-clear after animation duration (300ms)
      if (freshDying.length > 0) {
        setStickyDyingIds((prev) => {
          const next = new Set(prev);
          freshDying.forEach((id) => next.add(id));
          return next;
        });
        freshDying.forEach((id) => {
          const timer = setTimeout(() => {
            setStickyDyingIds((prev) => {
              const next = new Set(prev);
              next.delete(id);
              return next;
            });
            dyingTimersRef.current.delete(id);
          }, 300);
          dyingTimersRef.current.set(id, timer);
        });
      }
    }

    prevFilteredIdsRef.current = currentIds;
    prevYearRef.current = currentYear;
  }, [filteredPersons, currentYear]);

  // Cleanup timers on unmount
  useEffect(() => {
    const newbornTimers = newbornTimersRef.current;
    const dyingTimers = dyingTimersRef.current;
    return () => {
      newbornTimers.forEach((t) => clearTimeout(t));
      dyingTimers.forEach((t) => clearTimeout(t));
    };
  }, []);

  const newbornIds = stickyNewbornIds;
  const dyingIds = stickyDyingIds;

  // Find hovered person's slug for hover panel
  const hoveredPerson = useMemo(
    () => allPersons.find((p) => p.id === hoveredPersonId) ?? null,
    [allPersons, hoveredPersonId]
  );

  const handleHover = useCallback((personId: string | null) => {
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

  const handleEraSelect = useCallback(
    (era: Era | 'All') => {
      if (era !== 'All' && era !== 'Joseon') {
        toast('Only the Joseon dynasty is available for now');
        return;
      }
      setSelectedEra(era);
      if (era !== 'All') {
        scrollToEra(era);
      }
    },
    [scrollToEra, toast]
  );

  const handleFieldTagToggle = useCallback((tagId: string) => {
    setSelectedFieldTags((prev) => {
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
        selectedEra={selectedEra}
        onEraSelect={handleEraSelect}
        fieldTags={fieldTags}
        selectedFieldTags={selectedFieldTags}
        onFieldTagToggle={handleFieldTagToggle}
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
          <div className="mx-auto max-w-5xl px-4 pb-8 pt-6">
            {filteredPersons.length === 0 ? (
              <div className="flex min-h-[50vh] items-center justify-center">
                <p className="text-sm text-gray-400">
                  {selectedFieldTags.size > 0
                    ? 'No matching figures in this year'
                    : `No figures alive in ${currentYear}`}
                </p>
              </div>
            ) : (
              <div
                ref={gridRef}
                className="relative grid grid-cols-1 gap-2 md:grid-cols-4 md:gap-3 lg:grid-cols-5"
              >
                {filteredPersons.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    currentYear={currentYear}
                    isNewborn={newbornIds.has(person.id)}
                    isDying={dyingIds.has(person.id)}
                    isDimmed={
                      hoveredPersonId !== null &&
                      hoveredPersonId !== person.id
                    }
                    isHighlighted={false}
                    onHover={handleHover}
                    cardRef={setCardRef(person.id)}
                  />
                ))}

                {/* Relation lines SVG overlay */}
                <RelationLines
                  hoveredPersonId={hoveredPersonId}
                  hoveredPersonSlug={hoveredPerson?.slug ?? null}
                  visiblePersons={filteredPersons}
                  cardRefs={cardRefs.current}
                  gridRef={gridRef}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Year counter HUD */}
      <YearCounter
        currentYear={currentYear}
        currentEra={currentEra}
        aliveCount={aliveCount}
        currentKing={currentKing}
        onYearChange={scrollToYear}
      />

      {/* Event marker */}
      <EventMarker events={events} currentYear={currentYear} />

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
    </div>
  );
}
