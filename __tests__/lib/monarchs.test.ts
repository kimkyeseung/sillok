import { describe, it, expect } from 'vitest';
import {
  DYNASTIES,
  buildRoster,
  dynastiesOf,
  findDynasty,
  formatEraYear,
  formatReigns,
  linkedCount,
  ordinal,
  reigningAt,
  rulerRoles,
  rulerTitle,
} from '@/lib/monarchs';

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

describe('rulerRoles', () => {
  it('gives the place in the succession', () => {
    expect(rulerRoles('sejong-daewang').map((r) => r.label)).toEqual(['4th King of Joseon']);
  });

  it('lists every dynasty a ruler belongs to', () => {
    expect(rulerRoles('gojong-yi-myeong-bok').map((r) => r.label)).toEqual([
      '26th King of Joseon',
      '1st Emperor of the Korean Empire',
    ]);
  });

  it('is empty for non-rulers', () => {
    expect(rulerRoles('yi-sun-sin')).toEqual([]);
  });

  it('singularizes every dynasty title', () => {
    expect(DYNASTIES.map(rulerTitle)).toEqual([
      'King of Goguryeo',
      'King of Baekje',
      'Ruler of Silla',
      'King of Balhae',
      'King of Goryeo',
      'King of Joseon',
      'Emperor of the Korean Empire',
    ]);
  });
});

describe('dynasty metadata', () => {
  it('has a valid span and intro', () => {
    for (const d of DYNASTIES) {
      expect(d.start).toBeLessThan(d.end);
      expect(d.intro.length).toBeGreaterThan(50);
      expect(d.ko).toMatch(/^[가-힣]+$/);
    }
  });

  it('formats BCE years', () => {
    expect(formatEraYear(-57)).toBe('57 BCE');
    expect(formatEraYear(935)).toBe('935');
    expect(formatReigns([{ start: -57, end: 4 }])).toBe('57 BCE–4');
    expect(formatReigns([{ start: 1418, end: 1450 }, { start: 1460, end: 1460 }])).toBe('1418–1450, 1460');
  });
});

describe('buildRoster', () => {
  const joseon = findDynasty('joseon')!;
  const empire = findDynasty('korean-empire')!;
  const gojong = {
    id: 'g',
    slug: 'gojong-yi-myeong-bok',
    name_en: 'Gojong',
    name_hanja: null,
    thumbnail: null,
    summary: null,
    birth_year: 1852,
    death_year: 1919,
  };
  const reigns = [
    { person_id: 'g', reign_start: 1897, reign_end: 1907 },
    { person_id: 'g', reign_start: 1863, reign_end: 1897 },
  ];

  it('keeps the full succession, with pages where published', () => {
    const roster = buildRoster(joseon, [gojong], reigns);
    expect(roster).toHaveLength(27);
    expect(roster[0]).toMatchObject({ order: 1, person: null, reigns: [] });
    expect(roster[25].person?.slug).toBe('gojong-yi-myeong-bok');
  });

  it("assigns reigns to the dynasty whose years they start in", () => {
    expect(buildRoster(joseon, [gojong], reigns)[25].reigns).toEqual([{ start: 1863, end: 1897 }]);
    expect(buildRoster(empire, [gojong], reigns)[0].reigns).toEqual([{ start: 1897, end: 1907 }]);
  });

  it('counts published rulers', () => {
    expect(linkedCount(joseon, new Set(['sejong-daewang', 'gojong-yi-myeong-bok', 'nobody']))).toBe(2);
  });
});
