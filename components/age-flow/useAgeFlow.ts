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
import {
  JOSEON_START,
  JOSEON_END,
  getEraRangeInAgeFlow,
  getEraForYear,
  isAliveIn,
  findReign,
  getWarsFromEvents,
  getActiveWars,
  getWarParticipantSlugs,
  type AgeFlowEra,
  type AgeFlowReign,
  type War,
} from '@/lib/age-flow';

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

export interface AgeFlowEventPerson {
  id: string;
  slug: string;
  name_ko: string;
  name_en: string | null;
  thumbnail: string | null;
}

export interface AgeFlowEvent {
  id: string;
  slug: string;
  title: string;
  metadata: {
    start_year?: number;
    [key: string]: unknown;
  };
  person_node_links?: Array<{ persons: AgeFlowEventPerson | null }>;
}

export type Era = AgeFlowEra;

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

export interface UseAgeFlowReturn {
  currentYear: number;
  currentEra: Era;
  visiblePersons: AgeFlowPerson[];
  allPersons: AgeFlowPerson[];
  events: AgeFlowEvent[];
  artifacts: AgeFlowArtifact[];
  currentKing: AgeFlowPerson | null;
  currentWars: War[];
  warParticipantSlugs: Set<string>;
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

// Age-flow range lives in lib/age-flow.ts (shared with server loader)
export { JOSEON_START, JOSEON_END };

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

// Wars and reigns come from the DB (EVENT nodes with end_year, reigns table) — see lib/age-flow.ts
export type { War, AgeFlowReign } from '@/lib/age-flow';

export const ERA_BG_COLORS: Record<Era, string> = {
  'Ancient':        'bg-slate-100/50',
  'Three Kingdoms': 'bg-slate-100/50',
  'Goryeo':         'bg-gray-50',
  'Joseon':         'bg-amber-50/30',
  'Modern':         'bg-gray-100/50',
};

// ── Helpers ──

export const getEra: (year: number) => Era = getEraForYear;

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

// ── Hook ──

export interface AgeFlowInitialData {
  persons: AgeFlowPerson[];
  events: AgeFlowEvent[];
  artifacts: AgeFlowArtifact[];
  reigns: AgeFlowReign[];
}

export function useAgeFlow(
  initialData?: AgeFlowInitialData,
  initialYear: number = JOSEON_START
): UseAgeFlowReturn {
  const hasInitial = !!initialData;
  const [allPersons, setAllPersons] = useState<AgeFlowPerson[]>(
    initialData?.persons ?? []
  );
  const [events, setEvents] = useState<AgeFlowEvent[]>(
    initialData?.events ?? []
  );
  const [artifacts, setArtifacts] = useState<AgeFlowArtifact[]>(
    initialData?.artifacts ?? []
  );
  const [reigns, setReigns] = useState<AgeFlowReign[]>(initialData?.reigns ?? []);
  const [currentYear, setCurrentYear] = useState(initialYear);
  const [isLoading, setIsLoading] = useState(!hasInitial);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const initialScrollDone = useRef(false);

  // ── 1. Fetch only when no initial data provided ──
  useEffect(() => {
    if (hasInitial) return;

    async function load() {
      try {
        const res = await fetch('/api/persons/age-flow');
        const json = await res.json();

        if (json.success) {
          // Already transformed + range-filtered on the server (lib/age-flow-data.ts)
          const data = json.data as AgeFlowInitialData;
          setAllPersons(data.persons);
          setEvents(data.events);
          setArtifacts(data.artifacts);
          setReigns(data.reigns ?? []);
        }
      } catch (err) {
        console.error('Failed to load age-flow data:', err);
      } finally {
        setIsLoading(false);
      }
    }
    load();
  }, [hasInitial]);

  // ── 2. Computed values (Joseon-limited) ──
  const minYear = JOSEON_START;
  const maxYear = JOSEON_END;

  const totalHeight = useMemo(
    () => (maxYear - minYear) * SCROLL_PER_YEAR,
    [maxYear]
  );

  // ── 3. Scroll → year (smoothed with lerp) ──
  // Instead of jumping directly to the scroll-derived year, interpolate
  // toward it so trackpad inertia doesn't skip years too abruptly.
  const displayYearRef = useRef(-1); // -1 = not initialised
  const targetYearRef = useRef(0);   // raw from scroll position

  // The rAF loop only runs while the displayed year is catching up to the
  // scroll position; it stops when settled and restarts on the next scroll.
  useEffect(() => {
    let rafId = 0;
    let running = false;

    const LERP_SPEED = 0.04; // 0-1, lower = smoother / slower catch-up
    const MAX_STEP = 1.5;    // cap how many years can change per frame
    const SNAP_THRESHOLD = 0.3; // snap when close enough

    const tick = () => {
      // Update target from current scroll position
      const scrollY = window.scrollY;
      targetYearRef.current = minYear + scrollY / SCROLL_PER_YEAR;

      // On first frame (mount or back-nav), snap immediately — no lerp
      if (displayYearRef.current < 0) {
        displayYearRef.current = targetYearRef.current;
      }

      // Lerp toward target, clamped to MAX_STEP per frame
      const diff = targetYearRef.current - displayYearRef.current;
      if (Math.abs(diff) < SNAP_THRESHOLD) {
        displayYearRef.current = targetYearRef.current;
      } else {
        const step = diff * LERP_SPEED;
        const clamped_step = Math.sign(step) * Math.min(Math.abs(step), MAX_STEP);
        displayYearRef.current += clamped_step;
      }

      const year = Math.floor(displayYearRef.current);
      const clamped = Math.max(minYear, Math.min(year, maxYear));
      setCurrentYear((prev) => (prev !== clamped ? clamped : prev));

      if (displayYearRef.current === targetYearRef.current) {
        running = false; // settled — idle until the next scroll
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    const start = () => {
      if (running) return;
      running = true;
      rafId = requestAnimationFrame(tick);
    };

    start();
    window.addEventListener('scroll', start, { passive: true });
    return () => {
      window.removeEventListener('scroll', start);
      cancelAnimationFrame(rafId);
      running = false;
    };
  }, [minYear]);

  // ── 4. Visible persons ──
  const visiblePersons = useMemo(
    () =>
      allPersons.filter((p) => isAliveIn(p, currentYear)),
    [allPersons, currentYear]
  );

  const aliveCount = visiblePersons.length;

  // ── 4b. Current king — matched by reign period (reigns table) ──
  const currentKing = useMemo(() => {
    const reign = findReign(reigns, currentYear);
    if (!reign) return null;
    return allPersons.find((p) => p.slug === reign.slug) ?? null;
  }, [allPersons, reigns, currentYear]);

  // ── 4c. Current wars (EVENT nodes with end_year) ──
  const wars = useMemo(() => getWarsFromEvents(events), [events]);
  const currentWars = useMemo(() => getActiveWars(wars, currentYear), [wars, currentYear]);
  const warParticipantSlugs = useMemo(
    () => getWarParticipantSlugs(currentWars),
    [currentWars]
  );

  // ── 5. URL ?year= sync (throttled to avoid Safari SecurityError) ──
  // Leading write, then a trailing write so the year you stop on always lands in the URL.
  const lastReplaceRef = useRef(0);
  const trailingTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (currentYear <= 0 || !initialScrollDone.current) return;

    const write = () => {
      lastReplaceRef.current = Date.now();
      // Keep other params (utm 등) and Next.js router state intact
      const url = new URL(window.location.href);
      url.searchParams.set('year', String(currentYear));
      window.history.replaceState(window.history.state, '', url);
    };

    if (trailingTimerRef.current) clearTimeout(trailingTimerRef.current);
    const wait = 300 - (Date.now() - lastReplaceRef.current);
    if (wait <= 0) write();
    else trailingTimerRef.current = setTimeout(write, wait);
  }, [currentYear]);

  useEffect(() => () => {
    if (trailingTimerRef.current) clearTimeout(trailingTimerRef.current);
  }, []);

  // ── 6. Scroll to the initial year (from ?year= or ?focus=, resolved on the server) ──
  useEffect(() => {
    if (initialScrollDone.current || isLoading) return;

    if (initialYear > minYear) {
      // Reset lerp so it snaps to the restored position
      displayYearRef.current = -1;
      window.scrollTo(0, (initialYear - minYear) * SCROLL_PER_YEAR);
    }
    initialScrollDone.current = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [minYear, isLoading]);

  // ── 7. Keyboard navigation ──
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Leave keys alone for form fields, open dialogs/sheets, and shortcuts
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      const target = e.target as HTMLElement | null;
      if (
        target instanceof HTMLInputElement ||
        target instanceof HTMLTextAreaElement ||
        target instanceof HTMLSelectElement ||
        target?.isContentEditable ||
        target?.closest?.('[role="dialog"]')
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
      const range = getEraRangeInAgeFlow(era);
      if (range) scrollToYear(range.start);
    },
    [scrollToYear]
  );

  return {
    currentYear,
    currentEra: getEra(currentYear),
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
  };
}
