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
// 10,000명 구간이 되면 추가로 필요:
//   - 카드 가상화 (react-virtual 또는 직접 구현)
//   - 밀도 기반 샘플링
// ──────────────────────────────────────────────────────────────

'use client';

import { useState, useEffect, useMemo, useRef, useCallback } from 'react';

// ── Types ──

export interface AgeFlowPerson {
  id: string;
  slug: string;
  name_en: string | null;
  name_ko: string;
  birth_year: number;
  death_year: number | null;
  is_alive: boolean;
  thumbnail: string | null;
  view_count: number;
  follow_count: number;
  tags: AgeFlowTag[];
}

export interface AgeFlowTag {
  id: string;
  name_en: string;
  type: 'ERA' | 'FIELD';
}

export interface AgeFlowPersonDetail {
  id: string;
  slug: string;
  name_en: string | null;
  name_ko: string;
  birth_year: number;
  death_year: number | null;
  is_alive: boolean;
  thumbnail: string | null;
  thread_count: number;
  relation_count: number;
  view_count: number;
  follow_count: number;
  tags: AgeFlowTag[];
}

export interface AgeFlowEvent {
  id: string;
  slug: string;
  title: string;
  metadata: {
    start_year?: number;
    [key: string]: unknown;
  };
}

export type Era = 'Ancient' | 'Three Kingdoms' | 'Goryeo' | 'Joseon' | 'Modern';

