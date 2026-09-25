import { describe, it, expect } from 'vitest';
import {
  getEraRangeInAgeFlow,
  sortByImportance,
  getLifeStatus,
  parseFocusSlug,
  JOSEON_START,
  JOSEON_END,
} from '@/lib/age-flow';
import type { AgeFlowPerson } from '@/components/age-flow/useAgeFlow';

function person(overrides: Partial<AgeFlowPerson>): AgeFlowPerson {
  return {
    id: 'p',
    slug: 'p',
    name_en: 'P',
    name_ko: '피',
    birth_year: 1500,
    death_year: 1560,
    is_alive: false,
    thumbnail: null,
    view_count: 0,
    follow_count: 0,
    tags: [],
    ...overrides,
  };
}

describe('getEraRangeInAgeFlow', () => {
  it('returns null for eras entirely outside the timeline', () => {
    expect(getEraRangeInAgeFlow('Ancient')).toBeNull();
    expect(getEraRangeInAgeFlow('Three Kingdoms')).toBeNull();
  });

  it('clips Goryeo to the timeline start', () => {
    expect(getEraRangeInAgeFlow('Goryeo')).toEqual({ start: JOSEON_START, end: 1391 });
  });

  it('returns Joseon and the Modern slice up to the timeline end', () => {
    expect(getEraRangeInAgeFlow('Joseon')).toEqual({ start: 1392, end: 1896 });
    expect(getEraRangeInAgeFlow('Modern')).toEqual({ start: 1897, end: JOSEON_END });
  });
});

describe('sortByImportance', () => {
  const a = person({ id: 'a', slug: 'a', view_count: 10, birth_year: 1500 });
  const b = person({ id: 'b', slug: 'b', view_count: 50, birth_year: 1510 });
  const c = person({ id: 'c', slug: 'c', view_count: 50, birth_year: 1490 });
  const king = person({ id: 'k', slug: 'k', view_count: 1 });
  const soldier = person({ id: 's', slug: 's', view_count: 2 });
  const focus = person({ id: 'f', slug: 'f', view_count: 0 });

  it('orders by view count, then birth year', () => {
    expect(sortByImportance([a, b, c], {}).map((p) => p.id)).toEqual(['c', 'b', 'a']);
  });

  it('puts focus, king, then war participants first', () => {
    const sorted = sortByImportance([a, soldier, king, focus, b], {
      focusId: 'f',
      kingId: 'k',
      warSlugs: new Set(['s']),
    });
    expect(sorted.map((p) => p.id)).toEqual(['f', 'k', 's', 'b', 'a']);
  });

  it('does not mutate the input', () => {
    const input = [a, b];
    sortByImportance(input, {});
    expect(input.map((p) => p.id)).toEqual(['a', 'b']);
  });
});

describe('getLifeStatus', () => {
  const p = person({ birth_year: 1545, death_year: 1598 });

  it('is unborn before birth', () => {
    expect(getLifeStatus(p, 1540)).toEqual({ kind: 'unborn', years: 5 });
  });

  it('is alive with age during life (min age 1, death year still alive)', () => {
    expect(getLifeStatus(p, 1545)).toEqual({ kind: 'alive', age: 1 });
    expect(getLifeStatus(p, 1592)).toEqual({ kind: 'alive', age: 47 });
    expect(getLifeStatus(p, 1598)).toEqual({ kind: 'alive', age: 53 });
  });

  it('is dead after death year', () => {
    expect(getLifeStatus(p, 1600)).toEqual({ kind: 'dead', years: 2 });
  });

  it('never dies when is_alive', () => {
    const living = person({ birth_year: 1900, death_year: null, is_alive: true });
    expect(getLifeStatus(living, 1910)).toEqual({ kind: 'alive', age: 10 });
  });
});

describe('parseFocusSlug', () => {
  it('accepts lowercase hyphenated slugs', () => {
    expect(parseFocusSlug('yi-sun-sin')).toBe('yi-sun-sin');
    expect(parseFocusSlug(['sejong-daewang', 'x'])).toBe('sejong-daewang');
  });

  it('rejects missing or malformed values', () => {
    expect(parseFocusSlug(undefined)).toBeNull();
    expect(parseFocusSlug('')).toBeNull();
    expect(parseFocusSlug('Yi Sun Sin')).toBeNull();
    expect(parseFocusSlug('../etc')).toBeNull();
  });
});
