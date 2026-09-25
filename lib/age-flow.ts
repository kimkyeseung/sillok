// age-flow 순수 로직 — 서버(page, API)와 클라이언트(useAgeFlow)가 공유. 테스트 대상.

import { tagLabel } from '@/lib/tags';
import type {
  AgeFlowPerson,
  AgeFlowTag,
  AgeFlowEvent,
  AgeFlowArtifact,
} from '@/components/age-flow/useAgeFlow';

// Age-flow covers late Goryeo → Joseon → Korean Empire
export const JOSEON_START = 1336; // Late Goryeo — Taejo born 1335, visible from age 1
export const JOSEON_END = 1910;   // End of Joseon/Korean Empire

export function transformPerson(raw: Record<string, unknown>): AgeFlowPerson | null {
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
      name_en: tagLabel(pt.tags!.name_en),
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

/** 생애가 age-flow 범위(JOSEON_START~JOSEON_END)와 겹치는지 */
export function isInAgeFlowRange(p: AgeFlowPerson): boolean {
  const deathYear = p.is_alive ? JOSEON_END : (p.death_year ?? p.birth_year);
  return p.birth_year <= JOSEON_END && deathYear >= JOSEON_START;
}

export function isInYearRange(year: unknown): year is number {
  return typeof year === 'number' && year >= JOSEON_START && year <= JOSEON_END;
}

/** ?year= 파라미터 → 범위 내 연도. 없거나 잘못되면 JOSEON_START */
export function parseInitialYear(param: string | string[] | undefined | null): number {
  const raw = Array.isArray(param) ? param[0] : param;
  const year = raw ? parseInt(raw, 10) : NaN;
  if (isNaN(year)) return JOSEON_START;
  return Math.max(JOSEON_START, Math.min(year, JOSEON_END));
}

/** Raw Supabase rows → age-flow 데이터 (범위 밖 인물·사건·유물 제외) */
export function buildAgeFlowData(raw: {
  persons: Record<string, unknown>[];
  events: AgeFlowEvent[];
  artifacts: AgeFlowArtifact[];
}): { persons: AgeFlowPerson[]; events: AgeFlowEvent[]; artifacts: AgeFlowArtifact[] } {
  const persons = raw.persons
    .map(transformPerson)
    .filter((p): p is AgeFlowPerson => p !== null)
    .filter(isInAgeFlowRange);

  const events = raw.events.filter((e) => isInYearRange(e.metadata?.start_year));

  const artifacts = raw.artifacts.filter((a) => a.metadata?.created_year != null);

  return { persons, events, artifacts };
}

// ── Eras ──

export type AgeFlowEra = 'Ancient' | 'Three Kingdoms' | 'Goryeo' | 'Joseon' | 'Modern';

export const ERA_STARTS: Record<AgeFlowEra, number> = {
  'Ancient':        -2333,
  'Three Kingdoms': 57,
  'Goryeo':         918,
  'Joseon':         1392,
  'Modern':         1897,
};

const ERA_ORDER: AgeFlowEra[] = ['Ancient', 'Three Kingdoms', 'Goryeo', 'Joseon', 'Modern'];

/** 해당 시대 중 age-flow가 다루는 구간. 범위 밖이면 null */
export function getEraRangeInAgeFlow(era: AgeFlowEra): { start: number; end: number } | null {
  const i = ERA_ORDER.indexOf(era);
  const eraStart = ERA_STARTS[era];
  const eraEnd = i < ERA_ORDER.length - 1 ? ERA_STARTS[ERA_ORDER[i + 1]] - 1 : Infinity;
  const start = Math.max(eraStart, JOSEON_START);
  const end = Math.min(eraEnd, JOSEON_END);
  return start <= end ? { start, end } : null;
}

// ── Card ordering ──

/**
 * 한 해에 보이는 인물 정렬: 포커스 → 왕 → 전쟁 참여자 → 조회수 → 출생연도.
 * 화면에 다 못 담는 해에는 앞쪽만 보이므로 중요한 인물을 앞으로.
 */
export function sortByImportance(
  persons: AgeFlowPerson[],
  opts: { focusId?: string | null; kingId?: string | null; warSlugs?: Set<string> }
): AgeFlowPerson[] {
  const rank = (p: AgeFlowPerson) =>
    p.id === opts.focusId ? 0 : p.id === opts.kingId ? 1 : opts.warSlugs?.has(p.slug) ? 2 : 3;
  return [...persons].sort(
    (a, b) =>
      rank(a) - rank(b) ||
      b.view_count - a.view_count ||
      a.birth_year - b.birth_year
  );
}

// ── Focus (contemporaries) mode ──

export type LifeStatus =
  | { kind: 'unborn'; years: number }
  | { kind: 'alive'; age: number }
  | { kind: 'dead'; years: number };

/** 포커스 인물이 해당 연도에 태어나기 전/생존/사후인지 */
export function getLifeStatus(p: AgeFlowPerson, year: number): LifeStatus {
  if (year < p.birth_year) return { kind: 'unborn', years: p.birth_year - year };
  if (!p.is_alive && p.death_year !== null && year > p.death_year) {
    return { kind: 'dead', years: year - p.death_year };
  }
  return { kind: 'alive', age: Math.max(1, year - p.birth_year) };
}

/** ?focus= 파라미터 → slug 형식이면 그대로, 아니면 null */
export function parseFocusSlug(param: string | string[] | undefined | null): string | null {
  const raw = Array.isArray(param) ? param[0] : param;
  return raw && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(raw) ? raw : null;
}
