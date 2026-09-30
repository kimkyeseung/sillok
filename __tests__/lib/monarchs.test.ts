import { describe, it, expect } from 'vitest';
import { DYNASTIES, dynastiesOf, ordinal } from '@/lib/monarchs';

describe('DYNASTIES', () => {
  it('has the full succession of each dynasty', () => {
    const counts = Object.fromEntries(DYNASTIES.map((d) => [d.id, d.monarchs.length]));
    expect(counts).toEqual({
      goguryeo: 28,
      baekje: 31,
      silla: 56,
      balhae: 15,
      goryeo: 34,
      joseon: 27,
      'korean-empire': 2,
    });
  });

  it('uses valid, unique slugs within a dynasty', () => {
    for (const d of DYNASTIES) {
      const slugs = d.monarchs.map((x) => x.slug).filter(Boolean) as string[];
      expect(new Set(slugs).size).toBe(slugs.length);
      slugs.forEach((s) => expect(s).toMatch(/^[a-z0-9]+(?:-[a-z0-9]+)*$/));
    }
  });
});

describe('dynastiesOf', () => {
  it('finds the dynasty a ruler belongs to', () => {
    expect(dynastiesOf('sejong-daewang').map((d) => d.id)).toEqual(['joseon']);
  });
  it('returns both dynasties for Gojong', () => {
    expect(dynastiesOf('gojong-yi-myeong-bok').map((d) => d.id)).toEqual(['joseon', 'korean-empire']);
  });
  it('returns nothing for non-rulers', () => {
    expect(dynastiesOf('yi-sun-sin')).toEqual([]);
  });
});

describe('ordinal', () => {
  it.each([
    [1, '1st'], [2, '2nd'], [3, '3rd'], [4, '4th'], [10, '10th'],
    [11, '11th'], [12, '12th'], [13, '13th'], [21, '21st'], [22, '22nd'], [23, '23rd'], [56, '56th'],
  ])('%i → %s', (n, s) => expect(ordinal(n)).toBe(s));
});
