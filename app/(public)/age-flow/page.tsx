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

import { useState, useCallback, useRef, useMemo } from 'react';
import {
  useAgeFlow,
  Era,
  ERA_RANGES,
  ERA_BG_COLORS,
  AgeFlowPerson,
} from '@/components/age-flow/useAgeFlow';
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
    isLoading,
    totalHeight,
    minYear,
    aliveCount,
    densityMap,
    scrollToYear,
    scrollToEra,
    containerRef,
  } = useAgeFlow();

  const [selectedEra, setSelectedEra] = useState<Era | 'All'>('All');
  const [hoveredPersonId, setHoveredPersonId] = useState<string | null>(null);
  const [hoveredCardRect, setHoveredCardRect] = useState<DOMRect | null>(null);
  const cardRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const gridRef = useRef<HTMLDivElement>(null);

  // Track which persons were visible in previous year for transitions
  const prevVisibleIds = useRef<Set<string>>(new Set());

  const newbornIds = useMemo(() => {
    const newIds = new Set<string>();
    visiblePersons.forEach((p) => {
      if (!prevVisibleIds.current.has(p.id)) {
        newIds.add(p.id);
      }
    });
    // Update prev for next render
    const currentIds = new Set(visiblePersons.map((p) => p.id));
    prevVisibleIds.current = currentIds;
    return newIds;
  }, [visiblePersons]);

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
      setSelectedEra(era);
      if (era !== 'All') {
        scrollToEra(era);
      }
    },
    [scrollToEra]
  );

  const setCardRef = useCallback(
    (personId: string) => (el: HTMLDivElement | null) => {
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
            {visiblePersons.length === 0 ? (
              <div className="flex min-h-[50vh] items-center justify-center">
                <p className="text-sm text-gray-400">
                  No figures alive in {currentYear}
                </p>
              </div>
            ) : (
              <div
                ref={gridRef}
                className="relative grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
              >
                {visiblePersons.map((person) => (
                  <PersonCard
                    key={person.id}
                    person={person}
                    currentYear={currentYear}
                    isNewborn={newbornIds.has(person.id)}
                    isDying={
                      person.death_year !== null &&
                      person.death_year === currentYear + 1
                    }
                    isDimmed={
                      hoveredPersonId !== null && hoveredPersonId !== person.id
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
                  visiblePersons={visiblePersons}
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
