import { describe, it, expect } from 'vitest';
import {
  type AgeFlowPerson,
  type AgeFlowInitialData,
  JOSEON_START,
  JOSEON_END,
} from '@/components/age-flow/useAgeFlow';
import {
  transformPerson,
  isInAgeFlowRange,
  parseInitialYear,
  buildAgeFlowData,
} from '@/lib/age-flow';
import type { AgeFlowEvent, AgeFlowArtifact } from '@/components/age-flow/useAgeFlow';

const filterJoseonRange = (persons: AgeFlowPerson[]) => persons.filter(isInAgeFlowRange);

// ─── Tests ───

describe('transformPerson', () => {
  const basePerson: Record<string, unknown> = {
    id: 'uuid-1',
    slug: 'sejong-daewang',
    name_en: 'Sejong the Great',
    name_ko: '세종대왕',
    birth_year: 1397,
    death_year: 1450,
    is_alive: false,
    thumbnail: 'https://example.com/img.jpg',
    view_count: 100,
    follow_count: 50,
    person_tags: [
      { tag_id: 't1', tags: { id: 't1', name_en: 'King', type: 'FIELD' } },
      { tag_id: 't2', tags: { id: 't2', name_en: 'Joseon', type: 'ERA' } },
    ],
  };

  it('should transform a valid person', () => {
    const result = transformPerson(basePerson);
    expect(result).not.toBeNull();
    expect(result!.id).toBe('uuid-1');
    expect(result!.slug).toBe('sejong-daewang');
    expect(result!.name_en).toBe('Sejong the Great');
    expect(result!.birth_year).toBe(1397);
    expect(result!.death_year).toBe(1450);
    expect(result!.tags).toHaveLength(2);
    expect(result!.tags[0].name_en).toBe('Royalty'); // tagLabel('King')
  });

  it('should return null if birth_year is null', () => {
    const result = transformPerson({ ...basePerson, birth_year: null });
    expect(result).toBeNull();
  });

  it('should return null if death_year is null and not alive', () => {
    const result = transformPerson({
      ...basePerson,
      death_year: null,
      is_alive: false,
    });
    expect(result).toBeNull();
  });

  it('should accept null death_year if is_alive is true', () => {
    const result = transformPerson({
      ...basePerson,
      death_year: null,
      is_alive: true,
    });
    expect(result).not.toBeNull();
    expect(result!.death_year).toBeNull();
    expect(result!.is_alive).toBe(true);
  });

  it('should handle null person_tags', () => {
    const result = transformPerson({ ...basePerson, person_tags: null });
    expect(result).not.toBeNull();
    expect(result!.tags).toEqual([]);
  });

  it('should filter out person_tags with null tags', () => {
    const result = transformPerson({
      ...basePerson,
      person_tags: [
        { tag_id: 't1', tags: { id: 't1', name_en: 'King', type: 'FIELD' } },
        { tag_id: 't2', tags: null },
      ],
    });
    expect(result).not.toBeNull();
    expect(result!.tags).toHaveLength(1);
    expect(result!.tags[0].name_en).toBe('Royalty'); // tagLabel('King')
  });

  it('should default view_count and follow_count to 0', () => {
    const result = transformPerson({
      ...basePerson,
      view_count: undefined,
      follow_count: undefined,
    });
    expect(result).not.toBeNull();
    expect(result!.view_count).toBe(0);
    // follow_count comes from raw cast, undefined ?? 0 = 0
    expect(result!.follow_count).toBe(0);
  });
});

