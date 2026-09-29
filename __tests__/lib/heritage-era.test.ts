import { describe, it, expect } from 'vitest';
import { formatEraYears, parseEraYears } from '@/lib/heritage-era';

const p = (era: string) => parseEraYears(era);

describe('parseEraYears', () => {
  it('reads an explicit year and ignores reign-year numbers', () => {
    expect(p('조선 태조 7년(1398)')).toEqual({
      year_start: 1398,
      year_end: 1398,
      year_precision: 'exact',
    });
    expect(p('통일신라 진성여왕4년(890)')).toMatchObject({
      year_start: 890,
      year_precision: 'exact',
    });
    expect(p('1837년(헌종 3, 신위 69세)')).toMatchObject({ year_start: 1837 });
    expect(p('1604, 선조37')).toMatchObject({ year_start: 1604 });
    expect(p('1565')).toMatchObject({ year_start: 1565 });
  });

  it('takes the first year when several are listed', () => {
    expect(p('1462년(세종 18) 판각, 1472년(성종 3) 후쇄')).toMatchObject({
      year_start: 1462,
      year_end: 1462,
    });
    expect(p('조선전기(15세기), 1628년(인조6)')).toMatchObject({
      year_start: 1628,
    });
  });

  it('marks approximate years', () => {
    expect(p('1448년경')).toMatchObject({
      year_start: 1448,
      year_precision: 'approximate',
    });
    expect(p('1455~1494년(세조~성종 연간) 추정')).toEqual({
      year_start: 1455,
      year_end: 1494,
      year_precision: 'range',
    });
  });

  it('reads year ranges', () => {
    expect(p('고려시대(1237∼1248년)')).toEqual({
      year_start: 1237,
      year_end: 1248,
      year_precision: 'range',
    });
  });

  it('reads centuries, ranges and parts', () => {
    expect(p('고려시대 12세기')).toEqual({
      year_start: 1101,
      year_end: 1200,
      year_precision: 'century',
    });
    expect(p('고려시대 초기(10∼11세기)')).toEqual({
      year_start: 901,
      year_end: 1100,
      year_precision: 'century',
    });
    expect(p('15세기 후반')).toEqual({
      year_start: 1451,
      year_end: 1500,
      year_precision: 'century',
    });
    expect(p('백제시대 후기 7세기')).toMatchObject({
      year_start: 601,
      year_end: 700,
    });
  });

  it('falls back to period names, checking Unified Silla before Silla', () => {
    expect(p('통일신라')).toEqual({
      year_start: 676,
      year_end: 935,
      year_precision: 'period',
    });
    expect(p('신라')).toMatchObject({ year_start: -57, year_end: 676 });
    expect(p('고려말')).toMatchObject({
      year_end: 1392,
      year_precision: 'period',
    });
    expect(p('고려후기')).toMatchObject({ year_end: 1392 });
    expect(p('조선전기')).toMatchObject({ year_start: 1392 });
  });

  it('unions multi-period and transitional eras', () => {
    expect(p('고려시대 말기/조선시대 초기')).toMatchObject({
      year_end: 1560,
      year_precision: 'period',
    });
    expect(p('고려시대 말기/조선시대 초기')!.year_start).toBe(1234);
    expect(p('여말선초')).toEqual({
      year_start: 1350,
      year_end: 1420,
      year_precision: 'period',
    });
    expect(p('나말여초')).toMatchObject({ year_start: 880, year_end: 960 });
  });

  it('handles BCE centuries', () => {
    expect(p('청동기시대(기원전 3세기후반경)')).toEqual({
      year_start: -250,
      year_end: -201,
      year_precision: 'century',
    });
    expect(p('청동시대 후기')).toMatchObject({ year_end: -300 });
  });

  it('returns null when nothing is recognizable', () => {
    expect(p('')).toBeNull();
    expect(p('태종5 추정')).toBeNull();
    expect(parseEraYears(null)).toBeNull();
  });
});

describe('formatEraYears', () => {
  it('formats each precision', () => {
    expect(
      formatEraYears({
        year_start: 1398,
        year_end: 1398,
        year_precision: 'exact',
      })
    ).toBe('1398');
    expect(
      formatEraYears({
        year_start: 1448,
        year_end: 1448,
        year_precision: 'approximate',
      })
    ).toBe('c. 1448');
    expect(
      formatEraYears({
        year_start: 1237,
        year_end: 1248,
        year_precision: 'range',
      })
    ).toBe('1237–1248');
    expect(
      formatEraYears({
        year_start: 1101,
        year_end: 1200,
        year_precision: 'century',
      })
    ).toBe('12th century');
    expect(
      formatEraYears({
        year_start: 901,
        year_end: 1100,
        year_precision: 'century',
      })
    ).toBe('10th–11th centuries');
    expect(
      formatEraYears({
        year_start: 1451,
        year_end: 1500,
        year_precision: 'century',
      })
    ).toBe('c. 1451–1500');
    expect(
      formatEraYears({
        year_start: 918,
        year_end: 1076,
        year_precision: 'period',
      })
    ).toBe('c. 918–1076');
    expect(
      formatEraYears({
        year_start: -250,
        year_end: -201,
        year_precision: 'century',
      })
    ).toBe('c. 250 BCE–201 BCE');
    expect(
      formatEraYears({
        year_start: 1301,
        year_end: 1400,
        year_precision: 'century',
      })
    ).toBe('14th century');
    expect(formatEraYears(null)).toBeNull();
  });
});
