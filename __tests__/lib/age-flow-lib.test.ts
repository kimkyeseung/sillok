import { describe, it, expect } from 'vitest';
import {
  getEraRangeInAgeFlow,
  sortByImportance,
  getLifeStatus,
  parseFocusSlug,
  findReign,
  getWarsFromEvents,
  getActiveWars,
  getWarParticipantSlugs,
  buildAgeFlowData,
  parseYearSegment,
  getYearSnapshot,
  describeYear,
  getNotableYears,
  JOSEON_START,
  JOSEON_END,
} from '@/lib/age-flow';
import type { AgeFlowPerson, AgeFlowEvent } from '@/components/age-flow/useAgeFlow';

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

describe('findReign', () => {
  const reigns = [
    { slug: 'jeongjong', reign_start: 1399, reign_end: 1400 },
    { slug: 'taejong', reign_start: 1400, reign_end: 1418 },
  ];

  it('finds the reign covering a year', () => {
    expect(findReign(reigns, 1410)?.slug).toBe('taejong');
  });

  it('prefers the earlier reign in a handover year', () => {
    expect(findReign(reigns, 1400)?.slug).toBe('jeongjong');
  });

  it('returns null outside any reign', () => {
    expect(findReign(reigns, 1390)).toBeNull();
  });
});

describe('buildAgeFlowData reigns', () => {
  it('maps, drops orphan/out-of-range rows and sorts by start', () => {
    const { reigns } = buildAgeFlowData({
      persons: [],
      events: [],
      artifacts: [],
      reigns: [
        { reign_start: 1418, reign_end: 1450, persons: { slug: 'sejong' } },
        { reign_start: 1392, reign_end: 1398, persons: { slug: 'taejo' } },
        { reign_start: 1400, reign_end: 1418, persons: null },
        { reign_start: 1200, reign_end: 1250, persons: { slug: 'too-early' } },
      ],
    });
    expect(reigns).toEqual([
      { slug: 'taejo', reign_start: 1392, reign_end: 1398 },
      { slug: 'sejong', reign_start: 1418, reign_end: 1450 },
    ]);
  });
});

describe('wars from events', () => {
  const ev = (slug: string, metadata: Record<string, unknown>, participants: string[] = []) =>
    ({
      id: slug,
      slug,
      title: slug.toUpperCase(),
      metadata,
      person_node_links: participants.map((s) => ({
        persons: { id: s, slug: s, name_ko: s, name_en: null, thumbnail: null },
      })),
    }) as AgeFlowEvent;

  const events = [
    ev('imjin-war', { start_year: 1592, end_year: 1598, event_type: 'war' }, ['yi-sun-sin', 'seonjo']),
    ev('donghak', { start_year: 1894, end_year: 1895, event_type: 'revolt' }, ['jeon-bong-jun']),
    ev('battle-of-hansan', { start_year: 1592, event_type: 'war' }), // point event — no end_year
    ev('tangpyeong', { start_year: 1725, end_year: 1776, event_type: 'politics' }), // not a war
  ];

  it('keeps only war/revolt events with an end_year', () => {
    const wars = getWarsFromEvents(events);
    expect(wars.map((w) => w.slug)).toEqual(['imjin-war', 'donghak']);
    expect(wars[0]).toMatchObject({ name: 'IMJIN-WAR', startYear: 1592, endYear: 1598 });
  });

  it('finds active wars and their participants', () => {
    const wars = getWarsFromEvents(events);
    const active = getActiveWars(wars, 1595);
    expect(active.map((w) => w.slug)).toEqual(['imjin-war']);
    expect(getWarParticipantSlugs(active)).toEqual(new Set(['yi-sun-sin', 'seonjo']));
    expect(getActiveWars(wars, 1600)).toEqual([]);
  });
});

describe('year pages', () => {
  const king = person({ id: 'k', slug: 'seonjo', name_en: 'Seonjo', birth_year: 1552, death_year: 1608, view_count: 1 });
  const yi = person({ id: 'y', slug: 'yi-sun-sin', name_en: 'Yi Sun-sin', birth_year: 1545, death_year: 1598, view_count: 90 });
  const others = [1, 2, 3, 4].map((i) =>
    person({ id: `o${i}`, slug: `o${i}`, name_en: `Other ${i}`, birth_year: 1560, death_year: 1592 + i, view_count: i })
  );
  const born = person({ id: 'b', slug: 'b', name_en: 'Newborn', birth_year: 1592, death_year: 1650 });
  const data = {
    persons: [king, yi, ...others, born],
    events: [
      {
        id: 'e', slug: 'imjin-war', title: 'Imjin War',
        metadata: { start_year: 1592, end_year: 1598, event_type: 'war' },
        person_node_links: [{ persons: { id: 'y', slug: 'yi-sun-sin', name_ko: '', name_en: null, thumbnail: null } }],
      },
    ] as AgeFlowEvent[],
    artifacts: [],
    reigns: [{ slug: 'seonjo', reign_start: 1567, reign_end: 1608 }],
  };

  it('parseYearSegment accepts only 4-digit years in range', () => {
    expect(parseYearSegment('1592')).toBe(1592);
    expect(parseYearSegment('0592')).toBeNull();
    expect(parseYearSegment('2000')).toBeNull();
    expect(parseYearSegment('1592abc')).toBeNull();
    expect(parseYearSegment('15.9')).toBeNull();
  });

  it('builds a snapshot with king, wars, events, births and importance order', () => {
    const s = getYearSnapshot(data, 1592);
    expect(s.era).toBe('Joseon');
    expect(s.king?.slug).toBe('seonjo');
    expect(s.wars.map((w) => w.slug)).toEqual(['imjin-war']);
    expect(s.events.map((e) => e.slug)).toEqual(['imjin-war']);
    expect(s.born.map((p) => p.id)).toEqual(['b']);
    expect(s.alive.slice(0, 2).map((p) => p.id)).toEqual(['k', 'y']); // king, then war participant
    expect(s.alive).toHaveLength(7);
    expect(s.indexable).toBe(true);
  });

  it('marks thin years as not indexable', () => {
    expect(getYearSnapshot(data, 1340).indexable).toBe(false);
  });

  it('describes the year in one sentence', () => {
    expect(describeYear(getYearSnapshot(data, 1592))).toBe(
      'In 1592 (Joseon era), Seonjo (age 40) reigned, the Imjin War was underway, and 7 historical figures were alive, including Yi Sun-sin (47), Other 4 (32), Other 3 (32).'
    );
  });

  it('lists notable years (event or reign start) with enough figures', () => {
    // 1567 = reign start (6 alive), 1592 = war start (7 alive)
    expect(getNotableYears(data)).toEqual([1567, 1592]);
  });
});
