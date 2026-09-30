import { describe, it, expect } from 'vitest';
import { DYNASTIES, dynastiesOf, ordinal, reigningAt } from '@/lib/monarchs';

describe('DYNASTIES', () => {
  it('has the full succession of each dynasty', () => {
    const counts = Object.fromEntries(
      DYNASTIES.map((d) => [d.id, d.monarchs.length])
    );
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
    expect(dynastiesOf('gojong-yi-myeong-bok').map((d) => d.id)).toEqual([
      'joseon',
      'korean-empire',
    ]);
  });
  it('returns nothing for non-rulers', () => {
    expect(dynastiesOf('yi-sun-sin')).toEqual([]);
  });
});

describe('ordinal', () => {
  it.each([
    [1, '1st'],
    [2, '2nd'],
    [3, '3rd'],
    [4, '4th'],
    [10, '10th'],
    [11, '11th'],
    [12, '12th'],
    [13, '13th'],
    [21, '21st'],
    [22, '22nd'],
    [23, '23rd'],
    [56, '56th'],
  ])('%i → %s', (n, s) => expect(ordinal(n)).toBe(s));
});

describe('reigningAt', () => {
  const r = (
    slug: string,
    dynasty: string,
    reign_start: number,
    reign_end: number
  ) => ({
    slug,
    dynasty,
    reign_start,
    reign_end,
    name_en: slug,
    name_ko: slug,
    short_en: slug,
    thumbnail: null,
  });
  const reigns = [
    r('taejong', 'joseon', 1400, 1418),
    r('sejong', 'joseon', 1418, 1450),
    r('gwanggaeto', 'goguryeo', 391, 413),
    r('silla-king', 'silla', 400, 417),
  ];

  it('finds the ruler of a year', () => {
    expect(reigningAt(reigns, 1448).map((x) => x.slug)).toEqual(['sejong']);
  });
  it('picks the successor in a handover year', () => {
    expect(reigningAt(reigns, 1418).map((x) => x.slug)).toEqual(['sejong']);
  });
  it('shows one ruler per dynasty, in dynasty order', () => {
    expect(reigningAt(reigns, 405).map((x) => x.slug)).toEqual([
      'gwanggaeto',
      'silla-king',
    ]);
  });
  it('returns nothing without a known reign', () => {
    expect(reigningAt(reigns, 1100)).toEqual([]);
  });
});
