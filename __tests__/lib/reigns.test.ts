import { describe, it, expect } from 'vitest';
import { ReignSchema, ReignIdSchema, ReignListSchema, parseReignCursor } from '@/lib/reigns';

describe('ReignSchema', () => {
  it('accepts a valid reign', () => {
    expect(ReignSchema.safeParse({ person_slug: 'sejong-daewang', reign_start: 1418, reign_end: 1450 }).success).toBe(true);
  });

  it('accepts a single-year reign', () => {
    expect(ReignSchema.safeParse({ person_slug: 'injong-yi-ho', reign_start: 1544, reign_end: 1544 }).success).toBe(true);
  });

  it('rejects an end year before the start year', () => {
    expect(ReignSchema.safeParse({ person_slug: 'sejong-daewang', reign_start: 1450, reign_end: 1418 }).success).toBe(false);
  });

  it('rejects malformed slugs and non-integer years', () => {
    expect(ReignSchema.safeParse({ person_slug: 'Sejong Daewang', reign_start: 1418, reign_end: 1450 }).success).toBe(false);
    expect(ReignSchema.safeParse({ person_slug: 'sejong-daewang', reign_start: 1418.5, reign_end: 1450 }).success).toBe(false);
    expect(ReignSchema.safeParse({ person_slug: 'sejong-daewang', reign_start: '1418', reign_end: 1450 }).success).toBe(false);
  });
});

describe('reign list cursor', () => {
  const id = '0b8f1c2e-3a4d-4e5f-8a9b-0c1d2e3f4a5b';

  it('parses "<start>_<uuid>" cursors, including negative years', () => {
    expect(parseReignCursor(`1418_${id}`)).toEqual({ start: 1418, id });
    expect(parseReignCursor(`-57_${id}`)).toEqual({ start: -57, id });
  });

  it('validates cursor and limit (default 100, max 200)', () => {
    expect(ReignListSchema.parse({})).toEqual({ limit: 100 });
    expect(ReignListSchema.safeParse({ cursor: `1418_${id}`, limit: '50' }).success).toBe(true);
    expect(ReignListSchema.safeParse({ cursor: "1418_x),or(id.gt.0" }).success).toBe(false);
    expect(ReignListSchema.safeParse({ limit: '500' }).success).toBe(false);
  });

  it('accepts only uuid ids', () => {
    expect(ReignIdSchema.safeParse(id).success).toBe(true);
    expect(ReignIdSchema.safeParse('not-a-uuid').success).toBe(false);
  });
});
