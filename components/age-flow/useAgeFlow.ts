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
  currentKing: AgeFlowPerson | null;
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

// Age-flow is currently limited to Joseon dynasty
export const JOSEON_START = 1335; // Taejo's birth year
export const JOSEON_END = 1910;   // End of Joseon/Korean Empire

// Joseon kings with reign periods (for YearCounter display)
const JOSEON_KINGS: Array<{ slug: string; reignStart: number; reignEnd: number }> = [
  { slug: 'taejo-yi-seong-gye',    reignStart: 1392, reignEnd: 1398 },
  { slug: 'jeongjong-yi-bang-gwa',  reignStart: 1399, reignEnd: 1400 },
  { slug: 'taejong-yi-bang-won',    reignStart: 1400, reignEnd: 1418 },
  { slug: 'sejong-daewang',         reignStart: 1418, reignEnd: 1450 },
  { slug: 'munjong-yi-hyang',       reignStart: 1450, reignEnd: 1452 },
  { slug: 'danjong-yi-hong-wi',     reignStart: 1452, reignEnd: 1455 },
  { slug: 'sejo-yi-yu',             reignStart: 1455, reignEnd: 1468 },
  { slug: 'yejong-yi-hwang',        reignStart: 1468, reignEnd: 1469 },
  { slug: 'seongjong-yi-hyeol',     reignStart: 1469, reignEnd: 1494 },
  { slug: 'yeonsangun-yi-yung',     reignStart: 1494, reignEnd: 1506 },
  { slug: 'jungjong-yi-yeok',       reignStart: 1506, reignEnd: 1544 },
  { slug: 'injong-yi-ho',           reignStart: 1544, reignEnd: 1545 },
  { slug: 'myeongjong-yi-hwan',     reignStart: 1545, reignEnd: 1567 },
  { slug: 'seonjo-yi-yeon',         reignStart: 1567, reignEnd: 1608 },
  { slug: 'gwanghaegun-yi-hon',     reignStart: 1608, reignEnd: 1623 },
  { slug: 'injo-yi-jong',           reignStart: 1623, reignEnd: 1649 },
  { slug: 'hyojong-yi-ho',          reignStart: 1649, reignEnd: 1659 },
  { slug: 'hyeonjong-yi-yeon',      reignStart: 1659, reignEnd: 1674 },
  { slug: 'sukjong-yi-sun',         reignStart: 1674, reignEnd: 1720 },
  { slug: 'gyeongjong-yi-yun',      reignStart: 1720, reignEnd: 1724 },
  { slug: 'yeongjo-yi-geum',        reignStart: 1724, reignEnd: 1776 },
  { slug: 'jeongjo-yi-san',         reignStart: 1776, reignEnd: 1800 },
  { slug: 'sunjo-yi-gong',          reignStart: 1800, reignEnd: 1834 },
  { slug: 'heonjong-yi-hwan',       reignStart: 1834, reignEnd: 1849 },
  { slug: 'cheoljong-yi-byeon',     reignStart: 1849, reignEnd: 1863 },
  { slug: 'gojong-yi-myeong-bok',   reignStart: 1863, reignEnd: 1907 },
  { slug: 'sunjong-yi-cheok',       reignStart: 1907, reignEnd: 1910 },
];

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
            .filter((p): p is AgeFlowPerson => p !== null)
            // Limit to Joseon era range
            .filter((p) => p.birth_year >= JOSEON_START && p.birth_year <= JOSEON_END);
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

  // ── 2. Computed values (Joseon-limited) ──
  const minYear = JOSEON_START;
  const maxYear = JOSEON_END;

  const totalHeight = useMemo(
    () => (maxYear - minYear) * SCROLL_PER_YEAR,
    [maxYear]
  );

  // ── 3. Scroll → year ──
  useEffect(() => {
    let rafId: number;
    const onScroll = () => {
      rafId = requestAnimationFrame(() => {
        const scrollY = window.scrollY;
        const year = minYear + Math.floor(scrollY / SCROLL_PER_YEAR);
        setCurrentYear(Math.max(minYear, Math.min(year, maxYear)));
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

  // ── 4b. Current king — matched by reign period ──
  const currentKing = useMemo(() => {
    const reign = JOSEON_KINGS.find(
      (k) => currentYear >= k.reignStart && currentYear <= k.reignEnd
    );
    if (!reign) return null;
    return allPersons.find((p) => p.slug === reign.slug) ?? null;
  }, [allPersons, currentYear]);

  // ── 5. URL ?year= sync (throttled to avoid Safari SecurityError) ──
  const lastReplaceRef = useRef(0);
  useEffect(() => {
    if (currentYear > 0 && initialScrollDone.current) {
      const now = Date.now();
      if (now - lastReplaceRef.current < 300) return;
      lastReplaceRef.current = now;
      window.history.replaceState(null, '', `?year=${currentYear}`);
    }
  }, [currentYear]);

  // ── 6. Initial ?year= parameter ──
  useEffect(() => {
    if (initialScrollDone.current) return;

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
    if (allPersons.length === 0) return [];
    const totalYears = maxYear - minYear + 1;
    const map = new Array(totalYears).fill(0);
    allPersons.forEach((p) => {
      const start = p.birth_year - minYear;
      const end =
        (p.is_alive ? maxYear : (p.death_year ?? p.birth_year)) - minYear;
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
    currentKing,
    isLoading,
    totalHeight,
    minYear,
    maxYear,
    aliveCount,
    densityMap,
    scrollToYear,
    scrollToEra,
    containerRef,
  };
}