describe('filterJoseonRange', () => {
  function makePerson(overrides: Partial<AgeFlowPerson>): AgeFlowPerson {
    return {
      id: 'test',
      slug: 'test',
      name_en: 'Test',
      name_ko: '테스트',
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

  it('should include person within Joseon range', () => {
    const persons = [makePerson({ birth_year: 1400, death_year: 1450 })];
    expect(filterJoseonRange(persons)).toHaveLength(1);
  });

  it('should exclude person born after JOSEON_END', () => {
    const persons = [makePerson({ birth_year: JOSEON_END + 10, death_year: JOSEON_END + 50 })];
    expect(filterJoseonRange(persons)).toHaveLength(0);
  });

  it('should exclude person who died before JOSEON_START', () => {
    const persons = [makePerson({ birth_year: 1000, death_year: JOSEON_START - 1 })];
    expect(filterJoseonRange(persons)).toHaveLength(0);
  });

  it('should include person overlapping start boundary', () => {
    const persons = [makePerson({ birth_year: JOSEON_START - 50, death_year: JOSEON_START + 10 })];
    expect(filterJoseonRange(persons)).toHaveLength(1);
  });

  it('should include person overlapping end boundary', () => {
    const persons = [makePerson({ birth_year: JOSEON_END - 10, death_year: JOSEON_END + 50 })];
    expect(filterJoseonRange(persons)).toHaveLength(1);
  });

  it('should use JOSEON_END as death_year for alive persons born within range', () => {
    // An alive person born before JOSEON_END — deathYear treated as JOSEON_END
    const persons = [makePerson({ birth_year: JOSEON_END - 10, death_year: null, is_alive: true })];
    expect(filterJoseonRange(persons)).toHaveLength(1);
  });

  it('should exclude alive persons born after JOSEON_END', () => {
    // Born in 1990 — even though alive, birth_year > JOSEON_END so excluded
    const persons = [makePerson({ birth_year: 1990, death_year: null, is_alive: true })];
    expect(filterJoseonRange(persons)).toHaveLength(0);
  });

  it('should use birth_year as death_year fallback for dead persons without death_year', () => {
    // This case shouldn't happen after transformPerson filtering, but test the logic
    const persons = [makePerson({ birth_year: 1500, death_year: null, is_alive: false })];
    // death_year fallback = birth_year = 1500, which is within range
    expect(filterJoseonRange(persons)).toHaveLength(1);
  });
});

describe('AgeFlowInitialData type', () => {
  it('should be a valid shape for useAgeFlow', () => {
    const data: AgeFlowInitialData = {
      persons: [],
      events: [],
      artifacts: [],
    };
    expect(data.persons).toEqual([]);
    expect(data.events).toEqual([]);
    expect(data.artifacts).toEqual([]);
  });

  it('should accept populated data', () => {
    const person: AgeFlowPerson = {
      id: 'p1',
      slug: 'test',
      name_en: 'Test',
      name_ko: '테스트',
      birth_year: 1400,
      death_year: 1460,
      is_alive: false,
      thumbnail: null,
      view_count: 0,
      follow_count: 0,
      tags: [{ id: 't1', name_en: 'King', type: 'FIELD' }],
    };

    const data: AgeFlowInitialData = {
      persons: [person],
      events: [],
      artifacts: [],
    };

    expect(data.persons).toHaveLength(1);
    expect(data.persons[0].slug).toBe('test');
  });
});

describe('parseInitialYear', () => {
  it('defaults to JOSEON_START when missing or invalid', () => {
    expect(parseInitialYear(undefined)).toBe(JOSEON_START);
    expect(parseInitialYear(null)).toBe(JOSEON_START);
    expect(parseInitialYear('abc')).toBe(JOSEON_START);
  });

  it('parses a valid year', () => {
    expect(parseInitialYear('1592')).toBe(1592);
  });

  it('uses the first value of a repeated param', () => {
    expect(parseInitialYear(['1450', '1600'])).toBe(1450);
  });

  it('clamps to the age-flow range', () => {
    expect(parseInitialYear('1000')).toBe(JOSEON_START);
    expect(parseInitialYear('2000')).toBe(JOSEON_END);
  });
});

describe('buildAgeFlowData', () => {
  const event = (id: string, start_year?: unknown) =>
    ({ id, slug: id, title: id, metadata: { start_year } }) as unknown as AgeFlowEvent;
  const artifact = (id: string, created_year?: number) =>
    ({ id, slug: id, title: id, thumbnail: null, metadata: created_year ? { created_year } : null }) as AgeFlowArtifact;

  it('keeps only events with a numeric start_year in range', () => {
    const { events } = buildAgeFlowData({
      persons: [],
      events: [event('a', 1592), event('b', 1200), event('c', '1592'), event('d')],
      artifacts: [],
    });
    expect(events.map((e) => e.id)).toEqual(['a']);
  });

  it('drops artifacts without created_year', () => {
    const { artifacts } = buildAgeFlowData({
      persons: [],
      events: [],
      artifacts: [artifact('a', 1446), artifact('b')],
    });
    expect(artifacts.map((a) => a.id)).toEqual(['a']);
  });

  it('transforms and range-filters persons', () => {
    const { persons } = buildAgeFlowData({
      persons: [
        { id: 'in', slug: 'in', name_ko: 'a', birth_year: 1500, death_year: 1560, is_alive: false },
        { id: 'out', slug: 'out', name_ko: 'b', birth_year: 1950, death_year: 2000, is_alive: false },
        { id: 'nobirth', slug: 'x', name_ko: 'c', birth_year: null, death_year: 1500, is_alive: false },
      ],
      events: [],
      artifacts: [],
    });
    expect(persons.map((p) => p.id)).toEqual(['in']);
  });
});
