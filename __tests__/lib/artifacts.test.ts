import { describe, it, expect } from 'vitest';
import {
  ARTIFACT_PERIODS,
  countByPeriod,
  countFacets,
  cursorFilter,
  decodeArtifactCursor,
  encodeArtifactCursor,
  isDescending,
  sortColumn,
  sortValue,
} from '@/lib/artifacts';

const ID = '001a4d32-44ce-4271-8f01-7b5a3ae6df32';

describe('artifact cursor encoding', () => {
  it('round-trips numeric and null sort values', () => {
    expect(
      decodeArtifactCursor(encodeArtifactCursor({ v: -4000, id: ID }))
    ).toEqual({ v: -4000, id: ID });
    expect(
      decodeArtifactCursor(encodeArtifactCursor({ v: null, id: ID }))
    ).toEqual({ v: null, id: ID });
  });

  it('rejects malformed cursors', () => {
    expect(decodeArtifactCursor('not-base64-json')).toBeNull();
    expect(
      decodeArtifactCursor(Buffer.from('{"v":1}').toString('base64url'))
    ).toBeNull();
    // id is interpolated into a PostgREST filter — must be a UUID
    expect(
      decodeArtifactCursor(
        Buffer.from('{"v":1,"id":"x),or(is_deleted.eq.true"}').toString(
          'base64url'
        )
      )
    ).toBeNull();
    expect(
      decodeArtifactCursor(
        Buffer.from(`{"v":"1)","id":"${ID}"}`).toString('base64url')
      )
    ).toBeNull();
  });
});

describe('sort config', () => {
  it('orders featured and oldest ascending, popular and newest descending', () => {
    expect(isDescending('featured')).toBe(false);
    expect(isDescending('oldest')).toBe(false);
    expect(isDescending('popular')).toBe(true);
    expect(isDescending('newest')).toBe(true);
  });

  it('uses numeric jsonb paths for metadata sorts', () => {
    expect(sortColumn('featured')).toBe('metadata->featured_rank');
    expect(sortColumn('oldest')).toBe('metadata->created_year');
    expect(sortColumn('popular')).toBe('view_count');
  });

  it('picks the sort value from the row', () => {
    const row = { view_count: 7, year: 1446, rank: 70 };
    expect(sortValue('popular', row)).toBe(7);
    expect(sortValue('featured', row)).toBe(70);
    expect(sortValue('newest', row)).toBe(1446);
    expect(
      sortValue('popular', { view_count: null, year: null, rank: null })
    ).toBe(0);
  });
});

describe('cursorFilter', () => {
  it('continues ascending sorts and includes the NULLS LAST tail', () => {
    expect(cursorFilter('oldest', { v: 1200, id: ID })).toBe(
      `metadata->created_year.gt.1200,and(metadata->created_year.eq.1200,id.gt.${ID}),metadata->created_year.is.null`
    );
  });

  it('continues descending sorts', () => {
    expect(cursorFilter('newest', { v: 1200, id: ID })).toBe(
      `metadata->created_year.lt.1200,and(metadata->created_year.eq.1200,id.gt.${ID}),metadata->created_year.is.null`
    );
  });

  it('stays inside the null tail once reached', () => {
    expect(cursorFilter('oldest', { v: null, id: ID })).toBe(
      `and(metadata->created_year.is.null,id.gt.${ID})`
    );
  });

  it('has no null tail for view_count (defaults to 0)', () => {
    expect(cursorFilter('popular', { v: 3, id: ID })).toBe(
      `view_count.lt.3,and(view_count.eq.3,id.gt.${ID})`
    );
  });
});

describe('countByPeriod', () => {
  it('counts in chronological order, zero-filled, ignoring unknown values', () => {
    const out = countByPeriod(['Joseon', 'Goryeo', 'Joseon', null, 'Atlantis']);
    expect(out.map((o) => o.period)).toEqual([...ARTIFACT_PERIODS]);
    expect(out.find((o) => o.period === 'Joseon')?.count).toBe(2);
    expect(out.find((o) => o.period === 'Goryeo')?.count).toBe(1);
    expect(out.find((o) => o.period === 'Baekje')?.count).toBe(0);
  });
});

describe('countFacets', () => {
  const rows = [
    { period: 'Joseon', collection: 'National Museum of Korea' },
    { period: 'Joseon', collection: 'National Museum of Korea' },
    { period: 'Goryeo', collection: 'National Museum of Korea' },
    { period: 'Goryeo', collection: 'Horim Museum' },
    { period: 'Silla', collection: null },
  ];
  const period = (f: ReturnType<typeof countFacets>, p: string) =>
    f.periods.find((x) => x.period === p)?.count;

  it('counts both facets over all rows when nothing is selected', () => {
    const f = countFacets(rows, {});
    expect(f.collections).toEqual([
      { collection: 'National Museum of Korea', count: 3 },
      { collection: 'Horim Museum', count: 1 },
    ]);
    expect(period(f, 'Goryeo')).toBe(2);
    expect(period(f, 'Silla')).toBe(1);
  });

  it('narrows periods by the selected collection and collections by the selected period', () => {
    const f = countFacets(rows, {
      period: 'Goryeo',
      collection: 'Horim Museum',
    });
    // Periods ignore their own selection but respect the collection
    expect(period(f, 'Goryeo')).toBe(1);
    expect(period(f, 'Joseon')).toBe(0);
    // Collections ignore their own selection but respect the period
    expect(f.collections).toEqual([
      { collection: 'Horim Museum', count: 1 },
      { collection: 'National Museum of Korea', count: 1 },
    ]);
  });
});
