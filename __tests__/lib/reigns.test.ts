import { describe, it, expect } from 'vitest';
import { ReignSchema } from '@/lib/reigns';

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
