import { describe, it, expect } from 'vitest';
import {
  assignGroups,
  featuredRank,
  getArtifactFacts,
  isUnreviewedHeritage,
} from '@/lib/heritage';

const node = (
  id: string,
  thumbnail: string | null,
  metadata: Record<string, unknown>
) => ({ id, thumbnail, metadata });

describe('featuredRank', () => {
  it('puts photos first, then curated, then National Treasure before Treasure, then by number', () => {
    const curatedNt24 = node('a', 'x.jpg', {
      heritage_kind: 'national_treasure',
      designation: 'National Treasure No. 24',
    });
    const khsNt1 = node('b', 'y.jpg', {
      source: 'khs',
      heritage_kind: 'national_treasure',
      designation: 'National Treasure No. 1',
    });
    const khsT1 = node('c', 'z.jpg', {
      source: 'khs',
      heritage_kind: 'treasure',
      designation: 'Treasure No. 1',
    });
    const khsNt1NoPhoto = node('d', null, {
      source: 'khs',
      heritage_kind: 'national_treasure',
      designation: 'National Treasure No. 1',
    });
    const ranks = [curatedNt24, khsNt1, khsT1, khsNt1NoPhoto].map(featuredRank);
    expect([...ranks].sort((x, y) => x - y)).toEqual(ranks);
  });
});

describe('assignGroups', () => {
  it('marks one primary per designation group, preferring photo and curated items', () => {
    const groups = assignGroups([
      node('1', null, {
        source: 'khs',
        designation_group: 'national_treasure-151',
        heritage_kind: 'national_treasure',
      }),
      node('2', 'p.jpg', {
        designation_group: 'national_treasure-151',
        heritage_kind: 'national_treasure',
      }),
      node('3', 'q.jpg', {
        source: 'khs',
        designation_group: 'national_treasure-151',
        heritage_kind: 'national_treasure',
      }),
      node('4', null, { source: 'khs', designation_group: 'treasure-9' }),
      node('5', 'r.jpg', {}),
    ]);
    expect(groups.get('2')).toEqual({
      designation_group_size: 3,
      group_primary: true,
    });
    expect(groups.get('1')?.group_primary).toBe(false);
    expect(groups.get('3')?.group_primary).toBe(false);
    expect(groups.get('4')).toEqual({
      designation_group_size: 1,
      group_primary: true,
    });
    expect(groups.has('5')).toBe(false);
  });
});

describe('getArtifactFacts', () => {
  it('builds English rows and skips missing values', () => {
    expect(
      getArtifactFacts({
        designation: 'National Treasure No. 24',
        created_period: 'Unified Silla',
        year_start: 676,
        year_end: 935,
        year_precision: 'period',
        category: 'sculpture',
        collection: 'Bulguksa Temple',
        title_ko: '경주 석굴암 석굴',
      })
    ).toEqual([
      { label: 'Designation', value: 'National Treasure No. 24' },
      { label: 'Period', value: 'Unified Silla, c. 676–935' },
      { label: 'Type', value: 'Sculpture' },
      { label: 'Collection', value: 'Bulguksa Temple' },
    ]);
  });

  it('falls back to created_year when no range is stored', () => {
    expect(
      getArtifactFacts({ created_period: 'Joseon', created_year: 1434 })
    ).toEqual([{ label: 'Period', value: 'Joseon, c. 1434' }]);
  });
});

describe('isUnreviewedHeritage', () => {
  it('is true only for unreviewed bulk imports', () => {
    expect(isUnreviewedHeritage({ source: 'khs' })).toBe(true);
    expect(isUnreviewedHeritage({ source: 'khs', reviewed: true })).toBe(false);
    expect(isUnreviewedHeritage({})).toBe(false);
  });
});
