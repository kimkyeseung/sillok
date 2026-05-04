import { describe, it, expect } from 'vitest';
import {
  type AgeFlowPerson,
  type AgeFlowInitialData,
  JOSEON_START,
  JOSEON_END,
} from '@/components/age-flow/useAgeFlow';

// ─── transformPerson logic (extracted for testing) ───
// Mirrors the transformPerson in page.tsx and useAgeFlow.ts

interface RawPerson {
  id: string;
  slug: string;
  name_en: string | null;
  name_ko: string;
  birth_year: number | null;
  death_year: number | null;
  is_alive: boolean;
  thumbnail: string | null;
  view_count: number;
  follow_count: number;
  person_tags: Array<{
    tag_id: string;
    tags: { id: string; name_en: string; type: string } | null;
  }> | null;
}

function transformPerson(raw: Record<string, unknown>): AgeFlowPerson | null {
  const birthYear = raw.birth_year as number | null;
  const deathYear = raw.death_year as number | null;
  const isAlive = raw.is_alive as boolean;

  if (birthYear === null || birthYear === undefined) return null;
  if (deathYear === null && !isAlive) return null;

  const personTags = raw.person_tags as RawPerson['person_tags'];

  const tags = (personTags ?? [])
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

function filterJoseonRange(persons: AgeFlowPerson[]): AgeFlowPerson[] {
  return persons.filter((p) => {
    const deathYear = p.is_alive ? JOSEON_END : (p.death_year ?? p.birth_year);
    return p.birth_year <= JOSEON_END && deathYear >= JOSEON_START;
  });
}

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
    expect(result!.tags[0].name_en).toBe('King');
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
    expect(result!.tags[0].name_en).toBe('King');
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