export interface UseAgeFlowReturn {
  currentYear: number;
  currentEra: Era;
  visiblePersons: AgeFlowPerson[];
  allPersons: AgeFlowPerson[];
  events: AgeFlowEvent[];
  isLoading: boolean;
  totalHeight: number;
  minYear: number;
  maxYear: number;
  aliveCount: number;
  densityMap: number[];
  scrollToYear: (year: number) => void;
  scrollToEra: (era: Era) => void;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

// ── Constants ──

export const SCROLL_PER_YEAR = 100;
export const MAX_YEAR = 2026;

export const ERA_RANGES: Record<Era, { start: number; label: string }> = {
  'Ancient':        { start: -2333, label: 'Ancient' },
  'Three Kingdoms': { start: 57,    label: 'Three Kingdoms' },
  'Goryeo':         { start: 918,   label: 'Goryeo' },
  'Joseon':         { start: 1392,  label: 'Joseon' },
  'Modern':         { start: 1897,  label: 'Modern' },
};

export const RELATION_STYLES: Record<string, { color: string; dashed: boolean }> = {
  FAMILY:     { color: '#22c55e', dashed: false },
  ALLY:       { color: '#3b82f6', dashed: false },
  RIVAL:      { color: '#ef4444', dashed: false },
  TEACHER:    { color: '#f97316', dashed: false },
  INFLUENCE:  { color: '#94a3b8', dashed: true },
  LORD_VASSAL:{ color: '#a855f7', dashed: false },
  MEMBER_OF:  { color: '#06b6d4', dashed: false },
  FOUNDED:    { color: '#eab308', dashed: false },
  AFFILIATED: { color: '#64748b', dashed: true },
};

export const ERA_BG_COLORS: Record<Era, string> = {
  'Ancient':        'bg-slate-100/50',
  'Three Kingdoms': 'bg-slate-100/50',
  'Goryeo':         'bg-gray-50',
  'Joseon':         'bg-amber-50/30',
  'Modern':         'bg-gray-100/50',
};

// ── Helpers ──

export function getEra(year: number): Era {
  if (year < 57)   return 'Ancient';
  if (year < 918)  return 'Three Kingdoms';
  if (year < 1392) return 'Goryeo';
  if (year < 1897) return 'Joseon';
  return 'Modern';
}

export function getAge(birthYear: number, currentYear: number): number {
  const age = currentYear - birthYear;
  return age <= 0 ? 1 : age;
}

export function formatCount(n: number): string {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

export function getInitials(name: string): string {
  return name.slice(0, 2);
}

// ── Transform API response to AgeFlowPerson ──

function transformPerson(raw: Record<string, unknown>): AgeFlowPerson | null {
  const birthYear = raw.birth_year as number | null;
  const deathYear = raw.death_year as number | null;
  const isAlive = raw.is_alive as boolean;

  // birth_year null이면 제외
  if (birthYear === null || birthYear === undefined) return null;
  // death_year null이고 is_alive도 아니면 제외
  if (deathYear === null && !isAlive) return null;

  const personTags = raw.person_tags as Array<{
    tag_id: string;
    tags: { id: string; name_en: string; type: string } | null;
  }> | null;

  const tags: AgeFlowTag[] = (personTags ?? [])
    .filter((pt) => pt.tags !== null)
    .map((pt) => ({
      id: pt.tags!.id,
      name_en: pt.tags!.name_en,
      type: pt.tags!.type as 'ERA' | 'FIELD',
    }));

  return {
    id: raw.id as string,
    slug: raw.slug as string,
    name_en: raw.name_en as string | null,
    name_ko: raw.name_ko as string,
    birth_year: birthYear,
    death_year: deathYear,
    is_alive: isAlive,
    thumbnail: raw.thumbnail as string | null,
    view_count: (raw.view_count as number) ?? 0,
    follow_count: (raw.follow_count as number) ?? 0,
    tags,
  };
}

// ── Hook ──

export function useAgeFlow(): UseAgeFlowReturn {
  const [allPersons, setAllPersons] = useState<AgeFlowPerson[]>([]);
  const [events, setEvents] = useState<AgeFlowEvent[]>([]);
  const [currentYear, setCurrentYear] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialScrollDone = useRef(false);

  // ── 1. Initial fetch ──
  useEffect(() => {
    async function load() {
      try {
        const [personsRes, eventsRes] = await Promise.all([
          fetch('/api/persons?sort=birth_year&limit=1000&include_tags=true'),
          fetch('/api/nodes?type=EVENT&limit=100'),
        ]);

        const personsJson = await personsRes.json();
        const eventsJson = await eventsRes.json();

        if (personsJson.success) {
          const items = personsJson.data.items ?? personsJson.data ?? [];
          const transformed = (items as Record<string, unknown>[])
            .map(transformPerson)
            .filter((p): p is AgeFlowPerson => p !== null);
          setAllPersons(transformed);
        }

        if (eventsJson.success) {
          const items = eventsJson.data.items ?? eventsJson.data ?? [];
          setEvents(items as AgeFlowEvent[]);
        }
      } catch (err) {
        console.error('Failed to load age-flow data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, []);

  // ── 2. Computed values ──
  const minYear = useMemo(() => {
    if (allPersons.length === 0) return 0;
    return Math.min(...allPersons.map((p) => p.birth_year));
  }, [allPersons]);

  const totalHeight = useMemo(
    () => (MAX_YEAR - minYear) * SCROLL_PER_YEAR,
    [minYear]
  );

  // ── 3. Scroll → year ──
  useEffect(() => {
    if (minYear === 0) return;

    let rafId: number;
    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const year = minYear + Math.floor(scrollY / SCROLL_PER_YEAR);
        setCurrentYear(Math.max(minYear, Math.min(year, MAX_YEAR)));
      });
    };

    // Set initial year
    onScroll();

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(rafId);
    };
  }, [minYear]);

  // ── 4. Visible persons ──
  const visiblePersons = useMemo(
    () =>
      allPersons.filter(
        (p) =>
          p.birth_year <= currentYear &&
          (p.is_alive || (p.death_year !== null && p.death_year > currentYear))
      ),
    [allPersons, currentYear]
  );

  const aliveCount = visiblePersons.length;

  // ── 5. URL ?year= sync ──
  useEffect(() => {
    if (currentYear > 0 && initialScrollDone.current) {
      window.history.replaceState(null, '', `?year=${currentYear}`);
    }
  }, [currentYear]);

  // ── 6. Initial ?year= parameter ──
  useEffect(() => {
    if (minYear === 0 || initialScrollDone.current) return;

    const params = new URLSearchParams(window.location.search);
    const yearParam = params.get('year');
    if (yearParam) {
      const targetYear = parseInt(yearParam, 10);
      if (!isNaN(targetYear)) {
        const targetScroll = (targetYear - minYear) * SCROLL_PER_YEAR;
        window.scrollTo(0, Math.max(0, targetScroll));
      }
    }
    initialScrollDone.current = true;
  }, [minYear]);

  // ── 7. Keyboard navigation ──
  useEffect(() => {
    if (minYear === 0) return;

    const onKeyDown = (e: KeyboardEvent) => {
      // Don't handle when focused on input elements
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const delta = e.shiftKey ? 10 : 1;
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        e.preventDefault();
        window.scrollBy(0, delta * SCROLL_PER_YEAR);
      } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        e.preventDefault();
        window.scrollBy(0, -delta * SCROLL_PER_YEAR);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [minYear]);

  // ── 8. Density map ──
  const densityMap = useMemo(() => {
    if (minYear === 0 || allPersons.length === 0) return [];
    const totalYears = MAX_YEAR - minYear + 1;
    const map = new Array(totalYears).fill(0);
    allPersons.forEach((p) => {
      const start = p.birth_year - minYear;
      const end =
        (p.is_alive ? MAX_YEAR : (p.death_year ?? p.birth_year)) - minYear;
      for (
        let i = Math.max(0, start);
        i <= Math.min(totalYears - 1, end);
        i++
      ) {
        map[i]++;
      }
    });
    return map;
  }, [allPersons, minYear]);

  // ── Actions ──
  const scrollToYear = useCallback(
    (year: number) => {
      if (minYear === 0) return;
      const targetScroll = (year - minYear) * SCROLL_PER_YEAR;
      window.scrollTo({ top: Math.max(0, targetScroll), behavior: 'smooth' });
    },
    [minYear]
  );

  const scrollToEra = useCallback(
    (era: Era) => {
      scrollToYear(ERA_RANGES[era].start);
    },
    [scrollToYear]
  );

  return {
    currentYear,
    currentEra: getEra(currentYear),
    visiblePersons,
    allPersons,
    events,
    isLoading,
    totalHeight,
    minYear,
    maxYear: MAX_YEAR,
    aliveCount,
    densityMap,
    scrollToYear,
    scrollToEra,
    containerRef,
  };
}
